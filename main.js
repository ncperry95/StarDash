// 1. Live Clock
function updateClock() {
  const now = new Date();
  document.getElementById('clock').textContent = now.toLocaleTimeString();
}
setInterval(updateClock, 1000);
updateClock();

// 2. Geolocation-based Weather + Sunrise/Sunset Theme
async function fetchSunData(lat, lng) {
  const res = await fetch(`https://api.sunrise-sunset.org/json?lat=${lat}&lng=${lng}&formatted=0`);
  const data = await res.json();
  return data.results;
}

async function fetchMoonPhase() {
  const res = await fetch('https://api.farmsense.net/v1/moonphases/?d=' + Math.floor(Date.now() / 1000));
  const [phase] = await res.json();
  return phase.Phase;
}

async function initGeo() {
  if (!navigator.geolocation) return;
  navigator.geolocation.getCurrentPosition(async pos => {
    const { latitude, longitude } = pos.coords;

    // Weather
    const w = document.getElementById('weather');
    w.href = `https://forecast7.com/en/${latitude.toFixed(2)}n${longitude.toFixed(2)}/`;
    w.dataset.label_1 = 'MY LOCATION';
    w.dataset.label_2 = 'WEATHER';
    w.textContent = 'Loading…';

    // Reload widget script
    delete window.weatherWidget;
    const script = document.createElement('script');
    script.src = 'https://weatherwidget.io/js/widget.min.js';
    document.body.appendChild(script);

    // Sunrise/sunset-based gradient
    const sun = await fetchSunData(latitude, longitude);
    const now = new Date();
    if (now < new Date(sun.sunrise)) {
      document.body.style.setProperty('--sky-gradient', 'var(--dawn-gradient)');
    } else if (now > new Date(sun.sunset)) {
      document.body.style.setProperty('--sky-gradient', 'var(--dusk-gradient)');
    } else {
      document.body.style.setProperty('--sky-gradient', 'var(--sky-gradient)');
    }

    // Moon phase
    const phase = await fetchMoonPhase();
    document.getElementById('moon-phase').textContent = phase;
  });
}
document.getElementById('refresh-btn').addEventListener('click', initGeo);
initGeo();

// 3. Starfield Animation (Canvas)
const canvas = document.getElementById('starfield');
const ctx = canvas.getContext('2d');
let w, h, stars = [], shootingStars = [], starsEnabled = true;

function initStars() {
  w = canvas.width = window.innerWidth;
  h = canvas.height = window.innerHeight;
  stars = Array.from({ length: 200 }, () => ({
    x: Math.random() * w,
    y: Math.random() * h,
    r: Math.random() * 1.2,
    alpha: Math.random()
  }));
  shootingStars = [];
}
function drawStars() {
  ctx.clearRect(0, 0, w, h);
  stars.forEach(s => {
    ctx.globalAlpha = s.alpha;
    ctx.beginPath();
    ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
    ctx.fillStyle = '#fff';
    ctx.fill();
  });

  if (starsEnabled) {
    shootingStars.forEach((ss, i) => {
      ctx.globalAlpha = ss.alpha;
      ctx.beginPath();
      ctx.moveTo(ss.x, ss.y);
      ctx.lineTo(ss.x - ss.len, ss.y + ss.len);
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ss.x += ss.vx;
      ss.y += ss.vy;
      ss.alpha -= 0.01;
      if (ss.alpha <= 0) shootingStars.splice(i, 1);
    });

    if (Math.random() < 0.02) {
      shootingStars.push({
        x: Math.random() * w,
        y: Math.random() * h * 0.5,
        vx: -4 - Math.random() * 4,
        vy: 4 + Math.random() * 2,
        len: 100 + Math.random() * 50,
        alpha: 1
      });
    }
  }

  requestAnimationFrame(drawStars);
}
document.getElementById('toggle-stars').addEventListener('change', e => {
  starsEnabled = e.target.checked;
});
window.addEventListener('resize', initStars);
initStars();
drawStars();

// 4. To-Do List (localStorage)
function addTask() {
  const input = document.getElementById('new-task');
  const text = input.value.trim();
  if (!text) return;

  const task = { text, done: false };
  const tasks = getTasks();
  tasks.push(task);
  saveTasks(tasks);
  input.value = '';
  renderTasks();
}

function toggleTask(index) {
  const tasks = getTasks();
  tasks[index].done = !tasks[index].done;
  saveTasks(tasks);
  renderTasks();
}

function deleteTask(index) {
  const tasks = getTasks();
  tasks.splice(index, 1);
  saveTasks(tasks);
  renderTasks();
}

function getTasks() {
  return JSON.parse(localStorage.getItem('tasks') || '[]');
}

function saveTasks(tasks) {
  localStorage.setItem('tasks', JSON.stringify(tasks));
}

function renderTasks() {
  const list = document.getElementById('task-list');
  const tasks = getTasks();
  list.innerHTML = '';

  tasks.forEach((task, i) => {
    const li = document.createElement('li');
    li.textContent = task.text;
    li.style.textDecoration = task.done ? 'line-through' : 'none';
    li.addEventListener('click', () => toggleTask(i));

    const del = document.createElement('button');
    del.textContent = '🗑️';
    del.style.marginLeft = '1rem';
    del.addEventListener('click', (e) => {
      e.stopPropagation();
      deleteTask(i);
    });

    li.appendChild(del);
    list.appendChild(li);
  });
}

renderTasks();
