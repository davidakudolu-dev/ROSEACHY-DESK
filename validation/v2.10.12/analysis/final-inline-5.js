(function(){
var last=null;
function glint(btn){
  if(!btn||btn.disabled)return;
  btn.classList.remove('rsGlint');
  void btn.offsetWidth;
  btn.classList.add('rsGlint');
  clearTimeout(btn._rsGlintTimer);
  btn._rsGlintTimer=setTimeout(function(){btn.classList.remove('rsGlint')},520);
}
document.addEventListener('pointerdown',function(e){
  var b=e.target.closest&&e.target.closest('button');
  if(!b)return;
  last=b;glint(b);
},{passive:true});
document.addEventListener('keydown',function(e){
  if((e.key==='Enter'||e.key===' ')&&document.activeElement&&document.activeElement.tagName==='BUTTON')glint(document.activeElement);
});
})();