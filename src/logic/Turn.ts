import PubSub from "pubsub-js";
import { GridPlayer } from "../types/GridPlayer";
import { GameStateValue } from "./GameState";
import { globalGameState } from "./logic";

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
    if (this.next === this.left) {
      globalGameState.changeState(GameStateValue.COMPUTER_TURN);
      this.next = this.right;
      PubSub.publish("turn_changed", false);
    } else {
      this.next = this.left;
      globalGameState.changeState(GameStateValue.PLAYER_TURN);
      PubSub.publish("turn_changed", true);
    }
  }

  isComputerPlaying() {
    return this.right.adapter.isComputer;
  }

  isPlaying() {
    return this.play;
  }

  startPlaying() {
    this.play = true;
    globalGameState.changeState(GameStateValue.PLAYER_TURN);
    PubSub.publish("game_started", null);
  }
}
