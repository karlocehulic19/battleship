export interface PlacingItem {
  length: number;
}

export class Ship implements PlacingItem {
  length: number;
  static getShipFleetFromArray(array: number[]) {
    const fleet: Ship[] = [];
    for (const length of array) {
      fleet.push(new Ship(length));
    }

    return fleet;
  }

  constructor(length: number) {
    this.length = length;
  }
}
