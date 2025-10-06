// ======= 헬퍼 & 전역 =======
console.log('script loaded');
const $ = (sel, el=document) => el.querySelector(sel);

// 화면 요소
const $start = $('#screen-start');
const $play = $('#screen-play');
const $end = $('#screen-end');

const $grid = $('#grid');
const $levelLabel = $('#levelLabel');
const $timeLabel = $('#timeLabel');
const $timeBar = $('#timeBar');
const $bestLabel = $('#bestLabel');

const $btnStart = $('#btnStart');
const $btnRestart = $('#btnRestart');
const $btnGiveUp = $('#btnGiveUp');
const $btnShare = $('#btnShare');
const $hardMode = $('#hardMode');

const $reachedLevel = $('#reachedLevel');
const $bestUpdate = $('#bestUpdate');

let level = 1;
let timeLeft = 60.0;
let timer = null;
let playing = false;
let answerIndex = -1;

const BEST_KEY = 'abscolor_best_level_v1';
const getBest = () => Number(localStorage.getItem(BEST_KEY) || 0);
const setBest = (v) => localStorage.setItem(BEST_KEY, String(v));
$bestLabel.textContent = `최고 단계: ${getBest()}`;

const clamp = (n, a, b) => Math.max(a, Math.min(b, n));

// 그리드 크기: 2x2 → 3x3 → … (최대 10x10)
function gridDim(lv){
  return Math.min(2 + Math.floor((lv-1)/2), 10);
}

// 색상 세트(HSL): 레벨이 오를수록 명도차 감소
function colorSetFor(level){
  // 기준 색
  const baseR = Math.floor(Math.random()*200);
  const baseG = Math.floor(Math.random()*200);
  const baseB = Math.floor(Math.random()*200);

  // ---- 난이도 조절 핵심 ----
  // 거리 감소를 완만하게 (루트 곡선 기반)
  // 0단계에서 약 60, 50단계에서도 약 8 정도로 완만히 감소
  const diff = Math.max(10, 80 / Math.sqrt(level + 2));

  // 임의 방향 벡터 만들기
  const dir = [Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5];
  const len = Math.sqrt(dir[0]**2 + dir[1]**2 + dir[2]**2);
  const norm = dir.map(v => v / len); // 단위벡터화

  // 색상 이동 적용
  const oddR = Math.round(clamp(baseR + diff * norm[0], 0, 255));
  const oddG = Math.round(clamp(baseG + diff * norm[1], 0, 255));
  const oddB = Math.round(clamp(baseB + diff * norm[2], 0, 255));

  const base = `rgb(${baseR}, ${baseG}, ${baseB})`;
  const odd  = `rgb(${oddR}, ${oddG}, ${oddB})`;
  return { base, odd };
}

function setScreen(id){
  for (const el of document.querySelectorAll('.screen')) el.classList.remove('active');
  $(id).classList.add('active');
}

// ======= 게임 로직 =======
function startGame(){
  level = 1; timeLeft = 60.0; playing = true;
  $levelLabel.textContent = level;
  setScreen('#screen-play');
  buildLevel();
  startTimer();
  $timeLabel.textContent = timeLeft.toFixed(1) + 's';
  $timeBar.style.transform = `scaleX(1)`;
}

function endGame(){
  playing = false; clearInterval(timer); timer = null;
  const best = getBest();
  if (level-1 > best) setBest(level-1);
  $reachedLevel.textContent = String(level-1);
  $bestUpdate.textContent = `최고 단계: ${getBest()}`;
  $bestLabel.textContent = `최고 단계: ${getBest()}`;
  setScreen('#screen-end');
}

function startTimer(){
  const total = 60.0;
  let last = performance.now();
  clearInterval(timer);
  timer = setInterval(()=>{
    if (!playing) return;
    const now = performance.now();
    const dt = (now - last)/1000;
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
  document.documentElement.style.setProperty('--cols', dim);
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
        level += 1;
        buildLevel();
      } else {
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

// 초기 포커스 (접근성)
window.addEventListener('load', ()=>{
  $('#btnStart').focus({ preventScroll:true });
});
