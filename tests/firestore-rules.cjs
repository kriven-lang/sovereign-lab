/* Firestore access-control integration tests. Run under Firebase emulator. */
const assert=require('node:assert/strict');
const fs=require('node:fs');
const {initializeTestEnvironment,assertSucceeds,assertFails}=require('@firebase/rules-unit-testing');
const {doc,setDoc,getDoc,getDocFromServer,getDocs,getDocsFromServer,query,where,serverTimestamp,updateDoc,addDoc,collection}=require('firebase/firestore');
const rules=fs.readFileSync('firestore.rules','utf8');
(async()=>{
 const env=await initializeTestEnvironment({projectId:'sovereign-lab-security-test',firestore:{rules}});
 try{
  const auth=(uid,email)=>env.authenticatedContext(uid,{email,email_verified:true,firebase:{sign_in_provider:'google.com'}}).firestore();
  const employee=auth('e1','employee@acme.example'),manager=auth('m1','manager@acme.example'),
   hr=auth('h1','hr@acme.example'),stranger=auth('x1','outsider@other.example'),
   gmail=auth('x2','outsider@gmail.com'),supervisor=auth('s1','supervisor@acme.example'),
   otherSupervisor=auth('s2','other-supervisor@acme.example');
  await env.withSecurityRulesDisabled(async context=>{
   const db=context.firestore();
   for(const [uid,email,role] of [['e1','employee@acme.example','employee'],['m1','manager@acme.example','manager'],['h1','hr@acme.example','hr']])
    await setDoc(doc(db,'organizations/acme/members',uid),{email,role,active:true,name:uid});
   await setDoc(doc(db,'organizations/acme/reviews/r1'),{
     employeeUid:'e1',managerUid:'m1',cycle:'2026 test',status:'open',createdBy:'h1',createdAt:new Date()
   });
   await setDoc(doc(db,'organizations/acme/members/s1'),{email:'supervisor@acme.example',role:'manager',active:true,reviewEmployeeUids:['e1','e2']});
   await setDoc(doc(db,'organizations/acme/members/s2'),{email:'other-supervisor@acme.example',role:'manager',active:true,reviewEmployeeUids:['e3']});
   const archived={managerUid:'m1',cycle:'Earlier synthetic cycle',status:'finalized',createdBy:'h1',createdAt:new Date()};
   await setDoc(doc(db,'organizations/acme/reviews/r2'),{...archived,employeeUid:'e2'});
   await setDoc(doc(db,'organizations/acme/reviews/r3'),{...archived,employeeUid:'e3'});
   await setDoc(doc(db,'organizations/other/reviews/r1'),{...archived,employeeUid:'e1'});
   await setDoc(doc(db,'organizations/acme/reviews/r2/submissions/e2'),{authorUid:'e2',ratings:{},submitted:false});
  });
  const review='organizations/acme/reviews/r1';
  const own=doc(employee,review+'/submissions/e1');
  const other=doc(manager,review+'/submissions/m1');
  const supervisorReviews=collection(supervisor,'organizations/acme/reviews');
  const scopedHistory=ids=>query(supervisorReviews,where('employeeUid','in',ids),where('status','==','finalized'));
  const evidence={comprehension:{score:2,evidence:'Observed an actual completed task'},evaluation:{score:3,evidence:'Reviewed competing arguments and evidence'},execution:{score:3,evidence:'Delivered agreed work to deadline'}};
  const fullRatings={...evidence};
  for(const id of ['generation','reframing','metacognition','observation','experimentation','construction','transformation','honesty','accountability','fairness','courage','discernment','stewardship']){
   fullRatings[id]={score:2,evidence:'Synthetic evidence for '+id};
  }
  await assertSucceeds(getDoc(doc(employee,'organizations/acme/members/e1')));
  await assertFails(getDoc(doc(stranger,review)));
  await assertFails(getDoc(doc(gmail,review)));
  await assertFails(getDoc(doc(supervisor,review)));
  const assignment={employeeUid:'e1',managerUid:'m1',cycle:'Synthetic repeat cycle',status:'open',createdAt:serverTimestamp()};
  await assertFails(setDoc(doc(supervisor,'organizations/acme/reviews/assigned'),{...assignment,createdBy:'s1'}));
  await assertSucceeds(setDoc(doc(hr,'organizations/acme/reviews/assigned'),{...assignment,createdBy:'h1'}));
  await assertSucceeds(setDoc(own,{authorUid:'e1',ratings:evidence,submitted:false,updatedAt:serverTimestamp()}));
  await assertFails(getDoc(doc(supervisor,review+'/submissions/e1')));
  await assertFails(getDoc(doc(manager,review+'/submissions/e1')));
  await assertFails(getDoc(doc(hr,review+'/submissions/e1')));
  await assertFails(updateDoc(doc(hr,review),{status:'finalized',finalizedBy:'h1',finalizedAt:serverTimestamp()}));
  await assertFails(setDoc(other,{authorUid:'m1',ratings:{...fullRatings,stewardship:null},submitted:true,updatedAt:serverTimestamp()}));
  await assertFails(setDoc(other,{authorUid:'m1',ratings:{...fullRatings,stewardship:{score:2,evidence:'Too short'}},submitted:true,updatedAt:serverTimestamp()}));
  await assertFails(setDoc(other,{authorUid:'m1',ratings:{...fullRatings,stewardship:{...fullRatings.stewardship,score:5}},submitted:true,updatedAt:serverTimestamp()}));
  await assertFails(setDoc(other,{authorUid:'m1',ratings:{...fullRatings,stewardship:{...fullRatings.stewardship,extra:true}},submitted:true,updatedAt:serverTimestamp()}));
  await assertSucceeds(setDoc(other,{authorUid:'m1',ratings:fullRatings,submitted:true,updatedAt:serverTimestamp()}));
  await assertFails(getDoc(doc(employee,review+'/submissions/m1')));
  await assertSucceeds(setDoc(own,{authorUid:'e1',ratings:fullRatings,submitted:false,updatedAt:serverTimestamp()}));
  await assertSucceeds(setDoc(own,{authorUid:'e1',ratings:fullRatings,submitted:true,updatedAt:serverTimestamp()}));
  await assertSucceeds(getDoc(doc(manager,review+'/submissions/e1')));
  const managerSubmission=await assertSucceeds(getDoc(doc(employee,review+'/submissions/m1')));
  assert.deepEqual(managerSubmission.data().ratings,fullRatings);
  await assertSucceeds(getDoc(doc(hr,review+'/submissions/m1')));
  await assertFails(getDoc(doc(supervisor,review+'/submissions/e1')));
  await assertFails(updateDoc(doc(supervisor,review),{status:'finalized',finalizedBy:'s1',finalizedAt:serverTimestamp()}));
  await assertFails(setDoc(own,{authorUid:'e1',ratings:evidence,submitted:true,updatedAt:serverTimestamp()}));
  await assertSucceeds(addDoc(collection(employee,review+'/discussion'),{authorUid:'e1',text:'We agree to revisit one capability next month.',createdAt:serverTimestamp()}));
  await assertSucceeds(updateDoc(doc(hr,review),{status:'finalized',finalizedBy:'h1',finalizedAt:serverTimestamp()}));
  await assertSucceeds(getDoc(doc(supervisor,review)));
  await assertSucceeds(getDoc(doc(supervisor,review+'/submissions/e1')));
  await assertSucceeds(getDoc(doc(supervisor,review+'/submissions/m1')));
  await assertFails(getDoc(doc(supervisor,'organizations/acme/reviews/r2/submissions/e2')));
  await assertFails(getDoc(doc(supervisor,'organizations/acme/reviews/r3')));
  await assertFails(getDoc(doc(supervisor,'organizations/other/reviews/r1')));
  await assertFails(getDoc(doc(otherSupervisor,review)));
  await assertFails(getDocs(collection(supervisor,review,'discussion')));
  await assertFails(addDoc(collection(supervisor,review,'discussion'),{authorUid:'s1',text:'Synthetic out-of-scope note.',createdAt:serverTimestamp()}));
  await assertFails(getDocs(collection(supervisor,review,'submissions')));
  await assertFails(getDocs(supervisorReviews));
  await assertFails(getDocs(query(supervisorReviews,where('employeeUid','==','e1'))));
  await assertFails(getDocs(scopedHistory(['e1','e3'])));
  const authorizedHistory=await assertSucceeds(getDocs(scopedHistory(['e1','e2'])));
  assert.deepEqual(authorizedHistory.docs.map(snapshot=>snapshot.id).sort(),['r1','r2']);
  await assertFails(updateDoc(doc(supervisor,'organizations/acme/members/s1'),{reviewEmployeeUids:['e1','e2','e3']}));
  await env.withSecurityRulesDisabled(context=>updateDoc(doc(context.firestore(),'organizations/acme/members/s1'),{reviewEmployeeUids:[]}));
  await assertFails(getDocFromServer(doc(supervisor,review)));
  await assertFails(getDocFromServer(doc(supervisor,review+'/submissions/e1')));
  await assertFails(getDocsFromServer(scopedHistory(['e1','e2'])));
  console.log('All Firestore role, embargo, finalization and scoped-history tests passed');
 }finally{await env.cleanup()}
})().catch(err=>{console.error(err);process.exitCode=1});
