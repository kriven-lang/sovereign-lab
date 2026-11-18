/* Optional Google identity + opt-in cloud save (no Gmail permissions). */
(function(){
 'use strict';
 const config=window.SOVEREIGN_FIREBASE_CONFIG;
 let status=config?.apiKey&&config?.projectId&&config?.authDomain&&config?.appId?'connecting':'unconfigured';
 let user=null,auth=null,db=null,authSdk=null,store=null;
 const brief=u=>u?{uid:u.uid,email:u.email||'',displayName:u.displayName||''}:null;
 const notify=()=>window.dispatchEvent(new CustomEvent('sovereign-auth-change',{detail:{status,user:brief(user)}}));
 const verify=()=>{if(!auth||!db||!user||auth.currentUser?.uid!==user.uid)throw Error('You must sign in with Google first.')};
 window.SOVEREIGN_CLOUD={
   get status(){return status},get user(){return brief(user)},
   async signIn(){if(!authSdk||!auth)throw Error('Google sign-in is not configured.');await authSdk.signInWithPopup(auth,new authSdk.GoogleAuthProvider())},
   async signOut(){if(!authSdk||!auth)throw Error('Google sign-in is not configured.');await authSdk.signOut(auth)},
   async savePersonal(workspace){
    verify();
    if(workspace?.schema!==1||JSON.stringify(workspace).length>450000)throw Error('Invalid or oversized workspace.');
    await store.setDoc(store.doc(db,'users',user.uid,'private','profile'),{
      format:'sovereign-lab-personal',schema:1,workspace,updatedAt:store.serverTimestamp()
    });
   },
   async loadPersonal(){
    verify();const snap=await store.getDoc(store.doc(db,'users',user.uid,'private','profile'));
    if(!snap.exists())return null;
    const d=snap.data();
    if(d.format!=='sovereign-lab-personal'||d.schema!==1||d.workspace?.schema!==1)throw Error('Unsupported cloud backup version.');
    return d.workspace;
   }
 };
 if(status==='unconfigured')return;
 (async()=>{
  const root='https://www.gstatic.com/firebasejs/13.3.0/';
  const [apps,a,f]=await Promise.all([import(root+'firebase-app.js'),import(root+'firebase-auth.js'),import(root+'firebase-firestore.js')]);
  authSdk=a;store=f;
  const inst=apps.initializeApp(config);auth=a.getAuth(inst);db=f.getFirestore(inst);
  a.onAuthStateChanged(auth,u=>{user=u;status=u?'signed-in':'signed-out';notify()},err=>{status='error';console.error(err);notify()});
 })().catch(err=>{status='error';console.error('Firebase startup failed',err);notify()});
})();
