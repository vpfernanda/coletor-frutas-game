class Game {
    constructor() {
        this.score = 0;
        this.level = 1;
        this.lives = 3;
        this.maxLives = 3;
        this.lastExtraLifeTime = 0;
        this.extraLifeCooldown = 5000; // 5 segundos de cooldown entre vidas extras
        this.basket = document.getElementById('basket');
        this.gameArea = document.getElementById('game-area');
        this.scoreElement = document.getElementById('score');
        this.levelElement = document.getElementById('level');
        this.hearts = document.querySelectorAll('.heart');
        this.gameOverScreen = document.getElementById('game-over');
        this.finalScoreElement = document.getElementById('final-score');
        this.restartButton = document.getElementById('restart-button');
        this.fruits = [];
        this.fruitsData = [
            { emoji: '🍎', points: 10, weight: 20 },
            { emoji: '🍌', points: 15, weight: 20 },
            { emoji: '🍇', points: 20, weight: 15 },
            { emoji: '🍊', points: 25, weight: 15 },
            { emoji: '⭐', points: 50, weight: 5, isSpecial: true },
            { emoji: '💣', points: 0, weight: 8, isBomb: true }  // Reduzido peso da bomba de 15 para 8
        ];
        
        this.levelConfig = {
            // Níveis 1-5: FÁCIL (1.5 - 2.3)
            1: { speed: 1.5, interval: 16, pointsToNext: 100 },    // Base fácil
            2: { speed: 1.7, interval: 16, pointsToNext: 200 },    // +0.2
            3: { speed: 1.9, interval: 16, pointsToNext: 300 },    // +0.2
            4: { speed: 2.1, interval: 16, pointsToNext: 400 },    // +0.2
            5: { speed: 2.3, interval: 16, pointsToNext: 500 },    // +0.2

            // Níveis 6-10: MENOS FÁCIL (2.7 - 3.5)
            6: { speed: 2.7, interval: 16, pointsToNext: 700 },    // +0.4
            7: { speed: 2.9, interval: 16, pointsToNext: 900 },    // +0.2
            8: { speed: 3.1, interval: 16, pointsToNext: 1100 },   // +0.2
            9: { speed: 3.3, interval: 16, pointsToNext: 1300 },   // +0.2
            10: { speed: 3.5, interval: 16, pointsToNext: 1500 },  // +0.2

            // Níveis 11-15: MÉDIO (4.0 - 4.8)
            11: { speed: 4.0, interval: 16, pointsToNext: 2000 },  // +0.5
            12: { speed: 4.2, interval: 16, pointsToNext: 2500 },  // +0.2
            13: { speed: 4.4, interval: 16, pointsToNext: 3000 },  // +0.2
            14: { speed: 4.6, interval: 16, pointsToNext: 3500 },  // +0.2
            15: { speed: 4.8, interval: 16, pointsToNext: 4000 },  // +0.2

            // Níveis 16-20: DIFÍCIL (5.4 - 6.2)
            16: { speed: 5.4, interval: 16, pointsToNext: 5000 },  // +0.6
            17: { speed: 5.6, interval: 16, pointsToNext: 6000 },  // +0.2
            18: { speed: 5.8, interval: 16, pointsToNext: 7000 },  // +0.2
            19: { speed: 6.0, interval: 16, pointsToNext: 8000 },  // +0.2
            20: { speed: 6.2, interval: 16, pointsToNext: Infinity } // +0.2
        };
        
        this.gameInterval = null;
        this.isPaused = false;
        this.gameOver = false;
        this.pauseScreen = null;
        this.init();
    }

    init() {
        this.addBasketControls();
        this.addRestartHandler();
        this.setupPauseHandler();
        this.startGame();
        this.updateUI();
    }

    addRestartHandler() {
        this.restartButton.addEventListener('click', () => {
            this.resetGame();
        });
    }

    updateUI() {
        requestAnimationFrame(() => {
            this.scoreElement.textContent = this.score;
            this.levelElement.textContent = this.level;
            this.updateHearts();
        });
    }

    updateHearts() {
        this.hearts.forEach((heart, index) => {
            if (index < this.lives) {
                heart.classList.remove('empty');
            } else {
                heart.classList.add('empty');
            }
        });
    }

    addBasketControls() {
        document.addEventListener('mousemove', (e) => {
            const gameRect = this.gameArea.getBoundingClientRect();
            const basketWidth = this.basket.offsetWidth;
            let newX = e.clientX - gameRect.left - basketWidth / 2;
            newX = Math.max(0, Math.min(newX, gameRect.width - basketWidth));
            this.basket.style.left = `${newX}px`;
        });
    }

    createFruit() {
        // Ajusta a frequência de criação baseada no nível
        const spawnRate = 0.02 + (this.level * 0.002);
        if (Math.random() > spawnRate) return;

        // Chance de criar vida extra se o jogador tiver menos que o máximo de vidas
        if (this.lives < this.maxLives && 
            Date.now() - this.lastExtraLifeTime > this.extraLifeCooldown && 
            Math.random() < 0.08) { // 8% de chance quando elegível
            this.createExtraLife();
            return;
        }

        // Sistema de peso para seleção de frutas
        const totalWeight = this.fruitsData.reduce((sum, fruit) => sum + fruit.weight, 0);
        let random = Math.random() * totalWeight;
        let selectedFruit = null;

        for (const fruit of this.fruitsData) {
            random -= fruit.weight;
            if (random <= 0) {
                selectedFruit = fruit;
                break;
            }
        }

        if (!selectedFruit) return;

        const fruit = document.createElement('div');
        fruit.className = 'fruit';
        if (selectedFruit.isBomb) {
            fruit.classList.add('bomb');
        } else if (selectedFruit.isSpecial) {
            fruit.classList.add('special-item');
        }
        
        fruit.innerHTML = selectedFruit.emoji;
        fruit.style.left = `${Math.random() * (this.gameArea.offsetWidth - 40)}px`;
        fruit.style.top = '-40px';
        fruit.points = selectedFruit.points;
        fruit.isBomb = selectedFruit.isBomb;
        fruit.isSpecial = selectedFruit.isSpecial;
        
        this.gameArea.appendChild(fruit);
        this.fruits.push({
            element: fruit,
            speed: this.levelConfig[this.level].speed * (0.9 + Math.random() * 0.2)
        });
    }

    createExtraLife() {
        const heart = document.createElement('div');
        heart.className = 'fruit extra-life';
        heart.innerHTML = '❤️';
        heart.style.left = `${Math.random() * (this.gameArea.offsetWidth - 40)}px`;
        heart.style.top = '-40px';
        heart.isExtraLife = true;
        
        this.gameArea.appendChild(heart);
        this.fruits.push({
            element: heart,
            speed: this.levelConfig[this.level].speed * (0.9 + Math.random() * 0.2)
        });
        this.lastExtraLifeTime = Date.now();
    }

    moveFruits() {
        for (let i = this.fruits.length - 1; i >= 0; i--) {
            const fruit = this.fruits[i];
            const currentTop = parseFloat(fruit.element.style.top) || 0;
            fruit.element.style.top = `${currentTop + fruit.speed}px`;

            if (this.checkCollision(fruit.element)) {
                this.handleCollision(fruit);
                this.gameArea.removeChild(fruit.element);
                this.fruits.splice(i, 1);
            }
            // Se a fruta sair da área do jogo
            else if (currentTop > this.gameArea.offsetHeight) {
                this.gameArea.removeChild(fruit.element);
                this.fruits.splice(i, 1);
            }
        }
    }

    checkCollision(fruit) {
        const basketRect = this.basket.getBoundingClientRect();
        const fruitRect = fruit.getBoundingClientRect();

        return !(basketRect.right < fruitRect.left || 
                basketRect.left > fruitRect.right || 
                basketRect.bottom < fruitRect.top || 
                basketRect.top > fruitRect.bottom);
    }

    handleCollision(fruit) {
        if (fruit.element.isExtraLife) {
            if (this.lives < this.maxLives) {
                this.lives++;
                this.updateUI();
            }
            return true;
        }

        if (fruit.element.isBomb) {
            this.lives--;
            this.updateUI();
            return true;
        }

        this.score += fruit.element.points || 0;  // Garante que points seja um número
        this.updateUI();
        this.checkLevelUp();
        return true;
    }

    checkLevelUp() {
        const config = this.levelConfig[this.level];
        if (this.score >= config.pointsToNext && this.level < 20) {
            this.level++;
            this.restartGameInterval();
        }
    }

    restartGameInterval() {
        clearInterval(this.gameInterval);
        this.startGame();
    }

    gameOver() {
        clearInterval(this.gameInterval);
        this.gameOverScreen.classList.remove('hidden');
        this.finalScoreElement.textContent = this.score;
    }

    resetGame() {
        this.score = 0;
        this.level = 1;
        this.lives = 3;
        this.fruits.forEach(fruit => this.gameArea.removeChild(fruit.element));
        this.fruits = [];
        this.gameOverScreen.classList.add('hidden');
        this.updateUI();
        this.startGame();
    }

    startGame() {
        this.gameLoop();
    }

    gameLoop() {
        if (!this.isPaused && !this.gameOver) {
            this.createFruit();
            this.moveFruits();
        }
        requestAnimationFrame(() => this.gameLoop());
    }

    setupPauseHandler() {
        this.gameArea.addEventListener('click', () => {
            this.togglePause();
        });
    }

    togglePause() {
        this.isPaused = !this.isPaused;
        if (this.isPaused) {
            this.showPauseScreen();
        } else {
            this.hidePauseScreen();
        }
    }

    showPauseScreen() {
        if (!this.pauseScreen) {
            this.pauseScreen = document.createElement('div');
            this.pauseScreen.style.position = 'absolute';
            this.pauseScreen.style.top = '50%';
            this.pauseScreen.style.left = '50%';
            this.pauseScreen.style.transform = 'translate(-50%, -50%)';
            this.pauseScreen.style.fontSize = '24px';
            this.pauseScreen.style.color = 'white';
            this.pauseScreen.style.textShadow = '2px 2px 4px rgba(0,0,0,0.5)';
            this.pauseScreen.style.zIndex = '1000';
            this.pauseScreen.textContent = 'PAUSADO';
            this.gameArea.appendChild(this.pauseScreen);
        }
        this.pauseScreen.style.display = 'block';
    }

    hidePauseScreen() {
        if (this.pauseScreen) {
            this.pauseScreen.style.display = 'none';
        }
    }
}

window.onload = () => {
    new Game();
};
