const playerBoardElement = document.querySelector(".player-board");
const enemyBoardElement = document.querySelector(".enemy-board");

const fieldSize = 10;
const shipLengths = [4, 3, 3, 2, 2, 2, 1, 1, 1, 1];

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
  constructor(shipLengths, fieldSize, fieldElement) {
    this.fieldSize = fieldSize;
    this.cells = Array.from({ length: this.fieldSize }, () =>
      Array.from({ length: this.fieldSize }, () => new Cell())
    );
    this.placeShips(shipLengths);
    this.field = fieldElement;
    this.render();
  }

  markNeighborCells(row, col) {
    for (let r = row - 1; r <= row + 1; r++) {
      for (let c = col - 1; c <= col + 1; c++) {
        if (r >= 0 && r < this.fieldSize && c >= 0 && c < this.fieldSize) {
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
          Math.random() * (this.fieldSize - (isHorizontal ? 0 : length))
        );
        let startCol = Math.floor(
          Math.random() * (this.fieldSize - (isHorizontal ? length : 0))
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

  render() {
    let html = "";
    for (let row = 0; row < this.fieldSize; row++) {
      html += '<div class="row">';
      for (let col = 0; col < this.fieldSize; col++) {
        let cssClass;
        if (this.field.classList.contains("enemy-board")) {
          cssClass = "cell hide";
        } else {
          cssClass = this.cells[row][col].isShip ? "cell hit" : "cell";
        }

        html += `<div class='${cssClass}' data-row="${row}" data-col="${col}" ></div>`;
      }
      html += "</div>";
    }
    this.field.insertAdjacentHTML("beforeend", html);
  }
}

class Game {
  constructor(shipLengths, fieldSize) {
    this.fieldSize = fieldSize;
    this.shipLengths = shipLengths;
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

    const row = parseInt(target.getAttribute("data-row"));
    const col = parseInt(target.getAttribute("data-col"));

    if (this.enemyBoard.cells[row][col].discovered) return;

    this.enemyBoard.cells[row][col].discovered = true;
    target.classList.remove("hide");
    if (this.enemyBoard.cells[row][col].isShip) {
      target.classList.add("hit");
    } else {
      target.classList.add("miss");
    }
  }
}

// Initialize game.
const newGame = new Game(shipLengths, fieldSize);
