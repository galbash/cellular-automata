import React from 'react'
import AutomataDetails, { AutomataDetailsProps } from '../../components/automata_details'
import MatingAutomata from '../automata/automata'

interface MatingAutomataDetailsProps extends AutomataDetailsProps {
  automata: MatingAutomata
}

const MatingAutomataDetails: AutomataDetails<MatingAutomataDetailsProps> = (
  props: MatingAutomataDetailsProps,
) => {
  const { automata } = props
  return (
    <React.Fragment>
      Happyness Factor: {automata.matingScore ? automata.matingScore.toFixed(3) : '1.000'}
    </React.Fragment>
  )
}

export default MatingAutomataDetails
