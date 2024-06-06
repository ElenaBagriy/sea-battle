const playerBoardElement = document.querySelector(".player-board");
const enemyBoardElement = document.querySelector(".enemy-board");
const playerScoreElement = document.querySelector(".player-score");
const enemyScoreElement = document.querySelector(".enemy-score");
const randomPlacingButton = document.getElementById("randomPlacingButton");
const manualPlacingButton = document.getElementById("manualPlacingButton");
const restartButton = document.getElementById("restartButton");
const startButton = document.getElementById("start");
const currentTurn = document.getElementById("current-turn");
const usernamePlace = document.getElementById("username-place");
const shipsListElement = document.querySelector(".ships-list");
const soundsElement = document.querySelector(".sounds");
const modal = document.querySelector("#modalWindow");
const modalText = document.querySelector("#modal-text");
const rulesButton = document.querySelector("#rules");
const modalRules = document.querySelector("#modalRules");
const modalRulesContainer = document.querySelector("#modalRulesContainer");


let sounds = false;

soundsElement.addEventListener('click', (e)=> {
  if(e.target.classList.contains('onSounds')) {
    sounds = true
  } else {
  sounds = false;
}
})

const fieldSize = 10;
const shipLengths = [4, 3, 3, 2, 2, 2, 1, 1, 1, 1];
const timeouts = [];

function customSetTimeout(callback, delay) {
  const id = setTimeout(callback, delay);
  timeouts.push(id);
  return id;
}

function clearAllTimeouts() {
  for (const id of timeouts) {
    clearTimeout(id);
  }
  timeouts.length = 0; 
}

// Sounds
const sfx = {
  splash: new Howl({
    src: [
      "https://cdn.pixabay.com/download/audio/2024/04/01/audio_fe1b3959df.mp3?filename=water-splash-199583.mp3",
    ],
  }),
  explode: new Howl({
    src: [
      "https://cdn.pixabay.com/audio/2023/07/14/audio_23ab712cd9.mp3",
    ],
  }),
  destroy: new Howl({
    src: [
      "https://cdn.pixabay.com/audio/2022/03/10/audio_54e0895d4f.mp3",
    ],
  }),
};

// Choosing user name
function changeName(){
  let username = prompt("Enter your name");
  if (username === null || username === "") {
    usernamePlace.innerHTML = "Player";
  } else {
    document.getElementById("username-place").innerHTML = username;
  }
};

// Music
let aud = document.getElementById("myAudio");
function play() {
  aud.play();
}
function pause() {
  aud.pause();
}


// Ship constructor
class Ship {
  constructor(element, length, row, col, direction) {
    this.player = element.classList.contains("player-board")
      ? "human"
      : "computer";
    this.field = element;
    this.shipname = `${this.player}${direction}${row}${col}`; // name
    this.length = length;
    this.startRow = row;
    this.startCol = col;
    this.direction = direction;
    this.isDestroyed = false;
    this.hits = 0;
    this.shipCoords = [];
    this.safetyCells = [];
    this.initCoords();
  }

  // Initialise ships
  initCoords() {
    const { startRow, startCol, length, direction } = this;
    this.shipCoords = [];
    this.safetyCells = [];

    if (direction === "horizontal") {
      for (let i = 0; i < length; i++) {
        const row = startRow;
        const col = startCol + i;
        this.shipCoords.push({ row, col });
        this.addSafetyCells(row, col);
      }
    } else if (direction === "vertical") {
      for (let i = 0; i < length; i++) {
        const row = startRow + i;
        const col = startCol;
        this.shipCoords.push({ row, col });
        this.addSafetyCells(row, col);
      }
    }
  }

  addSafetyCells(row, col) {
    for (let r = row - 1; r <= row + 1; r++) {
      for (let c = col - 1; c <= col + 1; c++) {
        if (r >= 0 && r < fieldSize && c >= 0 && c < fieldSize) {
          let isAdded = this.safetyCells.some((cell) => {
            return r === cell.row && c === cell.col;
          });
          !isAdded && this.safetyCells.push({ row: r, col: c });
        }
      }
    }
  }

  isHit(row, col) {
    let isHit = false;
    this.shipCoords.some((item) => {
      if (item.row === row && item.col === col) {
        this.hits += 1;
        isHit = true;
        if (this.hits === this.length) {
          this.isDestroyed = true;
        }
        return true;
      }
    });
    return isHit;
  }

