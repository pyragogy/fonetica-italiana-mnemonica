'use strict';

// Matrix Data
const MATRIX = {
    '0': { letter: 'Z', examples: 'Zia, Zoo', logic: 'Sibilante', tip: 'Zero inizia con Z', color: '#4299E1' },
    '1': { letter: 'N', examples: 'Noè, Neo', logic: 'Nasale dentale', tip: 'Uno contiene N', color: '#48BB78' },
    '2': { letter: 'D', examples: 'Due, Duna', logic: 'Occlusiva dentale', tip: 'Due inizia con D', color: '#ED64A6' },
    '3': { letter: 'T', examples: 'Tre, Tè', logic: 'Occlusiva alveolare', tip: 'Tre inizia con T', color: '#ECC94B' },
    '4': { letter: 'R', examples: 'Re, Ramo,', logic: 'Vibrante', tip: 'Quattro finisce con R', color: '#9F7AEA' },
    '5': { letter: 'C/G', examples: 'Cielo, Gelo', logic: 'Palatale (dolce)', tip: 'Suono dolce e fluido', color: '#FC8181' },
    '6': { letter: 'S/SC', examples: 'Sole, Sala', logic: 'Sibilante dolce', tip: 'Suono che serpeggia', color: '#38B2AC' },
    '7': { letter: 'K/Q', examples: 'Cane, Culla', logic: 'Velare (dura)', tip: 'Suono di forza', color: '#48BB78' },
    '8': { letter: 'B/V', examples: 'Via, Bue', logic: 'Labiodentale', tip: 'B assomiglia a 8', color: '#ED64A6' },
    '9': { letter: 'P/F', examples: 'Palla, Fumo', logic: 'Labiale', tip: 'P rovesciata ricorda 9', color: '#ECC94B' },
};

const REVERSE_MATRIX = {
    'Z': '0', 'N': '1', 'D': '2', 'T': '3', 'R': '4',
    'S': '6', 'K': '7', 'Q': '7',
    'B': '8', 'V': '8', 'P': '9', 'F': '9'
};

// Game State
const gameState = {
    score: 0,
    streak: 0,
    level: 1,
    xp: 0,
    trainerMode: 'encode',
    stats: {
        totalAttempts: 0,
        correctAnswers: 0,
        bestStreak: 0
    },
    achievements: [
        { id: 1, name: 'Prima Conversione', desc: 'Converti il tuo primo numero', unlocked: false, icon: '🎯' },
        { id: 2, name: 'Streak Master', desc: '5 risposte corrette di fila', unlocked: false, icon: '🔥' },
        { id: 3, name: 'Centurione', desc: 'Raggiungi 100 punti', unlocked: false, icon: '💯' },
        { id: 4, name: 'Matrix Master', desc: 'Converti 20 numeri', unlocked: false, icon: '🧠' }
    ],
    quizTimer: null,
    quizTimeLeft: 30,
    currentQuiz: null
};

// Persist State
function saveGameState() {
    localStorage.setItem('ecoSystemGameState', JSON.stringify(gameState));
}

function loadGameState() {
    const savedState = localStorage.getItem('ecoSystemGameState');
    if (savedState) {
        Object.assign(gameState, JSON.parse(savedState));
    }
}

function resetGameState() {
    const confirmation = confirm("Sei sicuro di voler resettare tutti i tuoi progressi? Questa azione è irreversibile.");
    if (confirmation) {
        localStorage.removeItem('ecoSystemGameState');
        // Ricarica la pagina per applicare lo stato iniziale
        window.location.reload();
    }
}

const initialGameState = {
    score: 0,
    streak: 0,
    level: 1,
    xp: 0,
    trainerMode: 'encode',
    stats: { totalAttempts: 0, correctAnswers: 0, bestStreak: 0 },
    achievements: gameState.achievements.map(a => ({ ...a, unlocked: false }))
};

