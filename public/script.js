const socket = io();
console.log(socket);
let connected = false;
let room = null;
let observedAngle;
let sentAngle = { value: 0 };

// Game variables
let tank1 = {}, tank2 = {};
let projectiles = new Map();
let groundHeight = 40;
let wheelRadius = 20;
let gravity = 0.3;
let airFriction = 0.01;
let wind;
let player = null;
let explosionBodies = [];
let explosionParticles = [];
let pendingExplosions = [];
let engine, world;
let speed = 17;
// Neural network variables
let learningRate = 0.001;
let trainingStep = 0;
let lossHistory = [];
let isShooting = false;
let predictedLandingX = null;
let actualLandingX = null;
let gameStarted = false;
let countdown = 3;
let lastShotTime = 0;
let shotCooldown = 2000;
let minSamplesBeforeShooting = 100;
let distanceError = 5;
// Visualization variables
let lastNetworkState = {
    inputs: [0],
    hidden1: Array(16).fill(0),
    hidden2: Array(16).fill(0),
    output: 0,
    weights: []
};

// Chart setup
let lossChart;
let chartData = {
    labels: [],
    datasets: [{
        label: 'Loss',
        data: [],
        borderColor: 'rgba(255, 99, 132, 1)',
        backgroundColor: 'rgba(255, 99, 132, 0.2)',
        tension: 0.1
    }]
};

// Neural network model
let mdl = {
    inputSize: 1,
    hidden1Size: 16,
    hidden2Size: 16,
    outputSize: 1,
    W1: [],  // Input to first hidden layer
    B1: [],  // First hidden layer biases
    W2: [],  // First to second hidden layer
    B2: [],  // Second hidden layer biases
    W3: [],  // Second hidden to output
    B3: 0,   // Output bias
    momentumW1: [],
    momentumW2: [],
    momentumW3: [],
    momentumB1: [],
    momentumB2: [],
    momentumB3: 0
};
socket.on('connect', () => {
    console.log('Connected to /warcaby namespace');

    // Retrieve the stored server data from local storage
    const serverData = JSON.parse(localStorage.getItem('serverData'));
    console.log(serverData);

    if (serverData) {
        Player = serverData.player;
        playerName = serverData.inputText;
        console.log(Player);
        console.log(playerName);

        // Emit the joinServer event with the retrieved data
        socket.emit('joinServer', {
            inputText: serverData.inputText,
            index: serverData.index,
            players: serverData.players,
            player: serverData.player // Send player information
        });

        // Optionally, clear the data from local storage if it is no longer needed
        localStorage.removeItem('serverData');
    }
});

socket.on('joinedRoom', (ROOM) => {
    console.log(`Joined room: ${ROOM}`);
    room = ROOM;
    console.log(room);
    let roomInfo = document.querySelector('#room');
    console.log(room);
    roomInfo.value = room;
    document.dispatchEvent(new Event('socketConnected'));
});

socket.on('error', (message) => {
    console.error(message);
    alert(message); // Show the error message to the user
});
socket.on('joinedRoom', (ROOM) => {
    //////////////////////////////////////////////////console.log(`Joined room: ${ROOM}`);
    room = ROOM;
    ////////////////////////////////////////////////console.log(room);
    let roomInfo = select('#room');
    //////////////////////////////////////////////console.log(room)
    roomInfo.value(room);
    document.dispatchEvent(new Event('socketConnected'));
});

// Socket event handlers
socket.on('youArePlayer', (data) => {
    player = data;
    ////console.log("You are player", player);
});

socket.on('playerMoved', (data) => {
    const tank = data.player === 1 ? tank1 : tank2;
    tank.targetBarrelAngle = data.angle;
    tank.lastAngleUpdate = Date.now();
});
let shooter = {};
let target = {};
let rCaterpillarImg;
let rTowerImg;
let lCaterpillarImg;
let lTowerImg;
// function preload() {
//   rCaterpillarImg = loadImage('assets/wheels.png');
// }
socket.on('roomMessage', (data) => {
    console.log("roomMessage");
    room = data.room;
    wind = 0.0;
    connected = true;
    rCaterpillarImg = loadImage('assets/wheels3.png');
    rTowerImg = loadImage('assets/tower.png');
    lCaterpillarImg = loadImage('assets/wheelsL.png');
    lTowerImg = loadImage('assets/towerL.png');
    createTank(tank1, width / 4, height - groundHeight - wheelRadius);
    createTank(tank2, 3 * (width / 4), height - groundHeight - wheelRadius);
    shooter = player === 1 ? tank1 : tank2;
    target = player === 1 ? tank2 : tank1;

    startCountdown();
});
observedAngle = new Proxy(sentAngle, {
    set(target, prop, value) {
        if (target[prop] !== value) {
            target[prop] = value;
            socket.emit('playerUpdate', { angle: target.value, player });
        }
        return true;
    }
});

socket.on('enemyProjectile', (data) => {
    projectiles.set(data.id, {
        ...data,
        lastUpdate: Date.now(),
        lastX: data.x,
        lastY: data.y,
        renderX: data.x,
        renderY: data.y,
        hit: false
    });
});

socket.on('enemyHit', (data) => {

    const tank = data.player === 1 ? tank1 : tank2;
    //console.log(data.receivedEffect);
    if (!tank.exploded && data.receivedEffect == 'destroyed') {
        pendingExplosions.push({
            tank: tank,
            position: data.hitPosition
        });
        updateLifeBar(tank);
    }
    else if ((!tank.exploded && data.receivedEffect == 'hit'))
        updateLifeBar(tank);
    if (data.projectileId) {
        projectiles.delete(data.projectileId);
    }
});

socket.on('resetGame', () => {
    resetGameState();
});

// Countdown function
function startCountdown() {
    const countdownElement = document.getElementById('countdown');
    countdownElement.style.display = 'block';

    const countdownInterval = setInterval(() => {
        countdownElement.textContent = countdown;
        countdown--;

        if (countdown < 0) {
            clearInterval(countdownInterval);
            countdownElement.style.display = 'none';
            gameStarted = true;
        }
    }, 1000);
}

