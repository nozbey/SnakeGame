const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);
const PORT = 8000;

app.use(express.static('public'));

http.listen(PORT, () => console.log(`Server ${PORT} portunda çalışıyor.`));

// Oyun ayarları
const gridSize = 20;
const gridWidth = 40;  // 800 / 20
const gridHeight = 30; // 600 / 20

let snakes = {}; // oyuncu id'lerine göre yılanlar
let foods = [];

// Rastgele yemek oluşturma fonksiyonu
function generateFood() {
  const x = Math.floor(Math.random() * gridWidth);
  const y = Math.floor(Math.random() * gridHeight);
  // Yem tipi, olasılıklar: %2 mor, %3 mavi, %15 kırmızı, aksi halde normal
  const rand = Math.random();
  let type = 'normal';
  if(rand < 0.02) type = 'purple';
  else if(rand < 0.02 + 0.03) type = 'blue';
  else if(rand < 0.02 + 0.03 + 0.15) type = 'red';
  return { x, y, type };
}

// Her saniye eğer ekranda 5'ten az yemek varsa yenisini ekle
setInterval(() => {
  if (foods.length < 5) {
    foods.push(generateFood());
  }
}, 1000);

// Rasgele renk üretimi
function getRandomColor() {
  const letters = '0123456789ABCDEF';
  let color = '#';
  for (let i = 0; i < 6; i++){
    color += letters[Math.floor(Math.random()*16)];
  }
  return color;
}

// Socket bağlantıları
io.on('connection', (socket) => {
  console.log('Yeni oyuncu bağlandı:', socket.id);
  
  // Oyuncu giriş yaptığında yeni yılan oluştur
  socket.on('newPlayer', (username) => {
    const startX = Math.floor(Math.random() * gridWidth);
    const startY = Math.floor(Math.random() * gridHeight);
    snakes[socket.id] = {
      id: socket.id,
      username: username || "Anon",
      color: getRandomColor(),
      segments: [{ x: startX, y: startY }],
      direction: 'right',
      pendingDirection: 'right',
      speed: 1,        // normal hız (1 hücre/tick)
      boost: false,    // yön tuşuna tekrar basılırsa 2 kat hız
      boostTimer: 0,
      freezeTimer: 0,
      score: 0
    };
  });
  
  // Yön değiştirme bildirimi
  socket.on('changeDirection', (newDirection) => {
    if (snakes[socket.id]) {
      // Aynı yöne basılırsa boost aktif edilir
      if (newDirection === snakes[socket.id].direction) {
        snakes[socket.id].boost = true;
        snakes[socket.id].boostTimer = 40; // 2 saniye (50ms * 40 = 2000ms)
      } else {
        snakes[socket.id].pendingDirection = newDirection;
      }
    }
  });
  
  socket.on('disconnect', () => {
    console.log('Oyuncu ayrıldı:', socket.id);
    delete snakes[socket.id];
  });
});

