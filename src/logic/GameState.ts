export enum GameStateValue {
  PLAYER_TURN,
  COMPUTER_TURN,
  PLACING_SHIPS,
}

export class GameState {
  state = GameStateValue.PLAYER_TURN;
  private _stateChangeEvent = new CustomEvent("game_state_changed");

  changeState(new_state: GameStateValue) {
    this.state = new_state;
    dispatchEvent(this._stateChangeEvent);
  }

  get stateChangeEvent() {
    return this._stateChangeEvent;
  }
}
