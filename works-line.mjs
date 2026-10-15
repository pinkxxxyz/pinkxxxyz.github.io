const line=document.querySelector('#works>.works-ground-line');
if(line){
 const update=()=>line.parentElement.classList.toggle('has-ground-line',line.complete&&line.naturalWidth>0);
 line.addEventListener('load',update);line.addEventListener('error',()=>line.parentElement.classList.remove('has-ground-line'));
 update();
}
