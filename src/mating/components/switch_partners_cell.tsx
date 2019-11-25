import React from 'react'
import GridCell, { GridCellProps } from '../../components/state_cell'
import { Tooltip } from 'antd'
import { SwitchPartnersState, Gender, HasItemState, ItemState } from '../automata/switch_partners'

interface SwitchPartnersCellProps extends GridCellProps {
  state: SwitchPartnersState
}

const tooltipText = (item: ItemState): String =>
  item.occupied ? (item as HasItemState).character.toString() : 'no'

const SwitchPartnersCell: GridCell<SwitchPartnersCellProps> = (props: SwitchPartnersCellProps) => {
  const { state } = props
  if (!(state instanceof SwitchPartnersState)) {
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

export default SwitchPartnersCell
