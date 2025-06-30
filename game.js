// Configurações do jogo
const config = {
    width: 800,
    height: 600,
    gravity: 0.5,
    playerSpeed: 5,
    jumpForce: 12,
    barrelSpeed: 3,
    ladderSpeed: 3
};

// Elementos do DOM
const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');
const startScreen = document.getElementById('start-screen');
const startButton = document.getElementById('start-button');
const gameOverScreen = document.getElementById('game-over-screen');
const restartButton = document.getElementById('restart-button');
const scoreElement = document.getElementById('score');
const livesElement = document.getElementById('lives');
const levelElement = document.getElementById('level');
const finalScoreElement = document.getElementById('final-score');

// Estado do jogo
let gameState = {
    score: 0,
    lives: 3,
    level: 1,
    gameRunning: false,
    platforms: [],
    ladders: [],
    barrels: [],
    fires: [],
    player: null,
    donkeyKong: null,
    pauline: null,
    keys: {
        left: false,
        right: false,
        up: false,
        down: false
    },
    lastTime: 0,
    animationFrameId: null,
    barrelSpawnInterval: null,
    difficultyIncreaseInterval: null
};

// Classes do jogo
class GameObject {
    constructor(x, y, width, height, color) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.color = color;
        this.velocityX = 0;
        this.velocityY = 0;
    }
    
    draw() {
        ctx.fillStyle = this.color;
        ctx.fillRect(this.x, this.y, this.width, this.height);
    }
    
    update() {
        this.x += this.velocityX;
        this.y += this.velocityY;
    }
    
    collidesWith(other) {
        return (
            this.x < other.x + other.width &&
            this.x + this.width > other.x &&
            this.y < other.y + other.height &&
            this.y + this.height > other.y
        );
    }
}

class Player extends GameObject {
    constructor(x, y) {
        super(x, y, 30, 40, '#3498db');
        this.isJumping = false;
        this.onLadder = false;
        this.climbing = false;
        this.facingRight = true;
        this.animationFrame = 0;
        this.spriteFrames = [
            {x: 0, y: 0, width: 32, height: 48},
            {x: 32, y: 0, width: 32, height: 48},
            {x: 64, y: 0, width: 32, height: 48}
        ];
        this.spriteImage = new Image();
        this.spriteImage.src = 'https://www.flaticon.com/free-icon/mammal_13285818';
    }
    
    draw() {
        if (this.spriteImage.complete) {
            const frame = this.spriteFrames[Math.floor(this.animationFrame) % this.spriteFrames.length];
            
            ctx.save();
            if (!this.facingRight) {
                ctx.translate(this.x + this.width, 0);
                ctx.scale(-1, 1);
                ctx.drawImage(this.spriteImage, frame.x, frame.y, frame.width, frame.height, 0, this.y, frame.width, frame.height);
            } else {
                ctx.drawImage(this.spriteImage, frame.x, frame.y, frame.width, frame.height, this.x, this.y, frame.width, frame.height);
            }
            ctx.restore();
            
            if (this.velocityX !== 0 && !this.isJumping) {
                this.animationFrame += 0.2;
            }
        } else {
            ctx.fillStyle = this.color;
            ctx.fillRect(this.x, this.y, this.width, this.height);
        }
    }
    
    jump() {
        if (!this.isJumping && !this.climbing) {
            this.velocityY = -config.jumpForce;
            this.isJumping = true;
        }
    }
    
    checkPlatformCollision(platforms) {
        if (this.velocityY > 0) {
            for (const platform of platforms) {
                if (
                    this.x + this.width > platform.x &&
                    this.x < platform.x + platform.width &&
                    this.y + this.height <= platform.y &&
                    this.y + this.height + this.velocityY >= platform.y
                ) {
                    this.y = platform.y - this.height;
                    this.velocityY = 0;
                    this.isJumping = false;
                    return true;
                }
            }
        }
        return false;
    }
    
    checkLadderCollision(ladders) {
        for (const ladder of ladders) {
            if (
                this.x + this.width > ladder.x &&
                this.x < ladder.x + ladder.width &&
                this.y + this.height > ladder.y &&
                this.y < ladder.y + ladder.height
            ) {
                this.onLadder = true;
                return true;
            }
        }
        this.onLadder = false;
        return false;
    }
}

class Barrel extends GameObject {
    constructor(x, y) {
        super(x, y, 24, 24, '#8b4513');
        this.velocityX = config.barrelSpeed;
        this.velocityY = 0;
        this.rollingRight = true;
        this.falling = false;
        this.spriteImage = new Image();
        this.spriteImage.src = 'https://www.flaticon.com/free-icon/asteroid_7480279';
        this.rotation = 0;
    }
    
