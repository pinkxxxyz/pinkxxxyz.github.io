export const REST_WEIGHTS=Object.freeze({sit:40,lie:40,groom:20});
export function chooseRest(random=Math.random){const r=random();return r<.4?'sit':r<.8?'lie':'groom';}
export class CatMotion {
 constructor({random=Math.random}={}){
  this.random=random;this.x=0;this.yaw=0;this.height=0;this.direction=1;
  this.mode='walk';this.elapsed=0;this.restKind=null;this.holdDuration=0;this.duration=0;
 }
 get action(){return this.mode==='rest'?this.restKind:this.mode==='turn'?'stand':'walk';}
 step(dt,speed){
  if(dt<=0)return;this.elapsed+=dt;
  if(this.mode==='walk'){
   this.x=Math.max(0,Math.min(1,this.x+this.direction*Math.max(0,speed)*dt));
   if((this.direction>0&&this.x===1)||(this.direction<0&&this.x===0)){
    this.mode='rest';this.elapsed=0;this.restKind=chooseRest(this.random);
    const [min,max]={sit:[4,8],lie:[6,12],groom:[3,6]}[this.restKind];
    this.holdDuration=min+(max-min)*this.random();
    this.duration=.65+this.holdDuration; // hold time starts after settling into the pose
   }
  }else if(this.mode==='rest'){
   if(this.elapsed>=this.duration){this.mode='turn';this.elapsed=0;this.turnStart=this.yaw;}
  }else if(this.mode==='turn'){
   // Stand first, then rotate in place, then resume continuous walking.
   const t=Math.max(0,Math.min(1,(this.elapsed-.85)/1));
   this.yaw=this.turnStart+Math.PI*t*t*(3-2*t);
   if(t===1){this.direction*=-1;this.mode='walk';this.elapsed=0;}
  }
 }
}
