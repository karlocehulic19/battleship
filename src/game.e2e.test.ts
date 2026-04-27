import { GameBoard, Player, ComputerPly } from "./logic/logic";
import { Ship } from "./logic/Ship";
import { PlayerAdapter } from "./logic/GameAdapter";

// Minimal GameItem for placement without circular Ship(board) construction
const makeItem = (length: number, vertical = false) => ({
  length,
  vertical,
  changeDirection() {
    this.vertical = !this.vertical;
    return this.vertical;
  },
});

// ─── Ship ────────────────────────────────────────────────────────────────────

describe("Ship lifecycle", () => {
  let board: GameBoard;

  beforeEach(() => {
    board = new GameBoard();
  });

  test("starts not sunk", () => {
    const ship = new Ship(3, board);
    expect(ship.isSunk()).toBe(false);
  });

  test("not sunk after partial hits", () => {
    const ship = new Ship(3, board);
    ship.hit();
    ship.hit();
    expect(ship.isSunk()).toBe(false);
  });

  test("sinks after all hits equal to length", () => {
    const ship = new Ship(3, board);
    ship.hit();
    ship.hit();
    ship.hit();
    expect(ship.isSunk()).toBe(true);
  });

  test("hit() after already sunk throws", () => {
    const ship = new Ship(2, board);
    ship.hit();
    ship.hit();
    expect(() => ship.hit()).toThrow("Ship already sank");
  });

  test("changeDirection() toggles vertical", () => {
    const ship = new Ship(3, board);
    expect(ship.vertical).toBe(false);
    ship.changeDirection();
    expect(ship.vertical).toBe(true);
    ship.changeDirection();
    expect(ship.vertical).toBe(false);
  });
});

// ─── GameBoard — Placement ────────────────────────────────────────────────────

describe("GameBoard placement", () => {
  let board: GameBoard;

  beforeEach(() => {
    board = new GameBoard();
  });

  test("horizontal placement occupies all cells in a row", () => {
    board.place(0, 0, makeItem(4));
    expect(board.isShip(0, 0)).toBe(true);
    expect(board.isShip(0, 1)).toBe(true);
    expect(board.isShip(0, 2)).toBe(true);
    expect(board.isShip(0, 3)).toBe(true);
    expect(board.isShip(0, 4)).toBe(false);
  });

  test("vertical placement occupies cells down a column", () => {
    board.place(0, 0, makeItem(3, true));
    expect(board.isShip(0, 0)).toBe(true);
    expect(board.isShip(1, 0)).toBe(true);
    expect(board.isShip(2, 0)).toBe(true);
    expect(board.isShip(0, 1)).toBe(false);
    expect(board.isShip(3, 0)).toBe(false);
  });

  test("out-of-bounds coordinates throw", () => {
    expect(() => board.place(-1, 0, makeItem(2))).toThrow(
      "Wrong ship coordinates",
    );
    expect(() => board.place(0, 10, makeItem(2))).toThrow(
      "Wrong ship coordinates",
    );
    expect(() => board.place(10, 0, makeItem(2))).toThrow(
      "Wrong ship coordinates",
    );
  });

  test("ship extending past right edge throws", () => {
    expect(() => board.place(0, 8, makeItem(3))).toThrow("Ship too long");
  });

  test("vertical ship extending past bottom edge throws", () => {
    expect(() => board.place(8, 0, makeItem(3, true))).toThrow("Ship too long");
  });

  test("placing on an occupied cell throws", () => {
    board.place(0, 0, makeItem(3));
    expect(() => board.place(0, 1, makeItem(2))).toThrow("Cell already occupied");
  });

  test("rollback: failed mid-placement leaves no partial ship", () => {
    board.place(0, 0, makeItem(3));
    // Starts at (0,2) which is occupied — placement should fail partway through a length-5 ship
    expect(() => board.place(0, 2, makeItem(5))).toThrow("Cell already occupied");
    // Cells (0,3) and (0,4) should not have been left as ships
    expect(board.isShip(0, 3)).toBe(false);
    expect(board.isShip(0, 4)).toBe(false);
  });

  test("remove() clears all occupied cells", () => {
    const item = makeItem(4);
    board.place(0, 0, item);
    board.remove(0, 0, item);
    expect(board.isShip(0, 0)).toBe(false);
    expect(board.isShip(0, 3)).toBe(false);
  });

  test("after remove(), same space can be re-placed", () => {
    const item = makeItem(3);
    board.place(0, 0, item);
    board.remove(0, 0, item);
    expect(() => board.place(0, 0, makeItem(3))).not.toThrow();
    expect(board.isShip(0, 0)).toBe(true);
  });

  test("remove() with vertical item clears cells down the column", () => {
    const item = makeItem(3, true);
    board.place(0, 0, item);
    board.remove(0, 0, item);
    expect(board.isShip(0, 0)).toBe(false);
    expect(board.isShip(1, 0)).toBe(false);
    expect(board.isShip(2, 0)).toBe(false);
  });
});

