/* Trusted administrative provisioning. Never include a service account in GitHub.
   Example:
   GOOGLE_APPLICATION_CREDENTIALS=/secure/key.json CONFIRM_MEMBERSHIP=YES \
   node scripts/provision-member.mjs org-id uid employee
*/
import {initializeApp,applicationDefault} from 'firebase-admin/app';
import {getAuth} from 'firebase-admin/auth';
import {getFirestore} from 'firebase-admin/firestore';
const [org,uid,role,scopeFlag,...reviewEmployeeUids]=process.argv.slice(2);
if(!org||!uid||!['employee','manager','hr','admin'].includes(role))throw Error('Usage: provision-member.mjs ORGANIZATION_ID FIREBASE_UID employee|manager|hr|admin [--review-scope EMPLOYEE_UID ...]');
if(!/^[A-Za-z0-9_-]{3,48}$/.test(org))throw Error('Invalid organization ID');
if(scopeFlag&&(scopeFlag!=='--review-scope'||role!=='manager'))throw Error('Only manager provisioning accepts --review-scope.');
const validUid=value=>value.length>0&&value.length<=128&&!value.includes('/')&&!['.','..'].includes(value);
if(!validUid(uid)||reviewEmployeeUids.some(employee=>!validUid(employee)||employee===uid))
 throw Error('Provide valid Firebase UIDs for the manager and distinct members in the scope.');
if(!process.env.GOOGLE_APPLICATION_CREDENTIALS)throw Error('Provide secure GOOGLE_APPLICATION_CREDENTIALS outside this repository.');
if(process.env.CONFIRM_MEMBERSHIP!=='YES')throw Error('Administrator must verify user and set CONFIRM_MEMBERSHIP=YES');
initializeApp({credential:applicationDefault()});
const user=await getAuth().getUser(uid);
if(!user.emailVerified||!user.email||/@(gmail|googlemail)\.com$/i.test(user.email))throw Error('Require verified work email, not Gmail');
if(!user.providerData?.some(p=>p.providerId==='google.com'))throw Error('Require Google identity provider');
const db=getFirestore(),members=db.collection('organizations/'+org+'/members');
await db.runTransaction(async transaction=>{
 const membership={
  email:user.email,role,active:true,name:user.displayName||user.email,provisionedAt:new Date()
 };
 const memberRef=members.doc(uid),existing=await transaction.get(memberRef);
 if(!existing.exists)Object.assign(membership,{team:'Unassigned',department:'Unassigned'});
 if(role!=='manager')membership.reviewEmployeeUids=[];
 if(scopeFlag){
  const requested=[...new Set(reviewEmployeeUids)];
  if(requested.length){
   const allowed=await transaction.getAll(...requested.map(employee=>members.doc(employee)));
   if(allowed.some(employee=>!employee.exists||employee.data().active!==true))
    throw Error('Every reporting-scope UID must be an active member of this organization.');
  }
  membership.reviewEmployeeUids=requested;
 }
 transaction.set(memberRef,membership,{merge:true});
});
console.log('Provisioned',org,uid,role);
