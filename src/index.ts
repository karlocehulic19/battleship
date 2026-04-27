import "./styles.css";
import PubSub from "pubsub-js";
import {
  GridController,
  ShipContainerController,
  leftGrid,
  rightGrid,
} from "./ui/ui-controller";
import { PlayerAdapter } from "./logic/GameAdapter";
import { ErrorMessage, PlayButton, WinningMessage } from "./ui/load";
import { Turn } from "./logic/Turn";
import { GridPlayer } from "./types/GridPlayer";
import { globalGameState } from "./logic/logic";
import { GameStateValue } from "./logic/GameState";

export type { GridPlayer };

const WINNING_CHANNEL = "win";

export let ply1: GridPlayer;
let ply2: GridPlayer;
export let turn: any;

function play() {
  GridController.clearGrid();
  ply1 = {
    adapter: new PlayerAdapter(),
    grid: leftGrid,
    name: "Player",
  };
  ply2 = {
    adapter: new PlayerAdapter(true),
    grid: rightGrid,
    name: "Computer",
  };
  new PlayButton();
  turn = new Turn(ply1, ply2);

  ply1.container = new ShipContainerController(
    document.querySelector("#left-playing-div"),
    ply1.adapter,
  );
  ply2.container = new ShipContainerController(
    document.querySelector("#right-playing-div"),
    ply2.adapter,
    turn.isComputerPlaying(),
  );

  ply1.grid.makeCellsAcceptDrag();

  GridController.removeCellsListeners();
  GridController.addListenersToCells(turn.isComputerPlaying());
}

export function placeFromEvent(m: number, n: number, left: boolean) {
  if (turn.isLeftTurn() !== left) {
    try {
      const ply = turn.getNextAttacked();
      const result = ply.adapter.attack(m, n);
      if (result.hit) {
        ply.grid.reviewShip(m, n);
        if (result.allSunk) {
          PubSub.publish(WINNING_CHANNEL, {
            winnerName: turn.getNext().name,
            winnerShipNumber: turn.getNext().adapter.getAliveShipCount(),
          });
        }
      } else {
        ply.grid.reviewEmpty(m, n);
        turn.changeTurn();
      }
    } catch (error) {
      let errorMsg: ErrorMessage;
      if (error instanceof Error) {
        errorMsg = new ErrorMessage(error.message);
        errorMsg.show(2000);
      }
    }
  } else if (!turn.isComputerPlaying()) {
    const wrongGrid = new ErrorMessage(
      "Please select one cell of opponents grid",
    );
    wrongGrid.show(2000);
  }
}

export async function computerPlay() {
  while (!turn.isLeftTurn()) {
    const nextAttack = turn.getNext().adapter.nextMove();
    await new Promise((resolve) => setTimeout(resolve, 1000));
    placeFromEvent(nextAttack[0], nextAttack[1], true);
  }
}

function declareWinner(msg: string, data: any) {
  WinningMessage.create(data.winnerName, data.winnerShipNumber, () => {
    globalGameState.changeState(GameStateValue.PLACING_SHIPS);
    play();
  });
}

export function randomize() {
  if (turn.isPlaying()) {
    new ErrorMessage("Game already started").show(1000);
    return;
  }
  GridController.removeDragListeners();
  GridController.clearGrid(document.querySelector("#left-playing-div"));
  ply1 = {
    adapter: new PlayerAdapter(),
    grid: leftGrid,
    name: "Player",
  };
  turn = new Turn(ply1, ply2);

  ply1.container = new ShipContainerController(
    document.querySelector("#left-playing-div"),
    ply1.adapter,
    false,
    true,
  );

  const placements = ply1.adapter.randomizeShips();
  placements.forEach(({ row, col, token }) =>
    ply1.grid.showShip(row, col, token),
  );
}

export function reset() {
  if (turn.isPlaying()) {
    new ErrorMessage("Game already started").show(1000);
    return;
  }
  ply1.grid.makeCellsAcceptDrag();
  GridController.clearGrid(document.querySelector("#left-playing-div"));
  ply1 = {
    adapter: new PlayerAdapter(),
    grid: leftGrid,
    name: "Player",
  };

  turn = new Turn(ply1, ply2);

  ply1.container = new ShipContainerController(
    document.querySelector("#left-playing-div"),
    ply1.adapter,
  );
}

export function startGame() {
  if (!ply1.container.getElement().childNodes.length) {
    turn.startPlaying();
    return true;
  } else {
    const error = new ErrorMessage("Place your ships to start game!");
    error.show(1500);
  }
  return false;
}

play();
PubSub.subscribe(WINNING_CHANNEL, declareWinner);
PubSub.subscribe("turn_changed", (_msg: string, isLeftTurn: boolean) => {
  GridController.displayTurn();
  if (!isLeftTurn) computerPlay();
});
PubSub.subscribe("game_started", () => {
  GridController.removeDragListeners();
});
