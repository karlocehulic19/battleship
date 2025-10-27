import { placeFromEvent, turn, ply1 } from "./index";
import emptyUrl from "../media/cross.svg";
import { ErrorMessage } from "./load";
import { GameBoard } from "./logic/logic";

export class GridController {
  static cellClickEvents = [];
  static cellDragEvents = [];
  static cellDropEvents = [];
  private div: HTMLDivElement;
  constructor(selectedDiv: HTMLDivElement) {
    this.div = selectedDiv;
  }
  showShip(m: number, n: number, length: number, vertical = false) {
    for (let i = 0; i < length; i++) {
      let cell: HTMLDivElement;
      if (vertical)
        cell = this.div.querySelector(`[data-row="${m + i}"][data-col="${n}"]`);
      else
        cell = this.div.querySelector(`[data-row="${m}"][data-col="${n + i}"]`);
      cell.classList.add("ship");
    }
  }
  reviewEmpty(m: number, n: number) {
    const cell = this.div.querySelector(`[data-row="${m}"][data-col="${n}"]`);
    const emptyImg = document.createElement("img");

    emptyImg.src = emptyUrl;

    cell.appendChild(emptyImg);
  }
  reviewShip(m: number, n: number) {
    const cell = this.div.querySelector(`[data-row="${m}"][data-col="${n}"]`);
    const shipImg = document.createElement("img");

    shipImg.src = emptyUrl;

    cell.classList.add("ship");
    cell.appendChild(shipImg);
  }
  static clearGrid(specific?: HTMLElement) {
    const grid = specific || document.body;
    grid.querySelectorAll(".cell").forEach((cell) => {
      cell.textContent = "";
      cell.className = "cell";
    });
  }
  static displayTurn() {
    const leftTitle = document.querySelector("#left-playing-div p");
    const rightTitle = document.querySelector("#right-playing-div p");

    leftTitle.classList.toggle("turn");
    rightTitle.classList.toggle("turn");
  }
  makeCellsAcceptDrag() {
    this.div.querySelectorAll(".cell").forEach((cell) => {
      const addDrag = (e: Event) => {
        const ship = DragShip.picked;
        const target = e.target as HTMLElement;
        const currRow = +target.getAttribute("data-row");
        const currCol = +target.getAttribute("data-col");
        let targetRow = currRow;
        let targetCol = currCol;
        if (ship.vertical) {
          targetRow =
            currRow - ship.cellFrom > -1 ? currRow - ship.cellFrom : 0;
          targetRow =
            targetRow > 10 - ship.length ? 10 - ship.length : targetRow;
        } else {
          targetCol =
            currCol - ship.cellFrom > -1 ? currCol - ship.cellFrom : 0;
          targetCol =
            targetCol > 10 - ship.length ? 10 - ship.length : targetCol;
        }
        const elem = this.div.querySelector(
          `[data-row="${targetRow}"][data-col="${targetCol}"]`,
        );
        elem.appendChild(ship.getElement());
        ship.place(targetRow, targetCol);
      };
      const onDrop = (e: Event) => {
        try {
          ply1.logic.board.place(...DragShip.picked.getPlacingValue());
        } catch (error) {
          new ErrorMessage(error).show(1000);
          DragShip.picked.sendBack(e, true);
        }
      };
      GridController.cellDragEvents.push([cell, addDrag]);
      GridController.cellDropEvents.push([cell, onDrop]);
      // Needed for triggering drop event
      cell.addEventListener("dragover", (e) => e.preventDefault());
      cell.addEventListener("dragenter", addDrag);
      cell.addEventListener("drop", onDrop);
    });
  }
  static addListenersToCells(computer = true) {
    let grid = document.body;
    if (computer) grid = document.querySelector("#right-playing-div");
    grid.querySelectorAll(".cell").forEach((cell) => {
      // Last arguments represents witch cell was clicked, left or right side one
      // True for left
      const funct = () => {
        if (!turn.isPlaying()) {
          const playBtn = document.querySelector(
            ".play-btn",
          ) as HTMLButtonElement;
          playBtn.click();

          if (!turn.isPlaying()) return;
        }
        placeFromEvent(
          +cell.getAttribute("data-row"),
          +cell.getAttribute("data-col"),
          document.getElementById("left-playing-div").contains(cell),
        );
      };
      GridController.cellClickEvents.push([cell, funct]);
      cell.addEventListener("click", funct);
    });
  }
  static removeCellsListeners() {
    GridController.cellClickEvents.forEach((l) =>
      l[0].removeEventListener("click", l[1]),
    );
    GridController.cellClickEvents = [];
  }
  static removeDragListeners() {
    GridController.cellDragEvents.forEach((l) =>
      l[0].removeEventListener("dragenter", l[1]),
    );
    GridController.cellDropEvents.forEach((l) =>
      l[0].removeEventListener("drop", l[1]),
    );
    GridController.cellDragEvents = [];
    GridController.cellDropEvents = [];
  }
}

