// ======= 헬퍼 =======
last = now;
timeLeft -= dt;
if (timeLeft < 0) timeLeft = 0;
$timeLabel.textContent = timeLeft.toFixed(1) + 's';
const ratio = clamp(timeLeft / total, 0, 1);
$timeBar.style.transform = `scaleX(${ratio})`;
if (timeLeft <= 0){ endGame(); }
}, 100);
}


function penalty(seconds){
timeLeft = Math.max(0, timeLeft - seconds);
$play.classList.add('shake');
setTimeout(()=> $play.classList.remove('shake'), 360);
}


function buildLevel(){
const dim = gridDim(level);
$levelLabel.textContent = level;
$grid.style.gridTemplateColumns = `repeat(${dim}, 1fr)`;
$grid.classList.remove('shake');
$grid.innerHTML = '';
const total = dim * dim;
const { base, odd } = colorSetFor(level);
answerIndex = Math.floor(Math.random()*total);


for (let i=0;i<total;i++){
const tile = document.createElement('button');
tile.className = 'tile';
tile.setAttribute('aria-label', '색상 타일');
tile.style.background = (i === answerIndex) ? odd : base;
tile.addEventListener('click', ()=>{
if (!playing) return;
if (i === answerIndex){
// 정답 → 다음 레벨
level += 1;
buildLevel();
} else {
// 오답 처리
if ($hardMode.checked){ penalty(3); }
$grid.classList.add('shake');
setTimeout(()=> $grid.classList.remove('shake'), 320);
}
});
$grid.appendChild(tile);
}
}


function giveUp(){ endGame(); }


// ======= 공유 =======
async function share(){
const text = `절대색감 게임 결과: ${$reachedLevel.textContent}단계까지 도달! 당신도 도전해보세요.`;
try{
if (navigator.share){
await navigator.share({ title: '절대색감 게임', text });
} else {
await navigator.clipboard.writeText(text);
alert('결과를 클립보드에 복사했어요! 붙여넣어 공유해보세요.');
}
}catch(e){
// 사용자가 취소
}
}


// ======= 이벤트 바인딩 =======
$btnStart.addEventListener('click', startGame);
$btnRestart.addEventListener('click', startGame);
$btnGiveUp.addEventListener('click', giveUp);
$btnShare.addEventListener('click', share);


// 엔터키로 시작 편의
window.addEventListener('keydown', (ev)=>{
const onStart = $start.classList.contains('active');
if (onStart && (ev.key === 'Enter' || ev.key === ' ')) startGame();
});


// 초기 포커스 관리 (접근성)
window.addEventListener('load', ()=>{
$('#btnStart').focus({ preventScroll:true });
});
