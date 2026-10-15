import {renderGallery} from './gallery.mjs';
import {applyWorkContent} from './work-media.mjs';
// Adapted from Lucian UX/UI Prompt #039/#044 · MIT License · Copyright (c) 2026 Seokwoooo.
// https://lucianlabs.dev/uxui-prompt/ · full notice: licenses/Lucian-MIT.txt
export function initWorks(root){
 const doc=root.ownerDocument,win=doc.defaultView;
 const tabs=[...root.querySelectorAll('.pw-tab')],panels=[...root.querySelectorAll('.pw-panel')];
 const pill=root.querySelector('.pw-pill'),tablist=root.querySelector('.pw-tabs');
 const reduced=win.matchMedia('(prefers-reduced-motion: reduce)'),hover=win.matchMedia('(hover:hover) and (pointer:fine)');
 const entries=[...root.querySelectorAll('.pw-card')].map(item=>({item,button:item.querySelector('.pw-toggle'),body:item.querySelector('.pw-body'),links:[...item.querySelectorAll('a[data-link]')],panel:item.closest('.pw-panel')}));
 let selected=-1,hoverTimer=0,disposed=false;
 const listeners=[];
 function listen(el,type,fn){el.addEventListener(type,fn);listeners.push(()=>el.removeEventListener(type,fn));}
 function cancelHover(){win.clearTimeout(hoverTimer);hoverTimer=0;}
 function movePill(animate=false){
  if(disposed||selected<0)return;
  if(!animate||reduced.matches)pill.style.transition='none';
  pill.style.setProperty('--x',tabs[selected].offsetLeft+'px');pill.style.setProperty('--w',tabs[selected].offsetWidth+'px');
  if(!animate||reduced.matches){void pill.offsetWidth;pill.style.transition='';}
 }
 function set(entry,open){
  if(!open&&entry.body.contains(doc.activeElement))entry.button.focus();
  entry.item.classList.toggle('is-open',open);entry.button.setAttribute('aria-expanded',String(open));
  entry.body.setAttribute('aria-hidden',String(!open));entry.body.inert=!open;
  entry.links.forEach(link=>{link.tabIndex=open&&link.getAttribute('href')?0:-1;});
 }
 function open(entry){entries.forEach(other=>set(other,other===entry));}
 function select(index,focus=false){
  if(index===selected)return;
  cancelHover();const previous=selected,direction=index>previous?1:-1;
  const restoreFocus=focus||panels.some((panel,i)=>i!==index&&panel.contains(doc.activeElement));
  entries.forEach(entry=>set(entry,false));selected=index;
  tabs.forEach((tab,i)=>{tab.setAttribute('aria-selected',String(i===index));tab.tabIndex=i===index?0:-1;panels[i].hidden=i!==index;});
  if(restoreFocus)tabs[index].focus();movePill(previous>=0);
  panels.forEach(panel=>panel.getAnimations?.().forEach(animation=>animation.cancel()));
  if(previous>=0&&!reduced.matches)panels[index].animate?.([{opacity:0,transform:`translateX(${direction*16}px)`},{opacity:1,transform:'translateX(0)'}],{duration:360,easing:'cubic-bezier(.34,1.45,.64,1)'});
 }
 tabs.forEach((tab,index)=>{
  listen(tab,'click',()=>select(index));
  listen(tab,'keydown',event=>{
   const next=event.key==='ArrowRight'?(index+1)%tabs.length:event.key==='ArrowLeft'?(index+tabs.length-1)%tabs.length:event.key==='Home'?0:event.key==='End'?tabs.length-1:null;
   if(next!==null){event.preventDefault();select(next,true);}
  });
 });
 entries.forEach(entry=>{
  listen(entry.button,'click',()=>{cancelHover();if(entry.item.classList.contains('is-open'))set(entry,false);else open(entry);});
  listen(entry.button,'keydown',event=>{
   const list=entries.filter(e=>e.panel===entry.panel),i=list.indexOf(entry);
   const next=event.key==='ArrowDown'?(i+1)%list.length:event.key==='ArrowUp'?(i+list.length-1)%list.length:event.key==='Home'?0:event.key==='End'?list.length-1:null;
   if(next!==null){event.preventDefault();list[next].button.focus();}
  });
  listen(entry.item,'pointerenter',event=>{
   if(event.pointerType!=='mouse'||!hover.matches||entry.panel.hidden)return;
   cancelHover();hoverTimer=win.setTimeout(()=>{hoverTimer=0;if(!disposed&&!entry.panel.hidden)open(entry);},90);
  });
  listen(entry.item,'pointerleave',cancelHover);
 });
 const resizeObserver=new win.ResizeObserver(()=>movePill(false));resizeObserver.observe(tablist);
 const motionChange=()=>{panels.forEach(panel=>panel.getAnimations?.().forEach(a=>a.cancel()));movePill(false);};
 listen(reduced,'change',motionChange);
 select(0);doc.fonts?.ready.then(()=>movePill(false));
 return{select,destroy(){disposed=true;cancelHover();resizeObserver.disconnect();listeners.forEach(remove=>remove());panels.forEach(panel=>panel.getAnimations?.().forEach(a=>a.cancel()));}};
}
if(typeof document!=='undefined')document.querySelectorAll('.portfolio-works').forEach(root=>{renderGallery(root);applyWorkContent(root);initWorks(root);});
