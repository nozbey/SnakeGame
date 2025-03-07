// Connect to the server
const socket = io();

// Game variables
let canvas, ctx;
let gameWidth, gameHeight, gridSize;
let playerName, playerId;
let players = {};
let foods = { normal: [], red: [], blue: [], purple: [] };
let winScore;
let gameActive = false;

// DOM elements
const loginScreen = document.getElementById('login-screen');
const gameContainer = document.getElementById('game-container');
const gameOverScreen = document.getElementById('game-over-screen');
const winnerScreen = document.getElementById('winner-screen');
const playerNameInput = document.getElementById('playerName');
const startGameButton = document.getElementById('startGame');
const scoreboard = document.getElementById('scoreboard');
const gameMessage = document.getElementById('game-message');
const finalScore = document.getElementById('score-value');
const winnerMessage = document.getElementById('winner-message');

// Set up event listeners
startGameButton.addEventListener('click', joinGame);
playerNameInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') joinGame();
});

document.addEventListener('keydown', handleKeydown);

// Reklam tıklama olayı
document.addEventListener('DOMContentLoaded', function() {
    document.querySelector('.ad-button').addEventListener('click', function() {
        alert('Reklam bağlantısına tıkladınız. Gerçek bir uygulamada sponsor sayfasına yönlendirilirsiniz.');
    });
});

// Join the game
function joinGame() {
    playerName = playerNameInput.value.trim() || "Player" + Math.floor(Math.random() * 1000);
    
    if (playerName) {
        socket.emit('newPlayer', playerName);
        loginScreen.style.display = 'none';
        gameContainer.style.display = 'flex';
        gameActive = true;
    }
}

// Automatically rejoin after game over
function rejoinGame() {
    socket.emit('rejoin', playerName);
    gameOverScreen.style.display = 'none';
    gameActive = true;
}

// Genel reklam değiştirme fonksiyonu
function rotateAds() {
    const adTitles = [
        "Premium Yılan Paketi'ni Deneyin!",
        "Yeni oyunumuzu keşfedin!",
        "Reklamsız oynamak için Premium",
        "Oyunumuzu destekleyen sponsorlar",
        "Özel yılan görünümleri için tıklayın"
    ];
    
    const adDescriptions = [
        "Özel görünümler ve hızlı yılanlar",
        "Daha hızlı, daha eğlenceli!",
        "Daha iyi bir oyun deneyimi için",
        "Destekleriniz için teşekkürler",
        "Yılanınızı özelleştirin!"
    ];
    
    const adColors = [
        "linear-gradient(135deg, #3498db, #2c3e50)",
        "linear-gradient(135deg, #e74c3c, #c0392b)",
        "linear-gradient(135deg, #2ecc71, #27ae60)",
        "linear-gradient(135deg, #f39c12, #d35400)",
        "linear-gradient(135deg, #9b59b6, #8e44ad)"
    ];
    
    const randomIndex = Math.floor(Math.random() * adTitles.length);
    
    document.querySelector('.ad-title').textContent = adTitles[randomIndex];
    document.querySelector('.ad-description').textContent = adDescriptions[randomIndex];
    document.querySelector('.demo-ad').style.background = adColors[randomIndex];
}

// Oyun başladığında reklamları döndürmeye başla
socket.on('initGame', (data) => {
    gridSize = data.gridSize;
    gameWidth = data.gameWidth;
    gameHeight = data.gameHeight;
    playerId = data.playerId;
    foods = data.foods;
    winScore = data.winScore;
    
    // Set up canvas
    canvas = document.getElementById('game-canvas');
    canvas.width = gameWidth;
    canvas.height = gameHeight;
    ctx = canvas.getContext('2d');
    
    // Reklamları döndürmeye başla
    rotateAds();
    setInterval(rotateAds, 30000); // Her 30 saniyede bir reklam değiştir
    
    // Start game loop
    requestAnimationFrame(gameLoop);
});

// Update players
socket.on('updatePlayers', (newPlayers) => {
    players = newPlayers;
    updateScoreboard();
});

// Update game state
socket.on('gameState', (state) => {
    players = state.players;
    foods = state.foods;
    updateScoreboard();
    
    // Check if current player is dead
    if (playerId && players[playerId] && !players[playerId].alive && gameActive) {
        handleGameOver();
    }
});

// Handle game over for the current player
function handleGameOver() {
    gameActive = false;
    gameOverScreen.style.display = 'flex';
    finalScore.textContent = players[playerId].score;
    
    // Automatically rejoin after 3 seconds
    setTimeout(rejoinGame, 3000);
}

// Handle game won event
socket.on('gameWon', (data) => {
    winnerScreen.style.display = 'flex';
    winnerMessage.textContent = `${data.winner} kazandı! Skor: ${data.score}`;
});

// Handle game restart
socket.on('gameRestart', () => {
    winnerScreen.style.display = 'none';
    gameOverScreen.style.display = 'none';
    gameActive = true;
});

