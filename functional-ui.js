(() => {
  const $ = id => document.getElementById(id);
  const photoInput = $('photoInput');
  const cropModal = $('cropModal');
  const cropCanvas = $('cropCanvas');
  const cropZoom = $('cropZoom');
  const cropZoomValue = $('cropZoomValue');
  const frontInput = $('frontOverlayInput');
  const backInput = $('backOverlayInput');
  const status = text => { const s=$('overlayStatusVisible'); if(s) s.textContent=text; };

  function dataURL(file) { return new Promise((resolve,reject)=>{ const r=new FileReader(); r.onload=()=>resolve(r.result); r.onerror=reject; r.readAsDataURL(file); }); }
  function fileFromDataUrl(dataUrl,name,type='image/png') { const [meta,b64]=dataUrl.split(','); const bin=atob(b64); const bytes=new Uint8Array(bin.length); for(let i=0;i<bin.length;i++) bytes[i]=bin.charCodeAt(i); return new File([bytes],name,{type:meta.match(/data:(.*?);/)?.[1]||type}); }
  function setInputFile(input,file){ try { const dt=new DataTransfer(); dt.items.add(file); input.files=dt.files; input.dispatchEvent(new Event('change',{bubbles:true})); return true; } catch(e) { console.error(e); return false; } }

  document.querySelectorAll('.design-upload[for]').forEach(label => {
    label.addEventListener('click', event => { event.preventDefault(); event.stopPropagation(); const input=$(label.htmlFor); input?.click(); }, true);
  });
  function artworkStatus(){
    const f=frontInput?.files?.[0], b=backInput?.files?.[0];
    if(f&&b) status(`Front: ${f.name} · Back: ${b.name} · Ready to generate`);
    else if(f) status(`Front selected: ${f.name} · Select the back artwork`);
    else if(b) status(`Back selected: ${b.name} · Select the front artwork`);
    else status('Upload both front and back artwork to generate the card.');
  }
  frontInput?.addEventListener('change',artworkStatus,true); backInput?.addEventListener('change',artworkStatus,true);

  let sourceImage=null, sourceUrl=null, cropState={scale:1,x:0,y:0};
  // The crop frame matches the actual photo slot in the 54 × 86 mm card template.
  const TEMPLATE_PHOTO_RATIO=(625*0.5872)/(965*0.4487);
  function openCrop(){
    const file=photoInput?.files?.[0];
    if(!file){ alert('Please upload an employee photo first.'); return; }
    if(sourceUrl) URL.revokeObjectURL(sourceUrl);
    sourceUrl=URL.createObjectURL(file); sourceImage=new Image();
    sourceImage.onload=()=>{ cropState={scale:1,x:0,y:0}; cropZoom.value=100; cropZoomValue.textContent='100%'; drawCrop(); cropModal.hidden=false; document.body.classList.add('crop-open'); };
    sourceImage.onerror=()=>alert('Could not open the selected photo.'); sourceImage.src=sourceUrl;
  }
  function drawCrop(){
    if(!cropCanvas||!sourceImage)return;
    const ctx=cropCanvas.getContext('2d'); const W=cropCanvas.width,H=cropCanvas.height;
    ctx.clearRect(0,0,W,H); ctx.fillStyle='#eef2f7'; ctx.fillRect(0,0,W,H);
    const pad=24, frameRatio=TEMPLATE_PHOTO_RATIO, frame={x:pad,y:pad,w:W-pad*2,h:(W-pad*2)/frameRatio}; frame.y=(H-frame.h)/2;
    const fit=Math.max(frame.w/sourceImage.naturalWidth,frame.h/sourceImage.naturalHeight)*cropState.scale;
    const iw=sourceImage.naturalWidth*fit,ih=sourceImage.naturalHeight*fit;
    ctx.save(); ctx.beginPath(); ctx.rect(frame.x,frame.y,frame.w,frame.h); ctx.clip(); ctx.imageSmoothingEnabled=true; ctx.imageSmoothingQuality='high'; ctx.drawImage(sourceImage,(W-iw)/2+cropState.x,(H-ih)/2+cropState.y,iw,ih); ctx.restore();
    ctx.strokeStyle='rgba(8,105,220,.9)'; ctx.lineWidth=3; ctx.strokeRect(frame.x,frame.y,frame.w,frame.h); ctx.strokeStyle='rgba(255,255,255,.75)'; ctx.lineWidth=1; ctx.beginPath(); ctx.moveTo(W/2,frame.y);ctx.lineTo(W/2,frame.y+frame.h);ctx.moveTo(frame.x,frame.y+frame.h/2);ctx.lineTo(frame.x+frame.w,frame.y+frame.h/2);ctx.stroke();
  }
  function closeCrop(){cropModal.hidden=true;document.body.classList.remove('crop-open');if(sourceUrl){URL.revokeObjectURL(sourceUrl);sourceUrl=null;}}
  function bakeCrop(){
    if(!sourceImage)return;
    const W=1200,H=Math.round(W/TEMPLATE_PHOTO_RATIO), previewW=cropCanvas.width-48,previewH=cropCanvas.height;
    const fit=Math.max(W/sourceImage.naturalWidth,H/sourceImage.naturalHeight)*cropState.scale, iw=sourceImage.naturalWidth*fit,ih=sourceImage.naturalHeight*fit;
    const px=cropState.x/previewW*W, py=cropState.y/previewH*H;
    const c=document.createElement('canvas'); c.width=W;c.height=H;const ctx=c.getContext('2d'); ctx.fillStyle='#fff';ctx.fillRect(0,0,W,H);ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality='high';ctx.drawImage(sourceImage,(W-iw)/2+px,(H-ih)/2+py,iw,ih);
    c.toBlob(blob=>{if(!blob){alert('Could not crop the photo.');return;}const file=new File([blob],'employee-photo-cropped.jpg',{type:'image/jpeg'});if(setInputFile(photoInput,file))closeCrop();},'image/jpeg',.98);
  }
  $('resetPhoto')?.addEventListener('click',e=>{e.preventDefault();e.stopImmediatePropagation();openCrop();},true);
  $('closeCrop')?.addEventListener('click',closeCrop,true); $('cropDone')?.addEventListener('click',bakeCrop,true);
  $('cropReset')?.addEventListener('click',()=>{cropState={scale:1,x:0,y:0};cropZoom.value=100;cropZoomValue.textContent='100%';drawCrop();},true);
  cropZoom?.addEventListener('input',()=>{cropState.scale=Number(cropZoom.value)/100;cropZoomValue.textContent=`${cropZoom.value}%`;drawCrop();},true);
  let cropDrag=null;
  cropCanvas?.addEventListener('pointerdown',e=>{cropDrag={x:e.clientX,y:e.clientY};cropCanvas.setPointerCapture(e.pointerId);});
  cropCanvas?.addEventListener('pointermove',e=>{if(!cropDrag)return;cropState.x+=e.clientX-cropDrag.x;cropState.y+=e.clientY-cropDrag.y;cropDrag={x:e.clientX,y:e.clientY};drawCrop();});
  ['pointerup','pointercancel'].forEach(t=>cropCanvas?.addEventListener(t,()=>cropDrag=null));
  document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!cropModal.hidden)closeCrop();});

  function preview(){
    const existing=$('functionalPreview'); if(existing){existing.remove();return;}
    const modal=document.createElement('div'); modal.id='functionalPreview'; modal.className='functional-modal'; modal.innerHTML=`<div class="functional-dialog"><div class="functional-head"><h2>Print Preview</h2><button type="button" data-close>×</button></div><div class="functional-preview-grid"><div><strong>FRONT</strong><canvas id="previewFront"></canvas></div><div><strong>BACK</strong><canvas id="previewBack"></canvas></div></div><div class="functional-actions"><button type="button" data-close>Close</button><button type="button" id="previewPrint">Print</button></div></div>`;
    document.body.appendChild(modal); [['frontCanvas','previewFront'],['backCanvas','previewBack']].forEach(([a,b])=>{const src=$(a),dst=$(b);dst.width=src.width;dst.height=src.height;dst.getContext('2d').drawImage(src,0,0);});
    modal.querySelectorAll('[data-close]').forEach(b=>b.onclick=()=>modal.remove()); modal.querySelector('#previewPrint').onclick=()=>printCards();
  }
  function printCards(){
    const f=$('frontCanvas'),b=$('backCanvas'),w=window.open('','_blank','width=1200,height=900'); if(!w){alert('Please allow pop-ups for printing.');return;}
    const fu=f.toDataURL('image/jpeg',1),bu=b.toDataURL('image/jpeg',1); w.document.write(`<html><head><title>Jayalakshmi ID Card</title><style>@page{size:auto;margin:0}body{margin:0;padding:12mm;display:flex;gap:10mm;justify-content:center;align-items:flex-start}img{width:54mm;height:86mm;object-fit:fill;break-inside:avoid}</style></head><body><img src="${fu}"><img src="${bu}"></body></html>`); w.document.close(); w.onload=()=>{w.focus();w.print();};
  }
  function downloadJpgs(){
    const code=($('employeeCode')?.value||'EMPLOYEE_CODE').trim().replace(/[<>:"/\\|?*\x00-\x1F]+/g,'_').replace(/[. ]+$/g,'')||'EMPLOYEE_CODE';
    [['frontCanvas',`${code}_FRONT.jpg`],['backCanvas',`${code}_BACK.jpg`]].forEach(([id,name])=>{const a=document.createElement('a');a.href=$(id).toDataURL('image/jpeg',1);a.download=name;document.body.appendChild(a);a.click();a.remove();});
  }

  const TEMPLATE_KEY='jayalakshmi-id-card-templates-v1';
  async function saveTemplate(){
    try {
      const templates=JSON.parse(localStorage.getItem(TEMPLATE_KEY)||'{}'); const name=prompt('Template name',$('employeeCode')?.value.trim()||'Jayalakshmi Template'); if(!name)return;
      templates[name]={savedAt:new Date().toISOString(),fields:Object.fromEntries(['name','employeeCode','designation','address','contact','bloodGroup'].map(id=>[id,$(id)?.value||''])),front:frontInput?.files?.[0]?await dataURL(frontInput.files[0]):null,back:backInput?.files?.[0]?await dataURL(backInput.files[0]):null};
      localStorage.setItem(TEMPLATE_KEY,JSON.stringify(templates)); alert(`Template "${name}" saved.`);
    } catch(e) { console.error(e); alert('Could not save the template. The artwork may be too large for local template storage.'); }
  }
  async function templates(){
    try {
      const all=JSON.parse(localStorage.getItem(TEMPLATE_KEY)||'{}'); const names=Object.keys(all); const choice=prompt(names.length?`Templates:\n${names.map((n,i)=>`${i+1}. ${n}`).join('\n')}\n\nEnter a template name to load:`:'No saved templates yet. Enter a name to save a new template:');
      if(!choice)return;
      if(!all[choice]){if(confirm(`"${choice}" is not saved. Save the current card as this template?`)) await saveTemplate();return;}
      const t=all[choice]; Object.entries(t.fields||{}).forEach(([id,val])=>{if($(id))$(id).value=val;});
      ['name','employeeCode','designation','address','contact','bloodGroup'].forEach(id=>$(id)?.dispatchEvent(new Event('input',{bubbles:true})));
      if(t.front)setInputFile(frontInput,fileFromDataUrl(t.front,'front-template.png')); if(t.back)setInputFile(backInput,fileFromDataUrl(t.back,'back-template.png')); alert(`Template "${choice}" loaded.`);
    } catch(e) { console.error(e); alert('Could not load the template.'); }
  }

  $('templatesButton')?.addEventListener('click',e=>{e.preventDefault();e.stopImmediatePropagation();templates();},true);
  $('saveTemplateButton')?.addEventListener('click',e=>{e.preventDefault();e.stopImmediatePropagation();saveTemplate();},true);
  $('previewButton')?.addEventListener('click',e=>{e.preventDefault();e.stopImmediatePropagation();preview();},true);
  $('downloadButton')?.addEventListener('click',e=>{e.preventDefault();e.stopImmediatePropagation();downloadJpgs();},true);
  $('printButton')?.addEventListener('click',e=>{e.preventDefault();e.stopImmediatePropagation();printCards();},true);
  $('aboutButton')?.addEventListener('click',e=>{e.preventDefault();e.stopImmediatePropagation();alert('Jayalakshmi ID Card Generator\nv0.2.0\n\n600 DPI employee ID card production studio.');},true);
  artworkStatus();
})();
