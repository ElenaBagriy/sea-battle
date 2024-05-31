const playerBoardElement = document.querySelector(".player-board");
const enemyBoardElement = document.querySelector(".enemy-board");
const playerScoreElement = document.querySelector(".player-score");
const enemyScoreElement = document.querySelector(".enemy-score");
const restartButton = document.getElementById("restartButton");
const randomPlacingButton = document.getElementById("randomPlacingButton");
const manualPlacingButton = document.getElementById("manualPlacingButton");
const currentTurn = document.getElementById("current-turn");
const usernamePlace = document.getElementById("username-place");

const fieldSize = 10;
const shipLengths = [4, 3, 3, 2, 2, 2, 1, 1, 1, 1];

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
aud.play(); 


// Ship constructor
class Ship {
  constructor(element, length, row, col, direction) {
    this.player = element.classList.contains("player-board")
      ? "human"
      : "computer";
    this.field = element;
    this.shipname = `${this.player}${row}${col}`; // name
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
        console.log("Damaged ", this.shipname);
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
  constructor(shipLengths, fieldSize, fieldElement) {
    this.fieldSize = fieldSize;
    this.element = fieldElement;
    this.ships = [];
    this.initShips();
    this.render();
  }

  initShips() {
    shipLengths.forEach((length) => {
      const ship = this.createShip(length);
      this.ships.push(ship);
    });
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

    return ship;
  }

  // Check if we can place ships
  canPlaceShip(ship) {
    const newCoords = ship.shipCoords;

    if (this.ships.length) {
      const isOverlap = this.ships.some((ship) =>
        ship.safetyCells.some((cell) =>
          newCoords.some(
            (item) => cell.row === item.row && cell.col === item.col
          )
        )
      );
      return !isOverlap;
    }
    return true;
  }

  clearBoard() {
    this.ships = [];
    this.element.innerHTML = "";
    this.render();
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
    this.element.innerHTML = html;

    if (this.element.classList.contains("player-board")) {
      this.placeShips();
    }
  }

  placeShips() {
    const cells = this.element.querySelectorAll(".cell");
    cells.forEach((cell) => {
      cell.addEventListener("click", (event) => {
        const row = parseInt(event.target.getAttribute("data-row"));
        const col = parseInt(event.target.getAttribute("data-col"));
        this.handleShipPlacement(row, col);
      });

      cell.addEventListener("contextmenu", (event) => {
        event.preventDefault();
        const row = parseInt(event.target.getAttribute("data-row"));
        const col = parseInt(event.target.getAttribute("data-col"));
        this.handleShipPlacement(row, col);
        this.rotateShip(row, col);
      });
    });
  }

  handleShipPlacement(row, col) {
    if (this.ships.length < shipLengths.length) {
      const length = shipLengths[this.ships.length];
      const direction = "horizontal";
      const ship = new Ship(this.element, length, row, col, direction);

      if (this.canPlaceShip(ship)) {
        this.ships.push(ship);
        this.render();

        if (this.ships.length === shipLengths.length) {
          alert("You placed all ships!");
        }
      }
    }
  }

  rotateShip(row, col) {
    const ship = this.ships.find((s) =>
      s.shipCoords.some((coord) => coord.row === row && coord.col === col)
    );
    if (ship) {
      ship.rotate();
      if (this.canPlaceShip(ship)) {
        this.render();
      } else {
        ship.rotate();
        ship.rotate();
        this.render();
      }
    }
  }
}

class Game {
  constructor(shipLengths, fieldSize) {
    this.fieldSize = fieldSize;
    this.shipLengths = shipLengths;
    this.playerTurn = true;
    this.playerBoardElement = document.querySelector(".player-board");
    this.enemyBoardElement = document.querySelector(".enemy-board");

    this.playerBoard = new Board(
      this.shipLengths,
      this.fieldSize,
      this.playerBoardElement
    );
    this.enemyBoard = new Board(
      this.shipLengths,
      this.fieldSize,
      this.enemyBoardElement
    );

    this.playerCounter = 0;
    this.enemyCounter = 0;

    this.addClickListener(
      this.enemyBoardElement,
      this.handleCellClick.bind(this)
    );
    this.addRightClickListener(
      this.enemyBoardElement,
      this.handleRightClick.bind(this)
    );

    this.randomPlacing();
    this.manualPlacing();
  }

