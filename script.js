const playerBoardElement = document.querySelector(".player-board");
const enemyBoardElement = document.querySelector(".enemy-board");

const fieldSize = 10;
const shipLengths = [4, 3, 3, 2, 2, 2, 1, 1, 1, 1];

// Ship constructor
class Ship {
  constructor(element, length, row, col, direction) {
    this.player = element.classList.contains("player-board")
      ? "human"
      : "computer";
    this.field = element;
    this.shipname = ""; // name
    this.length = length;
    this.startRow = row;
    this.startCol = col;
    this.direction = direction;
    this.isDestroyed = false;
    this.hits = 0;
    this.hitsCoords = [];
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
        this.hitsCoords.push({ row, col });
        this.hits += 1;
        isHit = true;
        if (this.hits === this.length) {
          this.isDestroyed = true;
        }
        console.log("piu");
        return true;
      }
    });
    return isHit;
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

  render() {
    console.log("render");
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
  }
}

class Game {
  constructor(shipLengths, fieldSize) {
    this.fieldSize = fieldSize;
    this.shipLengths = shipLengths;
    this.clickedCells = [];
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

    this.addClickListener(
      this.enemyBoardElement,
      this.handleCellClick.bind(this)
    );
  }

  addClickListener(boardElement, handler) {
    boardElement.addEventListener("click", handler);
  }

  handleCellClick(event) {
    const target = event.target;
    if (!target.classList.contains("cell")) return;

    if (target.classList.contains("hit") || target.classList.contains("miss")) {
      return;
    }
    const row = parseInt(target.getAttribute("data-row"));
    const col = parseInt(target.getAttribute("data-col"));

    this.clickedCells.push({ row, col });

    let isHit = false;

    this.enemyBoard.ships.some((ship) => {
      if (ship.isHit(row, col)) {
        isHit = true;
        target.classList.add("hit");
        if (ship.isDestroyed) {
          console.log("The ship is destroyed!");
          //   this.markSafetyCells(ship);
        }
        return true;
      }
    });

    if (!isHit) {
      target.classList.add("miss");
    }
  }

  //   markSafetyCells(ship) {
  //     ship.safetyCells.forEach((cell) => {
  //       const isShipCell = ship.shipCoords.some(
  //         (coord) => coord.row === cell.row && coord.col === cell.col
  //       );

  //       if (!isShipCell) {
  //         const cellElement = this.enemyBoardElement.querySelector(
  //           `.cell[data-row="${cell.row}"][data-col="${cell.col}"]`
  //         );
  //         if (cellElement) {
  //           cellElement.classList.add("safety");
  //         }
  //       }
  //     });
  //   }
}

// Initialize game.
const newGame = new Game(shipLengths, fieldSize);

// Choosing user name
let username = prompt("Enter your name");
if ((prompt = false || username === null || username === "")) {
  let usernamePlace = document.getElementById("username-place");
  usernamePlace.innerHTML = "Player";
} else {
  let usernamePlace = document.getElementById("username-place");
  usernamePlace.innerHTML = username;
}
