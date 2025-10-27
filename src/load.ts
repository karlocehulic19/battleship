import { randomize, reset, startGame } from "./index";
import { createActionText } from "./components/actionText";
import { GameStateValue } from "./logic/GameState";
import { globalGameState } from "./logic/logic";

createActionText();
export function createGrids(firstPlayerName: string, secondPlayerName: string) {
  const leftDiv = document.createElement("div");
  const rightDiv = document.createElement("div");
  const leftGrid = new Grid();
  const rightGrid = new Grid();
  const leftName = document.createElement("p");
  const rightName = document.createElement("p");
  const leftContainer = new ShipContainer();
  const rightContainer = new ShipContainer({ isOpponent: true });

  leftDiv.className = "playing-div";
  leftDiv.id = "left-playing-div";
  rightDiv.className = "playing-div";
  rightDiv.id = "right-playing-div";

  leftName.textContent = firstPlayerName;
  leftName.classList.add("turn");
  rightName.textContent = secondPlayerName;

  leftDiv.appendChild(leftGrid.getElement());
  leftDiv.appendChild(leftName);
  leftDiv.appendChild(leftContainer.getElement());
  rightDiv.appendChild(rightGrid.getElement());
  rightDiv.appendChild(rightName);
  rightDiv.appendChild(rightContainer.getElement());

  document.querySelector(".content").appendChild(leftDiv);
  document.querySelector(".content").appendChild(rightDiv);
}

class Grid {
  static SIZE = 10;
  private mainDiv: HTMLDivElement;
  constructor() {
    this.mainDiv = document.createElement("div");
    this.mainDiv.className = "main-grid-div";
    this.mainDiv.setAttribute(`data-size`, Grid.SIZE.toString());
    for (let m = 0; m < Grid.SIZE; m++) {
      for (let n = 0; n < Grid.SIZE; n++) {
        const cell = document.createElement("div");
        cell.className = "cell";
        cell.setAttribute("data-row", m.toString());
        cell.setAttribute("data-col", n.toString());
        this.mainDiv.appendChild(cell);
      }
    }
  }
  getElement() {
    return this.mainDiv;
  }
}

type ShipContainerOptions = {
  isOpponent?: boolean;
};

class ShipContainer {
  private container: HTMLDivElement;

  constructor(options?: ShipContainerOptions) {
    this.container = document.createElement("div");
    this.container.classList.add("ship-container");
    if (options?.isOpponent) {
      this.container.classList.add("opponent");
    } else {
      this.container.classList.add("player");
    }
  }
  getElement() {
    return this.container;
  }
}

createGrids("Player", "Computer");

export class ErrorMessage {
  private div: HTMLDivElement;

  constructor(error: string) {
    const errorDiv = document.createElement("div");
    const errorP = document.createElement("p");

    errorDiv.className = "error-div";
    errorP.className = "error-p";
    errorP.textContent = error;

    errorDiv.appendChild(errorP);
    this.div = errorDiv;
  }
  show(ms: number) {
    document.body.appendChild(this.div);
    if (ms) setTimeout(() => this.remove(), ms);
  }
  remove() {
    this.div.remove();
  }
}

export class WinningMessage {
  static winDiv = document.createElement("div");
  static create(name: string, boatsLeft: number, callBack: () => any) {
    const winP = document.createElement("p");
    const resetButton = document.createElement("button");

    WinningMessage.winDiv.className = "win-div";
    winP.className = "win-p";
    winP.textContent = `${name} won! With ${boatsLeft} boats left!`;
    resetButton.className = "win-btn";
    resetButton.textContent = "Play again";
    resetButton.addEventListener("click", () => {
      WinningMessage.remove();
      callBack();
      globalGameState.changeState(GameStateValue.PLACING_SHIPS);
    });

    WinningMessage.winDiv.appendChild(winP);
    WinningMessage.winDiv.appendChild(resetButton);
    document.body.appendChild(WinningMessage.winDiv);
  }
  static remove() {
    WinningMessage.winDiv.textContent = "";
    document.body.removeChild(WinningMessage.winDiv);
  }
}

class FunctButtons {
  static buttonsDiv = document.createElement("div");
  static createRandom() {
    const btn = document.createElement("button");
    btn.textContent = "random";
    btn.className = "fnct-btn";
    btn.addEventListener("click", () => randomize());
    FunctButtons.buttonsDiv.appendChild(btn);
  }
  static createReset() {
    const btn = document.createElement("button");
    btn.textContent = "reset";
    btn.className = "fnct-btn";
    btn.addEventListener("click", () => reset());
    FunctButtons.buttonsDiv.appendChild(btn);
  }
  static create() {
    FunctButtons.buttonsDiv.className = "fnct-btn-div";
    document
      .querySelector("#left-playing-div")
      .appendChild(FunctButtons.buttonsDiv);
    FunctButtons.createRandom();
    FunctButtons.createReset();
  }
}

export class PlayButton {
  private btn: HTMLButtonElement;

  constructor() {
    this.btn = document.createElement("button");
    this.btn.className = "play-btn";
    this.btn.textContent = "Play!";
    this.btn.addEventListener("click", () => {
      if (startGame()) {
        this.btn.remove();
      }
    });
    document.body.appendChild(this.btn);
  }
}

FunctButtons.create();
