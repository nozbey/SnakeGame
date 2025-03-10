const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const loginForm = document.getElementById('loginForm');
const usernameInput = document.getElementById('username');
const scoreboardDiv = document.getElementById('scoreboard');

let ws;
let playerId;
let players = [];
let foods = [];
let scores = [];
let lastDirection = null;

function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}
resizeCanvas();
window.addEventListener('resize', resizeCanvas);

loginForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const username = usernameInput.value.trim();
  if (username) {
    connectToServer(username);
    loginForm.style.display = 'none';
  }
});

function connectToServer(username) {
  ws = new WebSocket(`ws://${window.location.hostname}:8000`);

  ws.onmessage = (event) => {
    const data = JSON.parse(event.data);
    
    switch(data.type) {
      case 'init':
        playerId = data.id;
        break;
        
      case 'update':
        players = data.players;
        foods = data.foods;
        scores = data.scores;
        break;
        
      case 'win':
        alert(`${data.username} kazandı! Oyun 10 saniye içinde yeniden başlıyor...`);
        break;
    }
  };
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  
  // Draw foods
  foods.forEach(food => {
    ctx.beginPath();
    ctx.arc(food.x * (canvas.width/1000), food.y * (canvas.height/800), 8, 0, Math.PI * 2);
    ctx.fillStyle = {
      normal: '#2ecc71',
      red: '#e74c3c',
      blue: '#3498db',
      purple: '#9b59b6'
    }[food.type];
    ctx.fill();
  });
  
  // Draw players
  players.forEach(player => {
    ctx.fillStyle = player.color;
    ctx.beginPath();
    ctx.arc(
      player.x * (canvas.width/1000),
      player.y * (canvas.height/800),
      12, 0, Math.PI * 2
    );
    ctx.fill();
    
    // Draw username
    ctx.fillStyle = 'white';
    ctx.font = '14px Arial';
    ctx.fillText(
      player.username,
      player.x * (canvas.width/1000) - 20,
      player.y * (canvas.height/800) - 20
    );
  });
  
  // Draw scoreboard
  scoreboardDiv.innerHTML = '<h3>Skor Tablosu</h3>';
  scores.sort((a, b) => b[1] - a[1]).forEach(([id, score]) => {
    const player = players.find(p => p.id === id);
    if (player) {
      scoreboardDiv.innerHTML += `
        <div>${player.username}: ${score}</div>
      `;
    }
  });
  
  requestAnimationFrame(draw);
}

document.addEventListener('keydown', (e) => {
  const directions = {
    ArrowUp: 'up',
    ArrowDown: 'down',
    ArrowLeft: 'left',
    ArrowRight: 'right'
  };
  
  if (directions[e.key] && ws) {
    ws.send(JSON.stringify({
      type: 'move',
      direction: directions[e.key]
    }));
  }
});

draw();