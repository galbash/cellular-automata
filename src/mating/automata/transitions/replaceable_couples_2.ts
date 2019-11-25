import Environment from '../../../cellular_automata/environment'
import State from '../../../cellular_automata/state'
import SimpleMatingState, {
  calcMatingScore,
  Direction,
  Person,
  randomDirection,
  TDirection,
} from '../states/simple_state'

const zip = (arr1: any[], arr2: any[] = []) => arr1.map((k, i) => [k, arr2[i]])

function checkCoordinatesZero(c1: [number, number], c2?: [number, number]) {
  return c2 && zip(c1, c2).every(([firstCor, secondCor]) => firstCor + secondCor === 0)
}

// couples are static
// females are static
// male meeting a couple might replace existing male
export default function ReplaceableCouplesTransition(env: Environment): State {
  const currentState: SimpleMatingState = env.get(0, 0) as SimpleMatingState
  const currentMaleDirection =
    currentState.male && Direction[currentState.male.direction as TDirection]
  const nextState = currentState.clone()
  if (currentState.nextMale) {
    if (env.isAccessible(...currentState.nextMale)) {
      let maleLocation: SimpleMatingState = env.get(...currentState.nextMale) as SimpleMatingState
      if (maleLocation.male) {
        const maleDirection = Direction[maleLocation.male.direction as TDirection]
        if (
          checkCoordinatesZero(
            currentState.nextMale,
            maleDirection.coordinates as [number, number],
          ) &&
          (!maleLocation.female ||
            (currentState.female &&
              currentMaleDirection &&
              checkCoordinatesZero(
                maleLocation.nextMale as [number, number],
                currentMaleDirection.coordinates as [number, number],
              )))
        ) {
          console.log(
            'moving male ',
            maleLocation.male.character,
            ' direction ',
            maleLocation.male.direction,
          )
          nextState.male = {
            character: maleLocation.male.character,
            direction: Math.random() > 0.9 ? randomDirection() : maleLocation.male.direction,
          }
        }
      }
    }
    nextState.nextMale = undefined
    return nextState
  }

  if (currentState.female || !currentState.male) {
    for (let cor of Object.values(Direction).map(d => d.coordinates)) {
      if (!env.isAccessible(...cor)) {
        continue
      }
      const state: SimpleMatingState = env.get(...cor) as SimpleMatingState
      if (!state.male) {
        continue
      }

      const maleDirection = Direction[state.male.direction as TDirection]
      if (
        // no women where man is standing, he should come whether there is a woman here or not
        // unless we already have a couple here, then we need to check if we want to break it up
        (!state.female &&
          checkCoordinatesZero(
            cor as [number, number],
            maleDirection.coordinates as [number, number],
          ) &&
          (!currentState.female ||
            currentState.matingScore > calcMatingScore(currentState.female, state.male))) ||
        (state.female &&
        currentState.female && // if there is a woman there, trade only if mutually beneficial
          currentState.matingScore + state.matingScore >
            calcMatingScore(currentState.female, state.male) +
              (currentState.male ? calcMatingScore(state.female, currentState.male) : 100))
      ) {
        console.log(
          'setting next male as ',
          state.male.character,
          '. I am on his ',
          state.male.direction,
        )
        nextState.nextMale = cor as [number, number]
        break
      }
    }

    return nextState
  }

  if (currentState.male) {
    // only male
    if (!currentMaleDirection) {
      throw new Error('a male must always have a direction')
    }

    if (env.isAccessible(...currentMaleDirection.coordinates)) {
      let nextLocation: SimpleMatingState = env.get(
        ...currentMaleDirection.coordinates,
      ) as SimpleMatingState
      if (
        checkCoordinatesZero(
          currentMaleDirection.coordinates as [number, number],
          nextLocation.nextMale,
        )
      ) {
        if (nextLocation.male) {
          console.log(
            'moving current male ',
            currentState.male.character,
            ' got instead ',
            nextLocation.male.character,
          )
          nextState.male = {
            character: nextLocation.male.character,
            direction: randomDirection(),
            moveAttempts: 0,
          }
        } else {
          console.log('moving current male ', currentState.male.character, 'no male instead')
          nextState.male = undefined
        }
      } else {
        // move failed
        if (currentState.male.moveAttempts && currentState.male.moveAttempts > 1) {
          ;(nextState.male as Person).direction = randomDirection()
          console.log(
            'move failed. changing direction ',
            currentState.male.character,
            ' was ',
            currentState.male.direction,
            ' now ',
            (nextState.male as Person).direction,
          )
        } else {
          ;(nextState.male as Person).moveAttempts = (currentState.male.moveAttempts || 0) + 1
        }
      }
    } else {
      // unaccesible direction
      ;(nextState.male as Person).direction = randomDirection()
      console.log(
        'unaccaccible direction. changing direction ',
        currentState.male.character,
        ' was ',
        currentState.male.direction,
        ' now ',
        (nextState.male as Person).direction,
      )
    }
    return nextState
  }

  throw new Error('transition function got unfamiliar state')
}
