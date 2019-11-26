import Grid, { GridEntry } from './grid'
import Environment from './environment'
import State from './state'
import { transitionRule } from './transition'

export type envCreator = new (...args: any[]) => Environment
export type stateCreator = new (...args: any[]) => State

export default abstract class Automata {
  private _grid: Grid
  public readonly size: number
  private _generation: number = 0
  private readonly _envType: envCreator
  private readonly _transition: transitionRule

  constructor(
    size: number,
    stateInitializer: stateCreator,
    environmentInitializer: envCreator,
    transition: transitionRule,
  ) {
    this.size = size
    this._grid = [...new Array(size)].map(() =>
      [...new Array(size)].map(() => new stateInitializer()),
    )
    this._envType = environmentInitializer
    this._transition = transition
  }

  get grid(): Grid {
    return this._grid
  }

  get generation(): number {
    return this._generation
  }

  private stepEntry(entry: GridEntry, ...coordinates: number[]): GridEntry {
    if (entry instanceof State) {
      return this._transition(new this._envType(this._grid, ...coordinates))
    } else if (entry instanceof Array) {
      return entry.map((value, i) => this.stepEntry(value, ...coordinates, i))
    } else {
      throw new Error('invalid entry type')
    }
  }

  step(): void {
    this._grid = this._grid.map((entry, i) => this.stepEntry(entry, i))
    this._generation++
  }
}
