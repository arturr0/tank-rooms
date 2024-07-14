// Connect to the /warcaby namespace
const socket = io.connect('https://wiggly-chill-shirt.glitch.me/warcaby');
////////////////////////////////////////////////console.log("warcaby");
let Player;
let room = "";
let playerName;
//let killerActive = null;

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


let Board = [];
let Letters = ["A", "B", "C", "D", "E", "F", "G", "H"];
let Numbers = []
let freeBoard;
let Kills = [];



let killsOpt = [];

function Area(rectCenter, rectCenterY, row, column, isBlack, free, letter, number, queen, check) {
  this.rectCenter = rectCenter;
  this.rectCenterY = rectCenterY;
  this.row = row;
  this.column = column;
  this.isBlack = isBlack;
  this.free = free;
  this.letter = letter;
  this.number = number;
  this.queen = false;
  this.check = false;
}

let areaCenter = 64;
let row = 0;
let column = 0;

//let targetPos;
let movingPawn = null;
let pawnCompletedMove = false;
let isPawnMoving = false;

let RedMove = false;
let GreenMove = false;



let check = false;
let bothCompleted = false;

let killer = "";

let Pawns = [];

let current;

let Greenturn = false;
let turn;

let killConditions = [];
let killConditionsUnique = [];
let killersOptModeArray = [];
let killedOptModeArray = [];
let oneKiller2KilledArray = [];
let killedCollisionChoose = [];
let killerCollisionChoose = [];
let killersOptMode = false;
let killedOpt = [];
let killedOptMode = false;
let oneKiller2Killed = false;
let killedCollision = false;
let blockKill = false;
let blockKilledPawn = null;
let blockKillersPawn = null;
let releaseBlock = false;
//let killerSelected = null;
let queenKillConditions = [];
let uniqueQueenKillConditions = [];
let chooseBoard = [];
let blockChooseLengh = false;
let message;

// let pawnLetter;
// let pawnNumber;

function Pawn(rectCenter, rectCenterY, row, column, isRed, queen, live, killer, killed, kill1Killed2, letter, number, queensAreas, index, rowCopy, columnCopy) {
    this.rectCenter = rectCenter;
    this.rectCenterY = rectCenterY;
    this.row = row;
    this.column = column;
    this.isRed = isRed;
    this.queen = queen;
    this.live = true;
    this.killer = false;
    this.killed = false;
    this.kill1Killed2 = false;
    this.letter = letter;
    this.number = number;
    this.pos = createVector(rectCenter, rectCenterY);
    this.targetPos = null;
    this.queensAreas = [];
    this.index = index;
    this.rowCopy = rowCopy;
    this.columnCopy = columnCopy;
    this.liveCopy = [];
    this.killed2 = false;
    this.update = function() {
      if (this.targetPos) {
        let vel = p5.Vector.sub(this.targetPos, this.pos);
        if (vel.mag() > 1 && this.live) {
          vel.setMag(1);
          this.pos.add(vel);
          pawnCompletedMove = false;
        } else {
          this.pos = this.targetPos.copy();
          this.targetPos = null;
          this.rectCenter = this.pos.x;
          this.rectCenterY = this.pos.y;
          pawnCompletedMove = true; // Mark the move as completed
        }
      }
    };
  
    if (this.isRed) {
      this.rectangleImage = rectangleRedImage;
    } else {
      this.rectangleImage = rectangleGreenImage;
    }
  
    this.show = function() {
      // Draw the pawn image centered on its position
      image(this.rectangleImage, this.pos.x - 25, this.pos.y - 25, 50, 50);
      
      // Draw the Fontello icon if the pawn is a queen
      if (this.queen) {
        noStroke()
        textFont(fontello);
        textSize(30);
        textAlign(CENTER, CENTER);
        fill(255);
        text('\ue844', this.pos.x, this.pos.y);
      }
      
      // Draw the index text on top of the pawn image
      noStroke();
      textFont('Arial');
      textSize(15);
      textAlign(CENTER, CENTER);
      fill(0); // Set to black to ensure visibility
      text(this.index, this.pos.x, this.pos.y + (this.queen ? 20 : 0)); // Slightly offset the index text to avoid overlapping with the icon if queen
  
      // if (((Player == 1 && !Greenturn) || (Player == 2 && Greenturn)) && (this.killer || this.killed || this.kill1Killed2)) {
      //   noFill();
      //   strokeWeight(10);
      //   stroke(this.killer ? 'blue' : 'gray');
      // } else {
      //   noFill();
      //   noStroke();
      // }
  
      // circle(this.pos.x, this.pos.y, 50);
  
      // if (this.queen) {
      //   noFill();
      //   strokeWeight(6);
      //   if (this.killer) {
      //     stroke(0, 0, 255);
      //   } else if (this.killed || this.kill1Killed2) {
      //     stroke(128, 128, 128);
      //   }
      //   circle(this.pos.x, this.pos.y, 54);
      // }
    };
  }
  
  
  


let X;
let Y;
let pawnSelected = false;
let pawnPlayed;


// socket.on('player', function(PLAYER) {
//   Player = PLAYER;
//   document.dispatchEvent(new Event('socketConnected'));

//   //////////////////////////////////////////////////console.log(Player);
// });

socket.on('update message kill', function(MES, PLAYED, LETTER, NUMBER, LETTER_LOOSER, NUMBER_LOOSER) {
  const newSpan = document.createElement('span');
  newSpan.className = 'message_kill';
  newSpan.textContent = `PAWN ${LETTER}${NUMBER} CAPTURES ON ${LETTER_LOOSER}${NUMBER_LOOSER}`;

  if (PLAYED) {
    newSpan.style.color = 'red';
  } else {
    newSpan.style.color = 'green';
  }

  document.getElementById('history').appendChild(newSpan);
  jQuery("#history").scrollTop(jQuery("#history")[0].scrollHeight);
});

socket.on('update message move', function(MES, PLAYED, LETTER, NUMBER, LETTER_BOARD, NUMBER_BOARD) {
  const newSpan = document.createElement('span');
  newSpan.className = 'message_move';
  newSpan.textContent = `PAWN ${LETTER}${NUMBER} TO ${LETTER_BOARD}${NUMBER_BOARD}`;

  if (PLAYED) {
    newSpan.style.color = 'red';
  } else {
    newSpan.style.color = 'green';
  }

  document.getElementById('history').appendChild(newSpan);
  jQuery("#history").scrollTop(jQuery("#history")[0].scrollHeight);
});


socket.on('both completed', function() {
  bothCompleted = true;
  console.log('socket on both completed', bothCompleted);
});
socket.on('new turn', function(TURN) {
  console.log('new turn condition', killConditions.length);
    //////console.log('new turn unique', killConditionsUnique.length)
  Greenturn = TURN;
  generateQueensAreas(false);
  kill(blockKilledPawn, blockKillersPawn, false);
  killOpt(killConditionsUnique, false);
  stepKill(killConditionsUnique);

  ////////////////console.log('socket turn', Greenturn);
});

socket.on('update multikill', function(KILLER_MODE, KILLED_MODE, KILLED2, PAWNS) {
for (let i = 0; i < PAWNS.length; i++) {
    
    Pawns[i].killer = PAWNS[i].killer;
    Pawns[i].killed = PAWNS[i].killed;
    Pawns[i].kill1Killed2 = PAWNS[i].kill1Killed2;

    
    }
  
  killersOptMode = KILLER_MODE;
  killedOptMode = KILLED_MODE;
  oneKiller2Killed = KILLED2;
  //killConditionsUnique = [];
  for (let i = 0; i < killConditionsUnique.length; i++)
    // for (let j = 0; j < killersOpt.length; j++)
    //   if (killConditionsUnique[i][0] == killersOpt[j][0] && killConditionsUnique[i][1] == killersOpt[j][1]) {
    //     ////////////////////////////////////////////////////////////////////////console.log("delete");
    //     //killConditionsUnique.splice(i, 1);
    //     //////////console.log('splice killer mode', killConditionsUnique);
    //   }
      ////////////////////console.log('update killer mode', killConditionsUnique);
  killersOptModeArray = [];
  killedOptModeArray = [];
  oneKiller2KilledArray = [];
  ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////console.log(Player);
});
// socket.on('update killed mode', function(KILLED_MODE, PAWNS) {
//   for (let i = 0; i < PAWNS.length; i++) {
      
//       Pawns[i].killed = PAWNS[i].killed;
//       Pawns[i].kill1Killed2 = PAWNS[i].kill1Killed2; 
      
//       }
    
//     killedOptMode = KILLED_MODE;
//     //killConditionsUnique = [];
//     for (let i = 0; i < killConditionsUnique.length; i++)
//       for (let j = 0; j < killersOpt.length; j++)
//         if (killConditionsUnique[i][0] == killersOpt[j][0] && killConditionsUnique[i][1] == killersOpt[j][1]) {
//           ////////////////////////////////////////////////////////////////////////console.log("delete");
//           //killConditionsUnique.splice(i, 1);
//           //////////console.log('splice killed mode', killConditionsUnique);
//         }
//         ////////////////////console.log('update killed mode', killConditionsUnique);
//     killersOpt = [];
//     ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////console.log(Player);
//   });
  // socket.on('animate', function(data) {
  //   let newPos = createVector(data.x, data.y);
  //   let targetPawn = Pawns.find(pawn => pawn.rectCenter === data.oldX && pawn.rectCenterY === data.oldY && pawn.live);
  //   //////////////////////console.log(targetPawn);
  //   if (targetPawn) {
  //     //////////////////////console.log("animate");  // Debug log to confirm animation trigger
  //     targetPawn.targetPos = newPos;
  //     movingPawn = targetPawn;
  //   }
  // });
  socket.on('update kille1killed2 mode', function(KILLED2, PAWNS) {
    for (let i = 0; i < PAWNS.length; i++) {
        
        //Pawns[i].killed = PAWNS[i].killed;
        Pawns[i].kill1Killed2 = PAWNS[i].kill1Killed2; 
        
        }
      
      oneKiller2Killed = KILLED2;
      //killConditionsUnique = [];
      for (let i = 0; i < killConditionsUnique.length; i++)
        for (let j = 0; j < killersOpt.length; j++)
          if (killConditionsUnique[i][0] == killersOpt[j][0] && killConditionsUnique[i][1] == killersOpt[j][1]) {
            ////////////////////////////////////////////////////////////////////////console.log("delete");
            //killConditionsUnique.splice(i, 1);
            //////////console.log('splice killed mode', killConditionsUnique);
          }
          ////////////////////console.log('update killed mode', killConditionsUnique);
      killersOpt = [];
      ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////console.log(Player);
    });
    // socket.on('animate', function(data) {
    //   let newPos = createVector(data.x, data.y);
    //   let targetPawn = Pawns.find(pawn => pawn.rectCenter === data.oldX && pawn.rectCenterY === data.oldY && pawn.live);
    //   //////////////////////console.log(targetPawn);
    //   if (targetPawn) {
    //     //////////////////////console.log("animate");  // Debug log to confirm animation trigger
    //     targetPawn.targetPos = newPos;
    //     movingPawn = targetPawn;
    //   }
    // });
  socket.on('animate', function(data, PAWN) {
    let newPos = createVector(data.x, data.y);
    let targetPawn = Pawns[PAWN];
    //////////////////////console.log(targetPawn);
    
      //////////////////////////////console.log("animate");  // Debug log to confirm animation trigger
      targetPawn.targetPos = newPos;
      movingPawn = targetPawn;
    
  });

socket.on('new state', function(BOARD, PAWNS, PLAY) {
  //Greenturn = TURN;
  //////////////////////////////////////////console.log(Greenturn);
  for (let i = 0; i < BOARD.length; i++) {
    Board[i].free = BOARD[i].free;
    Board[i].row = BOARD[i].row;
    Board[i].column = BOARD[i].column;
    Board[i].queen = BOARD[i].queen;

  }
  for (let i = 0; i < PAWNS.length; i++) {
    Pawns[i].row = PAWNS[i].row;
    Pawns[i].column = PAWNS[i].column;
    Pawns[i].letter = PAWNS[i].letter;
    Pawns[i].number = PAWNS[i].number;
    Pawns[i].live = PAWNS[i].live;
    Pawns[i].isRed = PAWNS[i].isRed;
    Pawns[i].killer = PAWNS[i].killer;
    Pawns[i].queen = PAWNS[i].queen;
    
  }
  //kill(blockKilledPawn, blockKillersPawn);
  //Greenturn = TURN;
  
  movingPawn = Pawns[PLAY];
  //killConditionsUnique = KILL;
  ////////////////////console.log('new state', killConditionsUnique);
  //if (Pawns[PLAY].isBlack == Greenturn) killConditionsUnique = [];
  //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////console.log(PLAY);
  //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////console.log(movingPawn);
});

socket.on('update blockKill false', function(BLOCK_KILL, BLOCK_KILL_PAWN, RELEASE_BLOCK, KILL_MODE) {
  blockKill = BLOCK_KILL;
  blockKilledPawn = BLOCK_KILL_PAWN;
  releaseBlock = RELEASE_BLOCK;
  ////console.log('releaseBlock update blockKill false', releaseBlock)
  killmode = KILL_MODE;
  
});
let fontello;
function preload() {
  img = loadImage('https://cdn.glitch.global/fff0ab6e-ad98-4f3d-b97f-dbb6110b1226/board%20s.png?v=1719875467902');
  bgImage = loadImage('https://cdn.glitch.global/fff0ab6e-ad98-4f3d-b97f-dbb6110b1226/background%20s.jpg?v=1719875628156');// Load the image from a URL
  rectangleRedImage = loadImage('https://cdn.glitch.global/fff0ab6e-ad98-4f3d-b97f-dbb6110b1226/pawn%20red.png?v=1719924039026');
  rectangleGreenImage = loadImage('https://cdn.glitch.global/fff0ab6e-ad98-4f3d-b97f-dbb6110b1226/pawn%20green1.png?v=1719924025057');
  fontello = loadFont('public/font/fontello.ttf');
}
function setup() {
    const myCanvas = createCanvas(576, 576);
    myCanvas.style('border-radius', '15px');
    myCanvas.parent('game');
    generateQueensAreas(false);
    turn = select('#turn');
    let PlayerInfo = select('#player');
    
    if (Player == 2) {document.getElementById("player").style.color = "green"; PlayerInfo.value("GREEN");}
    else if (Player == 1) {document.getElementById("player").style.color = "red"; PlayerInfo.value("RED");}
    killer = select('#kill');
    rectMode(CENTER);
    
  
    let isBlack = true;
    for (let i = 0; i < 8; i++)
      Numbers.push(i + 1);
  
    for (let i = 0; i < 8; i++) {
      row++;
      column = 0;
      isBlack = !isBlack;
  
      for (let j = 0; j < 8; j++) {
        let rectCenter = (column * 64 + 32) + 32;
        column++;
        let area = new Area(rectCenter, (row * 64 - 32) + 32, row, column, isBlack, true, Letters[j], Numbers[i]);
        Board.push(area);
        
        isBlack = !isBlack;
      }
    }
    //bbb
    //f(rectCenter, rectCenterY, row, column, isRed, queen, live, killer, killed, letter, number)
    for (let j = 0; j < Board.length; j++) {
      //if (Board[j].isBlack && Board[j].row < 4) {
      if ([1].includes(j)) {
        Board[j].free = false;
        let pawn = new Pawn(Board[j].rectCenter, (Board[j].row * 64 - 32) + 32, Board[j].row, Board[j].column, true, false, true, false, false, false, Board[j].letter, Board[j].number);
        pawn.queen = true;
        Pawns.push(pawn);
        //generateQueensAreas()
      //} else if (Board[j].isBlack && Board[j].row > 5) {
      }  
      if ([3].includes(j)) {
          Board[j].free = false;
          let pawn = new Pawn(Board[j].rectCenter, (Board[j].row * 64 - 32) + 32, Board[j].row, Board[j].column, true, false, true, false, false, false, Board[j].letter, Board[j].number);
          pawn.queen = true;
          Pawns.push(pawn);
          //generateQueensAreas()
        //} else if (Board[j].isBlack && Board[j].row > 5) {
      } 
      else if ([10,37,12,26,35].includes(j)) {
        Board[j].free = false;
        let pawn = new Pawn(Board[j].rectCenter, (Board[j].row * 64 - 32) + 32, Board[j].row, Board[j].column, false, false, true, false, false, false, Board[j].letter, Board[j].number);
        Pawns.push(pawn);
      }
    }
    for (let i = 0; i < Pawns.length; i++) Pawns[i].index = i;
    // Board[58].free = true;
    // Pawns[8].queen = true;
    // Pawns[11].queen = true;
    // Pawns[14].queen = true;
    //generateQueensAreas();
  }
