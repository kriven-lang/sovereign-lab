// Lightweight smoke test: run with node tests/smoke.cjs (no dependencies).
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict'),path=require('node:path');
const root=path.resolve(__dirname,'..'),storage={},nodes={},handlers={},wh={};
const node=id=>nodes[id]??={innerHTML:'',textContent:'',classList:{add(){},remove(){}}};
const document={getElementById:node,querySelectorAll:()=>[],addEventListener:(n,f)=>(handlers[n]??=[]).push(f),createElement:()=>({click(){},remove(){},set download(v){this.file=v},set href(v){this.hrefValue=v}}),body:{appendChild(){}}};
const window={SOVEREIGN_DATA:null,addEventListener:(n,f)=>(wh[n]??=[]).push(f),scrollTo(){}};
const ctx={document,window,localStorage:{getItem:k=>storage[k]||null,setItem:(k,v)=>storage[k]=v},location:{hash:''},confirm:()=>true,setTimeout:()=>0,clearTimeout(){},Blob:class{constructor(parts){this.parts=parts}},URL:{createObjectURL:()=>'',revokeObjectURL(){}},console};
vm.createContext(ctx);for(const f of ['data.js','app.js'])vm.runInContext(fs.readFileSync(path.join(root,f),'utf8'),ctx);
assert.match(node('app').innerHTML,/Know your strengths/);
for(const p of ['assessment','aspirations','development','reflection','review','data','account']){ctx.location.hash='#'+p;for(const f of wh.hashchange||[])f();assert.ok(node('app').innerHTML.length>1000,'Empty page '+p)}
console.log('Sovereign Lab smoke checks passed');
