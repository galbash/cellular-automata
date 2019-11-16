import Environment from "../../cellular_automata/environment";
import {GridEntry} from "../../cellular_automata/grid";
import State from "../../cellular_automata/state";
import GOLState from "./state";

export default class GOLEnv extends Environment {
  isAccessible(...coordinates: number[]): boolean {
    if (coordinates.some(v => Math.abs(v) > 1)) {
      return false;
    }

    let result: GridEntry = this._grid;
    for (let i: number = 0; i < coordinates.length; i++) {
      if (!(result instanceof Array)) {
        return false;
      }

      let next: number = this._coordinates[i] + coordinates[i];
      if (next < 0 || next > result.length) {
        return false;
      }
      result = result[coordinates[i] + this._coordinates[i]]
    }

    return (result instanceof State)
  }

  get(...coordinates: number[]): GOLState {
    if (coordinates.some(v => Math.abs(v) > 1)) {
      throw new Error("invalid coordinates")
    }

    let result: GridEntry = this._grid;
    for (let i: number = 0; i < coordinates.length; i++) {
      if (!(result instanceof Array)) {
        throw new Error("too many coordinates");
      }

      let next: number = this._coordinates[i] + coordinates[i];
      if (next < 0 || next > result.length) {
        throw new Error("invalid cell");
      }
      result = result[coordinates[i] + this._coordinates[i]]
    }

    if (result instanceof GOLState) {
      return result;
    }

    throw new Error("need more coordinates");
  }
}
