const PRINT_DPI = 600;
const FALLBACK_SIZE = { width: 625, height: 965 };
const CARD_FONT = 'Satoshi, Arial, Helvetica, sans-serif';
const TEMPLATE = {
  photo: { x: 0.2096, y: 0.1461, w: 0.5872, h: 0.4487, radius: 0.028 },
  name: { x: 0.50, y: 0.678, maxWidth: 0.90, size: 0.068, weight: 500, letterSpacing: 0.09 },
  designation: { x: 0.50, y: 0.739, maxWidth: 0.94, size: 0.045, weight: 700, letterSpacing: 0.025 },
  employeeCode: { x: 0.50, y: 0.778, maxWidth: 0.70, size: 0.029, weight: 700, letterSpacing: 0.025, enabled: true }
};
const BACK_TEXT = {
  heading: { x: 0.50, y: 0.205, size: 0.042, weight: 700 },
  label: { size: 0.019, weight: 700, letterSpacing: 0.035 },
  value: { size: 0.029, weight: 700 },
  address: { x: 0.16, maxWidth: 0.68, lineGap: 0.043 },
  card: { x: 0.09, w: 0.82, radius: 0.018, padding: 0.025 },
  addressCard: { top: 0.305, bottom: 0.535 },
  contactCard: { top: 0.585, height: 0.090 },
  bloodCard: { top: 0.705, height: 0.090 }
};
const $ = id => document.getElementById(id);
const els = Object.fromEntries(['name','employeeCode','designation','address','contact','bloodGroup','photoInput','zoom','frontOverlayInput','backOverlayInput','overlayStatus','frontCanvas','backCanvas','resetPhoto','generate','clear'].map(id => [id, $(id)]));
let photo = null;
let frontOverlay = null;
let backOverlay = null;
let photoState = { x: 0, y: 0, zoom: 1 };
let drag = null;
let outputDirectory = null;