let angle = 0;

let angleKiller = 0;
let angleKilled = 0;

function draw() {
  turn.value(Greenturn);
  let PlayerInfo = select('#player');

  if (Player == 2) {
    document.getElementById("player").style.color = "green";
    PlayerInfo.value("PLAYER GREEN");
  } else if (Player == 1) {
    document.getElementById("player").style.color = "red";
    PlayerInfo.value("PLAYER RED");
  }

  if (Greenturn) document.getElementById("turn").style.color = "green";
  else document.getElementById("turn").style.color = "red";

  background(bgImage);

  // Draw additional images on the canvas
  image(img, 32, 32, 256, 256);
  image(img, 288, 32, 256, 256);
  image(img, 32, 288, 256, 256);
  image(img, 288, 288, 256, 256);

  image(img, 32, -224, 256, 256);
  image(img, 288, -224, 256, 256);
  image(img, 32, 544, 256, 256);
  image(img, 288, 544, 256, 256);
  image(img, -224, 32, 256, 256);
  image(img, -224, 288, 256, 256);
  image(img, 544, 32, 256, 256);
  image(img, 544, 288, 256, 256);

  for (let i = 0; i < Pawns.length; i++) {
    if (Pawns[i].live) {
      Pawns[i].show();
    }
  }

  for (let i = 0; i < Letters.length; i++) {
    noStroke();
    textSize(20);
    textStyle(BOLD);
    textAlign(CENTER, CENTER);
    if (i % 2 == 0) fill(255);
    else fill(0);
    text(Letters[i], 64 + i * 64, 16);
    if (i % 2 == 0) fill(0);
    else fill(255);
    text(Letters[i], 64 + i * 64, 562);
  }

  for (let i = 0; i < Numbers.length; i++) {
    noStroke();
    textSize(20);
    textStyle(BOLD);
    textAlign(CENTER, CENTER);
    if (i % 2 == 0) fill(255);
    else fill(0);
    text(Numbers[i], 14, 64 + i * 64);
    if (i % 2 == 0) fill(0);
    else fill(255);
    text(Numbers[i], 562, 64 + i * 64);
  }

  if (movingPawn) {
    movingPawn.update();
    movingPawn.show();
  }

  if (/*killersOptMode ||*/killedCollision) {
    for (let i = 0; i < Pawns.length; i++) {
      if (Pawns[i].killer || Pawns[i].killed2) {
        push(); // Save current transformation state
        translate(Pawns[i].rectCenter, Pawns[i].rectCenterY);
        rotate(angleKiller);
        // Draw the rotated gradient circle stroke
        drawGradientCircle(0, 0, 25, "killer");
        pop(); // Restore original transformation state
      }
    }
    angleKiller += 0.05; // Adjust speed here
  }
  
  if (killedOptMode || oneKiller2Killed) {
    for (let i = 0; i < Pawns.length; i++) {
      if (Pawns[i].killed || Pawns[i].kill1Killed2) {
        push(); // Save current transformation state
        translate(Pawns[i].rectCenter, Pawns[i].rectCenterY);
        rotate(angleKilled);
        // Draw the rotated gradient circle stroke
        drawGradientCircle(0, 0, 25, "killed");
        pop(); // Restore original transformation state
      }
    }
    angleKilled += 0.03; // Adjust speed here
  }

  if (bothCompleted) {
    if ((Player == 1 && !Greenturn) || (Player == 2 && Greenturn)) {
      socket.emit('turn', Greenturn, check, room);
    }
    bothCompleted = false;
  }

  if (pawnCompletedMove) {
    movingPawn = null;
    pawnCompletedMove = false;
    isPawnMoving = false;
    socket.emit('complete', Player, room);
    return;
  }

  for (let i = 0; i < Board.length; i++) {
    if (Board[i].free && Board[i].isBlack) {
      strokeWeight(1);
      stroke(255);
      noFill();
      rect(Board[i].rectCenter, Board[i].rectCenterY, 55, 55);
    }
    if (Board[i].check) {
      strokeWeight(1);
      stroke(255, 0, 0);
      noFill();
      rect(Board[i].rectCenter, Board[i].rectCenterY, 70, 70);
    }
  }
  for (let i = 0; i < Board.length; i++)
    if (Board[i].isBlack){
        noStroke();
        fill(255);
        
        textSize(13);
        text(i, Board[i].rectCenter - 25, Board[i].rectCenterY - 25);
    }
  
}

function mouseClicked() {
  X = mouseX;
  Y = mouseY;
  ////////////////////////////////console.log(`killedOptMode: ${killedOptMode} killersOptMode: ${killersOptMode}`)
  // Check if a pawn is clicked
  for (let i = 0; i < Pawns.length; i++) {
    let p = Pawns[i];
    if (!isPawnMoving && (!killedOptMode && !killersOptMode && !oneKiller2Killed) && ((p.isRed && !Greenturn && Player == 1) || (!p.isRed && Greenturn  && Player == 2)) && p.live &&
        X > p.rectCenter - 32 && X < p.rectCenter + 32 && Y > p.rectCenterY - 32 && Y < p.rectCenterY + 32) {
      pawnSelected = true;
      pawnPlayed = i;
      //console.log(pawnPlayed)
      //generateQueensAreas(i);
      ////////////////////////////////console.log(pawnPlayed);
      return;
    }
  }

  for (let k = 0; k < Board.length; k++) {
    if (pawnSelected && Pawns[pawnPlayed].row == Board[k].row && Pawns[pawnPlayed].column == Board[k].column && Pawns[pawnPlayed].live) {
      freeBoard = k;
    }
  }
  //generateQueensAreas();
  // Check if a valid move is made
  if (pawnSelected) {
    
    //check = true;
    
    for (let j = 0; j < Board.length; j++) {
      if (Board[j].isBlack &&
        X > Board[j].rectCenter - 32 && X < Board[j].rectCenter + 32 &&
        Y > Board[j].rectCenterY - 32 && Y < Board[j].rectCenterY + 32 &&
        Board[j].free &&
        (
          (
            Pawns[pawnPlayed].isRed &&
            Pawns[pawnPlayed].row - Board[j].row == -1 &&
            (
              Pawns[pawnPlayed].column - Board[j].column == 1 ||
              Pawns[pawnPlayed].column - Board[j].column == -1
            )
          ) ||
          (
            !Pawns[pawnPlayed].isRed &&
            Pawns[pawnPlayed].row - Board[j].row == 1 &&
            (
              Pawns[pawnPlayed].column - Board[j].column == 1 ||
              Pawns[pawnPlayed].column - Board[j].column == -1
            )
          ) ||
          (
            Pawns[pawnPlayed].queen &&
            Pawns[pawnPlayed].queensAreas.find(board => board[0] == Board[j].row && board[1] == Board[j].column)
          )
        )
    ) {
              //Greenturn = !Greenturn;
        ////////////////////////////////console.log(Pawns[pawnPlayed]);
        //pawnActive = pawnPlayed;
        let pawnLetter = Pawns[pawnPlayed].letter;
        let pawnNumber = Pawns[pawnPlayed].number;
        let boardLetter = Board[j].letter;
        let boardNumber = Board[j].number;
        let played = Pawns[pawnPlayed].isRed;
        message = "move";
        socket.emit('message move', message, played, pawnLetter, pawnNumber, boardLetter, boardNumber, room);
        Board[freeBoard].free = true;
        let targetPos = createVector(Board[j].rectCenter, Board[j].rectCenterY);
        let movingPawnOldPos = { x: Pawns[pawnPlayed].rectCenter, y: Pawns[pawnPlayed].rectCenterY };
        Pawns[pawnPlayed].targetPos = targetPos;
        movingPawn = Pawns[pawnPlayed];
        Pawns[pawnPlayed].row = Board[j].row;
        Pawns[pawnPlayed].column = Board[j].column;
        Pawns[pawnPlayed].letter = Board[j].letter;
        Pawns[pawnPlayed].number = Board[j].number;
        Board[j].free = false;
        let animatedPawn = pawnPlayed
        check = false;
        ////////////console.log('pawnSelected', check)
        current = pawnPlayed;
        checkQueen();
        //generateQueensAreas(pawnPlayed);
        let serializedPawns = serializePawns(Pawns);
        socket.emit('state', Board, serializedPawns, Greenturn, check, current, room); // Send the move to the server
        socket.emit('move', { 
          x: targetPos.x, 
          y: targetPos.y, 
          oldX: movingPawnOldPos.x, 
          oldY: movingPawnOldPos.y 
        }, room, animatedPawn);
        pawnSelected = false;
        isPawnMoving = true;
        // generateQueensAreas();
        //Greenturn = !Greenturn;
      }
    }
  }
  // killersOpt.push(killConditionsUnique[i]);
  // killersOpt.push(killConditionsUnique[i + 1]);
  if (killersOptMode) {
    ////////////////////console.log(`killersOptMode: killedOptMode: ${killedOptMode} killersOptMode ${killersOptMode} oneKiller2Killed ${oneKiller2Killed}`)
    ////////////////////console.log('killersOptModeArray', killersOptModeArray);
    ////////////////////console.log('killConditionsUnique outside for loop', killConditionsUnique);
    for (let i = 0; i < killersOptModeArray.length; i++) {
      ////////////////////console.log('for killersOptMode')
      
      
      if (((killersOptModeArray[i][3] && !Greenturn && Player == 1) || (!killersOptModeArray[i][3] && Greenturn  && Player == 2)) &&
          X > killersOptModeArray[i][5] - 32 && X < killersOptModeArray[i][5] + 32 && Y > killersOptModeArray[i][6] - 32 && Y < killersOptModeArray[i][6] + 32) {
            ////////console.log("click");
            
            for (let j = 0; j < killersOptModeArray.length; j++)
              Pawns[killersOptModeArray[j][0]].killer = false;
            for (let j = 0; j < killedOptModeArray.length; j++)
              Pawns[killedOptModeArray[j][1]].killed = false;
            for (let j = 0; j < oneKiller2KilledArray.length; j++)
              Pawns[oneKiller2KilledArray[j][1]].kill1Killed2 = false;
            ////////////////////////////////////////////////////////////////////////////////////////////////////////////////console.log(killersOptModeArray[i]);
            blockKillersPawn = killersOptModeArray[i][0];
            ////////////////////console.log(`blockKillersPawn ${blockKillersPawn}`);
            ////////////////////console.log('killConditionsUnique in killersOptMode', killConditionsUnique);
            for (let j = 0; j < killConditionsUnique.length; j++)
              if (killConditionsUnique[j][0] != blockKillersPawn) {
                //////////////////////////////////////////////////////////////////////////////console.log(killConditionsUnique[j][0]);
                killConditionsUnique.splice(j,1); 
                //////////console.log('splice killersOptMode', killConditionsUnique)
                ////////////////////////////////////////////////////////////////////////////////////////////////////////////////console.log(killersOptModeArray[i][0]);
              }
            //////////////////////////////////////////////////////////////////////for (let z = 0; z < killConditionsUnique.length; z++)
                ////////////console.log(killConditionsUnique[z]);
            killersOptMode = false;
            killedOptMode = false;
            oneKiller2Killed = false;
            ////////////////////console.log('killers killConditionsUnique[0] ', killConditionsUnique[0])
            
            //kill(blockKilledPawn, blockKillersPawn);
            let firstKill = [];
            killConditions = [];
            killConditionsUnique = JSON.parse(JSON.stringify(killUnique(killConditions)));
            console.log('killersOptMode', killConditionsUnique);
            firstKill.push(killersOptModeArray[i])
            killersOptModeArray = [];
            killedOptModeArray = [];
            oneKiller2KilledArray = [];
            //console.log('killersOptMode firstKill', firstKill)
            
            killOpt(firstKill, false);
            stepKill(firstKill);
            //socket.emit('multikill', killersOptMode, killedOptMode, oneKiller2Killed, Pawns, room);
            break;
        }
        
        }
        
  
        //return;
      
    }
//killConditionsUnique.push([k, j, i, Pawns[k].isRed, Greenturn, Pawns[k].rectCenter, Pawns[k].rectCenterY, Pawns[j].rectCenter, Pawns[j].rectCenterY]);
if (killedOptMode) {
  ////////////////////console.log(`killedOptMode: killedOptMode ${killedOptMode} killedOptModeArrayMode ${killedOptModeArrayMode} oneKiller2Killed ${oneKiller2Killed}`)
  
  ////////////////////console.log(killedOptModeArray)
  for (let i = 0; i < killedOptModeArray.length; i++) 
    //////////////////////console.log('for killedOptMode');
    if (((killedOptModeArray[i][3] && !Greenturn && Player == 1) || (!killedOptModeArray[i][3] && Greenturn  && Player == 2)) &&
        X > killedOptModeArray[i][7] - 32 && X < killedOptModeArray[i][7] + 32 && Y > killedOptModeArray[i][8] - 32 && Y < killedOptModeArray[i][8] + 32) {
          //////////////////////////////////////////////////////////console.log("click");
          for(let i = 0; i < killConditionsUnique.length; i++) console.log(killConditionsUnique[i])
          if(chooseDL.length > 0 || chooseDR.length > 0 || chooseUL.length > 0 || chooseUR.length > 0) {console.log("click"); killOpt(killConditionsUnique, true);}
          if(!Pawns[killedOptModeArray[i][1]].oneKiller2Killed)  {
            
            for (let j = 0; j < killedOptModeArray.length; j++)
              Pawns[killedOptModeArray[j][1]].killed = false;
            for (let j = 0; j < killersOptModeArray.length; j++)
              Pawns[killersOptModeArray[j][0]].killer = false;
            for (let j = 0; j < oneKiller2KilledArray.length; j++)
              Pawns[oneKiller2KilledArray[j][1]].kill1Killed2 = false;
            ////////////////////////////////////////////////////////////////////////////////////////////////////////////////console.log(killedOptModeArray[i]);
            let killedSelected = killedOptModeArray[i][1];
            blockKilledPawn = killedOptModeArray[i][0];
            //////////////////////////////////////////////////////////////////////////////console.log(pawnSelected);
            for (let j = 0; j < killConditionsUnique.length; j++)
              if (killConditionsUnique[j][1] != killedSelected && !(chooseDL.length > 0 || chooseDR.length > 0 || chooseUL.length > 0 || chooseUR.length > 0)) {
                //////////////////////////////////////////////////////////////////////////////console.log(killConditionsUnique[j][0]);
                killConditionsUnique.splice(j,1); 
                
                ////////////console.log(killedOptModeArray[i][0]);
                console.log('splice killedOptMode');
                
              }
              //if(chooseDL.length > 0 || chooseDR.length > 0 || chooseUL.length > 0 || chooseUR.length > 0) {console.log("click"); killOpt(killConditionsUnique);}
              
              ////////////////////console.log('killConditionsUnique after splice in killedOptMode', killConditionsUnique)
            //////////////////////////////////////////////////////////////////////for (let z = 0; z < killConditionsUnique.length; z++)
              ////////////console.log(killConditionsUnique[z]);
            killedOptMode = false;
            killersOptMode = false;
            oneKiller2Killed = false;
            
            //killedOptModeArray = [];
            let firstKill = [];
            console.log('killedOptModeArray[i] before push', killedOptModeArray[i]);
            // killConditions = [];
            // killConditionsUnique = JSON.parse(JSON.stringify(killUnique(killConditions)));
            
            firstKill.push(killedOptModeArray[i]);
            //console.log('killedOptMode', firstKill);
            killedOptModeArray = [];
            killersOptModeArray = [];
            oneKiller2KilledArray = [];
            ////////////////////console.log('killedOptModeArray');
            ////////////////////console.log('killedOptModeArray[i] after push', killedOptModeArray[i]);
            ////////////////////console.log('firstKill');
            ////////////////////console.log(firstKill);
            
            //killOpt(firstKill);
            //stepKill(firstKill);
            // socket.emit('multikill', killersOptMode, killedOptMode, oneKiller2Killed, Pawns, room);
            // killConditions = [];
            // killConditionsUnique = JSON.parse(JSON.stringify(killUnique(killConditions)));
            break;
        }
      }
      
      
      

      //return;
    
  }

  if (oneKiller2Killed) {
    
    let click = false;    
  
        for (let i = 0; i < oneKiller2KilledArray.length; i++) {
          if (((oneKiller2KilledArray[i][3] && !Greenturn && Player == 1) || (!oneKiller2KilledArray[i][3] && Greenturn  && Player == 2)) &&
          X > oneKiller2KilledArray[i][7] - 32 && X < oneKiller2KilledArray[i][7] + 32 && Y > oneKiller2KilledArray[i][8] - 32 && Y < oneKiller2KilledArray[i][8] + 32) {
          console.log(oneKiller2KilledArray[i]);
            killedCollisionChoose = oneKiller2KilledArray[i];
          } 
          if (!oneKiller2KilledArray.some(array => array[0] != oneKiller2KilledArray[i][0]) && !Pawns[oneKiller2KilledArray[i][1]].killed) {
              
              console.log("click 2 killed");
              
              for (let j = 0; j < killedOptModeArray.length; j++)
                  Pawns[killedOptModeArray[j][1]].killed = false;
              for (let j = 0; j < killersOptModeArray.length; j++)
                  Pawns[killersOptModeArray[j][0]].killer = false;
              for (let j = 0; j < oneKiller2KilledArray.length; j++)
                  Pawns[oneKiller2KilledArray[j][1]].kill1Killed2 = false;
              
              blockKilledPawn = oneKiller2KilledArray[i][0];
              let chosenKilled = oneKiller2KilledArray[i][1];
              
              killConditionsUnique = killConditionsUnique.filter(condition => condition[1] === chosenKilled);
              
              killedOptMode = false;
              killersOptMode = false;
              oneKiller2Killed = false;
              console.log('1k2k killers killConditionsUnique[0] ', killConditionsUnique[0]);
              
              let firstKill = [];
              // killConditions = [];
              // killConditionsUnique = JSON.parse(JSON.stringify(killUnique(killConditions)));
              for (let k = 0; k < killConditionsUnique.length; k++) {
                  console.log('two killed', killConditionsUnique[k]);
              }
              console.log("end");
              firstKill.push(oneKiller2KilledArray[i]);
              console.log("end");
              oneKiller2KilledArray = [];
              console.log("end");
              console.log('oneKiller2Killed', firstKill);
              console.log("end");
              killedOptModeArray = [];
              console.log("end");
              killersOptModeArray = [];
              console.log("end");
              oneKiller2KilledArray = [];
              console.log(firstKill);
              try {
                  killOpt(firstKill, false);
                  console.log("killOpt executed successfully");
              } catch (error) {
                  console.error("Error executing killOpt:", error);
              }
              console.log("end");
              stepKill(firstKill);
              console.log("end");
              //socket.emit('multikill', killersOptMode, killedOptMode, oneKiller2Killed, Pawns, room);
              click = true;
              console.log("end");
              break; // Break out of the outer loop after processing
          }
          //if (click) break;
          else {
            for (let i = 0; i < killersOptModeArray.length; i++) {
              Pawns[killersOptModeArray[i][0]].killer = false;
            }
            for (let i = 0; i < killedOptModeArray.length; i++)
              Pawns[killedOptModeArray[i][1]].killed = false;
            killersOptMode = false;
            killedOptMode = false;
            killedCollision = true;

            for(let i = 0; i < oneKiller2KilledArray.length; i++)
              if(killedCollisionChoose[0] == oneKiller2KilledArray[i][0] && killedCollisionChoose[1] == oneKiller2KilledArray[i][1]) {
               Pawns[oneKiller2KilledArray[i][0]].killed2 = true;
               killerCollisionChoose.push(oneKiller2KilledArray[i]);
               break;
              }
              killerCollisionChoose = uniqueForSecondExterme(killerCollisionChoose);

          }
      }
      
      
    }
    if(killedCollision) {
      
        //////////////////////console.log('for killedOptMode');
        if (((killedCollisionChoose[3] && !Greenturn && Player == 1) || (!killedCollisionChoose[3] && Greenturn  && Player == 2)) &&
            X > killedCollisionChoose[7] - 32 && X < killedCollisionChoose[7] + 32 && Y > killedCollisionChoose[8] - 32 && Y < killedCollisionChoose[8] + 32)
            console.log(killedCollisionChoose);  
    }
  
}
let playerHasKill = false;
let multipleKillCond = false;
//let multipleKillCondGreen = false;
let previousPlayer = null;
let killCntr = 0;

