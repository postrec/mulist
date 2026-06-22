import type { PageLayout } from '../components/ViewerControls';
import type { PdfJsAssetUris } from './pdfJsAssets';

interface PdfJsHtmlOptions extends PdfJsAssetUris {
  fileUri: string;
  initialLayout: PageLayout;
  initialZoom: number;
  pdfBase64: string;
}

export function createPdfJsHtml(options: PdfJsHtmlOptions): string {
  const config = JSON.stringify({
    fileUri: options.fileUri,
    initialLayout: options.initialLayout,
    initialZoom: options.initialZoom,
    pdfBase64: options.pdfBase64,
  }).replaceAll('<', '\\u003c');
  const moduleCode = escapeInlineScript(options.moduleCode);
  const workerCode = escapeInlineScript(options.workerCode);
  return `<!doctype html>
<html><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no">
<style>
html,body{margin:0;min-height:100%;background:#272927;color:#fff;font-family:-apple-system,sans-serif;overscroll-behavior:none}
#pages{display:grid;gap:12px;padding:12px;justify-content:center;align-items:start;box-sizing:border-box;min-height:100vh;min-width:100%;width:max-content}
#pages.single{grid-template-columns:max-content}
#pages.two-page{grid-template-columns:repeat(2,max-content)}
.page{background:#fff;box-shadow:0 2px 8px #0008;position:relative;overflow:hidden}
.page canvas{display:block}
#status{position:fixed;inset:0;display:grid;place-items:center;background:#272927;z-index:2;font-size:14px}
</style></head><body><div id="status">PDF.js 준비 중…</div><main id="pages"></main>
<script>
window.addEventListener('error',event=>window.ReactNativeWebView?.postMessage(JSON.stringify({type:'diagnostic',message:'PDF.js 실행 진단: '+event.message})));
window.addEventListener('unhandledrejection',event=>window.ReactNativeWebView?.postMessage(JSON.stringify({type:'diagnostic',message:'PDF.js 비동기 진단: '+(event.reason?.message??String(event.reason))})));
</script><script>${workerCode}</script><script>${moduleCode}</script><script>
const config=${config};
const pagesElement=document.getElementById('pages');
const statusElement=document.getElementById('status');
const clamp=value=>Math.max(25,Math.min(250,value));
const send=message=>window.ReactNativeWebView?.postMessage(JSON.stringify(message));
let pdfDocument=null,zoom=clamp(config.initialZoom),layout=config.initialLayout;
let models=[],renderGeneration=0,renderTimer=null,pinch=null,lastSentZoom=-1;

function basePageWidth(){
  return layout==='two-page'?(document.documentElement.clientWidth-36)/2:document.documentElement.clientWidth-24;
}
function applySizing(){
  pagesElement.className=layout;
  const base=Math.max(40,basePageWidth());
  for(const model of models){
    const width=base*zoom/100,height=width*model.ratio;
    model.element.style.width=width+'px';model.element.style.height=height+'px';
    model.canvas.style.width=width+'px';model.canvas.style.height=height+'px';
  }
}
function reportZoom(){
  const rounded=Math.round(zoom);
  if(rounded!==lastSentZoom){lastSentZoom=rounded;send({type:'zoom',zoom:rounded});}
}
function scheduleRender(delay=160){
  clearTimeout(renderTimer);renderTimer=setTimeout(()=>void renderAll(),delay);
}
function setZoom(next,render=true){
  zoom=clamp(next);applySizing();reportZoom();if(render)scheduleRender();
}
function setLayout(next){
  if(next!=='single'&&next!=='two-page')return;
  layout=next;applySizing();scheduleRender(0);
}
async function renderAll(){
  const generation=++renderGeneration;
  for(const model of models){
    if(generation!==renderGeneration)return;
    model.task?.cancel();
    const cssWidth=Math.max(40,basePageWidth())*zoom/100;
    const pixelRatio=Math.min(window.devicePixelRatio||1,2);
    const viewport=model.page.getViewport({scale:cssWidth/model.originalWidth*pixelRatio});
    model.canvas.width=Math.floor(viewport.width);model.canvas.height=Math.floor(viewport.height);
    model.canvas.style.width=cssWidth+'px';model.canvas.style.height=cssWidth*model.ratio+'px';
    const context=model.canvas.getContext('2d',{alpha:false});
    model.task=model.page.render({canvas:model.canvas,canvasContext:context,viewport});
    try{await model.task.promise;}catch(error){if(error?.name!=='RenderingCancelledException')throw error;}
  }
}
function distance(touches){
  const x=touches[0].clientX-touches[1].clientX,y=touches[0].clientY-touches[1].clientY;
  return Math.hypot(x,y);
}
document.addEventListener('touchstart',event=>{
  if(event.touches.length===2)pinch={distance:distance(event.touches),zoom};
},{passive:true});
document.addEventListener('touchmove',event=>{
  if(!pinch||event.touches.length!==2)return;
  event.preventDefault();setZoom(pinch.zoom*distance(event.touches)/pinch.distance,false);
},{passive:false});
document.addEventListener('touchend',event=>{
  if(pinch&&event.touches.length<2){pinch=null;scheduleRender();}
},{passive:true});
window.addEventListener('resize',()=>{applySizing();scheduleRender();});
window.mulistPdf={setZoom,setLayout};

void (async()=>{try{
  const pdfjs=pdfjsLib;
  globalThis.Worker=undefined;
  statusElement.textContent='PDF 파일 여는 중…';
  const binary=atob(config.pdfBase64),pdfBytes=new Uint8Array(binary.length);
  for(let index=0;index<binary.length;index+=1)pdfBytes[index]=binary.charCodeAt(index);
  config.pdfBase64='';
  const loadingTask=pdfjs.getDocument({data:pdfBytes});
  pdfDocument=await Promise.race([
    loadingTask.promise,
    new Promise((_,reject)=>setTimeout(()=>reject(new Error('PDF 파일 로딩 시간이 초과되었습니다.')),45000)),
  ]);
  for(let number=1;number<=pdfDocument.numPages;number+=1){
    const page=await pdfDocument.getPage(number),viewport=page.getViewport({scale:1});
    const element=document.createElement('section'),canvas=document.createElement('canvas');
    element.className='page';element.dataset.page=String(number);element.append(canvas);pagesElement.append(element);
    models.push({page,element,canvas,originalWidth:viewport.width,ratio:viewport.height/viewport.width,task:null});
  }
  applySizing();statusElement.remove();reportZoom();
  send({type:'ready',pageCount:pdfDocument.numPages});
  await renderAll();
}catch(error){
  statusElement.textContent='PDF를 열지 못했습니다.';send({type:'error',message:error?.message??String(error)});
}})();
</script></body></html>`;
}

function escapeInlineScript(value: string): string {
  return value.replace(/<\/script/gi, '<\\/script');
}
