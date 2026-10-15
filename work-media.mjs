import {WORK_CONTENT} from './work-content.mjs';
export function applyWorkContent(root,content=WORK_CONTENT){
 for(const card of root.querySelectorAll('[data-work-key]')){
  const key=card.dataset.workKey,data=content[key]??WORK_CONTENT[key]??{};
  const description=card.querySelector('.pw-description');
  const media=card.querySelector('.pw-media'),image=card.querySelector('.pw-thumbnail'),empty=card.querySelector('.pw-media-empty');
  if(!description||!media||!image||!empty)continue; // Gallery has its own per-item media.
  description.textContent=typeof data.description==='string'&&data.description.trim()?data.description:'説明文は未設定です。';
  image.hidden=true;image.removeAttribute('src');empty.hidden=false;empty.textContent='画像未設定';media.dataset.state='empty';
  const path=typeof data.image==='string'?data.image.trim():'';
  if(!path)continue;
  image.alt=data.imageAlt||((card.querySelector('.pw-title')?.textContent||key)+'のサムネイル');
  media.dataset.state='loading';empty.textContent='画像を読み込み中';
  image.addEventListener('load',()=>{media.dataset.state='ready';image.hidden=false;empty.hidden=true;},{once:true});
  image.addEventListener('error',()=>{media.dataset.state='error';image.hidden=true;image.removeAttribute('src');empty.hidden=false;empty.textContent='画像を読み込めませんでした';},{once:true});
  image.setAttribute('src',path);
 }
}