// Neural network functions
// Neural network functions with Leaky ReLU
function leakyRelu(x) {
    return x > 0 ? x : 0.01 * x; // Typical alpha value is 0.01
}

function forward(input) {
    // First hidden layer
    let hidden1 = mdl.W1.map(function (wRow, i) {
        return wRow.reduce(function (sum, w, j) {
            return sum + w * input[j];
        }, mdl.B1[i]);
    }).map(leakyRelu);

    // Second hidden layer
    let hidden2 = mdl.W2.map(function (wRow, i) {
        return wRow.reduce(function (sum, w, j) {
            return sum + w * hidden1[j];
        }, mdl.B2[i]);
    }).map(leakyRelu);

    // Output layer
    let output = hidden2.reduce(function (sum, h, i) {
        return sum + h * mdl.W3[i];
    }, mdl.B3);

    lastNetworkState = {
        inputs: [...input],
        hidden1: [...hidden1],
        hidden2: [...hidden2],
        output: output,
        weights: {
            inputToHidden1: mdl.W1,
            hidden1ToHidden2: mdl.W2,
            hidden2ToOutput: mdl.W3
        }
    };
    return { hidden1, hidden2, output };
}

function backward(input, target) {
    const { hidden1, hidden2, output } = forward(input);
    const error = output - target;
    const dLoss = 2 * error;

    // Calculate gradients for output layer
    const dW3 = hidden2.map(function (h) { return dLoss * h; });
    const dB3 = dLoss;

    // Gradients for second hidden layer
    const dHidden2 = mdl.W3.map(function (w3, i) {
        return dLoss * w3 * (hidden2[i] > 0 ? 1 : 0.01);
    });
    const dW2 = mdl.W2.map(function (wRow, i) {
        return wRow.map(function (w, j) { return dHidden2[i] * hidden1[j]; });
    });
    const dB2 = dHidden2;

    // Gradients for first hidden layer
    const dHidden1 = mdl.W2.map(function (wRow, j) {
        return wRow.reduce(function (sum, w, i) {
            return sum + dHidden2[i] * w;
        }, 0) * (hidden1[j] > 0 ? 1 : 0.01);
    });
    const dW1 = mdl.W1.map(function (wRow, i) {
        return wRow.map(function (w, j) { return dHidden1[i] * input[j]; });
    });
    const dB1 = dHidden1;

    // Update weights directly without momentum
    for (let i = 0; i < mdl.hidden1Size; i++) {
        for (let j = 0; j < mdl.inputSize; j++) {
            mdl.W1[i][j] -= learningRate * dW1[i][j];
        }
        mdl.B1[i] -= learningRate * dB1[i];
    }

    for (let i = 0; i < mdl.hidden2Size; i++) {
        for (let j = 0; j < mdl.hidden1Size; j++) {
            mdl.W2[i][j] -= learningRate * dW2[i][j];
        }
        mdl.B2[i] -= learningRate * dB2[i];
        mdl.W3[i] -= learningRate * dW3[i];
    }

    mdl.B3 -= learningRate * dB3;

    return error * error;
}
// let rCaterpillarImg;

// function preload() {
//   rCaterpillarImg = loadImage('assets/wheels.png');
// }
let predictedLanding;
// p5.js setup
function setup() {
    const app = createCanvas(1000, 500);
    app.parent('app');
    // Initialize neural network
    // Initialize neural network with two hidden layers
    const inputRange = Math.sqrt(1 / mdl.inputSize);
    const hidden1Range = Math.sqrt(1 / mdl.hidden1Size);
    const hidden2Range = Math.sqrt(1 / mdl.hidden2Size);

    // Initialize weights and biases for first hidden layer
    mdl.W1 = Array.from({ length: mdl.hidden1Size }, () =>
        Array.from({ length: mdl.inputSize }, () => random(-inputRange, inputRange)));
    mdl.B1 = Array.from({ length: mdl.hidden1Size }, () => random(-inputRange, inputRange));

    // Initialize weights and biases for second hidden layer
    mdl.W2 = Array.from({ length: mdl.hidden2Size }, () =>
        Array.from({ length: mdl.hidden1Size }, () => random(-hidden1Range, hidden1Range)));
    mdl.B2 = Array.from({ length: mdl.hidden2Size }, () => random(-hidden1Range, hidden1Range));

    // Initialize weights and biases for output layer
    mdl.W3 = Array.from({ length: mdl.hidden2Size }, () => random(-hidden2Range, hidden2Range));
    mdl.B3 = random(-hidden2Range, hidden2Range);

    // Initialize momentum terms
    mdl.momentumW1 = Array.from({ length: mdl.hidden1Size }, () =>
        Array.from({ length: mdl.inputSize }, () => 0));
    mdl.momentumW2 = Array.from({ length: mdl.hidden2Size }, () =>
        Array.from({ length: mdl.hidden1Size }, () => 0));
    mdl.momentumW3 = Array.from({ length: mdl.hidden2Size }, () => 0);
    mdl.momentumB1 = Array.from({ length: mdl.hidden1Size }, () => 0);
    mdl.momentumB2 = Array.from({ length: mdl.hidden2Size }, () => 0);
    mdl.momentumB3 = 0;

    // Update lastNetworkState
    lastNetworkState = {
        inputs: [0],
        hidden1: Array(mdl.hidden1Size).fill(0),
        hidden2: Array(mdl.hidden2Size).fill(0),
        output: 0,
        weights: {
            inputToHidden1: mdl.W1,
            hidden1ToHidden2: mdl.W2,
            hidden2ToOutput: mdl.W3
        }
    };


    // Initialize physics engine
    engine = Matter.Engine.create();
    world = engine.world;
    Matter.Engine.run(engine);


    // Create tanks with consistent initial angles


    // Setup chart
    const ctx = document.getElementById('lossChart').getContext('2d');
    lossChart = new Chart(ctx, {
        type: 'line',
        data: chartData,
        options: {
            responsive: false,
            maintainAspectRatio: false,
            animation: false,
            plugins: { legend: { display: false } },
            scales: {
                x: { display: false },
                y: { min: 0, ticks: { maxTicksLimit: 5 } }
            }
        }
    });

    frameRate(20);
}

