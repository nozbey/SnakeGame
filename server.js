const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

// Serve static files from public directory
app.use(express.static(path.join(__dirname, 'public')));

// Game state
const players = {};
const foods = {
  normal: [],
  red: [],
  blue: [],
  purple: []
};
const gridSize = 40;
const gameWidth = 800;
const gameHeight = 600;
const foodCount = 40; // Daha fazla yemek (önceden 20)
const winScore = 1000;

// Food generation probabilities
const redFoodProbability = 0.20;    // %20 kırmızı yem (önceden %15)
const blueFoodProbability = 0.15;   // %15 mavi yem (önceden %3)
const purpleFoodProbability = 0.10; // %10 mor yem (önceden %2)

// Generate random position
function getRandomPosition() {
  return {
    x: Math.floor(Math.random() * Math.floor(gameWidth / gridSize)) * gridSize,
    y: Math.floor(Math.random() * Math.floor(gameHeight / gridSize)) * gridSize
  };
}

// Generate food
function generateFood(type = 'normal') {
  // Ensure position is on grid
  const position = getRandomPosition();
  position.x = Math.floor(position.x / gridSize) * gridSize;
  position.y = Math.floor(position.y / gridSize) * gridSize;
  
  // Yem konumunun yılanların üzerinde olmadığından emin ol
  let validPosition = false;
  let attempts = 0;
  let newPosition = { ...position };
  
  while (!validPosition && attempts < 100) {
    validPosition = true;
    
    // Tüm oyuncuların yılanlarını kontrol et
    for (const playerId in players) {
      const player = players[playerId];
      
      if (!player.alive) continue;
      
      // Yılan segmentleri ile çakışma kontrolü
      for (const segment of player.snake) {
        const segX = Math.floor(segment.x / gridSize) * gridSize;
        const segY = Math.floor(segment.y / gridSize) * gridSize;
        
        if (newPosition.x === segX && newPosition.y === segY) {
          validPosition = false;
          newPosition = getRandomPosition();
          newPosition.x = Math.floor(newPosition.x / gridSize) * gridSize;
          newPosition.y = Math.floor(newPosition.y / gridSize) * gridSize;
          attempts++;
          break;
        }
      }
      
      if (!validPosition) break;
    }
  }
  
  // Diğer yemlerle çakışma kontrolü
  ['normal', 'red', 'blue', 'purple'].forEach(foodType => {
    for (const food of foods[foodType]) {
      const foodX = Math.floor(food.x / gridSize) * gridSize;
      const foodY = Math.floor(food.y / gridSize) * gridSize;
      
      if (newPosition.x === foodX && newPosition.y === foodY) {
        newPosition = getRandomPosition();
        newPosition.x = Math.floor(newPosition.x / gridSize) * gridSize;
        newPosition.y = Math.floor(newPosition.y / gridSize) * gridSize;
        break;
      }
    }
  });
  
  foods[type].push(newPosition);
  return newPosition;
}

// Initialize food
function initializeFood() {
  // Önce tüm yemleri temizle
  foods.normal = [];
  foods.red = [];
  foods.blue = [];
  foods.purple = [];
  
  console.log("Initializing foods...");
  
  // Yem türlerine göre sayı garantile
  // Normal yemler
  for (let i = 0; i < Math.floor(foodCount * 0.55); i++) {
    generateFood('normal');
  }
  
  // Kırmızı yemler
  for (let i = 0; i < Math.floor(foodCount * 0.20); i++) {
    generateFood('red');
  }
  
  // Mavi yemler
  for (let i = 0; i < Math.floor(foodCount * 0.15); i++) {
    generateFood('blue');
  }
  
  // Mor yemler
  for (let i = 0; i < Math.floor(foodCount * 0.10); i++) {
    generateFood('purple');
  }
  
  console.log(`Food counts - Normal: ${foods.normal.length}, Red: ${foods.red.length}, Blue: ${foods.blue.length}, Purple: ${foods.purple.length}`);
}

// Initialize game
initializeFood();

