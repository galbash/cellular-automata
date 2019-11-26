import Automata, { envCreator, stateCreator } from '../../cellular_automata/automata'
import BaseMatingState from './mating_states'
import { transitionRule } from '../../cellular_automata/transition'
import MooreEnv from '../../cellular_automata/environments/moore_env'
import { EnvType, setenv } from './directions'
import VNEnv from '../../cellular_automata/environments/von_neuman_env'

export default class MatingAutomata extends Automata {
  constructor(
    size: number,
    stateInitializer: stateCreator,
    environmentInitializer: envCreator,
    transition: transitionRule,
  ) {
    super(size, stateInitializer, environmentInitializer, transition)
    if (environmentInitializer === MooreEnv) {
      setenv(EnvType.Moore)
    }
    if (environmentInitializer === VNEnv) {
      setenv(EnvType.VN)
    }
  }

  static MAX_MATING_SCORE: number = 101 * 100
  get matingScore(): number {
    return (
      (MatingAutomata.MAX_MATING_SCORE -
        (this.grid as BaseMatingState[][]).reduce(
          (arrTotal: number, arr: BaseMatingState[]) =>
            arrTotal +
            arr.reduce((total: number, entry: BaseMatingState) => total + entry.matingScore, 0),
          0,
        )) /
      MatingAutomata.MAX_MATING_SCORE
    )
  }
}