  // Rotate ship when placed manually
  rotate() {
    this.direction =
      this.direction === "horizontal" ? "vertical" : "horizontal";
    this.initCoords();
  }
}

// Board constructor
class Board {
  constructor( fieldSize, fieldElement, manual) {
    this.fieldSize = fieldSize;
    this.element = fieldElement;
    this.manualEnabled = manual;
    this.ships = [];
    this.initShips();
    this.render();
  }

  initShips() {
    if(!this.manualEnabled) {
      shipLengths.forEach((length) => {
        const ship = this.createShip(length);
        this.ships.push(ship);
      });
    } else {
      // console.log('create ships manually');
    }
  }

  createShip(length) {
    let placed = false;
    let ship = null;

    while (!placed) {
      const isHorizontal = Math.random() > 0.5;
      const startRow = Math.floor(
        Math.random() * (this.fieldSize - (isHorizontal ? 0 : length))
      );
      const startCol = Math.floor(
        Math.random() * (this.fieldSize - (isHorizontal ? length : 0))
      );
      const direction = isHorizontal ? "horizontal" : "vertical";

      // Create new ship
      ship = new Ship(this.element, length, startRow, startCol, direction);
      // Check if we can place ship
      if (this.canPlaceShip(ship)) {
        placed = true;
      }
    }
    placed && ship.player === 'human' && this.showShip (ship, this.element)

    return ship;
  }

  showShip (ship) {
    const div = document.createElement("div");
    let padding = 5;
    let cellSize = 33;

    let classname = `ship-bordered ${ship.direction}`;
    switch (ship.length) {
      case 4:
        classname += ' fourdeck'
        break;
        case 3:
          classname += ' tripledeck'
        break;
        case 2:
          classname += ' doubledeck'
        break;
        case 1:
          classname += ' singledeck'
        break;
      default:
        break;
    }
    div.className = classname;
    div.style.cssText = `left:${ship.startCol * cellSize + padding}px; top:${ship.startRow * cellSize+ padding}px;`;
    div.setAttribute('data-row', ship.startRow);
    div.setAttribute('data-col', ship.startCol);
    this.element.appendChild(div);
  }

  removeShipElementFromDOM (ship) {

    const shipToDeleteElement = document.querySelector(`div.ship-bordered.${ship.direction}[data-row="${ship.startRow}"][data-col="${ship.startCol}"]`);
    if (shipToDeleteElement) {
      shipToDeleteElement.remove();
    }
  }

  // Check if we can place ships
  canPlaceShip(ship) {
    const newCoords = ship.shipCoords;

    if (manual) {
      const isValideRow = (ship.startRow + (ship.direction === "horizontal" ? 0 : ship.length)) >=0 && (ship.startRow  + (ship.direction === "horizontal" ? 0 : ship.length)) <= this.fieldSize;
      const isValideCol = (ship.startCol + (ship.direction === "vertical" ? 0 : ship.length)) >=0 && (ship.startCol + (ship.direction === "vertical" ? 0 : ship.length)) <= this.fieldSize;

      if (!isValideRow || !isValideCol) {
        currentTurn.textContent = 'Choose another place';
        return false;
      }
    };

    if (this.ships.length) {

      const isOverlap = this.ships.some((ship) =>
        ship.safetyCells.some((cell) =>
          newCoords.some(
            (item) => cell.row === item.row && cell.col === item.col
          )
        )
      );

      currentTurn.textContent = 'Choose another place';
      return !isOverlap;
    }
    return true;
  }

  render() {
    let html = "";
    for (let row = 0; row < this.fieldSize; row++) {
      html += '<div class="row">';
      for (let col = 0; col < this.fieldSize; col++) {
        let cssClass;

        if (this.element.classList.contains("enemy-board")) {
          cssClass = "cell";
        } else {
          cssClass = "cell";
          this.ships.map((ship) => {
            ship.shipCoords.map((coord) => {
              coord.row === row && coord.col === col && (cssClass += " ship");
            });
          });
        }
        html += `<div class='${cssClass}' data-row="${row}" data-col="${col}" ></div>`;
      }
      html += "</div>";
    }
    this.element.insertAdjacentHTML("beforeend", html)
  }

