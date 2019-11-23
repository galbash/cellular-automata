import React from 'react'
import GridCell, { GridCellProps } from '../../components/state_cell'
import MatingState from '../automata/states/simple_state'
import { Tooltip } from 'antd'

interface MatingCellProps extends GridCellProps {
  state: MatingState
}

const MatingCell: GridCell<MatingCellProps> = (props: MatingCellProps) => {
  const { state } = props
  if (!state.male && !state.female) {
    // no tooltips for better performance
    return <React.Fragment>⬜</React.Fragment>
  }
  return (
    <Tooltip
      title={`male: ${state.male?.character || 'no'}, female: ${state.female?.character || 'no'}`}>
      {state.male && !state.female && '👨'}
      {state.female && !state.male && '👩'}
      {state.female && state.male && '👫'}
    </Tooltip>
  )
}

export default MatingCell