let downLeftArray = [];
let upLeftArray = [];
let downRightArray = [];
let upRightArray = [];

let maxLeft = [];
let maxRight = [];
let minLeft = [];
let minRight = [];

let chooseDL = [];
let chooseDR = [];
let chooseUL = [];
let chooseUR = [];


//fk
function kill(blockKilledPawn, blockKillersPawn, mode) {

    
  console.log(" ck start dra1 kill", mode);
  for (let j = 0; j < killConditionsUnique.length; j++) console.log("ck kcu", killConditionsUnique[j]); 
  for (let j = 0; j < Pawns.length; j++) {
    for (let k = 0; k < Pawns.length; k++) {
      if (Pawns[j].isRed != Pawns[k].isRed && Pawns[j].live && Pawns[k].live && !Pawns[k].queen &&
          ( (((Player == 1 && Greenturn == false && Pawns[j].isRed == false) || (Player == 2 && Greenturn == true && Pawns[j].isRed == true)))) &&
          ((Pawns[k].row - Pawns[j].row == 1 && Pawns[k].column - Pawns[j].column == 1))) {
        for (let i = 0; i < Board.length; i++) {
          if (blockKilledPawn == null && blockKillersPawn == null && Pawns[j].row - Board[i].row == 1 && Pawns[j].column - Board[i].column == 1 && Board[i].free) {
            for (let i = 0; i < killConditions.length; i++) {
              console.log('before push 1', killConditions[i]);
            }
            killConditions.push([k, j, i, Pawns[k].isRed, Greenturn, Pawns[k].rectCenter, Pawns[k].rectCenterY, Pawns[j].rectCenter, Pawns[j].rectCenterY, false, null, null]);
            for (let i = 0; i < killConditions.length; i++) {
              console.log('after push 1', killConditions[i]);
            }
            //killSwitch(k, j, i, Pawns[k].isRed);
            playerHasKill = true;
            killConditionsUnique = JSON.parse(JSON.stringify(killUnique(killConditions)));
            //killConditionsUnique = killUnique(killConditions);
            // for (let z = 0; z < killConditionsUnique.length; z++)
            //   //////////console.log(killConditionsUnique[z]);
            ////////console.log('push 1', killConditions.length);
            //for (let i = 0; i < killConditionsUnique.length; i++)
            //console.log('unique 1', killConditionsUnique[i]);
            
              
          }
          else if ((k == blockKilledPawn || k == blockKillersPawn) && Pawns[j].row - Board[i].row == 1 && Pawns[j].column - Board[i].column == 1 && Board[i].free) {
            for (let i = 0; i < killConditions.length; i++) {
              console.log('before push 1 block', killConditions[i]);
            }
            killConditions.push([k, j, i, Pawns[k].isRed, Greenturn, Pawns[k].rectCenter, Pawns[k].rectCenterY, Pawns[j].rectCenter, Pawns[j].rectCenterY, false, null, null]);
            for (let i = 0; i < killConditions.length; i++) {
              console.log('after push 1 block', killConditions[i]);
            }
            //killSwitch(k, j, i, Pawns[k].isRed);
            playerHasKill = true;
            killConditionsUnique = JSON.parse(JSON.stringify(killUnique(killConditions)));
            //killConditionsUnique = killUnique(killConditions);
            // for (let z = 0; z < killConditionsUnique.length; z++)
            //   //////////console.log(killConditionsUnique[z]);
            ////////console.log('push 1', killConditions.length);
            //for (let i = 0; i < killConditionsUnique.length; i++)
            //console.log('unique 1', killConditionsUnique[i]);
            
              
          }
        }
      }
      
      //break;
    }
    
      
  }
  for (let j = 0; j < Pawns.length; j++) {
    for (let k = 0; k < Pawns.length; k++) {
      if (Pawns[j].isRed != Pawns[k].isRed && Pawns[j].live && Pawns[k].live && !Pawns[k].queen &&
          ( (((Player == 1 && Greenturn == false && Pawns[j].isRed == false) || (Player == 2 && Greenturn == true && Pawns[j].isRed == true)))) &&
          ((Pawns[k].row - Pawns[j].row == 1 && Pawns[k].column - Pawns[j].column == -1))) {
        for (let i = 0; i < Board.length; i++) {
          if (blockKilledPawn == null && blockKillersPawn == null && Pawns[j].row - Board[i].row == 1 && Pawns[j].column - Board[i].column == -1 && Board[i].free) {
            for (let i = 0; i < killConditions.length; i++) {
              console.log('before push 2', killConditions[i]);
            }
            killConditions.push([k, j, i, Pawns[k].isRed, Greenturn, Pawns[k].rectCenter, Pawns[k].rectCenterY, Pawns[j].rectCenter, Pawns[j].rectCenterY, false, null, null]);
            for (let i = 0; i < killConditions.length; i++) {
              console.log('after push 2', killConditions[i]);
            }
            //killSwitch(k, j, i, Pawns[k].isRed);
            playerHasKill = true;
            killConditionsUnique = JSON.parse(JSON.stringify(killUnique(killConditions)));
            //killConditionsUnique = killUnique(killConditions);
            ////////console.log('push 2', killConditions.length);
            //for (let i = 0; i < killConditionsUnique.length; i++)
            //console.log('unique 2', killConditionsUnique[i]);
            
             
          }
          else if ((k == blockKilledPawn || k == blockKillersPawn) && Pawns[j].row - Board[i].row == 1 && Pawns[j].column - Board[i].column == -1 && Board[i].free) {
            for (let i = 0; i < killConditions.length; i++) {
              console.log('before push 2 block', killConditions[i]);
            }
            killConditions.push([k, j, i, Pawns[k].isRed, Greenturn, Pawns[k].rectCenter, Pawns[k].rectCenterY, Pawns[j].rectCenter, Pawns[j].rectCenterY, false, null, null]);
            for (let i = 0; i < killConditions.length; i++) {
              console.log('after push 2 block', killConditions[i]);
            }
            //killSwitch(k, j, i, Pawns[k].isRed);
            playerHasKill = true;
            killConditionsUnique = JSON.parse(JSON.stringify(killUnique(killConditions)));
            //killConditionsUnique = killUnique(killConditions);
            ////////console.log('push 2', killConditions.length);
            //for (let i = 0; i < killConditionsUnique.length; i++)
            //console.log('unique 2', killConditionsUnique[i]);
            
             
          }
        }
      }
      
      //break;
    }
    
    
  }
  for (let j = 0; j < Pawns.length; j++) {
    for (let k = 0; k < Pawns.length; k++) {
      if (Pawns[j].isRed != Pawns[k].isRed && Pawns[j].live && Pawns[k].live && !Pawns[k].queen &&
          ( (((Player == 1 && Greenturn == false && Pawns[j].isRed == false) || (Player == 2 && Greenturn == true && Pawns[j].isRed == true)))) &&
          ((Pawns[k].row - Pawns[j].row == -1 && Pawns[k].column - Pawns[j].column == 1))) {
        for (let i = 0; i < Board.length; i++) {
          if (blockKilledPawn == null && blockKillersPawn == null && Pawns[j].row - Board[i].row == -1 && Pawns[j].column - Board[i].column == 1 && Board[i].free) {
            for (let i = 0; i < killConditions.length; i++) {
              console.log('before push 3', killConditions[i]);
            }
            killConditions.push([k, j, i, Pawns[k].isRed, Greenturn, Pawns[k].rectCenter, Pawns[k].rectCenterY, Pawns[j].rectCenter, Pawns[j].rectCenterY, false, null, null]);
            for (let i = 0; i < killConditions.length; i++) {
              console.log('after push 3', killConditions[i]);
            }
            //killSwitch(k, j, i, Pawns[k].isRed);
            playerHasKill = true;
            killConditionsUnique = JSON.parse(JSON.stringify(killUnique(killConditions)));
            //killConditionsUnique = killUnique(killConditions);
            ////////console.log('push 3', killConditions.length);
            //for (let i = 0; i < killConditionsUnique.length; i++)
            //console.log('unique 3', killConditionsUnique[i]);
            
            
            
          }
          else if ((k == blockKilledPawn || k == blockKillersPawn) && Pawns[j].row - Board[i].row == -1 && Pawns[j].column - Board[i].column == 1 && Board[i].free) {
            for (let i = 0; i < killConditions.length; i++) {
              console.log('before push 3 block', killConditions[i]);
            }
            killConditions.push([k, j, i, Pawns[k].isRed, Greenturn, Pawns[k].rectCenter, Pawns[k].rectCenterY, Pawns[j].rectCenter, Pawns[j].rectCenterY, false, null, null]);
            for (let i = 0; i < killConditions.length; i++) {
              console.log('after push 3 block', killConditions[i]);
            }
            //killSwitch(k, j, i, Pawns[k].isRed);
            playerHasKill = true;
            killConditionsUnique = JSON.parse(JSON.stringify(killUnique(killConditions)));
            //killConditionsUnique = killUnique(killConditions);
            ////////console.log('push 3', killConditions.length);
            //for (let i = 0; i < killConditionsUnique.length; i++)
            //console.log('unique 3', killConditionsUnique[i]);
            
            
            
          }
        }
      }
      
      //break;
    }
  }
  for (let j = 0; j < Pawns.length; j++) {
    for (let k = 0; k < Pawns.length; k++) {
      if (Pawns[j].isRed != Pawns[k].isRed && Pawns[j].live && Pawns[k].live && !Pawns[k].queen &&
          ( (((Player == 1 && Greenturn == false && Pawns[j].isRed == false) || (Player == 2 && Greenturn == true && Pawns[j].isRed == true)))) &&
          ((Pawns[k].row - Pawns[j].row == -1 && Pawns[k].column - Pawns[j].column == -1))) {
        for (let i = 0; i < Board.length; i++) {
          if (blockKilledPawn == null && blockKillersPawn == null && Pawns[j].row - Board[i].row == -1 && Pawns[j].column - Board[i].column == -1 && Board[i].free) {
            for (let i = 0; i < killConditions.length; i++) {
              console.log('before push 4', killConditions[i]);
            }
            killConditions.push([k, j, i, Pawns[k].isRed, Greenturn, Pawns[k].rectCenter, Pawns[k].rectCenterY, Pawns[j].rectCenter, Pawns[j].rectCenterY, false, null, null]);
            //////////console.log(`kill 4, killer ${k}, killed ${j}`);
            for (let i = 0; i < killConditions.length; i++) {
              console.log('after push 4', killConditions[i]);
            }
            //killSwitch(k, j, i, Pawns[k].isRed);
            killConditionsUnique = JSON.parse(JSON.stringify(killUnique(killConditions)));
            playerHasKill = true;
            //killConditionsUnique = killUnique(killConditions);
            ////////console.log('push 4', killConditions.length);
            //for (let i = 0; i < killConditionsUnique.length; i++)
            //console.log('unique 4', killConditionsUnique[i]);
            
             
          }
          else if ((k == blockKilledPawn || k == blockKillersPawn) && Pawns[j].row - Board[i].row == -1 && Pawns[j].column - Board[i].column == -1 && Board[i].free) {
            for (let i = 0; i < killConditions.length; i++) {
              console.log('before push 4 block', killConditions[i]);
            }
            killConditions.push([k, j, i, Pawns[k].isRed, Greenturn, Pawns[k].rectCenter, Pawns[k].rectCenterY, Pawns[j].rectCenter, Pawns[j].rectCenterY, false, null, null]);
            //////////console.log(`kill 4, killer ${k}, killed ${j}`);
            for (let i = 0; i < killConditions.length; i++) {
              console.log('after push 4 block', killConditions[i]);
            }
            //killSwitch(k, j, i, Pawns[k].isRed);
            killConditionsUnique = JSON.parse(JSON.stringify(killUnique(killConditions)));
            playerHasKill = true;
            //killConditionsUnique = killUnique(killConditions);
            ////////console.log('push 4', killConditions.length);
            //for (let i = 0; i < killConditionsUnique.length; i++)
            //console.log('unique 4', killConditionsUnique[i]);
            
             
          }
        }
      }
      
      //break;
    }
    
  }

  
//q
//dl 
  if(killConditionsUnique.filter(array => array[9] === true).every(array => array[11].length === 0))
    generateQueensAreas(false);
  else
    generateQueensAreas(true);
  console.log(`blockKilledPawn ${blockKilledPawn} blockKillersPawn ${blockKillersPawn}`);
  for (let i = 0; i < Board.length; i++) {
    
    
    for (let j = 0; j < Pawns.length; j++) 
      for (let k = 0; k < Pawns.length; k++) {
        //console.log(` in blockKilledPawn ${blockKilledPawn} blockKillersPawn ${blockKillersPawn}`);
        if (((blockKilledPawn === null && blockKillersPawn === null) || (blockKilledPawn === k || blockKillersPawn === k)) &&
            Pawns[j].isRed != Pawns[k].isRed && Pawns[j].live && Pawns[k].live && Pawns[k].queen &&
          ((Player == 1 && Greenturn == false && Pawns[j].isRed == false) || (Player == 2 && Greenturn == true && Pawns[j].isRed == true)) &&
            Board[i].queen && (Pawns[j].row - Board[i].row <= -1) &&
            (Pawns[j].column - Board[i].column >= 1) && Board[i].row > Pawns[j].row && Board[i].free &&
            Pawns[k].queensAreas.some(area => 
              area[2] === 'down-left' &&
              Pawns[j].row === area[0] &&
              Pawns[j].column === area[1] 
          ) &&
            Pawns[k].queensAreas.some(area => 
              Board[i].free &&
              Board[i].row == area[0] &&
              Board[i].column == area[1] 
            )
            

        ) {

          console.log(`down left, k ${k}, j ${j}, i ${i}`);
          
          if (Pawns[j].rowCopy == Pawns[j].row && Pawns[j].columnCopy == Pawns[j].column) console.log("dk dl")
          let killer = k;
          let killed = j;
          let board = i;
          downLeftArray.push([killer, killed, board]);
        //   for(let i = 0; i < downLeftArray.length; i++)
        //     if(!Pawns[downLeftArray[i][1]].live)
        //         downLeftArray.splice(i, 1);  
          // for (let i = 0; i < downLeftArray.length; i++) {
          //   console.log("push downLeftArray", downLeftArray[i]);
          // }
          let free;
          console.log("before some");
          let choseBoard = [];
          
        }
  
        
        
         
      }
      
  }
  
  
//ul 
  console.log("after break");

  for (let i = 0; i < Board.length; i++) {
    
    
    for (let j = 0; j < Pawns.length; j++) 
      for (let k = 0; k < Pawns.length; k++) {
        if (((blockKilledPawn === null && blockKillersPawn === null) || (blockKilledPawn === k || blockKillersPawn === k)) &&
           Pawns[j].isRed != Pawns[k].isRed && Pawns[k].live && Pawns[j].live && Pawns[k].queen &&
          ((Player == 1 && Greenturn == false && Pawns[j].isRed == false) || (Player == 2 && Greenturn == true && Pawns[j].isRed == true)) &&
            (Pawns[j].row - Board[i].row >= 1) &&
            (Pawns[j].column - Board[i].column >= 1) && Board[i].row < Pawns[j].row &&
            Pawns[k].queensAreas.some(area => 
              area[2] === 'up-left' &&
              Pawns[j].row === area[0] &&
              Pawns[j].column === area[1] 
          ) &&
            Pawns[k].queensAreas.some(area => 
              Board[i].free &&
              Board[i].row == area[0] &&
              Board[i].column == area[1] 
            )
            
        ) {
        
          console.log(`up left, k ${k}, j ${j}, i ${i}`);
          console.log(Pawns[j].liveCopy);
          for (let x = 0; x < Pawns[j].liveCopy.length; x++)
            console.log(Pawns[j].liveCopy[x]);
          if (Pawns[j].liveCopy) {
            for (let x = 0; x < Pawns[j].liveCopy.length; x++) {
                console.log(Pawns[j].liveCopy[x]);
            }
        } else {
            console.log('Pawns[j].liveCopy is empty or undefined.');
        }
          if(!Pawns[j].liveCopy.every(array => array[0] == k)) console.log(Pawns[j])
          if (Pawns[j].rowCopy == Pawns[j].row && Pawns[j].columnCopy == Pawns[j].column) console.log("dk ul")
          let killer = k;
          let killed = j;
          let board = i;
          upLeftArray.push([killer, killed, board]);
          for(let i = 0; i < upLeftArray.length; i++)
            if(!Pawns[upLeftArray[i][1]].live)
                upLeftArray.splice(i, 1);    
          // for (let i = 0; i < upLeftArray.length; i++) {
          //   console.log("push upLeftArray", upLeftArray[i]);
          // }
        }  
          
          
      }
  }
      
//ur

for (let i = 0; i < Board.length; i++) {
  for (let j = 0; j < Pawns.length; j++) 
    for (let k = 0; k < Pawns.length; k++) {
      //console.log(` in blockKilledPawn ${blockKilledPawn} blockKillersPawn ${blockKillersPawn}`);
      if (((blockKilledPawn === null && blockKillersPawn === null) || (blockKilledPawn === k || blockKillersPawn === k)) &&
          Pawns[j].isRed != Pawns[k].isRed && Pawns[j].live && Pawns[k].live && Pawns[k].queen &&
        ((Player == 1 && Greenturn == false && Pawns[j].isRed == false) || (Player == 2 && Greenturn == true && Pawns[j].isRed == true)) &&
          Board[i].queen && (Pawns[j].row - Board[i].row >= 1) &&
          (Pawns[j].column - Board[i].column <= -1) && Board[i].row < Pawns[j].row && Board[i].free &&
          Pawns[k].queensAreas.some(area => 
            area[2] === 'up-right' &&
            Pawns[j].row === area[0] &&
            Pawns[j].column === area[1] 
        ) &&
          Pawns[k].queensAreas.some(area => 
            Board[i].free &&
            Board[i].row == area[0] &&
            Board[i].column == area[1] 
          )
          

      ) {

        console.log(`up right, k ${k}, j ${j}, i ${i}`);
        if (Pawns[j].rowCopy == Pawns[j].row && Pawns[j].columnCopy == Pawns[j].column) console.log("dk ur")
        let killer = k;
        let killed = j;
        let board = i;
        console.log(Pawns[j].liveCopy);
        upRightArray.push([killer, killed, board]);
        for(let i = 0; i < upRightArray.length; i++)
            if(!Pawns[upRightArray[i][1]].live)
                upRightArray.splice(i, 1);  
        // for (let i = 0; i < downLeftArray.length; i++) {
        //   console.log("push downLeftArray", downLeftArray[i]);
        // }
        let free;
        console.log("before some")
        
      }
  }
    //console.log("l",killConditionsUnique.length);
}

    


//dr      
    
      for (let i = 0; i < Board.length; i++) {
    
    
        for (let j = 0; j < Pawns.length; j++) 
          for (let k = 0; k < Pawns.length; k++) {
            if (((blockKilledPawn === null && blockKillersPawn === null) || (blockKilledPawn === k || blockKillersPawn === k)) &&
               Pawns[j].isRed != Pawns[k].isRed && Pawns[j].live && Pawns[k].live && Pawns[k].queen &&
              ((Player == 1 && Greenturn == false && Pawns[j].isRed == false) || (Player == 2 && Greenturn == true && Pawns[j].isRed == true)) &&
                Board[i].queen && (Pawns[j].row - Board[i].row <= -1) &&
                (Pawns[j].column - Board[i].column <= -1) && Board[i].row > Pawns[j].row &&
                Pawns[k].queensAreas.some(area => 
                  area[2] === 'down-right' &&
                  Pawns[j].row === area[0] &&
                  Pawns[j].column === area[1] 
              ) &&
                Pawns[k].queensAreas.some(area => 
                  Board[i].free &&
                  Board[i].row == area[0] &&
                  Board[i].column == area[1] 
                )
                
            ) {
            
              console.log(`down right, k ${k}, j ${j}, i ${i}`);
              if (Pawns[j].rowCopy == Pawns[j].row && Pawns[j].columnCopy == Pawns[j].column) console.log("dk dr")
              let killer = k;
              let killed = j;
              let board = i;
              downRightArray.push([killer, killed, board]);
              for(let i = 0; i < downRightArray.length; i++)
                if(!Pawns[downRightArray[i][1]].live) {
                    downRightArray.splice(i, 1);
                    console.log("splice");
                }  
              // for (let i = 0; i < downRightArray.length; i++) {
              //   console.log("push downRightArray", downRightArray[i]);
              // }
            }  
              
              
          }
      }

      //fq
      for (let j = 0; j < downRightArray.length; j++) console.log("dra1 bs", downRightArray[j]);
      downRightArray = groupAndSort("down", downRightArray);
      for (let j = 0; j < downRightArray.length; j++) console.log("dra1 as", downRightArray[j]);
      downRightArray = neighbourFilter("down", downRightArray, -1, -1);
      for (let j = 0; j < downRightArray.length; j++) console.log("dra1 an",downRightArray[j]);
      chooseDR = getChooseBoard(downRightArray);
      for (let j = 0; j < downRightArray.length; j++) console.log("dra1 a getchooseb", downRightArray[j]);
      for (let j = 0; j < chooseDR.length; j++)console.log("dra chooseDR", chooseDR[j]);
      for (let j = 0; j < downRightArray.length; j++) {
        killConditions.push([downRightArray[j][0], downRightArray[j][1], downRightArray[j][2], Pawns[downRightArray[j][0]].isRed, Greenturn, Pawns[downRightArray[j][0]].rectCenter, Pawns[downRightArray[j][0]].rectCenterY, Pawns[downRightArray[j][1]].rectCenter, Pawns[downRightArray[j][1]].rectCenterY, true, 'down-right', chooseDR]);
      }
      if(chooseDR.length == 0)
        while (downRightArray.length > 0) {
          console.log("dr splice");
          downRightArray.splice(0, 1);
      }
      killConditionsUnique = JSON.parse(JSON.stringify(killUnique(killConditions)));
      upLeftArray = groupAndSort("up", upLeftArray);
      upLeftArray = neighbourFilter("up", upLeftArray, 1, 1);
      chooseUL = getChooseBoard(upLeftArray);
      console.log("chooseUL", chooseUL);
      for (let j = 0; j < upLeftArray.length; j++) {
        killConditions.push([upLeftArray[j][0], upLeftArray[j][1], upLeftArray[j][2], Pawns[upLeftArray[j][0]].isRed, Greenturn, Pawns[upLeftArray[j][0]].rectCenter, Pawns[upLeftArray[j][0]].rectCenterY, Pawns[upLeftArray[j][1]].rectCenter, Pawns[upLeftArray[j][1]].rectCenterY, true, 'up-left', chooseUL]);
        
      }
      if(chooseUL.length == 0)
        while (upLeftArray.length > 0) {
          upLeftArray.splice(0, 1);
      }
      killConditionsUnique = JSON.parse(JSON.stringify(killUnique(killConditions)));
      upRightArray = groupAndSort("up", upRightArray);
      upRightArray = neighbourFilter("up", upRightArray, 1, -1);
      chooseUR = getChooseBoard(upRightArray);
      console.log("chooseUR", chooseUR);
      for (let j = 0; j < upRightArray.length; j++) {
        killConditions.push([upRightArray[j][0], upRightArray[j][1], upRightArray[j][2], Pawns[upRightArray[j][0]].isRed, Greenturn, Pawns[upRightArray[j][0]].rectCenter, Pawns[upRightArray[j][0]].rectCenterY, Pawns[upRightArray[j][1]].rectCenter, Pawns[upRightArray[j][1]].rectCenterY, true, 'up-right', chooseUR]);
        
      }
      if(chooseUR.length == 0)
        while (upRightArray.length > 0) {
          upRightArray.splice(0, 1);
      }
      killConditionsUnique = JSON.parse(JSON.stringify(killUnique(killConditions)));
      for(let i = 0; i < downLeftArray.length; i++)
      console.log("before act", downLeftArray[i]);
      downLeftArray = groupAndSort("down", downLeftArray);
      for(let i = 0; i < downLeftArray.length; i++)
      console.log("a g", downLeftArray[i]);
      downLeftArray = neighbourFilter("down", downLeftArray, -1, 1);
      for(let i = 0; i < downLeftArray.length; i++)
      console.log("a f", downLeftArray[i]);
      chooseDL = getChooseBoard(downLeftArray);
      console.log("chooseDL", chooseDL);
      for(let i = 0; i < downLeftArray.length; i++)
      console.log("a b", downLeftArray[i]);
      // for (let j = 0; j < downLeftArray.length; j++) {
      //   console.log("dl", downLeftArray[j])
      //   killConditions.push([downLeftArray[j][0], downLeftArray[j][1], downLeftArray[j][2], Pawns[downLeftArray[j][0]].isRed, Greenturn, Pawns[downLeftArray[j][0]].rectCenter, Pawns[downLeftArray[j][0]].rectCenterY, Pawns[downLeftArray[j][1]].rectCenter, Pawns[downLeftArray[j][1]].rectCenterY, true, 'down-left', chooseDL]);
      //   killConditionsUnique = JSON.parse(JSON.stringify(killUnique(killConditions)));
      //   downLeftArray.splice(j, 1);
        
      // }
      for (let j = 0; j < downLeftArray.length; j++) {
        console.log("dl", downLeftArray[j]);
        killConditions.push([
            downLeftArray[j][0],
            downLeftArray[j][1],
            downLeftArray[j][2],
            Pawns[downLeftArray[j][0]].isRed,
            Greenturn,
            Pawns[downLeftArray[j][0]].rectCenter,
            Pawns[downLeftArray[j][0]].rectCenterY,
            Pawns[downLeftArray[j][1]].rectCenter,
            Pawns[downLeftArray[j][1]].rectCenterY,
            true,
            'down-left',
            chooseDL
        ]);
    }
    
    // Use a while loop to remove the elements from downLeftArray
    if(chooseDL.length == 0)
      while (downLeftArray.length > 0) {
          downLeftArray.splice(0, 1);
      }
    
    // Ensure killConditionsUnique is updated
    killConditionsUnique = JSON.parse(JSON.stringify(killUnique(killConditions)));
    // for (let i = 0; i < chooseDL.length; i++) {
    //   // Find index of element that meets the condition
    //   const index = killConditionsUnique.findIndex(array => array[1] === chooseDL[i][1] && array[10] === 'up-right');
      
    //   // If the element is found, splice it
    //   if (index !== -1) {
    //       console.log("splice", killConditionsUnique[index]);
    //       killConditionsUnique.splice(index, 1);
    //   }
    // }
    // for (let i = 0; i < chooseDR.length; i++) {
    //   // Find index of element that meets the condition
    //   const index = killConditionsUnique.findIndex(array => array[1] === chooseDL[i][1] && array[10] === 'up-left');
      
    //   // If the element is found, splice it
    //   if (index !== -1) {
    //       console.log("splice", killConditionsUnique[index]);
    //       killConditionsUnique.splice(index, 1);
    //   }
    // }
    // for (let i = 0; i < chooseUL.length; i++) {
    //   // Find index of element that meets the condition
    //   const index = killConditionsUnique.findIndex(array => array[1] === chooseDL[i][1] && array[10] === 'down-right');
      
    //   // If the element is found, splice it
    //   if (index !== -1) {
    //       console.log("splice", killConditionsUnique[index]);
    //       killConditionsUnique.splice(index, 1);
    //   }
    // }
    // for (let i = 0; i < chooseUR.length; i++) {
    //   // Find index of element that meets the condition
    //   const index = killConditionsUnique.findIndex(array => array[1] === chooseDL[i][1] && array[10] === 'down-left' && array[0] === chooseUR[i][0]);
      
    //   // If the element is found, splice it
    //   if (index !== -1) {
    //       console.log("splice", killConditionsUnique[index]);
    //       killConditionsUnique.splice(index, 1);
    //   }
    // }        

// let maxLeft = [];
// let maxRight = [];
// let minLeft = [];
// let minRight = [];

let maxLeftE = [];
let maxRightE = [];
let minLeftE = [];
let minRightE = [];
// //mm
// Function to get unique values in an array
function getUniqueValues(array, index) {
    return [...new Set(array.map(item => item[index]))];
}
for (let i = 0; i < downLeftArray.length; i++) {
  console.log("downLeftArray bs", downLeftArray[i])
}
for (let i = 0; i < upLeftArray.length; i++) {
  console.log("upLeftArray bs", upLeftArray[i])
}
// Get unique values for index 0
let uniqueIndex0Values = getUniqueValues(killConditionsUnique, 0);


console.log(chooseDL);


// console.log(maxLeft, maxRight, minLeft, minRight);
// console.log(maxLeftE, maxRightE, minLeftE, minRightE);


const result = {
  upLeft: [],
  upRight: [],
  downLeft: [],
  downRight: []
};

// Check each direction and map the subarrays correctly
// let filteredUpLeft = killConditionsUnique
//   .filter(subarray => subarray[9] && subarray[10] === 'up-left' && Pawns[subarray[1]].live)
//   .map(subarray => [subarray[0], subarray[1], subarray[2], subarray[10], subarray[10] , Pawns[subarray[1]].row]);

// let filteredUpRight = killConditionsUnique
//   .filter(subarray => subarray[9] && subarray[10] === 'up-right' && Pawns[subarray[1]].live)
//   .map(subarray => [subarray[0], subarray[1], subarray[2], subarray[10], subarray[10] , Pawns[subarray[1]].row]);

// let filteredDownLeft = killConditionsUnique
//   .filter(subarray => subarray[9] && subarray[10] === 'down-left' && Pawns[subarray[1]].live)
//   .map(subarray => [subarray[0], subarray[1], subarray[2], subarray[10], subarray[10] , Pawns[subarray[1]].row]);

// let filteredDownRight = killConditionsUnique
//   .filter(subarray => subarray[9] && subarray[10] === 'down-right' && Pawns[subarray[1]].live)
//   .map(subarray => [subarray[0], subarray[1], subarray[2], subarray[10], subarray[10] , Pawns[subarray[1]].row]);

// result.upLeft.push(...filteredUpLeft);
// result.upRight.push(...filteredUpRight);
// result.downLeft.push(...filteredDownLeft);
// result.downRight.push(...filteredDownRight);

function findMinMaxValues(killConditions) {
  const result = {
      upLeft: {},
      upRight: {},
      downLeft: {},
      downRight: {}
  };

  // Iterate over each direction
  ['up-left', 'up-right', 'down-left', 'down-right'].forEach(direction => {
      // Filter data for current direction
      const filteredData = killConditions.filter(subarray => subarray[9] && subarray[10] === direction && Pawns[subarray[1]].live)
          .map(subarray => [subarray[0], subarray[1], subarray[2], subarray[10], Pawns[subarray[1]].row]);

      // Initialize min and max objects for current direction
      const minValues = {};
      const maxValues = {};

      // Find min and max values for each index 2
      filteredData.forEach(subarray => {
          const index2 = subarray[1];
          const rowValue = subarray[4];

          if (!(index2 in minValues) || rowValue < minValues[index2]) {
              minValues[index2] = rowValue;
          }

          if (!(index2 in maxValues) || rowValue > maxValues[index2]) {
              maxValues[index2] = rowValue;
          }
      });

      // Assign min and max values to result based on direction
      if (direction === 'up-left') {
          result.upLeft = maxValues;
      } else if (direction === 'up-right') {
          result.upRight = maxValues;
      } else if (direction === 'down-left') {
          result.downLeft = minValues;
      } else if (direction === 'down-right') {
          result.downRight = minValues;
      }
  });

  return result;
}

// Usage
const minMaxValues = findMinMaxValues(killConditionsUnique);
console.log(minMaxValues);

// console.log('Up Left:', result.upLeft);
// console.log('Up Right:', result.upRight);
// console.log('Down Left:', result.downLeft);
// console.log('Down Right:', result.downRight);
  
//   console.log("filter UL", filteredUpLeft)
//   console.log("filter UR", filteredUpRight)
//   console.log("filter DL", filteredDownLeft)
//   console.log("filter DR", filteredDownRight)

//   maxLeft.push([Math.max(...filteredUpLeft), mode]);
//   maxRight.push([Math.max(...filteredUpRight), mode]);
//   minLeft.push([Math.min(...filteredDownLeft)], mode);
//   minRight.push([Math.min(...filteredDownRight), mode]);
  
      
    


// console.log("Max Left:", maxLeft);
// console.log("Max Right:", maxRight);
// console.log("Min Left:", minLeft);
// console.log("Min Right:", minRight);
// console.log("Max LeftE:", maxLeftE);
// console.log("Max RightE:", maxRightE);
// console.log("Min LeftE:", minLeftE);
// console.log("Min RightE:", minRightE);

    
    
    //o1
  console.log(chooseDL.length);
  if(chooseDL.length > 0 && killConditionsUnique.some(array => array[10] == 'up-right'))
    console.log("double");     
  for (let i = 0; i < killConditionsUnique.length; i++) 
    for (let j = i + 1; j < killConditionsUnique.length; j++) 
      if (
        killConditionsUnique[i][0] == killConditionsUnique[j][0] &&
        killConditionsUnique[i][3] == killConditionsUnique[j][3] &&
        killConditionsUnique[i][1] != killConditionsUnique[j][1] &&
        Pawns[killConditionsUnique[i][1]].live &&
        Pawns[killConditionsUnique[j][1]].live &&
        (
          !killConditionsUnique[i][9] ||
          (
            killConditionsUnique[i][9] && killConditionsUnique[j][9] && Pawns[killConditionsUnique[i][0]].queen && Pawns[killConditionsUnique[j][0]].queen &&
            ((((killConditionsUnique[i][10] == 'up-left' && maxLeft.some(array =>array[1] === Pawns[killConditionsUnique[i][1]].row && array[0] == killConditionsUnique[i][0])) ||
            (killConditionsUnique[i][10] == 'up-right' && maxRight.some(array =>array[1] === Pawns[killConditionsUnique[i][1]].row && array[0] == killConditionsUnique[i][0])) ||
            (killConditionsUnique[i][10] == 'down-left' && minLeft.some(array =>array[1] === Pawns[killConditionsUnique[i][1]].row && array[0] == killConditionsUnique[i][0])) ||
            (killConditionsUnique[i][10] == 'down-right' && minRight.some(array =>array[1] === Pawns[killConditionsUnique[i][1]].row && array[0] == killConditionsUnique[i][0]))))) &&
            ((((killConditionsUnique[j][10] == 'up-left' && maxLeft.some(array =>array[1] === Pawns[killConditionsUnique[j][1]].row && array[0] == killConditionsUnique[j][0] )) ||
            (killConditionsUnique[j][10] == 'up-right' && maxRight.some(array =>array[1] === Pawns[killConditionsUnique[j][1]].row && array[0] == killConditionsUnique[j][0] )) ||
            (killConditionsUnique[j][10] == 'down-left' && minLeft.some(array =>array[1] === Pawns[killConditionsUnique[j][1]].row && array[0] == killConditionsUnique[j][0] )) ||
            (killConditionsUnique[j][10] == 'down-right' && minRight.some(array =>array[1] === Pawns[killConditionsUnique[j][1]].row && array[0] == killConditionsUnique[j][0] ))))) && 
            !arraysEqual( 
              Pawns[killConditionsUnique[i][0]].queensAreas.filter(area =>
                Pawns[killConditionsUnique[i][1]].row == area[0] && Pawns[killConditionsUnique[i][1]].column == area[1]
              ).map(killed => killed[2]),
              Pawns[killConditionsUnique[j][0]].queensAreas.filter(area =>
                Pawns[killConditionsUnique[j][1]].row == area[0] && Pawns[killConditionsUnique[j][1]].column == area[1]
              ).map(killed => killed[2])
            )
          )
        )
      ) { 
        //console.log("i", killConditionsUnique[i][0], killConditionsUnique[i][1] , 'maxLeftE', maxLeftE, 'maxRightE', maxRightE, 'minLeftE', minLeftE, 'minRightE', minRightE)
        //console.log("j", killConditionsUnique[j][0], killConditionsUnique[j][1], 'maxLeftE', maxLeftE, 'maxRightE', maxRightE, 'minLeftE', minLeftE, 'minRightE', minRightE)
        // console.log(Pawns[killConditionsUnique[j][1]].row , maxLeftE, maxRightE, minLeftE, minRightE);
        // console.log("j", killConditionsUnique[j][1], Pawns[killConditionsUnique[j][1]].row, killConditionsUnique[j][10], "i", killConditionsUnique[i][1], Pawns[killConditionsUnique[i][1]].row, killConditionsUnique[i][10], "maxl", maxLeftE, "maxr", maxRightE, "minl", minLeftE, "minr", minRightE);
        // console.log(
        //   Pawns[killConditionsUnique[i][0]].queensAreas.filter(area =>
        //     Pawns[killConditionsUnique[i][1]].row == area[0] && Pawns[killConditionsUnique[i][1]].column == area[1]
        //   ).map(killed => killed[2]),
        //   Pawns[killConditionsUnique[j][0]].queensAreas.filter(area =>
        //     Pawns[killConditionsUnique[j][1]].row == area[0] && Pawns[killConditionsUnique[j][1]].column == area[1]
        //   ).map(killed => killed[2])
        // );
        // console.log(`oneKiller2Killed killer1: ${killConditionsUnique[i][0]} killer2: ${killConditionsUnique[j][0]} killed1: ${killConditionsUnique[i][1]} killed2: ${killConditionsUnique[j][1]}`);
        let boardC = "";
        if (chooseDL.length > 0) {
          boardC = "chooseDL";
        } else if (chooseDR.length > 0) {
          boardC = "chooseDR";
        } else if (chooseUL.length > 0) {
          boardC = "chooseUL";
        } else if (chooseUR.length > 0) {
          boardC = "chooseUR";
        }
        oneKiller2Killed = true;
        blockKill = true;
        Pawns[killConditionsUnique[j][1]].kill1Killed2 = true;
        Pawns[killConditionsUnique[i][1]].kill1Killed2 = true;
        oneKiller2KilledArray.push(killConditionsUnique[i]);
        oneKiller2KilledArray.push(killConditionsUnique[j]);
        oneKiller2KilledArray = queenUnique(oneKiller2KilledArray);
        console.log(oneKiller2KilledArray);
        //break;
        
      }
    
    
    for (let i = 0; i < killConditionsUnique.length; i++) {
    console.log("killConditionsUnique out", i, killConditionsUnique[i])
  }
//or  
  for (let i = 0; i < killConditionsUnique.length; i++) 
    for (let j = i + 1; j < killConditionsUnique.length; j++)
      if (killConditionsUnique[i][0] != killConditionsUnique[j][0] && 
          killConditionsUnique[i][3] == killConditionsUnique[j][3] &&
          killConditionsUnique[i][1] == killConditionsUnique[j][1] &&
          Pawns[killConditionsUnique[i][1]].live && Pawns[killConditionsUnique[j][1]].live &&
          (((killConditionsUnique[i][9] && !killConditionsUnique[j][9] && 
          ((killConditionsUnique[i][10] == 'up-left' && maxLeft.some(array =>array[1] === Pawns[killConditionsUnique[i][1]].row && array[0] == killConditionsUnique[i][0])) ||
          (killConditionsUnique[i][10] == 'up-right' && maxRight.some(array =>array[1] === Pawns[killConditionsUnique[i][1]].row && array[0] == killConditionsUnique[i][0])) ||
          (killConditionsUnique[i][10] == 'down-left' && minLeft.some(array =>array[1] === Pawns[killConditionsUnique[i][1]].row && array[0] == killConditionsUnique[i][0])) ||
          (killConditionsUnique[i][10] == 'down-right' && minRight.some(array =>array[1] === Pawns[killConditionsUnique[i][1]].row && array[0] == killConditionsUnique[i][0])))) ||
          (killConditionsUnique[j][9] && !killConditionsUnique[i][9] &&
          (((killConditionsUnique[j][10] == 'up-left' && maxLeft.some(array =>array[1] === Pawns[killConditionsUnique[j][1]].row && array[0] == killConditionsUnique[j][0])) ||
          (killConditionsUnique[j][10] == 'up-right' && maxRight.some(array =>array[1] === Pawns[killConditionsUnique[j][1]].row && array[0] == killConditionsUnique[j][0])) ||
          (killConditionsUnique[j][10] == 'down-left' && minLeft.some(array =>array[1] === Pawns[killConditionsUnique[j][1]].row && array[0] == killConditionsUnique[j][0])) ||
          (killConditionsUnique[j][10] == 'down-right' && minRight.some(array =>array[1] === Pawns[killConditionsUnique[j][1]].row && array[0] == killConditionsUnique[j][0]))))
          )) ||
          (!killConditionsUnique[i][9] && !killConditionsUnique[j][9]) ||
          (killConditionsUnique[i][9] && killConditionsUnique[j][9] && ((
          ((killConditionsUnique[i][10] == 'up-left' && maxLeft.some(array =>array[1] === Pawns[killConditionsUnique[i][1]].row && array[0] == killConditionsUnique[i][0])) ||
          (killConditionsUnique[i][10] == 'up-right' && maxRight.some(array =>array[1] === Pawns[killConditionsUnique[i][1]].row && array[0] == killConditionsUnique[i][0])) ||
          (killConditionsUnique[i][10] == 'down-left' && minLeft.some(array =>array[1] === Pawns[killConditionsUnique[i][1]].row && array[0] == killConditionsUnique[i][0])) ||
          (killConditionsUnique[i][10] == 'down-right' && minRight.some(array =>array[1] === Pawns[killConditionsUnique[i][1]].row && array[0] == killConditionsUnique[i][0])))) ||
          (((killConditionsUnique[j][10] == 'up-left' && maxLeft.some(array =>array[1] === Pawns[killConditionsUnique[j][1]].row && array[0] == killConditionsUnique[j][0])) ||
          (killConditionsUnique[j][10] == 'up-right' && maxRight.some(array =>array[1] === Pawns[killConditionsUnique[j][1]].row && array[0] == killConditionsUnique[j][0])) ||
          (killConditionsUnique[j][10] == 'down-left' && minLeft.some(array =>array[1] === Pawns[killConditionsUnique[j][1]].row && array[0] == killConditionsUnique[j][0])) ||
          (killConditionsUnique[j][10] == 'down-right' && minRight.some(array =>array[1] === Pawns[killConditionsUnique[j][1]].row && array[0] == killConditionsUnique[j][0]))))))
          )
        ) {
      
        console.log(`killersOptMode killer1: ${killConditionsUnique[i][0]} killer2: ${killConditionsUnique[j][0]} killed1: ${killConditionsUnique[i][1]} killed2: ${killConditionsUnique[j][1]}`);
        killersOptMode = true;
        blockKill = true;
        Pawns[killConditionsUnique[i][0]].killer = true;
        Pawns[killConditionsUnique[j][0]].killer = true;
        //Pawns[killConditionsUnique[1][0]].killer = true;
        killersOptModeArray.push(killConditionsUnique[i]);
        killersOptModeArray.push(killConditionsUnique[j]);
        break;
        //killersOptModeArray.push(killConditionsUnique[1]);
  
  // If you want to break the loop after the first match, uncomment the following line
  // break;
    }
//od
    for (let i = 0; i < killConditionsUnique.length; i++) 
      for (let j = i + 1; j < killConditionsUnique.length; j++) 
        if (killConditionsUnique[i][0] != killConditionsUnique[j][0] && 
            killConditionsUnique[i][3] == killConditionsUnique[j][3] &&
            killConditionsUnique[i][1] != killConditionsUnique[j][1] &&
            Pawns[killConditionsUnique[i][1]].live && Pawns[killConditionsUnique[j][1]].live &&
            (
            //     ((!maxLeftE.some(array => array[1] == Pawns[killConditionsUnique[i][1]].row) &&
            // !maxRightE.some(array => array[1] == Pawns[killConditionsUnique[i][1]].row) &&
            // !minRightE.some(array => array[1] == Pawns[killConditionsUnique[i][1]].row) &&
            // !minLeftE.some(array => array[1] == Pawns[killConditionsUnique[i][1]].row)) &&
            // (!maxLeft.some(array => array[1] == Pawns[killConditionsUnique[j][1]].row) &&
            // !maxRight.some(array => array[1] == Pawns[killConditionsUnique[j][1]].row) &&
            // !minRight.some(array => array[1] == Pawns[killConditionsUnique[j][1]].row) &&
            // !minLeft.some(array => array[1] == Pawns[killConditionsUnique[j][1]].row))) &&
            ((!killConditionsUnique[i][9] && killConditionsUnique[j][9] && 
                (
                (!maxLeft.some(array => array[1] == Pawns[killConditionsUnique[i][1]].row) &&
                !maxRight.some(array => array[1] == Pawns[killConditionsUnique[i][1]].row) &&
                !minRight.some(array => array[1] == Pawns[killConditionsUnique[i][1]].row) &&
                !minLeft.some(array => array[1] == Pawns[killConditionsUnique[i][1]].row)))) ||
            ((!killConditionsUnique[j][9] && killConditionsUnique[i][9] && 
                (
                (!maxLeft.some(array => array[1] == Pawns[killConditionsUnique[j][1]].row) &&
                !maxRight.some(array => array[1] == Pawns[killConditionsUnique[j][1]].row) &&
                !minRight.some(array => array[1] == Pawns[killConditionsUnique[j][1]].row) &&
                !minLeft.some(array => array[1] == Pawns[killConditionsUnique[j][1]].row)))))) ||
            (killConditionsUnique[i][9] && killConditionsUnique[j][9] &&
            (((killConditionsUnique[i][10] == 'up-left' && maxLeft.some(array =>array[1] === Pawns[killConditionsUnique[i][1]].row && array[0] == killConditionsUnique[i][0])) ||
            (killConditionsUnique[i][10] == 'up-right' && maxRight.some(array =>array[1] === Pawns[killConditionsUnique[i][1]].row && array[0] == killConditionsUnique[i][0])) ||
            (killConditionsUnique[i][10] == 'down-left' && minLeft.some(array =>array[1] === Pawns[killConditionsUnique[i][1]].row && array[0] == killConditionsUnique[i][0])) ||
            (killConditionsUnique[i][10] == 'down-right' && minRight.some(array =>array[1] === Pawns[killConditionsUnique[i][1]].row && array[0] == killConditionsUnique[i][0]))) &&
            ((killConditionsUnique[j][10] == 'up-left' && maxLeft.some(array =>array[1] === Pawns[killConditionsUnique[j][1]].row && array[0] == killConditionsUnique[j][0])) ||
            (killConditionsUnique[j][10] == 'up-right' && maxRight.some(array =>array[1] === Pawns[killConditionsUnique[j][1]].row && array[0] == killConditionsUnique[j][0])) ||
            (killConditionsUnique[j][10] == 'down-left' && minLeft.some(array =>array[1] === Pawns[killConditionsUnique[j][1]].row && array[0] == killConditionsUnique[j][0])) ||
            (killConditionsUnique[j][10] == 'down-right' && minRight.some(array =>array[1] === Pawns[killConditionsUnique[j][1]].row && array[0] == killConditionsUnique[j][0]))))) ||
            (!killConditionsUnique[i][9] && !killConditionsUnique[j][9]))
                                                          //maxLeft.some(array =>array[1] === Pawns[killConditionsUnique[j][1]].row && array[0] == killConditionsUnique[j][0])                                                                                     
            
          ) {
            console.log(`killedOptMode killer1: ${killConditionsUnique[i][0]} killer2: ${killConditionsUnique[j][0]} killed1: ${killConditionsUnique[i][1]} killed2: ${killConditionsUnique[j][1]}`);
              killedOptMode = true;
              blockKill = true;
              Pawns[killConditionsUnique[i][1]].killed = true;
              Pawns[killConditionsUnique[j][1]].killed = true;
              killedOptModeArray.push(killConditionsUnique[i]);
              killedOptModeArray.push(killConditionsUnique[j]);
              break;
        }

              //break;  
          
          //break;
        
 

  
  }
  
 
  // for (let i = 0; i < killConditionsUnique.length - 1; i++) 
  //   if (killConditionsUnique[i][0] == killConditionsUnique[i + 1][0] && killConditionsUnique[i][1] == killConditionsUnique[i + 1][1]) {
  //     //////////////////////////////////////////////////////////////////////////////////////////////////////////////console.log("killedOpt");
  //   }
  ////console.log('check kill 2', killConditionsUnique.length);

