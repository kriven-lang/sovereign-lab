/* Trusted administrative provisioning. Never include a service account in GitHub.
   Example:
   GOOGLE_APPLICATION_CREDENTIALS=/secure/key.json CONFIRM_MEMBERSHIP=YES \
   node scripts/provision-member.mjs org-id uid employee
*/
import {initializeApp,applicationDefault} from 'firebase-admin/app';
import {getAuth} from 'firebase-admin/auth';
import {getFirestore} from 'firebase-admin/firestore';
const [org,uid,role]=process.argv.slice(2);
if(!org||!uid||!['employee','manager','hr','admin'].includes(role))throw Error('Usage: provision-member.mjs ORGANIZATION_ID FIREBASE_UID employee|manager|hr|admin');
if(!/^[A-Za-z0-9_-]{3,48}$/.test(org))throw Error('Invalid organization ID');
if(!process.env.GOOGLE_APPLICATION_CREDENTIALS)throw Error('Provide secure GOOGLE_APPLICATION_CREDENTIALS outside this repository.');
if(process.env.CONFIRM_MEMBERSHIP!=='YES')throw Error('Administrator must verify user and set CONFIRM_MEMBERSHIP=YES');
initializeApp({credential:applicationDefault()});
const user=await getAuth().getUser(uid);
if(!user.emailVerified||!user.email||/@(gmail|googlemail)\.com$/i.test(user.email))throw Error('Require verified work email, not Gmail');
if(!user.providerData?.some(p=>p.providerId==='google.com'))throw Error('Require Google identity provider');
const membership={
 email:user.email,role,active:true,name:user.displayName||user.email,
 team:'Unassigned',department:'Unassigned',provisionedAt:new Date()
};
await getFirestore().doc('organizations/'+org+'/members/'+uid).set(membership,{merge:true});
console.log('Provisioned',org,uid,role);
