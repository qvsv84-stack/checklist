(function(){
'use strict';
var MP = window.__MP;
if (!MP) { console.error('[MP Online] Cần load monopoly-core.js trước'); return; }

var online = MP.online, state = MP.state, sb = MP.sb, fn = MP.fn;
var $ = MP.$, toast = fn.toast, esc = fn.esc, rnd = fn.rnd, avt = fn.avt;
var showScreen = fn.showScreen, renderAll = fn.renderAll, getPlayer = fn.getPlayer;
var initTiles = fn.initTiles, PLAYER_COLORS = fn.PLAYER_COLORS, dbgEvent = fn.dbgEvent;
var commitAndRender = fn.commitAndRender, scheduleSaveProfile = fn.scheduleSaveProfile;

function myUsername(){ return MP.getMyUsername(); }
function myDisplayName(){ return MP.getMyDisplayName(); }
function myProfile(){ return MP.getMyProfile(); }
function profile(){ return MP.getProfile(); }

async function createRoom(){
  if(!sb)return toast('Supabase chưa sẵn sàng');
  if(online.room)return toast('Đang ở phòng khác');
  var code=Array.from({length:6},function(){return'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'[rnd(32)]}).join('');
  var r=await sb.from('monopoly_rooms').insert({code:code,host_username:myUsername(),status:'waiting',max_players:4,state:{},version:0}).select().single();
  if(r.error)return toast('Lỗi tạo phòng: '+r.error.message);
  online.room=r.data;online.isHost=true;
  await sb.from('monopoly_room_players').insert({room_id:online.room.id,username:myUsername(),display_name:myDisplayName()||(myProfile()&&myProfile().display_name)||myUsername(),avatar_url:myProfile()&&myProfile().avatar_url,is_host:true,color_index:0});
  enterWait();
}

async function joinRoomById(rid){
  if(!sb||online.room)return;
  var r=await sb.from('monopoly_rooms').select('*').eq('id',rid).eq('status','waiting').maybeSingle();
  if(r.error||!r.data)return toast('Phòng đã đóng');
  online.room=r.data;online.isHost=(online.room.host_username===myUsername());
  var ex=await sb.from('monopoly_room_players').select('id').eq('room_id',rid).eq('username',myUsername()).maybeSingle();
  if(!ex.data){
    var cnt=await sb.from('monopoly_room_players').select('id',{count:'exact',head:true}).eq('room_id',rid);
    await sb.from('monopoly_room_players').insert({room_id:rid,username:myUsername(),display_name:myDisplayName()||(myProfile()&&myProfile().display_name)||myUsername(),avatar_url:myProfile()&&myProfile().avatar_url,color_index:(cnt.count||0)});
  }
  enterWait();
}

async function leaveRoom(){
  if(online.room){
    if(online.roomChan){try{sb.removeChannel(online.roomChan)}catch(e){}online.roomChan=null}
    if(online.pollTimer){clearInterval(online.pollTimer);online.pollTimer=null}
    try{
      await sb.from('monopoly_room_players').delete().eq('room_id',online.room.id).eq('username',myUsername());
      if(online.isHost)await sb.from('monopoly_rooms').delete().eq('id',online.room.id);
    }catch(e){}
  }
  online.room=null;online.isHost=false;online.roomPlayers=[];state.game=null;state.playMode='bot';
  if(online.roomsChan){try{sb.removeChannel(online.roomsChan)}catch(e){}online.roomsChan=null}
}

function enterWait(){
  showScreen('waitingScreen');
  $('hostControls').style.display=online.isHost?'block':'none';
  renderWait();startRealtime();refreshPlayers();
}

function renderWait(){
  $('waitingCount').textContent=online.roomPlayers.length;
  $('waitingPlayers').innerHTML=online.roomPlayers.map(function(p){
    return'<div class="room-item"><div class="room-item-info"><div class="room-item-host">'+esc(p.display_name)+(p.username===myUsername()?' (Bạn)':'')+'</div></div>'+(p.is_host?'<span style="color:#00f0ff;font-size:10px">HOST</span>':'')+'</div>';
  }).join('');
  $('hostStartBtn').disabled=online.roomPlayers.length<2;
  $('hostStartBtn').textContent=online.roomPlayers.length>=2?'🚀 Bắt đầu ('+online.roomPlayers.length+')':'⏳ Cần 2 người';
}

async function hostStart(){
  if(online.roomPlayers.length<2)return;
  if(!sb||!online.room)return toast('Không có phòng');
  if(online.room.status==='playing')return toast('Game đã bắt đầu');
  var btn=$('hostStartBtn');btn.disabled=true;btn.textContent='⏳ Đang bắt đầu...';
  try{
    var players=online.roomPlayers.map(function(rp,i){
      return{username:rp.username,name:rp.display_name,avatar:rp.avatar_url||avt(rp.display_name),color:PLAYER_COLORS[i%4].c,pos:0,money:50000,jail_turns:0,bankrupt:false,bot:false};
    });
    var initialState={
      players:players,tiles:initTiles(),current_turn:online.roomPlayers[0].username,turn_count:0,
      started_at:Date.now(),winner:null,pending_action:null,global_event:null,
      is_double:false,doubleStreak:0,activeBooster:null,boosterTriggered:{},player_flags:{}
    };
    var newVer=(online.room.version||0)+1;
    var upd=await sb.from('monopoly_rooms').update({status:'playing',state:initialState,version:newVer,updated_at:new Date().toISOString()}).eq('id',online.room.id).eq('status','waiting').select().single();
    if(upd.error){btn.disabled=false;btn.textContent='🚀 Bắt đầu';return toast('Lỗi bắt đầu: '+upd.error.message)}
    if(!upd.data){btn.disabled=false;btn.textContent='🚀 Bắt đầu';return toast('Phòng đã thay đổi')}
    online.room=upd.data;state.playMode='online';
    state.game=JSON.parse(JSON.stringify(initialState));state.game._v=online.room.version;
    showScreen('gameScreen');renderAll();
    setTimeout(function(){ var banner=MP.shadow.getElementById('turnBanner'); if(banner){banner.textContent='👉 '+players[0].name;banner.style.color=players[0].color;banner.classList.add('show');setTimeout(function(){banner.classList.remove('show')},1600);} },400);
    dbgEvent('HOST_START','v='+online.room.version+' n='+players.length);
  }catch(e){
    btn.disabled=false;btn.textContent='🚀 Bắt đầu';
    toast('Lỗi: '+(e.message||''));
  }
}

async function refreshPlayers(){
  if(!online.room)return;
  try{
    var r=await sb.from('monopoly_room_players').select('*').eq('room_id',online.room.id).order('joined_at');
    if(r.data){online.roomPlayers=r.data;if(online.room&&online.room.status==='waiting')renderWait();}
  }catch(e){}
}

async function fetchRooms(){
  if(!sb)return;
  var r=await sb.from('monopoly_rooms').select('*').eq('status','waiting').order('created_at',{ascending:false}).limit(20);
  if(!r.data){$('roomsList').innerHTML='<div style="text-align:center;padding:20px;color:#888;font-weight:700">Chưa có phòng nào</div>';return}
  $('roomsList').innerHTML=r.data.map(function(rm){
    var mine=rm.host_username===myUsername();
    return'<div class="room-item"><div class="room-item-info"><div class="room-item-host">🎩 '+esc(rm.host_username)+'</div><div class="room-item-meta">'+rm.max_players+' người</div></div><button class="room-item-join" data-id="'+rm.id+'"'+(mine?' disabled':'')+'>'+(mine?'Của bạn':'Vào')+'</button></div>';
  }).join('')||'<div style="text-align:center;padding:20px;color:#888;font-weight:700">Chưa có phòng nào</div>';
}

async function enterOnlineScreen(){
  if(online.room)await leaveRoom();
  showScreen('onlineScreen');fetchRooms();
  if(online.roomsChan){try{sb.removeChannel(online.roomsChan)}catch(e){}}
  online.roomsChan=sb.channel('mp-rooms-list').on('postgres_changes',{event:'*',schema:'public',table:'monopoly_rooms'},fetchRooms).subscribe();
}

async function commitOnline(){
  if(!online.room||!state.game)return;
  try{
    var nextVer=(online.room.version||0)+1;
    var payload=Object.assign({},state.game);delete payload._v;
    var res=await sb.from('monopoly_rooms').update({state:payload,version:nextVer,updated_at:new Date().toISOString()}).eq('id',online.room.id).select().single();
    if(res.data){online.room=res.data;state.game._v=online.room.version}
    else if(res.error){dbgEvent('COMMIT_ERR',res.error.message)}
  }catch(e){dbgEvent('COMMIT_EXCEPT',e.message||'')}
}

function handleRemoteState(oldG,newG){
  if(!newG)return;
  var prevPending=state.game&&state.game.pending_action;
  var pa=newG.pending_action;
  var samePending=prevPending&&pa&&prevPending.type===pa.type&&prevPending.tileIdx===pa.tileIdx&&prevPending.player===pa.player;
  state.game=newG;
  if(online.room)state.game._v=online.room.version;
  if(pa&&pa.player===myUsername()&&!samePending){
    if(pa.type==='buy_empty')fn.showBuyEmptyModal(getPlayer(pa.player),pa.tileIdx,pa.price);
    else if(pa.type==='upgrade')fn.showUpgradeModal(getPlayer(pa.player),pa.tileIdx,pa.cost,state.game.tiles[pa.tileIdx].level);
    else if(pa.type==='opponent_tile')fn.showOpponentModal(getPlayer(pa.player),pa.tileIdx,pa.chainValue,pa.rentPrice,pa.chainCount);
  }else if(!pa&&prevPending){fn.hideActionModal()}
  renderAll();
  if(newG.winner)fn.showWinOverlay();
}

function startRealtime(){
  if(!sb||!online.room)return;
  if(online.roomChan){try{sb.removeChannel(online.roomChan)}catch(e){}online.roomChan=null}
  var myRoomId=online.room.id;
  online.roomChan=sb.channel('mp-room-'+myRoomId)
    .on('postgres_changes',{event:'UPDATE',schema:'public',table:'monopoly_rooms'},function(payload){
      var row=payload.new;if(!row||row.id!==myRoomId)return;
      online.room=row;
      if(row.status==='playing'&&row.state){
        var currentV=(state.game&&state.game._v)||0;
        if(!state.game||(row.version||0)>currentV){
          if($('gameScreen').hidden){state.playMode='online';showScreen('gameScreen')}
          handleRemoteState(state.game,row.state);
          if(state.game)state.game._v=row.version;
          dbgEvent('RT_ENTER','v='+row.version);
        }
      }
    })
    .on('postgres_changes',{event:'*',schema:'public',table:'monopoly_room_players',filter:'room_id=eq.'+myRoomId},refreshPlayers)
    .subscribe(function(status,err){
      dbgEvent('CH_STATUS',status+(err?' '+(err.message||err):''));
      if(status==='CHANNEL_ERROR'||status==='TIMED_OUT')toast('⚠️ Realtime lỗi — dùng polling');
    });
  if(online.pollTimer)clearInterval(online.pollTimer);
  online.pollTimer=setInterval(async function(){
    if(!online.room||online.room.id!==myRoomId)return;
    try{
      var r=await sb.from('monopoly_rooms').select('*').eq('id',myRoomId).maybeSingle();
      if(r.error){dbgEvent('POLL_ERR',r.error.message);return}
      if(r.data&&r.data.status==='playing'&&r.data.state){
        online.room=r.data;
        var currentV=(state.game&&state.game._v)||0;
        if(!state.game||(online.room.version||0)>currentV){
          if($('gameScreen').hidden){state.playMode='online';showScreen('gameScreen')}
          handleRemoteState(state.game,r.data.state);
          if(state.game)state.game._v=online.room.version;
          dbgEvent('POLL_ENTER','v='+online.room.version);
        }
      }
      refreshPlayers();
    }catch(e){dbgEvent('POLL_EXCEPT',e.message||'')}
  },3000);
}

window.__MP_ONLINE = {
  createRoom:createRoom,joinRoomById:joinRoomById,leaveRoom:leaveRoom,
  enterWait:enterWait,renderWait:renderWait,hostStart:hostStart,
  refreshPlayers:refreshPlayers,fetchRooms:fetchRooms,
  enterOnlineScreen:enterOnlineScreen,commitOnline:commitOnline,
  handleRemoteState:handleRemoteState,startRealtime:startRealtime
};
})();