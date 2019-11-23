import React from 'react'
import State from '../cellular_automata/state'

export interface GridCellProps {
  state: State
}

type GridCell<T extends GridCellProps> = React.FC<T>
export default GridCell
