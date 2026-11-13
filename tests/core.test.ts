import {describe,it,expect}from 'vitest';
import {makeMarkdown,makeRepair,moveBlock,validateRepair,type Block}from '../src/core';
const source:Block[]=[{id:'a',page:1,text:'12,500',x:1,y:2,width:30,height:10,label:'',kind:'text'},{id:'b',page:1,text:'Revenue',x:1,y:12,width:30,height:10,label:'',kind:'heading'},{id:'c',page:2,text:'Next page',x:1,y:2,width:30,height:10,label:'',kind:'text'}];
describe('document repair',()=>{
it('moves a block without mutating source or crossing pages',()=>{const moved=moveBlock(source,'b',-1);expect(moved.map(b=>b.id)).toEqual(['b','a','c']);expect(source[0].id).toBe('a');expect(moveBlock(source,'b',1)).toEqual(source);});
it('exports order, page provenance and table labels',()=>{const b=structuredClone(source);b[0].label='Refunds';const md=makeMarkdown(b);expect(md).toContain('**Refunds:** 12,500');expect(md).toContain('## Revenue');expect(md).toContain('<!-- Page 2 -->');});
it('roundtrips a real patch, preserving original coordinates',()=>{const patch=makeRepair('report.pdf','abc',source);patch.blocks[0].text='Corrected';patch.blocks[0].x=900;expect(validateRepair(patch,'abc',source).blocks[0]).toMatchObject({text:'Corrected',x:1});});
it('rejects the wrong source and unknown versions',()=>{expect(()=>validateRepair(makeRepair('a','other',source),'abc',source)).toThrow(/different PDF/);});
it('rejects missing, duplicate, unknown and cross-page blocks',()=>{for(const change of [(p:ReturnType<typeof makeRepair>)=>p.blocks.pop(),(p:ReturnType<typeof makeRepair>)=>p.blocks[1].id='a',(p:ReturnType<typeof makeRepair>)=>p.blocks[0].id='unknown',(p:ReturnType<typeof makeRepair>)=>p.blocks[0].page=2]){const p=makeRepair('a','abc',source);change(p);expect(()=>validateRepair(p,'abc',source)).toThrow();}});
it('rejects malformed labels and page reordering',()=>{const p=makeRepair('a','abc',source);p.blocks.reverse();expect(()=>validateRepair(p,'abc',source)).toThrow(/order/);});
it('rejects a coercible array instead of a block type',()=>{const p=makeRepair('a','abc',source);const malformed=JSON.parse(JSON.stringify(p));malformed.blocks[0].kind=['heading'];expect(()=>validateRepair(malformed,'abc',source)).toThrow(/type/);});
});
