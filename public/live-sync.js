// Keep live events small; fetch a deck only when its revision changes.
window.createAulaLiveSync=function({read,apply,fetchState,valid=()=>true}){
 let pending=null,busy=false,timer=null,closed=false;
 const alive=()=>!closed&&valid();
 function receive(patch){if(!alive())return;const current=read();if(patch.version&&patch.version<(current.version||0))return;
  if(!patch.slides&&patch.deckRevision!==undefined&&patch.deckRevision!==current.deckRevision){pending=patch;refresh();return;}
  apply({...current,...patch},patch);}
 async function refresh(){if(busy||!alive())return;busy=true;try{const fresh=await fetchState();if(!alive())return;if((fresh.version||0)>=(read().version||0))apply(fresh,fresh);const latest=pending;pending=null;if(latest&&(latest.version||0)>=(read().version||0))receive(latest);}catch{if(alive()){clearTimeout(timer);timer=setTimeout(()=>{timer=null;refresh();},3000);}}finally{busy=false;if(pending&&alive()&&!timer)queueMicrotask(refresh);}}
 return {receive,close(){closed=true;clearTimeout(timer);pending=null;}};
};
