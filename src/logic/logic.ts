import PubSub from "pubsub-js";
import { GameState } from "./GameState";
import { Ship } from "./Ship";
import { GameItem } from "./interfaces/GameItem";

export type CoordinatesAndShip = {
  row: number;
  col: number;
  ship: Ship;
};

export class GameBoard {
  private static shipId = 0;
  private static defualtShipLengths = [5, 4, 3, 3, 2];
  static BOARD_SIZE = 10;
  private board: BoardCell[][];

  private aliveShips: number;
  ships: CoordinatesAndShip[];
  constructor() {
    // Board represented as m * n grid
    this.aliveShips = 0;
    this.ships = [];
    this.board = [];
    for (let m = 0; m < GameBoard.BOARD_SIZE; m++) {
      this.board[m] = [];
      for (let n = 0; n < GameBoard.BOARD_SIZE; n++) {
        this.board[m][n] = new BoardCell();
      }
    }
  }
  place(m: number, n: number, item: GameItem) {
    const length = item.length;
    const ship = new Ship(item.length, this, "", item.vertical);
    this.checkPlace(m, n);
    this.checkLength(m, n, ship.length, ship.vertical);
    let _cells = [];
    const pubSubChannel = `board-channel-${GameBoard.shipId++}`;
    ship.publishChannel = pubSubChannel;
    PubSub.subscribe(pubSubChannel, () => this.sinkAnother());
    this.ships.push({
      row: m,
      col: n,
      ship: ship,
    });
    try {
      if (!ship.vertical) {
        for (let i = 0; i < length; i++) {
          this.checkPlace(m, n + i);
          this.board[m][n + i].makeShip(ship);
          _cells.push(this.board[m][n + i]);
        }
      } else {
        for (let i = 0; i < length; i++) {
          this.checkPlace(m + i, n);
          this.board[m + i][n].makeShip(ship);
          _cells.push(this.board[m + i][n]);
        }
      }
      this.aliveShips++;
    } catch (error) {
      _cells.forEach((cell) => cell.unmakeShip());
      this.ships.pop();
      throw error;
    }
  }
  isShip(m: number, n: number) {
    return this.board[m][n].isShip();
  }
  checkPlace(m: number, n: number) {
    if (
      m < 0 ||
      m > GameBoard.BOARD_SIZE - 1 ||
      n < 0 ||
      n > GameBoard.BOARD_SIZE - 1
    )
      throw new Error("Wrong ship coordinates");
    else if (this.board[m][n].isShip())
      throw new Error("Cell already occupied");
  }
  checkLength(m: number, n: number, length: number, vertical: boolean) {
    if (length < 1 || (!vertical && n + length - 1 > GameBoard.BOARD_SIZE - 1))
      throw new Error("Ship too long");
    else if (vertical && m + length - 1 > GameBoard.BOARD_SIZE - 1)
      throw new Error("Ship too long");
  }
  receiveAttack(m: number, n: number) {
    if (this.board[m][n].isChecked()) throw new Error("Cell already checked");
    this.board[m][n].check();
    if (this.board[m][n].isShip()) this.board[m][n].hit();
    return this.isShip(m, n);
  }
  areAllSunk() {
    return !this.aliveShips;
  }
  getAliveShipCount() {
    return this.aliveShips;
  }
  sinkAnother() {
    this.aliveShips--;
  }
  getAllShips() {
    return this.ships;
  }
  remove(m: number, n: number, item: GameItem) {
    const length = item.length;
    const vertical = item.vertical;

    for (let i = 0; i < length; i++) {
      let row = m;
      let col = n;
      if (vertical) row = m + i;
      else col = n + i;
      this.board[row][col] = new BoardCell();
    }
    this.sinkAnother();
  }

  getShipRow(ship: Ship) {
    for (const coordsAndShip of this.ships) {
      if (coordsAndShip.ship == ship) return coordsAndShip.row;
    }
    throw new Error("Ship not in board");
  }

  getShipCol(ship: Ship) {
    for (const coordsAndShip of this.ships) {
      if (coordsAndShip.ship == ship) return coordsAndShip.row;
    }
    throw new Error("Ship not in board");
  }

  getAllPossibleShips(): Ship[] {
    const items = [];
    for (const l of GameBoard.defualtShipLengths) {
      items.push(new Ship(l, this));
    }

    return items;
  }

  static getDefaultShipSizes() {
    return this.defualtShipLengths;
  }
}

export const globalGameState = new GameState();

class BoardCell {
  private checked: boolean;
  private ship: Ship | null;

  constructor() {
    this.checked = false;
    this.ship = null;
  }
  makeShip(ship: Ship) {
    this.ship = ship;
  }
  unmakeShip() {
    this.ship = null;
  }
  isShip() {
    return this.ship != null;
  }
  isChecked() {
    return this.checked;
  }
  check() {
    this.checked = true;
  }
  hit() {
    this.ship?.hit();
  }
}

export class Player {
  board: GameBoard;

  constructor() {
    this.board = new GameBoard();
  }
  placeShips() {
    let i = 0;
    const lengths = GameBoard.getDefaultShipSizes();
    while (i < lengths.length) {
      try {
        const m = this.getRandomCoords();
        const n = this.getRandomCoords();
        const isVertical = !!Math.floor(Math.random() * 2);
        this.board.place(
          m,
          n,
          new Ship(lengths[i], this.board, "", isVertical),
        );
        i++;
      } catch {
        continue;
      }
    }
  }
  getRandomCoords() {
    return Math.floor(Math.random() * (GameBoard.BOARD_SIZE + 1));
  }
}

type Coordinates = [a: number, b: number];

export class ComputerPly extends Player {
  private guesses: Coordinates[];

  constructor() {
    super();
    this.guesses = [];
    this.placeShips();
    this.createGuesses();
  }
  guessRandom() {
    return this.guesses.pop();
  }
  async createGuesses() {
    this.guesses = [];
    for (let m = 0; m < GameBoard.BOARD_SIZE; m++) {
      for (let n = 0; n < GameBoard.BOARD_SIZE; n++) {
        this.guesses.push([m, n]);
      }
    }
    shuffle(this.guesses);
  }
}

export function shuffle(arr: Coordinates[]) {
  let i = arr.length - 1;
  while (i > 0) {
    const replacement = Math.floor(arr.length * Math.random());
    const replacementVal = arr[replacement];
    const old = arr[i];
    arr[i] = replacementVal;
    arr[replacement] = old;
    i--;
  }
}
