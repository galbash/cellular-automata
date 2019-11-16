import Grid from "./grid";
import State from "./state";

export default abstract class Environment {
    protected readonly _grid: Grid;
    protected readonly _coordinates: number[];

    protected constructor(grid: Grid, ...coordinates: number[]) {
        this._grid = grid;
        this._coordinates = coordinates;
    }

    abstract get(...coordinates: number[]): State;
    abstract isAccessible(...coordinates: number[]): boolean;
}

