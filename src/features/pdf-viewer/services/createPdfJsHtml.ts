import type { NoteLayer, ScoreNavigationMode } from '../../../domain/models';
import type { PageLayout } from '../components/ViewerControls';
import type { PdfJsAssetUris } from './pdfJsAssets';

interface PdfJsHtmlOptions extends PdfJsAssetUris {
  fileUri: string;
  initialDrawingColor: string;
  initialDrawingWidth: number;
  initialLayout: PageLayout;
  initialNavigationMode: ScoreNavigationMode;
  initialNoteLayer: NoteLayer;
  initialPencilSmoothing: number;
  initialPreloadOnly: boolean;
  initialPreviewScale: number;
  initialPage: number;
  initialZoom: number;
  pdfBase64: string;
}

export function createPdfJsHtml(options: PdfJsHtmlOptions): string {
  const config = JSON.stringify({
    fileUri: options.fileUri,
    initialDrawingColor: options.initialDrawingColor,
    initialDrawingWidth: options.initialDrawingWidth,
    initialLayout: options.initialLayout,
    initialNavigationMode: options.initialNavigationMode,
    initialNoteLayer: options.initialNoteLayer,
    initialPencilSmoothing: options.initialPencilSmoothing,
    initialPreloadOnly: options.initialPreloadOnly,
    initialPreviewScale: options.initialPreviewScale,
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
#pages{display:grid;gap:12px;padding:12px;justify-content:center;align-items:start;box-sizing:border-box;min-height:100vh;min-width:100%;transform-origin:0 0;width:max-content}
#pages.single{grid-template-columns:max-content}
#pages.two-page{grid-template-columns:repeat(2,max-content)}
#pages.snap-horizontal,#pages.snap-horizontal-page{display:flex;flex-direction:row;flex-wrap:nowrap;align-items:flex-start;justify-content:flex-start;height:100vh;min-height:100vh;width:max-content}
#pages.two-page.snap-horizontal,#pages.two-page.snap-horizontal-page{gap:10px;padding-left:10vw;padding-right:10vw}
.horizontal-scroll-mode{height:100%;overflow-x:auto;overflow-y:auto;-webkit-overflow-scrolling:touch}
.page{background:#fff;box-shadow:0 2px 8px #0008;flex:0 0 auto;position:relative;overflow:hidden}
.page canvas{display:block}
.pdf-canvas{position:relative;z-index:0}
.annotation-layer{inset:0;pointer-events:none;position:absolute;z-index:1}
#status{position:fixed;inset:0;display:grid;place-items:center;background:#272927;z-index:2;font-size:14px}
</style></head><body><div id="status">PDF.js 준비 중…</div><main id="pages"></main>
<script>
window.__mulistPdfStartedAt=performance.now();
window.addEventListener('error',event=>window.ReactNativeWebView?.postMessage(JSON.stringify({type:'diagnostic',message:'PDF.js 실행 진단: '+event.message})));
window.addEventListener('unhandledrejection',event=>window.ReactNativeWebView?.postMessage(JSON.stringify({type:'diagnostic',message:'PDF.js 비동기 진단: '+(event.reason?.message??String(event.reason))})));
</script><script>${workerCode}</script><script>${moduleCode}</script><script>
const config=${config};
const pagesElement=document.getElementById('pages');
const statusElement=document.getElementById('status');
const clamp=value=>Math.max(25,Math.min(250,value));
const send=message=>window.ReactNativeWebView?.postMessage(JSON.stringify(message));
const reportPerformance=(stage,startedAt,detail)=>send({type:'performance',stage,durationMs:Math.round((performance.now()-startedAt)*10)/10,detail});
reportPerformance('pdfjs_engine_bootstrap',window.__mulistPdfStartedAt);
let pdfDocument=null,zoom=clamp(config.initialZoom),layout=config.initialLayout,navigationMode=config.initialNavigationMode;
let currentPage=Math.max(1,config.initialPage),pageReportTimer=null,transitionRunning=false;
let models=[],renderGeneration=0,renderTimer=null,backgroundRenderTimer=null,scrollTrackingFrame=null,pinch=null,snapTouch=null,tapTouch=null,lastSentZoom=-1,menuVisible=true,horizontalSnapTimer=null,horizontalSnapping=false,lastHorizontalScroll=0;
let preloadOnly=Boolean(config.initialPreloadOnly);
let previewScale=Math.max(.1,Math.min(1,config.initialPreviewScale??.35));
let drawingTool=null,drawingColor=config.initialDrawingColor??'#C62828',drawingWidth=Math.max(1,Math.min(40,config.initialDrawingWidth??3.5)),pencilSmoothing=Math.max(0,Math.min(10,config.initialPencilSmoothing??2)),pencilStroke=null,pencilPointerId=null,pencilModel=null,noteLayer=config.initialNoteLayer??{version:2,strokes:[],texts:[]};

function isHorizontal(){return navigationMode==='snap-horizontal'||navigationMode==='snap-horizontal-page';}
function modelAtPoint(x,y){
  const pageElement=document.elementFromPoint(x,y)?.closest?.('.page');
  return pageElement?models.find(model=>model.element===pageElement)??null:null;
}
function nearestModelAtPoint(x,y){
  const direct=modelAtPoint(x,y);if(direct)return direct;
  let nearest=models[0]??null,distance=Infinity;
  for(const model of models){
    const rect=model.element.getBoundingClientRect(),closestX=Math.max(rect.left,Math.min(x,rect.right)),closestY=Math.max(rect.top,Math.min(y,rect.bottom)),next=Math.hypot(x-closestX,y-closestY);
    if(next<distance){distance=next;nearest=model;}
  }
  return nearest;
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
  event.preventDefault();event.stopPropagation();finishPinch();snapTouch=null;tapTouch=null;event.target?.setPointerCapture?.(event.pointerId);pencilPointerId=event.pointerId;pencilModel=modelAtPoint(event.clientX,event.clientY);
  if(!pencilModel)return;
  const point=pagePoint(event,pencilModel);
  if(drawingTool==='eraser'){eraseAt(point,pencilModel);return;}
  pencilStroke={color:drawingColor,id:'pencil-'+Date.now()+'-'+Math.random(),opacity:drawingTool==='highlighter'?0.35:1,page:pencilModel.number,points:[point],tool:drawingTool,width:drawingWidth};renderModelAnnotations(pencilModel);
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
  applyHorizontalPadding();
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
function reportZoomValue(value=zoom){
  const rounded=Math.round(value);
  if(rounded!==lastSentZoom){lastSentZoom=rounded;send({type:'zoom',zoom:rounded});}
}
function scheduleRender(delay=160){
  clearTimeout(renderTimer);clearTimeout(backgroundRenderTimer);
  renderTimer=setTimeout(()=>void renderPriorityPages(),delay);
}
function setZoom(next,render=true){
  zoom=clamp(next);applySizing(render);reportZoomValue();if(render)scheduleRender();
}
function setLayout(next){
  if(next!=='single'&&next!=='two-page')return;
  layout=next;applySizing();scheduleRender(0);requestAnimationFrame(()=>scrollToPage(currentPage));
}
function setNavigationMode(next){
  if(next!=='scroll'&&next!=='snap'&&next!=='snap-horizontal'&&next!=='snap-horizontal-page')return;
  navigationMode=next;applySizing();requestAnimationFrame(()=>scrollToPage(currentPage));
}
function horizontalTwoPageFits(){
  if(layout!=='two-page'||!isHorizontal())return true;
  const model=models[0];if(!model)return true;
  const pageWidth=pageWidthFor(model)*zoom/100;
  return pageWidth<document.documentElement.clientWidth*.48;
}
function usesTwoPageSpread(){return layout==='two-page'&&horizontalTwoPageFits();}
function usesOverlappingSpread(){return usesTwoPageSpread()&&navigationMode==='snap-horizontal-page';}
function snapInsetFor(model){
  const viewportWidth=document.documentElement.clientWidth,pageWidth=pageWidthFor(model)*zoom/100;
  if(usesTwoPageSpread()){
    const next=models[model.number]??model,nextWidth=pageWidthFor(next)*zoom/100;
    return Math.max(12,(viewportWidth-pageWidth-nextWidth-10)/2);
  }
  if(model.number===1)return 12;
  if(model.number===models.length)return Math.max(12,viewportWidth-pageWidth-12);
  return Math.max(12,(viewportWidth-pageWidth)/2);
}
function applyHorizontalPadding(){
  if(!isHorizontal()){pagesElement.style.paddingLeft='';pagesElement.style.paddingRight='';return;}
  const first=models[0];
  if(!first){pagesElement.style.paddingLeft='12px';pagesElement.style.paddingRight='12px';return;}
  const inset=usesTwoPageSpread()?snapInsetFor(first):12;
  pagesElement.style.paddingLeft=inset+'px';pagesElement.style.paddingRight=inset+'px';
}
function normalizePage(page){
  const last=usesOverlappingSpread()?Math.max(1,models.length-1):models.length;
  let next=Math.max(1,Math.min(last,page));
  if(usesTwoPageSpread()&&!usesOverlappingSpread())next=next-(next-1)%2;
  return next;
}
function horizontalScrollElement(){
  const candidates=[document.body,document.scrollingElement,document.documentElement].filter((element,index,array)=>element&&array.indexOf(element)===index);
  return candidates.find(element=>Math.abs(element.scrollLeft)>.5)??candidates.sort((left,right)=>(right.scrollWidth-right.clientWidth)-(left.scrollWidth-left.clientWidth))[0]??document.documentElement;
}
function horizontalScrollPosition(){
  return Math.max(window.scrollX||0,document.body.scrollLeft||0,document.documentElement.scrollLeft||0,document.scrollingElement?.scrollLeft||0);
}
function verticalScrollPosition(){
  return Math.max(window.scrollY||0,document.body.scrollTop||0,document.documentElement.scrollTop||0,document.scrollingElement?.scrollTop||0);
}
function scrollHorizontalTo(left,animated){
  const target=Math.max(0,left),options={left:target,top:verticalScrollPosition(),behavior:animated?'smooth':'auto'};
  const element=horizontalScrollElement();
  element.scrollTo?.(options);
  if(element===document.scrollingElement||element===document.documentElement)window.scrollTo(options);
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
  const model=models[currentPage-1],element=model?.element;
  if(!model||!element)return;
  if(isHorizontal()){
    const inset=snapInsetFor(model);
    scrollHorizontalTo(element.offsetLeft-inset,animated);
    reportPage();
    return;
  }
  window.scrollTo({left:0,top:element.offsetTop-12,behavior:animated||navigationMode==='snap'?'smooth':'auto'});
}
function scrollToTappedPage(page){
  if(!usesOverlappingSpread()){scrollToPage(page,true);return;}
  if(page>=currentPage&&page<=currentPage+1)return;
  scrollToPage(page>currentPage+1?page-1:page,true);
}
function reportPage(){
  clearTimeout(pageReportTimer);pageReportTimer=setTimeout(()=>send({type:'page',page:currentPage}),120);
}
function updateCurrentPage(){
  if(models.length===0)return false;
  const horizontal=isHorizontal();
  let best=models[0],distance=Infinity;
  for(const model of models){
    const rect=model.element.getBoundingClientRect(),position=horizontal?rect.left:rect.top,target=horizontal?snapInsetFor(model):12,next=Math.abs(position-target);
    if(next<distance){distance=next;best=model;}
  }
  let page=Number(best.element.dataset.page);
  if(usesOverlappingSpread())page=Math.min(page,Math.max(1,models.length-1));
  else if(usesTwoPageSpread())page=page-(page-1)%2;
  if(page===currentPage)return false;
  currentPage=page;reportPage();return true;
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
  const horizontalPosition=horizontalScrollPosition(),horizontalMoved=Math.abs(horizontalPosition-lastHorizontalScroll)>.5;
  lastHorizontalScroll=horizontalPosition;
  const pageChanged=updateCurrentPage();
  if(pinch)return;
  if(pageChanged)scheduleRender(35);
  if(navigationMode!=='snap-horizontal-page'||horizontalSnapping||!horizontalMoved)return;
  clearTimeout(horizontalSnapTimer);
  horizontalSnapTimer=setTimeout(snapHorizontalToNearest,140);
}
function queueScrollTracking(){
  if(scrollTrackingFrame!==null)return;
  scrollTrackingFrame=requestAnimationFrame(()=>{scrollTrackingFrame=null;handleScroll();});
}
function renderNumbers(values){
  return [...new Set(values.filter(value=>value>=1&&value<=models.length))];
}
async function renderPdfModel(model,generation,quality='full'){
  if(generation!==renderGeneration||!model)return;
  if(model.renderedZoom===zoom&&model.renderedQuality===quality&&model.canvas.width>1)return;
  model.task?.cancel();
  const cssWidth=pageWidthFor(model)*zoom/100;
  const pixelRatio=quality==='preview'?previewScale:Math.min(window.devicePixelRatio||1,2);
  const viewport=model.page.getViewport({scale:cssWidth/model.originalWidth*pixelRatio});
  const nextCanvas=document.createElement('canvas');
  nextCanvas.className='pdf-canvas';nextCanvas.width=Math.floor(viewport.width);nextCanvas.height=Math.floor(viewport.height);
  nextCanvas.style.width=cssWidth+'px';nextCanvas.style.height=cssWidth*model.ratio+'px';
  const context=nextCanvas.getContext('2d',{alpha:false});
  const task=model.page.render({canvas:nextCanvas,canvasContext:context,viewport});
  model.task=task;
  try{
    await task.promise;
    if(generation!==renderGeneration)return;
    model.canvas.replaceWith(nextCanvas);model.canvas=nextCanvas;model.renderedZoom=zoom;model.renderedQuality=quality;
  }catch(error){
    if(error?.name!=='RenderingCancelledException')throw error;
  }finally{
    if(model.task===task)model.task=null;
  }
}
async function renderRemainingPreviews(generation,anchor){
  const priority=new Set(renderNumbers(usesTwoPageSpread()?[anchor-2,anchor-1,anchor,anchor+1,anchor+2,anchor+3]:[anchor-1,anchor,anchor+1,anchor+2]));
  const remaining=models.filter(model=>!priority.has(model.number)).sort((left,right)=>Math.abs(left.number-anchor)-Math.abs(right.number-anchor));
  for(const model of remaining){
    if(generation!==renderGeneration||anchor!==currentPage)return;
    await renderPdfModel(model,generation,'preview');
    await new Promise(resolve=>setTimeout(resolve,16));
  }
}
async function renderBackgroundPages(generation,anchor){
  if(generation!==renderGeneration||preloadOnly||anchor!==currentPage)return;
  const background=usesTwoPageSpread()?[anchor-2,anchor-1,anchor+2,anchor+3]:[anchor-1,anchor+2];
  for(const number of renderNumbers(background)){
    if(generation!==renderGeneration||anchor!==currentPage)return;
    await renderPdfModel(models[number-1],generation);
  }
  await renderRemainingPreviews(generation,anchor);
}
async function renderPriorityPages(){
  clearTimeout(backgroundRenderTimer);
  const generation=++renderGeneration,anchor=preloadOnly?1:normalizePage(currentPage);
  for(const number of renderNumbers(preloadOnly?[1]:[anchor,anchor+1])){
    if(generation!==renderGeneration)return;
    await renderPdfModel(models[number-1],generation);
  }
  if(generation!==renderGeneration||preloadOnly)return;
  backgroundRenderTimer=setTimeout(()=>void renderBackgroundPages(generation,anchor),80);
}
function distance(touches){
  const x=touches[0].clientX-touches[1].clientX,y=touches[0].clientY-touches[1].clientY;
  return Math.hypot(x,y);
}
function touchCenter(touches){return {x:(touches[0].clientX+touches[1].clientX)/2,y:(touches[0].clientY+touches[1].clientY)/2};}
function beginPinch(touches){
  pagesElement.getAnimations?.().forEach(animation=>animation.cancel());pagesElement.style.transform='';
  const center=touchCenter(touches),model=nearestModelAtPoint(center.x,center.y),rect=model?.element.getBoundingClientRect();
  const previewModels=models.map(item=>({model:item,rect:item.element.getBoundingClientRect()})).filter(item=>item.rect.bottom>=-innerHeight&&item.rect.top<=innerHeight*2&&item.rect.right>=-innerWidth&&item.rect.left<=innerWidth*2).sort((left,right)=>{
    const leftDistance=Math.hypot((left.rect.left+left.rect.right)/2-center.x,(left.rect.top+left.rect.bottom)/2-center.y),rightDistance=Math.hypot((right.rect.left+right.rect.right)/2-center.x,(right.rect.top+right.rect.bottom)/2-center.y);return leftDistance-rightDistance;
  }).slice(0,8);
  if(model&&!previewModels.some(item=>item.model===model)){const modelRect=model.element.getBoundingClientRect();previewModels.push({model,rect:modelRect});}
  for(const item of previewModels){item.model.element.style.transformOrigin='0 0';item.model.element.style.willChange='transform';item.model.element.style.zIndex='3';}
  return {anchorX:rect?(center.x-rect.left)/rect.width:null,anchorY:rect?(center.y-rect.top)/rect.height:null,center,distance:Math.max(1,distance(touches)),frame:null,modelNumber:model?.number??null,pendingCenter:center,pendingZoom:zoom,previewModels,previewZoom:zoom,scrollX:window.scrollX,scrollY:window.scrollY,zoom};
}
function renderPinchPreview(){
  if(!pinch)return;pinch.frame=null;
  const scale=pinch.pendingZoom/pinch.zoom;
  for(const item of pinch.previewModels){
    const translateX=pinch.pendingCenter.x-scale*pinch.center.x+(scale-1)*item.rect.left,translateY=pinch.pendingCenter.y-scale*pinch.center.y+(scale-1)*item.rect.top;
    item.model.element.style.transform='matrix('+scale+',0,0,'+scale+','+translateX+','+translateY+')';
  }
  pinch.previewZoom=pinch.pendingZoom;reportZoomValue(pinch.previewZoom);
}
function applyPinch(touches){
  if(!pinch)return;
  const targetZoom=clamp(pinch.zoom*distance(touches)/pinch.distance),center=touchCenter(touches);
  if(Math.abs(targetZoom-pinch.pendingZoom)>=.08)pinch.pendingZoom=targetZoom;
  pinch.pendingCenter=center;
  if(pinch.frame===null)pinch.frame=requestAnimationFrame(renderPinchPreview);
}
function finishPinch(){
  if(!pinch)return;
  if(pinch.frame!==null){cancelAnimationFrame(pinch.frame);pinch.frame=null;renderPinchPreview();}
  const completed=pinch,finalZoom=clamp(completed.previewZoom),finalCenter=completed.pendingCenter;pinch=null;
  for(const item of completed.previewModels){item.model.element.style.transform='';item.model.element.style.transformOrigin='';item.model.element.style.willChange='auto';item.model.element.style.zIndex='';}
  zoom=finalZoom;applySizing();
  const model=models.find(item=>item.number===completed.modelNumber);
  if(model&&completed.anchorX!==null&&completed.anchorY!==null){
    const rect=model.element.getBoundingClientRect();
    window.scrollBy({left:rect.left+completed.anchorX*rect.width-finalCenter.x,top:rect.top+completed.anchorY*rect.height-finalCenter.y,behavior:'auto'});
  }else{
    const scale=finalZoom/completed.zoom;
    window.scrollTo({left:(completed.scrollX+completed.center.x)*scale-finalCenter.x,top:(completed.scrollY+completed.center.y)*scale-finalCenter.y,behavior:'auto'});
  }
  reportZoomValue();scheduleRender(0);requestAnimationFrame(updateCurrentPage);
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
  if(isHorizontal())queueScrollTracking();
  if(snapTouch&&event.touches.length===1&&navigationMode==='snap'&&!transitionRunning){
    const dx=event.touches[0].clientX-snapTouch.x,dy=event.touches[0].clientY-snapTouch.y;
    if(Math.abs(dy)>Math.abs(dx)&&Math.abs(dy)>=24)event.preventDefault();
  }
},{passive:false});
document.addEventListener('touchend',event=>{
  if(isHorizontal())queueScrollTracking();
  if(pinch&&event.touches.length<2){finishPinch();tapTouch=null;snapTouch=null;return;}
  if(tapTouch&&event.changedTouches.length>0){
    const touch=event.changedTouches[0],dx=touch.clientX-tapTouch.x,dy=touch.clientY-tapTouch.y,elapsed=Date.now()-tapTouch.time;
    if(Math.abs(dx)<=10&&Math.abs(dy)<=10&&elapsed<300){
      const target=document.elementFromPoint(touch.clientX,touch.clientY),pageElement=target?.closest?.('.page');
      const page=pageElement?Number(pageElement.dataset.page):null;
      if(!menuVisible&&page)scrollToTappedPage(page);
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
  finishPinch();
},{passive:true});
window.addEventListener('resize',()=>{if(pinch)finishPinch();else{applySizing();scheduleRender();}});
window.addEventListener('scroll',queueScrollTracking,{passive:true});
document.addEventListener('scroll',queueScrollTracking,{capture:true,passive:true});
document.body.addEventListener('scroll',queueScrollTracking,{passive:true});
window.mulistPdf={setZoom,setLayout,setNavigationMode,scrollToPage,setMenuVisible:value=>{menuVisible=Boolean(value);},setDrawingTool:value=>{drawingTool=value==='pen'||value==='highlighter'||value==='eraser'?value:null;},setDrawingColor:value=>{if(typeof value==='string'&&/^#[0-9A-Fa-f]{6}$/.test(value))drawingColor=value;},setDrawingWidth:value=>{if(Number.isFinite(value))drawingWidth=Math.max(1,Math.min(40,value));},setPencilSmoothing:value=>{if(Number.isFinite(value))pencilSmoothing=Math.max(0,Math.min(10,value));},setPreviewScale:value=>{if(!Number.isFinite(value))return;const next=Math.max(.1,Math.min(1,value));if(next===previewScale)return;previewScale=next;for(const model of models){if(model.renderedQuality==='preview')model.renderedZoom=null;}scheduleRender(0);},setPreloadOnly:value=>{const next=Boolean(value);if(next===preloadOnly)return;preloadOnly=next;applySizing();scheduleRender(0);},setNoteLayer:value=>{if(value&&Array.isArray(value.strokes)&&Array.isArray(value.texts)){noteLayer=value;renderAnnotations();}}};

void (async()=>{try{
  const pdfjs=pdfjsLib;
  globalThis.Worker=undefined;
  statusElement.textContent='PDF 파일 여는 중…';
  const decodeStartedAt=performance.now();
  const binary=atob(config.pdfBase64),pdfBytes=new Uint8Array(binary.length);
  for(let index=0;index<binary.length;index+=1)pdfBytes[index]=binary.charCodeAt(index);
  config.pdfBase64='';
  reportPerformance('base64_decode',decodeStartedAt,'bytes='+pdfBytes.length);
  const documentStartedAt=performance.now();
  const loadingTask=pdfjs.getDocument({data:pdfBytes});
  pdfDocument=await Promise.race([
    loadingTask.promise,
    new Promise((_,reject)=>setTimeout(()=>reject(new Error('PDF 파일 로딩 시간이 초과되었습니다.')),45000)),
  ]);
  reportPerformance('pdf_document_parse',documentStartedAt,'pages='+pdfDocument.numPages);
  const metadataStartedAt=performance.now();
  for(let number=1;number<=pdfDocument.numPages;number+=1){
    const page=await pdfDocument.getPage(number),viewport=page.getViewport({scale:1});
    const element=document.createElement('section'),canvas=document.createElement('canvas'),annotationCanvas=document.createElement('canvas');
    element.className='page';element.dataset.page=String(number);canvas.className='pdf-canvas';annotationCanvas.className='annotation-layer';element.append(canvas,annotationCanvas);pagesElement.append(element);
    models.push({page,number,element,canvas,annotationCanvas,originalWidth:viewport.width,ratio:viewport.height/viewport.width,renderedZoom:null,renderedQuality:null,task:null});
  }
  reportPerformance('all_page_metadata',metadataStartedAt,'pages='+pdfDocument.numPages);
  applySizing();statusElement.remove();reportZoomValue();
  send({type:'ready',pageCount:pdfDocument.numPages});
  const renderStartedAt=performance.now();
  scrollToPage(currentPage);await renderPriorityPages();reportPage();
  reportPerformance('first_visible_render',renderStartedAt,'pages='+renderNumbers(preloadOnly?[1]:[currentPage,currentPage+1]).join(','));
  reportPerformance('viewer_total_ready',window.__mulistPdfStartedAt,'pages='+pdfDocument.numPages);
}catch(error){
  statusElement.textContent='PDF를 열지 못했습니다.';send({type:'error',message:error?.message??String(error)});
}})();
</script></body></html>`;
}

function escapeInlineScript(value: string): string {
  return value.replace(/<\/script/gi, '<\\/script');
}
