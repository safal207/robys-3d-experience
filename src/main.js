import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { createCafeScene } from './scene.js';
import { VIEWS, clamp, constrainedMove } from './navigation.js';

const app=document.getElementById('app');
const canvas=document.getElementById('world');
const scene=new THREE.Scene();
const renderer=new THREE.WebGLRenderer({canvas,antialias:true,powerPreference:'high-performance',alpha:false});
renderer.outputColorSpace=THREE.SRGBColorSpace;
renderer.toneMapping=THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure=1.22;
renderer.setPixelRatio(Math.min(window.devicePixelRatio,window.innerWidth < 750 ? 1.25 : 1.75));
renderer.shadowMap.enabled=window.innerWidth >= 750;
renderer.shadowMap.type=THREE.PCFSoftShadowMap;
const camera=new THREE.PerspectiveCamera(58,1,.10,180);
camera.position.set(...VIEWS.exterior.position);
const controls=new OrbitControls(camera,canvas);
controls.enableDamping=true;controls.dampingFactor=.065;
controls.maxPolarAngle=Math.PI*.495;
controls.minDistance=1.3;controls.maxDistance=52;
controls.target.set(...VIEWS.exterior.target);
controls.update();
const model=createCafeScene(scene);
const clock=new THREE.Clock();
const cameraTarget=new THREE.Vector3(...VIEWS.exterior.position);
const orbitTarget=new THREE.Vector3(...VIEWS.exterior.target);
const modeButtons={orbit:document.getElementById('orbitBtn'),walk:document.getElementById('walkBtn')};
let currentView='exterior', mode='orbit', floor=0, transitioning=false, night=false;
let yaw=0,pitch=0,looking=false,lastX=0,lastY=0;
const keys=new Set();let touchDirection=null;

function updateSize(){
  const w=window.innerWidth,h=window.innerHeight;
  renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix();
}
window.addEventListener('resize',updateSize);updateSize();

function selectPlace(name, toWalk=false) {
  const view=VIEWS[name];if(!view) return;
  currentView=name;
  document.querySelectorAll('.place').forEach(el=>{
    const active=el.dataset.view===name;el.classList.toggle('active',active);el.setAttribute('aria-pressed',String(active));
  });
  const target=new THREE.Vector3(...view.target);
  const point=new THREE.Vector3(...view.position);
  if(toWalk){
    setMode('walk');floor=view.floor;
    camera.position.copy(point);
    camera.position.y=floor?5.72:1.70;
    const direction=target.sub(camera.position).normalize();yaw=Math.atan2(-direction.x,-direction.z);
    pitch=Math.asin(clamp(direction.y,-.95,.95));
    syncWalkOrientation();
    transitioning=false;
  } else {
    if(mode==='walk')setMode('orbit');
    cameraTarget.copy(point);orbitTarget.copy(target);
    transitioning=true;
  }
}
function syncWalkOrientation() {
  camera.rotation.order='YXZ';camera.rotation.y=yaw;camera.rotation.x=pitch;
}
function setMode(next){
  mode=next;
  controls.enabled=mode==='orbit';
  app.classList.toggle('walking',mode==='walk');
  Object.entries(modeButtons).forEach(([name,btn])=>{btn.classList.toggle('selected',name===mode);btn.setAttribute('aria-pressed',String(name===mode));});
  document.getElementById('instructions').textContent=mode==='orbit'?'◉ Перетаскивай для вращения  ·  Колесо — масштаб':'WASD / стрелки — движение  ·  Перетаскивай — осмотр';
  if(mode==='walk'){
    const dir=new THREE.Vector3();camera.getWorldDirection(dir);
    yaw=Math.atan2(-dir.x,-dir.z);pitch=Math.asin(clamp(dir.y,-.95,.95));
    floor= currentView==='upstairs'?1:0;
    camera.position.y=floor?5.72:1.70;
    controls.enabled=false;
    transitioning=false;
    syncWalkOrientation();
  } else {
    camera.rotation.set(0,0,0);
    camera.up.set(0,1,0);
    controls.target.copy(camera.position).add(new THREE.Vector3(-Math.sin(yaw)*4,0,-Math.cos(yaw)*4));
    controls.update();
    const v=VIEWS[currentView];cameraTarget.set(...v.position);orbitTarget.set(...v.target);
    transitioning=true;
  }
}
function setNight(v) {
  night=v;model.setNight(v);
  document.getElementById('lightBtn').setAttribute('aria-pressed',String(v));
  document.getElementById('lightText').textContent=v?'Вечер':'День';
  document.querySelector('.sun-icon').textContent=v?'☾':'☼';
}
for(const el of document.querySelectorAll('.place'))el.addEventListener('click',()=>selectPlace(el.dataset.view));
modeButtons.orbit.addEventListener('click',()=>setMode('orbit'));
modeButtons.walk.addEventListener('click',()=>selectPlace(currentView,true));
document.getElementById('startWalk').addEventListener('click',()=>selectPlace('hall',true));
document.getElementById('resetView').addEventListener('click',()=>selectPlace('exterior'));
document.getElementById('lightBtn').addEventListener('click',()=>setNight(!night));
document.getElementById('fullBtn').addEventListener('click',()=>{
  if(document.fullscreenElement)document.exitFullscreen?.();
  else document.documentElement.requestFullscreen?.().catch(()=>{});
});
document.getElementById('aboutOpen').addEventListener('click',()=>document.getElementById('aboutDialog').showModal());

