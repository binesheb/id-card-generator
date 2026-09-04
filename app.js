const PRINT_DPI = 600;
const CARD_MM = { width: 85.6, height: 53.98 };
const MM_TO_PX = mm => Math.round(mm * PRINT_DPI / 25.4);
const CARD = { width: MM_TO_PX(CARD_MM.width), height: MM_TO_PX(CARD_MM.height) };

const els = Object.fromEntries(['name','employeeCode','designation','address','contact','bloodGroup','photoInput','zoom','frontCanvas','backCanvas','resetPhoto','generate','clear'].map(id => [id, document.getElementById(id)]));
let photo = null;
let photoState = { x: 0, y: 0, zoom: 1 };

function setupCanvas(canvas){ canvas.width = CARD.width; canvas.height = CARD.height; }
setupCanvas(els.frontCanvas); setupCanvas(els.backCanvas);

function draw(){
  drawFront(); drawBack();
}

function drawFront(){
  const c = els.frontCanvas, ctx = c.getContext('2d');
  ctx.clearRect(0,0,c.width,c.height); ctx.fillStyle='#fff'; ctx.fillRect(0,0,c.width,c.height);
  if(photo){
    const fit = Math.max(c.width * .36 / photo.width, c.height * .48 / photo.height) * photoState.zoom;
    const w=photo.width*fit,h=photo.height*fit;
    ctx.drawImage(photo,(c.width-w)/2+photoState.x,(c.height-h)/2+photoState.y,w,h);
  }
  // Placeholder layout. Standard overlay coordinates will replace this after the supplied artwork is added.
  text(ctx, els.name.value || 'EMPLOYEE NAME', c.width/2, c.height*.73, c.width*.055, true);
  text(ctx, els.employeeCode.value || 'EMPLOYEE CODE', c.width/2, c.height*.80, c.width*.038, false);
  text(ctx, els.designation.value || 'DESIGNATION', c.width/2, c.height*.87, c.width*.036, false);
}

function drawBack(){
  const c=els.backCanvas,ctx=c.getContext('2d');
  ctx.clearRect(0,0,c.width,c.height);ctx.fillStyle='#fff';ctx.fillRect(0,0,c.width,c.height);
  ctx.fillStyle='#18202a';ctx.textAlign='left';ctx.font=`700 ${c.width*.042}px Arial`;ctx.fillText('EMERGENCY DETAILS',c.width*.10,c.height*.22);
  ctx.font=`400 ${c.width*.032}px Arial`;
  const address=(els.address.value||'Emergency address').split(/\r?\n/);
  address.slice(0,4).forEach((line,i)=>ctx.fillText(line,c.width*.10,c.height*(.34+i*.075)));
  ctx.font=`700 ${c.width*.032}px Arial`;ctx.fillText(`Contact: ${els.contact.value||'—'}`,c.width*.10,c.height*.70);
  ctx.fillText(`Blood Group: ${els.bloodGroup.value||'—'}`,c.width*.10,c.height*.80);
}

function text(ctx,value,x,y,size,bold){ctx.save();ctx.fillStyle='#18202a';ctx.textAlign='center';ctx.textBaseline='middle';ctx.font=`${bold?'700':'500'} ${size}px Arial`;ctx.fillText(value,x,y);ctx.restore()}

els.photoInput.addEventListener('change',e=>{const file=e.target.files?.[0];if(!file)return;const img=new Image();img.onload=()=>{photo=img;photoState={x:0,y:0,zoom:1};els.zoom.value=1;draw()};img.src=URL.createObjectURL(file)});
els.zoom.addEventListener('input',()=>{photoState.zoom=Number(els.zoom.value);draw()});
els.resetPhoto.addEventListener('click',()=>{photoState={x:0,y:0,zoom:1};els.zoom.value=1;draw()});
['name','employeeCode','designation','address','contact','bloodGroup'].forEach(id=>els[id].addEventListener('input',draw));

function download(canvas,suffix){
  const code=(els.employeeCode.value||'EMPLOYEE_CODE').trim().replace(/[^a-zA-Z0-9._-]+/g,'_');
  const link=document.createElement('a');link.download=`${code}_${suffix}.jpg`;link.href=canvas.toDataURL('image/jpeg',1.0);link.click();
}
els.generate.addEventListener('click',()=>{if(!els.employeeCode.value.trim()){alert('Please enter Employee Code before generating.');els.employeeCode.focus();return}draw();download(els.frontCanvas,'FRONT');setTimeout(()=>download(els.backCanvas,'BACK'),250)});
els.clear.addEventListener('click',()=>{['name','employeeCode','designation','address','contact'].forEach(id=>els[id].value='');els.bloodGroup.value='';els.photoInput.value='';photo=null;photoState={x:0,y:0,zoom:1};els.zoom.value=1;draw()});
draw();
