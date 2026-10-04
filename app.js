
const sites=[
{id:"A",name:"Shackleton Rim",lat:-79,lon:18,color:"#61e59b",potential:"High",confidence:"88%",terrain:"Medium",signal:"Strong",sample:"Water-bearing / icy regolith",conductivity:"Low",thermal:"Low",roughness:"High",porosity:"Moderate",env:"Lunar South Pole",insight:"Strong simulated volatile-resource signal with high confidence. Moderate terrain complexity makes this a promising follow-up target.",recommendation:"High-priority follow-up site.",spectrum:[.18,.42,.67,.87]},
{id:"B",name:"Malapert Ridge",lat:-84,lon:72,color:"#f8ca67",potential:"Medium",confidence:"71%",terrain:"Low",signal:"Moderate",sample:"Dry regolith",conductivity:"Low",thermal:"Medium",roughness:"Moderate",porosity:"Low",env:"Lunar South Pole",insight:"Moderate resource signal but favorable terrain.",recommendation:"Useful lower-risk comparison target.",spectrum:[.25,.57]},
{id:"C",name:"Shadow Basin",lat:-86,lon:-32,color:"#61e59b",potential:"High",confidence:"79%",terrain:"High",signal:"Strong",sample:"Porous regolith",conductivity:"Low",thermal:"Low",roughness:"High",porosity:"High",env:"Lunar South Pole",insight:"Highest simulated resource potential in the survey. Terrain risk is elevated.",recommendation:"High potential; gather more mobility data.",spectrum:[.14,.37,.61,.78]},
{id:"D",name:"Polar Plain",lat:-76,lon:-105,color:"#ff8794",potential:"Low",confidence:"92%",terrain:"Low",signal:"Weak",sample:"Dense / compacted regolith",conductivity:"Medium",thermal:"High",roughness:"Low",porosity:"Low",env:"Lunar South Pole",insight:"Low simulated resource potential despite accessible terrain.",recommendation:"Lower volatile priority.",spectrum:[.31,.73]},
{id:"E",name:"Aitken Edge",lat:-53,lon:168,color:"#f8ca67",potential:"Medium",confidence:"76%",terrain:"Medium",signal:"Moderate",sample:"Dry regolith",conductivity:"Low",thermal:"Medium",roughness:"Moderate",porosity:"Moderate",env:"Far Side Basin",insight:"Moderate far-side signal useful for comparison.",recommendation:"Good far-side comparison target.",spectrum:[.20,.52,.79]},
{id:"F",name:"Tycho Ejecta",lat:-43,lon:-11,color:"#ff8794",potential:"Low",confidence:"81%",terrain:"High",signal:"Moderate",sample:"Dense / compacted regolith",conductivity:"Medium",thermal:"High",roughness:"High",porosity:"Low",env:"Lunar Highlands",insight:"Rugged terrain and lower volatile potential.",recommendation:"Use as terrain/material contrast site.",spectrum:[.35,.70]},
{id:"G",name:"Mare Imbrium",lat:33,lon:-15,color:"#f8ca67",potential:"Medium",confidence:"74%",terrain:"Low",signal:"Moderate",sample:"Dry regolith",conductivity:"Medium",thermal:"Medium",roughness:"Low",porosity:"Low",env:"Mare Region",insight:"Smooth mare terrain provides an accessible comparison site.",recommendation:"Accessible site with moderate signal.",spectrum:[.22,.47,.74]},
{id:"H",name:"Oceanus Procellarum",lat:18,lon:-58,color:"#ff8794",potential:"Low",confidence:"69%",terrain:"Low",signal:"Weak",sample:"Dense / compacted regolith",conductivity:"Medium",thermal:"Medium",roughness:"Low",porosity:"Low",env:"Mare Region",insight:"Weak simulated water signal.",recommendation:"Deprioritize for volatile prospecting.",spectrum:[.40,.68]},
{id:"I",name:"Far Side Crater 12",lat:12,lon:145,color:"#61e59b",potential:"High",confidence:"83%",terrain:"Medium",signal:"Strong",sample:"Porous regolith",conductivity:"Low",thermal:"Low",roughness:"Moderate",porosity:"High",env:"Far Side Highlands",insight:"Strong simulated material signal makes this a compelling far-side site.",recommendation:"High-priority far-side target.",spectrum:[.16,.45,.63,.88]},
{id:"J",name:"Aristarchus Plateau",lat:24,lon:-47,color:"#61e59b",potential:"High",confidence:"77%",terrain:"Medium",signal:"Strong",sample:"Water-bearing / icy regolith",conductivity:"Low",thermal:"Medium",roughness:"Moderate",porosity:"Moderate",env:"Plateau Region",insight:"High simulated signal with manageable terrain.",recommendation:"Promising non-polar follow-up target.",spectrum:[.19,.39,.59,.83]}
];
const byId=Object.fromEntries(sites.map(s=>[s.id,s]));
const $=id=>document.getElementById(id);
const canvas=$("moonCanvas"),ctx=canvas.getContext("2d",{alpha:true});
const stage=$("globeStage");
const texture=new Image();
texture.src="moon_texture.jpg";
let textureData=null,tw=0,th=0;
texture.onload=()=>{const oc=document.createElement("canvas");oc.width=texture.width;oc.height=texture.height;const ox=oc.getContext("2d");ox.drawImage(texture,0,0);textureData=ox.getImageData(0,0,oc.width,oc.height).data;tw=oc.width;th=oc.height;renderMoon();};