function createTank(tank, x, y) {
    if (tank == tank1)
        tank.barrelAngle = 0.2;
    else
        tank.barrelAngle = PI - 0.2;
    tank.exploded = false;
    //tank.wheelL = { x: x - 40, y, r: wheelRadius };
    //tank.wheelR = { x: x + 40, y, r: wheelRadius };
    tank.frame = { x, y: y - 20, w: 100, h: 20 };
    //tank.tower = { x, y: y - 40, w: 40, h: 20 };
    if (tank == tank1) {
        tank.tower = { x: 190, y: 441, w: 90, h: 28, img: lTowerImg };
        tank.wheels = { x: 190, y: 455, w: 90, h: 10, img: lCaterpillarImg };
    }
    else {
        tank.tower = { x: 810, y: 441, w: 90, h: 28, img: rTowerImg };
        tank.wheels = { x: 810, y: 455, w: 90, h: 10, img: rCaterpillarImg };
    }
    if (tank == tank1) {
        tank.barrel = { x1: 209, y1: 432, x2: 209, y2: 382 };
    }
    else {
        tank.barrel = { x1: 791, y1: 432, x2: 821, y2: 382 };
    }
    tank.position = x < width / 2 ? -1 : 1;
    tank.lifePoints = 10;

}

function resetGameState() {
    tank1.exploded = false;
    tank2.exploded = false;
    explosionBodies = [];
    explosionParticles = [];
    projectiles.clear();
    pendingExplosions = [];
    isShooting = false;
    gameStarted = false;
    countdown = 3;

    // Reset neural network
    const inputRange = Math.sqrt(1 / mdl.inputSize);
    const hiddenRange = Math.sqrt(1 / mdl.hiddenSize);

    mdl.W1 = Array.from({ length: mdl.hiddenSize }, () =>
        Array.from({ length: mdl.inputSize }, () => random(-inputRange, inputRange)));
    mdl.B1 = Array.from({ length: mdl.hiddenSize }, () => random(-inputRange, inputRange));
    mdl.W2 = Array.from({ length: mdl.hiddenSize }, () => random(-hiddenRange, hiddenRange));
    mdl.B2 = random(-hiddenRange, hiddenRange);

    // Reset momentum
    mdl.momentumW1 = Array.from({ length: mdl.hiddenSize }, () =>
        Array.from({ length: mdl.inputSize }, () => 0));
    mdl.momentumW2 = Array.from({ length: mdl.hiddenSize }, () => 0);
    mdl.momentumB1 = Array.from({ length: mdl.hiddenSize }, () => 0);
    mdl.momentumB2 = 0;

    // Reset tank positions and angles
    createTank(tank1, width / 3, height - groundHeight - wheelRadius);
    createTank(tank2, 2 * width / 3, height - groundHeight - wheelRadius);

    // Reset training
    lossHistory = [];
    chartData.labels = [];
    chartData.datasets[0].data = [];
    lossChart.update();

    // Start new countdown
    startCountdown();
}

function draw() {
    if (!gameStarted) {
        // Still allow neural network visualization during countdown
        //drawNeuralNetwork();
        return;
    }
    background(230);
    drawTank(target);
    drawTank(shooter);
    const now = Date.now();
    const interpolationSpeed = 0.3; // Adjust for smoothness

    // [tank1, tank2].forEach(tank => {
    //   if (tank.lastAngleUpdate) {
    //     let angleDiff = tank.targetBarrelAngle - tank.barrelAngle;

    //     // Normalize angle difference for smooth full rotation
    //     if (angleDiff > PI) angleDiff -= TWO_PI;
    //     if (angleDiff < -PI) angleDiff += TWO_PI;

    //     tank.barrelAngle += angleDiff * 0.3;
    //     tank.barrelAngle = (tank.barrelAngle + TWO_PI) % TWO_PI; // keep in [0, 2π]
    //   }
    // });

    // Draw ground
    fill(100);
    rectMode(CENTER);
    rect(width / 2, height - groundHeight / 2, width, groundHeight);

    // Draw wind indicator
    drawWindIndicator();

    // Update and draw projectiles
    updateProjectiles();

    // Draw prediction markers
    if (predictedLandingX) {
        fill(255, 0, 0);
        ellipse(predictedLanding, height - groundHeight, 10);
    }
    if (actualLandingX) {
        fill(0, 255, 0);
        ellipse(actualLandingX, height - groundHeight, 10);
    }
    fill(0);
    ellipse(910, 300, 5);
    // Process explosions
    processExplosions();
    drawExplosionEffects();

    // Update info panel
    updateInfoPanel();
    drawNeuralNetwork();
    //Training and shooting logic
    // if (true) {
    //   const trainingIterations = lossHistory.length < minSamplesBeforeShooting ? 10 : 3;
    //   for (let i = 0; i < 1; i++) {
    //     train();
    //   }

    //   if (true) {
    //     let currentTime = Date.now();
    //     if (lossHistory[lossHistory.length - 1] < 0.07) {
    //       attemptShot();
    //     }
    //   }
    // }
    train();
    attemptShot();
}

