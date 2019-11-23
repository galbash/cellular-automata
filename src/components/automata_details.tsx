import React, { FunctionComponent } from 'react'
import State from '../cellular_automata/state'
import Automata from '../cellular_automata/automata'

export interface AutomataDetailsProps {
  automata: Automata
}

type AutomataDetails<T extends AutomataDetailsProps> = FunctionComponent<T>
export default AutomataDetails
