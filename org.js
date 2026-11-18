
/* Organization reviews. All authorization is enforced again by Firestore rules.
   Client-side hiding is not security. See docs/ORG_SETUP.md. */
(function(){
'use strict';
const state={orgId:'',member:null,reviews:[],selected:null,own:null,other:null,comments:[],members:[],draft:{},assessmentStep:0,editingSummary:false,assessmentError:'',assessmentMessage:'',loading:false,error:'',message:''};
let sdk=null;
const cloud=()=>window.SOVEREIGN_CLOUD;
const me=()=>cloud()?.user;
const caps=()=>window.SOVEREIGN_DATA?.capabilities||[];
const rubric=()=>window.SOVEREIGN_RUBRIC;
const hasScore=entry=>entry?.score!==null&&entry?.score!==undefined&&entry?.score!=='';
const hasEvidence=entry=>String(entry?.evidence||'').trim().length>=12;
const esc=v=>String(v??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const notice=(message,warning=false)=>'<div class="notice'+(warning?' warning':'')+'">'+esc(message)+'</div>';
const path=(...p)=>['organizations',state.orgId,...p];
const isHr=()=>['hr','admin'].includes(state.member?.role);
const isParticipant=r=>r&&(r.employeeUid===me()?.uid||r.managerUid===me()?.uid);
function clearSelection(){
 state.selected=null;state.own=null;state.other=null;state.comments=[];state.draft={};
 state.assessmentStep=0;state.editingSummary=false;state.assessmentError='';state.assessmentMessage='';
}
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
  state.member=snap.data();clearSelection();
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
 const orgId=state.orgId,uid=me().uid;
 const snap=await sdk.getDoc(dref('reviews',id));
 if(state.orgId!==orgId||me()?.uid!==uid)return;
 if(!snap.exists())throw Error('Review does not exist or is not authorized.');
 clearSelection();
 const r=state.selected={id,...snap.data()};
 if(isParticipant(r)){
  const mine=await sdk.getDoc(dref('reviews',id,'submissions',uid));
  if(state.selected!==r)return;
  if(mine.exists()){
   state.own=mine.data();state.draft=JSON.parse(JSON.stringify(state.own.ratings||{}));
   const next=caps().findIndex(c=>!hasScore(state.draft[c.id])||!hasEvidence(state.draft[c.id]));
   state.assessmentStep=next===-1?caps().length:next;
  }
 }
 if(isParticipant(r)?state.own?.submitted:isHr()){
  // The other participant's data can be fetched ONLY after both have submitted.
  try{
   const ids=isParticipant(r)?[uid===r.employeeUid?r.managerUid:r.employeeUid]:[r.employeeUid,r.managerUid];
   const snapshots=await Promise.all(ids.map(i=>sdk.getDoc(dref('reviews',id,'submissions',i))));
   if(state.selected!==r)return;
   if(isParticipant(r)){
    state.other=snapshots[0].exists()?snapshots[0].data():null;
   }else if(snapshots.every(s=>s.exists())){
    state.own=snapshots[0].data();state.other=snapshots[1].data();
   }
  }catch(err){if(err?.code!=='permission-denied')console.info('Second submission not yet available',err)}
  if(state.selected!==r)return;
  if(state.own?.submitted&&state.other?.submitted){
   try{
    const entries=await sdk.getDocs(crefs('reviews',id,'discussion'));
    if(state.selected!==r)return;
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
  if(hasScore(entry)){
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
  if(state.assessmentStep!==caps().length)throw Error('Review the assessment before submitting.');
  if(keys.length<3)throw Error('Assess at least three capabilities before submitting.');
  for(const c of caps())if(ratings[c.id]&&!hasEvidence(ratings[c.id]))throw Error('Provide at least 12 characters of evidence for '+c.name+'.');
  if(!confirm('Submit and permanently lock your independent assessment? You cannot edit it after submission.'))return;
 }
 const authorUid=me().uid;
 await sdk.setDoc(dref('reviews',r.id,'submissions',authorUid),{
  authorUid,ratings,submitted:!!submit,updatedAt:sdk.serverTimestamp()
 });
 if(state.selected!==r||me()?.uid!==authorUid)return;
 state.own={authorUid,ratings,submitted:!!submit};
 if(submit){
  state.message='Submission locked. The comparison unlocks only when both participants submit.';
  await openReview(r.id);
 }else{
  state.assessmentMessage='Draft saved privately.';
 }
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
 const issue=state.error?notice(state.error,true):'';
 state.error='';
 if(!state.member&&issue)return '<div class="portal-hero"><div class="eyebrow">ORGANIZATION WORKSPACE</div><h1 class="headline">Access & <em>reviews.</em></h1>'+issue+startForm()+'</div>';
 if(!state.member)return '<div class="portal-hero"><div class="eyebrow">ORGANIZATION WORKSPACE</div><h1 class="headline">Verified <em>membership.</em></h1><p class="lead">Enter your HR-provided organization ID. Your Google account must match an approved member record.</p>'+startForm()+'</div>';
 const header='<div class="portal-hero"><div class="eyebrow">ORGANIZATION / '+esc(state.orgId)+' · '+esc(state.member.role?.toUpperCase())+'</div>'+
 '<h1 class="headline">Review with <em>evidence.</em></h1><p class="lead">Draft independently. Submit only when ready. Both assessments become visible together, followed by a documented discussion.</p>'+
 '<div class="btnrow"><button class="action-btn secondary" data-org="refresh">Refresh reviews</button>'+
 '<button class="action-btn secondary" data-org="leave">Switch organization</button></div>'+
 issue+(state.message?notice(state.message):'')+
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
function levelLabel(id,entry){
 return rubric().label(id,entry?.score);
}
function comparePanel(){
 if(!state.own?.submitted||!state.other?.submitted)return notice('Independent submissions are still embargoed. Comparison unlocks after both assigned participants have submitted.');
 const selfIsEmployee=state.own.authorUid===state.selected.employeeUid;
 const employee=selfIsEmployee?state.own:state.other,manager=selfIsEmployee?state.other:state.own;
 const rows=caps().filter(c=>employee.ratings?.[c.id]||manager.ratings?.[c.id]).map(c=>{
  const left=employee.ratings?.[c.id],right=manager.ratings?.[c.id];
  return '<div class="review-row"><div><strong>'+esc(c.name)+'</strong><p>Employee · '+esc(levelLabel(c.id,left))+(left?' · '+esc(left.evidence):'')+'</p>'+
   '<p>Manager · '+esc(levelLabel(c.id,right))+(right?' · '+esc(right.evidence):'')+'</p></div>'+
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
function assessmentSummary(locked){
 const entries=caps();
 const rated=entries.filter(c=>hasScore(state.draft[c.id]));
 const incomplete=rated.some(c=>!hasEvidence(state.draft[c.id]));
 const issue=rated.length<3?'Assess at least three capabilities before submitting.':incomplete?'Add at least 12 characters of evidence for each assessed capability.':'';
 const rows=entries.map((c,index)=>{
  const entry=state.draft[c.id];
  const details=hasScore(entry)?'<p>'+esc(entry.evidence||'')+'</p>'+(!hasEvidence(entry)&&!locked?'<p>Supporting evidence needed</p>':''):'';
  return '<div class="list-row"><div><strong>'+esc(c.name)+'</strong><p>'+esc(levelLabel(c.id,entry))+'</p>'+details+'</div>'+
   (locked?'':'<button class="action-btn secondary" data-org="edit-assessment" data-step="'+index+'" aria-label="Edit '+esc(c.name)+'">Edit</button>')+'</div>';
 }).join('');
 return '<div class="card">'+
  '<p>'+rated.length+' of '+entries.length+' capabilities assessed.</p>'+rows+
  (locked?'':(issue?notice(issue,true):'')+
  '<div class="btnrow space-top"><button class="action-btn secondary" data-org="previous-assessment">Previous</button>'+
  '<button class="action-btn secondary" data-org="save">Save private draft</button>'+
  '<button class="action-btn" data-org="submit"'+(issue?' disabled':'')+'>Submit and lock assessment</button></div>')+'</div>';
}
function assessmentQuestion(c){
 const total=caps().length,step=state.assessmentStep,entry=state.draft[c.id]||{};
 const axis=window.SOVEREIGN_DATA?.axes.find(item=>item.id===c.axis);
 const evidenceId='org-evidence-'+c.id,ratingId='org-rating-'+c.id;
 const nextLabel=state.editingSummary?'Back to review':step===total-1?'Review assessment':'Continue';
 return '<div class="card assessment-panel"><div class="assessment-progress"><span>'+esc(axis?.name)+'</span><span>Capability '+(step+1)+' of '+total+'</span></div>'+
  '<progress class="assessment-progress-bar" max="'+total+'" value="'+(step+1)+'" aria-label="Assessment progress"></progress>'+
  '<div class="assessment-heading"><h3 id="org-assessment-question" tabindex="-1">'+esc(c.name)+'</h3>'+rubric().help(c.id,'org')+'</div><p>'+esc(c.desc)+'</p>'+
  '<div class="field assessment-rating"><label for="'+esc(ratingId)+'">Observed proficiency</label>'+
  '<select class="input" id="'+esc(ratingId)+'" data-org-rating="'+esc(c.id)+'">'+rubric().options(c.id,entry.score)+'</select></div>'+
  '<div class="field space-top"><label for="'+esc(evidenceId)+'">Evidence from observed work</label>'+
  '<textarea class="input" id="'+esc(evidenceId)+'" rows="3" maxlength="2000" aria-describedby="org-evidence-hint" data-org-evidence="'+esc(c.id)+'">'+esc(entry.evidence||'')+'</textarea>'+
  '<p class="hint" id="org-evidence-hint">Include at least 12 characters of specific evidence. Evidence is saved with a selected level.</p></div>'+
  (state.assessmentError?'<div role="alert">'+notice(state.assessmentError,true)+'</div>':'')+
  '<div class="btnrow assessment-actions">'+(step?'<button class="action-btn secondary" data-org="previous-assessment">Previous</button>':'')+
  '<button class="action-btn secondary" id="org-assessment-skip" data-org="skip-assessment"'+(hasScore(entry)?' hidden':'')+'>Leave unassessed</button>'+
  '<button class="action-btn secondary" data-org="save">Save private draft</button>'+
  '<button class="action-btn" data-org="next-assessment">'+nextLabel+'</button></div></div>';
}
function assessmentPanel(locked){
 const c=caps()[state.assessmentStep],summary=locked||!c;
 const title=locked?'Your locked assessment':summary?'Review your assessment':'Your independent assessment';
 return '<section class="org-assessment"><div class="section-head"><h2 id="org-assessment-title" tabindex="-1">'+title+'</h2></div>'+
  notice(locked?'Your submission is locked.':'Only you can read this draft until both participants submit.')+
  (state.assessmentMessage?'<div role="status">'+notice(state.assessmentMessage)+'</div>':'')+
  (summary?assessmentSummary(locked):assessmentQuestion(c))+'</section>';
}
function editAssessmentStep(step,editingSummary=false){
 state.assessmentStep=step;state.editingSummary=editingSummary;
 state.assessmentError='';state.assessmentMessage='';
 notify();(document.getElementById('org-assessment-question')||document.getElementById('org-assessment-title'))?.focus();
}
function advanceAssessment(skip){
 const c=caps()[state.assessmentStep];
 if(!c)return;
 const entry=state.draft[c.id];
 if(skip){
  if(hasScore(entry))return;
  state.draft[c.id]={score:null,evidence:entry?.evidence||''};
 }else if(!hasScore(entry)||!hasEvidence(entry)){
  state.assessmentError=hasScore(entry)?'Add at least 12 characters of supporting evidence to continue.':'Choose a proficiency level or skip this capability as unassessed.';
  notify();
  document.getElementById((hasScore(entry)?'org-evidence-':'org-rating-')+c.id)?.focus();
  return;
 }
 editAssessmentStep(state.editingSummary?caps().length:state.assessmentStep+1);
}
function reviewPanel(){
 const r=state.selected,participant=isParticipant(r),isLocked=state.own?.submitted||r.status==='finalized';
 return '<div class="section-head"><h2>Selected review: '+esc(r.cycle)+'</h2></div>'+
 '<div class="notice">Employee '+esc(r.employeeUid)+' · Manager '+esc(r.managerUid)+' · '+esc(r.status)+'</div>'+
 (participant?assessmentPanel(isLocked):'')+comparePanel();
}
async function run(fn){state.loading=true;state.error='';try{await fn();}catch(err){error(err);return}state.loading=false;notify();}
document.addEventListener('input',ev=>{
 const x=ev.target, id=x.dataset.orgEvidence||x.dataset.orgRating;
 if(!id||state.loading||!isParticipant(state.selected)||state.selected.status!=='open'||state.own?.submitted||caps()[state.assessmentStep]?.id!==id)return;
 if(!state.draft[id])state.draft[id]={score:null,evidence:''};
 if(x.dataset.orgEvidence)state.draft[id].evidence=x.value;
 else{
  state.draft[id].score=x.value===''?null:Number(x.value);
  const skip=document.getElementById('org-assessment-skip');
  if(skip)skip.hidden=hasScore(state.draft[id]);
 }
});
document.addEventListener('click',ev=>{
 const b=ev.target.closest('[data-org]');if(!b)return;
 const action=b.dataset.org;
 if(state.loading)return;
 if(action==='connect')return run(()=>connect(document.getElementById('org-id')?.value));
 if(action==='leave'){state.orgId='';state.member=null;state.reviews=[];clearSelection();notify();return}
 if(action==='refresh')return run(async()=>{
  const review=state.selected;
  await refresh();
  if(review&&state.selected===review&&(!isParticipant(review)||state.own?.submitted))await openReview(review.id);
 });
 if(action==='create')return run(()=>createReview(document.getElementById('org-employee')?.value,document.getElementById('org-manager')?.value,document.getElementById('org-cycle')?.value));
 if(action==='open')return run(()=>openReview(b.dataset.id));
 if(isParticipant(state.selected)&&state.selected.status==='open'&&!state.own?.submitted){
  if(action==='previous-assessment'&&state.assessmentStep>0)return editAssessmentStep(state.assessmentStep-1);
  if(action==='next-assessment'||action==='skip-assessment')return advanceAssessment(action==='skip-assessment');
  if(action==='edit-assessment'&&state.assessmentStep===caps().length&&caps()[Number(b.dataset.step)])return editAssessmentStep(Number(b.dataset.step),true);
 }
 if(action==='save')return run(()=>saveDraft(false));
 if(action==='submit')return run(()=>saveDraft(true));
 if(action==='comment')return run(()=>discuss(document.getElementById('org-comment')?.value));
 if(action==='finalize')return run(()=>finalize());
});
window.addEventListener('sovereign-auth-change',()=>{state.orgId='';state.member=null;state.reviews=[];clearSelection();notify()});
window.SOVEREIGN_ORG={render,get state(){return state},connect,refresh,openReview};
notify();
})();
