import { Player } from "../logic/logic";

export type GridPlayer = {
  logic: Player;
  grid: any;
  name: string;
  container?: any;
};
