
(function(){
  const splash=document.getElementById('bootSplash'),source=splash?.querySelector('.bootLockup'),target=document.querySelector('.brandLockup');
  if(!splash||!source||!target)return;
  const finish=()=>{splash.classList.add('done');setTimeout(()=>splash.remove(),150)};
  requestAnimationFrame(()=>requestAnimationFrame(()=>{
    try{const a=source.getBoundingClientRect(),b=target.getBoundingClientRect(),dx=(b.left+b.width/2)-(a.left+a.width/2),dy=(b.top+b.height/2)-(a.top+a.height/2),scale=Math.max(.72,Math.min(1,b.height/Math.max(1,a.height)));source.animate([{transform:'translate(0,0) scale(1)',opacity:1},{transform:`translate(${dx}px,${dy}px) scale(${scale})`,opacity:.08}],{duration:280,easing:'cubic-bezier(.2,.8,.2,1)',fill:'forwards'}).finished.finally(finish)}catch{finish()}
  }));
  setTimeout(finish,520);
})();
