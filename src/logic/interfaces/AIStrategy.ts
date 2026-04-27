export enum CellState {
  UNKNOWN,
  MISS,
  HIT,
  SUNK,
}

export type BoardSnapshot = {
  readonly size: number;
  readonly cells: ReadonlyArray<ReadonlyArray<CellState>>;
  readonly sunkShipLengths: ReadonlyArray<number>;
};

export interface AIStrategy {
  nextMove(snapshot: BoardSnapshot): [number, number];
}