  randomPlacing() {
    randomPlacingButton.addEventListener("click", () => {
      this.playerBoard.clearBoard();
      this.enemyBoard.clearBoard();
      this.playerBoard.initShips();
      this.enemyBoard.initShips();
      this.playerBoard.render();
      this.enemyBoard.render();
    });
  }

  manualPlacing() {
    manualPlacingButton.addEventListener("click", () => {
      this.manualPlacing = true;
      this.playerBoard.clearBoard();
    });

    this.playerBoardElement.addEventListener("click", (event) => {
      if (this.manualPlacing) {
        const row = parseInt(event.target.getAttribute("data-row"));
        const col = parseInt(event.target.getAttribute("data-col"));
        this.playerBoard.handleShipPlacement(row, col);
      }
    });
  }

  addClickListener(boardElement, handler) {
    boardElement.addEventListener("click", handler);
  }

  addRightClickListener(boardElement, handler) {
    boardElement.addEventListener("contextmenu", handler);
  }

  handleCellClick(event) {
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
    let scoreMessage;

    this.enemyBoard.ships.some((ship) => {
      if (ship.isHit(row, col)) {
        isHit = true;
        this.playerCounter += 1;
        playerScoreElement.textContent = `${this.playerCounter}`;
        target.classList.add("hit");
        if (ship.isDestroyed) {
          console.log("You destroyed the ship ", ship.shipname);
        }
        return true;
      }
    });

    if (!isHit) {
      target.classList.add("miss");
      this.playerTurn = false; // Switch turn to computer
      currentTurn.innerHTML = "Computer turn!";
      setTimeout(() => this.computerMove(), 1000);
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

    target.classList.add("marked");
  }

  computerMove() {
    let availableCells = [];

    // Collect all available cells
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
          availableCells.push(cell);
        }
      }
    }

    if (availableCells.length === 0) return;

    // Randomly select a cell
    const randomIndex = Math.floor(Math.random() * availableCells.length);
    const target = availableCells[randomIndex];
    const row = parseInt(target.getAttribute("data-row"));
    const col = parseInt(target.getAttribute("data-col"));

    let isHit = false;

    this.playerBoard.ships.some((ship) => {
      if (ship.isHit(row, col)) {
        const coords = { row, col };
        let n = 1;

        isHit = true;
        this.enemyCounter += 1;
        enemyScoreElement.textContent = `${this.enemyCounter}`;
        target.classList.add("hit");
        if (ship.isDestroyed) {
          console.log("Enemy destroyed your ship ", ship.shipname);
        }
        this.markSafetyCells(ship, ship.isDestroyed, coords).then(() => {
          // Move only after all cells are marked
          setTimeout(() => this.computerMove(), 1000);
        });
        return true;
      }
    });

    if (!isHit) {
      target.classList.add("miss");
      this.playerTurn = true;
      setTimeout(function () {
        currentTurn.innerHTML = "Your turn!";
      }, 200);
    }
  }

  markSafetyCells(ship, isDestroyed, coords) {
    let n = 1;
    if (isDestroyed) {
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
          setTimeout(() => {
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
          setTimeout(() => {
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
}

restartButton.addEventListener("click", () => {
  playerScoreElement.textContent = "0";
  enemyScoreElement.textContent = "0";
  usernamePlace.textContent = "Player";
  newGame.playerCounter = 0;
  newGame.enemyCounter = 0;
  newGame.playerBoard.clearBoard();
  newGame.enemyBoard.clearBoard();
});

// Initialize game.
const newGame = new Game(shipLengths, fieldSize);
