import "./styles.css";
import PubSub from "pubsub-js";
import {
  GridController,
  ShipContainerController,
  leftGrid,
  rightGrid,
} from "./ui-controller";
import { ComputerPly, Player } from "./logic/logic";
import { ErrorMessage, PlayButton, WinningMessage } from "./load";
import { Turn } from "./logic/Turn";

const WINNING_CHANNEL = "win";

export let ply1: GridPlayer;
let ply2: GridPlayer;
export let turn: any;

export type GridPlayer = {
  logic: Player;
  grid: any;
  name: string;
  container?: any;
};

function play() {
  GridController.clearGrid();
  ply1 = {
    logic: new Player(),
    grid: leftGrid,
    name: "Player",
  };
  ply2 = {
    logic: new ComputerPly(),
    grid: rightGrid,
    name: "Computer",
  };
  new PlayButton();
  turn = new Turn(ply1, ply2);

  ply1.container = new ShipContainerController(
    document.querySelector("#left-playing-div"),
    ply1.logic.board,
  );
  ply2.container = new ShipContainerController(
    document.querySelector("#right-playing-div"),
    ply2.logic.board,
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
      if (ply.logic.board.receiveAttack(m, n)) {
        ply.grid.reviewShip(m, n);
        if (ply.logic.board.areAllSunk()) {
          PubSub.publish(WINNING_CHANNEL, {
            winnerName: turn.getNext().name,
            winnerShipNumber: turn.getNext().logic.board.aliveShips,
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
    const nextAttack = turn.getNext().logic.guessRandom();
    await new Promise((resolve) => setTimeout(resolve, 1000));
    placeFromEvent(nextAttack[0], nextAttack[1], true);
  }
}

function declareWinner(msg: string, data: any) {
  WinningMessage.create(data.winnerName, data.winnerShipNumber, () => play());
}

export function randomize() {
  if (turn.isPlaying()) {
    new ErrorMessage("Game already started").show(1000);
    return;
  }
  GridController.removeDragListeners();
  GridController.clearGrid(document.querySelector("#left-playing-div"));
  ply1 = {
    logic: new Player(),
    grid: leftGrid,
    name: "Player",
  };
  turn = new Turn(ply1, ply2);

  ply1.container = new ShipContainerController(
    document.querySelector("#left-playing-div"),
    ply1.logic.board,
    false,
    true,
  );

  ply1.logic.placeShips();
  ply1.logic.board
    .getAllShips()
    .forEach((mapping) =>
      ply1.grid.showShip(mapping.row, mapping.col, mapping.ship),
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
    logic: new Player(),
    grid: leftGrid,
    name: "Player",
  };

  turn = new Turn(ply1, ply2);

  ply1.container = new ShipContainerController(
    document.querySelector("#left-playing-div"),
    ply1.logic.board,
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
