import PubSub from "pubsub-js";
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

  PubSub.subscribe(
    "game_state_changed",
    (_msg: string, state: GameStateValue) => {
      actionText.textContent = messageMapping[state];
    },
  );
}
