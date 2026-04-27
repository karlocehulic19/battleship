import { placeFromEvent, turn, ply1 } from "../index";
import emptyUrl from "../../media/cross.svg";
import { ErrorMessage } from "./load";
import { PlayerAdapter, ShipToken } from "../logic/GameAdapter";
import { GameItem } from "../logic/interfaces/GameItem";

type ElementAndHandler = [Element, (e: Event) => void];

export class GridController {
  static cellClickEvents: ElementAndHandler[] = [];
  static cellDragEvents: ElementAndHandler[] = [];
  static cellDropEvents: ElementAndHandler[] = [];
  private div: Element;
  constructor(selectedDiv: Element) {
    this.div = selectedDiv;
  }
  showShip(m: number, n: number, item: GameItem) {
    const length = item.length;
    const vertical = item.vertical;

    for (let i = 0; i < length; i++) {
      let cell: HTMLDivElement | null;
      if (vertical)
        cell = this.div.querySelector(`[data-row="${m + i}"][data-col="${n}"]`);
      else
        cell = this.div.querySelector(`[data-row="${m}"][data-col="${n + i}"]`);
      cell?.classList.add("ship");
    }
  }
  reviewEmpty(m: number, n: number) {
    const cell = this.div.querySelector(`[data-row="${m}"][data-col="${n}"]`);
    const emptyImg = document.createElement("img");

    emptyImg.src = emptyUrl;

    cell?.appendChild(emptyImg);
  }
  reviewShip(m: number, n: number) {
    const cell = this.div.querySelector(`[data-row="${m}"][data-col="${n}"]`);
    const shipImg = document.createElement("img");

    shipImg.src = emptyUrl;

    cell?.classList.add("ship");
    cell?.appendChild(shipImg);
  }
  static clearGrid(specific?: Element | null) {
    const grid = specific || document.body;
    grid.querySelectorAll(".cell").forEach((cell) => {
      cell.textContent = "";
      cell.className = "cell";
    });
  }
  static displayTurn() {
    const leftTitle = document.querySelector("#left-playing-div p");
    const rightTitle = document.querySelector("#right-playing-div p");

    leftTitle?.classList.toggle("turn");
    rightTitle?.classList.toggle("turn");
  }
  makeCellsAcceptDrag() {
    this.div.querySelectorAll(".cell").forEach((cell) => {
      const addDrag = (e: Event) => {
        const ship = DragShip.picked;
        const target = e.target as HTMLElement;
        const currRow = +(target.getAttribute("data-row") ?? -1);
        const currCol: number = +(target.getAttribute("data-col") ?? -1);
        let targetRow = currRow;
        let targetCol = currCol;
        if (ship.placingItem.vertical) {
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
        elem?.appendChild(ship.getElement());
        ship.place(targetRow, targetCol);
      };
      const onDrop = (e: Event) => {
        try {
          ply1.adapter.placeShip(...DragShip.picked.getPlacingValue());
        } catch (error) {
          if (error instanceof Error) {
            new ErrorMessage(error.message).show(1000);
            DragShip.picked.sendBack(e, true);
          }
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
    let grid: Element | null = document.body;
    if (computer) grid = document.querySelector("#right-playing-div");
    grid?.querySelectorAll(".cell").forEach((cell) => {
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
          +(cell.getAttribute("data-row") ?? -1),
          +(cell.getAttribute("data-col") ?? -1),
          !!document.getElementById("left-playing-div")?.contains(cell),
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
  private container: HTMLDivElement | null;
  private tokens: ShipToken[] = [];
  private computer: boolean;

  constructor(
    div: HTMLDivElement | null,
    adapter: PlayerAdapter,
    computer = false,
    hide = false,
  ) {
    if (!div) {
      throw new Error("Container not selected");
    }
    this.div = div;
    this.container = div.querySelector(".ship-container");
    if (this.container) {
      this.container.textContent = "";
    }
    this.computer = computer;
    if (this.computer) {
      this.tokens = adapter
        .getPlacedShips()
        .map((p) => p.token)
        .sort((a, b) => b.length - a.length);
      this.tokens.forEach((token) => {
        const shipElem = this.createShip(token.length);
        this.container?.appendChild(shipElem);
        PubSub.subscribe(token.sunkChannel, () => {
          shipElem.remove();
        });
      });
    } else if (!hide) {
      this.tokens = adapter.getAvailableShips();
      for (const token of this.tokens) {
        const dragShip = new DragShip(token);
        this.container?.appendChild(dragShip.getElement());
      }
    }
  }
  createShip(length: number) {
    const ship = document.createElement("div");
    const cell = this.div.querySelector(".cell");
    if (!cell) throw Error("Cell for ship is not found!");
    const size = getComputedStyle(cell).height;
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

  private m: number | null;
  private n: number | null;
  private shipId: number;
  private main: HTMLDivElement;
  placingItem: ShipToken;
  cellFrom: number;
  length: number;
  constructor(placingItem: ShipToken) {
    this.placingItem = placingItem;
    this.length = placingItem.length;
    this.m = null;
    this.n = null;
    this.shipId = DragShip.shipId;
    this.main = document.createElement("div");
    DragShip.shipId++;
    this.cellFrom = 0;
    this.create();
  }
  create() {
    this.main.className = "display-ship";
    this.main.draggable = true;
    const publish = `dragship-${this.shipId}`;
    for (let n = 0; n < this.length; n++) {
      const cell = new DragShipCell(n, publish);
      this.main.appendChild(cell.getElement());
    }
    PubSub.subscribe(publish, (msg: string, data: any) => {
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
      ply1.adapter.removeShip(...this.getPlacingValue());
    }
  }
  rotate(e: Event) {
    try {
      this.clear();
      this.main.classList.toggle("vertical");
      this.placingItem.changeDirection();

      if (this.m !== null && this.n !== null)
        ply1.adapter.placeShip(...this.getPlacingValue());
    } catch (error) {
      // TODO: test if this is proper implmenentation
      if (error instanceof Error) {
        new ErrorMessage(error.message).show(1000);
      }
      this.sendBack(e, true);
    }
  }
  sendBack(e: Event, ignore = false) {
    this.getElement().classList.remove("transparent");
    if (
      ignore ||
      (e instanceof DragEvent &&
        e.dataTransfer &&
        e.dataTransfer.dropEffect === "none")
    ) {
      this.getElement().classList.remove("on-grid");
      document
        .querySelector("#left-playing-div .ship-container")
        ?.appendChild(this.getElement());
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
  getPlacingValue(): [number, number, ShipToken] {
    if (this.m == null || this.n == null) {
      throw new Error("Ship hasn't yet been placed! ");
    }

    return [this.m, this.n, this.placingItem];
  }
}

class DragShipCell {
  private id: number;
  private publish: string;
  private main: HTMLDivElement;

  constructor(id: number, publish: string) {
    this.id = id;
    this.publish = publish;
    this.main = document.createElement("div");
    this.create();
  }
  create() {
    const cell = document.querySelector(".cell");
    if (!cell) {
      throw new Error("Cell for drag ship not found!");
    }
    const size = getComputedStyle(cell).height;
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

export const leftGridElement = document.querySelector(
  "#left-playing-div .main-grid-div",
);
if (!leftGridElement) {
  throw new Error("Left grid not found");
}
export const leftGrid = new GridController(leftGridElement);

export const rightGridElement = document.querySelector(
  "#right-playing-div .main-grid-div",
);
if (!rightGridElement) {
  throw new Error("Right grid not found");
}
export const rightGrid = new GridController(rightGridElement);
