import Automata, { stateCreator } from '../../cellular_automata/automata'
import MooreEnv from '../../cellular_automata/environments/moore_env'
import BaseMatingState from './mating_states'
import { transitionRule } from '../../cellular_automata/transition'

export default class MatingAutomata extends Automata {
  constructor(size: number, stateInitializer: stateCreator, transition: transitionRule) {
    super(size, stateInitializer, MooreEnv, transition)
  }

  get matingScore(): number {
    return (this.grid as BaseMatingState[][]).reduce(
      (arrTotal: number, arr: BaseMatingState[]) =>
        arrTotal +
        arr.reduce((total: number, entry: BaseMatingState) => total + entry.matingScore, 0),
      0,
    )
  }
}
