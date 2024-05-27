const playerBoardElement = document.querySelector(".player-board");
const enemyBoardElement = document.querySelector(".enemy-board");

const fieldSize = 10;
const shipLengths = [4, 3, 3, 2, 2, 2, 1, 1, 1, 1];
const cells = Array(fieldSize);

// Cell constructor
class Cell {
  constructor() {
    this.discovered = false;
    this.isShip = false;
    this.hasNeighbor = false;
  }

  placeShip() {
    this.isShip = true;
  }

  markNeighbor() {
    this.hasNeighbor = true;
  }
}

// Board constructor
class Board {
  constructor() {
    this.cells = Array.from({ length: fieldSize }, () =>
      Array.from({ length: fieldSize }, () => new Cell())
    );
  }

  markNeighborCells(row, col) {
    for (let r = row - 1; r <= row + 1; r++) {
      for (let c = col - 1; c <= col + 1; c++) {
        if (r >= 0 && r < fieldSize && c >= 0 && c < fieldSize) {
          this.cells[r][c].markNeighbor();
        }
      }
    }
  }

  placeShips(lengths) {
    for (const length of lengths) {
      let placed = false;

      while (!placed) {
        let canPlace = true;
        const positions = [];

        const isHorizontal = Math.random() > 0.5;
        let startRow = Math.floor(
          Math.random() * (fieldSize - (isHorizontal ? 0 : length))
        );
        let startCol = Math.floor(
          Math.random() * (fieldSize - (isHorizontal ? length : 0))
        );

        for (let i = 0; i < length; i++) {
          const row = isHorizontal ? startRow : startRow + i;
          const col = isHorizontal ? startCol + i : startCol;

          if (this.cells[row][col].isShip || this.cells[row][col].hasNeighbor) {
            canPlace = false;
            break;
          }
          positions.push({ row, col });
        }

        if (canPlace) {
          for (const pos of positions) {
            this.cells[pos.row][pos.col].placeShip();
            this.markNeighborCells(pos.row, pos.col);
          }
          placed = true;
        }
      }
    }
  }

  render(field, isPlayerBoard) {
    let html = "";
    for (let row = 0; row < fieldSize; row++) {
      html += '<div class="row">';
      for (let col = 0; col < fieldSize; col++) {
        let cssClass = this.cells[row][col].isShip ? "cell hit" : "cell";

        html += `<div class='${cssClass}' data-row="${row}" data-col="${col}" ></div>`;
      }
      html += "</div>";
    }
    field.insertAdjacentHTML("beforeend", html);
  }
}

// "Render" the game.
function render(field) {
  let html = "";

  for (let row = 0; row < fieldSize; row++) {
    html += '<div class="row">';
    for (let col = 0; col < fieldSize; col++) {
      let cssClass = cells[row][col].isShip ? "cell hit" : "cell";

      html += `<div class='${cssClass}' index="${row}${col}" ></div>`;
    }
    html += "</div>";
  }
  field.insertAdjacentHTML("beforeend", html);
}

// Initialize player and enemy boards
const playerBoard = new Board();
const enemyBoard = new Board();

playerBoard.placeShips(shipLengths);
enemyBoard.placeShips(shipLengths);

playerBoard.render(playerBoardElement, true);
enemyBoard.render(enemyBoardElement, false);