function setCanvasSize(canvas, width, height) { canvas.width = width; canvas.height = height; }
function getSize() { return frontOverlay ? { width: frontOverlay.naturalWidth, height: frontOverlay.naturalHeight } : FALLBACK_SIZE; }
function draw() {
  const size = getSize();
  setCanvasSize(els.frontCanvas, size.width, size.height);
  setCanvasSize(els.backCanvas, backOverlay ? backOverlay.naturalWidth : size.width, backOverlay ? backOverlay.naturalHeight : size.height);
  drawFront(); drawBack();
}
function drawBackground(ctx, canvas) { ctx.clearRect(0,0,canvas.width,canvas.height); ctx.fillStyle='#fff'; ctx.fillRect(0,0,canvas.width,canvas.height); }
function photoBox(canvas) { const r=TEMPLATE.photo; return {x:canvas.width*r.x,y:canvas.height*r.y,w:canvas.width*r.w,h:canvas.height*r.h,radius:canvas.width*r.radius}; }
function roundedRectPath(ctx,x,y,w,h,radius){const r=Math.max(0,Math.min(radius,Math.min(w,h)/2));ctx.beginPath();ctx.moveTo(x+r,y);ctx.arcTo(x+w,y,x+w,y+h,r);ctx.arcTo(x+w,y+h,x,y+h,r);ctx.arcTo(x,y+h,x,y,r);ctx.arcTo(x,y,x+w,y,r);ctx.closePath();}
function currentPhotoGeometry(canvas){const box=photoBox(canvas);const scale=Math.max(box.w/photo.naturalWidth,box.h/photo.naturalHeight)*photoState.zoom;const w=photo.naturalWidth*scale,h=photo.naturalHeight*scale,baseX=box.x+(box.w-w)/2,baseY=box.y+(box.h-h)/2;return {box,w,h,baseX,baseY};}
function clampPhotoPosition(){if(!photo)return;const {box,w,h,baseX,baseY}=currentPhotoGeometry(els.frontCanvas);const minOffsetX=box.x+box.w-w-baseX,maxOffsetX=box.x-baseX,minOffsetY=box.y+box.h-h-baseY,maxOffsetY=box.y-baseY;photoState.x=Math.min(maxOffsetX,Math.max(minOffsetX,photoState.x));photoState.y=Math.min(maxOffsetY,Math.max(minOffsetY,photoState.y));}
function drawFront(){const canvas=els.frontCanvas,ctx=canvas.getContext('2d',{alpha:false});drawBackground(ctx,canvas);if(photo){const {box,w,h,baseX,baseY}=currentPhotoGeometry(canvas);ctx.save();roundedRectPath(ctx,box.x,box.y,box.w,box.h,box.radius);ctx.clip();ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality='high';ctx.drawImage(photo,baseX+photoState.x,baseY+photoState.y,w,h);ctx.restore();ctx.save();roundedRectPath(ctx,box.x,box.y,box.w,box.h,box.radius);ctx.strokeStyle='rgba(255,255,255,.92)';ctx.lineWidth=Math.max(2,canvas.width*.004);ctx.stroke();ctx.restore();}if(frontOverlay)ctx.drawImage(frontOverlay,0,0,canvas.width,canvas.height);drawVariableText(ctx,els.name.value.trim()||'EMPLOYEE NAME',TEMPLATE.name,canvas);drawVariableText(ctx,els.designation.value.trim()||'DESIGNATION',TEMPLATE.designation,canvas);if(TEMPLATE.employeeCode.enabled&&els.employeeCode.value.trim())drawVariableText(ctx,els.employeeCode.value.trim(),TEMPLATE.employeeCode,canvas);}
function drawBack(){
  const canvas=els.backCanvas,ctx=canvas.getContext('2d',{alpha:false});
  drawBackground(ctx,canvas);
  if(backOverlay)ctx.drawImage(backOverlay,0,0,canvas.width,canvas.height);
  const scale=canvas.width;
  const cardX=canvas.width*BACK_TEXT.card.x;
  const cardW=canvas.width*BACK_TEXT.card.w;
  const pad=canvas.width*BACK_TEXT.card.padding;
  const radius=canvas.width*BACK_TEXT.card.radius;
  drawText(ctx,'EMERGENCY DETAILS',BACK_TEXT.heading.x*canvas.width,BACK_TEXT.heading.y*canvas.height,scale*BACK_TEXT.heading.size,BACK_TEXT.heading.weight,'center','#fff');

  const addressTop=canvas.height*BACK_TEXT.addressCard.top;
  const addressHeight=canvas.height*(BACK_TEXT.addressCard.bottom-BACK_TEXT.addressCard.top);
  drawInfoCard(ctx,cardX,addressTop,cardW,addressHeight,radius);
  drawCircleIcon(ctx,cardX+pad+canvas.width*.018,addressTop+canvas.height*.045,'pin');
  const addressX=cardX+canvas.width*.095;
  drawLabel(ctx,'EMERGENCY ADDRESS',addressX,addressTop+canvas.height*.032,scale);
  const addressLines=wrapMultilineText(ctx,els.address.value.trim()||'Emergency address',scale*BACK_TEXT.value.size,cardW-canvas.width*.13,500,6);
  const addressStartY=addressTop+canvas.height*.074;
  const addressLineHeight=canvas.height*BACK_TEXT.address.lineGap;
  addressLines.forEach((line,i)=>drawTextFitted(ctx,line,addressX,addressStartY+i*addressLineHeight,scale*BACK_TEXT.value.size,cardW-canvas.width*.15,500,'left'));

  const contactTop=canvas.height*BACK_TEXT.contactCard.top;
  const contactHeight=canvas.height*BACK_TEXT.contactCard.height;
  drawInfoCard(ctx,cardX,contactTop,cardW,contactHeight,radius);
  drawCircleIcon(ctx,cardX+pad+canvas.width*.018,contactTop+contactHeight/2,'phone');
  const contactX=cardX+canvas.width*.095;
  drawLabel(ctx,'CONTACT',contactX,contactTop+contactHeight*.34,scale);
  drawTextFitted(ctx,els.contact.value.trim()||'—',contactX,contactTop+contactHeight*.68,scale*BACK_TEXT.value.size,cardW-canvas.width*.15,700,'left');

  const bloodTop=canvas.height*BACK_TEXT.bloodCard.top;
  const bloodHeight=canvas.height*BACK_TEXT.bloodCard.height;
  drawInfoCard(ctx,cardX,bloodTop,cardW,bloodHeight,radius);
  drawCircleIcon(ctx,cardX+pad+canvas.width*.018,bloodTop+bloodHeight/2,'blood');
  const bloodX=cardX+canvas.width*.095;
  drawLabel(ctx,'BLOOD GROUP',bloodX,bloodTop+bloodHeight*.34,scale);
  drawTextFitted(ctx,els.bloodGroup.value||'—',bloodX,bloodTop+bloodHeight*.68,scale*BACK_TEXT.value.size,cardW-canvas.width*.15,700,'left');
}
function drawInfoCard(ctx,x,y,w,h,radius){ctx.save();roundedRectPath(ctx,x,y,w,h,radius);ctx.fillStyle='rgba(255,255,255,.94)';ctx.fill();ctx.strokeStyle='rgba(218,178,112,.95)';ctx.lineWidth=Math.max(2,ctx.canvas.width*.0025);ctx.stroke();ctx.restore();}
function drawLabel(ctx,value,x,y,scale){drawTextWithSpacing(ctx,value,x,y,scale*BACK_TEXT.label.size,BACK_TEXT.label.weight,BACK_TEXT.label.letterSpacing,'#667080','left');}
function drawCircleIcon(ctx,x,y,type){const r=ctx.canvas.width*.030;ctx.save();ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.fillStyle='rgba(239,39,47,.12)';ctx.fill();ctx.strokeStyle='rgba(239,39,47,.08)';ctx.lineWidth=1;ctx.stroke();ctx.fillStyle='#ef2730';ctx.strokeStyle='#ef2730';ctx.lineWidth=Math.max(3,ctx.canvas.width*.004);
  if(type==='pin'){ctx.beginPath();ctx.arc(x,y-r*.18,r*.30,0,Math.PI*2);ctx.moveTo(x-r*.62,y-r*.02);ctx.quadraticCurveTo(x,y+r*.95,x+r*.62,y-r*.02);ctx.stroke();ctx.beginPath();ctx.arc(x,y-r*.18,r*.09,0,Math.PI*2);ctx.fill();}
  else if(type==='phone'){ctx.beginPath();ctx.arc(x,y,r*.58,-2.25,.45);ctx.stroke();ctx.beginPath();ctx.moveTo(x-r*.55,y-r*.50);ctx.lineTo(x-r*.22,y-r*.62);ctx.lineTo(x-r*.02,y-r*.25);ctx.moveTo(x+r*.55,y+r*.50);ctx.lineTo(x+r*.22,y+r*.62);ctx.lineTo(x+r*.02,y+r*.25);ctx.stroke();}
  else {ctx.beginPath();ctx.moveTo(x,y-r*.62);ctx.bezierCurveTo(x-r*.35,y-r*.15,x-r*.48,y+r*.12,x,y+r*.68);ctx.bezierCurveTo(x+r*.48,y+r*.12,x+r*.35,y-r*.15,x,y-r*.62);ctx.fill();}
  ctx.restore();}