// Background Canvas
function initCanvas() {
    const canvas = document.getElementById('bgCanvas');
    const ctx = canvas.getContext('2d');
    const style = getComputedStyle(document.body);
    let animationFrameId;

    let points = [];
    const mouse = {
        x: null,
        y: null,
        radius: 150
    };

    window.addEventListener('mousemove', event => {
        mouse.x = event.x;
        mouse.y = event.y;
    });
    window.addEventListener('mouseout', () => {
        mouse.x = null;
        mouse.y = null;
    });

    function resizeCanvas() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        createPoints();
    }

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    function createPoints() {
        points = [];
        const pointCount = (canvas.width * canvas.height) / 9000; // Adatta il numero di punti alla dimensione dello schermo
        for (let i = 0; i < pointCount; i++) {
            points.push({
                x: Math.random() * canvas.width, // Posizione iniziale
                y: Math.random() * canvas.height,
                originX: Math.random() * canvas.width, // Punto di "ancoraggio" per l'orbita
                originY: Math.random() * canvas.height,
                vx: (Math.random() - 0.5) * 0.07, // Velocità di spostamento dell'ancoraggio (ulteriormente rallentata)
                vy: (Math.random() - 0.5) * 0.07,
                baseRadius: Math.random() * 1.2 + 0.8, // Raggio di base
                radius: Math.random() * 1.2 + 0.8,
                angle: Math.random() * Math.PI * 2, // Angolo per il movimento oscillatorio
                speed: 0.002 + Math.random() * 0.008, // Velocità di oscillazione (ulteriormente rallentata)
                orbit: 50 + Math.random() * 50, // Ampiezza dell'oscillazione
                isFiring: false,
                fireProgress: 0
            });
        }
    }

    function animate() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        const accentColor = style.getPropertyValue('--accent-blue').trim();
        const connectionDistance = 220; // Aumentata la distanza per una rete ancora più fitta

        for (let i = 0; i < points.length; i++) {
            const point = points[i];

            // Effetto "attivazione neurale" (spot di luce)
            if (!point.isFiring && Math.random() < 0.0002) {
                point.isFiring = true;
                point.fireProgress = 0;
            }

            if (point.isFiring) {
                point.fireProgress++;
                if (point.fireProgress >= 120) point.isFiring = false;
            }

            // Movimento organico oscillatorio
            point.angle += point.speed;
            point.originX += point.vx;
            point.originY += point.vy;
            point.x = point.originX + Math.cos(point.angle) * point.orbit;
            point.y = point.originY + Math.sin(point.angle) * point.orbit;

            // Effetto "respiro" per i neuroni
            point.radius = point.baseRadius + Math.sin(point.angle) * 0.5;

            // Bordi (per i punti di ancoraggio)
            if (point.originX < 0 || point.originX > canvas.width) point.vx *= -1;
            if (point.originY < 0 || point.originY > canvas.height) point.vy *= -1;

            // Interazione con il mouse
            const dxMouse = mouse.x - point.x;
            const dyMouse = mouse.y - point.y;
            const distanceMouse = Math.sqrt(dxMouse * dxMouse + dyMouse * dyMouse);
            if (distanceMouse < mouse.radius) {
                // Il neurone si "illumina" e si espande vicino al mouse
                point.radius = point.baseRadius + (1 - distanceMouse / mouse.radius) * 3;
                
                // Disegna una linea di connessione al mouse
                ctx.beginPath();
                ctx.moveTo(point.x, point.y);
                ctx.lineTo(mouse.x, mouse.y);
                ctx.strokeStyle = `${accentColor}${Math.floor((1 - distanceMouse / mouse.radius) * 30).toString(16).padStart(2, '0')}`;
                ctx.lineWidth = 0.5;
                ctx.stroke();
            }

            // Disegna lo spot di luce se attivo
            if (point.isFiring) {
                const pulse = Math.sin((point.fireProgress / 120) * Math.PI); // 0 -> 1 -> 0
                ctx.save();
                ctx.fillStyle = '#FFFFFF';
                ctx.shadowColor = accentColor;
                ctx.shadowBlur = pulse * 25;
                ctx.globalAlpha = pulse * 0.8;
                ctx.beginPath();
                ctx.arc(point.x, point.y, point.radius + pulse * 4, 0, Math.PI * 2);
                ctx.fill();
                ctx.restore();
            }

            // Disegna punto
            // (Spostato dopo le linee per un migliore effetto visivo)

            // Disegna linee di connessione tra neuroni
            for (let j = i + 1; j < points.length; j++) {
                const otherPoint = points[j];
                const dx = point.x - otherPoint.x;
                const dy = point.y - otherPoint.y;
                const distance = Math.sqrt(dx * dx + dy * dy);

                if (distance < connectionDistance) {
                    ctx.beginPath();
                    ctx.moveTo(point.x, point.y);
                    ctx.lineTo(otherPoint.x, otherPoint.y);
                    ctx.strokeStyle = `${accentColor}${Math.floor((1 - distance / connectionDistance) * 50).toString(16).padStart(2, '0')}`;
                    ctx.lineWidth = (1 - distance / connectionDistance) * 1.2;
                    ctx.stroke();
                }
            }

            // Disegna il punto sopra le linee
            ctx.beginPath();
            ctx.arc(point.x, point.y, point.radius, 0, Math.PI * 2);
            ctx.fillStyle = `${accentColor}99`; // Leggera trasparenza
            ctx.fill();
        }

        animationFrameId = requestAnimationFrame(animate);
    }

    function handleVisibilityChange() {
        if (document.hidden) {
            cancelAnimationFrame(animationFrameId);
        } else {
            animate();
        }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange, false);

    animate();
}

