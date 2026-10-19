
  (()=>{'use strict';
    const $=id=>document.getElementById(id);
    const timerTab=$('timerTab'),stopwatchTab=$('stopwatchTab'),timerPanel=$('timerPanel'),stopwatchPanel=$('stopwatchPanel');
    const timerDisplay=$('timerDisplay'),timerStatus=$('timerStatus'),hours=$('hours'),minutes=$('minutes'),seconds=$('seconds'),startPause=$('startPause');
    const swDisplay=$('stopwatchDisplay'),swStatus=$('stopwatchStatus'),swStartPause=$('stopwatchStartPause'),swReset=$('stopwatchReset'),lapButton=$('lapButton'),lapsEl=$('laps');
    const alarmOverlay=$('alarmOverlay'),alarmOkay=$('alarmOkay');
    let mode='timer',timerInitial=300000,timerRemaining=300000,timerEnd=0,timerRun=false,timerTick=null;
    let swRun=false,swStarted=0,swElapsed=0,swTick=null,laps=[];
    let audioCtx=null,alarmPlaying=false,alarmSources=[],alarmLoopTimeout=null;
    const clamp=(v,a,b)=>Math.min(b,Math.max(a,Number.isFinite(v)?v:a));
    const parse=(el,max)=>clamp(Math.floor(Number(el.value)||0),0,max);
    const fmtTimer=ms=>{const t=Math.max(0,Math.ceil(ms/1000)),h=Math.floor(t/3600),m=Math.floor(t%3600/60),s=t%60;return h?`${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`:`${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`};
    const fmtSw=ms=>{const tenth=Math.floor(ms%1000/100),t=Math.floor(ms/1000),h=Math.floor(t/3600),m=Math.floor(t%3600/60),s=t%60;return h?`${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}.${tenth}`:`${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}.${tenth}`};
    function ensureAudio(){try{if(!audioCtx){const AC=window.AudioContext||window.webkitAudioContext;if(AC)audioCtx=new AC()}if(audioCtx?.state==='suspended')audioCtx.resume().catch(()=>{})}catch{}}

    const NOTE={C4:261.63,D4:293.66,E4:329.63,F4:349.23,Fs4:369.99,G4:392,A4:440,Bb4:466.16,B4:493.88,C5:523.25,D5:587.33,E5:659.25,F5:698.46,Fs5:739.99,G5:783.99,A5:880,Bb5:932.33,B5:987.77,R:0};
    const melody1=[['B4',1],['B4',1],['B4',2],['B4',1],['B4',1],['B4',2],['B4',1],['D5',1],['G4',1],['A4',1],['B4',4],['C5',1],['C5',1],['C5',1],['C5',1],['C5',1],['B4',1],['B4',1],['B4',1],['B4',1],['A4',1],['A4',1],['B4',1],['A4',4],['B4',1],['B4',1],['B4',2],['B4',1],['B4',1],['B4',2],['B4',1],['D5',1],['G4',1],['A4',1],['B4',4],['C5',1],['C5',1],['C5',1],['C5',1],['C5',1],['B4',1],['B4',1],['B4',1],['D5',1],['D5',1],['B4',1],['A4',1],['G4',4],['R',4]];
    const melody2=[['G4',3],['A4',1],['G4',2],['E4',6],['G4',3],['A4',1],['G4',2],['E4',6],['D5',4],['D5',2],['B4',4],['B4',2],['C5',4],['C5',2],['G4',6],['A4',4],['A4',2],['C5',3],['B4',1],['A4',2],['G4',3],['A4',1],['G4',2],['E4',6],['A4',4],['A4',2],['C5',3],['B4',1],['A4',2],['G4',3],['A4',1],['G4',2],['E4',6],['D5',4],['D5',2],['F5',3],['D5',1],['B4',2],['C5',6],['E5',6],['C5',3],['G4',1],['E4',2],['G4',3],['F4',1],['D4',2],['C4',4],['R',4]];
    const melody3=[['C4',2],['F4',2],['F4',1],['F4',1],['G4',1],['F4',1],['E4',2],['D4',2],['D4',2],['G4',2],['G4',1],['A4',1],['G4',1],['F4',1],['E4',2],['C4',2],['C4',2],['A4',2],['A4',1],['A4',1],['Bb4',1],['A4',1],['G4',2],['Fs4',1],['D4',1],['C4',1],['D4',1],['E4',2],['G4',2],['E4',2],['F4',2],['R',8]];
    const alarmMelodies=[...melody1,...melody2,...melody3];
    const UNIT=.25;

    function stopScheduledAudio(){if(alarmLoopTimeout){clearTimeout(alarmLoopTimeout);alarmLoopTimeout=null}alarmSources.forEach(node=>{try{node.stop()}catch{}});alarmSources=[]}
    function scheduleTone(freq,start,duration){if(!audioCtx||!freq)return;const osc=audioCtx.createOscillator(),gain=audioCtx.createGain();osc.type='sine';osc.frequency.setValueAtTime(freq,start);gain.gain.setValueAtTime(.0001,start);gain.gain.exponentialRampToValueAtTime(.22,start+.012);const sustainEnd=Math.max(start+.013,start+duration-.035);gain.gain.setValueAtTime(.22,sustainEnd);gain.gain.exponentialRampToValueAtTime(.0001,start+duration);osc.connect(gain);gain.connect(audioCtx.destination);osc.start(start);osc.stop(start+duration+.02);alarmSources.push(osc)}
    function scheduleMelodies(startAt){if(!alarmPlaying||!audioCtx)return;let cursor=startAt;alarmMelodies.forEach(([name,units])=>{const slot=units*UNIT;if(name!=='R')scheduleTone(NOTE[name],cursor,Math.max(.06,slot*.92));cursor+=slot});const total=cursor-startAt;alarmLoopTimeout=setTimeout(()=>{if(alarmPlaying)scheduleMelodies(audioCtx.currentTime+.06)},Math.max(100,total*1000-80))}
    function startAlarm(){ensureAudio();alarmOverlay.classList.remove('hidden');alarmPlaying=true;stopScheduledAudio();if(audioCtx)scheduleMelodies(audioCtx.currentTime+.08);alarmOkay.focus()}
    function stopAlarm(){alarmPlaying=false;stopScheduledAudio();alarmOverlay.classList.add('hidden');timerDisplay.classList.remove('finished');document.title='Timer'}

    function inputMs(){hours.value=parse(hours,99);minutes.value=parse(minutes,59);seconds.value=parse(seconds,59);return(+hours.value*3600+ +minutes.value*60+ +seconds.value)*1000}
    function setInputs(ms){let t=Math.max(0,Math.round(ms/1000));hours.value=Math.floor(t/3600);minutes.value=Math.floor(t%3600/60);seconds.value=t%60}
    function renderTimer(){timerDisplay.textContent=fmtTimer(timerRemaining);if(timerRun)document.title=`${fmtTimer(timerRemaining)} — Timer`}
    function stopTimerInterval(){clearInterval(timerTick);timerTick=null}
    function finishTimer(){timerRun=false;stopTimerInterval();timerRemaining=0;renderTimer();timerDisplay.classList.add('finished');timerStatus.textContent='Finished';startPause.textContent='Start';document.title='00:00 — Timer';startAlarm()}
    function updateTimer(){timerRemaining=Math.max(0,timerEnd-Date.now());renderTimer();if(timerRemaining<=0)finishTimer()}
    function startTimer(){ensureAudio();if(timerRun)return;if(timerRemaining<=0){timerInitial=inputMs();timerRemaining=timerInitial}if(timerRemaining<=0){timerStatus.textContent='Set a time first';return}timerRun=true;timerEnd=Date.now()+timerRemaining;startPause.textContent='Pause';timerStatus.textContent='Running';timerTick=setInterval(updateTimer,100);updateTimer()}
    function pauseTimer(){if(!timerRun)return;timerRemaining=Math.max(0,timerEnd-Date.now());timerRun=false;stopTimerInterval();renderTimer();startPause.textContent='Start';timerStatus.textContent='Paused'}
    function resetTimer(){stopAlarm();timerRun=false;stopTimerInterval();timerRemaining=timerInitial;setInputs(timerInitial);renderTimer();startPause.textContent='Start';timerStatus.textContent='Ready'}
    startPause.addEventListener('click',()=>timerRun?pauseTimer():startTimer());$('resetTimer').addEventListener('click',resetTimer);$('clearTimer').addEventListener('click',()=>{stopAlarm();timerRun=false;stopTimerInterval();timerInitial=timerRemaining=0;setInputs(0);renderTimer();startPause.textContent='Start';timerStatus.textContent='Cleared'});
    [hours,minutes,seconds].forEach(el=>el.addEventListener('change',()=>{if(timerRun)return;timerInitial=timerRemaining=inputMs();renderTimer();timerStatus.textContent='Ready'}));
    document.querySelectorAll('[data-seconds]').forEach(b=>b.addEventListener('click',()=>{if(timerRun)pauseTimer();timerInitial=timerRemaining=Number(b.dataset.seconds)*1000;setInputs(timerInitial);renderTimer();timerStatus.textContent='Ready'}));
    document.querySelectorAll('[data-adjust]').forEach(b=>b.addEventListener('click',()=>{const delta=Number(b.dataset.adjust)*1000;if(timerRun){timerRemaining=Math.max(0,timerEnd-Date.now()+delta);timerEnd=Date.now()+timerRemaining;timerInitial=Math.max(0,timerInitial+delta)}else{timerRemaining=Math.max(0,timerRemaining+delta);timerInitial=timerRemaining}setInputs(timerRemaining);renderTimer()}));

    function swNow(){return swElapsed+(swRun?Date.now()-swStarted:0)}
    function renderSw(){const ms=swNow();swDisplay.textContent=fmtSw(ms);if(swRun)document.title=`${fmtSw(ms)} — Stopwatch`}
    function startSw(){if(swRun)return;swRun=true;swStarted=Date.now();swStartPause.textContent='Pause';lapButton.disabled=false;swStatus.textContent='Running';swTick=setInterval(renderSw,50);renderSw()}
    function pauseSw(){if(!swRun)return;swElapsed+=Date.now()-swStarted;swRun=false;clearInterval(swTick);swStartPause.textContent='Start';lapButton.disabled=true;swStatus.textContent='Paused';renderSw()}
    function renderLaps(){if(!laps.length){lapsEl.innerHTML='<div class="laps-empty">No laps yet</div>';return}lapsEl.innerHTML=laps.map((lap,i)=>`<div class="lap-row"><span>Lap ${i+1}</span><strong>${fmtSw(lap.total)}</strong><span class="split">+${fmtSw(lap.split)}</span></div>`).reverse().join('')}
    function addLap(){if(!swRun)return;const total=swNow(),prev=laps.length?laps[laps.length-1].total:0;laps.push({total,split:total-prev});renderLaps();swStatus.textContent=`Lap ${laps.length} saved`}
    swStartPause.addEventListener('click',()=>swRun?pauseSw():startSw());lapButton.addEventListener('click',addLap);swReset.addEventListener('click',()=>{swRun=false;clearInterval(swTick);swElapsed=0;swStarted=0;laps=[];renderSw();renderLaps();swStartPause.textContent='Start';lapButton.disabled=true;swStatus.textContent='Ready';document.title='Timer'});

    function switchMode(next){mode=next;const timer=next==='timer';timerTab.classList.toggle('active',timer);stopwatchTab.classList.toggle('active',!timer);timerPanel.classList.toggle('hidden',!timer);stopwatchPanel.classList.toggle('hidden',timer);document.title=timer?(timerRun?`${fmtTimer(timerRemaining)} — Timer`:'Timer'):(swRun?`${fmtSw(swNow())} — Stopwatch`:'Stopwatch')}
    timerTab.addEventListener('click',()=>switchMode('timer'));stopwatchTab.addEventListener('click',()=>switchMode('stopwatch'));alarmOkay.addEventListener('click',stopAlarm);
    document.addEventListener('keydown',e=>{if(!alarmOverlay.classList.contains('hidden')){if(e.key==='Enter'||e.key==='Escape'||e.key===' '){e.preventDefault();stopAlarm()}return}if(['INPUT','TEXTAREA'].includes(document.activeElement.tagName))return;if(e.code==='Space'){e.preventDefault();mode==='timer'?(timerRun?pauseTimer():startTimer()):(swRun?pauseSw():startSw())}else if(e.key.toLowerCase()==='r'){mode==='timer'?resetTimer():swReset.click()}else if(e.key.toLowerCase()==='l'&&mode==='stopwatch')addLap()});
    renderTimer();renderSw();renderLaps();
  })();
  