let yaw=-0.28,pitch=-0.10,zoom=1,drag=false,lastX=0,lastY=0,downX=0,downY=0,auto=true,labels=true,selected=null,frame=null;
let renderSize=330,moonCache=null;
const light={x:-.52,y:.28,z:.80};

function clamp(v,a,b){return Math.max(a,Math.min(b,v))}
function rotateInverse(x,y,z){
  const cp=Math.cos(-pitch),sp=Math.sin(-pitch);
  let y1=y*cp-z*sp,z1=y*sp+z*cp,x1=x;
  const cy=Math.cos(-yaw),sy=Math.sin(-yaw);
  return {x:x1*cy+z1*sy,y:y1,z:-x1*sy+z1*cy};
}
function rotateForward(v){
  const cy=Math.cos(yaw),sy=Math.sin(yaw);
  let x=v.x*cy+v.z*sy,z=-v.x*sy+v.z*cy,y=v.y;
  const cp=Math.cos(pitch),sp=Math.sin(pitch);
  return {x:x,y:y*cp-z*sp,z:y*sp+z*cp};
}
function latLon(lat,lon){
  const la=lat*Math.PI/180,lo=lon*Math.PI/180,c=Math.cos(la);
  return {x:c*Math.sin(lo),y:-Math.sin(la),z:c*Math.cos(lo)};
}
function resize(){
  const r=stage.getBoundingClientRect(),dpr=Math.min(devicePixelRatio||1,2);
  canvas.width=Math.floor(r.width*dpr);canvas.height=Math.floor(r.height*dpr);
  canvas.style.width=r.width+"px";canvas.style.height=r.height+"px";
  ctx.setTransform(dpr,0,0,dpr,0,0);
  renderMoon();drawSpectrum();
}
window.addEventListener("resize",resize);

