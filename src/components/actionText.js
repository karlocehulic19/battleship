import { GameState, globalGameState } from "../logic";

export function createActionText() {
  const messageMapping = {
    [GameState.states["PLAYER_TURN"]]:
      "Its your turn, click on oppents board to attack his shitps",
    [GameState.states["COMPUTER_TURN"]]:
      "Wait for the opponent to finsih attacking",
    [GameState.states["PLACING_SHIPS"]]:
      "Hello, place your boards and click play to start!",
  };

  const actionText = document.createElement("h1");
  actionText.id = "action-text";

  actionText.textContent = messageMapping[GameState.states["PLACING_SHIPS"]];
  document.body.appendChild(actionText);

  addEventListener(globalGameState.stateChangeEvent, () => {
    actionText.textContent = messageMapping[globalGameState.state];
  });
}
