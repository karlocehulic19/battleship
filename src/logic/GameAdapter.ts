import { Player, ComputerPly, GameBoard } from "./logic";
import { Ship } from "./Ship";

export type ShipToken = {
  id: string;
  length: number;
  vertical: boolean;
  changeDirection(): boolean;
  sunkChannel: string;
};

export type ShipPlacement = {
  row: number;
  col: number;
  token: ShipToken;
};

export type AttackResult = {
  hit: boolean;
  allSunk: boolean;
  aliveShipCount: number;
};

function shipToToken(ship: Ship, id: string): ShipToken {
  return {
    id,
    get length() {
      return ship.length;
    },
    get vertical() {
      return ship.vertical;
    },
    changeDirection() {
      return ship.changeDirection();
    },
    get sunkChannel() {
      return ship.publishChannel;
    },
  };
}

export class PlayerAdapter {
  readonly isComputer: boolean;
  private player: Player;
  private tokenMap: Map<string, Ship> = new Map();
  private tokenIdCounter = 0;

  constructor(computer = false) {
    this.isComputer = computer;
    this.player = computer ? new ComputerPly() : new Player();
  }

  private get board(): GameBoard {
    return this.player.board;
  }

  private makeToken(ship: Ship): ShipToken {
    const id = `ship-token-${this.tokenIdCounter++}`;
    this.tokenMap.set(id, ship);
    return shipToToken(ship, id);
  }

  attack(row: number, col: number): AttackResult {
    const hit = this.board.receiveAttack(row, col);
    return {
      hit,
      allSunk: this.board.areAllSunk(),
      aliveShipCount: this.getAliveShipCount(),
    };
  }

  placeShip(row: number, col: number, token: ShipToken): void {
    this.board.place(row, col, token);
  }

  removeShip(row: number, col: number, token: ShipToken): void {
    this.board.remove(row, col, token);
  }

  randomizeShips(): ShipPlacement[] {
    this.player.placeShips();
    return this.getPlacedShips();
  }

  getPlacedShips(): ShipPlacement[] {
    return this.board.getAllShips().map((coordAndShip) => ({
      row: coordAndShip.row,
      col: coordAndShip.col,
      token: shipToToken(coordAndShip.ship, coordAndShip.ship.publishChannel),
    }));
  }

  getAvailableShips(): ShipToken[] {
    return this.board.getAllPossibleShips().map((ship) => this.makeToken(ship));
  }

  getAliveShipCount(): number {
    return this.board.getAliveShipCount();
  }

  nextMove(): [number, number] | undefined {
    if (!(this.player instanceof ComputerPly)) return undefined;
    return this.player.guessRandom();
  }
}