  handleShipPlacement(row, col) {
    if (this.ships.length < shipLengths.length) {
      const length = shipLengths[this.ships.length];
      const direction = "horizontal";

      const ship = new Ship(this.element, length, row, col, direction);

      if (this.canPlaceShip(ship)) {

          this.ships.push(ship);
          this.showShip(ship);

          ship.shipCoords.map(({row,col})=> {
          const target = document.querySelector(`div[data-row="${row}"][data-col="${col}"]`)
          target.classList.add('ship')

          currentTurn.textContent = 'Place next ship';

        })
      }
    }
    if (this.ships.length === shipLengths.length) {
      currentTurn.textContent = 'You placed all ships!';
      startButton.classList.remove('hidden');
    }
 
  }

  rotateShip(row, col) {
    let indexToDelete;
    const ship = this.ships.find((s, index) =>{
      indexToDelete = index;
      return s.shipCoords.some((coord) => coord.row === row && coord.col === col)
    }
    );

    if (ship) {
      ship.shipCoords.map(({row,col})=> {
        const target = document.querySelector(`div[data-row="${row}"][data-col="${col}"]`)
        target.classList.remove('ship')
        })
        this.removeShipElementFromDOM(ship);
      ship.rotate(ship);
      this.ships.splice(indexToDelete, 1);

      if (this.canPlaceShip(ship)) {
        ship.shipCoords.map(({row,col})=> {
          const target = document.querySelector(`div[data-row="${row}"][data-col="${col}"]`)
          target.classList.add('ship')
          })
          this.showShip(ship);
        this.ships.push(ship)
        
        
      } else {
        currentTurn.textContent = 'Can not rotate the ship on this place';
        ship.rotate(ship);
        ship.shipCoords.map(({row,col})=> {
          const target = document.querySelector(`div[data-row="${row}"][data-col="${col}"]`)
          target.classList.add('ship')
          })
          this.showShip(ship);
        this.ships.push(ship)
      }
    }
  }
}

class Game {
  constructor(manual, allShipsPlaced, shipLengths, fieldSize ) {
    this.startgame = false;

    this.fieldSize = fieldSize;
    this.shipLengths = shipLengths;
    this.allShipsPlaced = allShipsPlaced;
    this.manualPlacingEnabled = manual;
    
    this.playerTurn = true;
    this.playerBoardElement = document.querySelector(".player-board");
    this.enemyBoardElement = document.querySelector(".enemy-board");
    this.availableCells = [];

    this.playerCounter = 0;
    this.enemyCounter = 0;

    this.playerBoard = new Board(this.fieldSize, this.playerBoardElement, this.manualPlacingEnabled);
    this.enemyBoard = new Board(this.fieldSize, this.enemyBoardElement, false);

    this.init();
  }

  init() {
    if (this.allShipsPlaced) {
      this.playerTurn = Math.random() > 0.5;
  
      if(!this.playerTurn) {
        currentTurn.textContent = 'The computer shoots first';
        customSetTimeout(() => this.computerMove(), 2000);
      }
      else {
        currentTurn.textContent = 'Your turn!';
      }
  
      this.handleCellClickBound = this.handleCellClick.bind(this);
      this.handleRightClickBound = this.handleRightClick.bind(this);
  
      this.addClickListener(
        this.enemyBoardElement,
        this.handleCellClickBound
      );
      this.addRightClickListener(
        this.enemyBoardElement,
        this.handleRightClickBound
      );

    }

    if (this.manualPlacingEnabled) {
      this.manualPlacing()
    } 
  }

  stop() {
    this.playerBoardElement.innerHTML = "";
    this.enemyBoardElement.innerHTML = "";
    this.playerCounter = 0;
    this.enemyCounter = 0;
    this.allShipsPlaced = false;
    this.manualPlacingEnabled = false;
    this.removeListeners();
    clearAllTimeouts();
  }

  start() {
    this.allShipsPlaced = true;
    this.init();
  };

  manualPlacing() {
    
    this.playerBoardElement.addEventListener("click", (event) => {

      if (this.manualPlacingEnabled) {
        const row = parseInt(event.target.getAttribute("data-row"));
        const col = parseInt(event.target.getAttribute("data-col"));
        this.playerBoard.handleShipPlacement(row, col);
      }
    });

    this.playerBoardElement.addEventListener("contextmenu", (event) => {
      event.preventDefault();
      const row = parseInt(event.target.getAttribute("data-row"));
      const col = parseInt(event.target.getAttribute("data-col"));
      // this.playerBoard.handleShipPlacement(row, col);
      this.playerBoard.rotateShip(row, col);
    });
   
  }

