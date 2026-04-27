import { AIStrategy, BoardSnapshot, CellState } from "../interfaces/AIStrategy";

export class RandomAIStrategy implements AIStrategy {
  private remaining: [number, number][];

  constructor() {
    this.remaining = [];
  }

  nextMove(snapshot: BoardSnapshot): [number, number] {
    if (this.remaining.length === 0) {
      this.remaining = this.buildShuffledMoves(snapshot.size);
    }

    // Skip cells already revealed in the snapshot
    while (this.remaining.length > 0) {
      const move = this.remaining.pop()!;
      if (snapshot.cells[move[0]][move[1]] === CellState.UNKNOWN) {
        return move;
      }
    }

    throw new Error("No valid moves remaining");
  }

  private buildShuffledMoves(size: number): [number, number][] {
    const moves: [number, number][] = [];
    for (let row = 0; row < size; row++) {
      for (let col = 0; col < size; col++) {
        moves.push([row, col]);
      }
    }
    this.shuffle(moves);
    return moves;
  }

  private shuffle(arr: [number, number][]): void {
    let i = arr.length - 1;
    while (i > 0) {
      const j = Math.floor(Math.random() * arr.length);
      [arr[i], arr[j]] = [arr[j], arr[i]];
      i--;
    }
  }
}