document.addEventListener('keydown',event=>{
  const key=event.key.toLowerCase();
  if(['w','a','s','d','arrowup','arrowdown','arrowleft','arrowright','shift'].includes(key)){
    if(event.target.closest('dialog'))return;
    keys.add(key);if(mode==='walk')event.preventDefault();
  }
  if(key==='escape'&&mode==='walk')setMode('orbit');
});
document.addEventListener('keyup',event=>keys.delete(event.key.toLowerCase()));
window.addEventListener('blur',()=>keys.clear());
canvas.addEventListener('pointerdown',event=>{
  if(mode!=='walk')return;
  looking=true;lastX=event.clientX;lastY=event.clientY;canvas.setPointerCapture(event.pointerId);
});
canvas.addEventListener('pointermove',event=>{
  if(mode!=='walk'||!looking)return;
  yaw+=(lastX-event.clientX)*.0046;
  pitch=clamp(pitch+(lastY-event.clientY)*.0035,-1.15,1.15);
  lastX=event.clientX;lastY=event.clientY;syncWalkOrientation();
});
for(const name of ['pointerup','pointercancel','lostpointercapture'])canvas.addEventListener(name,()=>looking=false);
for(const button of document.querySelectorAll('[data-move]')){
  const start=event=>{event.preventDefault();touchDirection=button.dataset.move;button.setPointerCapture(event.pointerId);};
  button.addEventListener('pointerdown',start);
  for(const name of ['pointerup','pointercancel','lostpointercapture'])button.addEventListener(name,()=>{if(touchDirection===button.dataset.move)touchDirection=null;});
}
function walk(dt) {
  const forward=Number(keys.has('w')||keys.has('arrowup')||touchDirection==='forward')-Number(keys.has('s')||keys.has('arrowdown')||touchDirection==='back');
  const side=Number(keys.has('d')||keys.has('arrowright')||touchDirection==='right')-Number(keys.has('a')||keys.has('arrowleft')||touchDirection==='left');
  if(!forward&&!side)return;
  const norm=Math.hypot(forward,side)||1;
  const speed=(keys.has('shift')?5:2.9)*Math.min(dt,.06)/norm;
  const dx=(-Math.sin(yaw)*forward+Math.cos(yaw)*side)*speed;
  const dz=(-Math.cos(yaw)*forward-Math.sin(yaw)*side)*speed;
  const next=constrainedMove(camera.position,dx,dz,model.colliders,floor);
  camera.position.x=next.x;camera.position.z=next.z;
}
function animate(){
  requestAnimationFrame(animate);
  const dt=clock.getDelta();
  if(mode==='orbit'){
    if(transitioning){
      const k=1-Math.exp(-3.4*dt);
      camera.position.lerp(cameraTarget,k);
      controls.target.lerp(orbitTarget,k);
      if(camera.position.distanceTo(cameraTarget)<.022&&controls.target.distanceTo(orbitTarget)<.022){transitioning=false;camera.position.copy(cameraTarget);controls.target.copy(orbitTarget);}
    }
    controls.update();
  } else walk(dt);
  renderer.render(scene,camera);
}
requestAnimationFrame(()=>{document.getElementById('loading').classList.add('hidden');animate();});

// Surface an actionable fallback instead of a permanent blank canvas if WebGL is lost.
canvas.addEventListener('webglcontextlost',e=>{
  e.preventDefault();const banner=document.createElement('div');banner.className='webgl-error';banner.textContent='3D-контекст потерян. Перезагрузи страницу или включи аппаратное ускорение.';app.append(banner);
});