// Particle Effects
function createParticles(x, y, color) {
    for (let i = 0; i < 15; i++) {
        setTimeout(() => {
            const particle = document.createElement('div');
            particle.className = 'particle';
            particle.style.left = (x + (Math.random() - 0.5) * 80) + 'px';
            particle.style.top = (y + (Math.random() - 0.5) * 80) + 'px';
            particle.style.backgroundColor = color || '#4299E1';
            document.body.appendChild(particle);
            setTimeout(() => particle.remove(), 1500);
        }, i * 30);
    }
}

function createConfetti() {
    const colors = ['#4299E1', '#48BB78', '#ED64A6', '#ECC94B', '#9F7AEA', '#38B2AC'];
    for (let i = 0; i < 50; i++) {
        setTimeout(() => {
            const confetti = document.createElement('div');
            confetti.className = 'confetti';
            confetti.style.left = Math.random() * window.innerWidth + 'px';
            confetti.style.top = '-20px';
            confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
            document.body.appendChild(confetti);
            setTimeout(() => confetti.remove(), 3000);
        }, i * 30);
    }
}

// Theme Toggle
function toggleTheme() {
    document.body.classList.toggle('light-mode');
    const isLight = document.body.classList.contains('light-mode');
    document.getElementById('themeIcon').textContent = isLight ? '☀️' : '🌙';
    document.getElementById('themeText').textContent = isLight ? 'Light' : 'Dark';
}

// Page Navigation
function showPage(pageName) {
    document.querySelectorAll('.page').forEach(page => {
        page.classList.remove('active');
    });
    document.getElementById(pageName + 'Page').classList.add('active');
    
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.getAttribute('data-page') === pageName) {
            // Chiudi il menu hamburger se è aperto su mobile
            document.getElementById('navLinks').classList.remove('show');
            document.getElementById('hamburgerBtn').classList.remove('active');
            btn.classList.add('active');
        }
    });
    
    if (pageName === 'matrix') {
        renderMatrix();
    }
}

// Matrix Render
function renderMatrix() {
    const grid = document.getElementById('matrixGrid');
    grid.innerHTML = '';
    
    Object.entries(MATRIX).forEach(([number, data]) => {
        const container = document.createElement('div');
        container.className = 'matrix-card-container';
        
        const front = document.createElement('div');
        front.className = 'matrix-card-front';
        front.style.borderColor = data.color;
        front.innerHTML = `
            <div class="number" style="color: ${data.color}">${number}</div>
            <div class="letter">${data.letter}</div>
            <div class="example">${data.examples}</div>
        `;
        
        const back = document.createElement('div');
        back.className = 'matrix-card-back';
        back.style.borderColor = data.color;
        back.innerHTML = `
            <div class="logic">${data.logic}</div>
            <div class="memory-tip">💡 ${data.tip}</div>
        `;
        
        container.appendChild(front);
        container.appendChild(back);
        
        container.addEventListener('click', () => {
            container.classList.toggle('flipped');
            createParticles(window.innerWidth / 2, window.innerHeight / 2, data.color);
        });
        
        grid.appendChild(container);
    });
}

