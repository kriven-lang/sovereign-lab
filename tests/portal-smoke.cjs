/* No-network smoke test of landing and organization sign-in gate. */
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict'),path=require('node:path');
const root=path.resolve(__dirname,'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const events={},els={},bodyClasses=new Set(),local=new Map();
function element(){return {innerHTML:'',textContent:'',dataset:{},classList:{add(){},remove(){},toggle(){}},setAttribute(){},removeAttribute(){},focus(){},value:''};}
const get=id=>els[id]??=(element());
const document={getElementById:get,querySelectorAll:()=>[],addEventListener:(n,cb)=>(events['doc:'+n]??=[]).push(cb),
createElement:()=>({click(){},remove(){}}),body:{appendChild(){},classList:{add:x=>bodyClasses.add(x),remove:x=>bodyClasses.delete(x)}}};
const window={SOVEREIGN_FIREBASE_CONFIG:null,addEventListener:(n,cb)=>(events[n]??=[]).push(cb),
dispatchEvent(e){for(const f of events[e.type]||[])f(e)},scrollTo(){}};
const location={hash:''};
class CustomEvent{constructor(type,{detail}={}){this.type=type;this.detail=detail}}
class HashChangeEvent{constructor(type){this.type=type}}
const ctx={window,document,location,CustomEvent,HashChangeEvent,console,
localStorage:{getItem:k=>local.get(k)||null,setItem:(k,v)=>local.set(k,v)},setTimeout:()=>0,clearTimeout(){},confirm:()=>true,
URL:{createObjectURL:()=>'',revokeObjectURL(){}},Blob:class{}};
vm.createContext(ctx);
for(const name of ['data.js','rubric.js','app.js','cloud.js','portal.js','org.js'])vm.runInContext(read(name),ctx,{filename:name});
assert.match(get('app').innerHTML,/Personal development/);
assert.match(get('app').innerHTML,/Organization/);
assert.ok(bodyClasses.has('portal-view'));
location.hash='#organization';
window.dispatchEvent(new HashChangeEvent('hashchange'));
assert.match(get('app').innerHTML,/work Google/i);
assert.doesNotMatch(get('app').innerHTML,/Employee: [A-Z][a-z]+/);
assert.equal(window.SOVEREIGN_CLOUD.configured,false);
assert.ok(window.SOVEREIGN_ORG);
console.log('Portal and organization access smoke test passed');
