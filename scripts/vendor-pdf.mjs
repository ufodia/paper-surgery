import {cp,mkdir}from 'node:fs/promises';
const root=new URL('../',import.meta.url);
const target=new URL('public/vendor/pdfjs/',root);await mkdir(target,{recursive:true});
for(const entry of ['standard_fonts','cmaps','wasm','LICENSE'])await cp(new URL('node_modules/pdfjs-dist/'+entry,root),new URL(entry,target),{recursive:true});
console.log('Prepared same-origin PDF fonts, CMaps, WASM, and license.');
