import type { NoteLayer, ScoreNavigationMode } from '../../../domain/models';
import type { PageLayout } from '../components/ViewerControls';
import type { PdfJsAssetUris } from './pdfJsAssets';

interface PdfJsHtmlOptions extends PdfJsAssetUris {
  fileUri: string;
  initialDrawingColor: string;
  initialLayout: PageLayout;
  initialNavigationMode: ScoreNavigationMode;
  initialNoteLayer: NoteLayer;
  initialPencilSmoothing: number;
  initialPage: number;
  initialZoom: number;
  pdfBase64: string;
}

export function createPdfJsHtml(options: PdfJsHtmlOptions): string {
  const config = JSON.stringify({
    fileUri: options.fileUri,
    initialDrawingColor: options.initialDrawingColor,
    initialLayout: options.initialLayout,
    initialNavigationMode: options.initialNavigationMode,
    initialNoteLayer: options.initialNoteLayer,
    initialPencilSmoothing: options.initialPencilSmoothing,
    initialPage: options.initialPage,
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
#pages.snap-horizontal,#pages.snap-horizontal-page{display:flex;flex-direction:row;flex-wrap:nowrap;align-items:flex-start;justify-content:flex-start;height:100vh;min-height:100vh;width:max-content}
#pages.two-page.snap-horizontal,#pages.two-page.snap-horizontal-page{gap:10px;padding-left:10vw;padding-right:10vw}
.horizontal-scroll-mode{height:100%;overflow-x:auto;overflow-y:hidden;-webkit-overflow-scrolling:touch}
.page{background:#fff;box-shadow:0 2px 8px #0008;flex:0 0 auto;position:relative;overflow:hidden}
.page canvas{display:block}
.pdf-canvas{position:relative;z-index:0}
.annotation-layer{inset:0;pointer-events:none;position:absolute;z-index:1}
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
let pdfDocument=null,zoom=clamp(config.initialZoom),layout=config.initialLayout,navigationMode=config.initialNavigationMode;
let currentPage=Math.max(1,config.initialPage),pageReportTimer=null,transitionRunning=false;
let models=[],renderGeneration=0,renderTimer=null,pinch=null,snapTouch=null,tapTouch=null,lastSentZoom=-1,menuVisible=true,horizontalSnapTimer=null,horizontalSnapping=false;
let drawingTool=null,drawingColor=config.initialDrawingColor??'#C62828',pencilSmoothing=Math.max(0,Math.min(10,config.initialPencilSmoothing??2)),pencilStroke=null,pencilPointerId=null,pencilModel=null,noteLayer=config.initialNoteLayer??{version:2,strokes:[],texts:[]};

function isHorizontal(){return navigationMode==='snap-horizontal'||navigationMode==='snap-horizontal-page';}
function modelAtPoint(x,y){
  const pageElement=document.elementFromPoint(x,y)?.closest?.('.page');
  return pageElement?models.find(model=>model.element===pageElement)??null:null;
}
function pagePoint(event,model){
  const rect=model.element.getBoundingClientRect();
  return {pressure:event.pressure||.5,x:Math.max(0,Math.min(1,(event.clientX-rect.left)/rect.width)),y:Math.max(0,Math.min(1,(event.clientY-rect.top)/rect.height))};
}
function smoothPencilPoint(point){
  if(!pencilStroke||pencilSmoothing<=0||pencilStroke.points.length===0)return point;
  const previous=pencilStroke.points[pencilStroke.points.length-1],factor=1-pencilSmoothing*.055;
  return {pressure:previous.pressure+(point.pressure-previous.pressure)*factor,x:previous.x+(point.x-previous.x)*factor,y:previous.y+(point.y-previous.y)*factor};
}
function drawStroke(context,stroke,width,height,ratio){
  if(stroke.points.length===0)return;
  context.beginPath();context.lineCap='round';context.lineJoin='round';
  context.strokeStyle=stroke.color;context.globalAlpha=stroke.opacity;
  context.lineWidth=stroke.width*ratio*zoom/100;
  const first=stroke.points[0];context.moveTo(first.x*width*ratio,first.y*height*ratio);
  if(stroke.points.length===1){
    context.arc(first.x*width*ratio,first.y*height*ratio,context.lineWidth/2,0,Math.PI*2);context.fillStyle=stroke.color;context.fill();
  }else{
    for(let index=1;index<stroke.points.length;index+=1){
      const point=stroke.points[index],next=stroke.points[index+1]??point;
      context.quadraticCurveTo(point.x*width*ratio,point.y*height*ratio,(point.x+next.x)/2*width*ratio,(point.y+next.y)/2*height*ratio);
    }
    context.stroke();
  }
  context.globalAlpha=1;
}
function renderModelAnnotations(model){
  const ratio=Math.min(window.devicePixelRatio||1,2);
  const width=model.element.clientWidth,height=model.element.clientHeight,canvas=model.annotationCanvas;
  canvas.width=Math.max(1,Math.round(width*ratio));canvas.height=Math.max(1,Math.round(height*ratio));
  canvas.style.width=width+'px';canvas.style.height=height+'px';
  const context=canvas.getContext('2d');context.clearRect(0,0,canvas.width,canvas.height);
  for(const stroke of noteLayer.strokes){if((stroke.page??1)===model.number)drawStroke(context,stroke,width,height,ratio);}
  for(const note of noteLayer.texts){
    if((note.page??1)!==model.number)continue;
    const fontSize=16*ratio*zoom/100,padding=4*ratio*zoom/100,x=note.x*width*ratio,y=note.y*height*ratio;
    context.font='600 '+fontSize+'px -apple-system,sans-serif';const textWidth=context.measureText(note.text).width;
    context.fillStyle='rgba(255,255,255,.86)';context.fillRect(x-padding,y-padding,textWidth+padding*2,fontSize+padding*2);
    context.fillStyle=note.color;context.textBaseline='top';context.fillText(note.text,x,y);
  }
  if(pencilStroke&&pencilModel===model)drawStroke(context,pencilStroke,width,height,ratio);
}
function renderAnnotations(){for(const model of models)renderModelAnnotations(model);}
function emitNoteLayer(){noteLayer={...noteLayer,version:2};send({type:'noteLayer',noteLayer});}
function eraseAt(point,model){
  let closest=null,distance=.04;
  for(const stroke of noteLayer.strokes){
    if((stroke.page??1)!==model.number)continue;
    for(const item of stroke.points){const next=Math.hypot(item.x-point.x,item.y-point.y);if(next<distance){distance=next;closest=stroke.id;}}
  }
  if(!closest)return;
  noteLayer={...noteLayer,version:2,strokes:noteLayer.strokes.filter(stroke=>stroke.id!==closest)};renderModelAnnotations(model);emitNoteLayer();
}
document.addEventListener('pointerdown',event=>{
  if(!drawingTool||event.pointerType!=='pen')return;
  event.preventDefault();event.stopPropagation();pinch=null;snapTouch=null;tapTouch=null;event.target?.setPointerCapture?.(event.pointerId);pencilPointerId=event.pointerId;pencilModel=modelAtPoint(event.clientX,event.clientY);
  if(!pencilModel)return;
  const point=pagePoint(event,pencilModel);
  if(drawingTool==='eraser'){eraseAt(point,pencilModel);return;}
  pencilStroke={color:drawingColor,id:'pencil-'+Date.now()+'-'+Math.random(),opacity:drawingTool==='highlighter'?0.35:1,page:pencilModel.number,points:[point],tool:drawingTool,width:drawingTool==='highlighter'?18:3};renderModelAnnotations(pencilModel);
},{capture:true,passive:false});
document.addEventListener('pointermove',event=>{
  if(event.pointerType!=='pen'||event.pointerId!==pencilPointerId)return;
  event.preventDefault();event.stopPropagation();if(!pencilModel)return;let point=pagePoint(event,pencilModel);
  if(drawingTool==='eraser'){eraseAt(point,pencilModel);return;}
  if(!pencilStroke)return;const previous=pencilStroke.points[pencilStroke.points.length-1];point=smoothPencilPoint(point);
  if(Math.hypot(previous.x-point.x,previous.y-point.y)<.0008)return;
  pencilStroke.points.push(point);renderModelAnnotations(pencilModel);
},{capture:true,passive:false});
function finishPencil(event){
  if(event.pointerType!=='pen'||event.pointerId!==pencilPointerId)return;
  event.preventDefault();event.stopPropagation();try{event.target?.releasePointerCapture?.(event.pointerId);}catch{}
  if(pencilStroke&&pencilModel){const finalPoint=pagePoint(event,pencilModel),previous=pencilStroke.points[pencilStroke.points.length-1];if(Math.hypot(previous.x-finalPoint.x,previous.y-finalPoint.y)>=.0008)pencilStroke.points.push(finalPoint);noteLayer={...noteLayer,version:2,strokes:[...noteLayer.strokes,pencilStroke]};pencilStroke=null;renderModelAnnotations(pencilModel);emitNoteLayer();}
  pencilPointerId=null;pencilModel=null;
}
document.addEventListener('pointerup',finishPencil,{capture:true,passive:false});
document.addEventListener('pointercancel',finishPencil,{capture:true,passive:false});

function basePageWidth(){
  return layout==='two-page'?(document.documentElement.clientWidth-36)/2:document.documentElement.clientWidth-24;
}
function pageWidthFor(model){
  if(isHorizontal()){
    if(layout==='two-page')return Math.max(40,(document.documentElement.clientWidth*.8-10)/2);
    const availableHeight=document.documentElement.clientHeight-24;
    return Math.max(40,availableHeight/model.ratio);
  }
  return Math.max(40,basePageWidth());
}
function applySizing(redrawAnnotations=true){
  pagesElement.className=layout+' '+navigationMode;
  document.documentElement.classList.toggle('horizontal-scroll-mode',isHorizontal());
  document.body.classList.toggle('horizontal-scroll-mode',isHorizontal());
  for(const model of models){
    const width=pageWidthFor(model)*zoom/100,height=width*model.ratio;
    model.element.style.width=width+'px';model.element.style.height=height+'px';
    model.canvas.style.width=width+'px';model.canvas.style.height=height+'px';
    model.annotationCanvas.style.width=width+'px';model.annotationCanvas.style.height=height+'px';
  }
  applyPageVisibility();
  if(redrawAnnotations)renderAnnotations();
}
function applyPageVisibility(){
  if(!isHorizontal()){
    for(const model of models){
      model.element.style.display='block';model.element.style.left='';model.element.style.position='relative';
      model.element.style.top='';model.element.style.transform='';
    }
    return;
  }
  for(const model of models){
    model.element.style.display='block';model.element.style.left='';model.element.style.position='relative';
    model.element.style.top='';model.element.style.transform='';
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
  zoom=clamp(next);applySizing(render);reportZoom();if(render)scheduleRender();
}
function setLayout(next){
  if(next!=='single'&&next!=='two-page')return;
  layout=next;applySizing();scheduleRender(0);requestAnimationFrame(()=>scrollToPage(currentPage));
}
function setNavigationMode(next){
  if(next!=='scroll'&&next!=='snap'&&next!=='snap-horizontal'&&next!=='snap-horizontal-page')return;
  navigationMode=next;applySizing();requestAnimationFrame(()=>scrollToPage(currentPage));
}
function normalizePage(page){
  let next=Math.max(1,Math.min(models.length,page));
  if(layout==='two-page')next=next-(next-1)%2;
  return next;
}
function returnFromDrag(offset){
  pagesElement.style.transform='';
  const returning=pagesElement.animate(
    [{transform:'translateX('+offset+'px)'},{transform:'translateX(0)'}],
    {duration:140,easing:'cubic-bezier(.2,.8,.2,1)'}
  );
  returning.finished.finally(()=>returning.cancel());
}
function scrollToPage(page,animated=false,dragOffset=0){
  const nextPage=normalizePage(page);
  currentPage=nextPage;
  const element=models[currentPage-1]?.element;
  if(!element)return;
  if(isHorizontal()){
    const inset=layout==='two-page'?document.documentElement.clientWidth*.1:12;
    window.scrollTo({left:Math.max(0,element.offsetLeft-inset),top:0,behavior:animated?'smooth':'auto'});
    reportPage();
    return;
  }
  window.scrollTo({left:0,top:element.offsetTop-12,behavior:animated||navigationMode==='snap'?'smooth':'auto'});
}
function reportPage(){
  clearTimeout(pageReportTimer);pageReportTimer=setTimeout(()=>send({type:'page',page:currentPage}),120);
}
function updateCurrentPage(){
  if(models.length===0)return;
  const horizontal=isHorizontal();
  let best=models[0],distance=Infinity;
  for(const model of models){
    const rect=model.element.getBoundingClientRect(),next=Math.abs(horizontal?rect.left:rect.top);
    if(next<distance){distance=next;best=model;}
  }
  let page=Number(best.element.dataset.page);
  if(layout==='two-page')page=page-(page-1)%2;
  if(page!==currentPage){currentPage=page;reportPage();}
}
function snapToNearest(){
  if(navigationMode!=='snap'||models.length===0)return;
  updateCurrentPage();
  const element=models[currentPage-1]?.element;
  if(!element)return;
  window.scrollTo({left:0,top:element.offsetTop-12,behavior:'smooth'});
}
function snapHorizontalToNearest(){
  if(navigationMode!=='snap-horizontal-page'||horizontalSnapping||models.length===0)return;
  updateCurrentPage();horizontalSnapping=true;scrollToPage(currentPage,true);
  setTimeout(()=>{horizontalSnapping=false;},360);
}
function handleScroll(){
  updateCurrentPage();
  if(pinch)return;
  if(navigationMode!=='snap-horizontal-page'||horizontalSnapping)return;
  clearTimeout(horizontalSnapTimer);
  horizontalSnapTimer=setTimeout(snapHorizontalToNearest,140);
}
async function renderAll(){
  const generation=++renderGeneration;
  for(const model of models){
    if(generation!==renderGeneration)return;
    model.task?.cancel();
    const cssWidth=pageWidthFor(model)*zoom/100;
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
function touchCenter(touches){return {x:(touches[0].clientX+touches[1].clientX)/2,y:(touches[0].clientY+touches[1].clientY)/2};}
function beginPinch(touches){
  const center=touchCenter(touches),model=modelAtPoint(center.x,center.y),rect=model?.element.getBoundingClientRect();
  return {anchorX:rect?(center.x-rect.left)/rect.width:null,anchorY:rect?(center.y-rect.top)/rect.height:null,center,distance:distance(touches),lastZoom:zoom,modelNumber:model?.number??null,scrollX:window.scrollX,scrollY:window.scrollY,zoom};
}
function applyPinch(touches){
  const center=touchCenter(touches),targetZoom=clamp(pinch.zoom*distance(touches)/pinch.distance),delta=Math.max(-6,Math.min(6,targetZoom-pinch.lastZoom));
  if(Math.abs(delta)<.08)return;
  const nextZoom=clamp(pinch.lastZoom+delta*.55);pinch.lastZoom=nextZoom;
  setZoom(nextZoom,false);
  const model=models.find(item=>item.number===pinch.modelNumber);
  if(model&&pinch.anchorX!==null&&pinch.anchorY!==null){
    const rect=model.element.getBoundingClientRect();
    window.scrollBy({left:rect.left+pinch.anchorX*rect.width-center.x,top:rect.top+pinch.anchorY*rect.height-center.y,behavior:'auto'});
  }else{
    const scale=nextZoom/pinch.zoom;
    window.scrollTo({left:(pinch.scrollX+pinch.center.x)*scale-center.x,top:(pinch.scrollY+pinch.center.y)*scale-center.y,behavior:'auto'});
  }
}
document.addEventListener('touchstart',event=>{
  if(pencilPointerId!==null)return;
  if(event.touches.length===2){pinch=beginPinch(event.touches);snapTouch=null;tapTouch=null;}
  else if(event.touches.length===1){
    const touch=event.touches[0];
    tapTouch={time:Date.now(),x:touch.clientX,y:touch.clientY};
    if(navigationMode==='snap')snapTouch={x:touch.clientX,y:touch.clientY};
  }
},{passive:true});
document.addEventListener('touchmove',event=>{
  if(pencilPointerId!==null){event.preventDefault();return;}
  if(pinch&&event.touches.length===2){
    event.preventDefault();applyPinch(event.touches);return;
  }
  if(tapTouch&&event.touches.length===1){
    const touch=event.touches[0],dx=touch.clientX-tapTouch.x,dy=touch.clientY-tapTouch.y;
    if(Math.abs(dx)>10||Math.abs(dy)>10)tapTouch=null;
  }
  if(snapTouch&&event.touches.length===1&&navigationMode==='snap'&&!transitionRunning){
    const dx=event.touches[0].clientX-snapTouch.x,dy=event.touches[0].clientY-snapTouch.y;
    if(Math.abs(dy)>Math.abs(dx)&&Math.abs(dy)>=24)event.preventDefault();
  }
},{passive:false});
document.addEventListener('touchend',event=>{
  if(pinch&&event.touches.length<2){pinch=null;renderAnnotations();scheduleRender();}
  if(tapTouch&&event.changedTouches.length>0){
    const touch=event.changedTouches[0],dx=touch.clientX-tapTouch.x,dy=touch.clientY-tapTouch.y,elapsed=Date.now()-tapTouch.time;
    if(Math.abs(dx)<=10&&Math.abs(dy)<=10&&elapsed<300){
      const target=document.elementFromPoint(touch.clientX,touch.clientY),pageElement=target?.closest?.('.page');
      const page=pageElement?Number(pageElement.dataset.page):null;
      if(!menuVisible&&page)scrollToPage(page,true);
      send({type:'tap',page});
    }
    tapTouch=null;
  }
  if(snapTouch&&event.changedTouches.length>0){
    const touch=event.changedTouches[0],dx=touch.clientX-snapTouch.x,dy=touch.clientY-snapTouch.y;
    if(Math.abs(dy)>Math.abs(dx)&&Math.abs(dy)>=24){
      const step=layout==='two-page'?2:1;
      scrollToPage(currentPage+(dy<0?step:-step));
    }else requestAnimationFrame(snapToNearest);
    snapTouch=null;
    return;
  }
  if(navigationMode==='snap'&&!pinch)requestAnimationFrame(snapToNearest);
},{passive:true});
document.addEventListener('touchcancel',()=>{
  tapTouch=null;snapTouch=null;
  pinch=null;
},{passive:true});
window.addEventListener('resize',()=>{applySizing();scheduleRender();});
window.addEventListener('scroll',handleScroll,{passive:true});
window.mulistPdf={setZoom,setLayout,setNavigationMode,scrollToPage,setMenuVisible:value=>{menuVisible=Boolean(value);},setDrawingTool:value=>{drawingTool=value==='pen'||value==='highlighter'||value==='eraser'?value:null;},setDrawingColor:value=>{if(typeof value==='string'&&/^#[0-9A-Fa-f]{6}$/.test(value))drawingColor=value;},setPencilSmoothing:value=>{if(Number.isFinite(value))pencilSmoothing=Math.max(0,Math.min(10,value));},setNoteLayer:value=>{if(value&&Array.isArray(value.strokes)&&Array.isArray(value.texts)){noteLayer=value;renderAnnotations();}}};

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
    const element=document.createElement('section'),canvas=document.createElement('canvas'),annotationCanvas=document.createElement('canvas');
    element.className='page';element.dataset.page=String(number);canvas.className='pdf-canvas';annotationCanvas.className='annotation-layer';element.append(canvas,annotationCanvas);pagesElement.append(element);
    models.push({page,number,element,canvas,annotationCanvas,originalWidth:viewport.width,ratio:viewport.height/viewport.width,task:null});
  }
  applySizing();statusElement.remove();reportZoom();
  send({type:'ready',pageCount:pdfDocument.numPages});
  await renderAll();
  scrollToPage(currentPage);reportPage();
}catch(error){
  statusElement.textContent='PDF를 열지 못했습니다.';send({type:'error',message:error?.message??String(error)});
}})();
</script></body></html>`;
}

function escapeInlineScript(value: string): string {
  return value.replace(/<\/script/gi, '<\\/script');
}
