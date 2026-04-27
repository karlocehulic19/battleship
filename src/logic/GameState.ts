import PubSub from "pubsub-js";

export enum GameStateValue {
  PLAYER_TURN,
  COMPUTER_TURN,
  PLACING_SHIPS,
}

export class GameState {
  state = GameStateValue.PLAYER_TURN;

  changeState(new_state: GameStateValue) {
    this.state = new_state;
    PubSub.publish("game_state_changed", this.state);
  }
}