// k j i
let lastMove = false;
let multiKill = false;
function killOpt(killmode, mode) {
  console.log(killmode)
  for (let z = 0; z < killmode.length; z++) {
    //console.log(`killOpt - killer: ${killmode[z][0]} killed: ${killmode[z][1]}`);
  }
  ////console.log('check killOpt 1', killConditionsUnique.length);
  console.log(`killOpt: killedOptMode ${killedOptMode} killersOptMode ${killersOptMode} oneKiller2Killed ${oneKiller2Killed} 
  blockKill ${blockKill} blockKilledPawn ${blockKilledPawn} blockKillersPawn ${blockKillersPawn} releaseBlock ${releaseBlock}`)
  if (releaseBlock) {
    killmode = [];
    releaseBlock = false;
    ////console.log('releaseBlock killOpt if false', releaseBlock)
  }
  for (let i = 0; i < killmode.length; i++)  
    if ((!killersOptMode && !killedOptMode && !oneKiller2Killed) &&
        ((Player == 1 && !Greenturn) || (Player == 2 && Greenturn)) && blockKill &&
      ((blockKilledPawn != null && killmode[i][0] != blockKilledPawn) || (blockKillersPawn != null && killmode[i][0] != blockKillersPawn))) {
      console.log("splice");
      killmode.splice(i, 1);
    }
    console.log("len", killmode.length)
    for (let i = 0; i < killmode.length; i++)
        if (((Player == 1 && !Greenturn) || (Player == 2 && Greenturn))// &&  
           /*!blockKill && (!killersOptMode && !killedOptMode && !oneKiller2Killed)*/) {
            console.log("cb", killmode[i][11]);
          //console.log('check killOpt condition 1', killmode[i]);
          killSwitch(killmode[i][0],killmode[i][1],killmode[i][2],killmode[i][3], killmode, mode);
          console.log(i);
          //if (killmode.filter(array => array[9]).every(array => array[11].length == 0)) {console.log("break"); break;}
            break;
        }
        else if (((Player == 1 && !Greenturn) || (Player == 2 && Greenturn)) /*&& blockKill && ((killmode[i][0] == blockKilledPawn) || (killmode[i][0] == blockKillersPawn)) &&*/
        /*(!killersOptMode && !killedOptMode && !oneKiller2Killed)*/) {
          //console.log('check killOpt 2', killmode[i]);
          killSwitch(killmode[i][0],killmode[i][1],killmode[i][2],killmode[i][3], killmode, mode);
          console.log("cb", killmode[i][11]);
          console.log(i);
          //if (killmode[i][11] == null || killmode.every(array => array[11].length == 0)) {console.log("break"); break;}
            break;
        }
        ////console.log('check killOpt 2', killConditionsUnique.length);
        
}
//ks
function killSwitch(winner, looser, newBoard, player, chooseBoard, mode) {
  
  console.log('check killSwitch 1', killConditionsUnique.length);
  console.log("ks out", winner, looser, newBoard);
  //console.log(`killSwitch: killedOptMode ${killedOptMode} killersOptMode ${killersOptMode} oneKiller2Killed ${oneKiller2Killed} 
  //blockKill ${blockKill} blockKilledPawn ${blockKilledPawn} blockKillersPawn ${blockKillersPawn} releaseBlock ${releaseBlock}`)
  if ((!killersOptMode && !killedOptMode && !oneKiller2Killed) && chooseBoard.filter(array => array[9] === true).every(array => array[11].length === 0)) {
  for (let m = 0; m < Board.length; m++)
    if (Board[m].row == Pawns[winner].row && Board[m].column == Pawns[winner].column) Board[m].free = true;
  for (let m = 0; m < Board.length; m++)
    if (Board[m].row == Pawns[looser].row && Board[m].column == Pawns[looser].column) Board[m].free = true;
  
  let pawnLetter = Pawns[winner].letter;
  let pawnNumber = Pawns[winner].number;
  let pawnLetterLooser = Pawns[looser].letter;
  let pawnNumberLooser = Pawns[looser].number;
  let played = Pawns[winner].isRed;
  message = "kill";
  if ((Player == 1 && !Greenturn) || (Player == 2 && Greenturn) && Pawns[looser].live)
    socket.emit('message kill', message, played, pawnLetter, pawnNumber, pawnLetterLooser, pawnNumberLooser, room);
  Pawns[looser].live = false;
 
  Pawns[winner].row = Board[newBoard].row;
  Pawns[winner].column = Board[newBoard].column;
  Pawns[winner].letter = Board[newBoard].letter;
  Pawns[winner].number = Board[newBoard].number;
  
  Board[newBoard].free = false;
  checkQueen();
  
  current = winner;
 
  kill(blockKilledPawn, blockKillersPawn, false);
  
  
  }
  else if(chooseBoard.filter(array => array[9]).some(array => array[11] && array[11].length > 0)) {
        
        console.log(chooseBoard);
        const lastSubarrays = {};


        chooseBoard.forEach(subarray => {
            const key = `${subarray[0]}-${subarray[10]}`; // Key for first and fourth elements
            const subkey = subarray[1]; // Key for second element
            if (!lastSubarrays[key]) {
                lastSubarrays[key] = {};
            }
            lastSubarrays[key][subkey] = subarray;
        });

        // Filter and collect the last subarrays
        const filteredSubarrays = {};
        Object.entries(lastSubarrays).forEach(([key, subarrayGroup]) => {
            if (Object.keys(subarrayGroup).length > 1) {
                Object.values(subarrayGroup).forEach(subarray => {
                    const firstIndex = subarray[0];
                    if (!filteredSubarrays[firstIndex]) {
                        filteredSubarrays[firstIndex] = [];
                    }
                    filteredSubarrays[firstIndex].push(subarray);
                });
            }
        });

        // Get the last subarrays with the same first index
        let blockDobleKill = [];
        Object.values(filteredSubarrays).forEach(subarrayList => {
            subarrayList.sort((a, b) => a[1] - b[1]); // Sort by second index
            blockDobleKill.push(subarrayList[subarrayList.length - 1]);
        });
      for (let i = 0; i < chooseBoard.length; i++) {
        console.log(chooseBoard[i]);
      }
      for (let i = 0; i < chooseBoard.length; i++)
        if(chooseBoard[i][0] == blockDobleKill[0][0] && chooseBoard[i][1] == blockDobleKill[0][1] && chooseBoard[i][10] == blockDobleKill[0][10])
            blockDobleKill.push(chooseBoard[i]);
      for (let i = 0; i < blockDobleKill.length; i++) {
        console.log("ck db", blockDobleKill[i]);
      }
        // console.log(blockDobleKill.map(array => array[0]))
      for (let i = 0; i < chooseBoard.length; i++)  
        if(!blockDobleKill.some(array => array[0] == chooseBoard[i][0] && array[2] == chooseBoard[i][2])) {
        Pawns[chooseBoard[i][1]].liveCopy.push([chooseBoard[i][0], chooseBoard[i][10]]);
        console.log("ks in", winner, looser, newBoard);
        Pawns[chooseBoard[i][0]].rowCopy = Board[chooseBoard[i][2]].row;
        Pawns[chooseBoard[i][0]].columnCopy = Board[chooseBoard[i][2]].column;
        // Pawns[winner].letter = Board[newBoard].letter;
        // Pawns[winner].number = Board[newBoard].number;
        console.log(winner, looser, Pawns[winner].rowCopy, Pawns[winner].columnCopy)
        console.log("ck ks", chooseBoard[i][0], chooseBoard[i][1], chooseBoard[i][2], Pawns[chooseBoard[i][1]].liveCopy)
        //Board[newBoard].free = false;
        checkQueen();
        
        //current = winner;
        //generateQueensAreas(true);
        kill(blockKilledPawn, blockKillersPawn, true);
      }    
    }
  
  ////console.log('check killSwitch 2', killConditionsUnique.length); 
}
let step = 0;
function stepKill(killmode) {
  console.log('check stepKill 1', killConditionsUnique.length); 
  ////////////////////////////////////////////////for (let z = 0; z < killmode.length; z++)////////////////////console.log(`killer: ${killmode[z][0]} killed: ${killmode[z][1]}`);
  for (let z = 0; z < killmode.length; z++) {
    //console.log(`stepKill - killer: ${z} ${killmode[z][0]} killed: ${killmode[z][1]}`);
  }
  
  // for (let i = 0; i < killmode.length; i++)
  //   if (killmode.length > 1 && blockKilledPawn == blockKillersPawn && blockKilledPawn != null && blockKillersPawn != null) {
  //     //console.log("block collision", blockKilledPawn, blockKillersPawn)
  //     blockKillersPawn = null;
  //     killmode.splice(i, 1);
  //     break;
      
  //   }
  
  //console.log(`stepKill: killedOptMode ${killedOptMode} killersOptMode ${killersOptMode} oneKiller2Killed ${oneKiller2Killed} 
  //blockKill ${blockKill} blockKilledPawn ${blockKilledPawn} blockKillersPawn ${blockKillersPawn} releaseBlock ${releaseBlock}`)
  if (killmode.length == 0) step = 0;
  let killer;
  if (releaseBlock) {
    killmode = [];
    releaseBlock = false;
    ////console.log('releaseBlock stepKill if false', releaseBlock)
  }
    for (let i = 0; i < killmode.length; i++) 
    if (blockKill && ((blockKilledPawn != null && killmode[i][0] != blockKilledPawn) ||
    (blockKillersPawn != null && killmode[i][0] != blockKillersPawn))) {
        killmode.splice(i, 1);
        //console.log(`stepkill out filter - blockKill: ${blockKill}, blockKilledPawn: ${blockKilledPawn}, blockKillersPawn: ${blockKillersPawn}`)
        //console.log('kilmode[i]', killmode[i]);
    }
    
  
////////////////////////////////////////////////////console.log(`killer: ${killmode[i][0]}, killed: ${killmode[i][1]}, turn: ${killmode[i][4]}, check: ${check}`);
//////////////////////////////////////////////////////////////////////////////////////////////////////console.log(killersOptMode);
////////////////////console.log('stepKill out', killmode);
// for (let i = 0; i < killmode.length; i++)
//   if (blockKill && blockKilledPawn != killmode[i][0] && blockKilledPawn != null) 
//     killmode.splice(i, 1);
//for (let z = 0; z < killmode.length; z++)////////////////////console.log(`killer: ${killmode[z][0]} killed: ${killmode[z][1]}`);
//////////////////////////////////console.log(`killersOptMode: ${killersOptMode} killedOptMode: ${killedOptMode}`);


for (let i = 0; i < killmode.length; i++)
if (((Player == 1 && !Greenturn) || (Player == 2 && Greenturn)) && !killersOptMode && !killedOptMode && (!oneKiller2Killed || (oneKiller2Killed && step == 0)) && !Pawns[killmode[i][1]].live &&
killmode.every(array => array[11].length == 0))   
  //if (Pawns[killmode[i][0]].live && !Pawns[killmode[i][1]].live ) 
{ 
  step++;
  //console.log("step", step);
  //console.log("stepKill in", killmode[i]);
  let targetPos = createVector(Board[killmode[i][2]].rectCenter, Board[killmode[i][2]].rectCenterY);
  let movingPawnOldPos = { x: Pawns[killmode[i][0]].rectCenter, y: Pawns[killmode[i][0]].rectCenterY };
  killer = killmode[i][0];
  Pawns[killmode[i][0]].targetPos = targetPos;
  if (Pawns[killmode[i][0]].live) movingPawn = Pawns[killmode[i][0]];
  isPawnMoving = true;
  ////////////////////////////////////////////////////////////////////////////////////////////////////////console.log(killmode.length);
  
  
  ////////////////////console.log('step');
  ////////////////////console.log(`killer ${killmode[i][0]} killed ${killmode[i][1]}`);
  //for (let z = 0; z < killmode.length; z++)////////////////////console.log(`killer: ${killmode[z][0]} killed: ${killmode[z][1]}`);
  let animatedPawn = killmode[i][0]
  // if (blockKill && killmode.length > 0 && killmode.every(kill => kill[0] != blockKilledPawn)) {
  //   blockKill = false;
  //   blockKilledPawn = null;
  //   ////////////////////console.log("check");
  //   ////////////////////console.log(killmode);
  // }
  
  // if (killConditionsUnique.length > 1 && !blockKill) check = true;
  // else if (killConditionsUnique.length <= 1 && !blockKill) check = false;
  // else if (blockKill && killmode.every(kill => kill[0] != blockKilledPawn) && blockKilledPawn != null) {
  //   blockKill = false;
  //   blockKilledPawn = null;
  //   check = false;
  //   ////////////////////console.log('blockKill false:', killmode) 
  //   // socket.emit('turn', Greenturn, check, room);
  // }
  // else if (blockKill) check = true;
  for (let i = 0; i < killmode.length; i++)
    for (let j = 0; j < killConditions.length; j++)
      if (killmode[i][0] == killer && killConditions[j][0] == killer && killmode[i][1] == killConditions[j][1]) {
        killConditions.splice(j, 1)
        break;  
      }
  //generateQueensAreas(killmode[i][0]);
  // for(k = 0; k < upLeftArray.length; k++)
  //   if(upLeftArray[k][0] == killmode[i][0] && upLeftArray[k][1] == killmode[i][1] && upLeftArray[k][2] == killmode[i][2]) {
  //     console.log("splice");
  //     upLeftArray.splice(k, 1);
  //   }
  // for(k = 0; k < downLeftArray.length; k++)
  //   if(downLeftArray[k][0] == killmode[i][0] && downLeftArray[k][1] == killmode[i][1] && downLeftArray[k][2] == killmode[i][2]) {
  //     console.log("splice");
  //     downLeftArray.splice(k, 1);
  //   }
  // for(k = 0; k < upRightArray.length; k++)
  //   if(upRightArray[k][0] == killmode[i][0] && upRightArray[k][1] == killmode[i][1] && upRightArray[k][2] == killmode[i][2]) {
  //     console.log("splice");
  //     upRightArray.splice(k, 1);
  //   }
  // for(k = 0; k < downRightArray.length; k++)
  //   if(downRightArray[k][0] == killmode[i][0] && downLeftArray[k][1] == killmode[i][1] && downLeftArray[k][2] == killmode[i][2]) {
  //     console.log("splice");
  //     downLeftArray.splice(k, 1);
  //   }
  killmode.splice(i, 1);
  //generateQueensAreas();
  //socket.emit('killed mode', killedOptMode, Pawns, room);
  let serializedPawns = serializePawns(Pawns);
  socket.emit('state', Board, serializedPawns, Greenturn, check, current, room);
  socket.emit('move', { 
    x: targetPos.x, 
    y: targetPos.y, 
    oldX: movingPawnOldPos.x, 
    oldY: movingPawnOldPos.y 
  }, room, animatedPawn);
  //generateQueensAreas()
  
  break;
}
    //killmode = [];
    console.log(`blockKill ${blockKill} blockKillersPawn ${blockKillersPawn} blockKilledPawn ${blockKilledPawn}`)
    
 
    // for (let i = 0; i < killConditionsUnique.length; i++) {
    //     for (let j = 0; j < killmode.length; j++) 
    //         if (killConditionsUnique[i][0] != killConditionsUnique[j][0]) 
    //             //killConditionsUnique.splice(i, 1);
    // }        
    
        
    // step++;
    ////////console.log('step', step)    
    for (let i = 0; i < killConditions.length; i++) {
        ////////console.log('orginal', i, killConditions[i]);
    }
    for (let x = 0; x < killConditionsUnique.length; x++) {
        ////////console.log('unique', killConditionsUnique[x]);
    }
    
    if (killConditionsUnique.length > 0 && !blockKill) {
        check = true;
        
        console.log('check killConditionsUnique.length > 0', check)
    }
    else if (killConditionsUnique.length == 0 && !blockKill) {
        check = false;
        killConditions = [];
        blockKilledPawn = null;
        blockKillersPawn = null;
        console.log('check killConditionsUnique.length == 0', check)
    }
    else if ((blockKill && killConditionsUnique.length == 0 && (blockKillersPawn != null || blockKilledPawn != null))) {
        check = false;
        
        blockKill = false;
        blockKillersPawn = null;
        releaseBlock = true;
        killConditions = [];
        console.log('check releaseBlock stepKill else if (blockKill && killConditionsUnique.length == 0 && blockKillersPawn != null)', releaseBlock)
        //////////console.log('blockKill false killers empty killConditionsUnique:', killmode)     
    }
    else if (blockKillersPawn != null && blockKillersPawn == blockKilledPawn) {
      blockKillersPawn = null;
      killConditions = [];
      console.log('check block collision');
    }
    else if (blockKill && killConditionsUnique.length == 0 && blockKilledPawn != null && blockKillersPawn != null) {
        
        check = false;
        
        blockKill = false;
        blockKilledPawn = null;
        releaseBlock = true;
        killConditions = [];
        console.log('check releaseBlock stepKill else if (blockKill && killConditionsUnique.length == 0 && blockKilledPawn != null)', releaseBlock)

        //////////console.log('blockKill false killers empty killConditionsUnique:', killmode)     
    }
    else if (blockKill && killConditionsUnique.length > 0 && killConditionsUnique.every(kill => kill[0] != blockKilledPawn) && blockKilledPawn != null &&
        ((Player == 1 && !Greenturn) || (Player == 2 && Greenturn)) ) {
        check = false;
        
        blockKill = false;
        blockKilledPawn = null;
        releaseBlock = true;
        killConditions = [];
        console.log('check releaseBlock stepKill else if (blockKill && killConditionsUnique.length > 0 && killConditionsUnique.every(kill => kill[0] != blockKilledPawn) && blockKilledPawn != null)', releaseBlock)
        console.log('blockKill false killed:', killmode) 
        //socket.emit('blockKill false', blockKill, blockKilledPawn, releaseBlock, killmode, room);
    }
    else if (blockKill && killConditionsUnique.length > 0 && killConditionsUnique.every(kill => kill[0] != blockKillersPawn) && blockKillersPawn != null &&
    ((Player == 1 && !Greenturn) || (Player == 2 && Greenturn)) ) {
        check = false;
        
        blockKill = false;
        blockKillersPawn = null;
        releaseBlock = true;
        killConditions = [];
        console.log('check releaseBlock stepKill else if (blockKill && killConditionsUnique.length > 0 && killConditionsUnique.every(kill => kill[0] != blockKillersPawn) && blockKillersPawn != null)', releaseBlock)
        //////////console.log('blockKill false killers other killers:', killmode) 
        //socket.emit('blockKill false', blockKill, blockKilledPawn, releaseBlock, killmode, room);
    }
    else if (blockKill) {
        check = true;
        if(!(chooseDL.length > 0 || chooseDR.length > 0 || chooseUL.length > 0 || chooseUR.length > 0)) {
          killConditions = [];
          killConditionsUnique = JSON.parse(JSON.stringify(killUnique(killConditions)));
        }
        console.log('check else if (blockKill)', check)
    }
    // else {
    //     check = false;
    //     //////////console.log('else', check)
    // }
    //////////console.log('after ifs', check);
    ////console.log('check stepKill 2', killConditionsUnique.length);    
}


