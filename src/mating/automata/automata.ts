import Automata, {stateCreator} from '../../cellular_automata/automata'
import SimpleMatingState, {randomDirection} from './states/simple_state'
import MooreEnv from '../../cellular_automata/environments/moore_env'
import BaseMatingState from "./base_mating_state";
import {transitionRule} from "../../cellular_automata/transition";

export default class MatingAutomata extends Automata {
  constructor(size: number, stateInitializer: stateCreator, transition: transitionRule ) {
    super(size, stateInitializer, MooreEnv, transition)
  }

  get matingScore(): number {
    return (this.grid as BaseMatingState[][]).reduce(
      (arrTotal: number, arr: BaseMatingState[]) =>
        arrTotal + arr.reduce((total: number, entry: BaseMatingState) => total + entry.matingScore, 0),
      0,
    )
  }
}

const shuffleArray = (arr: number[]) =>
  arr
    .map(a => [Math.random(), a])
    .sort((a, b) => a[0] - b[0])
    .map(a => a[1])

export function matingFillRandom(automata: MatingAutomata) {
  let numbers: number[] = shuffleArray([...Array(99).keys()].map(key => key + 1))
  while (numbers.length) {
    let maleState: SimpleMatingState | null = null
    let femaleState: SimpleMatingState | null = null
    do {
      let x = Math.floor(Math.random() * automata.size)
      let y = Math.floor(Math.random() * automata.size)
      if (!(automata.grid as SimpleMatingState[][])[x][y].male) {
        maleState = (automata.grid as SimpleMatingState[][])[x][y]
      }
    } while (!maleState)

    do {
      let x = Math.floor(Math.random() * automata.size)
      let y = Math.floor(Math.random() * automata.size)
      if (!(automata.grid as SimpleMatingState[][])[x][y].female) {
        femaleState = (automata.grid as SimpleMatingState[][])[x][y]
      }
    } while (!femaleState)
    femaleState.female = {character: (numbers.pop() as number)}
    maleState.male = {character: (numbers.pop() as number)}
    maleState.male.direction = randomDirection()
  }
}