function updateProjectiles() {

    const now = Date.now();
    projectiles.forEach((proj, id) => {
        if (proj.hit) return;
        const interpFactor = Math.min(1, (now - proj.lastUpdate) / (1000 / 30));

        proj.renderX = lerp(proj.lastX, proj.x, interpFactor);
        proj.renderY = lerp(proj.lastY, proj.y, interpFactor);

        fill(proj.id.startsWith('local') ? 255 : 0, 0, proj.id.startsWith('local') ? 0 : 255);
        ellipse(proj.renderX, proj.renderY, 10);

        const windEffect = proj.shooterPosition === -1 ? -wind : wind;
        proj.velocityX += -airFriction * proj.velocityX + wind;
        proj.velocityY += -airFriction * proj.velocityY + gravity;
        proj.x += proj.velocityX;
        proj.y += proj.velocityY;

        proj.lastX = proj.x;
        proj.lastY = proj.y;
        proj.lastUpdate = now;

        let enemyTank = player === 1 ? tank2 : tank1;
        const hit = checkProjectileHit(proj, enemyTank);
        if (!enemyTank.exploded && (hit == 'hit' || hit == 'destroyed')) {

            //console.log(hitEffect);
            socket.emit('playerHit', {
                player: player === 1 ? 2 : 1,
                projectileId: proj.id,
                hitPosition: { x: proj.x, y: proj.y },
                effect: hit,
            });
            projectiles.delete(id);
            return;
        }

        if (proj.y >= height - groundHeight) {
            projectiles.delete(id);
        }
        if ((proj.x < 0 || proj.x > width || proj.y >= height - groundHeight) && proj.id.startsWith('local')) {
            projectiles.delete(id);
            isShooting = false;
        }
    });
}

function processExplosions() {
    while (pendingExplosions.length > 0) {
        const explosion = pendingExplosions.pop();
        triggerExplosion(explosion.tank, explosion.position);
    }
}

function drawExplosionEffects() {
    for (let body of explosionBodies) {
        drawBody(body);
    }

    for (let i = explosionParticles.length - 1; i >= 0; i--) {
        const p = explosionParticles[i];
        fill(255, 100, 0, p.life * 2.55);
        noStroke();
        ellipse(p.x, p.y, p.radius * 2);

        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.1;
        p.life--;

        if (p.life <= 0) {
            explosionParticles.splice(i, 1);
        }
    }
}

function updateInfoPanel() {
    //const shooter = player === 1 ? tank1 : tank2;
    //const target = player === 1 ? tank2 : tank1;
    const distance = abs(shooter.tower.x - target.tower.x);

    let info = `
    <strong>Player ${player}</strong><br>
    Wind: ${wind.toFixed(5)}<br>
    Distance: ${distance.toFixed(0)}<br>
    Training Samples: ${lossHistory.length}<br>
    Last Loss: ${lossHistory.length > 0 ? lossHistory[lossHistory.length - 1].toFixed(4) : 'N/A'}
  `;

    document.getElementById('infoPanel').innerHTML = info;
}

function updateOutputPanel(predicted, actual) {
    let output = `
    <strong>Neural Network Output</strong><br>
    Predicted X: ${predicted.toFixed(1)}<br>
    Actual X: ${actual.toFixed(1)}<br>
    Difference: ${abs(predicted - actual).toFixed(1)}
  `;

    document.getElementById('outputPanel').innerHTML = output;
}

function drawWindIndicator() {
    const windStrength = abs(wind) * 1000;
    const windDirection = wind > 0 ? 1 : -1;

    fill(0);
    textSize(16);
    text(`Wind: ${windDirection > 0 ? "→" : "←"} ${wind.toFixed(4)}`, 20, 30);
}

function checkProjectileHit(proj, tank) {
    const towerLeft = tank.tower.x - tank.tower.w / 2;
    const towerRight = tank.tower.x + tank.tower.w / 2;
    const towerTop = tank.tower.y - tank.tower.h / 2;
    const towerBottom = tank.tower.y + tank.tower.h / 2;

    const towerHit =
        proj.x > towerLeft &&
        proj.x < towerRight &&
        proj.y > towerTop &&
        proj.y < towerBottom;


    const barrelHit = pointToLineDistance(
        proj.x,
        proj.y,
        tank.barrel.x1,
        tank.barrel.y1,
        tank.barrel.x2,
        tank.barrel.y2
    ) < 5;
    if (towerHit && !proj.hit) {
        proj.hit = true;

        //updateLifeBar(tank);

        if (tank.lifePoints >= 2) return 'hit';
        else return 'destroyed';
    }



}

function updateLifeBar(tankHit) {
    tankHit.lifePoints = Math.max(0, tankHit.lifePoints - 1);

    const lifeBar =
        tankHit.position == -1
            ? document.getElementById("lifeBarL")
            : document.getElementById("lifeBarR");

    // Assuming max lifePoints is 10, so each point = 10%
    const maskWidth = 100 - tankHit.lifePoints * 10;
    lifeBar.style.setProperty("--mask-width", `${maskWidth}%`);
}

function pointToLineDistance(px, py, x1, y1, x2, y2) {
    const A = px - x1;
    const B = py - y1;
    const C = x2 - x1;
    const D = y2 - y1;

    const dot = A * C + B * D;
    const len_sq = C * C + D * D;
    let param = -1;
    if (len_sq !== 0) param = dot / len_sq;

    let xx, yy;

    if (param < 0) {
        xx = x1;
        yy = y1;
    } else if (param > 1) {
        xx = x2;
        yy = y2;
    } else {
        xx = x1 + param * C;
        yy = y1 + param * D;
    }

    const dx = px - xx;
    const dy = py - yy;
    return Math.sqrt(dx * dx + dy * dy);
}