// Update scoreboard
function updateScoreboard() {
    scoreboard.innerHTML = '';
    
    // Sort players by score
    const sortedPlayers = Object.values(players).sort((a, b) => b.score - a.score);
    
    sortedPlayers.forEach(player => {
        const playerElement = document.createElement('div');
        playerElement.className = 'player-score';
        
        // Style based on player status
        let statusClass = 'alive';
        let statusText = '';
        
        if (!player.alive) {
            statusClass = 'dead';
            statusText = ' (Öldü)';
        } else if (player.frozen) {
            statusClass = 'frozen';
            statusText = ' (Dondu)';
        }
        
        // Highlight current player
        const isCurrentPlayer = playerId === Object.keys(players).find(id => players[id] === player);
        
        playerElement.innerHTML = `
            <span style="color: ${player.color}; font-weight: ${isCurrentPlayer ? 'bold' : 'normal'}">
                ${player.name}${isCurrentPlayer ? ' (Sen)' : ''}${statusText}
            </span>
            <span class="${statusClass}">${player.score}</span>
        `;
        
        scoreboard.appendChild(playerElement);
    });
    
    // Update message for current player
    if (playerId && players[playerId]) {
        const player = players[playerId];
        
        if (player.frozen) {
            gameMessage.textContent = 'Donmuş durumdasın! 5 saniye bekle...';
            gameMessage.style.color = '#3498db';
        } else if (player.speed > 1) {
            gameMessage.textContent = 'Hızlandın!';
            gameMessage.style.color = '#f39c12';
        } else if (player.speed < 1) {
            gameMessage.textContent = 'Yavaşladın!';
            gameMessage.style.color = '#9b59b6';
        } else {
            gameMessage.textContent = '';
        }
    }
}

// Handle keyboard input
function handleKeydown(e) {
    if (!gameActive || !players[playerId] || !players[playerId].alive) return;
    
    let direction;
    
    switch (e.key) {
        case 'ArrowUp':
        case 'w':
        case 'W':
            direction = 'up';
            break;
        case 'ArrowDown':
        case 's':
        case 'S':
            direction = 'down';
            break;
        case 'ArrowLeft':
        case 'a':
        case 'A':
            direction = 'left';
            break;
        case 'ArrowRight':
        case 'd':
        case 'D':
            direction = 'right';
            break;
        default:
            return;
    }
    
    socket.emit('changeDirection', direction);
}

// Game loop
function gameLoop() {
    if (canvas && ctx) {
        // Clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Draw grid
        drawGrid();
        
        // Draw food
        drawFoods();
        
        // Draw snakes
        drawSnakes();
    }
    
    // Continue the loop
    requestAnimationFrame(gameLoop);
}

// Draw grid lines
function drawGrid() {
    ctx.strokeStyle = '#333333';
    ctx.lineWidth = 0.5;
    
    // Draw vertical lines
    for (let x = 0; x <= gameWidth; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, gameHeight);
        ctx.stroke();
    }
    
    // Draw horizontal lines
    for (let y = 0; y <= gameHeight; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(gameWidth, y);
        ctx.stroke();
    }
}

// Draw all food types
function drawFoods() {
    // Debug log - yemek sayılarını kontrol et
    console.log("Drawing foods - counts:", {
        normal: foods.normal.length,
        red: foods.red.length, 
        blue: foods.blue.length, 
        purple: foods.purple.length
    });
    
    // Draw normal food (white)
    ctx.fillStyle = '#FFFFFF';
    foods.normal.forEach(food => {
        drawFood(food.x, food.y);
    });
    
    // Draw red food
    ctx.fillStyle = '#FF0000';
    foods.red.forEach(food => {
        drawFood(food.x, food.y);
    });
    
    // Draw blue food
    ctx.fillStyle = '#0000FF';
    foods.blue.forEach(food => {
        drawFood(food.x, food.y);
    });
    
    // Draw purple food
    ctx.fillStyle = '#800080';
    foods.purple.forEach(food => {
        drawFood(food.x, food.y);
    });
}

// Draw a single food item
function drawFood(x, y) {
    // Koordinatları grid'e hizala
    x = Math.round(x / gridSize) * gridSize;
    y = Math.round(y / gridSize) * gridSize;
    
    const foodSize = gridSize * 0.6;
    
    ctx.beginPath();
    ctx.arc(x + gridSize/2, y + gridSize/2, foodSize/2, 0, Math.PI * 2);
    ctx.fill();
}

// Draw all snakes
function drawSnakes() {
    for (const id in players) {
        const player = players[id];
        if (!player.snake || player.snake.length === 0) continue;
        
        // Set the snake color
        ctx.fillStyle = player.color;
        
        // Special effect for frozen snakes
        if (player.frozen) {
            ctx.globalAlpha = 0.5;
        }
        
        // Draw each segment of the snake
        player.snake.forEach((segment, index) => {
            // Draw a rounded rectangle for the head
            if (index === 0) {
                drawSnakeHead(segment.x, segment.y, player.direction, player.color);
            }
            // Draw the body
            else {
                drawSnakeSegment(segment.x, segment.y, player.color);
            }
        });
        
        // Reset transparency
        ctx.globalAlpha = 1;
        
        // Draw player name above the snake
        drawPlayerName(player);
    }
}