// Restart game
function restartGame() {
  // Clear all foods
  foods.normal = [];
  foods.red = [];
  foods.blue = [];
  foods.purple = [];
  
  // Reset all players
  for (const playerId in players) {
    // Keep name but reset everything else
    const playerName = players[playerId].name;
    const playerColor = players[playerId].color;
    players[playerId] = createNewPlayer(playerName, playerColor);
  }
  
  // Initialize new food
  initializeFood();
  
  // Notify all clients to restart
  io.emit('gameRestart');
}

// Generate a random color
function getRandomColor() {
  const colors = [
    '#800080', // Mor (varsayılan)
    '#9370DB', // Orta mor
    '#8A2BE2', // Mavi mor
    '#9932CC', // Koyu orkide
    '#BA55D3', // Orta orkide
    '#DA70D6', // Orkide
    '#A020F0', // Mor
    '#7B68EE', // Orta arduvaz mavi
    '#6A5ACD', // Arduvaz mavi
    '#FF00FF', // Fuşya
    '#FF69B4', // Sıcak pembe
    '#C71585'  // Orta vişne
  ];
  return colors[Math.floor(Math.random() * colors.length)];
}

// Create a new player
function createNewPlayer(name, color = null) {
  const position = getRandomPosition();
  // Pozisyonu grid'e hizala
  position.x = Math.floor(position.x / gridSize) * gridSize;
  position.y = Math.floor(position.y / gridSize) * gridSize;
  
  return {
    name: name,
    color: color || getRandomColor(),
    snake: [
      position, 
      { x: position.x - gridSize, y: position.y }
    ],
    direction: 'right',
    score: 0,
    alive: true,
    speed: 1,
    frozen: false,
    frozenTimeout: null,
    speedBoostTimeout: null
  };
}

// Socket.io connection handling
io.on('connection', (socket) => {
  console.log('New client connected');
  
  // Handle new player joining
  socket.on('newPlayer', (name) => {
    players[socket.id] = createNewPlayer(name);
    
    // Simplify players object before sending
    const simplifiedPlayers = {};
    for (const id in players) {
      const player = players[id];
      simplifiedPlayers[id] = {
        name: player.name,
        color: player.color,
        snake: [...player.snake],
        direction: player.direction,
        score: player.score,
        alive: player.alive,
        speed: player.speed,
        frozen: player.frozen
      };
    }
    io.emit('updatePlayers', simplifiedPlayers);
    
    // Clone foods to avoid reference issues
    const simplifiedFoods = {
      normal: [...foods.normal],
      red: [...foods.red],
      blue: [...foods.blue],
      purple: [...foods.purple]
    };
    
    socket.emit('initGame', {
      gridSize,
      gameWidth,
      gameHeight,
      foods: simplifiedFoods,
      playerId: socket.id,
      winScore
    });
  });
  
  // Handle player movement
  socket.on('changeDirection', (direction) => {
    if (!players[socket.id] || !players[socket.id].alive) return;
    
    const currentDirection = players[socket.id].direction;
    
    // Prevent reverse direction
    if (
      (direction === 'up' && currentDirection === 'down') ||
      (direction === 'down' && currentDirection === 'up') ||
      (direction === 'left' && currentDirection === 'right') ||
      (direction === 'right' && currentDirection === 'left')
    ) {
      return;
    }
    
    // Speed boost if pressing same direction again
    if (direction === currentDirection) {
      players[socket.id].speed = 2;
      
      // Clear existing timeout if any
      if (players[socket.id].speedBoostTimeout) {
        clearTimeout(players[socket.id].speedBoostTimeout);
      }
      
      // Reset speed after 2 seconds
      players[socket.id].speedBoostTimeout = setTimeout(() => {
        if (players[socket.id]) {
          players[socket.id].speed = 1;
        }
      }, 2000);
    }
    
    players[socket.id].direction = direction;
  });
  
  // Handle player reconnecting after game over
  socket.on('rejoin', (name) => {
    if (players[socket.id]) {
      const color = players[socket.id].color;
      players[socket.id] = createNewPlayer(name, color);
      
      // Simplify players object before sending
      const simplifiedPlayers = {};
      for (const id in players) {
        const player = players[id];
        simplifiedPlayers[id] = {
          name: player.name,
          color: player.color,
          snake: [...player.snake],
          direction: player.direction,
          score: player.score,
          alive: player.alive,
          speed: player.speed,
          frozen: player.frozen
        };
      }
      io.emit('updatePlayers', simplifiedPlayers);
    }
  });
  
  // Handle disconnection
  socket.on('disconnect', () => {
    console.log('Client disconnected');
    delete players[socket.id];
    
    // Simplify players object before sending
    const simplifiedPlayers = {};
    for (const id in players) {
      const player = players[id];
      simplifiedPlayers[id] = {
        name: player.name,
        color: player.color,
        snake: [...player.snake],
        direction: player.direction,
        score: player.score,
        alive: player.alive,
        speed: player.speed,
        frozen: player.frozen
      };
    }
    io.emit('updatePlayers', simplifiedPlayers);
  });
});

