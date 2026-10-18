(function(root){
'use strict';
const PRIVATE_URL='https://oilfield-redesign-preview.arrondkirkwood.chatgpt.site';
const PREFERENCE_KEY='personalOilfieldLoadTracker.privateTrackerLaunch.v1';
const KEYS={loads:'personalOilfieldLoadTracker.loads',dailyAddOns:'personalOilfieldLoadTracker.dailyAddOns',dailySummaries:'personalOilfieldLoadTracker.dailySummaries',profile:'personalOilfieldLoadTracker.profile',settings:'personalOilfieldLoadTracker.settings',favoriteRoutes:'personalOilfieldLoadTracker.favoriteRoutes',paidTime:'personalOilfieldLoadTracker.paidTime',metadata:'personalOilfieldLoadTracker.meta',draft:'personalOilfieldLoadTracker.currentDraft',paidDraft:'personalOilfieldLoadTracker.paidTimeDraft',legacyLoads:'personalOilfieldLoadTrackerLog',legacyAddOns:'personalOilfieldDailyEarningsAddOns',legacySummaries:'personalOilfieldDailyEarningsRecords'};
function readState(storage){const raw={};let readable=true;for(const key of Object.values(KEYS)){try{const v=storage.getItem(key);if(v!==null)raw[key]=v;}catch{readable=false;}}
 try{for(let i=0;i<storage.length;i++){const key=storage.key(i);if(key&&key!==PREFERENCE_KEY&&key.startsWith('personalOilfield'))raw[key]=storage.getItem(key);}}catch{readable=false;}
 const parse=(key,fallback)=>{if(!(key in raw))return fallback;try{return JSON.parse(raw[key]);}catch{readable=false;return fallback;}};
 const legacy=parse(KEYS.legacyLoads,[]),loads=parse(KEYS.loads,Array.isArray(legacy)?legacy:legacy?.loads||[]),paid=parse(KEYS.paidTime,[]),draft=parse(KEYS.draft,null),paidDraft=parse(KEYS.paidDraft,null);
 const hasDraft=[draft,paidDraft].some(x=>x&&typeof x==='object'&&Object.keys(x).length>0);
 return {raw,readable,loads:Array.isArray(loads)?loads:[],paidTime:Array.isArray(paid)?paid:[],hasDraft,parse};
}
// Change detection only; this checksum is not used for security or record identity.
function fingerprint(raw){const str=JSON.stringify(Object.values(KEYS).filter(k=>k!==KEYS.metadata).map(k=>[k,raw[k]??null]));let hash=2166136261;for(let i=0;i<str.length;i++){hash^=str.charCodeAt(i);hash=Math.imul(hash,16777619);}return 'v1-'+(hash>>>0).toString(16)+'-'+str.length;}
function backup(state){return {format:'personal-oilfield-load-tracker-backup',backupType:'original-device-before-private-tracker',exportedAt:new Date().toISOString(),data:{loads:state.loads,dailyAddOns:state.parse(KEYS.dailyAddOns,state.parse(KEYS.legacyAddOns,{})),dailySummaries:state.parse(KEYS.dailySummaries,state.parse(KEYS.legacySummaries,{})),profile:state.parse(KEYS.profile,{}),settings:state.parse(KEYS.settings,{}),favoriteRoutes:state.parse(KEYS.favoriteRoutes,[]),paidTime:state.paidTime,metadata:state.parse(KEYS.metadata,{})},deviceRecovery:{rawAppStorage:state.raw}};}
function start(win){const doc=win.document,open=doc.getElementById('open-private'),remember=doc.getElementById('remember-private'),status=doc.getElementById('launch-status'),device=doc.getElementById('device-status'),exportButton=doc.getElementById('export-original');let storage,state,preference;
 try{storage=win.localStorage;state=readState(storage);preference=JSON.parse(storage.getItem(PREFERENCE_KEY)||'null');}catch{state=state||{raw:{},loads:[],paidTime:[],hasDraft:false,readable:false};}
 device.textContent=state.readable?`${state.loads.length} original load${state.loads.length===1?'':'s'} and ${state.paidTime.length} paid-work entr${state.paidTime.length===1?'y':'ies'} found on this device. Your original records are preserved.`:'Device storage could not be fully read. Your records have not been cleared. Use the original app for recovery if needed.';
 if(state.hasDraft)status.textContent='An unfinished draft is still in the original app. Review or export it before continuing.';
 if(win.navigator.onLine===false)status.textContent='You are offline. The original app is available for recovery if it was previously cached. Use the private tracker directly once it has been opened on this device.';
 exportButton.disabled=!Object.keys(state.raw).length;
 exportButton.addEventListener('click',()=>{try{const current=readState(storage),blob=new win.Blob([JSON.stringify(backup(current),null,2)],{type:'application/json'}),url=win.URL.createObjectURL(blob),a=doc.createElement('a');a.href=url;a.download='Personal_Oilfield_Original_Device_Recovery_'+new Date().toISOString().slice(0,10)+'.json';doc.body.appendChild(a);a.click();a.remove();win.setTimeout(()=>win.URL.revokeObjectURL(url),60000);status.textContent='Recovery backup created. Keep it if you need to transfer original-app entries.';}catch{status.textContent='The backup could not be created. Open the original app and use Export Full Backup.';}});
 open.addEventListener('click',event=>{if(event.ctrlKey||event.metaKey||event.shiftKey||event.altKey)return;event.preventDefault();try{const current=readState(storage);storage.setItem(PREFERENCE_KEY,JSON.stringify({automatic:remember.checked&&current.readable,fingerprint:fingerprint(current.raw)}));}catch{}win.location.assign(PRIVATE_URL);});
 const recovery=new win.URL(win.location.href).searchParams.has('recovery')||win.location.hash==='#recovery';
 if(preference?.automatic&&state.readable&&!state.hasDraft&&win.navigator.onLine!==false&&!recovery&&preference.fingerprint===fingerprint(state.raw))win.location.replace(PRIVATE_URL);
 else if(preference?.automatic&&state.readable&&!state.hasDraft&&!recovery&&preference.fingerprint!==fingerprint(state.raw))status.textContent='The original device records changed since your last visit. They are preserved; export a recovery backup if those entries need transferring.';
 if('serviceWorker' in win.navigator)win.navigator.serviceWorker.register('./service-worker.js',{updateViaCache:'none'}).then(r=>r.update()).catch(()=>{});
 return state;
}
if(typeof module==='object'&&module.exports)module.exports={PRIVATE_URL,PREFERENCE_KEY,KEYS,readState,fingerprint,backup,start};
else start(root);
})(typeof window!=='undefined'?window:globalThis);
