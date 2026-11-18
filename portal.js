/* Public entry page. Personal and organization modes are intentionally distinct. */
(function(){
 'use strict';
 const mount=document.getElementById('app');
 const safe=v=>String(v??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
 let error='';
 function hero(){
  document.body.classList.add('portal-view');
  mount.innerHTML='<div class="portal-hero"><div class="eyebrow">SOVEREIGN LAB / DELIBERATE DEVELOPMENT</div>'+
   '<h1 class="headline">Know your strengths. <em>Choose who you become.</em></h1>'+
   '<p class="lead">A thoughtful way to understand how you reason, act and exercise integrity. Set changing aspirations, find developmental gaps, and pursue a fulfilling life on your own terms.</p>'+
   '<div class="portal-cards"><section class="card portal-choice"><div class="portal-mark">◇</div><h2>Personal development</h2>'+
   '<p>Understand your capabilities, develop new skills, explore reading and practices, and keep your private reflections private. Save eligible personal records in your own Google Drive.</p>'+
   '<button class="action-btn" data-portal="personal">Sign in with Google</button><p class="meta">Personal workspace · Free tier</p></section>'+
   '<section class="card portal-choice"><div class="portal-mark">▤</div><h2>Organization</h2>'+
   '<p>Independent self and manager reviews, evidence-based comparison, documented reconciliation and role alignment—with controlled HR access.</p>'+
   '<button class="action-btn" data-portal="organization">Sign in with work Google</button><p class="meta">Work account · Authorized membership required</p></section></div>'+
   '<div class="portal-values"><span>◇ Thought</span><span>↗ Action</span><span>✦ Integrity</span><span>♡ Fulfilment</span></div>'+
   '<div class="callout"><strong>Separate by design:</strong> Private self-reflection is never an organization review. Neither morality nor obedience is an automatic personnel verdict. All organization access requires explicit authorization.</div>'+
   '<div class="portal-bottom"><button class="action-btn secondary" data-portal="demo">Explore personal demo</button>'+
   (!window.SOVEREIGN_CLOUD?.configured?'<p class="meta">Google login is not yet configured by the product owner; the local demo remains available.</p>':'')+
   (error?'<div class="notice warning">'+safe(error)+'</div>':'')+'</div></div>';
  document.getElementById('location').textContent='SOVEREIGN LAB / WELCOME';
 }
 function org(){
  document.body.classList.add('portal-view');
  const user=window.SOVEREIGN_CLOUD?.user;
  const isWork=window.SOVEREIGN_CLOUD?.isWorkEmail?.(user?.email);
  if(!user||!isWork){
    mount.innerHTML='<div class="portal-hero portal-work"><div class="eyebrow">ORGANIZATIONAL WORKSPACE</div>'+
    '<h1 class="headline">Evidence-first <em>people development.</em></h1>'+
    '<p class="lead">Sign in with an organizational Google account. Personal Gmail addresses are not accepted, and organizational membership must be explicitly authorized.</p>'+
    '<div class="card"><h2>Work Google sign-in</h2><button class="action-btn" data-portal="organization">Continue with work Google</button>'+
    '<p class="meta">Your HR administrator provides the organization ID and approved membership.</p></div>'+
    (error?'<div class="notice warning">'+safe(error)+'</div>':'')+
    '<div class="btnrow space-top"><button class="action-btn secondary" data-portal="home">Return home</button></div></div>';
  }else if(window.SOVEREIGN_ORG){
    mount.innerHTML=window.SOVEREIGN_ORG.render();
  }else{
    mount.innerHTML='<div class="portal-hero"><h2>Loading organization workspace…</h2></div>';
  }
  document.getElementById('location').textContent='SOVEREIGN LAB / ORGANIZATION';
 }
 function render(){
  const hash=location.hash.slice(1)||'welcome';
  if(hash==='welcome'){hero();return}
  if(hash==='organization'){org();return}
  if(!window.SOVEREIGN_CLOUD?.user&&!window.SOVEREIGN_GUEST&&hash!=='account'){hero();return}
  document.body.classList.remove('portal-view');
 }
 async function act(kind){
  error='';
  try{
   if(kind==='home'){location.hash='#welcome';render();return}
   if(kind==='demo'){
     window.SOVEREIGN_GUEST=true;location.hash='#overview';render();
     window.dispatchEvent(new HashChangeEvent('hashchange'));return;
   }
   if(!window.SOVEREIGN_CLOUD?.configured)throw Error('Google sign-in has not been activated yet. You can explore the local personal demo.');
   if(kind==='personal'){
     window.SOVEREIGN_GUEST=false;await window.SOVEREIGN_CLOUD.signIn('personal');
     location.hash='#overview';render();return;
   }
   if(kind==='organization'){
     window.SOVEREIGN_GUEST=false;await window.SOVEREIGN_CLOUD.signIn('organization');
     location.hash='#organization';render();return;
   }
  }catch(err){error=err.message||String(err);render()}
 }
 document.addEventListener('click',event=>{const button=event.target.closest('[data-portal]');if(button){event.preventDefault();act(button.dataset.portal)}});
 window.addEventListener('sovereign-auth-change',render);
 window.addEventListener('sovereign-org-change',render);
 window.addEventListener('hashchange',render);
 if(!location.hash)location.hash='#welcome';
 render();
})();
