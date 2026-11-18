/* Firestore access-control integration tests. Run under Firebase emulator. */
const assert=require('node:assert/strict');
const fs=require('node:fs');
const {initializeTestEnvironment,assertSucceeds,assertFails}=require('@firebase/rules-unit-testing');
const {doc,setDoc,getDoc,serverTimestamp,updateDoc,addDoc,collection}=require('firebase/firestore');
const rules=fs.readFileSync('firestore.rules','utf8');
(async()=>{
 const env=await initializeTestEnvironment({projectId:'sovereign-lab-security-test',firestore:{rules}});
 try{
  const auth=(uid,email)=>env.authenticatedContext(uid,{email,email_verified:true,firebase:{sign_in_provider:'google.com'}}).firestore();
  const employee=auth('e1','employee@acme.example'),manager=auth('m1','manager@acme.example'),
   hr=auth('h1','hr@acme.example'),stranger=auth('x1','outsider@other.example'),
   gmail=auth('x2','outsider@gmail.com');
  await env.withSecurityRulesDisabled(async context=>{
   const db=context.firestore();
   for(const [uid,email,role] of [['e1','employee@acme.example','employee'],['m1','manager@acme.example','manager'],['h1','hr@acme.example','hr']])
    await setDoc(doc(db,'organizations/acme/members',uid),{email,role,active:true,name:uid});
   await setDoc(doc(db,'organizations/acme/reviews/r1'),{
     employeeUid:'e1',managerUid:'m1',cycle:'2026 test',status:'open',createdBy:'h1',createdAt:new Date()
   });
  });
  const review='organizations/acme/reviews/r1';
  const own=doc(employee,review+'/submissions/e1');
  const other=doc(manager,review+'/submissions/m1');
  const evidence={comprehension:{score:2,evidence:'Observed an actual completed task'},evaluation:{score:3,evidence:'Reviewed competing arguments and evidence'},execution:{score:3,evidence:'Delivered agreed work to deadline'}};
  await assertSucceeds(getDoc(doc(employee,'organizations/acme/members/e1')));
  await assertFails(getDoc(doc(stranger,review)));
  await assertFails(getDoc(doc(gmail,review)));
  await assertSucceeds(setDoc(own,{authorUid:'e1',ratings:evidence,submitted:false,updatedAt:serverTimestamp()}));
  await assertFails(getDoc(doc(manager,review+'/submissions/e1')));
  await assertFails(getDoc(doc(hr,review+'/submissions/e1')));
  await assertFails(updateDoc(doc(hr,review),{status:'finalized',finalizedBy:'h1',finalizedAt:serverTimestamp()}));
  await assertSucceeds(setDoc(other,{authorUid:'m1',ratings:evidence,submitted:true,updatedAt:serverTimestamp()}));
  await assertFails(getDoc(doc(employee,review+'/submissions/m1')));
  await assertSucceeds(setDoc(own,{authorUid:'e1',ratings:evidence,submitted:true,updatedAt:serverTimestamp()}));
  await assertSucceeds(getDoc(doc(manager,review+'/submissions/e1')));
  await assertSucceeds(getDoc(doc(employee,review+'/submissions/m1')));
  await assertSucceeds(getDoc(doc(hr,review+'/submissions/m1')));
  await assertFails(setDoc(own,{authorUid:'e1',ratings:evidence,submitted:true,updatedAt:serverTimestamp()}));
  await assertSucceeds(addDoc(collection(employee,review+'/discussion'),{authorUid:'e1',text:'We agree to revisit one capability next month.',createdAt:serverTimestamp()}));
  await assertSucceeds(updateDoc(doc(hr,review),{status:'finalized',finalizedBy:'h1',finalizedAt:serverTimestamp()}));
  assert.ok(true);
  console.log('All Firestore role, embargo and finalization tests passed');
 }finally{await env.cleanup()}
})().catch(err=>{console.error(err);process.exitCode=1});
