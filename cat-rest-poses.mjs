import * as THREE from 'three';
// Reuse actual poses from the original clips; no new bone deformation.
function snapshot(clip,time,name){
 const tracks=clip.tracks.map(track=>{
  const value=Array.from(track.createInterpolant().evaluate(time));
  const result=track.clone();result.times=new Float32Array([0,1]);
  result.values=new Float32Array([...value,...value]);result.setInterpolation(THREE.InterpolateLinear);return result;
 });
 return new THREE.AnimationClip(name,1,tracks);
}
export function createRestPoses(idle,walk){
 if(!idle||!walk)throw new Error('Original IdlePurr and Walk clips are required.');
 return{
  sit:snapshot(idle,1/30,'Portfolio_SitHold_FromIdlePurr'),
  lie:snapshot(idle,2,'Portfolio_LieHold_FromIdlePurr'),
  stand:snapshot(walk,.45,'Portfolio_Stand_FromWalk')
 };
}