function sampleTex(u,v){
  if(!textureData)return 145;
  u=((u%1)+1)%1;v=clamp(v,0,1);
  const x=Math.min(tw-1,Math.floor(u*tw)),y=Math.min(th-1,Math.floor(v*th)),i=(y*tw+x)*4;
  return textureData[i];
}
function makeSphere(){
  const s=renderSize,img=ctx.createImageData(s,s),d=img.data;
  for(let py=0;py<s;py++){
    const ny=(py/(s-1))*2-1;
    for(let px=0;px<s;px++){
      const nx=(px/(s-1))*2-1,rr=nx*nx+ny*ny,idx=(py*s+px)*4;
      if(rr>1){d[idx+3]=0;continue;}
      const nz=Math.sqrt(1-rr);
      const world=rotateInverse(nx,ny,nz);
      const lon=Math.atan2(world.x,world.z),lat=-Math.asin(clamp(world.y,-1,1));
      const u=lon/(2*Math.PI)+.5,v=lat/Math.PI+.5;
      const albedo=sampleTex(u,v);
      const illum=Math.max(.08,nx*light.x+ny*light.y+nz*light.z);
      const limb=.55+.45*nz;
      const shade=(.18+.82*Math.max(0,illum))*limb;
      let val=clamp(albedo*shade,0,255);
      d[idx]=val;d[idx+1]=val;d[idx+2]=val*1.01;d[idx+3]=255;
    }
  }
  moonCache=document.createElement("canvas");moonCache.width=s;moonCache.height=s;moonCache.getContext("2d").putImageData(img,0,0);
}
function renderMoon(){
  if(!canvas.width)return;
  const rect=stage.getBoundingClientRect(),w=rect.width,h=rect.height;
  ctx.clearRect(0,0,w,h);
  const cx=w*.5,cy=h*.50,r=Math.min(w*.34,h*.42)*zoom;
  const bg=ctx.createRadialGradient(cx,cy,0,cx,cy,Math.max(w,h)*.62);bg.addColorStop(0,"rgba(93,220,255,.10)");bg.addColorStop(1,"rgba(5,10,19,0)");ctx.fillStyle=bg;ctx.fillRect(0,0,w,h);
  ctx.fillStyle="rgba(255,255,255,.28)";for(let i=0;i<45;i++){const x=(i*83.7)%w,y=(i*53.4)%h;ctx.fillRect(x,y,i%6?1:1.5,i%6?1:1.5);}
  makeSphere();
  ctx.save();ctx.beginPath();ctx.arc(cx,cy,r,0,Math.PI*2);ctx.clip();ctx.imageSmoothingEnabled=true;ctx.drawImage(moonCache,cx-r,cy-r,r*2,r*2);ctx.restore();
  ctx.beginPath();ctx.arc(cx,cy,r,0,Math.PI*2);ctx.strokeStyle="rgba(220,235,245,.20)";ctx.lineWidth=1.2;ctx.stroke();

  const projected=[];
  for(const s of sites){
    const p=rotateForward(latLon(s.lat,s.lon));
    if(p.z<=0)continue;
    const x=cx+p.x*r,y=cy+p.y*r;
    projected.push({...s,x,y,z:p.z});
  }
  projected.sort((a,b)=>a.z-b.z);
  projected.forEach(s=>{
    const active=s.id===selected,rad=active?10:8;
    ctx.beginPath();ctx.arc(s.x,s.y,rad+7,0,Math.PI*2);ctx.fillStyle=s.color+"2b";ctx.fill();
    ctx.beginPath();ctx.arc(s.x,s.y,rad,0,Math.PI*2);ctx.fillStyle=s.color;ctx.fill();ctx.strokeStyle="#fff";ctx.lineWidth=2;ctx.stroke();
    ctx.fillStyle="#061018";ctx.font="700 11px Arial";ctx.textAlign="center";ctx.textBaseline="middle";ctx.fillText(s.id,s.x,s.y+.5);
    if(labels){
      const text=`${s.id} · ${s.name}`;ctx.font="600 11px Arial";const mw=ctx.measureText(text).width,bx=s.x+14,by=s.y-14;
      ctx.fillStyle="rgba(6,11,20,.86)";roundRect(bx,by-11,mw+16,24,7);ctx.fill();ctx.strokeStyle="rgba(255,255,255,.13)";ctx.stroke();
      ctx.fillStyle="#eff6ff";ctx.textAlign="left";ctx.fillText(text,bx+8,by+1);
    }
  });
  canvas._points=projected;
}
function roundRect(x,y,w,h,r){ctx.beginPath();ctx.moveTo(x+r,y);ctx.arcTo(x+w,y,x+w,y+h,r);ctx.arcTo(x+w,y+h,x,y+h,r);ctx.arcTo(x,y+h,x,y,r);ctx.arcTo(x,y,x+w,y,r);ctx.closePath();}
function pick(x,y){let best=null,bd=1e9;for(const p of canvas._points||[]){const dd=Math.hypot(x-p.x,y-p.y);if(dd<18&&dd<bd){best=p;bd=dd}}return best;}

