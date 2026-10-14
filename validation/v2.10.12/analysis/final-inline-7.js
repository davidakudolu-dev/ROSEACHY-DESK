
/* Roseachy v2.8.1: one passive pointer listener, one keyboard listener; no timers or polling. */
(function(){
 'use strict';
 if(window.RoseachyTouchRipple)return;
 const root=document.documentElement;
 const motionQuery=window.matchMedia?window.matchMedia('(prefers-reduced-motion: reduce)'):null;
 let enabled=true,intensity=40,duration=250,opacity=.103;
 const active=new Set();
 const MAX_ACTIVE=12,MAX_PER_HOST=2;
 const selector='button,a[href],summary,[role="button"],.activeListCard,.marketSearchDrop .marketRow,.supplierCard,.supplierRow,.requestRow,.marketFilters [data-filter],.segChoice [data-value]';
 const cleanup=ink=>{
   if(!active.has(ink))return;
   active.delete(ink);
   const host=ink.parentElement;
   ink.remove();
   if(host&&!host.querySelector('.rs-ripple-ink'))host.classList.remove('rs-ripple-host');
 };
 function clear(){for(const ink of Array.from(active))cleanup(ink)}
 // Navigation can detach a tapped control before animationend; prune its ink on the next touch.
 function prune(){for(const ink of active)if(!ink.isConnected)cleanup(ink)}
 function sync(a){
   if(!a||typeof a!=='object')return;
   intensity=Math.max(0,Math.min(100,Number(a.rippleIntensity)||0));
   duration=({fast:175,balanced:250,relaxed:375})[a.speed]||250;
   opacity=+(intensity/100*.43).toFixed(3);
   enabled=a.rippleEnabled!==false&&intensity>0&&a.animation!=='off'&&!a.reduceMotion&&!(motionQuery&&motionQuery.matches);
   root.classList.toggle('rs-ripple-disabled',!enabled);
   if(!enabled)clear();
   const status=document.getElementById('touchRippleStatus');
   if(status){
     status.textContent=a.rippleEnabled===false?'Off':a.animation==='off'?'Animations off':a.reduceMotion||(motionQuery&&motionQuery.matches)?'Reduced motion':intensity===0?'Invisible · 0%':(intensity<=25?'Very subtle':intensity<=60?'Subtle':intensity<=85?'Noticeable':'Pronounced')+' · '+intensity+'%';
   }
   const preview=document.getElementById('touchRipplePreview');
   if(preview)preview.setAttribute('aria-label',enabled?'Touch ripple preview, '+intensity+' percent':'Touch ripple preview disabled');
 }
 function makeRipple(host,x,y){
   if(!enabled||!host||!host.isConnected||host.disabled||host.getAttribute('aria-disabled')==='true')return;
   prune();if(active.size>=MAX_ACTIVE)return;
   if(host.closest('[inert],.hidden,[aria-hidden="true"]'))return;
   if(host.querySelectorAll('.rs-ripple-ink').length>=MAX_PER_HOST)return;
   const box=host.getBoundingClientRect();
   if(box.width<3||box.height<3)return;
   const px=x-box.left,py=y-box.top;
   const radius=Math.max(Math.hypot(px,py),Math.hypot(box.width-px,py),Math.hypot(px,box.height-py),Math.hypot(box.width-px,box.height-py));
   const ink=document.createElement('span');
   ink.className='rs-ripple-ink';ink.setAttribute('aria-hidden','true');
   ink.style.left=px+'px';ink.style.top=py+'px';ink.style.setProperty('--rs-ripple-size',Math.ceil(radius*2)+'px');
   ink.style.setProperty('--rs-ripple-opacity',String(opacity));ink.style.setProperty('--rs-ripple-duration',duration+'ms');
   // Very dark filled controls get a light ripple; otherwise use the active theme accent.
   const background=getComputedStyle(host).backgroundColor;
   const rgb=background.match(/^rgba?\(\s*(\d+)[, ]+\s*(\d+)[, ]+\s*(\d+)/i);
   if(rgb){const alpha=background.match(/[, ]+([01]?(?:\.\d+)?)\)$/);const solid=!alpha||Number(alpha[1])>=.8;
     const lum=(Number(rgb[1])*.2126+Number(rgb[2])*.7152+Number(rgb[3])*.0722);
     if(solid&&lum<125)ink.style.setProperty('--rs-ripple-color','rgba(255,255,255,.95)');
   }
   host.classList.add('rs-ripple-host');host.appendChild(ink);active.add(ink);
   ink.addEventListener('animationend',()=>cleanup(ink),{once:true});
   ink.addEventListener('animationcancel',()=>cleanup(ink),{once:true});
   setTimeout(()=>cleanup(ink),duration+120);
 }
 document.addEventListener('pointerdown',event=>{
   if(!enabled||!event.isPrimary||(event.pointerType==='mouse'&&event.button!==0))return;
   const t=event.target;
   if(!(t instanceof Element))return;
   if(t.closest('input,select,textarea,[contenteditable="true"],.rs-ripple-ink'))return;
   const host=t.closest(selector);
   if(host)makeRipple(host,event.clientX,event.clientY);
 },{passive:true,capture:true});
 document.addEventListener('keydown',event=>{
   if(!enabled||(event.key!=='Enter'&&event.key!==' ')||event.repeat)return;
   const el=document.activeElement;
   if(!(el instanceof Element)||el.matches('input,select,textarea'))return;
   const host=el.closest(selector);
   if(host){const r=host.getBoundingClientRect();makeRipple(host,r.left+r.width/2,r.top+r.height/2)}
 },{passive:true});
 motionQuery?.addEventListener?.('change',()=>sync(window.RoseachyTouchRippleAppearance?.()));
 window.RoseachyTouchRipple={sync,clear};
 try{sync(window.RoseachyTouchRippleAppearance?.())}catch{root.classList.add('rs-ripple-disabled')}
})();