function wrapMultilineText(ctx,value,size,maxWidth,weight,maxLines){
  setCardFont(ctx,weight,size);
  const source=String(value||'').replace(/\r\n/g,'\n').replace(/\r/g,'\n');
  const lines=[];
  for(const paragraph of source.split('\n')){
    const words=paragraph.trim().split(/\s+/).filter(Boolean);
    if(!words.length){if(lines.length<maxLines)lines.push('');continue;}
    let line='';
    for(const word of words){
      const candidate=line?`${line} ${word}`:word;
      if(ctx.measureText(candidate).width<=maxWidth||!line)line=candidate;
      else {if(lines.length<maxLines)lines.push(line);line=word;}
    }
    if(line&&lines.length<maxLines)lines.push(line);
    if(lines.length>=maxLines)break;
  }
  return lines.slice(0,maxLines);
}
function wrapText(ctx,value,size,maxWidth,weight,maxLines){return wrapMultilineText(ctx,value,size,maxWidth,weight,maxLines);}
function setCardFont(ctx,weight,size){ctx.font=`${weight} ${size}px ${CARD_FONT}`;}
function drawVariableText(ctx,value,spec,canvas){const text=value.toUpperCase(),maxWidth=canvas.width*spec.maxWidth;let size=Math.max(14,canvas.width*spec.size),weight=spec.weight||500;while(size>14){setCardFont(ctx,weight,size);const spacing=size*(spec.letterSpacing||0),measured=[...text].reduce((sum,ch)=>sum+ctx.measureText(ch).width,0)+spacing*Math.max(0,text.length-1);if(measured<=maxWidth)break;size-=1;}drawTextWithSpacing(ctx,text,spec.x*canvas.width,spec.y*canvas.height,size,weight,spec.letterSpacing||0,'#fff');}
function drawTextFitted(ctx,value,x,y,size,maxWidth,weight,align){let current=size;while(current>12){setCardFont(ctx,weight,current);if(ctx.measureText(value).width<=maxWidth)break;current-=1;}drawText(ctx,value,x,y,current,weight,align);}
function drawText(ctx,value,x,y,size,weight,align,fill='#18202a'){ctx.save();ctx.fillStyle=fill;ctx.textAlign=align;ctx.textBaseline='middle';setCardFont(ctx,weight,size);ctx.fillText(value,x,y);ctx.restore();}
function drawTextWithSpacing(ctx,value,x,y,size,weight,spacingRatio,fill,align='center'){if(!spacingRatio)return drawText(ctx,value,x,y,size,weight,align,fill);ctx.save();ctx.fillStyle=fill;setCardFont(ctx,weight,size);ctx.textBaseline='middle';const spacing=size*spacingRatio,chars=[...value],widths=chars.map(ch=>ctx.measureText(ch).width),total=widths.reduce((a,b)=>a+b,0)+spacing*Math.max(0,chars.length-1);let cursor=align==='left'?x:x-total/2;chars.forEach((ch,i)=>{ctx.fillText(ch,cursor,y);cursor+=widths[i]+spacing;});ctx.restore();}
function loadImageFile(file,callback){if(!file)return;if(!file.type.startsWith('image/')){alert('Please select an image file.');return;}const url=URL.createObjectURL(file),img=new Image();img.onload=()=>{URL.revokeObjectURL(url);if(!img.naturalWidth||!img.naturalHeight){alert('The selected image has no usable dimensions.');return;}callback(img);draw();};img.onerror=()=>{URL.revokeObjectURL(url);alert('Could not read that image.');};img.src=url;}
els.photoInput.addEventListener('change',e=>loadImageFile(e.target.files?.[0],img=>{photo=img;photoState={x:0,y:0,zoom:1};els.zoom.value=1;const thumb=$('photoThumb');if(thumb){thumb.style.backgroundImage='none';thumb.innerHTML='';const reader=new FileReader();reader.onload=()=>{thumb.style.backgroundImage=`url(${reader.result})`;};reader.readAsDataURL(e.target.files[0]);}}));
els.frontOverlayInput.addEventListener('change',e=>loadImageFile(e.target.files?.[0],img=>{frontOverlay=img;updateOverlayStatus();}));
els.backOverlayInput.addEventListener('change',e=>loadImageFile(e.target.files?.[0],img=>{backOverlay=img;updateOverlayStatus();}));
function updateOverlayStatus(){if(frontOverlay&&backOverlay){const sameSize=frontOverlay.naturalWidth===backOverlay.naturalWidth&&frontOverlay.naturalHeight===backOverlay.naturalHeight;els.overlayStatus.textContent=sameSize?`Front ${frontOverlay.naturalWidth}×${frontOverlay.naturalHeight} · Rear ${backOverlay.naturalWidth}×${backOverlay.naturalHeight} · Ready`:`Size mismatch: Front ${frontOverlay.naturalWidth}×${frontOverlay.naturalHeight} · Rear ${backOverlay.naturalWidth}×${backOverlay.naturalHeight}`;return;}els.overlayStatus.textContent=`${frontOverlay?'Front overlay loaded':'Front overlay missing'} · ${backOverlay?'Rear overlay loaded':'Rear overlay missing'}`;}
els.zoom.addEventListener('input',()=>{photoState.zoom=Number(els.zoom.value);clampPhotoPosition();draw();});
els.resetPhoto.addEventListener('click',()=>{photoState={x:0,y:0,zoom:1};els.zoom.value=1;draw();});
['name','employeeCode','designation','address','contact','bloodGroup'].forEach(id=>els[id].addEventListener('input',draw));
function pointerPosition(event){const rect=els.frontCanvas.getBoundingClientRect();return{x:(event.clientX-rect.left)*els.frontCanvas.width/rect.width,y:(event.clientY-rect.top)*els.frontCanvas.height/rect.height};}
els.frontCanvas.addEventListener('pointerdown',event=>{if(!photo)return;drag=pointerPosition(event);els.frontCanvas.setPointerCapture(event.pointerId);});
els.frontCanvas.addEventListener('pointermove',event=>{if(!drag||!photo)return;const p=pointerPosition(event);photoState.x+=p.x-drag.x;photoState.y+=p.y-drag.y;drag=p;clampPhotoPosition();draw();});
['pointerup','pointercancel','pointerleave'].forEach(type=>els.frontCanvas.addEventListener(type,event=>{drag=null;if(event.pointerId!==undefined&&els.frontCanvas.hasPointerCapture?.(event.pointerId)){try{els.frontCanvas.releasePointerCapture(event.pointerId);}catch(_){}}}));
function safeCode(){const raw=els.employeeCode.value.trim();return raw.replace(/[<>:"/\\|?*\x00-\x1F]+/g,'_').replace(/[. ]+$/g,'')||'EMPLOYEE_CODE';}
function jpegData(canvas){return stampJpegDpi(canvas.toDataURL('image/jpeg',1),PRINT_DPI);}
function stampJpegDpi(dataUrl,dpi){try{const base64=dataUrl.split(',')[1],bytes=Uint8Array.from(atob(base64),char=>char.charCodeAt(0));for(let i=0;i+15<bytes.length;i++){if(bytes[i]===0xFF&&bytes[i+1]===0xE0&&bytes[i+4]===0x4A&&bytes[i+5]===0x46&&bytes[i+6]===0x49&&bytes[i+7]===0x46&&bytes[i+8]===0x00){bytes[i+11]=1;bytes[i+12]=(dpi>>8)&0xFF;bytes[i+13]=dpi&0xFF;bytes[i+14]=(dpi>>8)&0xFF;bytes[i+15]=dpi&0xFF;let binary='',chunk=0x8000;for(let p=0;p<bytes.length;p+=chunk)binary+=String.fromCharCode(...bytes.subarray(p,p+chunk));return`data:image/jpeg;base64,${btoa(binary)}`;}}}catch(error){console.warn('Could not stamp JPEG DPI metadata; retaining the original JPEG.',error);}return dataUrl;}
async function waitForFonts(){if(document.fonts?.ready){try{await document.fonts.ready;}catch(_){}}}
async function generateFiles(){if(!frontOverlay||!backOverlay)throw new Error('Please load both the front and rear standard overlays.');if(frontOverlay.naturalWidth!==backOverlay.naturalWidth||frontOverlay.naturalHeight!==backOverlay.naturalHeight)throw new Error('Front and rear overlays must have exactly the same pixel dimensions.');if(!photo)throw new Error('Please upload the employee photo.');await waitForFonts();draw();const code=safeCode(),files=[{name:`${code}_FRONT.jpg`,dataUrl:jpegData(els.frontCanvas)},{name:`${code}_BACK.jpg`,dataUrl:jpegData(els.backCanvas)}];if(!window.idCardDesktop){files.forEach(file=>{const link=document.createElement('a');link.download=file.name;link.href=file.dataUrl;link.click();});return true;}if(!outputDirectory)outputDirectory=await window.idCardDesktop.chooseOutputDirectory();if(!outputDirectory)return false;await window.idCardDesktop.saveJpgs({directory:outputDirectory,files});return true;}
els.generate.addEventListener('click',async()=>{try{els.generate.disabled=true;els.generate.querySelector?.('span')&&(els.generate.querySelector('span').textContent='Generating…');const generated=await generateFiles();if(generated)alert('Front and rear JPGs generated successfully.');}catch(error){alert(error.message||'Could not generate the ID card.');}finally{els.generate.disabled=false;const label=els.generate.querySelector?.('span');if(label)label.textContent='Generate ID Card';}});
if(els.clear)els.clear.addEventListener('click',()=>{['name','employeeCode','designation','address','contact'].forEach(id=>{els[id].value='';});els.bloodGroup.value='';els.photoInput.value='';els.frontOverlayInput.value='';els.backOverlayInput.value='';photo=null;frontOverlay=null;backOverlay=null;outputDirectory=null;photoState={x:0,y:0,zoom:1};els.zoom.value=1;updateOverlayStatus();draw();});
draw();