export class ShipContainerController {
  private div: HTMLDivElement;
  private container: HTMLDivElement;
  private ships: any[];
  private computer: boolean;

  constructor(
    div: HTMLDivElement,
    board: GameBoard,
    computer = false,
    hide = false,
  ) {
    this.div = div;
    this.container = div.querySelector(".ship-container");
    this.container.textContent = "";
    this.computer = computer;
    if (this.computer) {
      this.ships = board.ships;
      this.ships.sort((a, b) => b[2] - a[2]);
      this.ships.forEach((ship) => {
        const shipElem = this.createShip(ship[2]);
        this.container.appendChild(shipElem);
        PubSub.subscribe(ship[4].publish, () => {
          shipElem.remove();
        });
      });
    } else if (!hide) {
      for (let n of [5, 4, 3, 3, 2]) {
        const dragShip = new DragShip(n);
        this.container.appendChild(dragShip.getElement());
      }
    }
  }
  createShip(length: number) {
    const ship = document.createElement("div");
    const size = getComputedStyle(this.div.querySelector(".cell")).height;
    for (let n = 0; n < length; n++) {
      const block = document.createElement("div");
      block.style.height = size;
      block.style.width = size;

      ship.appendChild(block);
    }

    ship.className = "display-ship";
    return ship;
  }
  getElement() {
    return this.container;
  }
}

class DragShip {
  static picked: DragShip;
  static shipId = 0;

  private m: number;
  private n: number;
  private shipId: number;
  private main: HTMLDivElement;
  cellFrom: number;
  length: number;
  vertical: boolean;
  constructor(length: number) {
    this.length = length;
    this.m = null;
    this.n = null;
    this.shipId = DragShip.shipId;
    this.vertical = false;
    DragShip.shipId++;
    this.cellFrom = 0;
    this.create();
  }
  create() {
    this.main = document.createElement("div");
    this.main.className = "display-ship";
    this.main.draggable = true;
    const publish = `dragship-${this.shipId}`;
    for (let n = 0; n < this.length; n++) {
      const cell = new DragShipCell(n, publish);
      this.main.appendChild(cell.getElement());
    }
    PubSub.subscribe(publish, (msg, data) => {
      this.cellFrom = data;
    });
    this.main.addEventListener("drag", () => {
      this.getElement().classList.add("transparent");
      DragShip.picked = this;
    });
    this.main.addEventListener("dragenter", (e) => e.stopPropagation());
    this.main.addEventListener("click", (e) => this.rotate(e));
    this.main.addEventListener("dragend", (e) => this.sendBack(e));
    this.main.addEventListener("dragstart", () => this.clear());
  }
  clear() {
    if (this.m !== null && this.n !== null) {
      ply1.logic.board.remove(...this.getPlacingValue());
    }
  }
  rotate(e: Event) {
    try {
      this.clear();
      this.vertical = !this.vertical;
      this.main.classList.toggle("vertical");
      if (this.m !== null && this.n !== null)
        ply1.logic.board.place(...this.getPlacingValue());
    } catch (error) {
      new ErrorMessage(error).show(1000);
      this.sendBack(e, true);
    }
  }
  sendBack(e: Event, ignore = false) {
    this.getElement().classList.remove("transparent");
    if (
      ignore ||
      (e instanceof DragEvent && e.dataTransfer.dropEffect === "none")
    ) {
      this.getElement().classList.remove("on-grid");
      document
        .querySelector("#left-playing-div .ship-container")
        .appendChild(this.getElement());
      this.resetCoords();
    }
  }
  getElement() {
    return this.main;
  }
  place(m: number, n: number) {
    this.getElement().classList.add("on-grid");
    this.m = m;
    this.n = n;
  }
  resetCoords() {
    this.m = null;
    this.n = null;
  }
  getPlacingValue(): [number, number, number, boolean] {
    return [this.m, this.n, this.length, this.vertical];
  }
}

class DragShipCell {
  private id: number;
  private publish: string;
  private main: HTMLDivElement;

  constructor(id: number, publish: string) {
    this.id = id;
    this.publish = publish;
    this.create();
  }
  create() {
    this.main = document.createElement("div");
    const size = getComputedStyle(document.querySelector(".cell")).height;
    this.main.style.height = size;
    this.main.style.width = size;
    this.main.addEventListener("mousedown", () => {
      PubSub.publish(this.publish, +this.id);
    });
  }
  getElement() {
    return this.main;
  }
}

export const leftGrid = new GridController(
  document.querySelector("#left-playing-div .main-grid-div"),
);
export const rightGrid = new GridController(
  document.querySelector("#right-playing-div .main-grid-div"),
);