    draw() {
        if (this.spriteImage.complete) {
            ctx.save();
            ctx.translate(this.x + this.width/2, this.y + this.height/2);
            ctx.rotate(this.rotation);
            ctx.drawImage(this.spriteImage, -this.width/2, -this.height/2, this.width, this.height);
            ctx.restore();
        } else {
            ctx.fillStyle = this.color;
            ctx.beginPath();
            ctx.arc(this.x + this.width/2, this.y + this.height/2, this.width/2, 0, Math.PI * 2);
            ctx.fill();
        }
        
        if (this.velocityX !== 0) {
            this.rotation += this.velocityX * 0.1;
        }
    }
    
    update(platforms) {
        super.update();
        
        if (!this.falling) {
            let onPlatform = false;
            
            for (const platform of platforms) {
                if (
                    this.x + this.width > platform.x &&
                    this.x < platform.x + platform.width &&
                    this.y + this.height <= platform.y &&
                    this.y + this.height + this.velocityY >= platform.y
                ) {
                    this.y = platform.y - this.height;
                    this.velocityY = 0;
                    onPlatform = true;
                    
                    if (this.rollingRight && this.x + this.width >= platform.x + platform.width) {
                        this.x = platform.x + platform.width - this.width;
                        this.velocityX = -config.barrelSpeed;
                        this.rollingRight = false;
                    } else if (!this.rollingRight && this.x <= platform.x) {
                        this.x = platform.x;
                        this.velocityX = config.barrelSpeed;
                        this.rollingRight = true;
                    }
                    
                    if (Math.random() < 0.02) {
                        this.falling = true;
                        this.velocityY = 2;
                    }
                    
                    break;
                }
            }
            
            if (!onPlatform) {
                this.falling = true;
                this.velocityY = 2;
            }
        } else {
            let hitPlatform = false;
            
            for (const platform of platforms) {
                if (
                    this.x + this.width > platform.x &&
                    this.x < platform.x + platform.width &&
                    this.y + this.height <= platform.y &&
                    this.y + this.height + this.velocityY >= platform.y
                ) {
                    this.y = platform.y - this.height;
                    this.velocityY = 0;
                    this.falling = false;
                    hitPlatform = true;
                    break;
                }
            }
            
            if (!hitPlatform) {
                this.velocityY += config.gravity * 0.5;
            }
        }
        
        return this.y > config.height;
    }
}

class Fire extends GameObject {
    constructor(x, y) {
        super(x, y, 30, 30, '#ff5722');
        this.animationFrame = 0;
        this.frames = [
            '#ff5722', '#ff9800', '#ffc107', '#ffeb3b'
        ];
    }
    
    draw() {
        this.animationFrame = (this.animationFrame + 0.1) % this.frames.length;
        ctx.fillStyle = this.frames[Math.floor(this.animationFrame)];
        
        ctx.beginPath();
        ctx.moveTo(this.x + this.width/2, this.y);
        ctx.lineTo(this.x + this.width, this.y + this.height/2);
        ctx.lineTo(this.x + this.width/2, this.y + this.height);
        ctx.lineTo(this.x, this.y + this.height/2);
        ctx.closePath();
        ctx.fill();
        
        const glow = ctx.createRadialGradient(
            this.x + this.width/2, this.y + this.height/2, 5,
            this.x + this.width/2, this.y + this.height/2, 20
        );
        glow.addColorStop(0, 'rgba(255, 87, 34, 0.8)');
        glow.addColorStop(1, 'rgba(255, 87, 34, 0)');
        
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(this.x + this.width/2, this.y + this.height/2, 20, 0, Math.PI * 2);
        ctx.fill();
    }
}

