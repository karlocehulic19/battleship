import { PlayerAdapter } from "../logic/GameAdapter";

export type GridPlayer = {
  adapter: PlayerAdapter;
  grid: any;
  name: string;
  container?: any;
};
