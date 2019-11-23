import Automata from '../../cellular_automata/automata'
import GOLState from './state'
import MooreEnv from '../../cellular_automata/environments/moore_env'
import GOLTransition from './transition'
import { GridEntry } from '../../cellular_automata/grid'

export default class GOLAutomata extends Automata {
  constructor(size: number) {
    super(size, GOLState, MooreEnv, GOLTransition)
  }
}

export function fillRandom(automata: GOLAutomata) {
  let strengthLimit = Math.random()
  automata.grid.forEach(arr =>
    (arr as GridEntry[]).forEach(
      entry => ((entry as GOLState).alive = Math.random() > strengthLimit),
    ),
  )
}
