/* eslint-disable no-undef */
import { Ship, GameBoard, Player, ComputerPly, shuffle } from "./logic/logic";

describe("Ships", () => {
  let ship;
  beforeEach(() => {
    ship = new Ship(3);
  });

  test("Ship exists", () => {
    expect(ship).toBeInstanceOf(Ship);
  });

  test("Ship sunk after three hits", () => {
    ship.hit();
    ship.hit();
    ship.hit();
    expect(ship.isSunk()).toBe(true);
  });

  test("Ship didn't sink after two hits, but then sinks", () => {
    ship.hit();
    ship.hit();
    expect(ship.isSunk()).toBe(false);
    ship.hit();
    expect(ship.isSunk()).toBe(true);
  });

  test("Hitting after specified length", () => {
    ship.hit();
    ship.hit();
    ship.hit();
    expect(() => ship.hit()).toThrow("Ship already sank");
  });
});

describe("Board", () => {
  let board;
  // [<y-cord>, <x-cord>, <ship-size>]
  let ships = [
    [0, 0, 5],
    [2, 2, 4],
    [8, 6, 3],
    [9, 6, 3],
    [5, 8, 2],
  ];
  beforeEach(() => {
    board = new GameBoard();
    for (let s of ships) board.place(...s);
  });

  test("Positive ship validation", () => {
    for (let n of ships) {
      expect(board.isShip(n[0], n[1])).toBe(true);
    }
  });

  test("Negative ship validation", () => {
    expect(board.isShip(0, 6)).toBe(false);
    expect(board.isShip(2, 6)).toBe(false);
  });

  test("Non direct ship validation", () => {
    expect(board.isShip(0, 1)).toBe(true);
    expect(board.isShip(0, 4)).toBe(true);
    expect(board.isShip(2, 3)).toBe(true);
  });

  test("Invalid placement (wrong coordinates)", () => {
    expect(() => board.place(0, 10, 2)).toThrow("Wrong ship coordinates");
    expect(() => board.place(0, -10, 2)).toThrow("Wrong ship coordinates");
  });

  test("Invalid placement (invalid ship length)", () => {
    expect(() => board.place(0, 8, 5)).toThrow("Ship too long");
    expect(() => board.place(0, 9, -2)).toThrow("Ship too long");
  });

  test("Invalid placement (direct occupied cell)", () => {
    expect(() => board.place(2, 5, 1)).toThrow("Cell already occupied");
    expect(() => board.place(8, 6, 2)).toThrow("Cell already occupied");
  });

  test("Invalid placement (indirect occupied cell)", () => {
    expect(() => board.place(5, 7, 2)).toThrow("Cell already occupied");
    expect(() => board.place(2, 0, 3)).toThrow("Cell already occupied");
  });

  test("Ship validation after indirect invalid placement", () => {
    expect(() => board.place(5, 7, 2)).toThrow("Cell already occupied");
    expect(board.isShip(5, 7)).toBe(false);
  });

  test("Hitting ship cell", () => {
    expect(board.receiveAttack(0, 0)).toBe(true);
    expect(board.receiveAttack(9, 8)).toBe(true);
  });

  test("Hitting empty cell", () => {
    expect(board.receiveAttack(2, 1)).toBe(false);
    expect(board.receiveAttack(5, 7)).toBe(false);
  });

  test("Ship correctly hit", () => {
    board.receiveAttack(0, 0);
    expect(board[0][0].ship.hp).toBe(4);
  });

  test("Check missed shots", () => {
    board.receiveAttack(6, 2);
    expect(() => board.receiveAttack(6, 2)).toThrow("Cell already checked");
  });

  test("Check all sunk", () => {
    board.receiveAttack(0, 0);
    board.receiveAttack(0, 1);
    board.receiveAttack(0, 2);
    board.receiveAttack(0, 3);
    expect(board.aliveShips).toBe(5);
    board.receiveAttack(0, 4);
    expect(board.aliveShips).toBe(4);
    expect(board.areAllSunk()).toBe(false);
    board.receiveAttack(2, 2);
    board.receiveAttack(2, 3);
    board.receiveAttack(2, 4);
    board.receiveAttack(2, 5);
    expect(board.areAllSunk()).toBe(false);
    board.receiveAttack(5, 7);
    board.receiveAttack(5, 8);
    expect(board.areAllSunk()).toBe(false);
    board.receiveAttack(5, 9);
    expect(board.areAllSunk()).toBe(false);
    board.receiveAttack(8, 6);
    board.receiveAttack(8, 7);
    board.receiveAttack(8, 8);
    expect(board.areAllSunk()).toBe(false);
    board.receiveAttack(9, 6);
    board.receiveAttack(9, 7);
    board.receiveAttack(9, 8);
    expect(board.areAllSunk()).toBe(true);
  });

  test("Check vertical placing", () => {
    const board = new GameBoard();
    board.place(0, 0, 5, true);
    expect(board.isShip(0, 0)).toBe(true);
    expect(board.isShip(1, 0)).toBe(true);
    expect(board.isShip(0, 1)).toBe(false);
  });

  test("Check Invalid Vertical Placement (invalid length)", () => {
    expect(() => board.place(9, 9, 2)).toThrow("Ship too long");
  });
  test("Removing ships", () => {
    board.remove(0, 0, 5);
    expect(board.isShip(0, 0)).toBe(false);
    expect(() => board.place(0, 0, 5, true)).not.toThrow();
    expect(board.isShip(1, 0)).toBe(true);
    expect(board.isShip(1, 0)).toBe(true);
    board.remove(0, 0, 5, true);
    expect(board.isShip(1, 0)).toBe(false);
    expect(board.isShip(1, 0)).toBe(false);
  });
});

describe("Player", () => {
  const ply = new Player();
  const computerPly = new ComputerPly();

  test("Player has board", () => {
    expect(ply.board).toBeInstanceOf(GameBoard);
  });

  test("Computer has board", () => {
    expect(computerPly.board).toBeInstanceOf(GameBoard);
  });

  test("Computer generating random cords", () => {
    expect(computerPly.getRandomCoords()).toBeLessThanOrEqual(
      GameBoard.BOARD_SIZE,
    );
    expect(computerPly.getRandomCoords()).toBeGreaterThanOrEqual(0);
    expect(computerPly.getRandomCoords()).toBeLessThanOrEqual(
      GameBoard.BOARD_SIZE,
    );
    expect(computerPly.getRandomCoords()).toBeGreaterThanOrEqual(0);
    expect(computerPly.getRandomCoords()).toBeLessThanOrEqual(
      GameBoard.BOARD_SIZE,
    );
    expect(computerPly.getRandomCoords()).toBeGreaterThanOrEqual(0);
    expect(computerPly.getRandomCoords()).toBeLessThanOrEqual(
      GameBoard.BOARD_SIZE,
    );
    expect(computerPly.getRandomCoords()).toBeGreaterThanOrEqual(0);
  });

  test("Computer placed ships", () => {
    expect(computerPly.board.aliveShips).toBe(5);
  });
});

describe("Shuffling funct", () => {
  test("Happy path 1", () => {
    const old = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
    let arr = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
    shuffle(arr);
    arr = arr.map((val, i) => val === old[i]);

    expect(arr).toContain(false);
  });
});