  addClickListener(boardElement, handler) {
    boardElement.addEventListener("click", handler);
  }

  addRightClickListener(boardElement, handler) {
    boardElement.addEventListener("contextmenu", handler);
  }

  removeClickListener(boardElement, handler) {
    boardElement.removeEventListener("click", handler);
  }

  removeRightClickListener(boardElement, handler) {
    boardElement.removeEventListener("contextmenu", handler);
  }

  handleCellClick(event) {
    if (this.manualPlacingEnabled && !this.allShipsPlaced) {
      currentTurn.textContent = "Place the ships first!"
      return alert("Place the ships first");
    }

    if (!this.playerTurn) return;

    const target = event.target;
    if (!target.classList.contains("cell")) return;

    if (
      target.classList.contains("hit") ||
      target.classList.contains("miss") ||
      target.classList.contains("marked")
    ) {
      return;
    }
    const row = parseInt(target.getAttribute("data-row"));
    const col = parseInt(target.getAttribute("data-col"));

    let isHit = false;

    this.enemyBoard.ships.some((ship) => {
      if (ship.isHit(row, col)) {
        sounds && sfx.explode.play();
        isHit = true;
        this.playerCounter += 1;
        playerScoreElement.textContent = `${this.playerCounter}/20`;
        target.classList.add("hit");
        currentTurn.textContent = 'Congratulations! You damaged an enemy ship. Your shot.';

        
        if (ship.isDestroyed) {
          sounds && sfx.destroy.play();
          this.showDestroyedIcons(ship, "red-cross")
          currentTurn.textContent = 'Congratulations! You destroyed an enemy ship. Your shot.';
        }

        if (this.playerCounter === 20) {
          this.finish('player');
          return true;
        }
        return true;
      }
    });

    if (!isHit) {
      sounds && sfx.splash.play();
      target.classList.add("miss");
      this.playerTurn = false; // Switch turn to computer
      currentTurn.textContent = "You missed. The computer shoots!";
      customSetTimeout(() => this.computerMove(), 1000);
    }
  }

  handleRightClick(event) {
    event.preventDefault();
    if (!this.playerTurn) return;
    const target = event.target;
    if (!target.classList.contains("cell")) return;
    if (target.classList.contains("hit") || target.classList.contains("miss")) {
      return;
    }

    target.classList.toggle("marked");
  }

  getAvailableCells(coords) {
    const areaToHit = [
      { row: coords.row - 1, col: coords.col },
      { row: coords.row + 1, col: coords.col },
      { row: coords.row, col: coords.col - 1 },
      { row: coords.row, col: coords.col + 1 },
    ];

    const hitCells = areaToHit.filter((hitCell) => {
      if (
        hitCell.row >= 0 &&
        hitCell.col >= 0 &&
        hitCell.row < fieldSize &&
        hitCell.col < fieldSize
      ) {
        const cell = this.playerBoardElement.querySelector(
          `.cell[data-row="${hitCell.row}"][data-col="${hitCell.col}"]`
        );
        if (cell) {
          return (
            !cell.classList.contains("hit") &&
            !cell.classList.contains("miss") &&
            !cell.classList.contains("marked")
          );
        }
      }
      return false;
    });

    hitCells.forEach((hitCell) => {
      const cell = this.playerBoardElement.querySelector(
        `.cell[data-row="${hitCell.row}"][data-col="${hitCell.col}"]`
      );

      this.availableCells.push(cell);
    });

  }

