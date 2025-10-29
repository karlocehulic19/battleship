import { ShipCell } from "./ShipCell";
import { GameItem } from "./interfaces/GameItem";

export class Ship implements GameItem {
  length: number;
  vertical: boolean;
  static getNewShipFleetFromArray(array: number[]) {
    const fleet: Ship[] = [];
    for (const length of array) {
      fleet.push(new Ship(length));
    }

    return fleet;
  }

  constructor(length: number, vertical = false) {
    this.length = length;
    this.vertical = vertical;
  }

  changeDirection(): boolean {
    this.vertical = !this.vertical;
    return this.vertical;
  }
}
