// Lightweight smoke test: run with node tests/smoke.cjs (no dependencies).
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict'),path=require('node:path');
const root=path.resolve(__dirname,'..'),storage={},nodes={},handlers={},wh={};
const node=id=>nodes[id]??={innerHTML:'',textContent:'',focus(){},classList:{add(){},remove(){}}};
const document={getElementById:node,querySelectorAll:()=>[],addEventListener:(n,f)=>(handlers[n]??=[]).push(f),createElement:()=>({click(){},remove(){},set download(v){this.file=v},set href(v){this.hrefValue=v}}),body:{appendChild(){}}};
const window={SOVEREIGN_DATA:null,addEventListener:(n,f)=>(wh[n]??=[]).push(f),scrollTo(){}};
const ctx={document,window,localStorage:{getItem:k=>storage[k]||null,setItem:(k,v)=>storage[k]=v},location:{hash:''},confirm:()=>true,setTimeout:()=>0,clearTimeout(){},Blob:class{constructor(parts){this.parts=parts}},URL:{createObjectURL:()=>'',revokeObjectURL(){}},console};
vm.createContext(ctx);for(const f of ['data.js','rubric.js','app.js'])vm.runInContext(fs.readFileSync(path.join(root,f),'utf8'),ctx);
assert.match(node('app').innerHTML,/Know your strengths/);
function go(page){
 ctx.location.hash='#'+page;
 for(const f of wh.hashchange||[])f();
}
for(const page of ['assessment','aspirations','development','reflection','review','data','account']){
 go(page);
 assert.ok(node('app').innerHTML.length>1000,'Empty page '+page);
}
const click=action=>handlers.click[0]({target:{closest:()=>({dataset:{action}})}});
const current=()=>node('app').innerHTML;
const {capabilities}=window.SOVEREIGN_DATA;
const rubric=window.SOVEREIGN_RUBRIC;
const options=capabilities.flatMap(c=>[0,1,2,3,4].map(score=>rubric.label(c.id,score)));
assert.equal(new Set(options).size,capabilities.length*5);
assert.equal(rubric.label(capabilities[0].id,null),'Not assessed');
go('assessment');
assert.match(current(),/Capability 1 of 16/);
assert.match(current(),/aria-label="About Comprehension"/);
click('assessment-next');
assert.match(current(),/Capability 1 of 16/);
handlers.change[0]({target:{value:'0',dataset:{kind:'assessment',id:capabilities[0].id,prop:'current'}}});
click('assessment-next');
assert.match(current(),/Capability 2 of 16/);
assert.match(current(),/1 · Accepts a claim without checking its support/);
assert.equal(JSON.parse(storage['sovereign-lab-state-v1']).assessments[capabilities[0].id].current,0);
click('assessment-skip');
go('overview');
go('assessment');
assert.match(current(),/Capability 3 of 16/);
click('assessment-back');
assert.match(current(),/Capability 2 of 16/);
for(let i=1;i<capabilities.length;i++)click('assessment-skip');
assert.match(current(),/Review your assessment/);
assert.match(current(),/1 · Misses key steps when explaining a process/);
assert.match(current(),/1 of 16 capabilities assessed/);
console.log('Sovereign Lab smoke checks passed');