// ─── GameBoard — Attacks ──────────────────────────────────────────────────────

describe("GameBoard attacks", () => {
  let board: GameBoard;

  beforeEach(() => {
    board = new GameBoard();
    board.place(0, 0, makeItem(3)); // ship at (0,0), (0,1), (0,2)
    board.place(5, 5, makeItem(2)); // ship at (5,5), (5,6)
  });

  test("attack on ship cell returns true", () => {
    expect(board.receiveAttack(0, 0)).toBe(true);
  });

  test("attack on empty cell returns false", () => {
    expect(board.receiveAttack(9, 9)).toBe(false);
  });

  test("attacking the same cell twice throws", () => {
    board.receiveAttack(0, 0);
    expect(() => board.receiveAttack(0, 0)).toThrow("Cell already checked");
  });

  test("attacking an empty cell twice also throws", () => {
    board.receiveAttack(9, 9);
    expect(() => board.receiveAttack(9, 9)).toThrow("Cell already checked");
  });

  test("sinking a ship decrements aliveShipCount", () => {
    const before = board.getAliveShipCount();
    board.receiveAttack(0, 0);
    board.receiveAttack(0, 1);
    board.receiveAttack(0, 2); // sinks 3-cell ship
    expect(board.getAliveShipCount()).toBe(before - 1);
  });

  test("areAllSunk() is false while ships remain", () => {
    board.receiveAttack(0, 0);
    board.receiveAttack(0, 1);
    board.receiveAttack(0, 2); // first ship sunk
    expect(board.areAllSunk()).toBe(false);
  });

  test("areAllSunk() is true only after every ship is sunk", () => {
    // Sink first ship
    board.receiveAttack(0, 0);
    board.receiveAttack(0, 1);
    board.receiveAttack(0, 2);
    expect(board.areAllSunk()).toBe(false);
    // Sink second ship
    board.receiveAttack(5, 5);
    board.receiveAttack(5, 6);
    expect(board.areAllSunk()).toBe(true);
  });
});

// ─── Full game win flow ───────────────────────────────────────────────────────

describe("Full game win flow", () => {
  test("areAllSunk() transitions to true only on the final hit", () => {
    const board = new GameBoard();
    // Place the 5 default-sized ships: 5, 4, 3, 3, 2
    const placements = [
      { row: 0, col: 0, len: 5 },
      { row: 2, col: 0, len: 4 },
      { row: 4, col: 0, len: 3 },
      { row: 6, col: 0, len: 3 },
      { row: 8, col: 0, len: 2 },
    ];

    for (const p of placements) {
      board.place(p.row, p.col, makeItem(p.len));
    }

    expect(board.getAliveShipCount()).toBe(5);

    let lastResult = false;

    for (let i = 0; i < placements.length; i++) {
      const { row, col, len } = placements[i];
      for (let c = 0; c < len; c++) {
        const isLast =
          i === placements.length - 1 && c === placements[i].len - 1;
        board.receiveAttack(row, col + c);
        if (!isLast) {
          expect(board.areAllSunk()).toBe(false);
        } else {
          lastResult = board.areAllSunk();
        }
      }
    }

    expect(lastResult).toBe(true);
  });
});

