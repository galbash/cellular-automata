import Environment from '../../../cellular_automata/environment'
import State from '../../../cellular_automata/state'
import SimpleMatingState, { Direction, randomDirection, TDirection } from '../states/simple_state'

const zip = (arr1: any[], arr2: any[] = []) => arr1.map((k, i) => [k, arr2[i]])

function checkCoordinatesZero(c1: [number, number], c2?: [number, number]) {
  return c2 && zip(c1, c2).every(([firstCor, secondCor]) => firstCor + secondCor === 0)
}

// couples are static
// females are static
// male meeting a couple might replace existing male
export default function ReplaceableCouplesTransition(env: Environment): State {
  const currentState: SimpleMatingState = env.get(0, 0) as SimpleMatingState
  const nextState = currentState.clone()

  // if (currentState.male && currentState.female) {
  //   // a couple doesn't move
  //   return currentState
  // }

  if (currentState.male && nextState.male && !currentState.female) {
    // next for type checking
    // move - man without woman always has direction.
    const currentMaleDirection = Direction[currentState.male.direction as TDirection]
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
          nextState.male = nextLocation.male
          nextState.male.direction = randomDirection()
        } else {
          nextLocation.male = undefined
        }
      } else {
        // move failed
        if (Math.random() > 0.8) {
          nextState.male.direction = randomDirection()
        }
      }
    } else {
      // unaccesible direction
      nextState.male.direction = randomDirection()
    }
  } else {
    if (currentState.nextMale) {
      // check if move was successful
      if (env.isAccessible(...currentState.nextMale)) {
        let maleLocation: SimpleMatingState = env.get(...currentState.nextMale) as SimpleMatingState
        if (maleLocation.male) {
          const maleDirection = Direction[maleLocation.male.direction as TDirection]
          if (
            checkCoordinatesZero(
              currentState.nextMale,
              maleDirection.coordinates as [number, number],
            )
          ) {
            nextState.male = {
              character: maleLocation.male.character,
              direction: currentState.female ? undefined : maleLocation.male.direction,
            }
          }
        }
      }
      nextState.nextMale = undefined
    }

    if (!nextState.nextMale) {
      // no move attempt was made or if failed
      for (let cor of Object.values(Direction).map(d => d.coordinates)) {
        if (!env.isAccessible(...cor)) {
          continue
        }
        const state: SimpleMatingState = env.get(...cor) as SimpleMatingState
        if (!state.male || state.female) {
          continue
        }

        const maleDirection = Direction[state.male.direction as TDirection]
        if (
          checkCoordinatesZero(
            cor as [number, number],
            maleDirection.coordinates as [number, number],
          )
        ) {
          if (
            !currentState.female ||
            currentState.matingScore >
              Math.abs(state.male.character - currentState.female.character)
          ) {
            nextState.nextMale = cor as [number, number]
            break
          }
        }
      }
    }
  }

  return nextState
}
