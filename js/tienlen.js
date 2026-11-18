/* =========================================================
   TIẾN LÊN MIỀN NAM — online qua Supabase Realtime
   1 file, CSS nhúng trong shadow DOM (không đụng CSS trang).
   Dùng:  TienLen.open({ username:'tienloi', name:'Tiến Lợi' })
          TienLen.close()
   Cần: config.js (window.__SRANK_CONFIG) + chạy tienlen.sql
   ========================================================= */
(function(){
"use strict";
if (window.TienLen) return;

const CFG = window.__SRANK_CONFIG || {};
const TURN = 30000;                       // 30s mỗi lượt
const READY = 45000, OFFLINE = 30000, STALE = 5*60e3;   // chờ sẵn sàng / mất kết nối / dọn phòng
const RK = ['3','4','5','6','7','8','9','10','J','Q','K','A','2'];
const SU = ['♠','♣','♦','♥'];
const BASE = {2:[1,-1], 3:[2,0,-2], 4:[3,1,-1,-3]};
const rk = c => c>>2, isRed = c => (c&3)>=2, lab = c => RK[rk(c)]+SU[c&3];
const esc = s => String(s).replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
const sleep = ms => new Promise(r => setTimeout(r, ms));

/* ---------- Luật ---------- */
function cls(cs){
  cs = [...cs].sort((a,b)=>a-b); const n = cs.length; if(!n) return null;
  const r = cs.map(rk), hi = cs[n-1];
  if (n<=4 && r.every(x=>x===r[0])) return {t:['S','P','T','Q'][n-1], n, hi};
  if (n>=3 && r[n-1]<12 && r.every((x,i)=>!i || x===r[i-1]+1)) return {t:'R', n, hi};
  if (n>=6 && n%2===0 && r[n-1]<12){
    for (let i=0;i<n;i+=2) if (r[i]!==r[i+1] || (i && r[i]!==r[i-1]+1)) return null;
    return {t:'D', n, hi};
  }
  return null;
}
function beats(p, c){
  if (p.t===c.t && p.n===c.n) return c.hi > p.hi;
  if (p.t==='S' && rk(p.hi)===12) return c.t==='Q' || (c.t==='D' && c.n>=6);
  if (p.t==='P' && rk(p.hi)===12) return c.t==='Q' || (c.t==='D' && c.n>=8);
  if (p.t==='Q') return c.t==='D' && c.n>=8;
  if (p.t==='D' && p.n===6) return c.t==='Q';
  return false;
}
function white(h){
  const k = {}; h.forEach(c => k[rk(c)] = (k[rk(c)]||0)+1);
  if ([...Array(12).keys()].every(i=>k[i])) return 'Sảnh rồng';
  if (k[12]===4) return 'Tứ quý 2';
  if (k[0]===4) return 'Tứ quý 3';
  if (Object.keys(k).filter(r=>k[r]>=2).length>=6) return '6 đôi';
  let run = 0;
  for (let i=0;i<12;i++){ run = k[i]>=2 ? run+1 : 0; if (run>=5) return '5 đôi thông'; }
  return null;
}
function shuffle(){
  const d = [...Array(52).keys()], b = new Uint32Array(52); crypto.getRandomValues(b);
  for (let i=51;i>0;i--){ const j=b[i]%(i+1); [d[i],d[j]]=[d[j],d[i]]; }
  return d;
}
function advance(st){                       // chuyển lượt (st.turn = người vừa hành động)
  const n = st.order.length, fin = u => st.finished.includes(u) || (st.gone||[]).includes(u);
  for (let i=1;i<=n;i++){
    const idx = (st.turn+i)%n, u = st.order[idx];
    if (fin(u)) continue;
    if (st.last && u===st.last.u){ st.last=null; st.passed=[]; st.turn=idx; return; }
    if (st.passed.includes(u)) continue;
    st.turn = idx; return;
  }
  const li = st.order.indexOf(st.last.u);   // chủ vòng đã hết bài, mọi người bỏ
  st.last=null; st.passed=[];
  for (let i=1;i<=n;i++){ const idx=(li+i)%n; if(!fin(st.order[idx])){ st.turn=idx; return; } }
}
function endGame(room, st, rank, wh, left){
  const n = rank.length, d = {};
  rank.forEach((u,i)=> d[u] = BASE[n][i]);
  if (wh) rank.forEach(u => d[u] = u===rank[0] ? 3*(n-1) : -3);
  else {
    const b = rank[n-1], w = rank[0];
    if (!st.played[b]){ const x=Math.abs(BASE[n][n-1]); d[b]-=x; d[w]+=x; }          // cóng
    (left||[]).filter(c=>rk(c)===12).forEach(c=>{ const v=isRed(c)?2:1; d[b]-=v; d[w]+=v; }); // thối heo
  }
  rank.forEach(u => d[u] += st.pts[u]||0);   // tiền chặt heo
  st.result = {rank, delta:d, white:wh||null}; st.dl = 0;
  room.status = 'ended'; st.ready = {}; st.rdl = Date.now()+READY;
  room.players.forEach(p => p.score = (p.score||0) + (d[p.u]||0));
}

const active = st => st.order.filter(x => !st.finished.includes(x) && !(st.gone||[]).includes(x));
function settle(room, st, left){            // kết thúc ván nếu chỉ còn <=1 người còn đánh
  const a = active(st); if (a.length>1) return false;
  endGame(room, st, [...st.finished, ...a, ...[...(st.gone||[])].reverse()], null, left);
  return true;
}

/* ---------- Trạng thái ---------- */
let SB, root, ME, R=null, V='lobby', HAND=[], SEL=new Set(), LIST=[], DEAL=-1, autoKey='', tk=0, chan=null, busy=false, presOn=new Set(), lastOn={}, firstSeen={}, presAt=0, joinAt=0, leaving=false, lastRes=0, drops={};
const offline = u => presOn.has(u) ? 0 : Date.now() - (lastOn[u] || firstSeen[u] || joinAt);
const nm = u => (R && R.players.find(p=>p.u===u) || {}).name || u;
const sc = u => (R && R.players.find(p=>p.u===u) || {}).score || 0;

async function ensureSB(){
  if (SB) return;
  if (!(window.supabase && window.supabase.createClient)){
    await new Promise((res,rej)=>{
      const s=document.createElement('script');
      s.src='https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.45.4/dist/umd/supabase.min.js';
      s.onload=res; s.onerror=rej; document.head.appendChild(s);
    });
  }
  SB = window.supabase.createClient(CFG.SUPABASE_URL, CFG.SUPABASE_KEY,
    {auth:{persistSession:false, autoRefreshToken:false, detectSessionInUrl:false}});
}
function toast(m){
  const t = root.shadowRoot.querySelector('#toast'); t.textContent=m; t.className='on';
  clearTimeout(toast.h); toast.h=setTimeout(()=>t.className='',2200);
}

/* ---------- Dữ liệu ---------- */
async function loadList(){
  const since = new Date(Date.now()-STALE).toISOString();
  const {data} = await SB.from('tl_rooms').select('*').gt('updated_at',since).order('updated_at',{ascending:false}).limit(30);
  LIST = (data||[]).filter(r => {
    const mine = r.players.some(p=>p.u===ME.u);
    if (mine) return !(r.status==='playing' && r.state && (r.state.gone||[]).includes(ME.u));
    return r.status!=='playing' && r.players.length<4;
  });
  if (V==='lobby') render();
}
async function loadHand(){
  const {data} = await SB.from('tl_hands').select('cards').eq('room',R.id).eq('username',ME.u).maybeSingle();
  HAND = data ? data.cards : []; render();
}
async function getHand(u){
  if (u===ME.u) return HAND;
  const {data} = await SB.from('tl_hands').select('cards').eq('room',R.id).eq('username',u).maybeSingle();
  return data ? data.cards : [];
}
function apply(r){
  if (!r){ R=null; V='lobby'; unsub(); loadList(); return render(); }
  if (R && r.id===R.id && r.version <= R.version) return;
  if (!r.players.some(p=>p.u===ME.u)){            // mình không còn trong phòng
    if (V==='room' && !leaving) toast('Bạn không còn trong phòng');
    R=null; V='lobby'; unsub(); loadList(); return render();
  }
  r.players.forEach(p=>{ if(!firstSeen[p.u]) firstSeen[p.u]=Date.now(); });
  R = r; V = 'room';
  if (r.state && r.state.deal !== DEAL){ DEAL=r.state.deal; SEL.clear(); loadHand(); }
  render();
}
function unsub(){ if(chan){ SB.removeChannel(chan); chan=null; } }
function sub(id){
  unsub();
  presOn=new Set(); lastOn={}; firstSeen={}; presAt=0; joinAt=Date.now(); drops={};
  chan = SB.channel('tl-'+id, {config:{presence:{key:ME.u}}})
    .on('postgres_changes',{event:'*',schema:'public',table:'tl_rooms',filter:'id=eq.'+id},
      p => apply(p.eventType==='DELETE' ? null : p.new))
    .on('presence',{event:'sync'},()=>{
      const s = Object.keys(chan.presenceState()), n = Date.now();
      presOn.forEach(k=>{ if(!s.includes(k)) lastOn[k]=n; });
      s.forEach(k=>lastOn[k]=n);
      presOn = new Set(s); if(!presAt) presAt=n;
    })
    .subscribe(st => { if (st==='SUBSCRIBED') chan.track({u:ME.u}); });
}
async function enter(room){ DEAL=-1; HAND=[]; SEL.clear(); R=null; apply(room); sub(room.id); }

async function commit(fn){
  for (let i=0;i<4;i++){
    const {data} = await SB.from('tl_rooms').select('*').eq('id',R.id).maybeSingle();
    if (!data) return false;
    const v = data.version;
    if (fn(data)===false) return false;
    const {data:u, error} = await SB.from('tl_rooms')
      .update({players:data.players,state:data.state,status:data.status,version:v+1,updated_at:new Date().toISOString()})
      .eq('id',R.id).eq('version',v).select();
    if (!error && u && u.length){ apply(u[0]); return true; }
    await sleep(120);
  }
  return false;
}

/* ---------- Phòng ---------- */
function cleanup(){
  SB.from('tl_rooms').delete().lt('updated_at', new Date(Date.now()-STALE).toISOString()).then(()=>{});
}
async function create(){
  const id = Array.from(crypto.getRandomValues(new Uint8Array(4)),b=>'ABCDEFGHJKLMNPQRSTUVWXYZ'[b%24]).join('');
  const room = {id, host:ME.u, status:'waiting', players:[{u:ME.u,name:ME.name,score:0}], state:null, version:0};
  const {data,error} = await SB.from('tl_rooms').insert(room).select().single();
  if (error) return toast('Không tạo được phòng');
  enter(data);
}
async function join(id){
  id = (id||'').trim().toUpperCase(); if(!id) return;
  const {data} = await SB.from('tl_rooms').select('*').eq('id',id).maybeSingle();
  if (!data) return toast('Không tìm thấy phòng '+id);
  if (data.status==='playing' && data.state && (data.state.gone||[]).includes(ME.u))
    return toast('Bạn đã thoát ván này, không thể vào lại');
  if (data.players.some(p=>p.u===ME.u)) return enter(data);
  if (data.status==='playing') return toast('Phòng đang chơi');
  if (data.players.length>=4) return toast('Phòng đã đủ 4 người');
  DEAL=-1; HAND=[]; SEL.clear(); R = data;
  const ok = await commit(r => {
    if (r.status==='playing' || r.players.length>=4) return false;
    r.players.push({u:ME.u,name:ME.name,score:0});
  });
  if (!ok){ R=null; return toast('Không vào được phòng'); }
  sub(id);
}
async function removePlayer(u){                 // chỉ khi phòng chờ / đang xem kết quả
  const rid = R.id; let del = false;
  await commit(room => {
    if (room.status==='playing') return false;
    room.players = room.players.filter(p=>p.u!==u);
    if (room.state && room.state.ready) delete room.state.ready[u];
    if (!room.players.length){ del = true; return; }
    if (room.host===u) room.host = room.players[0].u;
  });
  if (del) await SB.from('tl_rooms').delete().eq('id',rid);
}
async function forfeit(u){                      // bỏ cuộc giữa ván: xếp bét
  await commit(room => {
    const st = room.state;
    if (room.status!=='playing' || !st || st.result || !st.order.includes(u) ||
        st.finished.includes(u) || (st.gone||[]).includes(u)) return false;
    const wasTurn = st.order[st.turn]===u;
    st.gone = [...(st.gone||[]), u]; st.seq++;
    if (!settle(room, st, []) && wasTurn){ advance(st); st.dl = Date.now()+TURN; }
  });
}
async function leave(){
  if (!R){ return; }
  const st = R.state;
  const inGame = R.status==='playing' && st && !st.result && !st.finished.includes(ME.u) && !(st.gone||[]).includes(ME.u);
  if (inGame && !confirm('Thoát giữa ván sẽ bị tính thua (xếp bét) và không vào lại được ván này. Thoát?')) return;
  leaving = true;
  try {
    if (inGame) await forfeit(ME.u);
    else if (R && R.status!=='playing') await removePlayer(ME.u);
  } finally { leaving = false; }
  R=null; V='lobby'; unsub(); loadList(); render();
}
async function ready(){
  await commit(room => {
    if (room.status!=='ended' || !room.state || !room.players.some(p=>p.u===ME.u)) return false;
    room.state.ready[ME.u] = true;
  });
}
async function resolveReady(){                  // hết giờ: ai chưa sẵn sàng bị mời ra
  const rid = R.id; let del = false;
  await commit(room => {
    const st = room.state;
    if (room.status!=='ended' || !st || Date.now()<=st.rdl) return false;
    room.players = room.players.filter(p=>st.ready[p.u]);
    if (!room.players.length){ del = true; return; }
    if (!room.players.some(p=>p.u===room.host)) room.host = room.players[0].u;
    if (room.players.length<2){ room.status='waiting'; room.state=null; }
    else st.rdl = Date.now()+15000;             // đủ người sẵn sàng: chờ chủ phòng chia bài
  });
  if (del) await SB.from('tl_rooms').delete().eq('id',rid);
}

/* ---------- Ván chơi ---------- */
async function start(){
  if (busy || !R || R.host!==ME.u || R.players.length<2) return;
  const prev = R.state ? R.state.deal : 0;
  if (R.state && !(R.status==='ended' && R.players.every(p=>R.state.ready && R.state.ready[p.u]))) return;
  busy = true;
  try {
    const ps = R.players.map(p=>p.u), d = shuffle(), hands = {};
    ps.forEach((u,i)=> hands[u] = d.slice(i*13,i*13+13).sort((a,b)=>a-b));
    const first = !R.state;
    let lead = 0, need = null;
    if (first){ const mn = Math.min(...ps.map(u=>hands[u][0])); lead = ps.findIndex(u=>hands[u][0]===mn); need = mn; }
    else { const w = R.state.result && R.state.result.rank[0]; lead = Math.max(0, ps.indexOf(w)); }
    const st = {deal:prev+1, seq:0, order:ps, counts:{}, turn:lead, last:null, passed:[], finished:[], gone:[], idle:{},
                played:{}, pts:{}, need, result:null, dl:Date.now()+TURN};
    ps.forEach(u=>{ st.counts[u]=13; st.played[u]=false; st.pts[u]=0; });
    const w = ps.find(u=>white(hands[u]));
    await SB.from('tl_hands').upsert(ps.map(u=>({room:R.id,username:u,cards:hands[u]})));
    await commit(room => {
      if ((room.state?room.state.deal:0)!==prev || room.host!==ME.u || room.players.length<2) return false;
      if (room.players.map(p=>p.u).join()!==ps.join()) return false;
      if (room.status==='ended'){ if (!room.players.every(p=>room.state.ready && room.state.ready[p.u])) return false; }
      else if (room.status!=='waiting') return false;
      room.status='playing'; room.state=st;
      if (w) endGame(room, st, [w,...ps.filter(x=>x!==w)], white(hands[w]));
    });
  } finally { busy=false; }
}

async function act(u, mv){
  const st0 = R.state; if (!st0 || st0.result || R.status!=='playing') return;
  const hand = await getHand(u); let left = [];
  const a0 = active(st0);
  if (mv.cs && st0.counts[u]===mv.cs.length && a0.length===2 && !(st0.gone||[]).length){
    const o = a0.find(x=>x!==u); if (o) left = await getHand(o);
  }
  const ok = await commit(room => {
    const st = room.state;
    if (!st || st.result || room.status!=='playing' || st.deal!==st0.deal || st.seq!==st0.seq || st.order[st.turn]!==u) return false;
    st.gone = st.gone||[]; st.idle = st.idle||{};
    if (mv.cs){
      const p = st.last, c = mv.c;
      if (p && !(p.t===c.t && p.n===c.n)) p.cs.filter(x=>rk(x)===12).forEach(x=>{   // chặt heo
        const v = isRed(x)?2:1; st.pts[u]+=v; st.pts[p.u]-=v; });
      st.last = {u, cs:mv.cs, t:c.t, n:c.n, hi:c.hi};
      st.counts[u] -= mv.cs.length; st.played[u] = true; st.need = null;
      if (st.counts[u]===0) st.finished.push(u);
    } else {
      if (!st.last) return false;
      st.passed.push(u);
    }
    if (mv.auto){                                // treo máy: 2 lượt tự động liên tiếp = bỏ cuộc
      st.idle[u] = (st.idle[u]||0)+1;
      if (st.idle[u]>=2 && !st.finished.includes(u)) st.gone.push(u);
    } else st.idle[u] = 0;
    st.seq++;
    if (!settle(room, st, left)){ advance(st); st.dl = Date.now()+TURN; }
  });
  if (ok && mv.cs){
    const nh = hand.filter(x=>!mv.cs.includes(x)); if (u===ME.u) HAND = nh;
    await SB.from('tl_hands').update({cards:nh}).eq('room',R.id).eq('username',u);
    render();
  } else if (!ok && u===ME.u && !mv.auto) toast('Lượt đã thay đổi, thử lại');
}
function play(){
  const st = R.state, cs = [...SEL].sort((a,b)=>a-b), c = cls(cs);
  if (!c) return toast('Bộ bài không hợp lệ');
  if (st.last && !beats(st.last,c)) return toast('Không đánh đè được');
  if (!st.last && st.need!=null && !cs.includes(st.need)) return toast('Ván đầu phải đánh có '+lab(st.need));
  SEL.clear(); act(ME.u,{cs,c});
}
async function auto(u){
  const st = R.state;
  if (st.last) return act(u,{pass:1,auto:1});
  const h = await getHand(u), c = st.need!=null ? st.need : Math.min(...h);
  if (isFinite(c)) act(u,{cs:[c],c:cls([c]),auto:1});
}

/* ---------- Giao diện ---------- */
const cardH = (c,cls_='') => `<div class="c ${isRed(c)?'r':''} ${cls_}" data-a="card" data-c="${c}"><b>${RK[rk(c)]}</b><i>${SU[c&3]}</i></div>`;

function vLobby(){
  const rooms = LIST.map(r=>`<div class="row"><span><b>${r.id}</b> · ${r.players.map(p=>esc(p.name)).join(', ')}</span>
    <button data-a="joinroom" data-id="${r.id}">${r.players.some(p=>p.u===ME.u)?'Vào lại':'Vào'}</button></div>`).join('');
  return `<div class="pg"><h1>Tiến lên miền Nam</h1><p class="sub">Xin chào ${esc(ME.name)}</p>
    <button class="big" data-a="create">Tạo phòng mới</button>
    <div class="row"><input id="code" maxlength="4" placeholder="Mã phòng"><button data-a="join">Vào phòng</button></div>
    <h2>Phòng đang mở</h2>${rooms||'<p class="sub">Chưa có phòng nào. Tạo phòng để mời mọi người.</p>'}
    <button class="ghost" data-a="close">Đóng game</button></div>`;
}
function vWait(){
  const host = R.host===ME.u;
  return `<div class="pg"><h1>Phòng ${R.id}</h1><p class="sub">Gửi mã này cho mọi người. Cần 2–4 người.</p>
    ${R.players.map(p=>`<div class="row"><span>${esc(p.name)}${p.u===R.host?' (chủ phòng)':''}</span></div>`).join('')}
    ${host?`<button class="big" data-a="start" ${R.players.length<2?'disabled':''}>Bắt đầu chia bài</button>`:'<p class="sub">Đang chờ chủ phòng bắt đầu…</p>'}
    <button class="ghost" data-a="leave">Rời phòng</button></div>`;
}
function vTable(){
  const st = R.state, cur = st.order[st.turn], playing = R.status==='playing' && !st.result, mine = cur===ME.u && playing;
  const gone = u => (st.gone||[]).includes(u), iGone = gone(ME.u);
  const opp = st.order.filter(u=>u!==ME.u).map(u=>`<div class="o ${u===cur&&playing?'t':''}">
    <b>${esc(nm(u))}</b><span>${gone(u)?'đã thoát':st.finished.includes(u)?'hết bài #'+(st.finished.indexOf(u)+1):st.counts[u]+' lá'}${st.passed.includes(u)?' · bỏ lượt':''}</span><i>${sc(u)} điểm</i></div>`).join('');
  const mid = st.last ? `<small>${esc(nm(st.last.u))} đánh</small><div class="cards">${st.last.cs.map(c=>cardH(c,'m')).join('')}</div>`
                      : `<small>${st.result?'':esc(nm(cur))+' đi tự do'}</small>`;
  const hand = HAND.map(c=>cardH(c,SEL.has(c)?'s':'')).join('');
  const rdy = st.ready || {};
  const rs = st.result ? `<div class="ov"><div class="box"><h2>${st.result.white?'Tới trắng: '+st.result.white:'Kết thúc ván'}</h2>
    ${st.result.rank.map((u,i)=>`<div class="row"><span>#${i+1} ${esc(nm(u))}${gone(u)?' (đã thoát)':''}</span><b>${st.result.delta[u]>0?'+':''}${st.result.delta[u]}</b></div>`).join('')}
    <h2>Chơi tiếp? <span id="rd"></span></h2>
    ${R.players.map(p=>`<div class="row"><span>${esc(p.name)}</span><span>${rdy[p.u]?'✔ sẵn sàng':'đang chờ…'}</span></div>`).join('')}
    <p class="sub">Ai chưa bấm khi hết giờ sẽ bị mời ra khỏi phòng.</p>
    <button class="big" data-a="ready" ${rdy[ME.u]?'disabled':''}>${rdy[ME.u]?'Đã sẵn sàng':'Chơi tiếp'}</button>
    <button class="ghost" data-a="leave">Rời phòng</button></div></div>` : '';
  return `<div class="tb"><div class="top"><span>Phòng ${R.id}</span><span id="tm"></span><button class="ghost" data-a="leave">Thoát</button></div>
    <div class="opps">${opp}</div><div class="mid">${mid}</div>
    <div class="me"><div class="who ${mine?'t':''}"><b>${esc(ME.name)}</b> · ${sc(ME.u)} điểm${iGone?' · đã thoát ván':st.finished.includes(ME.u)?' · đã hết bài':''}</div>
    <div class="hand">${hand}</div>
    <div class="btns"><button data-a="clear" ${SEL.size?'':'disabled'}>Bỏ chọn</button>
    <button data-a="pass" ${mine&&st.last?'':'disabled'}>Bỏ lượt</button>
    <button class="big" data-a="play" ${mine&&SEL.size?'':'disabled'}>${mine?'Đánh':'Chờ lượt'}</button></div></div>${rs}</div>`;
}
function render(){
  if (!root) return;
  const v = root.shadowRoot.querySelector('#v');
  const keep = root.shadowRoot.querySelector('#code'), val = keep ? keep.value : '';
  v.innerHTML = V==='lobby' ? vLobby() : (R.state ? vTable() : vWait());
  const k = root.shadowRoot.querySelector('#code'); if (k) k.value = val;
}

const CSS = `
:host{all:initial}*{box-sizing:border-box}
#w{position:fixed;inset:0;z-index:99999;background:#0f3d33;color:#f3ecd8;font:15px/1.4 system-ui,-apple-system,sans-serif;overflow:auto;
 padding:env(safe-area-inset-top) 0 env(safe-area-inset-bottom)}
button{font:inherit;border:1px solid #e0b04a;background:transparent;color:#f3ecd8;border-radius:10px;padding:10px 14px;min-height:44px}
button.big{background:#e0b04a;color:#2a1f08;font-weight:700}button.ghost{border-color:#ffffff40}
button:disabled{opacity:.35}
input{font:inherit;min-height:44px;padding:0 12px;border-radius:10px;border:1px solid #ffffff40;background:#0a2c24;color:inherit;text-transform:uppercase;width:130px}
.pg{max-width:460px;margin:0 auto;padding:20px 16px;display:grid;gap:12px}
h1{margin:0;font:700 28px Georgia,serif}h2{margin:8px 0 0;font:700 17px Georgia,serif}.sub{margin:0;opacity:.7}
.row{display:flex;justify-content:space-between;align-items:center;gap:10px;padding:8px 12px;background:#ffffff12;border-radius:10px}
.tb{display:flex;flex-direction:column;min-height:100%;max-width:560px;margin:0 auto;padding:8px 10px}
.top{display:flex;justify-content:space-between;align-items:center}#tm{font-weight:700;color:#e0b04a}
.opps{display:flex;gap:8px;margin:8px 0}.o{flex:1;background:#ffffff12;border-radius:10px;padding:8px;display:grid;font-size:13px;border:2px solid transparent}
.o i{font-style:normal;opacity:.7}.t{border-color:#e0b04a}
.mid{flex:1;display:grid;place-content:center;justify-items:center;gap:6px;min-height:130px}
.cards{display:flex;justify-content:center;flex-wrap:wrap}
.c{width:46px;height:66px;background:#fbf6ea;color:#1c1c1c;border-radius:7px;display:grid;place-content:center;text-align:center;
 box-shadow:-2px 0 5px #0004;margin-left:-20px;position:relative;transition:transform .12s;user-select:none;cursor:pointer;line-height:1.1}
.c:first-child{margin-left:0}.c b{font-size:17px}.c i{font-style:normal;font-size:17px}.c.r{color:#c0392b}
.c.s{transform:translateY(-14px);outline:2px solid #e0b04a}.c.m{width:40px;height:58px;margin-left:-14px;cursor:default}.c.m:first-child{margin-left:0}
.hand{display:flex;padding:18px 6px 6px;justify-content:center}
.who{text-align:center;padding:4px;border-radius:8px}.who.t{color:#e0b04a;font-weight:700}
.btns{display:flex;gap:8px;margin-top:6px}.btns button{flex:1}
.ov{position:fixed;inset:0;background:#000a;display:grid;place-items:center;padding:16px}
.box{background:#0f3d33;border:1px solid #e0b04a;border-radius:14px;padding:18px;width:100%;max-width:380px;max-height:90vh;overflow:auto;display:grid;gap:10px}
#toast{position:fixed;left:50%;bottom:90px;transform:translateX(-50%);background:#000c;padding:8px 14px;border-radius:20px;opacity:0;transition:opacity .2s;pointer-events:none}
#toast.on{opacity:1}`;

function onClick(e){
  const el = e.target.closest('[data-a]'); if (!el) return;
  const a = el.dataset.a;
  if (a==='card'){ const c=+el.dataset.c; SEL.has(c)?SEL.delete(c):SEL.add(c); return render(); }
  if (a==='create') return create();
  if (a==='join') return join(root.shadowRoot.querySelector('#code').value);
  if (a==='joinroom') return join(el.dataset.id);
  if (a==='start') return start();
  if (a==='leave') return leave();
  if (a==='ready') return ready();
  if (a==='close') return close();
  if (a==='clear'){ SEL.clear(); return render(); }
  if (a==='pass') return act(ME.u,{pass:1});
  if (a==='play') return play();
}

function tick(){
  tk++; const now = Date.now();
  if (V==='lobby'){ if (tk%8===0) loadList(); if (tk%60===0) cleanup(); return; }
  if (V!=='room' || !R) return;
  if (tk%5===0) SB.from('tl_rooms').select('*').eq('id',R.id).maybeSingle().then(({data})=>{
    if (!R) return; if (!data) apply(null); else if (data.version > R.version) apply(data); });
  if (tk%60===0) SB.from('tl_rooms').update({updated_at:new Date().toISOString()}).eq('id',R.id).then(()=>{});
  // mất kết nối > 30s: phòng chờ/kết quả thì bị mời ra, đang chơi thì bỏ cuộc (xếp bét)
  if (presOn.has(ME.u) && now-presAt>8000) R.players.forEach(p=>{
    if (p.u===ME.u || offline(p.u)<=OFFLINE || (drops[p.u] && now-drops[p.u]<8000)) return;
    const st = R.state;
    if (R.status==='playing'){
      if (!st || st.result || !st.order.includes(p.u) || st.finished.includes(p.u) || (st.gone||[]).includes(p.u)) return;
      drops[p.u] = now; forfeit(p.u);
    } else { drops[p.u] = now; removePlayer(p.u); }
  });
  const st = R.state; if (!st) return;
  if (R.status==='ended'){
    const rd = root.shadowRoot.querySelector('#rd');
    if (rd) rd.textContent = Math.max(0, Math.ceil((st.rdl-now)/1000)) + 's';
    if (now > st.rdl+500 && now-lastRes>4000){ lastRes = now; resolveReady(); }
    else if (R.host===ME.u && R.players.length>=2 && R.players.every(p=>rdy_(st,p.u))) start();
    return;
  }
  if (R.status!=='playing' || st.result) return;
  const left = st.dl - now, cur = st.order[st.turn];
  const tm = root.shadowRoot.querySelector('#tm');
  if (tm) tm.textContent = Math.max(0, Math.ceil(left/1000)) + 's · ' + nm(cur);
  const key = st.deal+':'+st.seq;
  if (autoKey!==key && ((cur===ME.u && left<=0) || left<-5000)){ autoKey=key; auto(cur); }
}
const rdy_ = (st,u) => !!(st.ready && st.ready[u]);

/* ---------- API ---------- */
async function open(opts){
  opts = opts || {};
  let u = opts.username || localStorage.getItem('tl_user');
  if (!u) u = (prompt('Tên đăng nhập của bạn?')||'').trim();
  if (!u) return;
  localStorage.setItem('tl_user', u);
  ME = {u, name: opts.name || u};
  await ensureSB();
  if (root) root.remove();
  root = document.createElement('div');
  const sr = root.attachShadow({mode:'open'});
  sr.innerHTML = `<style>${CSS}</style><div id="w"><div id="v"></div><div id="toast"></div></div>`;
  sr.addEventListener('click', onClick);
  document.body.appendChild(root);
  V='lobby'; R=null; render(); loadList(); cleanup();
  clearInterval(open.h); open.h = setInterval(tick, 1000);
}
function close(){
  clearInterval(open.h); unsub();
  if (root){ root.remove(); root=null; }
  R=null; V='lobby';
}
window.TienLen = {open, close, _rules:{cls, beats, white}};

/* Tự gắn vào nút #tienlenBtn (menu 3 gạch proxy click vào đây) */
function wire(){
  const b = document.getElementById('tienlenBtn'); if (!b || b.__tl) return; b.__tl = 1;
  b.addEventListener('click', () => {
    let u = null;
    try { u = window.SRank.Auth.getCurrentUser(); } catch(_){}
    const un = u && (u.username || u.displayName);
    if (!un){ alert('Hãy đăng nhập trước khi chơi Tiến lên'); return; }
    open({username: String(un).trim().toLowerCase(), name: u.displayName || un});
  });
}
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', wire); else wire();
})();