function killUnique(array) {
    let uniqueKills = [];
    let itemsFound = {};
    for (let i = 0; i < array.length; i++) {
        // Create a copy of the array element excluding indices 5 and 6
        let modifiedArray = array[i].filter((_, index) => index !== 5 && index !== 6 && index !== 7 && index !== 8 && index !== 10);
        let stringified = JSON.stringify(modifiedArray);
        if (itemsFound[stringified]) {
            continue;
        }
        uniqueKills.push(array[i]);
        itemsFound[stringified] = true;               //(!array[9] && index !== 5 && index !== 6) || (array[9] && index !== 5 && index !== 6 && index !== 7 && index !== 8));
    }
    return uniqueKills;
}
// function killedUnique(array) {
//   let uniqueKills = [];
//   let itemsFound = {};
//   for (let i = 0; i < array.length; i++) {
//       // Create a copy of the array element excluding indices 5 and 6
//       let modifiedArray = array[i].filter((_, index) => index !== 2);
//       let stringified = JSON.stringify(modifiedArray);
//       if (itemsFound[stringified]) {
//           continue;
//       }
//       uniqueKills.push(array[i]);
//       itemsFound[stringified] = true;               //(!array[9] && index !== 5 && index !== 6) || (array[9] && index !== 5 && index !== 6 && index !== 7 && index !== 8));
//   }
//   return uniqueKills;
// }
function killedUnique(downLeftArray) {
  let uniqueKilled = new Set();
  downLeftArray.forEach(item => {
    uniqueKilled.add(item[1]); // Assuming item[1] is the killed value
  });
  return Array.from(uniqueKilled); // Convert Set to array and return
}
function queenUnique(array) {
  let uniqueKills = [];
  let itemsFound = {};
  for (let i = 0; i < array.length; i++) {
      let stringified = JSON.stringify(array[i]);
      if (itemsFound[stringified]) {
          continue;
      }
      uniqueKills.push(array[i]);
      itemsFound[stringified] = true;
  }
  return uniqueKills;
}
function uniqueForSecondExterme(array) {
  let uniqueKills = [];
  let itemsFound = {};
  for (let i = 0; i < array.length; i++) {
      let item = array[i];
      if (itemsFound[item]) {
          continue;
      }
      uniqueKills.push(item);
      itemsFound[item] = true;
  }
  return uniqueKills;
}

