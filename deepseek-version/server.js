const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });

const PORT = 8000;
const GRID_SIZE = 20;
const CANVAS_SIZE = 800;
const COLORS = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEEAD', '#FF9F76'];
const BASE_SPEED = 100;
const FOOD_SPEED = 200;

let gameState = {
  snakes: [],
  foods: []
};

const FOOD_TYPES = {
  NORMAL: { color: '#f1c40f', prob: 0.80, effect: 'grow' },
  RED: { color: '#e74c3c', prob: 0.15, effect: 'shrink' },
  BLUE: { color: '#3498db', prob: 0.03, effect: 'freeze' },
  PURPLE: { color: '#9b59b6', prob: 0.02, effect: 'split' }
};

function generateFood() {
  const rand = Math.random();
  let type = 'NORMAL';
  
  if(rand < 0.02) type = 'PURPLE';
  else if(rand < 0.05) type = 'BLUE';
  else if(rand < 0.20) type = 'RED';

  return {
    x: Math.floor(Math.random() * (CANVAS_SIZE/GRID_SIZE)) * GRID_SIZE,
    y: Math.floor(Math.random() * (CANVAS_SIZE/GRID_SIZE)) * GRID_SIZE,
    type
  };
}

function initFood() {
  while(gameState.foods.length < 15) {
    const newFood = generateFood();
    if(!gameState.foods.some(f => f.x === newFood.x && f.y === newFood.y)) {
      gameState.foods.push(newFood);
    }
  }
}

function checkCollision(snake) {
  const head = snake.body[0];
  
  // Diğer yılanlarla çarpışma kontrolü
  for(const s of gameState.snakes) {
    for(const [i, segment] of s.body.entries()) {
      if(snake.id === s.id && i === 0) continue;
      if(head.x === segment.x && head.y === segment.y) {
        return { collided: true, victim: s.id };
      }
    }
  }
  return { collided: false };
}

function gameLoop() {
  const victims = new Map();

  gameState.snakes.forEach(snake => {
    const head = {...snake.body[0]};
    switch(snake.direction) {
      case 'up': head.y -= GRID_SIZE; break;
      case 'down': head.y += GRID_SIZE; break;
      case 'left': head.x -= GRID_SIZE; break;
      case 'right': head.x += GRID_SIZE; break;
    }
    
    // Ekran kenarı geçişi
    head.x = (head.x + CANVAS_SIZE) % CANVAS_SIZE;
    head.y = (head.y + CANVAS_SIZE) % CANVAS_SIZE;
    
    snake.body.unshift(head);
    
    // Yem kontrolü
    // Yem kontrolü
    const foodIndex = gameState.foods.findIndex(f => f.x === head.x && f.y === head.y);
    if(foodIndex > -1) {
      const food = gameState.foods[foodIndex];
      if(food.type === 'NORMAL') {
        snake.speed = Math.max(50, snake.speed * 0.95);
      } else {
        // Kırmızı yem etkisi
        if (snake.body.length > 3){
          snake.body = snake.body.slice(0, -3); // 3 segment azalt
          snake.speed = Math.min(300, snake.speed * 1.2);
        }
      }
      gameState.foods.splice(foodIndex, 1);
      for (let i = 0; i < Math.floor(Math.random() * 5) - 0; i++) {
        gameState.foods.push(generateFood());
      }
    } else {
      snake.body.pop();
    }
  });

  // Çarpışma kontrolü
  const removed = [];
  gameState.snakes = gameState.snakes.filter(snake => {
    const collision = checkCollision(snake);
    if(collision.collided) {
      removed.push(snake.id);
      if(collision.victim) {
        victims.set(collision.victim, (victims.get(collision.victim) || 0) + 3);
      }
      return false;
    }
    return true;
  });

  // Çarpılan yılanlara bonus ekleme
  victims.forEach((bonus, victimId) => {
    const victim = gameState.snakes.find(s => s.id === victimId);
    if(victim) {
      victim.body.push(...Array(bonus).fill().map(() => ({...victim.body[victim.body.length-1]})));    
    }
  });

  io.emit('update', gameState);
  removed.forEach(id => io.to(id).emit('game-over'));
}

io.on('connection', (socket) => {
  let username = '';
  
  socket.on('join', (name) => {
    username = name;
    const existing = gameState.snakes.find(s => s.username === username);
    const color = existing?.color || COLORS[gameState.snakes.length % COLORS.length];
    
    const newSnake = {
      id: socket.id,
      username,
      color,
      speed: BASE_SPEED,
      direction: 'right',
      body: Array(3).fill().map((_,i) => ({
        x: 200 - i*GRID_SIZE,
        y: Math.floor(Math.random() * 40)*GRID_SIZE
      }))
    };
    
    gameState.snakes = gameState.snakes.filter(s => s.id !== socket.id);
    gameState.snakes.push(newSnake);
    socket.emit('color', color);
  });

  socket.on('speed-up', () => {
    const snake = gameState.snakes.find(s => s.id === socket.id);
    if(snake) {
      snake.speed = Math.max(50, snake.speed * 0.8); // Hız artışı
      setTimeout(() => {
        if(snake) snake.speed = BASE_SPEED; // 2 saniye sonra reset
      }, 2000);
    }
  });

  socket.on('move', (direction) => {
    const snake = gameState.snakes.find(s => s.id === socket.id);
    if(snake) {
      const opposite = { up: 'down', down: 'up', left: 'right', right: 'left' };
      if(direction !== opposite[snake.direction]) snake.direction = direction;
    }
  });

  socket.on('disconnect', () => {
    gameState.snakes = gameState.snakes.filter(s => s.id !== socket.id);
  });
});

app.use(express.static('public'));
initFood();
setInterval(gameLoop, 150);
server.listen(PORT, () => console.log(`http://localhost:${PORT}`));