function drawTank(tank) {
    if (tank.exploded) return;

    let len = 40;
    if (tank.position == -1) {
        tank.barrel.x1 = 209;
        tank.barrel.y1 = 432;
    }
    else {
        tank.barrel.x1 = 791;
        tank.barrel.y1 = 432;
    }


    imageMode(CENTER);
    image(tank.wheels.img, tank.wheels.x, tank.wheels.y, tank.wheels.w, tank.wheels.h);
    image(tank.tower.img, tank.tower.x, tank.tower.y, tank.tower.w, tank.tower.h);


    //ellipse(tank.wheelL.x, tank.wheelL.y, tank.wheelL.r * 2);
    //ellipse(tank.wheelR.x, tank.wheelR.y, tank.wheelR.r * 2);
    //fill(50);
    //rectMode(CENTER);
    //rect(tank.frame.x, tank.frame.y, tank.frame.w, tank.frame.h);
    //fill(100);
    //rect(tank.tower.x, tank.tower.y, tank.tower.w, tank.tower.h);
    //stroke(0);
    //strokeWeight(4);
    if (tank == shooter && tank.position == -1) {
        tank.barrel.x2 = 209 + cos(tank.barrelAngle) * len;
        tank.barrel.y2 = 432 + sin(tank.barrelAngle) * len;
    }
    if (tank == shooter && tank.position == 1) {
        tank.barrel.x2 = 791 + cos(tank.barrelAngle) * len;
        tank.barrel.y2 = 432 + sin(tank.barrelAngle) * len;
    }
    if (tank == target && tank.position == -1) {
        tank.barrel.x2 = 209 + cos(tank.targetBarrelAngle) * len;
        tank.barrel.y2 = 432 + sin(tank.targetBarrelAngle) * len;
    }
    if (tank == target && tank.position == 1) {
        tank.barrel.x2 = 791 + cos(tank.targetBarrelAngle) * len;
        tank.barrel.y2 = 432 + sin(tank.targetBarrelAngle) * len;
    }
    //fill(0);
    stroke(0);
    strokeWeight(4);
    line(tank.barrel.x1, tank.barrel.y1, tank.barrel.x2, tank.barrel.y2);
}

function train() {
    if (tank1.exploded || tank2.exploded) return;

    const fullRotation = player == 1 ? PI / 2 + 0.5 : PI / 2 + 0.5; // 360 degrees
    const startAngle = player == 1 ? 0.2 : PI - 0.2;   // Barrel pointing straight down
    let direction = player == 1 ? -1 : 1; // clockwise for player 1, counter-clockwise for player 2



    let totalLoss = 0;
    const samples = 5;

    for (let i = 0; i < 1; i++) {
        let progress = ((trainingStep + i) % 100) / 100; // Loop progress [0, 1)

        // Rotate smoothly from startAngle in desired direction
        let angle = (startAngle + direction * progress * fullRotation + TWO_PI) % TWO_PI;

        // Apply angle to tank and NN
        observedAngle.value = angle;
        shooter.barrelAngle = angle;

        let landingX = simulateLanding(angle, shooter);
        actualLandingX = landingX;

        const distance = abs(shooter.tower.x - target.tower.x);
        const normalizedDistance = distance / width;

        let inputs = [angle];
        let error = (landingX - target.tower.x) / width;
        totalLoss += backward(inputs, error);

        let predictedError = forward(inputs).output * width;
        let predictedLanding = landingX + predictedError;
        updateOutputPanel(predictedLanding, landingX);
    }

    let avgLoss = totalLoss / samples;
    lossHistory.push(avgLoss);

    trainingStep++;
    if (trainingStep % 5 === 0) {
        chartData.labels.push(trainingStep);
        chartData.datasets[0].data.push(avgLoss);
        if (chartData.labels.length > 100) {
            chartData.labels.shift();
            chartData.datasets[0].data.shift();
        }
        lossChart.update();
    }
}



function attemptShot() {
    //let shooter = player === 1 ? tank1 : tank2;
    //let target = player === 1 ? tank2 : tank1;
    const distance = abs(shooter.tower.x - target.tower.x);
    const normalizedWind = wind + 1;
    const normalizedDistance = distance / width;

    // Get current angle from neural network prediction
    let currentAngle = shooter.barrelAngle;
    const angleToNN = player == 1 ? shooter.barrelAngle + 5 : shooter.barrelAngle;
    // Predict landing position
    let inputs = [
        currentAngle,
        //normalizedWind, 
        //normalizedDistance
    ];

    let predictedError = forward(inputs).output * width;
    predictedLanding = simulateLanding(inputs[0], shooter) + predictedError;

    // Only shoot if prediction is reasonably close
    if (abs(predictedError) < distanceError && trainingStep > 100 && lossHistory[lossHistory.length - 1] < 0.01) {
        fire(currentAngle);

        predictedLandingX = predictedLanding;
        lastShotTime = Date.now();
        isShooting = true;
    }
}

function fire(angle) {

    let len = 40;
    //let shooter = player === 1 ? tank1 : tank2;

    const projectileData = {
        x: shooter.barrel.x2,
        y: shooter.barrel.y2,
        velocityX: cos(angle) * speed,
        velocityY: sin(angle) * speed,
        barrelAngle: angle,
        shooterPosition: shooter.position,
        timestamp: Date.now()
    };

    socket.emit('projectileFired', projectileData);

    // Add to local projectiles immediately
    const projectileId = `local-${Date.now()}`;
    projectiles.set(projectileId, {
        ...projectileData,
        id: projectileId,
        lastUpdate: Date.now(),
        lastX: projectileData.x,
        lastY: projectileData.y,
        renderX: projectileData.x,
        renderY: projectileData.y
    });

    isShooting = true;
}

function simulateLanding(angle, shooter) {
    let x = shooter.tower.x + cos(angle) * 40;
    let y = shooter.tower.y + sin(angle) * 40;
    let vx = cos(angle) * speed;
    let vy = sin(angle) * speed;

    const windEffect = wind;

    while (y < height - groundHeight) {
        vx += (-airFriction * vx + windEffect);
        vy += (-airFriction * vy + gravity);
        x += vx;
        y += vy;
    }
    return x;
}

// Update drawBody to handle sprite textures
function drawBody(body) {
    push();
    translate(body.position.x, body.position.y);
    rotate(body.angle);

    // Check if body has a sprite texture
    if (body.render.sprite?.texture) {
        const sprite = body.render.sprite;
        const img = sprite.texture;
        const w = body.bounds.max.x - body.bounds.min.x;
        const h = body.bounds.max.y - body.bounds.min.y;

        // Calculate texture coordinates based on Matter.js sprite parameters
        const sx = (sprite.xOffset - sprite.xScale / 2) * img.width;
        const sy = (sprite.yOffset - sprite.yScale / 2) * img.height;
        const sw = img.width * sprite.xScale;
        const sh = img.height * sprite.yScale;

        imageMode(CENTER);
        image(img, 0, 0, w, h, sx, sy, sw, sh);
    }
    else if (body.circleRadius) {
        fill(100);
        ellipse(0, 0, body.circleRadius * 2);
    } else {
        fill(100);
        rectMode(CENTER);
        rect(0, 0,
            body.bounds.max.x - body.bounds.min.x,
            body.bounds.max.y - body.bounds.min.y
        );
    }
    pop();
}

