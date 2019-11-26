import State from './state'

/**
 * a grid entry can be a row, or a state (lowest level)
 */
export type GridEntry = GridEntry[] | State

/**
 * top level grid
 */
type Grid = GridEntry[]
export default Grid
