import PubSub from "pubsub-js";

export class Ship {
  constructor(length, publish) {
    this.length = length;
    this.hp = length;
    this.publish = publish;
  }
  hit() {
    if (!this.hp) throw new Error("Ship already sank");
    this.hp--;
    if (!this.hp) {
      PubSub.publishSync(this.publish);
    }
  }
  isSunk() {
    return !this.hp;
  }
}

export class GameBoard {
  static #shipId = 0;
  static BOARD_SIZE = 10;
  constructor() {
    // Board represented as m * n grid
    this.aliveShips = 0;
    this.ships = [];
    for (let m = 0; m < GameBoard.BOARD_SIZE; m++) {
      this[m] = {};
      for (let n = 0; n < GameBoard.BOARD_SIZE; n++) {
        this[m][n] = new BoardCell();
      }
    }
  }
  place(m, n, length, vertical = false) {
    this.checkPlace(m, n);
    this.checkLength(m, n, length, vertical);
    let _cells = [];
    const pubSubChannel = `board-channel-${GameBoard.#shipId++}`;
    const newShip = new Ship(length, pubSubChannel);
    this.token = PubSub.subscribe(pubSubChannel, () => this.sinkAnother());
    this.ships.push([...arguments, newShip]);
    try {
      if (!vertical) {
        for (let i = 0; i < length; i++) {
          this.checkPlace(m, n + i);
          this[m][n + i].makeShip(newShip);
          _cells.push(this[m][n + i]);
        }
      } else {
        for (let i = 0; i < length; i++) {
          this.checkPlace(m + i, n);
          this[m + i][n].makeShip(newShip);
          _cells.push(this[m + i][n]);
        }
      }
      this.aliveShips++;
    } catch (error) {
      _cells.forEach((cell) => cell.unmakeShip());
      this.ships.pop();
      throw error;
    }
  }
  isShip(m, n) {
    return this[m][n].isShip();
  }
  checkPlace(m, n) {
    if (
      m < 0 ||
      m > GameBoard.BOARD_SIZE - 1 ||
      n < 0 ||
      n > GameBoard.BOARD_SIZE - 1
    )
      throw new Error("Wrong ship coordinates");
    else if (this[m][n].isShip()) throw new Error("Cell already occupied");
  }
  checkLength(m, n, length, vertical) {
    if (length < 1 || (!vertical && n + length - 1 > GameBoard.BOARD_SIZE - 1))
      throw new Error("Ship too long");
    else if (vertical && m + length - 1 > GameBoard.BOARD_SIZE - 1)
      throw new Error("Ship too long");
  }
  receiveAttack(m, n) {
    if (this[m][n].isChecked()) throw new Error("Cell already checked");
    this[m][n].check();
    if (this[m][n].isShip()) this[m][n].ship.hit();
    return this.isShip(m, n);
  }
  areAllSunk() {
    return !this.aliveShips;
  }
  sinkAnother() {
    this.aliveShips--;
  }
  getAllShips() {
    return this.ships;
  }
  remove(m, n, length, vertical = false) {
    for (let i = 0; i < length; i++) {
      let row = m;
      let col = n;
      if (vertical) row = m + i;
      else col = n + i;
      this[row][col] = new BoardCell();
    }
    this.sinkAnother();
  }
}

export class GameState {
  static states = {
    PLAYER_TURN: "player_turn_state",
    COMPUTER_TURN: "computer_turn_state",
    PLACING_SHIPS: "player_placing_ships_state",
  };

  state = GameState.states["PLAYER_TURN"];
  #stateChangeEvent = new CustomEvent("game_state_changed");

  changeState(new_state) {
    this.state = new_state;
  }

  get stateChangeEvent() {
    return this.#stateChangeEvent;
  }
}

export const globalGameState = new GameState();

class BoardCell {
  constructor() {
    this.checked = false;
    this.ship = false;
  }
  makeShip(shipObj) {
    this.ship = shipObj;
  }
  unmakeShip() {
    this.ship = false;
  }
  isShip() {
    return !!this.ship;
  }
  isChecked() {
    return this.checked;
  }
  check() {
    this.checked = true;
  }
}

export class Player {
  constructor() {
    this.board = new GameBoard();
  }
  placeShips() {
    let i = 0;
    const lengths = [5, 4, 3, 3, 2];
    while (i < lengths.length) {
      try {
        const m = this.getRandomCoords();
        const n = this.getRandomCoords();
        this.board.place(m, n, lengths[i], Math.floor(Math.random() * 2));
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

export class ComputerPly extends Player {
  constructor() {
    super();
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

export function shuffle(arr) {
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

