import PubSub from "pubsub-js";
import { GameItem } from "./interfaces/GameItem";
import { GameBoard } from "./logic";

export class Ship implements GameItem {
  length: number;
  vertical: boolean;
  publishChannel: string;
  private hp: number;
  private board: GameBoard;
  static getNewShipFleetFromArray(array: number[], board: GameBoard) {
    const fleet: Ship[] = [];
    for (const length of array) {
      fleet.push(new Ship(length, board));
    }

    return fleet;
  }

  constructor(
    length: number,
    board: GameBoard,
    publish = "",
    vertical = false,
  ) {
    this.length = length;
    this.publishChannel = publish;
    this.vertical = vertical;
    this.hp = length;
    this.board = board;
  }

  changeDirection() {
    this.vertical = !this.vertical;
    return this.vertical;
  }

  hit() {
    if (!this.hp) throw new Error("Ship already sank");
    this.hp--;
    if (!this.hp) {
      PubSub.publishSync(this.publishChannel);
    }
  }

  get m() {
    return this.board.getShipRow(this);
  }

  get n() {
    return this.board.getShipCol(this);
  }

  isSunk() {
    return !this.hp;
  }
}
