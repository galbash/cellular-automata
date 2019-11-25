import React from 'react'
import GridCell, { GridCellProps } from '../../components/state_cell'
import MatingState from '../automata/states/simple_state'
import { Tooltip } from 'antd'
import { FirstSightState, Gender, HasItemState, ItemState } from '../automata/first_sight'

interface FirstSightCellProps extends GridCellProps {
  state: FirstSightState
}

const tooltipText = (item: ItemState): String =>
  item.occupied ? (item as HasItemState).character.toString() : 'no'

const FirstSightCell: GridCell<FirstSightCellProps> = (props: FirstSightCellProps) => {
  const { state } = props
  if (!(state instanceof FirstSightState)) {
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

export default FirstSightCell