// Oyun döngüsü (50ms per tick)
setInterval(() => {
  for (let id in snakes) {
    let snake = snakes[id];
    
    // Eğer yılan donmuşsa, freezeTimer'ı azalt ve hareket etme
    if (snake.freezeTimer > 0) {
      snake.freezeTimer--;
      continue;
    }
    
    // Bekleyen yönü uygula
    snake.direction = snake.pendingDirection;
    
    // Hareket vektörü belirle
    let dx = 0, dy = 0;
    switch(snake.direction) {
      case 'up': dy = -1; break;
      case 'down': dy = 1; break;
      case 'left': dx = -1; break;
      case 'right': dx = 1; break;
    }
    
    // Hareket miktarı: boost aktifse 2 hücre, normalde speed değeri kadar
    let moveCells = snake.boost ? 2 : snake.speed;
    
    // Yeni baş konumunu hesapla (wrap-around uygulanıyor)
    let head = snake.segments[0];
    let newHead = {
      x: (head.x + dx * moveCells + gridWidth) % gridWidth,
      y: (head.y + dy * moveCells + gridHeight) % gridHeight
    };
    
    // Diğer yılanlarla çarpışma kontrolü
    let collision = false;
    for (let otherId in snakes) {
      if (otherId === id) continue;
      let otherSnake = snakes[otherId];
      for (let segment of otherSnake.segments) {
        if (segment.x === newHead.x && segment.y === newHead.y) {
          collision = true;
          // Çarpılan yılan bonus puan alsın
          otherSnake.score += 10;
          break;
        }
      }
      if (collision) break;
    }
    
    // Aynı yılanın kendi vücuduyla çarpışması
    for (let i = 0; i < snake.segments.length; i++) {
      let segment = snake.segments[i];
      if (segment.x === newHead.x && segment.y === newHead.y) {
        collision = true;
        break;
      }
    }
    
    if (collision) {
      // Çarpışan oyuncu oyun dışı kalır ve aynı isimle yeniden başlar
      snake.segments = [{ x: Math.floor(Math.random()*gridWidth), y: Math.floor(Math.random()*gridHeight) }];
      snake.score = 0;
      snake.direction = 'right';
      snake.pendingDirection = 'right';
      snake.speed = 1;
      snake.boost = false;
      snake.boostTimer = 0;
      snake.freezeTimer = 0;
      continue; // bu tick için diğer işlemleri atla
    }
    
    // Yeni başı ekle
    snake.segments.unshift(newHead);
    
    // Yem yeme kontrolü
    let ateFoodIndex = -1;
    foods.forEach((food, index) => {
      if (food.x === newHead.x && food.y === newHead.y) {
        ateFoodIndex = index;
      }
    });
    if (ateFoodIndex > -1) {
      let food = foods[ateFoodIndex];
      switch(food.type) {
        case 'normal':
          snake.score += 10;
          // Büyüme: yılanın kuyruğu silinmez
          // Hızı yavaşlat: min hız limiti 0.5
          if (snake.speed > 0.5) snake.speed -= 0.1;
          break;
        case 'red':
          // Eğer yılan 3'ten uzun ise 3 segment sil
          if (snake.segments.length > 3) {
            snake.segments.splice(-3);
          }
          snake.score += 5;
          break;
        case 'blue':
          // 5 saniye (100 tick) donma etkisi
          snake.freezeTimer = 100;
          snake.score += 5;
          break;
        case 'purple':
          // Yılanı yarıya böl: segment sayısı yarıya düşer, hızı yarıya iner (min hız 0.5)
          let half = Math.floor(snake.segments.length / 2);
          snake.segments = snake.segments.slice(0, half);
          snake.speed = Math.max(0.5, snake.speed / 2);
          snake.score += 15;
          break;
      }
      // Yenen yemi kaldır ve yerine yenisini ekle
      foods.splice(ateFoodIndex, 1);
      foods.push(generateFood());
    } else {
      // Yem yenmediyse, yılanın kuyruğundan son segment silinir
      snake.segments.pop();
    }
    
    // Boost süresini kontrol et
    if (snake.boost) {
      snake.boostTimer--;
      if (snake.boostTimer <= 0) {
        snake.boost = false;
      }
    }
    
    // Skor 1000'e ulaşırsa oyun kazanılır
    if (snake.score >= 1000) {
      io.emit('gameOver', { winner: snake.username });
      // 10 saniye sonra tüm oyuncular sıfırlansın
      setTimeout(() => {
        for (let id in snakes) {
          snakes[id].score = 0;
          snakes[id].segments = [{ x: Math.floor(Math.random()*gridWidth), y: Math.floor(Math.random()*gridHeight) }];
          snakes[id].direction = 'right';
          snakes[id].pendingDirection = 'right';
          snakes[id].speed = 1;
          snakes[id].boost = false;
          snakes[id].boostTimer = 0;
          snakes[id].freezeTimer = 0;
        }
      }, 10000);
    }
  }
  
  // Güncel oyun durumunu tüm oyunculara gönder
  io.emit('gameState', { snakes: Object.values(snakes), foods: foods });
}, 50);
