
/* Organization reviews. All authorization is enforced again by Firestore rules.
   Client-side hiding is not security. See docs/ORG_SETUP.md. */
(function(){
'use strict';
const state={orgId:'',member:null,reviews:[],selected:null,own:null,other:null,comments:[],members:[],draft:{},loading:false,error:'',message:''};
let sdk=null;
const cloud=()=>window.SOVEREIGN_CLOUD;
const me=()=>cloud()?.user;
const caps=()=>window.SOVEREIGN_DATA?.capabilities||[];
const esc=v=>String(v??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const notice=(message,warning=false)=>'<div class="notice'+(warning?' warning':'')+'">'+esc(message)+'</div>';
const path=(...p)=>['organizations',state.orgId,...p];
const isHr=()=>['hr','admin'].includes(state.member?.role);
const isParticipant=r=>r&&(r.employeeUid===me()?.uid||r.managerUid===me()?.uid);
function notify(){window.dispatchEvent(new CustomEvent('sovereign-org-change'))}
function error(err){state.error=err?.message||String(err);state.loading=false;notify();}
async function prepare(){
 const c=cloud();
 if(!c?.db||!c.user||!c.isWorkEmail(c.user.email))throw Error('Sign in with an organizational Google account.');
 if(!sdk)sdk=await import('https://www.gstatic.com/firebasejs/13.3.0/firebase-firestore.js');
 return c.db;
}
function dref(...p){return sdk.doc(cloud().db,...path(...p))}
function crefs(...p){return sdk.collection(cloud().db,...path(...p))}
async function connect(orgId){
 state.loading=true;state.error='';notify();
 try{
  await prepare();
  const id=String(orgId||'').trim();
  if(!/^[A-Za-z0-9_-]{3,48}$/.test(id))throw Error('Enter the organization ID given to you by HR (3–48 letters, numbers, _ or -).');
  state.orgId=id;
  const snap=await sdk.getDoc(dref('members',me().uid));
  if(!snap.exists()||snap.data().active!==true)throw Error('You do not have an active membership for this organization. Ask HR for an invitation.');
  if(snap.data().email?.toLowerCase()!==me().email?.toLowerCase())throw Error('Your Google identity does not match the approved membership.');
  state.member=snap.data();state.selected=null;state.own=null;state.other=null;state.draft={};
  await refresh();
  if(isHr())await loadMembers();
  state.message='Membership verified. Reviews are limited to your authorized scope.';
 }catch(err){state.member=null;state.orgId='';error(err);return}
 state.loading=false;notify();
}
async function loadMembers(){
 if(!isHr())return;
 const snap=await sdk.getDocs(crefs('members'));
 state.members=snap.docs.map(d=>({uid:d.id,...d.data()}));
}
async function refresh(){
 await prepare();
 if(!state.member)throw Error('Connect to your authorized organization first.');
 const c=crefs('reviews'),uid=me().uid;
 const snapshots=isHr()?[await sdk.getDocs(c)]:
 await Promise.all([
  sdk.getDocs(sdk.query(c,sdk.where('employeeUid','==',uid))),
  sdk.getDocs(sdk.query(c,sdk.where('managerUid','==',uid)))
 ]);
 const unique=new Map();
 for(const snap of snapshots)for(const d of snap.docs)unique.set(d.id,{id:d.id,...d.data()});
 state.reviews=Array.from(unique.values()).sort((a,b)=>(b.createdAt?.seconds||0)-(a.createdAt?.seconds||0));
 notify();
}
async function createReview(employeeUid,managerUid,cycle){
 if(!isHr())throw Error('Only approved HR or organization admins can assign reviews.');
 if(!employeeUid||!managerUid||employeeUid===managerUid)throw Error('Choose two distinct, active employee and manager accounts.');
 const ep=state.members.find(m=>m.uid===employeeUid&&m.active);
 const mp=state.members.find(m=>m.uid===managerUid&&m.active&&['manager','hr','admin'].includes(m.role));
 if(!ep||!mp)throw Error('Both participants must be active members, and the reviewer must have a manager role.');
 const c=String(cycle||'').trim();
 if(c.length<3||c.length>100)throw Error('Review cycle name must contain 3–100 characters.');
 await sdk.addDoc(crefs('reviews'),{employeeUid,managerUid,cycle:c,status:'open',createdBy:me().uid,createdAt:sdk.serverTimestamp()});
 state.message='Review assigned. Both people can now submit independently.';
 await refresh();
}
async function openReview(id){
 await prepare();
 const snap=await sdk.getDoc(dref('reviews',id));
 if(!snap.exists())throw Error('Review does not exist or is not authorized.');
 state.selected={id,...snap.data()};state.own=null;state.other=null;state.comments=[];state.draft={};
 const r=state.selected,uid=me().uid;
 if(isParticipant(r)){
  const mine=await sdk.getDoc(dref('reviews',id,'submissions',uid));
  if(mine.exists()){state.own=mine.data();state.draft=JSON.parse(JSON.stringify(state.own.ratings||{}));}
 }
 if(isParticipant(r)||isHr()){
  // The other participant's data can be fetched ONLY after both have submitted.
  try{
   const ids=isParticipant(r)?[uid===r.employeeUid?r.managerUid:r.employeeUid]:[r.employeeUid,r.managerUid];
   const snapshots=await Promise.all(ids.map(i=>sdk.getDoc(dref('reviews',id,'submissions',i))));
   if(isParticipant(r)){
    state.other=snapshots[0].exists()?snapshots[0].data():null;
   }else if(snapshots.every(s=>s.exists())){
    state.own=snapshots[0].data();state.other=snapshots[1].data();
   }
  }catch(err){if(err?.code!=='permission-denied')console.info('Second submission not yet available',err)}
  if(state.own?.submitted&&state.other?.submitted){
   try{
    const entries=await sdk.getDocs(crefs('reviews',id,'discussion'));
    state.comments=entries.docs.map(d=>({id:d.id,...d.data()})).sort((x,y)=>(x.createdAt?.seconds||0)-(y.createdAt?.seconds||0));
   }catch(err){console.info('Discussion not available',err)}
  }
 }
 notify();
}
function collectDraft(){
 const d={};
 for(const c of caps()){
  const entry=state.draft[c.id];
  if(entry&&entry.score!==null&&entry.score!==undefined&&entry.score!==''){
   const number=Number(entry.score);
   if(!Number.isInteger(number)||number<0||number>4)throw Error('Invalid proficiency for '+c.name);
   d[c.id]={score:number,evidence:String(entry.evidence||'').slice(0,2000)};
  }
 }
 return d;
}
async function saveDraft(submit){
 const r=state.selected;
 if(!r||!isParticipant(r)||r.status!=='open')throw Error('Only an assigned participant can edit an open review.');
 if(state.own?.submitted)throw Error('This submission is locked.');
 const ratings=collectDraft(),keys=Object.keys(ratings);
 if(submit){
  if(keys.length<3)throw Error('Assess at least three capabilities before submitting.');
  for(const id of keys)if(ratings[id].evidence.trim().length<12)throw Error('Provide specific supporting evidence (at least 12 characters) for '+id);
  if(!confirm('Submit and permanently lock your independent assessment? You cannot edit it after submission.'))return;
 }
 await sdk.setDoc(dref('reviews',r.id,'submissions',me().uid),{
  authorUid:me().uid,ratings,submitted:!!submit,updatedAt:sdk.serverTimestamp()
 });
 state.message=submit?'Submission locked. The comparison unlocks only when both participants submit.':'Draft saved privately.';
 await openReview(r.id);
}
async function discuss(text){
 if(!state.selected||!state.own?.submitted||!state.other?.submitted)throw Error('Both submissions must be locked before reconciliation.');
 const msg=String(text||'').trim();
 if(msg.length<10||msg.length>2500)throw Error('Enter a discussion note of 10–2500 characters.');
 await sdk.addDoc(crefs('reviews',state.selected.id,'discussion'),{
  authorUid:me().uid,text:msg,createdAt:sdk.serverTimestamp()
 });
 state.message='Discussion note recorded with attribution.';
 await openReview(state.selected.id);
}
async function finalize(){
 if(!isHr()||!state.selected||state.selected.status!=='open')throw Error('Only HR can finalize an open review.');
 if(!state.own?.submitted||!state.other?.submitted)throw Error('Both independent submissions must be received.');
 if(!confirm('Finalize this review cycle? Its submitted evidence and discussion will remain on record.'))return;
 await sdk.updateDoc(dref('reviews',state.selected.id),{
  status:'finalized',finalizedBy:me().uid,finalizedAt:sdk.serverTimestamp()
 });
 state.message='Review finalized by HR.';
 await refresh();await openReview(state.selected.id);
}
function statusLine(r){return esc(r.cycle)+' · '+esc(r.status==='finalized'?'Finalized':'Open')}
function render(){
 if(state.error){const msg=state.error;state.error='';return '<div class="portal-hero"><div class="eyebrow">ORGANIZATION WORKSPACE</div><h1 class="headline">Access & <em>reviews.</em></h1>'+notice(msg,true)+startForm()+'</div>'}
 if(!state.member)return '<div class="portal-hero"><div class="eyebrow">ORGANIZATION WORKSPACE</div><h1 class="headline">Verified <em>membership.</em></h1><p class="lead">Enter your HR-provided organization ID. Your Google account must match an approved member record.</p>'+startForm()+'</div>';
 const header='<div class="portal-hero"><div class="eyebrow">ORGANIZATION / '+esc(state.orgId)+' · '+esc(state.member.role?.toUpperCase())+'</div>'+
 '<h1 class="headline">Review with <em>evidence.</em></h1><p class="lead">Draft independently. Submit only when ready. Both assessments become visible together, followed by a documented discussion.</p>'+
 '<div class="btnrow"><button class="action-btn secondary" data-org="refresh">Refresh reviews</button>'+
 '<button class="action-btn secondary" data-org="leave">Switch organization</button></div>'+
 (state.message?notice(state.message):'')+
 '<div class="notice warning"><strong>Integrity and instruction adherence:</strong> Review observed, context-specific conduct—not inherent morality or blind obedience. Legitimate dissent and refusal of unsafe directions must not be penalized. Scores require supporting evidence and can be challenged.</div>';
 const hr=isHr()?hrPanel():'';
 const list='<div class="section-head"><h2>Review assignments</h2></div><div class="card">'+
 (state.reviews.length?state.reviews.map(r=>'<div class="list-row"><div><strong>'+statusLine(r)+'</strong><div class="meta">Employee '+esc(r.employeeUid)+' · Manager '+esc(r.managerUid)+'</div></div><button class="action-btn secondary" data-org="open" data-id="'+esc(r.id)+'">Open</button></div>').join(''):'<p>No reviews assigned or visible in this organization.</p>')+'</div>';
 return header+hr+list+(state.selected?reviewPanel():'')+'</div>';
}
function startForm(){
 return '<div class="card"><h2>Organization access</h2><p>Personal Gmail accounts cannot enter this workspace. Email alone does not grant any rights.</p>'+
 '<label for="org-id">Organization ID</label><input class="input" id="org-id" maxlength="48" placeholder="Provided by your organization administrator">'+
 '<div class="btnrow space-top"><button class="action-btn" data-org="connect">Verify membership</button><button class="action-btn secondary" data-portal="home">Back to welcome</button></div></div>';
}
function hrPanel(){
 const options=state.members.filter(m=>m.active).map(m=>'<option value="'+esc(m.uid)+'">'+esc(m.name||m.email||m.uid)+' ('+esc(m.role||'employee')+')</option>').join('');
 return '<div class="section-head"><h2>HR review administration</h2></div>'+
 '<div class="card"><p>Assign an independent review to an active employee and authorized manager. Submitted records are immutable to participants.</p>'+
 '<div class="fields"><div class="field"><label>Employee</label><select class="input" id="org-employee"><option value="">Select employee</option>'+options+'</select></div>'+
 '<div class="field"><label>Manager</label><select class="input" id="org-manager"><option value="">Select manager</option>'+options+'</select></div>'+
 '<div class="field"><label>Cycle / period</label><input class="input" id="org-cycle" maxlength="100" placeholder="2026 Annual review"></div></div>'+
 '<button class="action-btn space-top" data-org="create">Assign review</button></div>';
}
function ratingOptions(value){
 return '<option value="">Not assessed</option>'+[0,1,2,3,4].map(i=>'<option value="'+i+'" '+(value!==null&&value!==undefined&&value!==''&&Number(value)===i?'selected':'')+'>'+i+'</option>').join('');
}
function comparePanel(){
 if(!state.own?.submitted||!state.other?.submitted)return notice('Independent submissions are still embargoed. Comparison unlocks after both assigned participants have submitted.');
 const selfIsEmployee=state.own.authorUid===state.selected.employeeUid;
 const employee=selfIsEmployee?state.own:state.other,manager=selfIsEmployee?state.other:state.own;
 const rows=caps().filter(c=>employee.ratings?.[c.id]||manager.ratings?.[c.id]).map(c=>{
  const left=employee.ratings?.[c.id],right=manager.ratings?.[c.id];
  return '<div class="review-row"><div><strong>'+esc(c.name)+'</strong><p>Employee: '+esc(left?.score??'—')+' · '+esc(left?.evidence||'Not assessed')+'</p>'+
   '<p>Manager: '+esc(right?.score??'—')+' · '+esc(right?.evidence||'Not assessed')+'</p></div>'+
   '<span class="tag">'+(left&&right?'Difference '+Math.abs(left.score-right.score):'Not comparable')+'</span></div>';
 }).join('');
 return '<div class="section-head"><h2>Shared comparison & reconciliation</h2></div>'+
 '<div class="card">'+(rows||'<p>No evaluated competencies.</p>')+'</div>'+
 '<div class="card"><h3>Review discussion history</h3>'+
 (state.comments.length?state.comments.map(x=>'<div class="list-row"><div><strong>'+esc(x.authorUid)+'</strong><p>'+esc(x.text)+'</p></div></div>').join(''):'<p class="muted">No reconciliation notes yet.</p>')+
 '<label class="space-top" for="org-comment">Clarification, disagreement, action or acknowledgment</label>'+
 '<textarea class="input" id="org-comment" rows="3" maxlength="2500" placeholder="Document the difference, evidence, next steps, or reservations."></textarea>'+
 '<div class="btnrow space-top"><button class="action-btn" data-org="comment">Add signed discussion note</button>'+
 (isHr()&&state.selected.status==='open'?'<button class="action-btn secondary" data-org="finalize">HR: finalize record</button>':'')+'</div></div>';
}
function reviewPanel(){
 const r=state.selected,participant=isParticipant(r),isLocked=state.own?.submitted||r.status==='finalized';
 let editor='';
 if(participant){
  editor='<div class="section-head"><h2>Your independent assessment</h2></div>'+
  '<div class="notice">'+(isLocked?'Your submission is locked.':'Only you can read this draft until both sides submit. Save as often as needed.')+'</div>'+
  '<div class="card">'+caps().map(c=>{
   const v=state.draft[c.id]||{};
   return '<div class="review-row"><div><h3>'+esc(c.name)+'</h3><p>'+esc(c.desc)+'</p>'+
    '<label>Evidence / context</label><textarea class="input" rows="2" maxlength="2000" data-org-evidence="'+esc(c.id)+'" '+(isLocked?'disabled':'')+'>'+esc(v.evidence||'')+'</textarea></div>'+
    '<div class="field"><label>Observed proficiency</label><select class="input" data-org-rating="'+esc(c.id)+'" '+(isLocked?'disabled':'')+'>'+ratingOptions(v.score)+'</select></div></div>';
  }).join('')+'</div>'+
  (!isLocked?'<div class="btnrow"><button class="action-btn secondary" data-org="save">Save private draft</button><button class="action-btn" data-org="submit">Submit and lock assessment</button></div>':'');
 }
 return '<div class="section-head"><h2>Selected review: '+esc(r.cycle)+'</h2></div>'+
 '<div class="notice">Employee '+esc(r.employeeUid)+' · Manager '+esc(r.managerUid)+' · '+esc(r.status)+'</div>'+
 editor+comparePanel();
}
async function run(fn){state.loading=true;state.error='';try{await fn();}catch(err){error(err);return}state.loading=false;notify();}
document.addEventListener('input',ev=>{
 const x=ev.target, id=x.dataset.orgEvidence||x.dataset.orgRating;
 if(!id)return;
 if(!state.draft[id])state.draft[id]={score:null,evidence:''};
 if(x.dataset.orgEvidence)state.draft[id].evidence=x.value;
 else state.draft[id].score=x.value===''?null:Number(x.value);
});
document.addEventListener('click',ev=>{
 const b=ev.target.closest('[data-org]');if(!b)return;
 const action=b.dataset.org;
 if(action==='connect')return run(()=>connect(document.getElementById('org-id')?.value));
 if(action==='leave'){state.orgId='';state.member=null;state.reviews=[];state.selected=null;notify();return}
 if(action==='refresh')return run(()=>refresh());
 if(action==='create')return run(()=>createReview(document.getElementById('org-employee')?.value,document.getElementById('org-manager')?.value,document.getElementById('org-cycle')?.value));
 if(action==='open')return run(()=>openReview(b.dataset.id));
 if(action==='save')return run(()=>saveDraft(false));
 if(action==='submit')return run(()=>saveDraft(true));
 if(action==='comment')return run(()=>discuss(document.getElementById('org-comment')?.value));
 if(action==='finalize')return run(()=>finalize());
});
window.addEventListener('sovereign-auth-change',()=>{state.orgId='';state.member=null;state.selected=null;state.reviews=[];state.own=null;state.other=null;state.draft={};notify()});
window.SOVEREIGN_ORG={render,get state(){return state},connect,refresh,openReview};
notify();
})();