function mousePressed() {
    if (mouseButton === RIGHT) {
      
      let X = mouseX;
      let Y = mouseY;
      for (let i = 0; i < Board.length; i++)
        if (X > Board[i].rectCenter - 32 && X < Board[i].rectCenter + 32 &&
            Y > Board[i].rectCenterY - 32 && Y < Board[i].rectCenterY + 32) {
          console.log("b i " + i);
          console.log(Board[i]);
          //Board[i].free = true;
          
      }
      for (let i = 0; i < Pawns.length; i++) {
        let p = Pawns[i];
        if (X > p.rectCenter - 32 && X < p.rectCenter + 32 && Y > p.rectCenterY - 32 && Y < p.rectCenterY + 32) {
         console.log("p i " + i)
         console.log(Pawns[i]);
         //Pawns[i].live = false;
        }
      }
    }
  }

function checkQueen () {
  for (let i = 0; i < Pawns.length; i++)
    if ((Pawns[i].isRed && Pawns[i].row == 8) || (!Pawns[i].isRed && Pawns[i].row == 1))
      Pawns[i].queen = true;
}

function generateQueensAreas(check) {
  for (let i = 0; i < Pawns.length; i++) {
    if (Pawns[i].queen && Pawns[i].live) {
      Pawns[i].queensAreas = [];
      console.log(Pawns[i].rowCopy, Pawns[i].columnCopy)
      // Define directions for queen movement
      const directions = [
        { row: 1, column: 1, dir: "down-right" },    // Diagonal down-right
        { row: -1, column: -1, dir: "up-left" },  // Diagonal up-left
        { row: -1, column: 1, dir: "up-right" },   // Diagonal up-right
        { row: 1, column: -1, dir: "down-left" }    // Diagonal down-left
      ];
      let tempRow;
      let tempColumn;
      for (const direction of directions) {
        if(check) {
            tempRow = Pawns[i].rowCopy;
            tempColumn = Pawns[i].columnCopy;
        }
        else {
            tempRow = Pawns[i].row;
            tempColumn = Pawns[i].column;    
        }
        removeEventListener
        console.log(tempRow, tempColumn)
        for (let j = 0; j < 7; j++) {
          tempRow += direction.row;
          tempColumn += direction.column;

          // Check if the position is within bounds and not occupied by another pawn
          const isOccupied = Pawns.some(pawn => pawn.row === tempRow && pawn.column === tempColumn && pawn.live && Pawns[i].isRed == pawn.isRed);
          if (isOccupied) break;

          Pawns[i].queensAreas.push([tempRow, tempColumn, direction.dir]);
        }
      }
    }
  }

  // Reset all board queens
  for (let j = 0; j < Board.length; j++) {
    Board[j].queen = false;
  }

  // Mark board positions as queen areas
  for (let i = 0; i < Pawns.length; i++) {
    if (Pawns[i].live) {
      for (let k = 0; k < Pawns[i].queensAreas.length; k++) {
        const [row, column] = Pawns[i].queensAreas[k];
        const boardIndex = Board.findIndex(board => board.row === row && board.column === column);
        if (boardIndex !== -1) {
          Board[boardIndex].queen = true;
        }
      }
    }
  }
  
  //console.log(Pawns[9]);
}