  computerMove(hit, isDestroyed, coords) {

    if (this.availableCells.length > 0 && this.availableCells.length <=4 && !isDestroyed) {

      if (coords) {
        this.getAvailableCells(coords);
      }

      this.availableCells = this.availableCells.filter((availableCell) => {
            return (
              !availableCell.classList.contains("hit") &&
              !availableCell.classList.contains("miss") &&
              !availableCell.classList.contains("marked")
            );  
      });
    } else if (hit && !isDestroyed) {
          this.availableCells = [];
          this.getAvailableCells(coords);
  
      } else {
        this.availableCells = [];
        for (let row = 0; row < this.fieldSize; row++) {
          for (let col = 0; col < this.fieldSize; col++) {
            const cell = this.playerBoardElement.querySelector(
              `.cell[data-row="${row}"][data-col="${col}"]`
            );
            if (
              !cell.classList.contains("hit") &&
              !cell.classList.contains("miss") &&
              !cell.classList.contains("marked")
            ) {
              this.availableCells.push(cell);
            }
          }
        }
      }

    if (this.availableCells.length === 0) return;

    // Randomly select a cell
    const randomIndex = Math.floor(Math.random() * this.availableCells.length);
    const target = this.availableCells[randomIndex];
    const row = parseInt(target.getAttribute("data-row"));
    const col = parseInt(target.getAttribute("data-col"));

    let isHit = false;

    this.playerBoard.ships.some((ship) => {
      if (ship.isHit(row, col)) {
        sounds && sfx.explode.play();
        const coords = { row, col };

        isHit = true;
        this.enemyCounter += 1;
        enemyScoreElement.textContent = `${this.enemyCounter}/20`;
        target.classList.add("hit");
        currentTurn.textContent = 'The computer has hit your ship. Computer shot';
        if (ship.isDestroyed) {
          currentTurn.textContent = 'The computer destroyed your ship. Computer shot';
        }

        this.markSafetyCells(ship, ship.isDestroyed, coords).then(() => {
          if (this.enemyCounter === 20) {
            this.finish('computer');
            return true;
          }
          customSetTimeout(() => this.computerMove('hit', ship.isDestroyed, coords ), 1000);
        });
        return true;
      }
    });

    if (!isHit) {
      sounds && sfx.splash.play();
      target.classList.add("miss");
      customSetTimeout(() => {
        this.playerTurn = true;
        currentTurn.textContent = "The computer missed. Your shot!";
      }, 200);
    }
  }

  markSafetyCells(ship, isDestroyed, coords) {
    let n = 1;
    if (isDestroyed) {
      sounds && sfx.destroy.play();
      return new Promise((resolve) => {
        const safetyCells = ship.safetyCells.filter((safeCell) => {
          const cell = this.playerBoardElement.querySelector(
            `.cell[data-row="${safeCell.row}"][data-col="${safeCell.col}"]`
          );
          return (
            !cell.classList.contains("hit") &&
            !cell.classList.contains("miss") &&
            !cell.classList.contains("marked")
          );
        });

        safetyCells.forEach((safeCell, index) => {
          const cell = this.playerBoardElement.querySelector(
            `.cell[data-row="${safeCell.row}"][data-col="${safeCell.col}"]`
          );
          customSetTimeout(() => {
            cell.classList.add("marked");
            if (index === safetyCells.length - 1) {
              resolve();
            }
          }, 250 * n);
          n++;
        });

        if (safetyCells.length === 0) {
          resolve();
        }
      });
    } else {
      return new Promise((resolve) => {
        const areaToMark = [
          { row: coords.row - 1, col: coords.col - 1 },
          { row: coords.row - 1, col: coords.col + 1 },
          { row: coords.row + 1, col: coords.col - 1 },
          { row: coords.row + 1, col: coords.col + 1 },
        ];

        const safetyCells = areaToMark.filter((safeCell) => {
          if (
            safeCell.row >= 0 &&
            safeCell.col >= 0 &&
            safeCell.row < fieldSize &&
            safeCell.col < fieldSize
          ) {
            const cell = this.playerBoardElement.querySelector(
              `.cell[data-row="${safeCell.row}"][data-col="${safeCell.col}"]`
            );
            if (cell) {
              return (
                !cell.classList.contains("hit") &&
                !cell.classList.contains("miss") &&
                !cell.classList.contains("marked")
              );
            }
          }
          return false;
        });
        safetyCells.forEach((safeCell, index) => {
          const cell = this.playerBoardElement.querySelector(
            `.cell[data-row="${safeCell.row}"][data-col="${safeCell.col}"]`
          );
          customSetTimeout(() => {
            cell.classList.add("marked");
            if (index === safetyCells.length - 1) {
              resolve();
            }
          }, 250 * n);
          n++;
        });

        if (safetyCells.length === 0) {
          resolve();
        }
      });
    }
  }