canvas.addEventListener("pointerdown",e=>{drag=true;lastX=downX=e.clientX;lastY=downY=e.clientY;auto=false;$("autoRotate").classList.remove("active");canvas.setPointerCapture(e.pointerId);canvas.classList.add("dragging");});
canvas.addEventListener("pointermove",e=>{if(!drag)return;yaw+=(e.clientX-lastX)*.008;pitch=clamp(pitch+(e.clientY-lastY)*.008,-1.35,1.35);lastX=e.clientX;lastY=e.clientY;renderMoon();});
canvas.addEventListener("pointerup",e=>{const rect=canvas.getBoundingClientRect(),m=Math.hypot(e.clientX-downX,e.clientY-downY);drag=false;canvas.classList.remove("dragging");try{canvas.releasePointerCapture(e.pointerId)}catch{}if(m<7){const p=pick(e.clientX-rect.left,e.clientY-rect.top);if(p)selectSite(p.id)}});
canvas.addEventListener("wheel",e=>{e.preventDefault();zoom=clamp(zoom*(e.deltaY>0?.92:1.08),.72,1.35);renderMoon();},{passive:false});

$("resetView").addEventListener("click",()=>{yaw=-.28;pitch=-.10;zoom=1;renderMoon()});
$("autoRotate").addEventListener("click",e=>{auto=!auto;e.currentTarget.classList.toggle("active",auto)});
$("toggleLabels").addEventListener("click",e=>{labels=!labels;e.currentTarget.classList.toggle("active",labels);renderMoon()});
function tick(){if(auto&&!drag){yaw+=.002;renderMoon()}frame=requestAnimationFrame(tick)}tick();

function selectSite(id){
  selected=id;const s=byId[id];
  $("siteName").textContent=`${s.id} · ${s.name}`;$("scanState").textContent="LIVE";$("scanState").classList.add("live");
  $("latVal").textContent=`${Math.abs(s.lat)}° ${s.lat<0?"S":"N"}`;$("lonVal").textContent=`${Math.abs(s.lon)}° ${s.lon<0?"W":"E"}`;
  $("potentialVal").textContent=s.potential;$("confidenceVal").textContent=s.confidence;$("terrainVal").textContent=s.terrain;$("signalVal").textContent=s.signal;$("sampleVal").textContent=s.sample;$("insightVal").textContent=s.insight;
  $("analysisSite").textContent=`${s.id} · ${s.name}`;$("environmentVal").textContent=s.env;$("conductivityVal").textContent=s.conductivity;$("thermalVal").textContent=s.thermal;$("roughnessVal").textContent=s.roughness;$("porosityVal").textContent=s.porosity;$("analysisPotential").textContent=s.potential;$("analysisConfidence").textContent=`${s.confidence} simulated confidence`;$("recommendationVal").textContent=s.recommendation;
  document.querySelectorAll(".site-btn").forEach(b=>b.classList.toggle("active",b.dataset.id===id));
  renderMoon();drawSpectrum();
}
const siteButtons=$("siteButtons");
sites.forEach(s=>{const b=document.createElement("button");b.className="site-btn";b.dataset.id=s.id;b.innerHTML=`<strong>${s.id} · ${s.name}</strong><small>${s.env}</small>`;b.addEventListener("click",()=>selectSite(s.id));siteButtons.appendChild(b)});
$("openAnalysis").addEventListener("click",()=>{if(!selected)selectSite("A");$("analysis").scrollIntoView({behavior:"smooth"})});

const sc=$("spectrumCanvas"),sx=sc.getContext("2d");
function drawSpectrum(){
  const r=sc.getBoundingClientRect();if(r.width<20)return;const dpr=Math.min(devicePixelRatio||1,2);sc.width=Math.floor(r.width*dpr);sc.height=Math.floor(290*dpr);sx.setTransform(dpr,0,0,dpr,0,0);const w=r.width,h=290;sx.clearRect(0,0,w,h);sx.strokeStyle="rgba(148,163,184,.13)";for(let i=1;i<6;i++){sx.beginPath();sx.moveTo(0,h*i/6);sx.lineTo(w,h*i/6);sx.stroke()}const s=selected?byId[selected]:sites[0];sx.beginPath();for(let x=0;x<w;x++){const t=x/w;let y=.56+.05*Math.sin(t*42)+.03*Math.sin(t*91);s.spectrum.forEach(p=>y-=.18*Math.exp(-Math.pow((t-p)/.03,2)));const py=h*(.18+y*.64);if(x===0)sx.moveTo(x,py);else sx.lineTo(x,py)}const g=sx.createLinearGradient(0,0,w,0);g.addColorStop(0,"#5ddcff");g.addColorStop(1,"#a78bfa");sx.strokeStyle=g;sx.lineWidth=2.2;sx.stroke();}
resize();selectSite("A");
