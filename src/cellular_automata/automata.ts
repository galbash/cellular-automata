import Grid, {GridEntry} from "./grid";
import Environment from "./environment";
import State from "./state";
import {transitionRule} from "./transition";

type envCreator = new (...args: any[]) => Environment;
type stateCreator = new (...args: any[]) => State;

export default class Automata {
    private _grid: Grid;
    private readonly _size: number;
    private readonly _envType: envCreator;
    private readonly _transition: transitionRule;

    constructor(
        size: number,
        stateInitializer: stateCreator,
        environmentInitializer: envCreator,
        transition: transitionRule,
    ) {
        this._size = size;
        this._grid = Array(size).map(
            () => Array(size).map(
                () => new stateInitializer()
            )
        );
        this._envType = environmentInitializer;
        this._transition = transition;
    }

    get grid(): Grid {
        return this._grid;
    }

    private stepEntry(entry: GridEntry, ...coordinates: number[]): GridEntry {
        if (entry instanceof State) {
            return this._transition(new this._envType(this._grid, ...coordinates))
        } else if (entry instanceof Array) {
            return entry.map((value, i) => this.stepEntry(value, ...coordinates, i))
        } else {
            throw new Error("invalid entry type")
        }
    }


    step(): void {
        this._grid = this._grid.map(
            (entry, i) => this.stepEntry(entry, i)
        );
    }
}
