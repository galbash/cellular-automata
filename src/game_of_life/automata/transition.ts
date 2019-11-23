import GOLState from './state'
import State from '../../cellular_automata/state'
import Environment from '../../cellular_automata/environment'

function castState(state: State): GOLState {
  if (!(state instanceof GOLState)) {
    throw new Error('GOLTransition can only work with GOLState')
  }

  return state as GOLState
}

export default function GOLTransition(env: Environment): State {
  let livingNeighbors: number = 0
  let currentState: GOLState = castState(env.get(0, 0))
  for (let i = -1; i <= 1; i++) {
    for (let j = -1; j <= 1; j++) {
      if (i === 0 && j === 0) {
        continue
      }

      if (env.isAccessible(i, j)) {
        const state: GOLState = castState(env.get(i, j))
        let isAlive: boolean = state.alive
        if (isAlive) {
          livingNeighbors++
        }
      }
    }
  }

  let willLive: boolean = (currentState.alive && livingNeighbors === 2) || livingNeighbors === 3
  return new GOLState(willLive)
}