// Game loop
const gameInterval = setInterval(() => {
  let gameUpdate = false;
  
  try {
    // Move each player
    for (const playerId in players) {
      const player = players[playerId];
      
      if (!player.alive || player.frozen) continue;
      
      // Create new head position based on direction
      const head = { ...player.snake[0] };
      
      // Ensure coordinates are multiples of gridSize
      head.x = Math.round(head.x / gridSize) * gridSize;
      head.y = Math.round(head.y / gridSize) * gridSize;
      
      const speed = Math.round(player.speed * gridSize);
      
      switch (player.direction) {
        case 'up':
          head.y -= speed;
          break;
        case 'down':
          head.y += speed;
          break;
        case 'left':
          head.x -= speed;
          break;
        case 'right':
          head.x += speed;
          break;
      }
      
      // Wrap around edges - ensure we land exactly on grid boundaries
      if (head.x < 0) head.x = Math.floor((gameWidth - 1) / gridSize) * gridSize;
      if (head.x >= gameWidth) head.x = 0;
      if (head.y < 0) head.y = Math.floor((gameHeight - 1) / gridSize) * gridSize;
      if (head.y >= gameHeight) head.y = 0;
      
      // Add new head
      player.snake.unshift(head);
      
      // Check collision with other players
      let collision = false;
      for (const otherPlayerId in players) {
        if (otherPlayerId === playerId) continue;
        
        const otherPlayer = players[otherPlayerId];
        if (!otherPlayer.alive) continue;
        
        // Check if head collides with other player's body
        for (const segment of otherPlayer.snake) {
          if (head.x === segment.x && head.y === segment.y) {
            collision = true;
            player.alive = false;
            
            // Add bonus to the hit player - add two segments
            otherPlayer.snake.push({...otherPlayer.snake[otherPlayer.snake.length - 1]});
            otherPlayer.snake.push({...otherPlayer.snake[otherPlayer.snake.length - 1]});
            otherPlayer.score += 10;
            console.log(`Player ${player.name} hit player ${otherPlayer.name}. ${otherPlayer.name} got longer.`);
            
            gameUpdate = true;
            break;
          }
        }
        
        if (collision) break;
      }
      
      // Check self-collision (excluding head)
      if (!collision) {
        for (let i = 1; i < player.snake.length; i++) {
          if (head.x === player.snake[i].x && head.y === player.snake[i].y) {
            player.alive = false;
            collision = true;
            gameUpdate = true;
            break;
          }
        }
      }
      
      // Process foods if no collision
      if (!collision) {
        // Check normal food collision
        let ateFood = false;
        
        // Check normal food
        for (let i = 0; i < foods.normal.length; i++) {
          // Grid'e hizalı çarpışma kontrolü
          const foodX = Math.floor(foods.normal[i].x / gridSize) * gridSize;
          const foodY = Math.floor(foods.normal[i].y / gridSize) * gridSize;
          const headX = Math.floor(head.x / gridSize) * gridSize;
          const headY = Math.floor(head.y / gridSize) * gridSize;
          
          if (headX === foodX && headY === foodY) {
            foods.normal.splice(i, 1);
            player.score += 10;
            ateFood = true;
            gameUpdate = true;
            
            // Uzama sınırı - 30'dan uzunsa daha fazla uzamasın
            if (player.snake.length < 30) {
              // Yeni segment ekle (kuyruktan bir kopya)
              if (player.snake.length > 0) {
                player.snake.push({...player.snake[player.snake.length - 1]});
              }
            }
            
            console.log(`Player ${player.name} ate NORMAL food. Snake length: ${player.snake.length}, Score: ${player.score}`);
            
            // Yılan çok uzadığında yavaşlasın
            if (player.snake.length > 10) {
              player.speed = Math.max(0.7, 1 - (player.snake.length * 0.01));
            }
            break;
          }
        }
        
        // Check red food - reduces length if length > 3
        for (let i = 0; i < foods.red.length; i++) {
          // Grid'e hizalı çarpışma kontrolü
          const foodX = Math.floor(foods.red[i].x / gridSize) * gridSize;
          const foodY = Math.floor(foods.red[i].y / gridSize) * gridSize;
          const headX = Math.floor(head.x / gridSize) * gridSize;
          const headY = Math.floor(head.y / gridSize) * gridSize;
          
          if (headX === foodX && headY === foodY) {
            foods.red.splice(i, 1);
            
            // Kırmızı yem için puan düşürme
            if (player.score >= 15) {
              player.score -= 15;
            } else {
              player.score = 0;
            }
            
            // Kırmızı yem yendiğinde, yılanın uzunluğu 3'ten büyükse kısalt
            if (player.snake.length > 3) {
              // Uzunluk fazla ise daha çok kısalt
              const segmentsToRemove = Math.min(player.snake.length - 3, 
                Math.max(3, Math.floor(player.snake.length / 3))); // En az 3, en fazla yılanın 1/3'ü
              
              // Kuyruktan segmentleri çıkar
              player.snake = player.snake.slice(0, player.snake.length - segmentsToRemove);
              console.log(`Player ${player.name} ate RED food. Snake shortened to: ${player.snake.length}. Score: ${player.score}`);
            }
            
            ateFood = true;
            gameUpdate = true;
            break;
          }
        }
        
        // Check blue food - freezes player for 5 seconds
        for (let i = 0; i < foods.blue.length; i++) {
          // Grid'e hizalı çarpışma kontrolü
          const foodX = Math.floor(foods.blue[i].x / gridSize) * gridSize;
          const foodY = Math.floor(foods.blue[i].y / gridSize) * gridSize;
          const headX = Math.floor(head.x / gridSize) * gridSize;
          const headY = Math.floor(head.y / gridSize) * gridSize;
          
          if (headX === foodX && headY === foodY) {
            foods.blue.splice(i, 1);
            player.score += 20;
            player.frozen = true;
            
            console.log(`Player ${player.name} ate BLUE food. Frozen for 5 seconds.`);
            
            // Clear existing freeze timeout if any
            if (player.frozenTimeout) {
              clearTimeout(player.frozenTimeout);
            }
            
            // Set up new freeze timeout
            player.frozenTimeout = setTimeout(() => {
              if (players[playerId]) {
                players[playerId].frozen = false;
              }
            }, 5000);
            
            ateFood = true;
            gameUpdate = true;
            break;
          }
        }
        
        // Check purple food - splits snake in half and reduces speed
        for (let i = 0; i < foods.purple.length; i++) {
          // Grid'e hizalı çarpışma kontrolü
          const foodX = Math.floor(foods.purple[i].x / gridSize) * gridSize;
          const foodY = Math.floor(foods.purple[i].y / gridSize) * gridSize;
          const headX = Math.floor(head.x / gridSize) * gridSize;
          const headY = Math.floor(head.y / gridSize) * gridSize;
          
          if (headX === foodX && headY === foodY) {
            foods.purple.splice(i, 1);
            player.score += 30;
            
            // Split snake in half
            if (player.snake.length > 1) {
              const halfLength = Math.ceil(player.snake.length / 2);
              // Remove the second half of the snake
              player.snake = player.snake.slice(0, halfLength);
              console.log(`Player ${player.name} ate PURPLE food. Snake split to: ${player.snake.length}`);
            }
            
            // Reduce speed by half temporarily
            player.speed = 0.5;
            
            // Set timeout to restore speed after some time
            setTimeout(() => {
              if (players[playerId]) {
                players[playerId].speed = 1;
              }
            }, 10000);
            
            ateFood = true;
            gameUpdate = true;
            break;
          }
        }
        
        // Remove tail if no food was eaten
        if (!ateFood) {
          // Only pop the tail if no food was eaten
          player.snake.pop();
        } else {
          // Debugging log to verify food eating is working
          console.log(`Player ${player.name} ate food. Snake length: ${player.snake.length}`);
          
          // Generate new food to replace eaten one
          let foodType = determineNewFoodType();
          const newFood = generateFood(foodType);
          console.log(`Generated new ${foodType} food at position:`, newFood);
        }
        
        // Check if player won
        if (player.score >= winScore) {
          io.emit('gameWon', {
            winner: player.name,
            score: player.score
          });
          
          // Schedule game restart after 10 seconds
          setTimeout(restartGame, 10000);
          
          gameUpdate = true;
        }
      }
    }
    
    // Function to determine new food type with better balance
    function determineNewFoodType() {
      // Mevcut yemek sayılarını kontrol et
      const totalFoods = foods.normal.length + foods.red.length + 
                         foods.blue.length + foods.purple.length;
      
      // Eğer belirli bir türde çok az yemek varsa, o türden yemek oluştur
      if (foods.blue.length < Math.floor(totalFoods * 0.15)) {
        return 'blue';
      }
      
      if (foods.red.length < Math.floor(totalFoods * 0.20)) {
        return 'red';
      }
      
      if (foods.purple.length < Math.floor(totalFoods * 0.10)) {
        return 'purple';
      }
      
      // Yoksa normal olasılık hesabı yap
      const random = Math.random();
      if (random < purpleFoodProbability) {
        return 'purple';
      } else if (random < blueFoodProbability + purpleFoodProbability) {
        return 'blue';
      } else if (random < redFoodProbability + blueFoodProbability + purpleFoodProbability) {
        return 'red';
      } else {
        return 'normal';
      }
    }
    
    // Send game state to all clients if there were updates
    if (gameUpdate || Object.keys(players).length > 0) {
      // Convert players to a simplified format before sending
      const simplifiedPlayers = {};
      for (const id in players) {
        const player = players[id];
        const processedSnake = player.snake.map(segment => ({
          x: Math.floor(segment.x / gridSize) * gridSize,
          y: Math.floor(segment.y / gridSize) * gridSize
        }));
        
        simplifiedPlayers[id] = {
          name: player.name,
          color: player.color,
          snake: processedSnake,
          direction: player.direction,
          score: player.score,
          alive: player.alive,
          speed: player.speed,
          frozen: player.frozen
        };
      }
      
      // Clone foods to avoid reference issues
      const simplifiedFoods = {
        normal: foods.normal.map(food => ({
          x: Math.floor(food.x / gridSize) * gridSize,
          y: Math.floor(food.y / gridSize) * gridSize
        })),
        red: foods.red.map(food => ({
          x: Math.floor(food.x / gridSize) * gridSize,
          y: Math.floor(food.y / gridSize) * gridSize
        })),
        blue: foods.blue.map(food => ({
          x: Math.floor(food.x / gridSize) * gridSize,
          y: Math.floor(food.y / gridSize) * gridSize
        })),
        purple: foods.purple.map(food => ({
          x: Math.floor(food.x / gridSize) * gridSize,
          y: Math.floor(food.y / gridSize) * gridSize
        }))
      };
      
      io.emit('gameState', { 
        players: simplifiedPlayers, 
        foods: simplifiedFoods 
      });
    }
  } catch (error) {
    console.error("Game loop error:", error);
  }
}, 100);

// Start server on port 8000
server.listen(8000, () => {
  console.log('Server is running on port 8000');
});
