// ─── Configuration ───────────────────────────────────────────────
const GRID = 20;
const CELL = 400 / GRID; // 20px par cellule

// ─── État du jeu ─────────────────────────────────────────────────
let snake, direction, nextDir, food, score, best, level, speed, gameLoop, running, paused;

// ─── Éléments DOM ────────────────────────────────────────────────
const canvas   = document.getElementById('gameCanvas');
const ctx      = canvas.getContext('2d');
const scoreEl  = document.getElementById('score');
const bestEl   = document.getElementById('best');
const levelEl  = document.getElementById('level');
const overlay  = document.getElementById('overlay');
const titleEl  = document.getElementById('overlay-title');
const subEl    = document.getElementById('overlay-sub');
const startBtn = document.getElementById('startBtn');

// ─── Initialisation ──────────────────────────────────────────────
function init() {
  snake     = [{ x: 10, y: 10 }, { x: 9, y: 10 }, { x: 8, y: 10 }];
  direction = { x: 1, y: 0 };
  nextDir   = { x: 1, y: 0 };
  score     = 0;
  level     = 1;
  speed     = 150;
  running   = true;
  paused    = false;
  scoreEl.textContent = 0;
  levelEl.textContent = 1;
  spawnFood();
}

// ─── Nourriture ──────────────────────────────────────────────────
function spawnFood() {
  let pos;
  do {
    pos = { x: Math.floor(Math.random() * GRID), y: Math.floor(Math.random() * GRID) };
  } while (snake.some(s => s.x === pos.x && s.y === pos.y));
  food = pos;
}

// ─── Boucle de jeu ───────────────────────────────────────────────
function startGame() {
  clearInterval(gameLoop);
  init();
  overlay.classList.add('hidden');
  gameLoop = setInterval(step, speed);
}

function step() {
  if (!running || paused) return;

  direction = { ...nextDir };
  const head = { x: snake[0].x + direction.x, y: snake[0].y + direction.y };

  // Collision murs
  if (head.x < 0 || head.x >= GRID || head.y < 0 || head.y >= GRID) {
    return gameOver();
  }
  // Collision corps
  if (snake.some(s => s.x === head.x && s.y === head.y)) {
    return gameOver();
  }

  snake.unshift(head);

  // Manger la nourriture
  if (head.x === food.x && head.y === food.y) {
    score += 10 * level;
    scoreEl.textContent = score;
    if (score > (best || 0)) {
      best = score;
      bestEl.textContent = best;
    }
    // Augmenter le niveau tous les 5 fruits
    if (snake.length % 5 === 0) {
      level++;
      levelEl.textContent = level;
      speed = Math.max(60, speed - 15);
      clearInterval(gameLoop);
      gameLoop = setInterval(step, speed);
    }
    spawnFood();
  } else {
    snake.pop();
  }

  draw();
}

// ─── Dessin ──────────────────────────────────────────────────────
function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Grille subtile
  ctx.strokeStyle = 'rgba(0,255,80,0.04)';
  ctx.lineWidth = 0.5;
  for (let i = 0; i <= GRID; i++) {
    ctx.beginPath(); ctx.moveTo(i * CELL, 0); ctx.lineTo(i * CELL, 400); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(0, i * CELL); ctx.lineTo(400, i * CELL); ctx.stroke();
  }

  // Nourriture
  const fx = food.x * CELL + CELL / 2;
  const fy = food.y * CELL + CELL / 2;
  ctx.save();
  ctx.shadowColor = '#ff4444';
  ctx.shadowBlur  = 15;
  ctx.fillStyle   = '#ff4444';
  ctx.beginPath();
  ctx.arc(fx, fy, CELL / 2 - 2, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // Serpent
  snake.forEach((seg, i) => {
    const x = seg.x * CELL + 1;
    const y = seg.y * CELL + 1;
    const s = CELL - 2;
    const ratio = 1 - i / snake.length;
    ctx.save();
    ctx.shadowColor = '#00ff50';
    ctx.shadowBlur  = i === 0 ? 18 : 6 * ratio;
    ctx.fillStyle   = i === 0
      ? '#00ff50'
      : `rgba(0, ${Math.floor(180 + 75 * ratio)}, ${Math.floor(50 * ratio)}, ${0.5 + 0.5 * ratio})`;
    ctx.beginPath();
    ctx.roundRect(x, y, s, s, 3);
    ctx.fill();
    ctx.restore();

    // Yeux sur la tête
    if (i === 0) {
      ctx.fillStyle = '#0a0a0f';
      const eyeSize = 3;
      let e1, e2;
      if (direction.x === 1)       { e1 = {x: x+s-6, y: y+4};  e2 = {x: x+s-6, y: y+s-7}; }
      else if (direction.x === -1) { e1 = {x: x+3,   y: y+4};  e2 = {x: x+3,   y: y+s-7}; }
      else if (direction.y === -1) { e1 = {x: x+4,   y: y+3};  e2 = {x: x+s-7, y: y+3};   }
      else                          { e1 = {x: x+4,   y: y+s-6};e2 = {x: x+s-7, y: y+s-6}; }
      ctx.beginPath(); ctx.arc(e1.x, e1.y, eyeSize, 0, Math.PI*2); ctx.fill();
      ctx.beginPath(); ctx.arc(e2.x, e2.y, eyeSize, 0, Math.PI*2); ctx.fill();
    }
  });
}

// ─── Game Over ───────────────────────────────────────────────────
function gameOver() {
  running = false;
  clearInterval(gameLoop);
  titleEl.textContent  = 'GAME OVER';
  subEl.textContent    = `Score : ${score}`;
  startBtn.textContent = '↺ REJOUER';
  overlay.classList.remove('hidden');
}

// ─── Contrôles clavier ───────────────────────────────────────────
document.addEventListener('keydown', e => {
  switch (e.key) {
    case 'ArrowUp':    case 'z': case 'Z':
      if (direction.y !== 1)  nextDir = { x: 0, y: -1 }; break;
    case 'ArrowDown':  case 's': case 'S':
      if (direction.y !== -1) nextDir = { x: 0, y: 1 };  break;
    case 'ArrowLeft':  case 'q': case 'Q':
      if (direction.x !== 1)  nextDir = { x: -1, y: 0 }; break;
    case 'ArrowRight': case 'd': case 'D':
      if (direction.x !== -1) nextDir = { x: 1, y: 0 };  break;
    case ' ':
      e.preventDefault();
      if (!running) startGame();
      else paused = !paused;
      break;
  }
});

// ─── Contrôles mobile ────────────────────────────────────────────
document.getElementById('btnUp').addEventListener('click',    () => { if (direction.y !== 1)  nextDir = { x: 0, y: -1 }; });
document.getElementById('btnDown').addEventListener('click',  () => { if (direction.y !== -1) nextDir = { x: 0, y: 1 };  });
document.getElementById('btnLeft').addEventListener('click',  () => { if (direction.x !== 1)  nextDir = { x: -1, y: 0 }; });
document.getElementById('btnRight').addEventListener('click', () => { if (direction.x !== -1) nextDir = { x: 1, y: 0 };  });

// ─── Bouton démarrer ─────────────────────────────────────────────
startBtn.addEventListener('click', startGame);

// ─── Affichage initial ───────────────────────────────────────────
bestEl.textContent = 0;
