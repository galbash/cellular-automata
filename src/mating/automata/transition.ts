import Environment from '../../cellular_automata/environment'
import BaseMatingState from './mating_states'

/**
 * transition rule for mating automata
 */
export function transition(env: Environment): BaseMatingState {
  return (env.get(0, 0) as BaseMatingState).transition(env)
}