// Update triggerExplosion to create wheels with proper sprite settings
function triggerExplosion(tank, position) {
    if (tank.exploded) return;
    tank.exploded = true;

    // Create explosion particles
    const explosionX = position ? position.x : tank.tower.x;
    const explosionY = position ? position.y : tank.tower.y;

    for (let i = 0; i < 30; i++) {
        explosionParticles.push({
            x: explosionX,
            y: explosionY,
            radius: random(5, 15),
            vx: random(-5, 5),
            vy: random(-10, 0),
            life: 100
        });
    }

    // Create physics bodies with sprite textures
    tank.frame = Matter.Bodies.rectangle(tank.frame.x, tank.frame.y, tank.frame.w, tank.frame.h);
    tank.tower = Matter.Bodies.rectangle(
        tank.tower.x,
        tank.tower.y,
        tank.tower.w,
        tank.tower.h,
        {
            render: {
                sprite: {
                    texture: rCaterpillarImg,
                    xScale: tank.wheels.w / rTowerImg.width,
                    yScale: tank.wheels.h / rTowerImg.height,
                    xOffset: 0.5,
                    yOffset: 0.5
                }
            }
        }
    );
    tank.wheels = Matter.Bodies.rectangle(
        tank.wheels.x,
        tank.wheels.y,
        tank.wheels.w,
        tank.wheels.h,
        {
            render: {
                sprite: {
                    texture: rCaterpillarImg,
                    xScale: tank.wheels.w / rCaterpillarImg.width,
                    yScale: tank.wheels.h / rCaterpillarImg.height,
                    xOffset: 0.5,
                    yOffset: 0.5
                }
            }
        }
    );

    let parts = [tank.frame, tank.tower, tank.wheels];
    for (let part of parts) {
        Matter.World.add(world, part);
        Matter.Body.setStatic(part, false);
        Matter.Body.applyForce(part, part.position,
            Matter.Vector.create(random(-0.02, 0.02), random(-0.02, -0.01)));
        Matter.Body.setAngularVelocity(part, random(-0.2, 0.2));
        explosionBodies.push(part);
    }
}

// function drawBody(body) {
//   push();
//   translate(body.position.x, body.position.y);
//   rotate(body.angle);
//   fill(100);
//   if (body.circleRadius) {
//     ellipse(0, 0, body.circleRadius * 2);
//   } else {
//     let w = body.bounds.max.x - body.bounds.min.x;
//     let h = body.bounds.max.y - body.bounds.min.y;
//     rectMode(CENTER);
//     rect(0, 0, w, h);
//   }
//   pop();
// }




function drawConnection(ctx, fromNode, toNode, weight, container) {
    if (!ctx || !fromNode || !toNode || !container) return;
    ////console.log("871");
    try {
        const fromRect = fromNode.getBoundingClientRect();
        const toRect = toNode.getBoundingClientRect();
        const containerRect = container.getBoundingClientRect();

        // Calculate positions relative to container
        const fromX = fromRect.left - containerRect.left + fromRect.width / 2;
        const fromY = fromRect.top - containerRect.top + fromRect.height / 2;
        const toX = toRect.left - containerRect.left + toRect.width / 2;
        const toY = toRect.top - containerRect.top + toRect.height / 2;

        // Dynamic line properties
        const lineWidth = Math.max(0.5, Math.min(5, Math.abs(weight) * 3));
        const alpha = Math.min(0.9, Math.max(0.1, Math.abs(weight) * 1.5));
        const color = weight > 0 ?
            `rgba(0, 200, 0, ${alpha})` :
            `rgba(200, 0, 0, ${alpha})`;

        // Draw connection
        ctx.beginPath();
        ctx.moveTo(fromX, fromY);
        ctx.lineTo(toX, toY);
        ctx.strokeStyle = color;
        ctx.lineWidth = lineWidth;
        ctx.stroke();
    } catch (error) {
        console.error('Error drawing connection:', error);
    }
}



function drawConnection(ctx, fromNode, toNode, weight, container) {
    ////console.log("905");
    if (!ctx || !fromNode || !toNode || !container) return;

    try {
        const fromRect = fromNode.getBoundingClientRect();
        const toRect = toNode.getBoundingClientRect();
        const containerRect = container.getBoundingClientRect();

        const fromX = fromRect.left + fromRect.width / 2 - containerRect.left;
        const fromY = fromRect.top + fromRect.height / 2 - containerRect.top;
        const toX = toRect.left + toRect.width / 2 - containerRect.left;
        const toY = toRect.top + toRect.height / 2 - containerRect.top;

        const lineWidth = Math.max(0.5, Math.min(5, Math.abs(weight) * 3));
        const alpha = Math.min(0.9, Math.max(0.1, Math.abs(weight) * 1.5));
        const color = weight > 0 ?
            `rgba(0, 200, 0, ${alpha})` :
            `rgba(200, 0, 0, ${alpha})`;

        ctx.beginPath();
        ctx.moveTo(fromX, fromY);
        ctx.lineTo(toX, toY);
        ctx.strokeStyle = color;
        ctx.lineWidth = lineWidth;
        ctx.stroke();
    } catch (error) {
        console.error('Error drawing connection:', error);
    }
}