// Call the function to generate queen areas

function serializePawns(pawns) {
  return pawns.map(pawn => ({
    rectCenter: pawn.rectCenter,
    rectCenterY: pawn.rectCenterY,
    row: pawn.row,
    column: pawn.column,
    isRed: pawn.isRed,
    queen: pawn.queen,
    live: pawn.live,
    killer: pawn.killer,
    killed: pawn.killed,
    kill1Killed2: pawn.kill1Killed2,
    letter: pawn.letter,
    number: pawn.number,
    pos: { x: pawn.pos.x, y: pawn.pos.y }, // Assuming createVector produces an object with x and y
    targetPos: pawn.targetPos ? { x: pawn.targetPos.x, y: pawn.targetPos.y } : null,
    queensAreas: pawn.queensAreas // If this is an array, it will be copied as well
  }));
}
// Output the result
////console.log(Pawns[9]);
function drawGradientCircle(x, y, r, mode) {
  let numSegments = 100;
  let angleStep = TWO_PI / numSegments;

  // Loop to draw each segment of the circle
  for (let i = 0; i < numSegments; i++) {
    let startAngle = i * angleStep;
    let endAngle = startAngle + angleStep;

    let x1 = cos(startAngle) * r;
    let y1 = sin(startAngle) * r;
    let x2 = cos(endAngle) * r;
    let y2 = sin(endAngle) * r;

    let lerpAmt = i / numSegments;
    let colorStart;
    if (mode == "killer") colorStart = lerpColor(color(255, 0, 0), color(0, 0, 255), lerpAmt);
    else colorStart = lerpColor(color(14, 45, 23), color(78, 160, 0), lerpAmt);
    let colorEnd = lerpColor(color(255, 0, 0), color(0, 0, 255), (i + 1) / numSegments);

    strokeWeight(5);
    stroke(colorStart);
    line(x1, y1, x2, y2);
  }
}
function arraysEqual(arr1, arr2) {
  if (arr1.length !== arr2.length) return false;
  for (let i = 0; i < arr1.length; i++) {
    if (arr1[i] !== arr2[i]) return false;
  }
  return true;
}
function keyPressed() {
    if (key == 't') Greenturn = !Greenturn;
    if (key == 'k') {
        generateQueensAreas(false);
        checkQueen();
        kill(blockKilledPawn, blockKillersPawn, false);
        killOpt(killConditionsUnique, false);
        stepKill(killConditionsUnique);    
    }
}

// function neighbourFilter(kill, array, r, c) {

//   for (let i = 0; i < Board.length; i++) {
//       let indicesToRemove = [];
//       for (let j = 0; j < array.length; j++) {
//           if (Board[i].row - Pawns[array[j][1]].row == r && Board[i].column - Pawns[array[j][1]].column == c) {
//               // Check if the conditions inside 'some' are met
//               for (let k = 0; k < array.length; k++) {
//                   if (
//                       Pawns[array[j][1]].isRed == Pawns[array[k][1]].isRed &&
//                       Pawns[array[k][1]].live &&
//                       Pawns[array[j][1]].live &&
//                       Board[i].column == Pawns[array[k][1]].column &&
//                       Board[i].row == Pawns[array[k][1]].row
//                   ) {
//                       indicesToRemove.push([array[j][1], array[j][2]]);
//                       indicesToRemove.push([array[k][1], array[k][2]]);
//                       console.log("ind", array[j][1], array[k][1])
//                   }
//               }
//           }
//       }
    
