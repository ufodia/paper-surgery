import './style.css';
import * as pdfjs from 'pdfjs-dist';
import workerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import { makeMarkdown, makeRepair, moveBlock, validateRepair, type Block } from './core';
pdfjs.GlobalWorkerOptions.workerSrc = workerUrl;
const app = document.querySelector<HTMLDivElement>('#app')!;
app.innerHTML = `<header><a class="brand" href="#"><span class="brand-icon">p<span>+</span></span>paper surgery<span class="wordmark-note">by Ufodia</span></a><nav aria-label="Main"><span class="local"><i></i> Your files stay here</span><a href="https://github.com/ufodia/paper-surgery" target="_blank" rel="noreferrer">GitHub ↗</a><a class="coffee" href="https://buymeacoffee.com/ufodia" target="_blank" rel="noreferrer">Buy me a coffee ↗</a></nav></header>
<main><section class="intro"><div><p class="eyebrow">THE DOCUMENT REPAIR DESK / 001</p><h1>A clearer document.<br><em>A better answer.</em></h1><p class="lede">Fix what gets lost between a PDF and your AI.<br>Put the words back in order. Give every number its meaning.</p></div><div class="intro-note"><span class="note-symbol">↗</span><p>Small repairs.<br>Less guesswork.</p><span>READ → REPAIR → EXPORT</span></div></section>
<section class="toolbar" aria-label="Document actions"><div class="file-actions"><label class="button primary" for="pdf-input">↑ Open a PDF</label><input class="visually-hidden" id="pdf-input" type="file" accept="application/pdf,.pdf"><button id="sample">Try the sample ↗</button></div><div class="export-actions"><button id="markdown" disabled>Export Markdown ↓</button><button id="patch" disabled>Save repair ↓</button><label class="button" for="patch-input">Load repair ↑</label><input class="visually-hidden" id="patch-input" type="file" accept=".json,application/json"></div></section>
<p id="status" role="status" class="status">Start with our two-column sample, or open your own PDF. No account. No upload.</p>
<section class="desk"><div class="document-panel"><div class="panel-top"><div><span class="step">01</span><strong>Original document</strong></div><div class="page-control"><button id="prev" aria-label="Previous page" disabled>←</button><span id="page-number">Page —</span><button id="next" aria-label="Next page" disabled>→</button></div></div><div id="pdf-stage"><div class="empty-paper"><div class="paper-lines"><b>THE STORY IS IN THE DETAILS.</b><div></div><div></div><div></div><div></div><div></div><div></div></div><span class="paper-seal">p+</span></div></div><div class="document-footer"><span id="filename">Your next document</span><span>LOCAL WORKSPACE</span></div></div>
<div class="repair-panel"><div class="panel-top"><div><span class="step">02</span><strong>Repair the reading</strong></div><span id="block-count" class="count">0 blocks</span></div><div class="repair-tip">Use ↑ ↓ to change reading order. Edit text or attach a column label to a value. Select a block to find it on the page.</div><div id="blocks"><div class="empty-blocks"><span>✦</span><h2>A little context goes a long way.</h2><p>Your extracted text appears here.<br>You decide how it should be read.</p></div></div><details class="output"><summary>Preview corrected Markdown <span>↗</span></summary><pre id="preview">Open a document to begin.</pre></details></div></section>
<section class="principles"><div><span>01 / SEE</span><h3>Read with the original beside you.</h3><p>Every block links to its place on the page. The extraction is visible and editable.</p></div><div><span>02 / REPAIR</span><h3>Keep the human in the loop.</h3><p>A label gives a number its column. A move restores the intended reading order.</p></div><div><span>03 / CARRY</span><h3>Take your corrections with you.</h3><p>Export readable Markdown and a repair file bound to the exact PDF by its SHA-256 hash.</p></div></section>
<footer><span>Thoughtfully built by <a href="https://github.com/ufodia">Ufodia</a>.</span><span>Text-based PDFs · Human-reviewed repairs · MIT licensed</span></footer></main>`;
const $ = <T extends HTMLElement>(id: string) => document.getElementById(id) as T;
let doc: pdfjs.PDFDocumentProxy | null = null;
let documentTask: pdfjs.PDFDocumentLoadingTask | null = null;
let blocks: Block[] = [], originals: Block[] = [];
let page = 1, digest = '', name = '', selected = '', loading = false, renderGeneration = 0;
let renderTask: ReturnType<pdfjs.PDFPageProxy['render']> | null = null;
function status(message: string, error = false) { $('status').textContent = message; $('status').classList.toggle('error', error); }
function download(filename: string, content: string, type: string) { const url = URL.createObjectURL(new Blob([content],{type})); const a=document.createElement('a');a.href=url;a.download=filename;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000); }
async function openPdf(buffer: ArrayBuffer, filename: string) {
  if(loading) return;
  loading=true; $('sample').setAttribute('disabled','');
  let pendingTask: pdfjs.PDFDocumentLoadingTask | null = null;
  try {
    if (buffer.byteLength > 40*1024*1024) throw new Error('Choose a PDF smaller than 40 MB.');
    status('Reading your PDF locally…');
    const hash = Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',buffer))).map(n=>n.toString(16).padStart(2,'0')).join('');
    const assetBase = `${import.meta.env.BASE_URL}vendor/pdfjs/`;
    pendingTask = pdfjs.getDocument({data:new Uint8Array(buffer),useSystemFonts:true,maxImageSize:20_000_000,standardFontDataUrl:assetBase+'standard_fonts/',cMapUrl:assetBase+'cmaps/',cMapPacked:true,wasmUrl:assetBase+'wasm/'});
    const candidate = await pendingTask.promise;
    if(candidate.numPages>100) throw new Error('This repair desk supports up to 100 pages per document.');
    const extracted: Block[]=[];
    for(let number=1;number<=candidate.numPages;number++){
      const p=await candidate.getPage(number); const viewport=p.getViewport({scale:1}); const text=await p.getTextContent();
      for(let i=0;i<text.items.length;i++) { const item=text.items[i]; if(!('str' in item)||!item.str.trim())continue;
        const t=pdfjs.Util.transform(viewport.transform,item.transform); const height=Math.max(8,Math.hypot(t[2],t[3]));
        extracted.push({id:`p${number}-b${i}`,page:number,text:item.str,x:t[4],y:t[5]-height,width:Math.max(item.width,8),height,label:'',kind:'text'});
      }
    }
    renderTask?.cancel();
    if(documentTask)await documentTask.destroy(); documentTask=pendingTask; pendingTask=null;doc=candidate; digest=hash; name=filename; blocks=extracted; originals=structuredClone(extracted);page=1;selected='';
    $('filename').textContent=filename; $('markdown').removeAttribute('disabled');$('patch').removeAttribute('disabled');
    await renderPage(); renderBlocks();
    status(extracted.length?`${candidate.numPages} page${candidate.numPages===1?'':'s'} · ${extracted.length} text blocks · Ready for your review.`:'No selectable text found. Scanned PDFs need OCR before this version can repair them.');
  } catch(error){status(error instanceof Error?error.message:'Could not read this PDF.',true);}finally{if(pendingTask)await pendingTask.destroy().catch(()=>{});loading=false;$('sample').removeAttribute('disabled');}
}
async function renderPage() {
  if(!doc)return;
  const generation=++renderGeneration;
  renderTask?.cancel();
  const p=await doc.getPage(page);if(generation!==renderGeneration)return;
  const viewport=p.getViewport({scale:1});
  const stage=$('pdf-stage');stage.replaceChildren();
  const sheet=document.createElement('div');sheet.className='pdf-sheet';sheet.style.aspectRatio=`${viewport.width}/${viewport.height}`;
  const canvas=document.createElement('canvas');const scale=1.6;canvas.width=Math.ceil(viewport.width*scale);canvas.height=Math.ceil(viewport.height*scale);sheet.append(canvas);
  for(const block of blocks.filter(b=>b.page===page)){
    const marker=document.createElement('button');marker.className='marker';marker.dataset.block=block.id;marker.setAttribute('aria-label',`Locate text: ${block.text.slice(0,100)}`);
    marker.style.cssText=`left:${block.x/viewport.width*100}%;top:${block.y/viewport.height*100}%;width:${block.width/viewport.width*100}%;height:${block.height/viewport.height*100}%;`;
    marker.addEventListener('click',()=>selectBlock(block.id,true));sheet.append(marker);
  }
  stage.append(sheet);$('page-number').textContent=`Page ${page} / ${doc.numPages}`;
  ($('prev') as HTMLButtonElement).disabled=page===1;($('next') as HTMLButtonElement).disabled=page===doc.numPages;
  renderTask=p.render({canvas,viewport:p.getViewport({scale})});
  try{await renderTask.promise;}catch(error){if(!(error instanceof Error && error.name==='RenderingCancelledException'))throw error;}
  if(generation===renderGeneration)selectBlock(selected);
}
function selectBlock(id:string, scroll=false){selected=id;document.querySelectorAll<HTMLElement>('[data-block]').forEach(el=>el.classList.toggle('selected',el.dataset.block===id));if(scroll)document.querySelector<HTMLElement>(`.block[data-block="${id}"]`)?.scrollIntoView({behavior:'smooth',block:'nearest'});}
function renderBlocks(){
  const container=$('blocks');container.replaceChildren();const visible=blocks.filter(b=>b.page===page);$('block-count').textContent=`${visible.length} blocks`;
  visible.forEach((block,index)=>{
    const article=document.createElement('article');article.className='block';article.dataset.block=block.id;
    const controls=document.createElement('div');controls.className='block-controls';
    const number=document.createElement('button');number.className='block-number';number.textContent=String(index+1).padStart(2,'0');number.title='Locate on page';number.addEventListener('click',()=>selectBlock(block.id));controls.append(number);
    for(const [delta,symbol] of [[-1,'↑'],[1,'↓']] as const){const button=document.createElement('button');button.textContent=symbol;button.setAttribute('aria-label',`Move block ${index+1} ${delta<0?'up':'down'}`);button.disabled=delta<0?index===0:index===visible.length-1;button.addEventListener('click',()=>{blocks=moveBlock(blocks,block.id,delta);renderBlocks();selectBlock(block.id);});controls.append(button);}
    const body=document.createElement('div');body.className='block-body';
    const text=document.createElement('textarea');text.value=block.text;text.rows=Math.min(5,Math.max(1,Math.ceil(block.text.length/50)));text.setAttribute('aria-label',`Text for block ${index+1}`);text.addEventListener('focus',()=>selectBlock(block.id));text.addEventListener('input',()=>{block.text=text.value;updatePreview();});
    const meta=document.createElement('div');meta.className='block-meta';const label=document.createElement('input');label.placeholder='Attach a column label…';label.value=block.label;label.maxLength=200;label.setAttribute('aria-label',`Column label for block ${index+1}`);label.addEventListener('input',()=>{block.label=label.value;updatePreview();});
    const kind=document.createElement('select');kind.setAttribute('aria-label',`Type for block ${index+1}`);for(const [value,caption]of [['text','Text'],['heading','Heading']]){const option=new Option(caption,value);kind.add(option);}kind.value=block.kind;kind.addEventListener('change',()=>{block.kind=kind.value as Block['kind'];updatePreview();});meta.append(label,kind);body.append(text,meta);article.append(controls,body);container.append(article);
  });updatePreview();selectBlock(selected);
}
function updatePreview(){$('preview').textContent=makeMarkdown(blocks);}
$<HTMLInputElement>('pdf-input').addEventListener('change',async e=>{const file=(e.target as HTMLInputElement).files?.[0];if(file)await openPdf(await file.arrayBuffer(),file.name);(e.target as HTMLInputElement).value='';});
$('sample').addEventListener('click',async()=>{try{const response=await fetch(`${import.meta.env.BASE_URL}sample.pdf`);if(!response.ok)throw new Error('The sample could not be loaded.');await openPdf(await response.arrayBuffer(),'field-notes.pdf');}catch(error){status(String(error),true);}});
for(const [id,delta]of [['prev',-1],['next',1]] as const)$ (id).addEventListener('click',async()=>{if(!doc)return;page=Math.min(doc.numPages,Math.max(1,page+delta));selected='';try{await renderPage();renderBlocks();}catch(error){status(String(error),true);}});
$('markdown').addEventListener('click',()=>download(name.replace(/\.pdf$/i,'')+'.repaired.md',makeMarkdown(blocks),'text/markdown'));
$('patch').addEventListener('click',()=>download(name.replace(/\.pdf$/i,'')+'.repair.json',JSON.stringify(makeRepair(name,digest,blocks),null,2),'application/json'));
$<HTMLInputElement>('patch-input').addEventListener('change',async e=>{try{if(!doc)throw new Error('Open the original PDF before loading its repair.');const file=(e.target as HTMLInputElement).files?.[0];if(!file)return;if(file.size>10*1024*1024)throw new Error('Repair files must be smaller than 10 MB.');blocks=validateRepair(JSON.parse(await file.text()),digest,originals).blocks;renderBlocks();await renderPage();status('Repair loaded. The document fingerprint matches.');}catch(error){status(error instanceof Error?error.message:String(error),true);}finally{(e.target as HTMLInputElement).value='';}});
