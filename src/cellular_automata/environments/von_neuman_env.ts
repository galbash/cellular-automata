import Environment from '../environment'
import Grid, { GridEntry } from '../grid'
import State from '../state'

export default class VNEnv extends Environment {
  public constructor(grid: Grid, ...coordinates: number[]) {
    super(grid, ...coordinates)
  }

  isAccessible(...coordinates: number[]): boolean {
    if (coordinates.some(v => Math.abs(v) > 1)) {
      return false
    }

    let foundOne = false

    let result: GridEntry = this._grid
    for (let i: number = 0; i < coordinates.length; i++) {
      if (!(result instanceof Array)) {
        return false
      }

      let next: number = this._coordinates[i] + coordinates[i]
      if (coordinates[i] === 1) {
        if (foundOne) {
          return false // can only be 1 non-zero co-ordinate
        }
        foundOne = true
      }
      if (next < 0 || next > result.length) {
        return false
      }
      result = result[coordinates[i] + this._coordinates[i]]
    }

    return result instanceof State
  }

  get(...coordinates: number[]): State {
    if (coordinates.some(v => Math.abs(v) > 1)) {
      throw new Error('invalid coordinates')
    }

    let result: GridEntry = this._grid
    let foundOne = false
    for (let i: number = 0; i < coordinates.length; i++) {
      if (!(result instanceof Array)) {
        throw new Error('too many coordinates')
      }

      if (coordinates[i] === 1) {
        if (foundOne) {
          throw new Error('unacceptable cell')
        }
        foundOne = true
      }
      let next: number = this._coordinates[i] + coordinates[i]
      if (next < 0 || next > result.length) {
        throw new Error('invalid cell')
      }
      result = result[coordinates[i] + this._coordinates[i]]
    }

    if (result instanceof State) {
      return result
    }

    throw new Error('need more coordinates')
  }
}
