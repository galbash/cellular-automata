import Grid from './grid'
import State from './state'

/**
 * an automata environment, used to limit the transition rule
 */
export default abstract class Environment {
  protected readonly _grid: Grid
  protected readonly _coordinates: number[]

  /**
   * @param {Grid} grid The grid the environment is set on
   * @param {number[]} coordinates The coordinates of the cell in the center of the environment
   */
  protected constructor(grid: Grid, ...coordinates: number[]) {
    this._grid = grid
    this._coordinates = coordinates
  }

  /**
   * gets an item from the grid, if it is accessible in the environment
   * @param {number[]} coordinates relative to the env center
   * @return {State} the state of the requested cell
   */
  abstract get(...coordinates: number[]): State
  /**
   * checks if a cell is accessible
   * @param {number[]} coordinates relative to the env center
   * @return {boolean} true if the cell is accessible, false otherwise
   */
  abstract isAccessible(...coordinates: number[]): boolean
}
