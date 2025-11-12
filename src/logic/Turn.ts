import { GridPlayer } from "../index";
import { GameStateValue } from "./GameState";
import { GridController } from "../ui-controller";
import { computerPlay } from "../index";
import { globalGameState } from "./logic";
import { ComputerPly } from "./logic";

export class Turn {
  private left: GridPlayer;
  private right: GridPlayer;
  private next: GridPlayer;
  private play: boolean;

  constructor(ply1: GridPlayer, ply2: GridPlayer) {
    this.left = ply1;
    this.right = ply2;
    this.next = ply1;
    this.play = false;
  }

  isLeftTurn() {
    return this.next === this.left;
  }

  getNext() {
    return this.next;
  }

  getNextAttacked() {
    return this.next == this.left ? this.right : this.left;
  }

  changeTurn() {
    GridController.displayTurn();
    if (this.next === this.left) {
      globalGameState.changeState(GameStateValue.COMPUTER_TURN);
      this.next = this.right;
      computerPlay();
    } else {
      this.next = this.left;
      globalGameState.changeState(GameStateValue.PLAYER_TURN);
    }
  }

  isComputerPlaying() {
    return this.right.logic instanceof ComputerPly;
  }

  isPlaying() {
    return this.play;
  }

  startPlaying() {
    this.play = true;
    globalGameState.changeState(GameStateValue.PLAYER_TURN);
    GridController.removeDragListeners();
  }
}