// Update UI
function updateUI() {
    document.getElementById('scoreDisplay').textContent = gameState.score;
    document.getElementById('streakDisplay').textContent = gameState.streak;
    document.getElementById('levelDisplay').textContent = gameState.level;
    document.getElementById('xpDisplay').textContent = gameState.xp % 100;
    document.getElementById('xpFill').style.width = (gameState.xp % 100) + '%';
}

// Add XP
function addXP(amount) {
    const oldLevel = gameState.level;
    gameState.xp += amount;
    const newLevel = Math.floor(gameState.xp / 100) + 1;
    
    if (newLevel > oldLevel) {
        gameState.level = newLevel;
        createConfetti();
        showAchievementToast({ 
            name: 'Level Up! 🎉', 
            desc: `Livello ${newLevel} raggiunto!`,
            icon: '⭐' 
        });
    }
    
    updateUI();
    saveGameState();
}

// Unlock Achievement
function unlockAchievement(id) {
    const achievement = gameState.achievements.find(a => a.id === id);
    if (achievement && !achievement.unlocked) {
        achievement.unlocked = true;
        showAchievementToast(achievement);
        createParticles(window.innerWidth - 200, 200, '#48BB78');
        saveGameState();
    }
}

// Achievement Toast
function showAchievementToast(achievement) {
    const toast = document.getElementById('achievementToast');
    document.getElementById('toastIcon').textContent = achievement.icon;
    document.getElementById('toastTitle').textContent = achievement.name;
    document.getElementById('toastDesc').textContent = achievement.desc;
    
    toast.classList.add('show');
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

// Encode/Decode
function encode(number) {
    return number.split('').map(digit => MATRIX[digit]?.letter || '?').join('-');
}

function decode(word) {
    const w = word.toUpperCase();
    let result = '';
    for (let i = 0; i < w.length; i++) {
        const char = w[i];
        const next = w[i+1];

        if (char === 'C' || char === 'G') {
            if (next === 'E' || next === 'I') {
                result += '5'; // Soft sound
            } else {
                result += '7'; // Hard sound
            }
        } else if (REVERSE_MATRIX[char]) {
            result += REVERSE_MATRIX[char];
        }
        // Vowels and unmapped consonants are implicitly ignored
    }
    return result;
}
        function getHighlightedWord(word) {
            let highlightedHtml = '';
            for (let i = 0; i < word.length; i++) {
                const char = word[i].toUpperCase();
                let isMappable = false;
        
                if ('CG'.includes(char)) {
                    isMappable = true;
                } else if (REVERSE_MATRIX[char]) {
                    isMappable = true;
                }
        
                if (isMappable) {
                    highlightedHtml += `<span class="highlight">${word[i]}</span>`;
                } else {
                    highlightedHtml += word[i];
                }
            }
            return highlightedHtml;
        }

// Trainer Mode
function setMode(mode) {
    gameState.trainerMode = mode;
    const encodeBtn = document.getElementById('encodeBtn');
    const decodeBtn = document.getElementById('decodeBtn');
    const input = document.getElementById('trainerInput');
    
    if (mode === 'encode') {
        encodeBtn.classList.add('active');
        decodeBtn.classList.remove('active');
        input.placeholder = 'Inserisci un numero (es. 314)';
    } else {
        decodeBtn.classList.add('active');
        encodeBtn.classList.remove('active');
        input.placeholder = 'Inserisci una parola (es. Tino)';
    }
    
    document.getElementById('trainerResult').classList.remove('show');
}

function handleEncodeSubmit() {
    const input = document.getElementById('trainerInput').value.trim();
    const resultDiv = document.getElementById('trainerResult');

    if (!input) {
        resultDiv.textContent = '⚠️ Inserisci un valore!';
        resultDiv.className = 'result error show';
        return;
    }

    if (!/^\d+$/.test(input)) {
        resultDiv.textContent = '❌ Inserisci solo numeri!';
        resultDiv.className = 'result error show';
        return;
    }

    gameState.stats.totalAttempts++;
    const encoded = encode(input);
    resultDiv.textContent = `✨ ${input} → ${encoded}`;
    resultDiv.className = 'result success show';

    gameState.score += 10;
    gameState.streak++;
    gameState.stats.correctAnswers++;
    addXP(15);

    createParticles(window.innerWidth / 2, 400, '#48BB78');

    if (gameState.stats.correctAnswers === 1) unlockAchievement(1);
    if (gameState.streak === 5) unlockAchievement(2);
    if (gameState.score >= 100) unlockAchievement(3);
    if (gameState.stats.correctAnswers >= 20) unlockAchievement(4);

    gameState.stats.bestStreak = Math.max(gameState.stats.bestStreak, gameState.streak);

    updateUI();
    saveGameState();
}

function handleDecodeSubmit() {
    const input = document.getElementById('trainerInput').value.trim();
    const resultDiv = document.getElementById('trainerResult');

    if (!input) {
        resultDiv.textContent = '⚠️ Inserisci un valore!';
        resultDiv.className = 'result error show';
        return;
    }

    gameState.stats.totalAttempts++;
    const decoded = decode(input);
    if (!decoded) {
        resultDiv.textContent = '❌ Nessuna consonante valida!';
        resultDiv.className = 'result error show';
        return;
    }
    const highlightedWord = getHighlightedWord(input);
    resultDiv.innerHTML = `✨ ${highlightedWord} → ${decoded}`;
    resultDiv.className = 'result success show';

    gameState.score += 10;
    gameState.streak++;
    gameState.stats.correctAnswers++;
    addXP(15);

    createParticles(window.innerWidth / 2, 400, '#48BB78');
    gameState.stats.bestStreak = Math.max(gameState.stats.bestStreak, gameState.streak);
    updateUI();
    saveGameState();
}

function handleSuggestWords() {
    const input = document.getElementById('trainerInput').value.trim();
    const resultDiv = document.getElementById('trainerResult');

    if (!/^\d+$/.test(input)) {
        resultDiv.textContent = '❌ Inserisci un numero per la ricerca!';
        resultDiv.className = 'result error show';
        return;
    }

    const words = dictionary[input];

    if (words && words.length > 0) {
        resultDiv.innerHTML = `✨ Parole per ${input}: <br><strong>${words.join(', ')}</strong>`;
        resultDiv.className = 'result success show';
    } else {
        resultDiv.textContent = `❌ Nessun suggerimento per ${input}`;
        resultDiv.className = 'result error show';
    }
}

// Trainer Submit
function handleTrainerSubmit() {
    if (gameState.trainerMode === 'encode') {
        handleEncodeSubmit();
    } else {
        handleDecodeSubmit();
    }
}

// Quiz Functions
function generateQuizQuestion() {
    const randomNumber = Math.floor(Math.random() * 1000).toString();
    gameState.currentQuiz = {
        number: randomNumber,
        answer: encode(randomNumber)
    };
    document.getElementById('quizNumber').textContent = randomNumber;
    document.getElementById('quizInput').value = '';
    document.getElementById('quizResult').classList.remove('show');
}

function startQuiz() {
    generateQuizQuestion();
    gameState.quizTimeLeft = 30;
    updateTimerDisplay();
    
    gameState.quizTimer = setInterval(() => {
        gameState.quizTimeLeft--;
        updateTimerDisplay();
        
        if (gameState.quizTimeLeft <= 0) {
            handleQuizTimeout();
        }
    }, 1000);
}

function stopQuizTimer() {
    if (gameState.quizTimer) {
        clearInterval(gameState.quizTimer);
        gameState.quizTimer = null;
    }
}

function updateTimerDisplay() {
    document.getElementById('timerText').textContent = gameState.quizTimeLeft;
    const percentage = (gameState.quizTimeLeft / 30) * 360;
    document.getElementById('timerCircle').style.background = 
        `conic-gradient(var(--accent-blue) ${percentage}deg, var(--bg-card) ${percentage}deg)`;
}

        function handleQuizSubmit() {
            if (!gameState.currentQuiz) return;
            
            stopQuizTimer();
            
            const input = document.getElementById('quizInput').value.trim();
            const resultDiv = document.getElementById('quizResult');
            const quizNumber = gameState.currentQuiz.number;
            const userAnswer = input.toUpperCase();
            
            const validation = validateQuizAnswer(quizNumber, userAnswer);
            
            gameState.stats.totalAttempts++;
            let nextQuestionDelay = 1500; // Delay predefinito per risposte corrette (1.5s)
            
            if (validation.isCorrect) {
                if (validation.isPerfect) {
                    const perfectMessages = [
                        'Wow, conoscenza perfetta della matrice!',
                        'Impressionante! Conosci anche le alternative!',
                        'Sei un vero Eco-Coder!',
                        'Ma sei fortissimo! Risposta perfetta!'
                    ];
                    resultDiv.textContent = `🏆 ${perfectMessages[Math.floor(Math.random() * perfectMessages.length)]}`;
                } else {
                    resultDiv.textContent = '✅ Corretto! 🎉';
                }

                resultDiv.className = 'result success show';
                gameState.score += 20;
                gameState.streak++;
                gameState.stats.correctAnswers++;
                addXP(25);
                createParticles(window.innerWidth / 2, 400, '#48BB78');
                createConfetti();
                gameState.stats.bestStreak = Math.max(gameState.stats.bestStreak, gameState.streak);
            } else {
                resultDiv.textContent = `❌ Sbagliato! Risposta: ${gameState.currentQuiz.answer}`;
                resultDiv.className = 'result error show';
                gameState.streak = 0;
                nextQuestionDelay = 4000; // Delay più lungo per risposte errate (4s)
            }

            updateUI();
            saveGameState();
            
            setTimeout(() => {
                startQuiz();
            }, nextQuestionDelay);
        }

        function validateQuizAnswer(number, answer) {
            const expectedLetters = number.split('').map(digit => MATRIX[digit].letter.split('/'));
            const userLetters = answer.replace(/[\s-]/g, '').split('');
            const userPerfectLetters = answer.replace(/\s/g, '').split('-');

            if (userLetters.length !== number.length) return { isCorrect: false };

            const isCorrect = userLetters.every((letter, index) => expectedLetters[index].includes(letter));
            const isPerfect = userPerfectLetters.every((pair, index) => pair === MATRIX[number[index]].letter);

            return { isCorrect, isPerfect };
        }

        function handleQuizSkip() {
            stopQuizTimer();
            const resultDiv = document.getElementById('quizResult');
            resultDiv.textContent = '↪️ Domanda saltata!';
            resultDiv.className = 'result show';
            
            setTimeout(() => {
                startQuiz();
            }, 1000);
        }
function handleQuizTimeout() {
    stopQuizTimer();
    
    const resultDiv = document.getElementById('quizResult');
    resultDiv.textContent = `⏰ Tempo scaduto! Risposta: ${gameState.currentQuiz.answer}`;
    resultDiv.className = 'result error show';
    
    gameState.streak = 0;
    updateUI();
    saveGameState();
    
    setTimeout(() => {
        startQuiz();
    }, 2500);
}

// Tab Switch
function setTrainerTab(tab) {
    document.getElementById('freeTab').classList.remove('active');
    document.getElementById('quizTab').classList.remove('active');
    
    if (tab === 'free') {
        document.getElementById('freeTab').classList.add('active');
        document.getElementById('freeMode').style.display = 'block';
        document.getElementById('quizMode').style.display = 'none';
        stopQuizTimer();
    } else {
        document.getElementById('quizTab').classList.add('active');
        document.getElementById('freeMode').style.display = 'none';
        document.getElementById('quizMode').style.display = 'block';
        startQuiz();
    }
}

// Initialize
document.addEventListener('DOMContentLoaded', function() {
    loadGameState();
    // Initialize canvas only on larger screens to save performance on mobile
    if (window.innerWidth > 768) {
        initCanvas();
    }
    
    // Initialize UI
    updateUI();
    renderMatrix();
    
    // Event Listeners - Navigation
    document.getElementById('logoBtn').addEventListener('click', () => showPage('home'));
    document.getElementById('themeToggleBtn').addEventListener('click', toggleTheme);
    document.getElementById('startBtn').addEventListener('click', () => showPage('trainer'));
    document.getElementById('exploreBtn').addEventListener('click', () => showPage('matrix'));
    document.getElementById('joinBtn').addEventListener('click', () => showPage('insights'));

    // Aggiungi un singolo event listener per chiudere il menu hamburger quando si clicca un link
    document.querySelectorAll('.nav-links button').forEach(btn => {
        btn.addEventListener('click', () => {
            const navLinks = document.getElementById('navLinks');
            if (navLinks.classList.contains('show')) {
                const hamburgerBtn = document.getElementById('hamburgerBtn');
                navLinks.classList.remove('show');
                hamburgerBtn.classList.remove('active');
                hamburgerBtn.setAttribute('aria-expanded', 'false');
            }
        });
    });

    // Event Listeners - AI Widget
    const aiFab = document.getElementById('aiFab');
    const aiWidgetContainer = document.getElementById('aiWidgetContainer');
    const aiWidgetClose = document.getElementById('aiWidgetClose');
    const aiWidgetBody = document.getElementById('aiWidgetBody');
    let aiWidgetTimeout;

    function openAiWidget() {
        aiWidgetContainer.classList.add('show');
        aiFab.classList.add('hide');

        // Inizializza l'interfaccia interattiva dell'AI se non è già presente
        if (!aiWidgetBody.querySelector('.ai-input-form')) {
            aiWidgetBody.innerHTML = `
                <div class="ai-message">
                    Ciao! Inserisci un numero e ti aiuterò a creare un'immagine mnemonica per ricordarlo.
                </div>
                <form class="ai-input-form" id="aiForm">
                    <input type="text" id="aiInput" placeholder="Es. 314" inputmode="numeric" pattern="[0-9]*">
                    <button type="submit" id="aiSubmitBtn">Crea Eco</button>
                </form>
                <div class="ai-result" id="aiResult"></div>
            `;

            document.getElementById('aiForm').addEventListener('submit', (e) => {
                e.preventDefault();
                handleAiSubmit();
            });
        }
    }

    function handleAiSubmit() {
        const input = document.getElementById('aiInput').value.trim();
        const resultDiv = document.getElementById('aiResult');

        if (!/^\d+$/.test(input)) {
            resultDiv.innerHTML = `<div class="ai-message error">Inserisci solo numeri, per favore.</div>`;
            return;
        }
        if (input.length > 10) {
            resultDiv.innerHTML = `<div class="ai-message error">Numero troppo lungo! Prova con un massimo di 10 cifre.</div>`;
            return;
        }

        resultDiv.innerHTML = `<div class="typing-indicator"><span></span><span></span><span></span></div>`;

        setTimeout(() => {
            const chunks = input.match(/.{1,2}/g) || [];
            const wordData = chunks.map(chunk => {
                if (dictionary[chunk] && dictionary[chunk].length > 0) {
                    return { chunk, word: dictionary[chunk][0] }; // Prendi la prima parola per coerenza
                }
                return { chunk, word: null };
            });

            if (wordData.some(w => w.word === null)) {
                const missingChunks = wordData.filter(w => w.word === null).map(w => w.chunk).join(', ');
                resultDiv.innerHTML = `<div class="ai-message error">Non ho trovato parole per: ${missingChunks}. Prova a suggerirne una!</div>`;
                return;
            }

            const story = generateMnemonicStory(wordData);
            resultDiv.innerHTML = `<div class="ai-message">${story}</div>`;
        }, 1200);
    }

    function generateMnemonicStory(wordData) {
        const items = wordData.map(d => `<strong>${d.word}</strong> (${d.chunk})`);
        
        if (items.length === 0) {
            return "Nessun numero inserito.";
        }
        if (items.length === 1) {
            return `Immagina vividamente: ${items[0]}.`;
        }
        if (items.length === 2) {
            const templates = [
                `Pensa a ${items[0]} che interagisce con ${items[1]}.`,
                `Visualizza ${items[0]} e ${items[1]} sulla stessa scena.`,
                `Un ${items[0]} rotola verso ${items[1]}.`
            ];
            return templates[Math.floor(Math.random() * templates.length)];
        }
        if (items.length === 3) {
            const templates = [
                `Un ${items[0]} viene dato a ${items[1]}, che lo usa per colpire ${items[2]}.`,
                `Sopra ${items[0]} c'è ${items[1]}, e accanto c'è ${items[2]}.`
            ];
            return templates[Math.floor(Math.random() * templates.length)];
        }
        
        // Per storie più lunghe, crea una sequenza
        let story = "Immagina questa sequenza: " + items.join(', poi ');
        story += ".";
        return story;
    }

    function closeAiWidget() {
        clearTimeout(aiWidgetTimeout); // Annulla il timeout se si chiude prima
        aiWidgetContainer.classList.remove('show');
        aiFab.classList.remove('hide');
    }

    aiFab.addEventListener('click', openAiWidget);
    aiWidgetClose.addEventListener('click', closeAiWidget);
    
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const page = e.target.getAttribute('data-page');
            showPage(page);
        });
    });

    const hamburgerBtn = document.getElementById('hamburgerBtn');
    const handleHamburgerToggle = (e) => {
        e.preventDefault(); // Previene comportamenti indesiderati come il "doppio tocco"
        const navLinks = document.getElementById('navLinks');
        const isExpanded = navLinks.classList.toggle('show');
        hamburgerBtn.classList.toggle('active');
        hamburgerBtn.setAttribute('aria-expanded', isExpanded);
    };

    hamburgerBtn.addEventListener('click', handleHamburgerToggle);

    document.getElementById('resetProgressBtn').addEventListener('click', resetGameState);

    // Event Listeners - Trainer
    document.getElementById('suggestBtn').textContent = 'Cerca Parole'; // Rinominiamo il pulsante

    // Suggestion Modal Logic
    const suggestionModalOverlay = document.getElementById('suggestionModalOverlay');
    const openSuggestionModalBtn = document.getElementById('openSuggestionModalBtn');
    const closeSuggestionModalBtn = document.getElementById('closeSuggestionModalBtn');
    const suggestionForm = document.getElementById('suggestionForm');
    const suggestionFeedback = document.getElementById('suggestionFeedback');

    openSuggestionModalBtn.addEventListener('click', () => {
        suggestionModalOverlay.classList.add('show');
        // Pre-compila il numero se presente nel trainer
        const trainerNumber = document.getElementById('trainerInput').value;
        if (/^\d+$/.test(trainerNumber)) {
            document.getElementById('suggestion-number').value = trainerNumber;
        }
    });

    const closeModal = () => {
        suggestionModalOverlay.classList.remove('show');
        suggestionFeedback.textContent = '';
        suggestionForm.reset();
    };

    closeSuggestionModalBtn.addEventListener('click', closeModal);
    suggestionModalOverlay.addEventListener('click', (e) => {
        if (e.target === suggestionModalOverlay) {
            closeModal();
        }
    });

    suggestionForm.addEventListener('submit', function(e) {
        e.preventDefault();

        const formData = new FormData(suggestionForm);
        const submitButton = suggestionForm.querySelector('button[type="submit"]');
        submitButton.disabled = true;
        submitButton.textContent = 'Invio in corso...';

        // Aggiungi il token reCAPTCHA ai dati del modulo
        const token = grecaptcha.enterprise.getResponse();
        formData.append('g-recaptcha-response', token);

        fetch('/.netlify/functions/submit-suggestion', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams(formData).toString(),
        })
        .then(response => { // La risposta viene dalla nostra Netlify Function
            suggestionFeedback.textContent = '✅ Grazie! Il tuo suggerimento è stato inviato con successo.';
            setTimeout(closeModal, 2000);
        })
        .catch((error) => {
            suggestionFeedback.textContent = '❌ Errore. Riprova più tardi.';
        })
        .finally(() => {
            submitButton.disabled = false;
            submitButton.textContent = 'Invia Suggerimento';
            grecaptcha.enterprise.reset(); // Resetta il widget reCAPTCHA
        });
    });

    document.getElementById('encodeBtn').addEventListener('click', () => setMode('encode'));
    document.getElementById('decodeBtn').addEventListener('click', () => setMode('decode'));
    document.getElementById('submitBtn').addEventListener('click', handleTrainerSubmit);
    document.getElementById('suggestBtn').addEventListener('click', handleSuggestWords);
    document.getElementById('trainerInput').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') handleTrainerSubmit();
    });

                // Event Listeners - Quiz
                document.getElementById('freeTab').addEventListener('click', () => setTrainerTab('free'));
                document.getElementById('quizTab').addEventListener('click', () => setTrainerTab('quiz'));
                document.getElementById('quizSubmitBtn').addEventListener('click', handleQuizSubmit);
                document.getElementById('quizSkipBtn').addEventListener('click', handleQuizSkip);
                document.getElementById('quizInput').addEventListener('keypress', (e) => {
                    if (e.key === 'Enter') handleQuizSubmit();
                });
    // Welcome message
    setTimeout(() => {
        showAchievementToast({ 
            name: 'Benvenuto! 👋', 
            desc: 'Inizia il tuo viaggio nella mnemotecnica', 
            icon: '✨' 
        });
    }, 1000);
});