/* Sovereign Lab: intentionally dependency-free, offline-friendly, local-first. */
(function(){
'use strict';
const D=window.SOVEREIGN_DATA;
if(!D){document.getElementById('app').textContent='Framework data could not load.';return;}
const BASE_KEY='sovereign-lab-state-v1';
const authConfigured=!!(window.SOVEREIGN_FIREBASE_CONFIG?.apiKey&&window.SOVEREIGN_FIREBASE_CONFIG?.projectId);
let activeUser=null;
const storageKey=()=>activeUser?BASE_KEY+'-user-'+activeUser.uid:BASE_KEY;
function readLocal(k){try{return normalize(JSON.parse(localStorage.getItem(k)||'null'))}catch{return makeDefault()}}

const CAP=D.capabilities, TEMPLATES=D.templates;
const byId=id=>CAP.find(c=>c.id===id);
const template=id=>TEMPLATES.find(t=>t.id===id)||TEMPLATES[0];
const e=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const clamp=(v,min,max)=>Math.max(min,Math.min(max,Number(v)||0));
const asRating=v=>v===null||v===undefined||v===''?null:(Number.isInteger(Number(v))&&Number(v)>=0&&Number(v)<=4?Number(v):null);
const niceDate=iso=>{try{return new Date(iso).toLocaleDateString(undefined,{year:'numeric',month:'short',day:'numeric'})}catch{return 'Unknown date'}};
function makeDefault(){return {schema:1,goal:'founder',goalName:'Entrepreneurial builder',targets:{...template('founder').targets},pendingTemplate:'founder',assessments:{},history:[],plans:[],reflections:{},review:{person:'',observer:'',role:'dependable',ratings:{},notes:''}}}
function normalize(raw){
 const base=makeDefault();if(!raw||typeof raw!=='object'||raw.schema!==1)return base;
 base.goal=typeof raw.goal==='string'?raw.goal:base.goal;
 base.goalName=typeof raw.goalName==='string'?raw.goalName.slice(0,120):base.goalName;
 base.pendingTemplate=template(raw.pendingTemplate).id;
 for(const c of CAP){
  base.targets[c.id]=asRating(raw.targets?.[c.id])??base.targets[c.id];
  const a=raw.assessments?.[c.id];
  if(a&&typeof a==='object')base.assessments[c.id]={current:asRating(a.current),importance:clamp(a.importance??3,1,5),motivation:clamp(a.motivation??3,1,5),evidence:String(a.evidence||'').slice(0,5000)};
 }
 if(Array.isArray(raw.history))base.history=raw.history.slice(-100).filter(h=>h&&typeof h==='object').map(h=>({date:String(h.date||''),name:String(h.name||'').slice(0,120),goal:String(h.goal||''),targets:Object.fromEntries(CAP.map(c=>[c.id,asRating(h.targets?.[c.id])??0]))}));
 if(Array.isArray(raw.plans))base.plans=raw.plans.filter(id=>CAP.some(c=>c.id===id));
 for(const r of D.reflections)base.reflections[r.id]=String(raw.reflections?.[r.id]||'').slice(0,10000);
 const rv=raw.review||{};base.review.person=String(rv.person||'').slice(0,120);base.review.observer=String(rv.observer||'').slice(0,120);base.review.role=template(rv.role).id;base.review.notes=String(rv.notes||'').slice(0,6000);
 for(const c of CAP){const x=rv.ratings?.[c.id];if(x&&typeof x==='object')base.review.ratings[c.id]={current:asRating(x.current),evidence:String(x.evidence||'').slice(0,5000)}}
 return base;
}
let state=authConfigured?makeDefault():readLocal(BASE_KEY)
let axis='thought';let reviewAxis='thought';let toastTimer;
function save(){if(authConfigured&&!activeUser&&!window.SOVEREIGN_GUEST)return;try{localStorage.setItem(storageKey(),JSON.stringify(state))}catch{toast('Browser storage unavailable. Export a backup to preserve changes.')}}
function personalCloudWorkspace(){const {schema,goal,goalName,pendingTemplate,targets,assessments,history,plans}=state;return {schema,goal,goalName,pendingTemplate,targets,assessments,history,plans}}

function toast(msg){const t=document.getElementById('toast');t.textContent=msg;t.classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>t.classList.remove('show'),3500)}
function a(id){return state.assessments[id]||(state.assessments[id]={current:null,importance:3,motivation:3,evidence:''})}
function rv(id){return state.review.ratings[id]||(state.review.ratings[id]={current:null,evidence:''})}
const ratingLabel=v=>v===null?'Unassessed':D.scale.find(s=>s.v===v)?.name||'Unassessed';
function opts(value,unknown=true){return `${unknown?`<option value="" ${value===null?'selected':''}>Not assessed</option>`:''}${[0,1,2,3,4].map(n=>`<option value="${n}" ${value===n?'selected':''}>${n} · ${e(ratingLabel(n))}</option>`).join('')}`}
function targetOpts(value){return [0,1,2,3,4].map(n=>`<option value="${n}" ${value===n?'selected':''}>${n}${n===0?' · Not priority':''}</option>`).join('')}
const pill=(text,cls='')=>`<span class="tag ${cls}">${e(text)}</span>`;
function pageIntro(k,title,lead){return `<div class="eyebrow">${e(k)}</div><h1 class="headline">${title}</h1><p class="lead">${lead}</p>`}
function header(title,subtitle='',right=''){return `<div class="section-head"><div><h2>${e(title)}</h2>${subtitle?`<p>${e(subtitle)}</p>`:''}</div>${right}</div>`}
function axisTabs(selected,field){return `<div class="tabs" role="group" aria-label="Capability axis">${D.axes.map(x=>`<button type="button" class="tab ${selected===x.id?'active':''}" data-action="axis" data-axis="${x.id}" data-field="${field}">${e(x.icon)} &nbsp;${e(x.name)}</button>`).join('')}</div>`}
function gaps(){return CAP.map(c=>{const ac=a(c.id);const target=state.targets[c.id];const known=ac.current!==null;const gap=known?Math.max(0,target-ac.current):0;const priority=gap*(.5+ac.importance/5)*(.5+ac.motivation/5);return {...c,current:ac.current,target,importance:ac.importance,motivation:ac.motivation,known,gap,priority}}).filter(x=>x.target>0&&x.gap>0).sort((x,y)=>y.priority-x.priority)}
function coverage(){return CAP.filter(c=>a(c.id).current!==null).length}
function meter(name, current, target){return `<div class="meterrow"><div class="name">${e(name)}</div><div class="bar" title="Current: ${current===null?'not assessed':current}/4"><div style="width:${(current||0)/4*100}%"></div></div><div class="score">${current===null?'—':current} / ${target}</div></div>`}
function overview(){
 const gs=gaps(), known=coverage(), strengths=CAP.filter(c=>a(c.id).current!==null&&a(c.id).current>=3), unknown=CAP.filter(c=>a(c.id).current===null&&state.targets[c.id]>0).length;
 return pageIntro('Your development workspace','Know your strengths.<br><em>Choose your direction.</em>','Map what you can demonstrate, what you aspire to, and how to grow. Thought, action and integrity are independent capabilities; flourishing remains a private reflection, not a score.')+
 `<div class="dash-actions"><button class="action-btn" data-action="go" data-to="assessment">Continue assessment ↗</button><button class="action-btn secondary" data-action="go" data-to="aspirations">Explore aspirations</button></div>`+
 `<div class="grid grid-3"><div class="card tint"><div class="stat-label">Current aspiration</div><div class="stat-number" style="font-size:20px;margin-top:18px">${e(state.goalName||'Custom direction')}</div><div class="stat-desc">Your targets can change whenever you do.</div></div><div class="card"><div class="stat-label">Capabilities assessed</div><div class="stat-number">${known}<span class="muted" style="font-size:18px"> / ${CAP.length}</span></div><div class="progress-track"><div style="width:${known/CAP.length*100}%"></div></div><div class="stat-desc">${CAP.length-known} awaiting evidence</div></div><div class="card"><div class="stat-label">Development opportunities</div><div class="stat-number">${gs.length}</div><div class="stat-desc">Observed gaps against your selected targets · ${unknown} target areas not yet assessed</div></div></div>`+
 header('Capability coverage','Independent domains; no overall human score')+
 `<div class="grid grid-3">${D.axes.map(x=>{const list=CAP.filter(c=>c.axis===x.id),count=list.filter(c=>a(c.id).current!==null).length;return `<div class="card"><div class="axis-label">${e(x.name)}</div><h3>${count} of ${list.length} assessed</h3><div class="progress-track"><div style="width:${count/list.length*100}%"></div></div><p>${e(x.subtitle)}</p></div>`}).join('')}</div>`+
 `<div class="split"> <div>${header('Next development priorities','Based on known gaps, importance and motivation')}<div class="card">${gs.length?gs.slice(0,4).map(g=>`<div class="gap-card"><div><h3>${e(g.name)}</h3><p>${e(g.axis)} · Current ${g.current}/4 · Target ${g.target}/4</p></div><span class="gap-pill">Gap +${g.gap}</span></div>`).join(''):`<div class="quiet">No demonstrated gaps yet. Assess capabilities or adjust the targets to see relevant development priorities.</div>`}<button class="action-btn secondary space-top" data-action="go" data-to="development">Open development plan →</button></div></div>
 <div>${header('Demonstrated strengths','Shown only when assessed')}<div class="card">${strengths.length?strengths.slice(0,6).map(c=>`<div class="list-row"><div><strong>${e(c.name)}</strong><div class="meta">${e(c.axis)}</div></div>${pill(`${a(c.id).current}/4`,'green')}</div>`).join(''):`<div class="quiet">No high proficiency ratings recorded yet. “Not assessed” is not a weakness.</div>`}<div class="notice">Record concrete evidence before using these self-ratings for decisions. Role reviews use separate observations.</div></div></div></div>`+
 `<div class="callout"><strong>Two kinds of sovereignty.</strong> Intellectual sovereignty develops independent thought and effective action. Existential sovereignty helps you decide which ambitions matter while maintaining inner freedom. The tool supports both without treating either as a competition.</div>`;
}
function assessment(){
 const list=CAP.filter(c=>c.axis===axis),ax=D.axes.find(x=>x.id===axis);
 return pageIntro('01 / Capability inventory','Assess what you can <em>demonstrate.</em>','Each capability is a separate aspect, not a rung on a ladder. Rate observed proficiency, importance for your present life, and motivation to improve. Leave unfamiliar areas unassessed.')+
 `<div class="card" style="margin-bottom:20px"><div class="stat-label">Behavioural proficiency guide</div><div class="grid grid-3" style="margin-top:12px">${D.scale.filter(s=>s.v!==null).map(s=>`<div><strong style="color:#e7d2a9">${s.v} · ${e(s.name)}</strong><div class="tiny">${e(s.description)}</div></div>`).join('')}</div><p class="footnote space-top">“Not assessed” means insufficient evidence; 0 means not yet demonstrated in the relevant context, not a judgment of potential.</p></div>`+
 axisTabs(axis,'assessment')+`<div class="section-head"><div><h2>${e(ax.name)} capabilities</h2><p>${e(ax.subtitle)}</p></div>${pill(`${list.filter(c=>a(c.id).current!==null).length}/${list.length} assessed`)}</div>`+
 `<div class="cap-list">${list.map(c=>{const ac=a(c.id);return `<article class="cap-card"><div class="cap-top"><div><div class="axis-label">${e(c.axis)}</div><h3>${e(c.name)}</h3></div>${pill(ac.current===null?'Unassessed':`${ac.current}/4`,ac.current>=3?'green':'')}</div><div class="desc">${e(c.desc)}</div><div class="fields"><div class="field"><label for="curr-${c.id}">Current proficiency</label><select class="input" id="curr-${c.id}" data-kind="assessment" data-id="${c.id}" data-prop="current">${opts(ac.current)}</select></div><div class="field"><label for="targetshow-${c.id}">Aspiration target</label><input id="targetshow-${c.id}" class="input" disabled value="${state.targets[c.id]}/4" title="Edit in Aspirations & targets" /></div><div class="field"><label for="imp-${c.id}">Importance (1–5)</label><select class="input" id="imp-${c.id}" data-kind="assessment" data-id="${c.id}" data-prop="importance">${[1,2,3,4,5].map(n=>`<option ${n===ac.importance?'selected':''}>${n}</option>`).join('')}</select></div><div class="field"><label for="mot-${c.id}">Motivation (1–5)</label><select class="input" id="mot-${c.id}" data-kind="assessment" data-id="${c.id}" data-prop="motivation">${[1,2,3,4,5].map(n=>`<option ${n===ac.motivation?'selected':''}>${n}</option>`).join('')}</select></div></div><div class="field"><label for="ev-${c.id}">Evidence / example (recommended)</label><textarea class="input" id="ev-${c.id}" data-kind="assessment" data-id="${c.id}" data-prop="evidence" placeholder="${e(c.evidence)}">${e(ac.evidence)}</textarea></div><div class="hint">Practice: ${e(c.practice)}</div></article>`}).join('')}</div>`;
}
function aspirations(){
 const selected=template(state.pendingTemplate);
 return pageIntro('02 / Direction & intention','The goalpost can <em>move.</em>','Choose a starting aspiration, then edit every target. Different goals call for different capability combinations; no profile defines a superior kind of person.')+
 `<div class="split"><div class="card"><div class="stat-label">Choose a template</div><div class="field" style="margin-top:11px"><label for="template">Illustrative career or life direction</label><select id="template" class="input" data-kind="template">${TEMPLATES.map(t=>`<option value="${t.id}" ${selected.id===t.id?'selected':''}>${e(t.name)}</option>`).join('')}</select></div><p style="margin:14px 0">${e(selected.description)}</p><button class="action-btn secondary" data-action="apply-template">Use these suggested targets</button><div class="hint">Applying a template replaces only targets; your assessment and evidence are retained.</div></div><div class="card tint"><div class="stat-label">Your chosen direction</div><div class="field" style="margin-top:11px"><label for="goalName">Aspiration title</label><input id="goalName" class="input" data-kind="goalName" maxlength="120" value="${e(state.goalName)}" placeholder="Name what you are working towards" /></div><div class="notice">Save aspiration snapshots to record how your priorities change over time — without calling it regression.</div><button class="action-btn" data-action="save-snapshot">Save aspiration snapshot ↗</button></div></div>`+
 header('Edit your target profile','0 means not a current development priority; 4 is adaptive proficiency')+
 `<div class="card">${D.axes.map(ax=>`<div class="axis-label space-top">${e(ax.name)}</div>${CAP.filter(c=>c.axis===ax.id).map(c=>`<div class="list-row"><div><strong>${e(c.name)}</strong><div class="meta">Current: ${a(c.id).current===null?'unassessed':`${a(c.id).current}/4`}</div></div><div class="field" style="width:155px"><label for="target-${c.id}">Target proficiency</label><select id="target-${c.id}" class="input" data-kind="target" data-id="${c.id}">${targetOpts(state.targets[c.id])}</select></div></div>`).join('')}`).join('')}</div>`+
 header('Aspiration timeline','Historical snapshots record priorities, not a measure of human worth')+
 `<div class="card">${state.history.length?state.history.slice().reverse().map((h,i)=>`<div class="history-row"><div><strong>${e(h.name||'Unnamed aspiration')}</strong><small>${e(niceDate(h.date))} · ${Object.values(h.targets).filter(v=>v>=3).length} high-priority capabilities</small></div><button class="small-button" data-action="restore-snapshot" data-index="${state.history.length-1-i}">Restore targets</button></div>`).join(''):`<div class="quiet">No snapshots saved yet. Save your current direction, then compare future changes against it.</div>`}</div>`;
}
function reading(){
 const cat=window.SOVEREIGN_BOOKS||{},ids=gaps().map(g=>g.id),results=[],seen=new Set();
 if(!ids.length)ids.push(...CAP.filter(c=>state.targets[c.id]>=3).map(c=>c.id));
 for(const id of ids)for(const book of cat[id]||[]){if(!seen.has(book[0])){seen.add(book[0]);results.push({book,cap:byId(id)?.name||id})}}
 return header('Suggested reading','Curated from your own goals; suggestions are not a personality diagnosis')+
 '<div class="grid grid-2">'+(results.length?results.slice(0,6).map(({book,cap})=>
 '<div class="card"><div class="axis-label">'+e(cap)+'</div><h3>'+e(book[0])+'</h3><p>'+e(book[1])+'</p><p style="margin-top:12px">'+e(book[2])+'</p><a class="small-button space-top" style="display:inline-block" target="_blank" rel="noopener noreferrer" href="'+e(book[3])+'">Book details ↗</a></div>'
 ).join(''):'<div class="quiet">Set your goals and complete assessments for personalized suggestions.</div>')+'</div>';
}

function development(){
 const gs=gaps(),unknown=CAP.filter(c=>a(c.id).current===null&&state.targets[c.id]>0);
 return pageIntro('03 / Deliberate practice','Turn gaps into <em>experiments.</em>','The goal is not to maximize every score. Prioritize the capabilities that matter to your current direction, then choose practical experiences that can create real evidence.')+
 `<div class="grid grid-3"><div class="card"><div class="stat-label">Observed priority gaps</div><div class="stat-number">${gs.length}</div><div class="stat-desc">Current below target</div></div><div class="card"><div class="stat-label">Unknown areas</div><div class="stat-number">${unknown.length}</div><div class="stat-desc">Assess before interpreting as gaps</div></div><div class="card"><div class="stat-label">Practices selected</div><div class="stat-number">${state.plans.length}</div><div class="stat-desc">Your active development intentions</div></div></div>`+
 header('Your priority practice list','Ordered by gap × personal importance × motivation')+
 `<div class="card">${gs.length?gs.map((g,i)=>`<div class="gap-card"><div><div class="numbered">PRIORITY ${String(i+1).padStart(2,'0')} · ${e(g.axis).toUpperCase()}</div><h3>${e(g.name)}</h3><p>Current ${g.current}/4 → Target ${g.target}/4 · Importance ${g.importance}/5 · Motivation ${g.motivation}/5</p><div class="notice" style="margin:12px 0"><strong>Practice:</strong> ${e(g.practice)}</div><label class="tiny"><input type="checkbox" data-kind="plan" data-id="${g.id}" ${state.plans.includes(g.id)?'checked':''} /> Add to my active practices</label></div><span class="gap-pill">+${g.gap}</span></div>`).join(''):`<div class="quiet">No known target gaps. This is not the same as having nothing to improve: you can assess more areas or change your chosen direction.</div>`}</div>`+
 `${unknown.length?`${header('Areas needing observation','Do not count missing evidence as a development deficit')}<div class="card">${unknown.map(c=>`<div class="list-row"><div><strong>${e(c.name)}</strong><div class="meta">${e(c.axis)} · Target ${state.targets[c.id]}/4</div></div>${pill('Unassessed')}</div>`).join('')}</div>`:''}`+
 `<div class="callout"><strong>How to use this plan:</strong> Choose one or two priority practices. Define an actual situation in which you can demonstrate improvement, gather evidence, and review later. A reading list alone does not establish proficiency.</div>`+
 reading();
}
function reflection(){
 return pageIntro('04 / The inner dimension','Grow without losing <em>yourself.</em>','An entirely private journal for meaning, inner freedom, relationships and contentment. There are no wellbeing rankings or performance scores. These answers are never included in professional review exports.')+
 `<div class="grid grid-2">${D.reflections.map((r,i)=>`<article class="card"><div class="axis-label">Reflection ${String(i+1).padStart(2,'0')}</div><h3>${e(r.name)}</h3><p style="margin-bottom:15px">${e(r.question)}</p><div class="field"><label for="ref-${r.id}">Your reflection</label><textarea id="ref-${r.id}" data-kind="reflection" data-id="${r.id}" class="input" rows="6" placeholder="${e(r.prompt)}">${e(state.reflections[r.id]||'')}</textarea></div></article>`).join('')}</div><div class="callout"><strong>A boundary worth keeping:</strong> The cultivation of skills is not an obligation to optimize every moment. Hobbies, relationships and quiet enjoyment can be worthwhile without producing measurable growth.</div>`;
}
function roleCoverage(t){
 const required=CAP.filter(c=>t.targets[c.id]>0);const known=required.filter(c=>rv(c.id).current!==null);if(!known.length)return {count:0,total:required.length,value:null,missing:required.length};
 const denom=known.reduce((s,c)=>s+t.targets[c.id],0);const numerator=known.reduce((s,c)=>s+Math.min(rv(c.id).current,t.targets[c.id]),0);
 return {count:known.length,total:required.length,value:known.length>=Math.ceil(required.length*0.6)?Math.round(100*numerator/denom):null,missing:required.length-known.length};
}
function review(){
 const selected=template(state.review.role),cover=roleCoverage(selected);const known=CAP.filter(c=>rv(c.id).current!==null).length;
 const alternatives=TEMPLATES.filter(t=>t.id!==selected.id).map(t=>({t,...roleCoverage(t)})).filter(o=>o.value!==null).sort((x,y)=>(y.value-x.value));
 return pageIntro('05 / Evidence-first reviews','Assess the fit. <em>Not the worth.</em>','A separate workspace for role requirements and observed work behaviours. Use it to support constructive review conversations, not to infer a person’s intrinsic value, spiritual character, or private wellbeing.')+
 `<div class="notice warning"><strong>Important:</strong> These provisional ratings are subjective and unvalidated. Never use a single score to determine hiring, promotion, pay, redeployment or separation. Look at actual outcomes, context, accommodations, multiple observers, employee response and applicable policy.</div>`+
 `<div class="grid grid-3"><div class="card"><div class="stat-label">Requirements covered</div><div class="stat-number">${cover.value===null?'—':`${cover.value}%`}</div><div class="stat-desc">Shown only after 60% of required capabilities are assessed; never a hire/fire score</div></div><div class="card"><div class="stat-label">Observed capabilities</div><div class="stat-number">${known}<span class="muted" style="font-size:18px"> / ${CAP.length}</span></div><div class="stat-desc">${cover.missing} role requirements lack observations</div></div><div class="card"><div class="stat-label">Role currently considered</div><div class="stat-number" style="font-size:19px;margin-top:15px">${e(selected.name)}</div><div class="stat-desc">Requirements are illustrative and editable in source definitions</div></div></div>`+
 `<div class="notice warning"><strong>Morality and obedience — methodological caution:</strong> This tool must not claim to measure someone's inherent moral worth. Consider specific documented ethical workplace conduct and team ethical climate instead. “Obedience” refers only to legitimate, safe, lawful, clearly communicated, role-appropriate instructions, with space for principled disagreement, escalation and refusal of unsafe requests. Always consider context, accessibility, fairness and the person's response. These constructs are not validated for automated personnel decisions.</div>`+
 header('Review context','Stored only in this browser until you export a review')+
 `<div class="card"><div class="fields"><div class="field"><label for="review-person">Person / identifier (optional)</label><input class="input" id="review-person" maxlength="120" data-kind="reviewText" data-prop="person" value="${e(state.review.person)}" placeholder="e.g., Team member A" /></div><div class="field"><label for="review-observer">Observer (optional)</label><input class="input" id="review-observer" maxlength="120" data-kind="reviewText" data-prop="observer" value="${e(state.review.observer)}" placeholder="e.g., Reviewer" /></div><div class="field" style="grid-column:1/-1"><label for="review-role">Role comparison profile</label><select class="input" id="review-role" data-kind="reviewRole">${TEMPLATES.map(t=>`<option value="${t.id}" ${t.id===selected.id?'selected':''}>${e(t.name)}</option>`).join('')}</select></div></div></div>`+
 header('Observed behaviours','Treat “not assessed” as missing evidence, not poor ability')+axisTabs(reviewAxis,'review')+
 `<div class="card">${CAP.filter(c=>c.axis===reviewAxis).map(c=>{const o=rv(c.id),target=selected.targets[c.id];return `<div class="review-row"><div><h3 style="margin:0;font-size:14px">${e(c.name)} ${pill(`Target ${target}/4`)}</h3><p>${e(c.desc)}</p><div class="field"><label for="ro-${c.id}">Observed example (recommended)</label><textarea class="input" id="ro-${c.id}" rows="2" data-kind="reviewEvidence" data-id="${c.id}" placeholder="Specific work event, date, context and outcome">${e(o.evidence)}</textarea></div></div><div class="field"><label for="rating-${c.id}">Observed proficiency</label><select class="input" id="rating-${c.id}" data-kind="reviewRating" data-id="${c.id}">${opts(o.current)}</select><div class="hint">Role target: ${target}/4</div></div></div>`}).join('')}</div>`+
 header('Alternative role hypotheses','Only questions for further exploration; not automated placement decisions')+
 `<div class="card">${alternatives.length?alternatives.slice(0,4).map(x=>`<div class="list-row"><div><strong>${e(x.t.name)}</strong><div class="meta">${x.count} assessed of ${x.total} role requirements</div></div><span class="tag">${x.value}% observed coverage</span></div>`).join(''):`<div class="quiet">Enter observed evidence to explore how the same strengths compare with different role requirements.</div>`}<div class="notice">Coverage is hidden until at least 60% of required capabilities are observed, and is calculated only on those rated. Even then, results may be distorted by missing evidence. It excludes market availability, motivation, job-specific technical skills, performance outcomes and contextual constraints.</div></div>`+
 `${header('Context and review discussion','The role or organization may also need to change')}<div class="card"><div class="field"><label for="review-notes">Context, alternative roles, support offered, employee response, next review</label><textarea class="input" id="review-notes" rows="5" data-kind="reviewText" data-prop="notes" placeholder="Record environmental constraints, training commitments, strengths, and what to discuss with the employee.">${e(state.review.notes)}</textarea></div><div class="btnrow space-top"><button class="action-btn" data-action="export-review">Export review JSON (no personal journal)</button><button class="action-btn secondary" data-action="print">Print this view</button><button class="action-btn danger" data-action="clear-review">Clear review workspace</button></div></div>`;
}
function account(){
 const status=window.SOVEREIGN_CLOUD?.status||(authConfigured?'connecting':'unconfigured');
 const signed=!!activeUser;
 return pageIntro('07 / Account','Your workspace. <em>Your choice.</em>',
 'Google authentication verifies identity without giving access to Gmail messages. Private journal entries and work reviews are not synced.')+
 '<div class="grid grid-2"><div class="card"><div class="axis-label">Google identity</div><h3>'+
 (signed?e(activeUser.displayName||activeUser.email):'Personal account')+'</h3><p>'+
 (signed?e(activeUser.email)+' · Signed in':'Status: '+e(status))+'</p>'+
 '<div class="btnrow space-top">'+(!authConfigured?'<span class="tag">Local-only · Firebase setup pending</span>':signed?
 '<button class="action-btn secondary" data-action="sign-out">Sign out</button>':
 '<button class="action-btn" data-action="sign-in" '+(status==='connecting'?'disabled':'')+'>Sign in with Google</button>')+
 '</div><p class="footnote space-top">Google identity does not grant a role in any organization.</p></div>'+
 '<div class="card"><div class="axis-label">Your private Google Drive</div><h3>Save progress across devices</h3>'+
 '<p>Only your self-assessed capabilities, evidence, aspiration targets and practice plans can be saved to the hidden Sovereign Lab area of your own Google Drive. Reflections and workplace reviews stay local.</p>'+
 '<div class="btnrow space-top"><button class="action-btn" data-action="cloud-save" '+(!signed?'disabled':'')+'>Save to my Drive</button>'+
 '<button class="action-btn secondary" data-action="cloud-load" '+(!signed?'disabled':'')+'>Restore from my Drive</button></div>'+
 '<p class="footnote space-top">Save and restore request narrowly scoped Google Drive app-data permission. Google Drive data remains in your account; no general Drive or Gmail access is requested.</p></div></div>'+
 '<div class="callout"><strong>Organization modules not yet active.</strong> Employee/manager workflows, HR records, recruitment, dashboards and AI need secure server-side access and audit controls before real data can be used.</div>';
}

function data(){
 return pageIntro('06 / Ownership & privacy','Your data stays <em>yours.</em>','Your free workspace is local-first. Optional Google sign-in and a backup to your own Google Drive become available when Firebase is configured. Private reflections and workplace review notes remain local.')+
 `<div class="grid grid-2"><div class="card"><div class="axis-label">Personal backup</div><h3>Export your workspace</h3><p>Download all assessments, aspirations, history, journal and local review observations as JSON. Keep this file somewhere private.</p><div class="btnrow space-top"><button class="action-btn" data-action="export-personal">Download complete backup</button></div></div><div class="card"><div class="axis-label">Professional separation</div><h3>Export only the review</h3><p>Produces a role-review file containing observations and the selected role. It excludes aspirations, personal self-ratings and all flourishing reflections.</p><div class="btnrow space-top"><button class="action-btn secondary" data-action="export-review">Download review-only JSON</button></div></div><div class="card"><div class="axis-label">Restore</div><h3>Import a backup</h3><p>Restores a previously exported personal workspace and replaces all data saved in this browser. Export your current workspace first if you want to keep it.</p><div class="btnrow space-top"><label class="action-btn secondary" for="importFile" style="cursor:pointer">Choose backup file</label><input id="importFile" type="file" accept="application/json,.json" style="position:absolute;width:1px;height:1px;opacity:0" /></div></div><div class="card"><div class="axis-label">Reset</div><h3>Remove locally stored entries</h3><p>Deletes the app's saved data from this browser only. Previously downloaded backups are unaffected.</p><div class="btnrow space-top"><button class="action-btn danger" data-action="reset">Clear local workspace</button></div></div></div>`+
 `<div class="callout"><strong>Confidentiality notes:</strong> Browser storage is not encrypted and can be accessed by others using the same browser profile. Avoid entering identifiable employee performance details on shared devices. A public GitHub Pages website publishes the app's code, not browser-stored records; do not commit personal JSON backups to GitHub.</div>`+
 header('Framework boundaries','How to interpret this prototype')+
 `<div class="card"><ul class="bullet"><li>Capability names and example targets are designed for exploration. They have not been psychometrically validated.</li><li>Separate demonstrated proficiency from missing evidence, opportunities, motivation and personal goals.</li><li>Workplace character is evaluated only through observable professional conduct — not religion, spirituality or private values.</li><li>Managers should document real examples, share criteria, invite employee response and investigate role design or resource constraints.</li><li>Never use the tool as an automated employee-ranking or employment-decision engine.</li><li>Flourishing reflections remain outside professional review and are not scored.</li></ul></div>`;
}
const PAGES={account:['WORKSPACE','Account & sync'],overview:['PERSONAL STUDIO','Overview'],assessment:['PERSONAL STUDIO','Capability assessment'],aspirations:['PERSONAL STUDIO','Aspirations & targets'],development:['PERSONAL STUDIO','Development plan'],reflection:['PERSONAL STUDIO','Flourishing journal'],review:['PROFESSIONAL TOOLS','Role review'],data:['WORKSPACE','Data & privacy']};
const renderers={overview,assessment,aspirations,development,reflection,review,data,account};
function currentPage(){const k=location.hash.slice(1);return PAGES[k]?k:'overview'}
function render(){
 const p=authConfigured&&!activeUser&&!window.SOVEREIGN_GUEST?'account':currentPage();
 document.getElementById('app').innerHTML=renderers[p]();
 document.getElementById('location').innerHTML=`${e(PAGES[p][0])} <span>/</span> ${e(PAGES[p][1])}`;
 const x=document.getElementById('account-status');
 if(x)x.textContent=activeUser?'Signed in · '+(activeUser.displayName||activeUser.email):authConfigured?'Google sign-in required':'Local first · Firebase not configured';
 document.querySelectorAll('[data-page]').forEach(a=>{const on=a.dataset.page===p;a.classList.toggle('active',on);on?a.setAttribute('aria-current','page'):a.removeAttribute('aria-current')});
}
function exportJson(name,data){const blob=new Blob([JSON.stringify(data,null,2)],{type:'application/json'}),url=URL.createObjectURL(blob),link=document.createElement('a');link.href=url;link.download=name;document.body.appendChild(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),1500);toast('JSON file prepared for download.')}
function exportReview(){const t=template(state.review.role);const record={format:'sovereign-lab-role-review',version:1,exportedAt:new Date().toISOString(),person:state.review.person,observer:state.review.observer,role:t.name,roleId:t.id,roleTargets:t.targets,observations:CAP.map(c=>({id:c.id,axis:c.axis,capability:c.name,observed:rv(c.id).current,evidence:rv(c.id).evidence})),discussionNotes:state.review.notes,disclaimer:'Illustrative development aid only. Not a validated assessment or automated employment decision.'};exportJson('sovereign-role-review.json',record)}
function clicked(ev){const b=ev.target.closest('[data-action]');if(!b)return;const action=b.dataset.action;
 if(action==='sign-in')window.SOVEREIGN_CLOUD?.signIn().catch(err=>toast('Sign-in failed: '+err.message));
 else if(action==='sign-out')window.SOVEREIGN_CLOUD?.signOut().catch(err=>toast('Sign-out failed: '+err.message));
 else if(action==='cloud-save'){
  if(!confirm('Save your personal assessments and goals to your own Google Drive app-data area? Your reflections and role-review notes are excluded.'))return;
  window.SOVEREIGN_CLOUD?.savePersonal(personalCloudWorkspace()).then(()=>toast('Personal profile saved.')).catch(err=>toast('Cloud save failed: '+err.message));
 }
 else if(action==='cloud-load'){
  window.SOVEREIGN_CLOUD?.loadPersonal().then(remote=>{
   if(!remote){toast('No personal backup found in your Google Drive.');return;}
   if(!confirm('Replace local capabilities and goals with this cloud backup? Local reflections and reviews are preserved.'))return;
   state=normalize({...state,...remote,reflections:state.reflections,review:state.review});
   save();render();toast('Personal profile restored.');
  }).catch(err=>toast('Cloud restore failed: '+err.message));
 }
 else if(action==='go'){location.hash=b.dataset.to;document.getElementById('app').focus();window.scrollTo(0,0)}
 else if(action==='axis'){if(b.dataset.field==='assessment')axis=b.dataset.axis;else reviewAxis=b.dataset.axis;render()}
 else if(action==='apply-template'){const t=template(state.pendingTemplate);state.targets={...t.targets};state.goal=t.id;state.goalName=t.name;save();render();toast('Aspiration targets updated. Your assessments remain unchanged.')}
 else if(action==='save-snapshot'){state.history.push({date:new Date().toISOString(),name:state.goalName||'Custom direction',goal:state.goal,targets:{...state.targets}});state.history=state.history.slice(-100);save();render();toast('Aspiration snapshot saved.')}
 else if(action==='restore-snapshot'){const snap=state.history[Number(b.dataset.index)];if(!snap)return;if(!confirm('Restore these historical targets? Your current assessment will remain unchanged.'))return;state.targets={...snap.targets};state.goal=snap.goal;state.goalName=snap.name;save();render();toast('Historical targets restored.')}
 else if(action==='export-personal')exportJson('sovereign-lab-personal-backup.json',{format:'sovereign-lab-backup',exportedAt:new Date().toISOString(),state});
 else if(action==='export-review')exportReview();
 else if(action==='print')window.print();
 else if(action==='clear-review'){if(!confirm('Clear all local observations in the role review workspace?'))return;state.review={person:'',observer:'',role:state.review.role,ratings:{},notes:''};save();render();toast('Review workspace cleared.')}
 else if(action==='reset'){if(!confirm('Delete all locally saved assessments, aspirations, journal entries and reviews? This cannot be undone.'))return;state=makeDefault();save();render();toast('Local workspace reset.')}
}
function changed(ev){const x=ev.target,kind=x.dataset.kind;if(!kind)return;
 if(kind==='assessment'){const o=a(x.dataset.id),p=x.dataset.prop;o[p]=p==='current'?asRating(x.value):p==='evidence'?x.value:clamp(x.value,1,5);save();if(p!=='evidence')render()}
 else if(kind==='target'){state.targets[x.dataset.id]=clamp(x.value,0,4);state.goal='custom';save();render()}
 else if(kind==='template'){state.pendingTemplate=template(x.value).id;save();render()}
 else if(kind==='goalName'){state.goalName=x.value.slice(0,120);save()}
 else if(kind==='plan'){const id=x.dataset.id;state.plans=x.checked?[...new Set([...state.plans,id])]:state.plans.filter(i=>i!==id);save();render()}
 else if(kind==='reflection'){state.reflections[x.dataset.id]=x.value;save()}
 else if(kind==='reviewRole'){state.review.role=template(x.value).id;save();render()}
 else if(kind==='reviewRating'){rv(x.dataset.id).current=asRating(x.value);save();render()}
 else if(kind==='reviewEvidence'){rv(x.dataset.id).evidence=x.value;save()}
 else if(kind==='reviewText'){state.review[x.dataset.prop]=x.value;save()}
}
document.addEventListener('click',clicked);
document.addEventListener('change',changed);
document.addEventListener('input',ev=>{const k=ev.target.dataset.kind;if(['assessment','goalName','reflection','reviewEvidence','reviewText'].includes(k)&&['TEXTAREA','INPUT'].includes(ev.target.tagName))changed(ev)});
document.addEventListener('change',async ev=>{if(ev.target.id!=='importFile')return;const file=ev.target.files?.[0];if(!file)return;try{const raw=JSON.parse(await file.text());if(raw.format!=='sovereign-lab-backup'||raw.state?.schema!==1)throw Error('Not a supported personal backup file.');if(!confirm('Replace the entire locally saved workspace with this backup?'))return;state=normalize(raw.state);save();render();toast('Backup restored.')}catch(err){toast('Import failed: '+err.message)}finally{ev.target.value=''}});
window.addEventListener('sovereign-auth-change',ev=>{
 const next=ev.detail?.user||null,prior=activeUser?.uid||null;
 activeUser=next;
 if(authConfigured&&(next?.uid||null)!==prior)state=next?readLocal(storageKey()):makeDefault();
 render();
});
window.addEventListener('hashchange',()=>{render();window.scrollTo({top:0,behavior:'auto'})});
render();
})();
