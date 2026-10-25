import {GALLERY_CONTENT} from './gallery-content.mjs';
export function renderGallery(root,content=GALLERY_CONTENT){
 const doc=root.ownerDocument;
 const make=(tag,className,text)=>{const el=doc.createElement(tag);if(className)el.className=className;if(text!==undefined)el.textContent=text;return el;};
 for(const [key,group] of Object.entries(content)){
  const answer=root.querySelector(`[data-work-key="${key}"] .pw-answer`);if(!answer)continue;
  answer.replaceChildren();
  if(group.description)answer.append(make('p','pw-description',group.description));
  const grid=make('div','pw-gallery-grid');
  for(const item of group.items){
   const tile=make('div','pw-gallery-item'),link=make(item.url?'a':'div','pw-gallery-link');
   if(item.url){
   link.setAttribute('data-link',item.id);link.setAttribute('aria-label',`${item.title} — ${item.label}を開く`);link.tabIndex=-1;
   try{const url=new URL(item.url);if(url.protocol!=='https:')throw new Error('HTTPS required');link.setAttribute('href',url.href);link.target='_blank';link.rel='noopener noreferrer';}
   catch{link.setAttribute('aria-disabled','true');}
   }
   const media=make('figure','pw-gallery-media'),empty=make('span','pw-gallery-empty','画像未設定');
   media.append(empty);
   if(typeof item.image==='string'&&item.image.trim()){
    const image=make('img','pw-gallery-image');image.hidden=true;image.alt=item.imageAlt||'';image.decoding='async';
    image.addEventListener('load',()=>{image.hidden=false;empty.hidden=true;},{once:true});
    image.addEventListener('error',()=>{image.hidden=true;image.removeAttribute('src');empty.hidden=false;empty.textContent='画像を読み込めませんでした';},{once:true});
    image.setAttribute('src',item.image);media.append(image);
   }
   link.append(media,make('span','pw-gallery-title',item.title));
   tile.append(link);
   if(key==='booth'&&item.availability!=='public')tile.append(make('p','pw-gallery-status',item.availability==='private'?'現在、商品ページは非公開です。':'公開状態未確認・閲覧できない場合があります。'));
   grid.append(tile);
  }
  answer.append(grid);
  if(group.moreUrl){
   const more=make('a','pw-gallery-more','もっと見る →');
   more.setAttribute('data-link',`${key}-more`);more.tabIndex=-1;
   try{const url=new URL(group.moreUrl);if(url.protocol!=='https:')throw new Error('HTTPS required');more.setAttribute('href',url.href);more.target='_blank';more.rel='noopener noreferrer';}
   catch{more.setAttribute('aria-disabled','true');}
   answer.append(more);
  }
 }
}
