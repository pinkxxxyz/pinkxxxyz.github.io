import * as THREE from 'three';
import { GLTFLoader } from './assets/vendor/three/examples/jsm/loaders/GLTFLoader.js';
import { CatMotion } from './cat-motion.mjs';
import { createRestPoses } from './cat-rest-poses.mjs';

const lane=document.querySelector('#works>.korokke-lane');
const canvas=document.getElementById('korokke-canvas');
const reduced=matchMedia('(prefers-reduced-motion: reduce)');
let motion,renderer,scene,camera,mixer,actor,centered,body,model,actions,currentAction;
let ready=false,inView=false,loading=false,failed=false,disposed=false,contextLost=false;
let frame=0,lastTime=0,range=1,worldHeight=1,modelScale=1,halfWidth=1,displayCatPixels=124,gaitRate=1;
const footVertices=new Set();
const bounds=new THREE.Box3(),point=new THREE.Vector3();
function fail(error){failed=true;lane.dataset.catState='error';cancelAnimationFrame(frame);frame=0;console.error('Korokke 3D could not load:',error);}
function selectAction(name,immediate=false){
 // Only validated, existing actions are accepted during startup and frames.
 const clipName=name;
 const next=actions[clipName];
 if(!next)throw new Error('Missing Korokke animation action: '+clipName);
 if(next===currentAction&&!immediate)return;
 const fade=clipName==='stand'?.85:.65;
 if(immediate)mixer.stopAllAction();else if(currentAction)currentAction.fadeOut(fade);
 next.reset().setEffectiveTimeScale(clipName==='walk'?gaitRate:clipName==='groom'?1:0).setEffectiveWeight(1);
 if(!immediate)next.fadeIn(fade);
 next.play();currentAction=next;
}
function resize(){
 if(!renderer||!camera||disposed||contextLost)return;
 const width=lane.clientWidth,height=lane.clientHeight;if(!width||!height)return;
 renderer.setPixelRatio(Math.min(devicePixelRatio||1,matchMedia('(max-width:520px)').matches?1.25:1.5));renderer.setSize(width,height,false);
 // Preserve room to walk even on unusually narrow screens.
 const catPixels=Math.min(matchMedia('(max-width:520px)').matches?80:124,width*.3);
 displayCatPixels=catPixels;
 worldHeight=.93*height/catPixels;halfWidth=worldHeight*width/height/2;
 camera.left=-halfWidth;camera.right=halfWidth;camera.top=worldHeight;camera.bottom=0;camera.updateProjectionMatrix();
 if(ready){place();if(inView&&!document.hidden)renderer.render(scene,camera);}
}
function place(){
 actor.position.set(0,0,0);actor.rotation.y=motion.yaw;actor.updateMatrixWorld(true);body.skeleton.update();
 // The animated body has just 1,790 vertices. Probe actual skinned vertices,
 // not the unskinned box, so paws remain on the original Works border.
 bounds.makeEmpty();let footY=Infinity;const positions=body.geometry.getAttribute('position');
 for(let i=0;i<positions.count;i++){body.getVertexPosition(i,point);point.applyMatrix4(body.matrixWorld);bounds.expandByPoint(point);if(footVertices.has(i))footY=Math.min(footY,point.y);}
 const margin=.035*modelScale;
 const left=-halfWidth-bounds.min.x+margin,right=halfWidth-bounds.max.x-margin;
 range=Math.max(.01,right-left);
 actor.position.x=left<=right?THREE.MathUtils.lerp(left,right,motion.x):-(bounds.min.x+bounds.max.x)/2;
 actor.position.y=-footY+motion.height;
 actor.updateMatrixWorld(true);
}
function render(now){
 frame=0;if(!ready||!inView||document.hidden||contextLost||reduced.matches||disposed||failed)return;
 if(!lastTime)lastTime=now;
 const delta=(now-lastTime)/1000;
 if(delta>=1/30){
  lastTime=now;const dt=Math.min(delta,.1);
  const travelPixels=Math.max(1,range*lane.clientHeight/worldHeight);
  // A full trip aims for ~18s, bounded by a natural, size-relative gait speed.
  const nominalSpeed=32*displayCatPixels/124;
  const speed=Math.max(nominalSpeed*.55,Math.min(nominalSpeed,travelPixels/18));
  gaitRate=speed/nominalSpeed;
  motion.step(dt,speed/travelPixels);
  selectAction(motion.action);actions.walk.setEffectiveTimeScale(gaitRate);mixer.update(dt);place();renderer.render(scene,camera);lane.dataset.catState=motion.mode;
 }
 frame=requestAnimationFrame(render);
}
function sync(){
 cancelAnimationFrame(frame);frame=0;lastTime=0;
 if(!ready||disposed||contextLost||failed)return;
 if(reduced.matches){
  // A grounded static standing pose; preserve the suspended state and clock.
  selectAction('stand',true);mixer.update(0);place();lane.dataset.catState='still';
  if(inView&&!document.hidden)renderer.render(scene,camera);
 }else if(inView&&!document.hidden){frame=requestAnimationFrame(render);}
}
async function load(){
 if(loading||failed||disposed)return;loading=true;
 try{
  lane.dataset.catState='loading';renderer=new THREE.WebGLRenderer({canvas,alpha:true,antialias:true,powerPreference:'low-power'});
  renderer.setClearColor(0x000000,0);renderer.outputColorSpace=THREE.SRGBColorSpace;
  scene=new THREE.Scene();camera=new THREE.OrthographicCamera(-1,1,1,0,.01,100);
  camera.position.set(0,0,6);camera.lookAt(0,0,0); // horizontal projection: y=0 is exactly the rule
  scene.add(new THREE.AmbientLight(0xffffff,1.7));
  const light=new THREE.DirectionalLight(0xffffff,3);light.position.set(-3,5,6);scene.add(light);
  const fill=new THREE.DirectionalLight(0xffffff,.7);fill.position.set(3,2,-4);scene.add(fill);
  const gltf=await new GLTFLoader().loadAsync(new URL('./assets/models/korokke_with_fur.glb',import.meta.url).href);
  model=gltf.scene;
  if(disposed){disposeModel();return;}
  const walk=gltf.animations.find(clip=>/Walk/i.test(clip.name));
  const idle=gltf.animations.find(clip=>/^IdlePurr/i.test(clip.name));
  const groom=gltf.animations.find(clip=>/^LickCleanIdle/i.test(clip.name));
  if(!walk||!idle||!groom)throw new Error('Original Walk / IdlePurr / LickCleanIdle clips missing.');
  const poses=createRestPoses(idle,walk);
  motion=new CatMotion();
  actor=new THREE.Group();centered=new THREE.Group();actor.add(centered);centered.add(model);scene.add(actor);
  model.traverse(node=>{if(node.isSkinnedMesh&&node.name==='U3DMesh')body=node;});
  if(!body)throw new Error('Original skinned body missing.');
  const joints=body.geometry.getAttribute('skinIndex'),weights=body.geometry.getAttribute('skinWeight');
  for(let i=0;i<joints.count;i++){
   let weight=0;for(let j=0;j<4;j++)if(/_(Foot|Toe0|Hand|Finger0)/.test(body.skeleton.bones[joints.getComponent(i,j)].name))weight+=weights.getComponent(i,j);
   if(weight>=.55)footVertices.add(i);
  }
  if(!footVertices.size)throw new Error('No original paw-weighted vertices found.');
  mixer=new THREE.AnimationMixer(model);
  actions={walk:mixer.clipAction(walk),groom:mixer.clipAction(groom),sit:mixer.clipAction(poses.sit),lie:mixer.clipAction(poses.lie),stand:mixer.clipAction(poses.stand)};
  actions.groom.setLoop(THREE.LoopOnce,1);actions.groom.clampWhenFinished=true;
  for(const name of ['sit','lie','stand']){actions[name].setLoop(THREE.LoopOnce,1);actions[name].clampWhenFinished=true;}
  actions.walk.play();currentAction=actions.walk;mixer.update(0);model.updateMatrixWorld(true);
  const initial=new THREE.Box3().setFromObject(model,true),size=initial.getSize(new THREE.Vector3()),center=initial.getCenter(new THREE.Vector3());
  if(!Number.isFinite(size.y)||size.y<=0)throw new Error('Invalid skinned bounds.');
  modelScale=.93/size.y;centered.scale.setScalar(modelScale);centered.position.set(-center.x*modelScale,0,-center.z*modelScale);
  // Normalization is constant. No mesh/material/texture changes or stretch scaling.
  ready=true;selectAction(motion.action,true);mixer.update(0);resize();sync();
 }catch(error){fail(error);}finally{loading=false;}
}
const resizeObserver=new ResizeObserver(resize);resizeObserver.observe(lane);
const observer=new IntersectionObserver(entries=>{inView=entries[0].isIntersecting;if(inView&&!ready&&!loading&&!failed)load();else sync();},{threshold:0});observer.observe(lane);
const onContextLost=event=>{event.preventDefault();contextLost=true;sync();};
const onContextRestored=()=>{contextLost=false;resize();sync();};
function disposeModel(){
 if(!model)return;const textures=new Set(),materials=new Set();
 model.traverse(node=>{if(node.isMesh){node.geometry.dispose();for(const material of [node.material].flat()){materials.add(material);for(const value of Object.values(material))if(value?.isTexture)textures.add(value);}}});
 for(const texture of textures){texture.source?.data?.close?.();texture.dispose();}for(const material of materials)material.dispose();model=null;
}
function cleanup(event){
 if(event.persisted){cancelAnimationFrame(frame);frame=0;lastTime=0;return;}
 disposed=true;cancelAnimationFrame(frame);observer.disconnect();resizeObserver.disconnect();
 reduced.removeEventListener('change',sync);document.removeEventListener('visibilitychange',sync);
 canvas.removeEventListener('webglcontextlost',onContextLost);canvas.removeEventListener('webglcontextrestored',onContextRestored);
 window.removeEventListener('pagehide',cleanup);window.removeEventListener('pageshow',sync);
 mixer?.stopAllAction();disposeModel();renderer?.dispose();
}
reduced.addEventListener('change',sync);document.addEventListener('visibilitychange',sync);
canvas.addEventListener('webglcontextlost',onContextLost);canvas.addEventListener('webglcontextrestored',onContextRestored);
window.addEventListener('pagehide',cleanup);window.addEventListener('pageshow',sync);
