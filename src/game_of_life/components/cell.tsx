import React from 'react'
import GridCell, { GridCellProps } from '../../components/state_cell'
import GOLState from '../automata/state'

interface GOLCellProps extends GridCellProps {
  state: GOLState
}

const GOLCell: GridCell<GOLCellProps> = (props: GOLCellProps) => (
  <React.Fragment>{(props.state.alive && '⬛') || '⬜'}</React.Fragment>
)
export default GOLCell
