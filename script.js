'use strict';
const links=window.PORTFOLIO_LINKS||{};
document.querySelectorAll('[data-link]').forEach(a=>{
 const url=links[a.dataset.link];
 if(typeof url==='string'&&/^https:\/\//i.test(url.trim())){
  a.href=url.trim();a.target='_blank';a.rel='noopener noreferrer';
 }else{a.setAttribute('aria-disabled','true');a.title='リンク未設定';}
});
document.getElementById('year').textContent=new Date().getFullYear();
// A native click covers mouse, touch and Enter activation; navigation stays native.
const reducedMotion=window.matchMedia('(prefers-reduced-motion: reduce)');
const sparkleColors=['#ffffff','#e4d8f3','#ecdfb8'];
document.addEventListener('click',event=>{
 const link=event.target.closest?.('a[data-link]');
 if(!link||reducedMotion.matches)return;
 const rect=link.getBoundingClientRect();
 const x=event.detail===0?rect.left+rect.width/2:event.clientX;
 const y=event.detail===0?rect.top+rect.height/2:event.clientY;
 // Bound live particles even during rapid repeated taps.
 const count=Math.min(8,48-document.querySelectorAll('.portfolio-sparkle').length);
 for(let i=0;i<count;i++){
  const star=document.createElement('span');
  const angle=(i/8)*Math.PI*2+Math.random()*.35;
  const distance=20+Math.random()*23;
  star.className='portfolio-sparkle';star.setAttribute('aria-hidden','true');
  star.style.backgroundColor=sparkleColors[i%sparkleColors.length];
  star.style.setProperty('--sx',`${x-4.5}px`);
  star.style.setProperty('--sy',`${y-4.5}px`);
  star.style.setProperty('--dx',`${Math.cos(angle)*distance}px`);
  star.style.setProperty('--dy',`${Math.sin(angle)*distance-10}px`);
  star.style.setProperty('--spin',`${Math.random()*100-50}deg`);
  star.addEventListener('animationend',()=>star.remove(),{once:true});
  document.body.append(star);
  // Also clean up when CSS animations are interrupted or unavailable.
  setTimeout(()=>star.remove(),750);
 }
});
reducedMotion.addEventListener('change',()=>{
 if(reducedMotion.matches)document.querySelectorAll('.portfolio-sparkle').forEach(star=>star.remove());
});