//       // Convert set to array and sort in reverse order
//       const sortedIndicesToRemove = indicesToRemove.sort((a, b) => b - a);
//       let boardRemoved = [];
//       for(let i = 0; i < indicesToRemove.length; i++)
//           boardRemoved.push([indicesToRemove[i][0],indicesToRemove[i][1]])    
      
//       //Remove elements at collected indices in reverse order
//       // for (let index of sortedIndicesToRemove) {
          
//       //     array.splice(index, 1);
//       // }
//       for(let i = 0; i < boardRemoved.length; i++)
//         for(let j = 0; j < array.length; j++)
//           if(array[j][1] == boardRemoved[i][0])
//             array.splice(j, 1);  
//       for(let i = 0; i < boardRemoved.length; i++)
//           for (let j = 0; j < array.length; j++)
//               if((kill == "down" && array[j][2] >= boardRemoved[i][1]) || (kill == "up" && array[j][2] <= boardRemoved[i][1]))
//                   array.splice(j, 1);
//       // if (sortedIndicesToRemove.length > 0) {
//       //     console.log("occ");
//       // }
//     }
//   }  
    

function neighbourFilter(kill, array, r, c) {
    for (let i = 0; i < Board.length; i++) {
        let indicesToRemove = [];
        for (let j = 0; j < array.length; j++) {
            if (Board[i].row - Pawns[array[j][1]].row === r && Board[i].column - Pawns[array[j][1]].column === c) {
                // Check if the conditions inside 'some' are met
                for (let k = 0; k < array.length; k++) {
                    if (
                        Pawns[array[j][1]].isRed === Pawns[array[k][1]].isRed &&
                        Pawns[array[k][1]].live &&
                        Pawns[array[j][1]].live &&
                        Board[i].column === Pawns[array[k][1]].column &&
                        Board[i].row === Pawns[array[k][1]].row
                    ) {
                        indicesToRemove.push([array[j][1], array[j][2]]);
                        indicesToRemove.push([array[k][1], array[k][2]]);
                        console.log("ind", array[j][1], array[k][1]);
                    }
                }
            }
        }
        
        // Convert set to array and sort in reverse order
        const sortedIndicesToRemove = indicesToRemove.sort((a, b) => b - a);
        let boardRemoved = [];
        for (let i = 0; i < indicesToRemove.length; i++)
            boardRemoved.push([indicesToRemove[i][0], indicesToRemove[i][1]]);
        
        // Remove elements at collected indices in reverse order
        for (let i = 0; i < boardRemoved.length; i++)
            for (let j = 0; j < array.length; j++)
                if (array[j][1] === boardRemoved[i][0]) {
                    console.log("sp1", array[j])
                    array.splice(j, 1);
                    
                }
                
        for (let i = 0; i < boardRemoved.length; i++)
            for (let j = 0; j < array.length; j++)
                if (array[j][1] == boardRemoved[0] && (kill === "down" && array[j][2] >= boardRemoved[i][1]) || (kill === "up" && array[j][2] <= boardRemoved[i][1])) {
                    console.log("sp2", array[j])
                    array.splice(j, 1);

                }
    }
    
    return array;
}
  //let array = [[2, 3, 6], [3, 7, 9], [2, 6, 8], [3, 1, 2]];

  // Function to group by the first element and sort each group
  function groupAndSort(mode, inputArray) {
    let groups = {};
    let order = [];

    // Group the subarrays by the first and second elements
    inputArray.forEach(subarray => {
        let key = `${subarray[0]}-${subarray[1]}`;
        if (!groups[key]) {
            groups[key] = [];
            order.push(key);
        }
        groups[key].push(subarray);
    });

    // Sort each group by the third element
    order.forEach(key => {
        groups[key].sort((a, b) => mode === "down" ? a[2] - b[2] : b[2] - a[2]);
    });

    // Combine the sorted groups back into arrays
    let sortedArray = [];
    order.forEach(key => {
        sortedArray = sortedArray.concat(groups[key]);
    });

    return sortedArray;
}
  
//   function getChooseBoard(arr) {
//     if (arr.length === 0) {
//         console.log("The array is empty.");
//         return [];
//     }

//     let map = {};

//     // Create a map to count occurrences of (index 0, index 1) pairs
//     for (let i = 0; i < arr.length; i++) {
//         let subarray = arr[i];
//         let key = `${subarray[0]}-${subarray[1]}`;

//         if (!map[key]) {
//             map[key] = new Set();
//         }

//         map[key].add(subarray[2]);
//     }

//     // Collect the unique subarrays where the third index is different
//     let uniqueSet = new Set();
//     for (let key in map) {
//         if (map[key].size > 1) {
//             arr.forEach(subarray => {
//                 let subarrayKey = `${subarray[0]}-${subarray[1]}`;
//                 if (subarrayKey === key) {
//                     uniqueSet.add(JSON.stringify(subarray));
//                 }
//             });
//         }
//     }

//     // Convert the set back to an array of subarrays
//     let result = Array.from(uniqueSet).map(item => JSON.parse(item));

//     return result;
// }
function getChooseBoard(arr) {
  if (arr.length === 0) {
      console.log("The array is empty.");
      return [];
  }

  let map = {};

  // Create a map to count occurrences of (index 0, index 1) pairs
  for (let i = 0; i < arr.length; i++) {
      let subarray = arr[i];
      let key = `${subarray[0]}-${subarray[1]}`;

      if (!map[key]) {
          map[key] = new Set();
      }

      map[key].add(subarray[2]);
  }

  // Collect the unique subarrays where the third index is different
  let uniqueSet = new Set();
  for (let key in map) {
      if (map[key].size > 1) {
          arr.forEach(subarray => {
              let subarrayKey = `${subarray[0]}-${subarray[1]}`;
              if (subarrayKey === key) {
                  uniqueSet.add(JSON.stringify(subarray));
              }
          });
      }
  }

  // Convert the set back to an array of subarrays
  let result = Array.from(uniqueSet).map(item => JSON.parse(item));

  return result;
}

// Example usage:
console.log(getChooseBoard([[0, 1, 2], [0, 1, 3], [1, 2, 2], [2, 3, 4], [2, 3, 5]]));
// Output: [ [ 0, 1, 2 ], [ 0, 1, 3 ], [ 2, 3, 4 ], [ 2, 3, 5 ] ]

// function sortToSecondExtreme(array) {
//   let uniqueKills = [];
//   let itemsFound = {};
//   for (let i = 0; i < array.length; i++) {
//       let item = array[i];
//       if (itemsFound[item]) {
//           continue;
//       }
//       uniqueKills.push(item);
//       itemsFound[item] = true;
//   }
//   return uniqueKills.sort((a, b) => a - b);
// }

function sortToSecondExtreme(array, mode) {
  let uniqueKills = [];
  let itemsFound = {};
  
  // Filter out duplicates
  for (let i = 0; i < array.length; i++) {
      let item = array[i];
      if (!itemsFound[item]) {
          uniqueKills.push(item);
          itemsFound[item] = true;
      }
  }
  
  // Sort the array based on the mode
  return uniqueKills.sort((a, b) => mode ? a - b : b - a);
}

// function generateStringFrom2DArray(array, index) {
//   if (array.length === 0) {
//       return '';
//   }
//   const firstElements = array.map(subArray => subArray[index]);
//   return firstElements.join(' or ');
// }

// function generateStringFrom2DArray(array, index) {
//   if (array.length === 0) {
//       return '';
//   }

//   // Extract values at the specified index
//   const values = array.map(subArray => subArray[index]);

//   // Check for duplicates using Set to ensure uniqueness
//   const uniqueValues = [...new Set(values)];

//   // If all values are the same, return just one of them
//   if (uniqueValues.length === 1) {
//       return uniqueValues[0].toString(); // Convert to string if necessary
//   } else {
//       // Otherwise, join values with " or "
//       return uniqueValues.join(' or ');
//   }
// }

// function generateStringFrom2DArray(array, killer, killed) {
//     if (array.length === 0) {
//         return '';
//     }

//     // Extract values at the specified index
//     const values = array.map(subArray => subArray[index]);

//     // Check for duplicates using Set to ensure uniqueness
//     const uniqueValues = [...new Set(values)];

//     // If all values are the same, return just one of them
//     if (uniqueValues.length === 1) {
//         return `"CAPTURE ${Pawns[uniqueValues[0]].letter}${Pawns[uniqueValues[0]].number} ON ${Pawns[uniqueValues[1]].letter}${Pawns[uniqueValues[1]].number}"`;
//     } else {
//         // Otherwise, join values with " or " and format as required
//         const formattedValues = uniqueValues.map(value => `"word ${value}"`);
//         return formattedValues.join(' or ');
//     }
// }

// function generateStringFrom2DArray(array, killerIndex, killedIndex) {
//   if (array.length === 0) {
//       return '';
//   }

//   // Extract values at the specified indices
//   const killerValues = array.map(subArray => subArray[killerIndex]);
//   const killedValues = array.map(subArray => subArray[killedIndex]);

//   // Check for unique values using Sets
//   const uniqueKillers = [...new Set(killerValues)];
//   const uniqueKilled = [...new Set(killedValues)];

//   // Prepare strings for killer and killed
//   let killerString = '';
//   let killedString = '';

//   if (uniqueKillers.length === 1) {
//       const killerPawn = Pawns[uniqueKillers[0]];
//       killerString = `"CAPTURE ${killerPawn.letter}${killerPawn.number}"`;
//   } else {
//       const formattedKillers = uniqueKillers.map(value => `"word ${value}"`);
//       killerString = formattedKillers.join(' or ');
//   }

//   if (uniqueKilled.length === 1) {
//       const killedPawn = Pawns[uniqueKilled[0]];
//       killedString = ` ON ${killedPawn.letter}${killedPawn.number}`;
//   } else {
//       const formattedKilled = uniqueKilled.map(value => `"word ${value}"`);
//       killedString = ` ON ${formattedKilled.join(' or ')}`;
//   }

//   return `${killerString}${killedString}`;
// }

// function generateStringFrom2DArray(array, killerIndex, killedIndex) {
//   if (array.length === 0) {
//       return '';
//   }

//   // Extract values at the specified indices
//   const values = array.map(subArray => [
//       subArray[killerIndex],
//       subArray[killedIndex]
//   ]);

//   // Prepare an array to store formatted capture messages
//   const captureMessages = [];

//   // Iterate through the array and create capture messages
//   for (let i = 0; i < values.length; i++) {
//       const killerId = values[i][0];
//       const killedId = values[i][1];

//       const killerPawn = Pawns[killerId];
//       const killedPawn = Pawns[killedId];

//       const captureMessage = `CAPTURE ${killerPawn.letter}${killerPawn.number} ON ${killedPawn.letter}${killedPawn.number}`;
//       captureMessages.push(captureMessage);
//   }

//   // Join all capture messages with " of "
//   return captureMessages.join(' of ');
// }

function generateStringFrom2DArray(array, killerIndex, killedIndex) {
  if (array.length === 0) {
      return '';
  }

  // Use a Set to store unique pairs of killerIndex and killedIndex
  const uniquePairs = new Set();

  // Iterate through the array and add unique pairs to the Set
  array.forEach(subArray => {
      const killerId = subArray[killerIndex];
      const killedId = subArray[killedIndex];
      uniquePairs.add(`${killerId}_${killedId}`);
  });

  // Prepare an array to store formatted capture messages
  const captureMessages = [];

  // Iterate through unique pairs and create capture messages
  uniquePairs.forEach(pair => {
      const [killerId, killedId] = pair.split('_');

      const killerPawn = Pawns[killerId];
      const killedPawn = Pawns[killedId];

      const captureMessage = `CAPTURE ${killerPawn.letter}${killerPawn.number} ON ${killedPawn.letter}${killedPawn.number}`;
      captureMessages.push(captureMessage);
  });

  // Join all capture messages with " of "
  return captureMessages.join(' OR ');
}




function generateStringFromArray(array) {
    if (array.length === 0) {
        return '';
    }
    return array.join(' or ');
}



  
// function mouseMoved() {
//   let messageArray = [];
//   X = mouseX;
//   Y = mouseY;

//   if (killedCollision) {
//     console.log('for killedOptMode');
//     for (let i = 0; i < killerCollisionChoose.length; i++) {
//       if (((!Greenturn && Player == 1) || (Greenturn && Player == 2)) &&
//         X > killerCollisionChoose[i][5] - 32 && X < killerCollisionChoose[i][5] + 32 &&
//         Y > killerCollisionChoose[i][6] - 32 && Y < killerCollisionChoose[i][6] + 32) {
//         console.log(killerCollisionChoose.length);
//         console.log(killerCollisionChoose[i]);
//       }
//     }
//   }

//   if (oneKiller2Killed) {
//     for (let i = 0; i < oneKiller2KilledArray.length; i++) {
//       if (((oneKiller2KilledArray[i][3] && !Greenturn && Player == 1) || (!oneKiller2KilledArray[i][3] && Greenturn && Player == 2)) &&
//         X > oneKiller2KilledArray[i][7] - 32 && X < oneKiller2KilledArray[i][7] + 32 &&
//         Y > oneKiller2KilledArray[i][8] - 32 && Y < oneKiller2KilledArray[i][8] + 32) {
//         messageArray.push(oneKiller2KilledArray[i]);
//       }
//     }
//   }

//   // Generate message string from messageArray
//   let message = generateStringFrom2DArray(messageArray, 0, 1);

//   // Log the final value of message
//   console.log("Final message:", message);
// }

// function mouseMoved() {
//   let messageArray = [];
//   X = mouseX;
//   Y = mouseY;

//   if (killedCollision) {
//       console.log('for killedOptMode');
//       for (let i = 0; i < killerCollisionChoose.length; i++) {
//           if (((!Greenturn && Player == 1) || (Greenturn && Player == 2)) &&
//               X > killerCollisionChoose[i][5] - 32 && X < killerCollisionChoose[i][5] + 32 &&
//               Y > killerCollisionChoose[i][6] - 32 && Y < killerCollisionChoose[i][6] + 32) {
//               console.log(killerCollisionChoose.length);
//               console.log(killerCollisionChoose[i]);
//           }
//       }
//   }

//   if (oneKiller2Killed) {
//       for (let i = 0; i < oneKiller2KilledArray.length; i++) {
//           if (((oneKiller2KilledArray[i][3] && !Greenturn && Player == 1) || (!oneKiller2KilledArray[i][3] && Greenturn && Player == 2)) &&
//               X > oneKiller2KilledArray[i][7] - 32 && X < oneKiller2KilledArray[i][7] + 32 &&
//               Y > oneKiller2KilledArray[i][8] - 32 && Y < oneKiller2KilledArray[i][8] + 32) {
//               messageArray.push(oneKiller2KilledArray[i]);
//           }
//       }
//   }

//   // Generate message string from messageArray
//   let message = generateStringFrom2DArray(messageArray, 0, 1);

//   // Log the final value of message
//   console.log("Final message:", message);
// }
function mouseMoved() {
  let messageArray = [];
  X = mouseX;
  Y = mouseY;

  // Example logic to populate messageArray, adjust as per your actual implementation
  if (oneKiller2Killed) {
      for (let i = 0; i < oneKiller2KilledArray.length; i++) {
          if (X > oneKiller2KilledArray[i][7] - 32 && X < oneKiller2KilledArray[i][7] + 32 &&
              Y > oneKiller2KilledArray[i][8] - 32 && Y < oneKiller2KilledArray[i][8] + 32) {
              messageArray.push(oneKiller2KilledArray[i]);
          }
      }
  }

  // Generate message string from messageArray
  let message = generateStringFrom2DArray(messageArray, 0, 1);

  // Display message in a div
  const messageDiv = document.getElementById('messageDiv');
  if (messageDiv) {
      if (message) {
          messageDiv.innerText = message;
          messageDiv.style.display = 'block';
          messageDiv.style.left = mouseX + 'px';
          messageDiv.style.top = mouseY + 'px';
      } else {
          messageDiv.style.display = 'none';
      }
  }
}




// Helper function to generate string based on 2D array and index
// function generateStringFrom2DArray(array, index) {
//   if (array.length === 0) {
//     return '';
//   }
//   return array.map(subArray => subArray[index]).join(' or ');
// }