// Helper function to create a neural network layer
function createLayer(label, nodeCount) {
    const layer = document.createElement('div');
    layer.className = 'nn-layer';
    layer.style.display = 'flex';
    layer.style.flexDirection = 'column';
    layer.style.gap = nodeCount > 5 ? '10px' : '20px';
    layer.style.alignItems = 'center';

    // const labelElement = document.createElement('div');
    // labelElement.className = 'nn-layer-label';
    // labelElement.style.textAlign = 'center';
    // labelElement.style.fontWeight = 'bold';
    // labelElement.textContent = label;
    // layer.appendChild(labelElement);

    const nodes = [];
    const activations = label === 'Input Layer' ?
        lastNetworkState.inputs :
        (label === 'Hidden Layer' ? lastNetworkState.hidden : [lastNetworkState.output]);

    for (let i = 0; i < nodeCount; i++) {
        const activation = activations[i] || 0;
        const node = document.createElement('div');
        node.className = 'nn-node';
        node.style.width = '30px';
        node.style.height = '30px';
        node.style.borderRadius = '50%';
        node.style.display = 'flex';
        node.style.justifyContent = 'center';
        node.style.alignItems = 'center';

        // Different colors for different layers
        if (label === 'Input Layer') {
            node.style.backgroundColor = `rgba(0, 100, 255, ${Math.min(1, Math.abs(activation))})`;
        } else if (label === 'Hidden Layer') {
            node.style.backgroundColor = `rgba(0, 200, 100, ${Math.min(1, Math.abs(activation))})`;
        } else {
            node.style.backgroundColor = `rgba(200, 0, 0, ${Math.min(1, Math.abs(activation))})`;
        }

        node.style.border = '1px solid rgba(0, 0, 0, 0.3)';
        node.innerHTML = `<div style="font-size:10px;color:white;text-shadow:0 0 2px black;">${activation.toFixed(2)}</div>`;
        layer.appendChild(node);
        nodes.push(node);
    }

    return { element: layer, nodes };
}
///////////////
// Global variables for canvas persistence
let nnCanvas, nnCtx;
let lastWeights = null;

function drawNeuralNetwork() {
    const viz = document.getElementById('nnVisualization');
    if (!viz) return;

    // Initialize canvas if not exists
    if (!nnCanvas) {
        viz.innerHTML = '';
        const width = viz.offsetWidth || 800;
        const height = viz.offsetHeight || 400;

        // Create container
        const container = document.createElement('div');
        container.id = 'nn-container';
        container.style.position = 'relative';
        container.style.width = `${width}px`;
        container.style.height = `${height}px`;
        viz.appendChild(container);

        // Create canvas
        nnCanvas = document.createElement('canvas');
        nnCanvas.width = width;
        nnCanvas.height = height;
        nnCanvas.style.position = 'absolute';
        nnCanvas.style.top = '0';
        nnCanvas.style.left = '0';
        nnCanvas.style.zIndex = '1';
        container.appendChild(nnCanvas);
        nnCtx = nnCanvas.getContext('2d');

        // Create layers container
        const layersContainer = document.createElement('div');
        layersContainer.style.display = 'flex';
        layersContainer.style.justifyContent = 'space-around';
        layersContainer.style.alignItems = 'center';
        layersContainer.style.width = '100%';
        layersContainer.style.height = '100%';
        layersContainer.style.position = 'relative';
        layersContainer.style.zIndex = '2';
        container.appendChild(layersContainer);

        // Create layers
        this.inputLayer = createNeuralLayer('Input Layer', 1, lastNetworkState.inputs);
        this.hiddenLayer1 = createNeuralLayer('Hidden Layer 1', mdl.hidden1Size, lastNetworkState.hidden1);
        this.hiddenLayer2 = createNeuralLayer('Hidden Layer 2', mdl.hidden2Size, lastNetworkState.hidden2);
        this.outputLayer = createNeuralLayer('Output Layer', 1, [lastNetworkState.output]);

        layersContainer.appendChild(this.inputLayer.element);
        layersContainer.appendChild(this.hiddenLayer1.element);
        layersContainer.appendChild(this.hiddenLayer2.element);
        layersContainer.appendChild(this.outputLayer.element);

        // Draw initial connections
        drawAllConnections();
    }

    // Update node activations
    updateNodeActivations(this.inputLayer.nodes, lastNetworkState.inputs);
    updateNodeActivations(this.hiddenLayer1.nodes, lastNetworkState.hidden1);
    updateNodeActivations(this.hiddenLayer2.nodes, lastNetworkState.hidden2);
    updateNodeActivations(this.outputLayer.nodes, [lastNetworkState.output]);

    // Only redraw if weights have changed significantly
    if (!weightsEqual(lastWeights, lastNetworkState.weights)) {
        updateConnectionWeights();
        lastWeights = JSON.parse(JSON.stringify(lastNetworkState.weights));
    }
    if (!resizeListenerAttached) {
        window.addEventListener('resize', debounce(handleResize, 100));
        resizeListenerAttached = true;
    }
}
function updateNodeActivations(nodes, activations) {
    nodes.forEach((node, i) => {
        const activation = activations[i] || 0;
        const absActivation = Math.min(1, Math.abs(activation));
        node.textContent = activation.toFixed(2);

        // Update color based on activation
        if (node.classList.contains('input-node')) {
            node.style.backgroundColor = `rgba(0, 100, 255, ${absActivation})`;
        } else if (node.classList.contains('hidden1-node')) {
            node.style.backgroundColor = `rgba(0, 200, 100, ${absActivation})`;
        } else if (node.classList.contains('hidden2-node')) {
            node.style.backgroundColor = `rgba(100, 200, 0, ${absActivation})`;
        } else {
            node.style.backgroundColor = `rgba(200, 0, 0, ${absActivation})`;
        }
    });
}
function weightsEqual(w1, w2) {
    if (!w1 || !w2) return false;
    // Simple comparison - you might want a more sophisticated diff for performance
    return JSON.stringify(w1) === JSON.stringify(w2);
}