// Inicialização do jogo
function initGame() {
    gameState.platforms = [
        new GameObject(0, 550, 800, 20, '#795548'),
        new GameObject(100, 450, 600, 20, '#795548'),
        new GameObject(0, 350, 500, 20, '#795548'),
        new GameObject(300, 250, 500, 20, '#795548'),
        new GameObject(0, 150, 400, 20, '#795548'),
        new GameObject(500, 150, 300, 20, '#795548')
    ];
    
    gameState.ladders = [
        new GameObject(700, 450, 40, 100, '#8d6e63'),
        new GameObject(400, 350, 40, 100, '#8d6e63'),
        new GameObject(200, 250, 40, 100, '#8d6e63'),
        new GameObject(450, 150, 40, 100, '#8d6e63')
    ];
    
    gameState.player = new Player(50, 510);
    
    gameState.donkeyKong = {
        x: 600,
        y: 80,
        width: 80,
        height: 80,
        armRaised: false,
        animationFrame: 0,
        draw: function() {
            ctx.fillStyle = '#795548';
            ctx.beginPath();
            ctx.ellipse(this.x + this.width/2, this.y + this.height/2, this.width/2, this.height/2.5, 0, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.fillStyle = '#5d4037';
            ctx.beginPath();
            ctx.ellipse(this.x + this.width/2, this.y + this.height/4, this.width/3, this.width/3.5, 0, 0, Math.PI * 2);
            ctx.fill();
            
            this.animationFrame += 0.02;
            const armAngle = Math.sin(this.animationFrame) * 0.5;
            
            ctx.save();
            ctx.translate(this.x + this.width/3, this.y + this.height/2.5);
            ctx.rotate(armAngle);
            ctx.fillStyle = '#5d4037';
            ctx.fillRect(0, 0, this.width/3, this.width/6);
            ctx.restore();
            
            ctx.save();
            ctx.translate(this.x + this.width/1.5, this.y + this.height/2.5);
            ctx.rotate(-armAngle - 0.5);
            ctx.fillStyle = '#5d4037';
            ctx.fillRect(0, 0, this.width/3, this.width/6);
            ctx.restore();
            
            if (Math.sin(this.animationFrame) < -0.8) {
                const barrel = new GameObject(
                    this.x + this.width/1.5 + Math.cos(-armAngle - 0.5) * this.width/3,
                    this.y + this.height/2.5 + Math.sin(-armAngle - 0.5) * this.width/3,
                    20,
                    20,
                    '#8b4513'
                );
                barrel.draw();
            }
        }
    };
    
    gameState.pauline = {
        x: 650,
        y: 100,
        width: 30,
        height: 50,
        distressFrame: 0,
        draw: function() {
            ctx.fillStyle = '#e91e63';
            ctx.beginPath();
            ctx.ellipse(this.x + this.width/2, this.y + this.height/1.5, this.width/2, this.height/3, 0, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.fillStyle = '#ffeb3b';
            ctx.beginPath();
            ctx.arc(this.x + this.width/2, this.y + this.height/4, this.width/3, 0, Math.PI * 2);
            ctx.fill();
            
            this.distressFrame += 0.05;
            if (Math.sin(this.distressFrame) > 0.8) {
                ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
                ctx.beginPath();
                ctx.ellipse(this.x + this.width/2, this.y - 10, 10, 20, 0, 0, Math.PI * 2);
                ctx.fill();
                ctx.fillText('HELP!', this.x + this.width/2 - 15, this.y - 30);
            }
        }
    };
    
    gameState.fires = [
        new Fire(150, 525),
        new Fire(300, 425),
        new Fire(450, 325),
        new Fire(200, 225)
    ];
    
    updateUI();
}

// Funções do jogo
function startGame() {
    initGame();
    startScreen.style.display = 'none';
    gameOverScreen.style.display = 'none';
    gameState.gameRunning = true;
    
    gameState.barrelSpawnInterval = setInterval(spawnBarrel, 2000 - (gameState.level * 150));
    gameState.difficultyIncreaseInterval = setInterval(increaseDifficulty, 15000);
    
    gameState.lastTime = performance.now();
    gameLoop(gameState.lastTime);
}

function gameLoop(timestamp) {
    if (!gameState.gameRunning) return;
    
    const deltaTime = timestamp - gameState.lastTime;
    gameState.lastTime = timestamp;
    
    update(deltaTime);
    render();
    
    gameState.animationFrameId = requestAnimationFrame(gameLoop);
}

function update(deltaTime) {
    // Atualizar jogador
    const player = gameState.player;
    
    if (gameState.keys.left) {
        player.velocityX = -config.playerSpeed;
        player.facingRight = false;
    } else if (gameState.keys.right) {
        player.velocityX = config.playerSpeed;
        player.facingRight = true;
    } else {
        player.velocityX = 0;
    }
    
    if (player.onLadder && gameState.keys.up) {
        player.climbing = true;
        player.velocityY = -config.ladderSpeed;
    } else if (player.onLadder && gameState.keys.down) {
        player.climbing = true;
        player.velocityY = config.ladderSpeed;
    } else if (player.climbing) {
        player.velocityY = 0;
        player.climbing = false;
    }
    
    if (!player.onLadder && !player.climbing) {
        player.velocityY += config.gravity;
    }
    
    player.checkPlatformCollision(gameState.platforms);
    player.checkLadderCollision(gameState.ladders);
    player.update();
    
    // Verificar se o jogador alcançou a Pauline
    if (player.collidesWith(gameState.pauline)) {
        gameState.score += 1000 * gameState.level;
        gameState.level++;
        updateUI();
        resetLevel();
    }
    
    // Atualizar barris
    gameState.barrels = gameState.barrels.filter(barrel => {
        barrel.update(gameState.platforms);
        
        // Verificar colisão com o jogador
        if (barrel.collidesWith(player)) {
            loseLife();
            return false;
        }
        
        // Verificar colisão com fogo
        for (const fire of gameState.fires) {
            if (barrel.collidesWith(fire)) {
                gameState.score += 100;
                updateUI();
                return false;
            }
        }
        
        return !(barrel.y > config.height);
    });
    
    // Manter o jogador dentro da tela
    if (player.x < 0) player.x = 0;
    if (player.x + player.width > config.width) player.x = config.width - player.width;
    if (player.y < 0) player.y = 0;
    if (player.y + player.height > config.height) loseLife();
}

function render() {
    // Limpar tela
    ctx.clearRect(0, 0, config.width, config.height);
    
    // Desenhar plataformas
    gameState.platforms.forEach(platform => platform.draw());
    
    // Desenhar escadas
    gameState.ladders.forEach(ladder => ladder.draw());
    
    // Desenhar fogo
    gameState.fires.forEach(fire => fire.draw());
    
    // Desenhar barris
    gameState.barrels.forEach(barrel => barrel.draw());
    
    // Desenhar Donkey Kong
    gameState.donkeyKong.draw();
    
    // Desenhar Pauline
    gameState.pauline.draw();
    
    // Desenhar jogador
    gameState.player.draw();
}

function spawnBarrel() {
    if (!gameState.gameRunning) return;
    
    const barrel = new Barrel(
        gameState.donkeyKong.x + gameState.donkeyKong.width/2 - 12,
        gameState.donkeyKong.y + gameState.donkeyKong.height/2
    );
    gameState.barrels.push(barrel);
}

function increaseDifficulty() {
    if (gameState.level < 5) {
        gameState.level++;
        updateUI();
        clearInterval(gameState.barrelSpawnInterval);
        gameState.barrelSpawnInterval = setInterval(spawnBarrel, 2000 - (gameState.level * 150));
    }
}

function resetLevel() {
    gameState.player.x = 50;
    gameState.player.y = 510;
    gameState.barrels = [];
    clearInterval(gameState.barrelSpawnInterval);
    gameState.barrelSpawnInterval = setInterval(spawnBarrel, 2000 - (gameState.level * 150));
}

function loseLife() {
    gameState.lives--;
    updateUI();
    
    if (gameState.lives <= 0) {
        gameOver();
    } else {
        resetLevel();
    }
}

function gameOver() {
    gameState.gameRunning = false;
    cancelAnimationFrame(gameState.animationFrameId);
    clearInterval(gameState.barrelSpawnInterval);
    clearInterval(gameState.difficultyIncreaseInterval);
    
    finalScoreElement.textContent = `Sua pontuação: ${gameState.score}`;
    gameOverScreen.style.display = 'flex';
}

function updateUI() {
    scoreElement.textContent = `Score: ${gameState.score}`;
    livesElement.textContent = `Lives: ${gameState.lives}`;
    levelElement.textContent = `Level: ${gameState.level}`;
}

// Event listeners
startButton.addEventListener('click', startGame);
restartButton.addEventListener('click', startGame);

window.addEventListener('keydown', (e) => {
    if (!gameState.gameRunning) return;
    
    switch (e.key) {
        case 'ArrowLeft':
            gameState.keys.left = true;
            break;
        case 'ArrowRight':
            gameState.keys.right = true;
            break;
        case 'ArrowUp':
            gameState.keys.up = true;
            if (!gameState.player.onLadder) {
                gameState.player.jump();
            }
            break;
        case 'ArrowDown':
            gameState.keys.down = true;
            break;
        case ' ':
            gameState.player.jump();
            break;
    }
});

window.addEventListener('keyup', (e) => {
    switch (e.key) {
        case 'ArrowLeft':
            gameState.keys.left = false;
            break;
        case 'ArrowRight':
            gameState.keys.right = false;
            break;
        case 'ArrowUp':
            gameState.keys.up = false;
            break;
        case 'ArrowDown':
            gameState.keys.down = false;
            break;
    }
});