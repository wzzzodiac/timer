'use strict';
// Presentation reads existing DOM output. The unchanged engine owns timing/audio/laps.
const byId=id=>document.getElementById(id),readInputs=()=>((+byId('hours').value*3600)+(+byId('minutes').value*60)+(+byId('seconds').value));
let initial=readInputs(),wasAlarmOpen=false;
function secondsFromText(text){return text.split(':').map(Number).reduce((sum,part)=>sum*60+part,0)}
function sync(){
 const timerActive=byId('timerTab').classList.contains('active');
 byId('timerTab').setAttribute('aria-pressed',String(timerActive));byId('stopwatchTab').setAttribute('aria-pressed',String(!timerActive));
 for(const mode of ['timer','stopwatch']){
  const display=byId(mode+'Display'),remaining=secondsFromText(display.textContent);display.dataset.long=String(display.textContent.length>5);
  const progress=mode==='timer'?Math.min(100,Math.max(0,initial>0?remaining/initial*100:0)):(remaining%60)/60*100;
  byId(mode+'Panel').querySelectorAll('.dial-progress').forEach(el=>el.style.strokeDashoffset=String(100-progress));
  byId(mode+'Panel').querySelectorAll('progress').forEach(el=>el.value=progress);
 }
 const selected=readInputs();document.querySelectorAll('[data-seconds]').forEach(el=>{const active=Number(el.dataset.seconds)===selected;el.classList.toggle('selected',active);el.setAttribute('aria-pressed',String(active))});
 byId('keyboard-hint').innerHTML=timerActive?'Space · start / pause <span>R · reset</span>':'Space · start / pause <span>L · lap</span> <span>R · reset</span>';
 const alarmOpen=!byId('alarmOverlay').classList.contains('hidden');document.querySelector('.app-shell').inert=alarmOpen;if(wasAlarmOpen&&!alarmOpen)(timerActive?byId('startPause'):byId('stopwatchStartPause')).focus();wasAlarmOpen=alarmOpen;
}
for(const id of ['hours','minutes','seconds'])byId(id).addEventListener('change',()=>{if(byId('timerStatus').textContent!=='Running')initial=readInputs();sync()});
document.querySelectorAll('[data-seconds]').forEach(el=>el.addEventListener('click',()=>{initial=readInputs();sync()}));
document.querySelectorAll('[data-adjust]').forEach(el=>el.addEventListener('click',()=>{initial=byId('timerStatus').textContent==='Running'?Math.max(0,initial+Number(el.dataset.adjust)):readInputs();sync()}));
byId('clearTimer').addEventListener('click',()=>{initial=0;sync()});
const observer=new MutationObserver(sync);
for(const id of ['timerDisplay','stopwatchDisplay'])observer.observe(byId(id),{childList:true,characterData:true,subtree:true});
for(const id of ['timerTab','stopwatchTab','alarmOverlay'])observer.observe(byId(id),{attributes:true,attributeFilter:['class']});
sync();

// The alarm has one action. Keep keyboard focus in it until dismissed.
document.addEventListener('keydown',event=>{
 if(event.key==='Tab'&&!byId('alarmOverlay').classList.contains('hidden')){
  event.preventDefault();byId('alarmOkay').focus();
 }
});
