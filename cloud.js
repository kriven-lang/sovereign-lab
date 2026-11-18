
/* Google identity, minimal Google Drive appDataFolder scope, and Firebase org transport. */
(function(){
'use strict';
const cfg=window.SOVEREIGN_FIREBASE_CONFIG;
const configured=Boolean(cfg?.apiKey&&cfg?.authDomain&&cfg?.projectId&&cfg?.appId);
let status=configured?'connecting':'unconfigured',user=null,auth=null,db=null,authSDK=null;
let driveAccessToken=null,driveUid=null,mode='personal';
const fileName='sovereign-lab-personal.json';
const scope='https://www.googleapis.com/auth/drive.appdata';
const publicUser=u=>u?{uid:u.uid,email:u.email||'',displayName:u.displayName||''}:null;
function isWorkEmail(email){return !!email&&!/@(gmail|googlemail)\.com$/i.test(email)}
function notify(){window.dispatchEvent(new CustomEvent('sovereign-auth-change',{detail:{status,user:publicUser(user),mode}}))}
function requireAuth(){if(!auth||!authSDK||!user||user.uid!==auth.currentUser?.uid)throw Error('Sign in using Google first.')}
async function driveConsent(){
 requireAuth();
 if(driveAccessToken&&driveUid===user.uid)return;
 const provider=new authSDK.GoogleAuthProvider();
 provider.addScope(scope);
 provider.setCustomParameters({prompt:'select_account'});
 const id=user.uid;
 const result=await authSDK.reauthenticateWithPopup(auth.currentUser,provider);
 if(result.user.uid!==id)throw Error('You must authorize the same Google account.');
 const cred=authSDK.GoogleAuthProvider.credentialFromResult(result);
 if(!cred?.accessToken)throw Error('Google Drive permission was not granted.');
 driveAccessToken=cred.accessToken;driveUid=id;
 window.dispatchEvent(new CustomEvent('sovereign-drive-change'));
}
async function api(url,options={}){
 requireAuth();
 const r=await fetch(url,{...options,headers:{Authorization:'Bearer '+driveAccessToken,...(options.headers||{})}});
 if(r.status===401){driveAccessToken=null;throw Error('Drive authorization expired; retry to reconnect.')}
 if(!r.ok){let reason='';try{reason=(await r.json()).error?.message||''}catch{}throw Error('Drive API '+r.status+' '+reason)}
 if(r.status===204)return null;
 return r.json();
}
async function existing(){
 const q="name = '"+fileName+"' and trashed = false";
 const search=new URLSearchParams({spaces:'appDataFolder',q,fields:'files(id,name)',pageSize:'100'});
 const response=await api('https://www.googleapis.com/drive/v3/files?'+search.toString());
 return (response.files||[]).find(f=>f.name===fileName)||null;
}
async function savePersonal(workspace){
 requireAuth();
 if(workspace?.schema!==1||JSON.stringify(workspace).length>4_000_000)throw Error('Invalid or oversized personal workspace.');
 await driveConsent();
 let file=await existing();
 if(!file){
  file=await api('https://www.googleapis.com/drive/v3/files?fields=id',{
   method:'POST',headers:{'Content-Type':'application/json'},
   body:JSON.stringify({name:fileName,mimeType:'application/json',parents:['appDataFolder']})
  });
 }
 await api('https://www.googleapis.com/upload/drive/v3/files/'+encodeURIComponent(file.id)+'?uploadType=media&fields=id',{
  method:'PATCH',headers:{'Content-Type':'application/json'},
  body:JSON.stringify({format:'sovereign-lab-personal',schema:1,workspace,savedAt:new Date().toISOString()})
 });
}
async function loadPersonal(){
 await driveConsent();
 const file=await existing();if(!file)return null;
 const doc=await api('https://www.googleapis.com/drive/v3/files/'+encodeURIComponent(file.id)+'?alt=media');
 if(doc?.format!=='sovereign-lab-personal'||doc?.workspace?.schema!==1)throw Error('Unsupported personal Drive backup.');
 return doc.workspace;
}
async function deletePersonal(){
 await driveConsent();
 const file=await existing();if(!file)return false;
 await api('https://www.googleapis.com/drive/v3/files/'+encodeURIComponent(file.id),{method:'DELETE'});
 return true;
}
window.SOVEREIGN_CLOUD={
 get configured(){return configured},get status(){return status},
 get user(){return publicUser(user)},get db(){return db},get auth(){return auth},
 get driveReady(){return !!driveAccessToken&&driveUid===user?.uid},
 isWorkEmail,connectDrive:driveConsent,savePersonal,loadPersonal,deletePersonal,
 async signIn(purpose='personal'){
  if(!auth||!authSDK)throw Error('Google login is not yet configured.');
  const provider=new authSDK.GoogleAuthProvider();
  provider.setCustomParameters({prompt:'select_account'});
  const res=await authSDK.signInWithPopup(auth,provider);
  if(purpose==='organization'&&!isWorkEmail(res.user.email)){
   await authSDK.signOut(auth);
   throw Error('Organization login requires a Google work account, not a personal Gmail address.');
  }
  mode=purpose;return publicUser(res.user);
 },
 async signOut(){if(!auth||!authSDK)throw Error('Google login is not configured.');driveAccessToken=null;driveUid=null;await authSDK.signOut(auth)}
};
if(!configured)return;
(async()=>{
 const base='https://www.gstatic.com/firebasejs/13.3.0/';
 const [apps,a,f]=await Promise.all([import(base+'firebase-app.js'),import(base+'firebase-auth.js'),import(base+'firebase-firestore.js')]);
 authSDK=a;
 const instance=apps.initializeApp(cfg);auth=a.getAuth(instance);db=f.getFirestore(instance);
 a.onAuthStateChanged(auth,next=>{
  const old=user?.uid||null;
  user=next;if(old!==next?.uid){driveAccessToken=null;driveUid=null}
  status=next?'signed-in':'signed-out';notify();
 },error=>{status='error';console.error(error);notify()});
})().catch(error=>{status='error';console.error('Firebase setup error',error);notify()});
})();
