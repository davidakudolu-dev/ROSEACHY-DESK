(function(){function fit(){var t=document.getElementById('deskTitle'),h=t&&t.parentNode.querySelector('h1');if(!t||!h||!h.offsetWidth)return;
var n=(t.textContent||'').trim().length;if(n<2)return;t.style.removeProperty('font-size');t.style.setProperty('letter-spacing','0px','important');t.style.marginRight='0px';
var target=h.getBoundingClientRect().width,w=function(){return t.getBoundingClientRect().width};t.style.setProperty('font-size',(target*0.128).toFixed(2)+'px','important');
var w0=w(),minLs=0.5;if(w0>target-minLs*(n-1)){var fs=parseFloat(getComputedStyle(t).fontSize);t.style.setProperty('font-size',(fs*(target-minLs*(n-1))/w0).toFixed(2)+'px','important');w0=w()}
var ls=(target-w0)/(n-1);for(var i=0;i<3;i++){t.style.setProperty('letter-spacing',ls.toFixed(3)+'px','important');t.style.marginRight=(-ls).toFixed(3)+'px';var vis=w()+ls*0-0;var err=target-(t.getBoundingClientRect().width-ls);if(Math.abs(err)<.3)break;ls+=err/(n-1)}
}
var raf=0;function q(){cancelAnimationFrame(raf);raf=requestAnimationFrame(fit)}
function init(){var t=document.getElementById('deskTitle');if(!t||t._roseachyFitInit)return;t._roseachyFitInit=true;new MutationObserver(q).observe(t,{childList:true,characterData:true,subtree:true});
if(window.ResizeObserver){var h=t.parentNode.querySelector('h1');if(h)new ResizeObserver(q).observe(h)}
window.addEventListener('resize',q,{passive:true});if(document.fonts&&document.fonts.ready)document.fonts.ready.then(q);window.addEventListener('roseachy:ready',q);q()}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init()})();