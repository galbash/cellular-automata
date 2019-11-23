import Environment from '../../../cellular_automata/environment'
import State from '../../../cellular_automata/state'
import SimpleMatingState, {Direction, Person, randomDirection, TDirection} from "../states/simple_state";

const zip = (arr1: any[], arr2: any[]=[]) => arr1.map((k, i) => [k, arr2[i]]);

// function checkMatchingSucceeded(first: Person, second?: Person) {
//     return first.interestedIn && second?.interestedIn &&
//         zip(first.interestedIn, second?.interestedIn).every(
//             ([firstCor, secondCor]) => firstCor + secondCor === 0
//         );
// }

function checkCoordinatesZero(c1: [number, number], c2?: [number, number]) {
    return c2 &&
        zip(c1, c2).every(
            ([firstCor, secondCor]) => firstCor + secondCor === 0
        );
}

// couples are static
// females are static
export default function FirstSightTransition(env: Environment): State {
  const currentState: SimpleMatingState = (env.get(0, 0) as SimpleMatingState);
  const nextState = currentState.clone();

  if (currentState.male && currentState.female) {
    // a couple doesn't move
      return currentState
  }

  if (currentState.male && nextState.male) { // next for type checking
      // move - man without woman always has direction.
      const currentMaleDirection = Direction[(currentState.male.direction as TDirection)];
      if (env.isAccessible(...currentMaleDirection.coordinates)) {
          let nextLocation: SimpleMatingState = (env.get(...currentMaleDirection.coordinates) as SimpleMatingState);
          if (checkCoordinatesZero((currentMaleDirection.coordinates as [number, number]), nextLocation.nextMale)) {
              nextState.male = undefined;
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
              let maleLocation: SimpleMatingState = (env.get(...currentState.nextMale) as SimpleMatingState)
              if (maleLocation.male) {
                  const maleDirection = Direction[(maleLocation.male.direction as TDirection)];
                  if (checkCoordinatesZero(currentState.nextMale, (maleDirection.coordinates as [number, number]))) {
                      nextState.male = {
                          character: maleLocation.male.character,
                          direction: currentState.female ? undefined: maleLocation.male.direction,
                      }
                  }

              }
          }
          nextState.nextMale = undefined;
      }

      if (!nextState.nextMale && !nextState.male) {
          // no move attempt was made or if failed
          for (let cor of (Object.values(Direction).map(d => d.coordinates))) {
              if (!env.isAccessible(...cor)) {
                  continue;
              }
              const state: SimpleMatingState = (env.get(...cor) as SimpleMatingState)
              if (!state.male || state.female) {
                  continue;
              }

              const maleDirection = Direction[(state.male.direction as TDirection)];
              if (checkCoordinatesZero((cor as [number, number]), maleDirection.coordinates as [number, number])) {
                  if (maleDirection.name !== 'UP' && maleDirection.name !== 'DOWN') {
                  }
                  nextState.nextMale = (cor as [number, number]);
                  break;
              }
          }
      }
  }

  return nextState;

  // // check male movement
  //   if (!currentState.male) {
  //     // if a female is here check if a matching is in progress
  //       if (currentState.female) {
  //           if (currentState.female.interestedIn) {
  //               const targetMaleState: SimpleMatingState = (env.get(...currentState.female.interestedIn) as SimpleMatingState);
  //               if (checkMatchingSucceeded(currentState.female, targetMaleState.male)) {
  //                   // we have a match
  //                   nextState.male = {character: (targetMaleState.male as Person).character}
  //                   nextState.female = {character: currentState.female.character};
  //               }
  //
  //           } else {
  //               // search environment for a matching attempt
  //               let bestMan: [number, number] | undefined = undefined;
  //               let bestManCharacterDiff: number = 100 // initialize to max
  //               for (let i = -1; i <= 1; i++) {
  //                   for (let j = -1; j <= 1; j++) {
  //                       if (i === 0 && j === 0) {
  //                           continue
  //                       }
  //
  //                       if (env.isAccessible(i, j)) {
  //                           const state: SimpleMatingState = (env.get(i, j) as SimpleMatingState)
  //                           if (state.male && !state.male.interestedIn) {
  //                               let charDiff: number = Math.abs(currentState.female.character - state.male.character)
  //                               if (charDiff < bestManCharacterDiff) {
  //                                   bestManCharacterDiff = charDiff
  //                                   bestMan = [i, j]
  //                               }
  //                           }
  //                       }
  //                   }
  //               }
  //               if (bestMan) {
  //                   nextFemaleInterestedIn = bestMan;
  //               }
  //           }
  //       }
  //
  //
  //       // otherwise move near male if required
  //
  //   } else if (currentState.male.interestedIn) {
  //      // cell was occupied so will have no males coming in.
  //       const targetFemaleState: SimpleMatingState = (env.get(...currentState.male.interestedIn) as SimpleMatingState);
  //       if (
  //           checkMatchingSucceeded(currentState.male, targetFemaleState.female)
  //       ) {
  //           // we got a match, male will be moving to female next round. this cell will be empty
  //           // there for sure won't be a female here
  //           nextState.male = undefined;
  //           nextState.female = undefined;
  //       }
  //   }
  //
  //   // we get here if a male.interestedIn was not found, or a matching failed.
  //
  //
  //
  // // check female movement
  //   return nextState

}
