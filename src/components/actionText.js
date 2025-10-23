import { globalGameState } from "../logic/logic";
import { GameStateValue } from "../logic/GameState";

export function createActionText() {
  const messageMapping = {
    [GameStateValue.PLAYER_TURN]:
      "Its your turn, click on oppents board to attack his ships",
    [GameStateValue.COMPUTER_TURN]: "Wait for the opponent to finsih attacking",
    [GameStateValue.PLACING_SHIPS]:
      "Hello, place your ships and click play to start!",
  };

  const actionText = document.createElement("h1");
  actionText.id = "action-text";

  actionText.textContent = messageMapping[GameStateValue.PLACING_SHIPS];
  document.body.appendChild(actionText);

  addEventListener(globalGameState.stateChangeEvent.type, () => {
    actionText.textContent = messageMapping[globalGameState.state];
  });
}