function drawAllConnections() {
    // Clear canvas
    nnCtx.clearRect(0, 0, nnCanvas.width, nnCanvas.height);

    // Draw connections from input to first hidden layer
    this.inputLayer.nodes.forEach((inputNode, i) => {
        this.hiddenLayer1.nodes.forEach((hiddenNode, j) => {
            const weight = lastNetworkState.weights.inputToHidden1[j]?.[i] || 0;
            drawNeuralConnection(nnCtx, inputNode, hiddenNode, weight, nnCanvas);
        });
    });

    // Draw connections from first to second hidden layer
    this.hiddenLayer1.nodes.forEach((hidden1Node, j) => {
        this.hiddenLayer2.nodes.forEach((hidden2Node, k) => {
            const weight = lastNetworkState.weights.hidden1ToHidden2[k]?.[j] || 0;
            drawNeuralConnection(nnCtx, hidden1Node, hidden2Node, weight, nnCanvas);
        });
    });

    // Draw connections from second hidden layer to output
    this.hiddenLayer2.nodes.forEach((hiddenNode, j) => {
        const weight = lastNetworkState.weights.hidden2ToOutput[j] || 0;
        drawNeuralConnection(nnCtx, hiddenNode, this.outputLayer.nodes[0], weight, nnCanvas);
    });
}

function updateConnectionWeights() {
    // More efficient: only update line widths without clearing entire canvas
    drawAllConnections();
}

function drawNeuralConnection(ctx, fromNode, toNode, weight, container) {
    if (!ctx || !fromNode || !toNode || !container) return;
    ////console.log("1114")
    try {
        const fromRect = fromNode.getBoundingClientRect();
        const toRect = toNode.getBoundingClientRect();
        const containerRect = container.getBoundingClientRect();

        const fromX = fromRect.left - containerRect.left + fromRect.width / 2;
        const fromY = fromRect.top - containerRect.top + fromRect.height / 2;
        const toX = toRect.left - containerRect.left + toRect.width / 2;
        const toY = toRect.top - containerRect.top + toRect.height / 2;

        // More subtle weight scaling for smoother transitions
        const lineWidth = Math.max(0.3, Math.min(3, Math.abs(weight)));
        const alpha = 0.7; // Fixed alpha for persistent visibility
        const color = weight > 0 ?
            `rgba(0, 200, 0, ${alpha})` :
            `rgba(200, 0, 0, ${alpha})`;

        ctx.beginPath();
        ctx.moveTo(fromX, fromY);
        ctx.lineTo(toX, toY);
        ctx.strokeStyle = color;
        ctx.lineWidth = lineWidth;
        ctx.stroke();
    } catch (error) {
        console.error('Error drawing connection:', error);
    }
}

function createNeuralLayer(label, nodeCount, activations = []) {
    const layer = document.createElement('div');
    layer.className = 'nn-layer';
    layer.style.display = 'flex';
    layer.style.flexDirection = 'column';
    layer.style.alignItems = 'center';
    layer.style.justifyContent = 'space-evenly';
    layer.style.flex = '1';
    layer.style.minHeight = '0';
    layer.style.padding = '5px 0';

    const labelElement = document.createElement('div');
    labelElement.className = 'nn-layer-label';
    labelElement.textContent = label;
    labelElement.style.marginBottom = '5px';
    labelElement.style.flexShrink = '0';
    layer.appendChild(labelElement);

    const nodesContainer = document.createElement('div');
    nodesContainer.style.display = 'flex';
    nodesContainer.style.flexDirection = 'column';
    nodesContainer.style.alignItems = 'center';
    nodesContainer.style.justifyContent = 'space-evenly';
    nodesContainer.style.flex = '1';
    nodesContainer.style.minHeight = '0';
    nodesContainer.style.width = '100%';
    layer.appendChild(nodesContainer);

    const nodes = [];
    for (let i = 0; i < nodeCount; i++) {
        const activation = activations[i] || 0;
        const node = document.createElement('div');
        node.className = 'nn-node';

        // Add specific class for layer identification
        if (label === 'Input Layer') node.classList.add('input-node');
        else if (label === 'Hidden Layer 1') node.classList.add('hidden1-node');
        else if (label === 'Hidden Layer 2') node.classList.add('hidden2-node');
        else node.classList.add('output-node');

        node.style.width = '25px';
        node.style.height = '25px';
        node.style.borderRadius = '50%';
        node.style.display = 'flex';
        node.style.justifyContent = 'center';
        node.style.alignItems = 'center';
        node.style.flexShrink = '0';
        node.style.margin = '2px 0';
        node.style.fontSize = '8px';
        node.style.color = 'white';
        node.style.textShadow = '0 0 1px black';

        // Initial color based on layer type
        const color = label === 'Input Layer' ?
            `rgba(0, 100, 255, ${Math.min(1, Math.abs(activation))}` :
            label === 'Hidden Layer 1' ?
                `rgba(0, 200, 100, ${Math.min(1, Math.abs(activation))}` :
                label === 'Hidden Layer 2' ?
                    `rgba(100, 200, 0, ${Math.min(1, Math.abs(activation))}` :
                    `rgba(200, 0, 0, ${Math.min(1, Math.abs(activation))}`;

        node.style.backgroundColor = color;
        node.style.border = '1px solid rgba(0, 0, 0, 0.3)';
        node.textContent = activation.toFixed(2);
        nodesContainer.appendChild(node);
        nodes.push(node);
    }

    return { element: layer, nodes };
}
let resizeListenerAttached = false;

function handleResize() {
    const viz = document.getElementById('nnVisualization');
    if (!viz || !nnCanvas) return;

    const newWidth = viz.offsetWidth;
    const newHeight = viz.offsetHeight;

    // Resize canvas
    nnCanvas.width = newWidth;
    nnCanvas.height = newHeight;

    // Resize container
    const container = document.getElementById('nn-container');
    if (container) {
        container.style.width = `${newWidth}px`;
        container.style.height = `${newHeight}px`;
    }

    // Redraw connections with updated positions
    drawAllConnections();
}

function debounce(fn, delay) {
    let timeout;
    return function () {
        clearTimeout(timeout);
        timeout = setTimeout(fn, delay);
    };
}

document.getElementById("LR").value = learningRate;
document.getElementById("DE").value = distanceError;
function handleNumber() {
    const LR = document.getElementById("LR").value;
    const DE = document.getElementById("DE").value;

    // Convert input from string to number
    learningRate = Number(LR);
    distanceError = Number(DE);

    // Validate if it's a number

}