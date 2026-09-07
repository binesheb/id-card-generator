/*
 * Jayalakshmi ID Card Generator — single UI/controller implementation.
 * One state object, one renderer, one event system, one export/print pipeline.
 */
(() => {
  'use strict';

  const PRINT_DPI = 600;
  const FALLBACK_SIZE = { width: 625, height: 965 };
  const CARD_FONT = 'Satoshi, Arial, Helvetica, sans-serif';
  const PHOTO = { x: 0.2096, y: 0.1461, w: 0.5872, h: 0.4487, radius: 0.028 };
  const FRONT_TEXT = {
    name: { x: .50, y: .678, maxWidth: .90, size: .068, weight: 500, spacing: .09 },
    designation: { x: .50, y: .739, maxWidth: .94, size: .045, weight: 700, spacing: .025 },
    employeeCode: { x: .50, y: .778, maxWidth: .70, size: .029, weight: 700, spacing: .025 }
  };
  const BACK = {
    heading: { x: .50, y: .205, size: .042, weight: 700 },
    label: { size: .019, weight: 700, spacing: .035 },
    value: { size: .029, weight: 700 },
    card: { x: .09, w: .82, radius: .018, padding: .025 },
    address: { top: .285, height: .275 },
    contact: { top: .590, height: .085 },
    blood: { top: .700, height: .085 },
    addressLineGap: .047
  };
  const $ = id => document.getElementById(id);
  const ids = ['name','employeeCode','designation','address','contact','bloodGroup','photoInput','zoom','frontOverlayInput','backOverlayInput','frontCanvas','backCanvas','photoThumb','photoZoomValue','frontOverlayState','backOverlayState','overlayStatusVisible','overlayStatus','resetPhoto','generate','previewButton','downloadButton','printButton','saveTemplateButton','templatesButton','aboutButton','employeeTab','designTab','employeePanel','designPanel','cropModal','cropCanvas','cropZoom','cropZoomValue','cropReset','cropDone','closeCrop','previewZoom','previewZoomLabel','zoomOut','zoomIn'];
  const el = Object.fromEntries(ids.map(id => [id, $(id)]));

  const state = {
    photo: null,
    frontImage: null,
    backImage: null,
    photoFile: null,
    photoState: { x: 0, y: 0, zoom: 1 },
    layerOrder: localStorage.getItem('jayalakshmi-front-layer-order') || 'front-photo',
    previewScale: 1,
    crop: { open: false, source: null, x: 0, y: 0, zoom: 1 },
    drag: null,
    dirty: false
  };

  function fields() {
    return {
      name: el.name?.value || '', employeeCode: el.employeeCode?.value || '',
      designation: el.designation?.value || '', address: el.address?.value || '',
      contact: el.contact?.value || '', bloodGroup: el.bloodGroup?.value || ''
    };
  }
  function setFields(data = {}) {
    for (const id of ['name','employeeCode','designation','address','contact','bloodGroup']) if (el[id] && data[id] != null) el[id].value = data[id];
  }
  function markDirty() { state.dirty = true; render(); }

  function setCanvasSize(canvas, w, h) { canvas.width = Math.max(1, Math.round(w)); canvas.height = Math.max(1, Math.round(h)); }
  function cardSize() { return state.frontImage ? { width: state.frontImage.naturalWidth, height: state.frontImage.naturalHeight } : FALLBACK_SIZE; }
  function roundedRectPath(ctx, x, y, w, h, r) {
    r = Math.max(0, Math.min(r, Math.min(w,h)/2)); ctx.beginPath();
    ctx.moveTo(x+r,y); ctx.arcTo(x+w,y,x+w,y+h,r); ctx.arcTo(x+w,y+h,x,y+h,r); ctx.arcTo(x,y+h,x,y,r); ctx.arcTo(x,y,x+w,y,r); ctx.closePath();
  }
  function drawBackground(ctx, canvas) { ctx.clearRect(0,0,canvas.width,canvas.height); ctx.fillStyle='#fff'; ctx.fillRect(0,0,canvas.width,canvas.height); }
  function photoBox(canvas) { return { x:canvas.width*PHOTO.x, y:canvas.height*PHOTO.y, w:canvas.width*PHOTO.w, h:canvas.height*PHOTO.h, radius:canvas.width*PHOTO.radius }; }
  function photoGeometry(canvas) {
    const box=photoBox(canvas); if(!state.photo) return {box};
    const scale=Math.max(box.w/state.photo.naturalWidth,box.h/state.photo.naturalHeight)*state.photoState.zoom;
    const w=state.photo.naturalWidth*scale, h=state.photo.naturalHeight*scale;
    return {box,w,h,baseX:box.x+(box.w-w)/2,baseY:box.y+(box.h-h)/2};
  }
  function clampPhotoPosition() {
    if(!state.photo) return;
    const {box,w,h,baseX,baseY}=photoGeometry(el.frontCanvas);
    const minX=box.x+box.w-w-baseX, maxX=box.x-baseX, minY=box.y+box.h-h-baseY, maxY=box.y-baseY;
    state.photoState.x=Math.min(maxX,Math.max(minX,state.photoState.x)); state.photoState.y=Math.min(maxY,Math.max(minY,state.photoState.y));
  }
  function drawPhoto(ctx, canvas) {
    if(!state.photo) return;
    const {box,w,h,baseX,baseY}=photoGeometry(canvas);
    ctx.save(); roundedRectPath(ctx,box.x,box.y,box.w,box.h,box.radius); ctx.clip();
    ctx.imageSmoothingEnabled=true; ctx.imageSmoothingQuality='high';
    ctx.drawImage(state.photo,baseX+state.photoState.x,baseY+state.photoState.y,w,h); ctx.restore();
    ctx.save(); roundedRectPath(ctx,box.x,box.y,box.w,box.h,box.radius); ctx.strokeStyle='rgba(255,255,255,.94)'; ctx.lineWidth=Math.max(2,canvas.width*.004); ctx.stroke(); ctx.restore();
  }
  function setFont(ctx,weight,size) { ctx.font=`${weight} ${size}px ${CARD_FONT}`; }
  function drawText(ctx,value,x,y,size,weight,align='left',fill='#18202a') { ctx.save(); setFont(ctx,weight,size); ctx.fillStyle=fill; ctx.textAlign=align; ctx.textBaseline='middle'; ctx.fillText(value,x,y); ctx.restore(); }
  function drawTextSpacing(ctx,value,x,y,size,weight,spacingRatio,fill='#fff',align='center') {
    if(!spacingRatio) return drawText(ctx,value,x,y,size,weight,align,fill);
    ctx.save(); setFont(ctx,weight,size); ctx.fillStyle=fill; ctx.textBaseline='middle';
    const chars=[...value], gap=size*spacingRatio, widths=chars.map(c=>ctx.measureText(c).width), total=widths.reduce((a,b)=>a+b,0)+gap*Math.max(0,chars.length-1);
    let cursor=align==='left'?x:x-total/2; chars.forEach((c,i)=>{ctx.fillText(c,cursor,y);cursor+=widths[i]+gap;}); ctx.restore();
  }
  function fittedText(ctx,value,x,y,size,maxWidth,weight=700,align='left') { let s=size; while(s>11){setFont(ctx,weight,s);if(ctx.measureText(value).width<=maxWidth)break;s-=.5;} drawText(ctx,value,x,y,s,weight,align); }
  function variableText(ctx,value,spec,canvas) {
    const text=String(value||'').toUpperCase(), max=canvas.width*spec.maxWidth; let size=canvas.width*spec.size;
    while(size>12){setFont(ctx,spec.weight,size);const chars=[...text],gap=size*(spec.spacing||0);const width=chars.reduce((a,c)=>a+ctx.measureText(c).width,0)+gap*Math.max(0,chars.length-1);if(width<=max)break;size-=1;}
    drawTextSpacing(ctx,text,spec.x*canvas.width,spec.y*canvas.height,size,spec.weight,spec.spacing||0,'#fff','center');
  }
  function wrapMultiline(ctx,text,size,maxWidth,weight=500,maxLines=8) {
    setFont(ctx,weight,size); const normalized=String(text||'').replace(/\r\n/g,'\n').replace(/\r/g,'\n'); const lines=[];
    for(const paragraph of normalized.split('\n')){
      const words=paragraph.trim()?paragraph.trim().split(/\s+/):[]; if(!words.length){if(lines.length<maxLines)lines.push('');continue;}
      let line=''; for(const word of words){const candidate=line?`${line} ${word}`:word;if(!line||ctx.measureText(candidate).width<=maxWidth)line=candidate;else{if(lines.length<maxLines)lines.push(line);line=word;}}
      if(line&&lines.length<maxLines)lines.push(line); if(lines.length>=maxLines)break;
    }
    return lines.slice(0,maxLines);
  }

  function drawFront() {
    const canvas=el.frontCanvas,ctx=canvas.getContext('2d',{alpha:false}); drawBackground(ctx,canvas);
    if(state.layerOrder==='photo-front') { if(state.frontImage)ctx.drawImage(state.frontImage,0,0,canvas.width,canvas.height); drawPhoto(ctx,canvas); }
    else { drawPhoto(ctx,canvas); if(state.frontImage)ctx.drawImage(state.frontImage,0,0,canvas.width,canvas.height); }
    const f=fields(); variableText(ctx,f.name||'EMPLOYEE NAME',FRONT_TEXT.name,canvas); variableText(ctx,f.designation||'DESIGNATION',FRONT_TEXT.designation,canvas);
    if(f.employeeCode.trim()) variableText(ctx,f.employeeCode,FRONT_TEXT.employeeCode,canvas);
  }
  function drawInfoCard(ctx,x,y,w,h,r) { ctx.save();roundedRectPath(ctx,x,y,w,h,r);ctx.fillStyle='rgba(255,255,255,.95)';ctx.fill();ctx.strokeStyle='rgba(218,178,112,.95)';ctx.lineWidth=Math.max(2,ctx.canvas.width*.0025);ctx.stroke();ctx.restore(); }
  function drawCircleIcon(ctx,x,y,type){
    const r=ctx.canvas.width*.03;ctx.save();ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.fillStyle='rgba(239,39,47,.12)';ctx.fill();ctx.fillStyle='#ef2730';ctx.strokeStyle='#ef2730';ctx.lineWidth=Math.max(3,ctx.canvas.width*.004);
    if(type==='pin'){ctx.beginPath();ctx.arc(x,y-r*.18,r*.3,0,Math.PI*2);ctx.stroke();ctx.beginPath();ctx.moveTo(x-r*.62,y-r*.02);ctx.quadraticCurveTo(x,y+r*.95,x+r*.62,y-r*.02);ctx.stroke();ctx.beginPath();ctx.arc(x,y-r*.18,r*.09,0,Math.PI*2);ctx.fill();}
    else if(type==='phone'){ctx.beginPath();ctx.arc(x,y,r*.58,-2.25,.45);ctx.stroke();ctx.beginPath();ctx.moveTo(x-r*.55,y-r*.5);ctx.lineTo(x-r*.22,y-r*.62);ctx.lineTo(x-r*.02,y-r*.25);ctx.moveTo(x+r*.55,y+r*.5);ctx.lineTo(x+r*.22,y+r*.62);ctx.lineTo(x+r*.02,y+r*.25);ctx.stroke();}
    else {ctx.beginPath();ctx.moveTo(x,y-r*.62);ctx.bezierCurveTo(x-r*.35,y-r*.15,x-r*.48,y+r*.12,x,y+r*.68);ctx.bezierCurveTo(x+r*.48,y+r*.12,x+r*.35,y-r*.15,x,y-r*.62);ctx.fill();} ctx.restore();
  }
  function drawLabel(ctx,value,x,y,scale){drawTextSpacing(ctx,value,x,y,scale*BACK.label.size,BACK.label.weight,BACK.label.spacing,'#667080','left');}
  function drawBack(){
    const canvas=el.backCanvas,ctx=canvas.getContext('2d',{alpha:false});drawBackground(ctx,canvas);if(state.backImage)ctx.drawImage(state.backImage,0,0,canvas.width,canvas.height);
    const f=fields(), scale=canvas.width, cardX=scale*BACK.card.x, cardW=scale*BACK.card.w, pad=scale*BACK.card.padding, radius=scale*BACK.card.radius;
    drawText(ctx,'EMERGENCY DETAILS',BACK.heading.x*scale,BACK.heading.y*canvas.height,scale*BACK.heading.size,BACK.heading.weight,'center','#fff');
    const at=canvas.height*BACK.address.top, ah=canvas.height*BACK.address.height; drawInfoCard(ctx,cardX,at,cardW,ah,radius); drawCircleIcon(ctx,cardX+pad+scale*.018,at+scale*.045,'pin');
    const ax=cardX+scale*.095; drawLabel(ctx,'EMERGENCY ADDRESS',ax,at+canvas.height*.055,scale);
    const addressLines=wrapMultiline(ctx,f.address.trim()||'Emergency address',scale*BACK.value.size,cardW-scale*.13,500,7);
    const start=at+canvas.height*.105, gap=canvas.height*BACK.addressLineGap;
    addressLines.forEach((line,i)=>fittedText(ctx,line,ax,start+i*gap,scale*BACK.value.size,cardW-scale*.15,500,'left'));
    const ct=canvas.height*BACK.contact.top,ch=canvas.height*BACK.contact.height;drawInfoCard(ctx,cardX,ct,cardW,ch,radius);drawCircleIcon(ctx,cardX+pad+scale*.018,ct+ch/2,'phone');const cx=cardX+scale*.095;drawLabel(ctx,'CONTACT',cx,ct+ch*.35,scale);fittedText(ctx,f.contact.trim()||'—',cx,ct+ch*.68,scale*BACK.value.size,cardW-scale*.15,700,'left');
    const bt=canvas.height*BACK.blood.top,bh=canvas.height*BACK.blood.height;drawInfoCard(ctx,cardX,bt,cardW,bh,radius);drawCircleIcon(ctx,cardX+pad+scale*.018,bt+bh/2,'blood');const bx=cardX+scale*.095;drawLabel(ctx,'BLOOD GROUP',bx,bt+bh*.35,scale);drawText(ctx,f.bloodGroup||'—',bx,bt+bh*.68,scale*BACK.value.size,700,'left');
  }
  function render(){
    const fs=cardSize(), bs=state.backImage?{width:state.backImage.naturalWidth,height:state.backImage.naturalHeight}:fs;
    setCanvasSize(el.frontCanvas,fs.width,fs.height);setCanvasSize(el.backCanvas,bs.width,bs.height);clampPhotoPosition();drawFront();drawBack();updateUIState();
  }

  function loadImage(file){
    return new Promise((resolve,reject)=>{if(!file||!file.type.startsWith('image/'))return reject(new Error('Please select a PNG, JPG or WebP image.'));const url=URL.createObjectURL(file),img=new Image();img.onload=()=>{URL.revokeObjectURL(url);resolve(img);};img.onerror=()=>{URL.revokeObjectURL(url);reject(new Error('Could not read the selected image.'));};img.src=url;});
  }
  function updatePhotoThumb(file){if(!el.photoThumb)return;el.photoThumb.innerHTML='';el.photoThumb.style.backgroundImage=file?`url(${URL.createObjectURL(file)})`:'';if(file){const u=el.photoThumb.style.backgroundImage.match(/url\("?(.*?)"?\)/)?.[1];setTimeout(()=>{try{if(u)URL.revokeObjectURL(u);}catch{}},5000);}}
  async function onPhoto(file){try{state.photo=await loadImage(file);state.photoFile=file;state.photoState={x:0,y:0,zoom:1};if(el.zoom)el.zoom.value=1;if(el.photoZoomValue)el.photoZoomValue.textContent='100%';updatePhotoThumb(file);markDirty();}catch(e){alert(e.message);}}
  async function onArtwork(file,side){try{const img=await loadImage(file);state[side]=img;markDirty();}catch(e){alert(e.message);}}

  // Crop editor modifies the shared photo state directly; no second photo renderer exists.
  function openCrop(){if(!state.photo){alert('Please upload an employee photo first.');return;}state.crop={open:true,source:state.photo,x:state.photoState.x,y:state.photoState.y,zoom:state.photoState.zoom};el.cropZoom.value=Math.round(state.crop.zoom*100);el.cropZoomValue.textContent=`${el.cropZoom.value}%`;el.cropModal.hidden=false;document.body.classList.add('crop-open');drawCrop();}
  function closeCrop(){state.crop.open=false;el.cropModal.hidden=true;document.body.classList.remove('crop-open');}
  function drawCrop(){if(!state.crop.open||!state.crop.source)return;const c=el.cropCanvas,ctx=c.getContext('2d'),W=c.width,H=c.height,pad=24,ratio=(625*PHOTO.w)/(965*PHOTO.h),fw=W-pad*2,fh=fw/ratio,fy=(H-fh)/2;ctx.clearRect(0,0,W,H);ctx.fillStyle='#eef2f7';ctx.fillRect(0,0,W,H);const fit=Math.max(fw/state.crop.source.naturalWidth,fh/state.crop.source.naturalHeight)*state.crop.zoom,iw=state.crop.source.naturalWidth*fit,ih=state.crop.source.naturalHeight*fit;ctx.save();ctx.beginPath();ctx.rect(pad,fy,fw,fh);ctx.clip();ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality='high';ctx.drawImage(state.crop.source,(W-iw)/2+state.crop.x,(H-ih)/2+state.crop.y,iw,ih);ctx.restore();ctx.strokeStyle='rgba(8,105,220,.9)';ctx.lineWidth=3;ctx.strokeRect(pad,fy,fw,fh);ctx.strokeStyle='rgba(255,255,255,.8)';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(W/2,fy);ctx.lineTo(W/2,fy+fh);ctx.moveTo(pad,fy+fh/2);ctx.lineTo(pad+fw,fy+fh/2);ctx.stroke();}
  function finishCrop(){if(!state.crop.source)return;state.photoState={x:state.crop.x,y:state.crop.y,zoom:state.crop.zoom};el.zoom.value=state.crop.zoom;el.photoZoomValue.textContent=`${Math.round(state.crop.zoom*100)}%`;closeCrop();markDirty();}

  function safeName(){return (el.employeeCode?.value.trim()||'EMPLOYEE_CODE').replace(/[<>:"/\\|?*\x00-\x1F]+/g,'_').replace(/[. ]+$/g,'')||'EMPLOYEE_CODE';}
  function dataUrlFiles(){return [{name:`${safeName()}_FRONT.jpg`,dataUrl:el.frontCanvas.toDataURL('image/jpeg',1)},{name:`${safeName()}_BACK.jpg`,dataUrl:el.backCanvas.toDataURL('image/jpeg',1)}];}
  async function downloadJpgs(){
    render();const files=dataUrlFiles();
    if(window.idCardDesktop?.saveJpgs){try{const dir=await window.idCardDesktop.chooseOutputDirectory();if(dir){await window.idCardDesktop.saveJpgs(dir,files);setReady(`Saved to ${dir}`);return;}}catch(e){console.error(e);}}
    for(const file of files){const a=document.createElement('a');a.href=file.dataUrl;a.download=file.name;document.body.appendChild(a);a.click();a.remove();}setReady('JPG files generated');
  }
  function printCards(){render();const f=el.frontCanvas.toDataURL('image/jpeg',1),b=el.backCanvas.toDataURL('image/jpeg',1),w=window.open('','_blank','width=1200,height=900');if(!w){alert('Please allow pop-ups for printing.');return;}w.document.write(`<html><head><title>Jayalakshmi ID Card</title><style>@page{size:auto;margin:0}body{margin:0;padding:10mm;display:flex;gap:8mm;justify-content:center;align-items:flex-start}img{width:54mm;height:86mm;object-fit:fill;break-inside:avoid}</style></head><body><img src="${f}"><img src="${b}"></body></html>`);w.document.close();w.onload=()=>{w.focus();w.print();};}
  function preview(){
    render();const old=$('functionalPreview');if(old){old.remove();return;}const modal=document.createElement('div');modal.id='functionalPreview';modal.className='functional-modal';modal.innerHTML=`<div class="functional-dialog"><div class="functional-head"><h2>Print Preview</h2><button type="button" data-close>×</button></div><div class="functional-preview-grid"><div><strong>FRONT</strong><canvas id="previewFront"></canvas></div><div><strong>BACK</strong><canvas id="previewBack"></canvas></div></div><div class="functional-actions"><button type="button" data-close>Close</button><button type="button" id="previewPrint">Print</button></div></div>`;document.body.appendChild(modal);for(const [a,b] of [['frontCanvas','previewFront'],['backCanvas','previewBack']]){const s=$(a),d=$(b);d.width=s.width;d.height=s.height;d.getContext('2d').drawImage(s,0,0);}modal.querySelectorAll('[data-close]').forEach(b=>b.onclick=()=>modal.remove());modal.querySelector('#previewPrint').onclick=()=>{modal.remove();printCards();};
  }

  const TEMPLATE_KEY='jayalakshmi-id-card-templates-v2';
  function templatePayload(){return {version:2,savedAt:new Date().toISOString(),fields:fields(),layerOrder:state.layerOrder,photoState:state.photoState,front:state.frontImage?el.frontCanvas.toDataURL('image/png'):null,back:state.backImage?el.backCanvas.toDataURL('image/png'):null};}
  async function saveTemplate(){
    const name=prompt('Template name',el.employeeCode?.value.trim()||'Jayalakshmi Template');if(!name?.trim())return;try{const all=JSON.parse(localStorage.getItem(TEMPLATE_KEY)||'{}');const p=templatePayload();all[name.trim()]=p;localStorage.setItem(TEMPLATE_KEY,JSON.stringify(all));setReady(`Template "${name.trim()}" saved`);}catch(e){console.error(e);alert('Could not save the template. Try smaller artwork files.');}
  }
  function dataUrlToFile(data,name){const [meta,b64]=data.split(',');const bin=atob(b64),bytes=new Uint8Array(bin.length);for(let i=0;i<bin.length;i++)bytes[i]=bin.charCodeAt(i);return new File([bytes],name,{type:meta.match(/data:(.*?);/)?.[1]||'image/png'});}
  async function loadTemplate(){
    const all=JSON.parse(localStorage.getItem(TEMPLATE_KEY)||'{}'),names=Object.keys(all);if(!names.length){alert('No saved templates yet.');return;}const choice=prompt(`Saved templates:\n\n${names.map((n,i)=>`${i+1}. ${n}`).join('\n')}\n\nEnter the exact template name to load:`);if(!choice)return;const t=all[choice];if(!t){alert('Template not found. Please enter the exact name.');return;}
    setFields(t.fields);state.layerOrder=t.layerOrder||'front-photo';localStorage.setItem('jayalakshmi-front-layer-order',state.layerOrder);if(t.photoState)state.photoState={...state.photoState,...t.photoState};
    if(t.front){state.frontImage=await loadImage(dataUrlToFile(t.front,'front-template.png'));}if(t.back){state.backImage=await loadImage(dataUrlToFile(t.back,'back-template.png'));}render();setLayerUI();setReady(`Template "${choice}" loaded`);
  }

  function setReady(text){const s=document.querySelector('.ready-status');if(s)s.innerHTML=`<span></span> ${text}`;}
  function setLayerUI(){document.querySelectorAll('input[name="frontLayerOrder"]').forEach(r=>{r.checked=r.value===state.layerOrder;});const label=state.layerOrder==='photo-front'?'TEXT › PHOTO › FRONT IMAGE':'TEXT › FRONT IMAGE › PHOTO';if($('layerOrderStatus'))$('layerOrderStatus').textContent=label;}
  function updateUIState(){
    setLayerUI();if(el.photoZoomValue)el.photoZoomValue.textContent=`${Math.round(state.photoState.zoom*100)}%`;
    if(el.frontOverlayState)el.frontOverlayState.textContent=state.frontImage?`Loaded · ${state.frontImage.naturalWidth} × ${state.frontImage.naturalHeight}`:'No front image selected';
    if(el.backOverlayState)el.backOverlayState.textContent=state.backImage?`Loaded · ${state.backImage.naturalWidth} × ${state.backImage.naturalHeight}`:'No back image selected';
    if(el.overlayStatusVisible)el.overlayStatusVisible.textContent=state.frontImage&&state.backImage?'Front and back artwork loaded. Ready to generate.':state.frontImage?'Front artwork loaded. Select the back artwork.':state.backImage?'Back artwork loaded. Select the front artwork.':'Upload both front and back artwork to begin.';
  }

  // Single event binding point.
  function bind(){
    el.photoInput?.addEventListener('change',e=>onPhoto(e.target.files?.[0]));
    el.frontOverlayInput?.addEventListener('change',e=>onArtwork(e.target.files?.[0],'frontImage'));
    el.backOverlayInput?.addEventListener('change',e=>onArtwork(e.target.files?.[0],'backImage'));
    ['name','employeeCode','designation','address','contact','bloodGroup'].forEach(id=>el[id]?.addEventListener('input',markDirty));
    el.zoom?.addEventListener('input',()=>{state.photoState.zoom=Number(el.zoom.value);clampPhotoPosition();markDirty();});
    el.resetPhoto?.addEventListener('click',openCrop);
    el.closeCrop?.addEventListener('click',closeCrop);el.cropDone?.addEventListener('click',finishCrop);el.cropReset?.addEventListener('click',()=>{state.crop.x=0;state.crop.y=0;state.crop.zoom=1;el.cropZoom.value=100;el.cropZoomValue.textContent='100%';drawCrop();});
    el.cropZoom?.addEventListener('input',()=>{state.crop.zoom=Number(el.cropZoom.value)/100;el.cropZoomValue.textContent=`${el.cropZoom.value}%`;drawCrop();});
    let cropDrag=null;el.cropCanvas?.addEventListener('pointerdown',e=>{cropDrag={x:e.clientX,y:e.clientY};el.cropCanvas.setPointerCapture(e.pointerId);});el.cropCanvas?.addEventListener('pointermove',e=>{if(!cropDrag)return;state.crop.x+=e.clientX-cropDrag.x;state.crop.y+=e.clientY-cropDrag.y;cropDrag={x:e.clientX,y:e.clientY};drawCrop();});['pointerup','pointercancel'].forEach(t=>el.cropCanvas?.addEventListener(t,()=>cropDrag=null));
    el.frontCanvas?.addEventListener('pointerdown',e=>{if(!state.photo)return;state.drag={x:e.clientX,y:e.clientY};el.frontCanvas.setPointerCapture(e.pointerId);});el.frontCanvas?.addEventListener('pointermove',e=>{if(!state.drag||!state.photo)return;const r=el.frontCanvas.getBoundingClientRect(),sx=el.frontCanvas.width/r.width,sy=el.frontCanvas.height/r.height;state.photoState.x+=(e.clientX-state.drag.x)*sx;state.photoState.y+=(e.clientY-state.drag.y)*sy;state.drag={x:e.clientX,y:e.clientY};clampPhotoPosition();render();});['pointerup','pointercancel','pointerleave'].forEach(t=>el.frontCanvas?.addEventListener(t,()=>state.drag=null));
    document.querySelectorAll('.design-upload[for]').forEach(label=>label.addEventListener('click',e=>{e.preventDefault();$(label.htmlFor)?.click();}));
    document.querySelectorAll('input[name="frontLayerOrder"]').forEach(r=>r.addEventListener('change',()=>{state.layerOrder=r.value;localStorage.setItem('jayalakshmi-front-layer-order',state.layerOrder);markDirty();}));
    el.employeeTab?.addEventListener('click',()=>{el.employeePanel.hidden=false;el.designPanel.hidden=true;el.employeeTab.classList.add('active');el.designTab.classList.remove('active');el.employeeTab.setAttribute('aria-selected','true');el.designTab.setAttribute('aria-selected','false');});
    el.designTab?.addEventListener('click',()=>{el.employeePanel.hidden=true;el.designPanel.hidden=false;el.designTab.classList.add('active');el.employeeTab.classList.remove('active');el.designTab.setAttribute('aria-selected','true');el.employeeTab.setAttribute('aria-selected','false');});
    el.generate?.addEventListener('click',()=>{if(!fields().name.trim()||!fields().designation.trim()||!fields().employeeCode.trim()){alert('Please enter Employee Name, Designation and Employee Code before generating.');return;}if(!state.frontImage||!state.backImage){alert('Please upload both front and back card artwork before generating.');return;}render();setReady('ID card generated');});
    el.previewButton?.addEventListener('click',preview);el.downloadButton?.addEventListener('click',downloadJpgs);el.printButton?.addEventListener('click',printCards);el.saveTemplateButton?.addEventListener('click',saveTemplate);el.templatesButton?.addEventListener('click',loadTemplate);
    el.aboutButton?.addEventListener('click',()=>alert('Jayalakshmi ID Card Generator\nv0.2.0\n\n600 DPI employee ID card production studio.'));
    el.previewZoom?.addEventListener('input',()=>{state.previewScale=Number(el.previewZoom.value)/100;document.documentElement.style.setProperty('--preview-scale',state.previewScale);el.previewZoomLabel.textContent=`${el.previewZoom.value}%`;});el.zoomOut?.addEventListener('click',()=>{el.previewZoom.value=Math.max(60,Number(el.previewZoom.value)-10);el.previewZoom.dispatchEvent(new Event('input'));});el.zoomIn?.addEventListener('click',()=>{el.previewZoom.value=Math.min(140,Number(el.previewZoom.value)+10);el.previewZoom.dispatchEvent(new Event('input'));});
    document.querySelectorAll('[data-window-action]').forEach(b=>b.addEventListener('click',()=>window.idCardDesktop?.windowControl?.(b.dataset.windowAction)));
    document.addEventListener('keydown',e=>{if(e.key==='Escape'&&state.crop.open)closeCrop();});
  }

  bind();
  if(el.previewZoom){el.previewZoom.value=100;el.previewZoom.dispatchEvent(new Event('input'));}
  render();setReady('Ready');
})();
