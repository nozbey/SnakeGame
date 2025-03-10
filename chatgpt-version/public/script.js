// Socket.IO bağlantısı kur
const socket = io();

// Kullanıcı adını sor ve sunucuya gönder
const username = prompt("Kullanıcı adınızı giriniz:");
socket.emit('newPlayer', username);

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const gridSize = 20;

// Klavye ok tuşlarını yakala ve sunucuya yön değişikliği bildir
document.addEventListener('keydown', (e) => {
  let newDirection;
  switch(e.key) {
    case "ArrowUp":
      newDirection = 'up';
      break;
    case "ArrowDown":
      newDirection = 'down';
      break;
    case "ArrowLeft":
      newDirection = 'left';
      break;
    case "ArrowRight":
      newDirection = 'right';
      break;
    default:
      return;
  }
  socket.emit('changeDirection', newDirection);
});

// Gelen oyun durumunu canvas üzerinde çiz
socket.on('gameState', (state) => {
  // Temizle
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  
  // Yemleri çiz
  state.foods.forEach(food => {
    switch(food.type) {
      case 'normal': ctx.fillStyle = 'green'; break;
      case 'red': ctx.fillStyle = 'red'; break;
      case 'blue': ctx.fillStyle = 'blue'; break;
      case 'purple': ctx.fillStyle = 'purple'; break;
      default: ctx.fillStyle = 'green';
    }
    ctx.fillRect(food.x * gridSize, food.y * gridSize, gridSize, gridSize);
  });
  
  // Yılanları çiz
  state.snakes.forEach(snake => {
    ctx.fillStyle = snake.color;
    snake.segments.forEach(segment => {
      ctx.fillRect(segment.x * gridSize, segment.y * gridSize, gridSize, gridSize);
    });
  });
  
  // Skor panosunu çiz (sol üst köşe)
  ctx.fillStyle = 'black';
  ctx.font = '16px Arial';
  let y = 20;
  state.snakes.forEach(snake => {
    ctx.fillText(snake.username + ": " + snake.score, 10, y);
    y += 20;
  });
});

// Oyun kazanma durumunu bildir
socket.on('gameOver', (data) => {
  alert("Oyun kazanan: " + data.winner);
});