// ─── PlayerAdapter ────────────────────────────────────────────────────────────

describe("PlayerAdapter", () => {
  test("attack() returns correct shape on hit", () => {
    const adapter = new PlayerAdapter();
    adapter.placeShip(0, 0, makeItem(3) as any);
    const result = adapter.attack(0, 0);
    expect(result).toMatchObject({
      hit: true,
      allSunk: expect.any(Boolean),
      aliveShipCount: expect.any(Number),
    });
  });

  test("attack() returns hit=false on miss", () => {
    const adapter = new PlayerAdapter();
    adapter.placeShip(0, 0, makeItem(3) as any);
    const result = adapter.attack(9, 9);
    expect(result.hit).toBe(false);
  });

  test("attack() allSunk=true when all ships sunk", () => {
    const adapter = new PlayerAdapter();
    adapter.placeShip(0, 0, makeItem(2) as any);
    adapter.attack(0, 0);
    const final = adapter.attack(0, 1);
    expect(final.allSunk).toBe(true);
    expect(final.aliveShipCount).toBe(0);
  });

  test("aliveShipCount decreases as ships are sunk", () => {
    const adapter = new PlayerAdapter();
    adapter.placeShip(0, 0, makeItem(2) as any);
    adapter.placeShip(2, 0, makeItem(2) as any);
    expect(adapter.getAliveShipCount()).toBe(2);
    adapter.attack(0, 0);
    adapter.attack(0, 1); // sinks first ship
    expect(adapter.getAliveShipCount()).toBe(1);
  });

  test("randomizeShips() places exactly 5 ships", () => {
    const adapter = new PlayerAdapter();
    adapter.randomizeShips();
    expect(adapter.getAliveShipCount()).toBe(5);
  });

  test("nextMove() returns undefined for a human adapter", () => {
    const adapter = new PlayerAdapter(false);
    expect(adapter.nextMove()).toBeUndefined();
  });

  test("nextMove() returns valid [row, col] for computer adapter", () => {
    const adapter = new PlayerAdapter(true);
    const move = adapter.nextMove();
    expect(move).toBeDefined();
    const [row, col] = move!;
    expect(row).toBeGreaterThanOrEqual(0);
    expect(row).toBeLessThanOrEqual(9);
    expect(col).toBeGreaterThanOrEqual(0);
    expect(col).toBeLessThanOrEqual(9);
  });
});

// ─── ComputerPly guesses ──────────────────────────────────────────────────────

describe("ComputerPly guesses", () => {
  test("generates exactly 100 unique coordinates covering the full board", () => {
    const computer = new ComputerPly();
    const seen = new Set<string>();
    // Drain all guesses
    let move = computer.guessRandom();
    while (move !== undefined) {
      const key = `${move[0]},${move[1]}`;
      expect(seen.has(key)).toBe(false); // no repeats
      seen.add(key);
      move = computer.guessRandom();
    }
    expect(seen.size).toBe(100);
  });

  test("all generated coordinates are within board bounds [0,9]", () => {
    const computer = new ComputerPly();
    let move = computer.guessRandom();
    while (move !== undefined) {
      const [row, col] = move;
      expect(row).toBeGreaterThanOrEqual(0);
      expect(row).toBeLessThanOrEqual(9);
      expect(col).toBeGreaterThanOrEqual(0);
      expect(col).toBeLessThanOrEqual(9);
      move = computer.guessRandom();
    }
  });

  test("computer board has 5 ships placed on construction", () => {
    const computer = new ComputerPly();
    expect(computer.board.getAliveShipCount()).toBe(5);
  });
});

// ─── Player ───────────────────────────────────────────────────────────────────

describe("Player", () => {
  test("player has a GameBoard", () => {
    const player = new Player();
    expect(player.board).toBeInstanceOf(GameBoard);
  });

  test("placeShips() places exactly 5 ships", () => {
    const player = new Player();
    player.placeShips();
    expect(player.board.getAliveShipCount()).toBe(5);
  });
});
