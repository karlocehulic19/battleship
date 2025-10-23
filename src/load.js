import { randomize, reset, startGame } from ".";
import { createActionText } from "./components/actionText";
import { GameState, globalGameState } from "./logic";

createActionText();
export function createGrids(firstPlyName, scndPlyName) {
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

  leftName.textContent = firstPlyName;
  leftName.classList.add("turn");
  rightName.textContent = scndPlyName;

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
  constructor() {
    this.mainDiv = document.createElement("div");
    this.mainDiv.className = "main-grid-div";
    this.mainDiv.setAttribute(`data-size`, Grid.SIZE);
    for (let m = 0; m < Grid.SIZE; m++) {
      for (let n = 0; n < Grid.SIZE; n++) {
        const cell = document.createElement("div");
        cell.className = "cell";
        cell.setAttribute("data-row", m);
        cell.setAttribute("data-col", n);
        this.mainDiv.appendChild(cell);
      }
    }
  }
  getElement() {
    return this.mainDiv;
  }
}

class ShipContainer {
  constructor(options) {
    this.container = document.createElement("div");
    this.container.classList.add("ship-container");
    if (options && options.isOpponent) {
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
  constructor(error) {
    const errorDiv = document.createElement("div");
    const errorP = document.createElement("p");

    errorDiv.className = "error-div";
    errorP.className = "error-p";
    errorP.textContent = error;

    errorDiv.appendChild(errorP);
    this.div = errorDiv;
  }
  show(ms) {
    document.body.appendChild(this.div);
    if (ms) setTimeout(() => this.remove(), ms);
  }
  remove() {
    this.div.remove();
  }
}

export class WinningMessage {
  static winDiv = document.createElement("div");
  static create(name, boatsLeft, callBack) {
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
      globalGameState.changeState(GameState.states["PLACING_SHIPS"]);
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
