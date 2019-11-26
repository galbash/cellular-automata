/**
 * different states used for the "first sight" method
 */
import BaseMatingState, {
  BaseHasItemFirstState,
  Gender,
  HasItemState,
  ItemState,
  NoItemState,
} from './mating_states'
import Environment from '../../cellular_automata/environment'
import MatingAutomata from './automata'
import { checkCoordinatesZero } from './utils'
import { Direction, getDirectionsObject, randomDirection, TDirection } from './directions'
import { fillMatingAutomata } from './fill_automata'

export class NoItemFirstState extends NoItemState {
  transitionSingle(env: Environment): ItemState {
    let backupItem: [number, number] | undefined = undefined
    for (let cor of Object.values(getDirectionsObject()).map(
      d => d.coordinates as [number, number],
    )) {
      if (!env.isAccessible(...cor)) {
        continue
      }
      const state: FirstSightState = env.get(...cor) as FirstSightState
      if (!(state instanceof NoCoupleState)) {
        continue
      }

      const itemState: ItemState = state.getItemState(this.gender)

      if (!(itemState instanceof HasItemState)) {
        // we are looking for something to move here.
        continue
      }

      // we are looking for item that was heading our way, will probably
      // continue heading this way.
      const itemDirection = Direction[itemState.direction]
      if (
        checkCoordinatesZero(cor as [number, number], itemDirection.coordinates as [number, number])
      ) {
        return new NoItemSecondState(this.gender, cor)
      } else if (!backupItem) {
        // if we don't find anything better
        backupItem = cor
      }
    }

    // if we have a backup item let's use it, otherwise nothing was found.
    return new NoItemSecondState(this.gender, backupItem)
  }
}

export class NoItemSecondState extends NoItemState {
  public nextItemCor?: [number, number]

  constructor(gender: Gender, coordinates?: [number, number]) {
    super(gender)
    this.nextItemCor = coordinates
  }

  transitionSingle(env: Environment): ItemState {
    const fallbackState = new NoItemFirstState(this.gender)
    if (!this.nextItemCor) {
      return fallbackState
    }
    if (!env.isAccessible(...this.nextItemCor)) {
      return fallbackState
    }
    let state: FirstSightState = env.get(...this.nextItemCor) as FirstSightState
    if (!(state instanceof NoCoupleState)) {
      return fallbackState
    }

    const itemState: ItemState = state.getItemState(this.gender)

    if (!(itemState instanceof HasItemState)) {
      return fallbackState
    }

    const itemDirection = Direction[itemState.direction as TDirection]
    if (checkCoordinatesZero(this.nextItemCor, itemDirection.coordinates as [number, number])) {
      return new HasItemFirstState(
        itemState.gender,
        itemState.character,
        itemState.direction,
        itemState.stepsCount,
      )
    }

    return fallbackState
  }
}

export class HasItemFirstState extends BaseHasItemFirstState {
  transitionSingle(env: Environment): ItemState {
    return new HasItemSecondState(this.gender, this.character, this.direction, this.stepsCount)
  }
}

export class HasItemSecondState extends HasItemState {
  transitionSingle(env: Environment): ItemState {
    const currentDirection = Direction[this.direction as TDirection]

    const fallbackState = new HasItemFirstState(
      this.gender,
      this.character,
      this.direction,
      this.stepsCount,
    )
    if (!env.isAccessible(...currentDirection.coordinates)) {
      let triedDirections = [this.direction]
      let newDirection: TDirection | undefined = undefined
      do {
        newDirection = randomDirection(this.seed, ...triedDirections)
        triedDirections = [newDirection, ...triedDirections]
      } while (!env.isAccessible(...Direction[newDirection].coordinates))
      return new HasItemFirstState(this.gender, this.character, newDirection, this.stepsCount)
    }
    let state: FirstSightState = env.get(...currentDirection.coordinates) as FirstSightState
    if (!(state instanceof NoCoupleState)) {
      return fallbackState
    }

    const itemState: ItemState = state.getItemState(this.gender)

    if (!(itemState instanceof NoItemSecondState)) {
      return fallbackState
    }

    if (
      checkCoordinatesZero(currentDirection.coordinates as [number, number], itemState.nextItemCor)
    ) {
      return new NoItemFirstState(this.gender)
    }

    return fallbackState
  }
}

export abstract class FirstSightState extends BaseMatingState {
  addItem(item: HasItemState): FirstSightState {
    if (item.gender === Gender.MALE) {
      this.maleState = item
    }

    if (item.gender === Gender.FEMALE) {
      this.femaleState = item
    }

    if (this.maleState instanceof HasItemState && this.femaleState instanceof HasItemState) {
      return new CoupleState(this.maleState, this.femaleState)
    }

    return new NoCoupleState(this.maleState, this.femaleState)
  }
}

export class NoCoupleState extends FirstSightState {
  constructor(maleState?: ItemState, femaleState?: ItemState) {
    super(
      maleState || new NoItemFirstState(Gender.MALE),
      femaleState || new NoItemFirstState(Gender.FEMALE),
    )
  }

  transition(env: Environment): FirstSightState {
    const nextMale: ItemState = this.maleState.transitionSingle(env)
    const nextFemale: ItemState = this.femaleState.transitionSingle(env)

    if (nextMale instanceof HasItemState && nextFemale instanceof HasItemState) {
      return new CoupleState(nextMale, nextFemale)
    }

    return new NoCoupleState(nextMale, nextFemale)
  }
}

export class CoupleState extends FirstSightState {
  transition(env: Environment): CoupleState {
    return this
  }
}

export function fillBoard(automata: MatingAutomata) {
  return fillMatingAutomata(automata, HasItemFirstState)
}
