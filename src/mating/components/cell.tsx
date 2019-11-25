import React from 'react'
import GridCell, { GridCellProps } from '../../components/state_cell'
import { Tooltip } from 'antd'
import BaseMatingState, { HasItemState, ItemState } from '../automata/mating_states'
import { Gender } from '../automata/mating_states'

interface MatingCellProps extends GridCellProps {
  state: BaseMatingState
}

const tooltipText = (item: ItemState): String =>
  item.occupied ? (item as HasItemState).character.toString() : 'no'

const MatingCell: GridCell<MatingCellProps> = (props: MatingCellProps) => {
  const { state } = props
  if (!(state instanceof BaseMatingState)) {
    return <React.Fragment>⬜</React.Fragment>
  }

  let maleState = state.getItemState(Gender.MALE)
  let femaleState = state.getItemState(Gender.FEMALE)
  if (!maleState.occupied && !femaleState.occupied) {
    // no tooltips for better performance
    return <React.Fragment>⬜</React.Fragment>
  }

  return (
    <Tooltip title={`male: ${tooltipText(maleState)}, female: ${tooltipText(femaleState)}`}>
      {maleState.occupied && !femaleState.occupied && '👨'}
      {!maleState.occupied && femaleState.occupied && '👩'}
      {maleState.occupied && femaleState.occupied && '👫'}
    </Tooltip>
  )
}

export default MatingCell