// Draw snake head with direction indicator
function drawSnakeHead(x, y, direction, color) {
    // Draw the main segment
    drawSnakeSegment(x, y, color);
    
    // Add an eye to show direction
    const eyeSize = gridSize * 0.2;
    ctx.fillStyle = '#FFFFFF'; // Beyaz gözler
    
    // Position the eye based on direction
    let eyeX, eyeY;
    switch (direction) {
        case 'up':
            eyeX = x + gridSize * 0.3;
            eyeY = y + gridSize * 0.3;
            ctx.fillRect(eyeX, eyeY, eyeSize, eyeSize);
            eyeX = x + gridSize * 0.6;
            ctx.fillRect(eyeX, eyeY, eyeSize, eyeSize);
            break;
        case 'down':
            eyeX = x + gridSize * 0.3;
            eyeY = y + gridSize * 0.6;
            ctx.fillRect(eyeX, eyeY, eyeSize, eyeSize);
            eyeX = x + gridSize * 0.6;
            ctx.fillRect(eyeX, eyeY, eyeSize, eyeSize);
            break;
        case 'left':
            eyeX = x + gridSize * 0.3;
            eyeY = y + gridSize * 0.3;
            ctx.fillRect(eyeX, eyeY, eyeSize, eyeSize);
            eyeY = y + gridSize * 0.6;
            ctx.fillRect(eyeX, eyeY, eyeSize, eyeSize);
            break;
        case 'right':
            eyeX = x + gridSize * 0.6;
            eyeY = y + gridSize * 0.3;
            ctx.fillRect(eyeX, eyeY, eyeSize, eyeSize);
            eyeY = y + gridSize * 0.6;
            ctx.fillRect(eyeX, eyeY, eyeSize, eyeSize);
            break;
    }
    
    // Göz bebeğini ekle (siyah)
    ctx.fillStyle = '#000000';
    const pupilSize = eyeSize * 0.5;
    const pupilOffset = (eyeSize - pupilSize) / 2;
    
    switch (direction) {
        case 'up':
            eyeX = x + gridSize * 0.3;
            eyeY = y + gridSize * 0.3;
            ctx.fillRect(eyeX + pupilOffset, eyeY + pupilOffset, pupilSize, pupilSize);
            eyeX = x + gridSize * 0.6;
            ctx.fillRect(eyeX + pupilOffset, eyeY + pupilOffset, pupilSize, pupilSize);
            break;
        case 'down':
            eyeX = x + gridSize * 0.3;
            eyeY = y + gridSize * 0.6;
            ctx.fillRect(eyeX + pupilOffset, eyeY + pupilOffset, pupilSize, pupilSize);
            eyeX = x + gridSize * 0.6;
            ctx.fillRect(eyeX + pupilOffset, eyeY + pupilOffset, pupilSize, pupilSize);
            break;
        case 'left':
            eyeX = x + gridSize * 0.3;
            eyeY = y + gridSize * 0.3;
            ctx.fillRect(eyeX + pupilOffset, eyeY + pupilOffset, pupilSize, pupilSize);
            eyeY = y + gridSize * 0.6;
            ctx.fillRect(eyeX + pupilOffset, eyeY + pupilOffset, pupilSize, pupilSize);
            break;
        case 'right':
            eyeX = x + gridSize * 0.6;
            eyeY = y + gridSize * 0.3;
            ctx.fillRect(eyeX + pupilOffset, eyeY + pupilOffset, pupilSize, pupilSize);
            eyeY = y + gridSize * 0.6;
            ctx.fillRect(eyeX + pupilOffset, eyeY + pupilOffset, pupilSize, pupilSize);
            break;
    }
}

// Draw snake body segment
function drawSnakeSegment(x, y, color) {
    // Koordinatları grid'e hizala
    x = Math.round(x / gridSize) * gridSize;
    y = Math.round(y / gridSize) * gridSize;
    
    const segmentSize = gridSize * 0.9;
    const offset = Math.floor((gridSize - segmentSize) / 2);
    
    // Orijinal snake rengi kullanılır (siyah değil, her oyuncunun kendi rengi)
    ctx.fillStyle = color || '#800080'; // Varsayılan olarak mor
    ctx.fillRect(x + offset, y + offset, segmentSize, segmentSize);
}

// Draw player name above snake
function drawPlayerName(player) {
    if (!player.snake || player.snake.length === 0) return;
    
    const head = player.snake[0];
    
    // Set text properties
    ctx.font = '12px Arial';
    ctx.fillStyle = player.color;
    ctx.textAlign = 'center';
    
    // Draw name
    ctx.fillText(player.name, head.x + gridSize/2, head.y - 5);
    
    // Draw score under the name
    ctx.font = '10px Arial';
    ctx.fillText(player.score.toString(), head.x + gridSize/2, head.y - 20);
}
