const canvas = document.getElementById('battle-canvas');
const ctx = canvas.getContext('2d');
const audio = document.getElementById('song');
const dancers = []; // Alle Tänzerinnen hier
const spriteSheetIdle = new Image();
spriteSheetIdle.src = '/static/assets/hips.png';

const spriteSheetSlide = new Image();
spriteSheetSlide.src = '/static/assets/slide.png';

const spriteSheetBalancing = new Image();
spriteSheetBalancing.src = '/static/assets/balancing.png';

const spriteSheetSkip = new Image();
spriteSheetSkip.src = '/static/assets/skip.png';

const spriteSheetSnap = new Image();
spriteSheetSnap.src = '/static/assets/snap.png';

const frameWidth = 39;
const frameHeight = 53;
const framesPerRow = 8; // 8 Frames in einer Zeile

const spriteStates = {
    idle: {
        sheet: spriteSheetIdle,
        row: 0,
        start: 0,
        end: 7
    },
    slide: {
        sheet: spriteSheetSlide,
        row: 0,
        start: 0,
        end: 7
    },
    balancing: {
        sheet: spriteSheetBalancing,
        row: 0,
        start: 0,
        end: 7
    },
    skip: {
        sheet: spriteSheetSkip,
        row: 0,
        start: 0,
        end: 7
    },
    snap: {
        sheet: spriteSheetSnap,
        row: 0,
        start: 0,
        end: 7
    }
};

let currentState = 'idle';
let currentFrame = spriteStates[currentState].start;

let beatTimes = [];
let bpm = 120;
let beatWindow = (60 / bpm) * 0.05; // 5% of beat duration
let lastBeatIndex = 0;
let lastBeatTime = 0;
const minAttackInterval = 200; // 200ms between attacks

let i = 0; // Damage counter
let lastFlashTime = 0;
let flashCooldown = (60 / bpm) * 300; // faster recovery

let energyData = [];
let lastEnergy = 0;

let fps = 16; // default fallback fps
let frameInterval = 1000 / fps;
let lastFrameTime = 0;

let frameDirection = 1;

function setupDancers(count) {
    dancers.length = 0; // Erst leeren, falls neu

    const padding = 100; // Abstand vom Canvas Rand
    const availableWidth = canvas.width - padding * 2;
    const spacePerDancer = availableWidth / (count - 1);

    const scale = 3;
    const destWidth = frameWidth * scale;
    const destHeight = frameHeight * scale;

    const y = canvas.height - destHeight - 50; // Alle auf gleicher Y-Höhe

    for (let i = 0; i < count; i++) {
        const x = padding + i * spacePerDancer - destWidth / 2;
        dancers.push({ x, y, scale });
    }
}


function bpmToFPS(bpm, framesPerBeat = 8) {
    return (bpm / 60) * framesPerBeat;
}

function drawSprite(state, frame, x, y, width, height) {
    const col = frame % framesPerRow;
    const sheet = spriteStates[state].sheet;
    const row = spriteStates[state].row;

    ctx.drawImage(
        sheet,
        col * frameWidth, row * frameHeight,
        frameWidth, frameHeight,
        x, y, width, height
    );
}


function flash(intensity = 1) {
    const now = Date.now();
    if (now - lastFlashTime < flashCooldown) {
        return;
    }
    lastFlashTime = now;

    const brightness = Math.floor(255 * intensity);
    const flashColor = `rgb(255, ${235 - brightness / 3}, ${235 - brightness / 3})`;

    const shakeX = (Math.random() - 0.5) * (3 + 6 * intensity);
    const shakeY = (Math.random() - 0.5) * (3 + 6 * intensity);

    canvas.style.transition = 'background-color 0.3s ease, filter 0.3s ease, transform 0.3s ease';
    canvas.style.filter = 'brightness(1.8)';
    canvas.style.transform = `translate(${shakeX}px, ${shakeY}px) scale(1.05)`;
    canvas.style.backgroundColor = flashColor;

    setTimeout(() => {
        canvas.style.backgroundColor = '#222';
        canvas.style.filter = 'brightness(1)';
        canvas.style.transform = 'scale(1)';
    }, 70);
}

function checkEnergy() {
    const currentTime = audio.currentTime;
    const nearest = energyData.find(e => Math.abs(e.time - currentTime) < 0.05);
    if (nearest) {
        if (nearest.energy > 0.2 && nearest.energy > lastEnergy * 1.08) {
            flash(nearest.energy * 5);
        }
        lastEnergy = nearest.energy;
    }
}

function checkBeat() {
    const currentTime = audio.currentTime;
    if (lastBeatIndex < beatTimes.length) {
        const nextBeatTime = beatTimes[lastBeatIndex];
        if (Math.abs(currentTime - nextBeatTime) < beatWindow) {
            const now = currentTime * 1000;
            if (now - lastBeatTime > minAttackInterval) {
                lastBeatTime = now;
            }
            lastBeatIndex++;
        }
    }
    checkEnergy();
}

function gameLoop(timestamp) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    checkBeat();

    if (timestamp - lastFrameTime > frameInterval) {
        currentFrame += frameDirection;

        if (currentFrame >= spriteStates[currentState].end) {
            frameDirection = -1;
            currentFrame = spriteStates[currentState].end;
        }
        if (currentFrame <= spriteStates[currentState].start) {
            frameDirection = 1;
            currentFrame = spriteStates[currentState].start;
        }

        lastFrameTime = timestamp;
    }


    dancers.forEach(dancer => {
        const destWidth = frameWidth * dancer.scale;
        const destHeight = frameHeight * dancer.scale;
        drawSprite(currentState, currentFrame, dancer.x, dancer.y, destWidth, destHeight);
    });

    ctx.fillStyle = 'white';
    ctx.font = '20px Arial';
    ctx.fillText(`FPS: ${fps.toFixed(2)}`, 10, 30); // Links oben anzeigen

    requestAnimationFrame(gameLoop);
}

spriteSheetIdle.onload = checkAllImagesLoaded;
spriteSheetSlide.onload = checkAllImagesLoaded;

let imagesLoaded = 0;
const totalImages = 2; // Anzahl deiner Spritesheets

function checkAllImagesLoaded() {
    imagesLoaded++;
    if (imagesLoaded === totalImages) {
        setupDancers(4);
    }
}

audio.addEventListener('play', () => {
    gameLoop();
});

document.getElementById('uploadForm').addEventListener('submit', function(e) {
    e.preventDefault();

    const formData = new FormData();
    const fileField = document.getElementById('fileInput1');

    formData.append('file', fileField.files[0]);

    fetch('/upload', {
        method: 'POST',
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        console.log('Upload success:', data);
        loadSongAndAnalysis(data.mp3_url, data.json_url); // Load energy data
        bpm = data.bpm || 120; //  BPM kommt vom Server!
        if (bpm < 120)
        {
        currentState = "slide"
        }
        fps = bpmToFPS(bpm, 8); // BPM in FPS umrechnen!
        frameInterval = 1000 / fps; // Millisekunden pro Frame
    })
    .catch(error => {
        console.error('Upload failed:', error);
    });
});



function loadSongAndAnalysis(mp3Url, jsonUrl) {
    audio.src = mp3Url;
    fetch(jsonUrl)
        .then(response => response.json())
        .then(json => {
            energyData = json.energy_over_time || [];
            audio.src = mp3Url;
            audio.play();
        });
}