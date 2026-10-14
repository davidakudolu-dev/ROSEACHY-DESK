(function(){var SEL='.tabs,.seg,.marketViewTabs,.marketCalcTabs';
function place(c,still){if(c.dataset.rsSwipeTracking==='true')return;var ind=c._ind,a=c.querySelector(':scope>button.active,:scope>.tabBtn.active');if(!ind)return;if(!a||!a.offsetWidth){ind.classList.remove('on');return}
var isMarketView=c.classList.contains('marketViewTabs'),cr=c.getBoundingClientRect(),ar=a.getBoundingClientRect(),w=ar.width,h=ar.height,x=ar.left-cr.left+c.scrollLeft,y=ar.top-cr.top+c.scrollTop;
if(isMarketView){w=Math.max(30,Math.round(a.offsetWidth*.46));h=3;x=Math.round(a.offsetLeft+(a.offsetWidth-w)/2);y=Math.round(a.offsetTop+a.offsetHeight-5)}
if(c.id==='rsMainTabs'){x-=c.clientLeft;y-=c.clientTop}x=Math.round(x*100)/100;y=Math.round(y*100)/100;w=Math.round(w*100)/100;h=Math.round(h*100)/100;var key=x+'|'+y+'|'+w+'|'+h;var moved=ind._rsKey&&ind._rsKey!==key;
if(still)ind.classList.add('still');ind.style.width=w+'px';ind.style.height=h+'px';ind.style.transform='translate('+x+'px,'+y+'px)';ind.classList.add('on');ind._rsKey=key;if(still){void ind.offsetWidth;ind.classList.remove('still')}else if(moved){ind.classList.remove('rsTabGlint');void ind.offsetWidth;ind.classList.add('rsTabGlint');clearTimeout(ind._rsTabGlintTimer);ind._rsTabGlintTimer=setTimeout(function(){ind.classList.remove('rsTabGlint')},460)}}
function setup(c){if(c._ind)return;var ind=document.createElement('span');ind.className='tabInd';ind.setAttribute('aria-hidden','true');c.appendChild(ind);c._ind=ind;c.classList.add('hasInd');
var raf=0;function q(still){cancelAnimationFrame(raf);raf=requestAnimationFrame(function(){place(c,still)})}
new MutationObserver(function(){q(false)}).observe(c,{attributes:true,attributeFilter:['class'],subtree:true});
if(window.ResizeObserver){new ResizeObserver(function(){q(true)}).observe(c)}else window.addEventListener('resize',function(){q(true)});
q(true)}
function init(){document.querySelectorAll(SEL).forEach(setup)}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
window.addEventListener('roseachy:ready',init);window.addEventListener('roseachy:nav-layout',function(){document.querySelectorAll(SEL).forEach(function(c){place(c,true)})})})();