  showDestroyedIcons(ship, iconClass) {
    const enemyBoard = this.enemyBoard;

    const shipsListElements = document.querySelectorAll('.ship-icon')

    for (const element of shipsListElements) {
      switch (ship.length) {
        case 4:
          if(element.classList.contains('fourdeck') && ship.isDestroyed) {
            for (let i = 1; i <= ship.length; i++) {
              customSetTimeout(() => {
                fn(element);
                enemyBoard.showShip(ship);
              }, i * 200);
            }
          }
          break;
          case 3:
            if(element.classList.contains('tripledeck') && ship.isDestroyed && !element.querySelector('span')) {
              for (let i = 1; i <= ship.length; i++) {
                customSetTimeout(() => {
                  fn(element);
                  enemyBoard.showShip(ship);
                }, i * 200);
              }
              return;
            }
          break;
          case 2:
            if(element.classList.contains('doubledeck') && ship.isDestroyed && !element.querySelector('span')) {
              for (let i = 1; i <= ship.length; i++) {
                customSetTimeout(() => {
                  fn(element);
                  enemyBoard.showShip(ship);
                }, i * 200);
              }
              return;
            }
          break;
          case 1:
            if(element.classList.contains('singledeck') && ship.isDestroyed && !element.querySelector('span')) {
              for (let i = 1; i <= ship.length; i++) {
                customSetTimeout(() => {
                  fn(element);
                  enemyBoard.showShip(ship);
                }, i * 200);
              }
              return;
            }
          break;
        default: ""
          break;
      }
    }
    function fn(element) {
      const span = document.createElement("span");
      span.className = `icon-field ${iconClass}`;
      element.appendChild(span);
    }
  }

  removeListeners() {
    this.removeClickListener(this.enemyBoardElement, this.handleCellClickBound);
    this.removeRightClickListener(this.enemyBoardElement, this.handleRightClickBound);
  }

  finish(winner) {
    if (winner === 'computer') {
      modalText.textContent ='Unfortunately, you lost the game.';
      modal.style.display = "block";
    }
    else {
      modalText.textContent ='Congratulations! You`ve won the game!';
      modal.style.display = "block";
    }
    this.removeListeners();
  }
}



// Initialize game.
let game;
let manual = false;
let allShipsPlaced = true;

manualPlacingButton.addEventListener("click", () => {
  startButton.classList.add('hidden')
  if (game) {
    game.stop();
  }
  manual = true;
  allShipsPlaced = false;

  game = new Game(manual, allShipsPlaced, shipLengths, fieldSize);
  currentTurn.textContent = 'Place your first ship';
})

randomPlacingButton.addEventListener("click", () => {
  startButton.classList.add('hidden')
  modal.style.display = "none";
  if (game) {
    game.stop();
  }
  manual = false;
  allShipsPlaced = true;

  game = new Game(manual, allShipsPlaced, shipLengths, fieldSize);
})

startButton.addEventListener('click',() => {
  game.start(true);
})


//Modal Window
window.onload = function() {
    modal.style.display = "block";
}

randomPlacingButton.onclick = function() {
    modal.style.display = "none";
}

restartButton.onclick = function() {
  modal.style.display = "block";
}

window.onclick = function(event) {
  if (event.target == modalRulesContainer) {
    modalRulesContainer.style.display = "none";
  }
}

manualPlacingButton.onclick = function() {
    modal.style.display = "none";
}

rulesButton.onclick = function() {
  
  if (modalRulesContainer.style.display === "none" || modalRulesContainer.style.display === "") {
    modalRulesContainer.style.display = "block";
  } else {
    modalRulesContainer.style.display = "none";
  }
}

// updated the block about showing menu just to get styling the menu
document.addEventListener("DOMContentLoaded", () => {
  const burger = document.getElementById("burger");
  const menu = document.getElementById("menu");
  const button = document.querySelectorAll("button");
  const overlay = document.getElementById("overlay");

  burger.addEventListener("click", () => {
    menu.classList.toggle("show-menu");
    overlay.style.display =
      overlay.style.display === "block" ? "none" : "block";
  });

  button.forEach((button) => {
    button.addEventListener("click", () => {
      menu.classList.remove("show-menu");
      overlay.style.display = "none";
    });
  });

  overlay.addEventListener("click", () => {
    menu.classList.remove("show-menu");
    overlay.style.display = "none";
  });
});

