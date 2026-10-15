// Decorative only. Hide rather than cover meaningful page content.
const cat=document.querySelector('.sleeping-cat');
if(cat){
 let pending=0;
 const overlaps=(a,b)=>a.width>0&&a.height>0&&a.left<b.right+4&&a.right>b.left-4&&a.top<b.bottom+4&&a.bottom>b.top-4;
 function check(){
  pending=0;const box=cat.getBoundingClientRect();let blocked=false;
  const page=document.querySelector('main');
  if(page){
   for(const el of page.querySelectorAll('a,button,img,canvas')){
    if(el.closest('[hidden],[inert],[aria-hidden="true"]'))continue;
    if([...el.getClientRects()].some(r=>overlaps(r,box))){blocked=true;break;}
   }
   if(!blocked){
    const walker=document.createTreeWalker(page,NodeFilter.SHOW_TEXT);
    while(walker.nextNode()){
     const node=walker.currentNode,parent=node.parentElement;
     if(!node.textContent.trim()||parent.closest('[hidden],[inert],[aria-hidden="true"],script,style'))continue;
     const range=document.createRange();range.selectNodeContents(node);
     if([...range.getClientRects()].some(r=>overlaps(r,box))){blocked=true;break;}
    }
   }
  }
  cat.classList.toggle('is-clear',!blocked);
 }
 const schedule=()=>{if(!pending)pending=requestAnimationFrame(check);};
 window.addEventListener('scroll',schedule,{passive:true});
 window.addEventListener('resize',schedule,{passive:true});
 window.addEventListener('load',schedule,{once:true});
 document.addEventListener('transitionend',schedule);
 new MutationObserver(schedule).observe(document.querySelector('main'),{subtree:true,attributes:true,attributeFilter:['hidden','inert','aria-expanded']});
 document.fonts?.ready.then(schedule);schedule();
}
