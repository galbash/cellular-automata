import MatingState, {
  BaseHasItemFirstState,
  calcMatingScore,
  Gender,
  HasItemState,
  ItemState,
  NoItemState,
} from './mating_states'
import Environment from '../../cellular_automata/environment'
import MatingAutomata from './automata'
import { checkCoordinatesZero } from './utils'
import { Direction, randomDirection, TDirection } from './directions'
import { fillMatingAutomata } from './fill_automata'

export class NoItemFirstState extends NoItemState {
  transitionSingle(env: Environment): ItemState {
    let backupItem: [number, number] | undefined = undefined
    for (let cor of Object.values(Direction).map(d => d.coordinates as [number, number])) {
      if (!env.isAccessible(...cor)) {
        continue
      }
      const state: SwitchPartnersState = env.get(...cor) as SwitchPartnersState
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
    let state: SwitchPartnersState = env.get(...this.nextItemCor) as SwitchPartnersState
    if (!(state instanceof NoCoupleState)) {
      return fallbackState
    }

    const itemState: ItemState = state.getItemState(this.gender)

    if (!(itemState instanceof HasItemState)) {
      return fallbackState
    }

    const itemDirection = Direction[itemState.direction as TDirection]
    if (checkCoordinatesZero(this.nextItemCor, itemDirection.coordinates as [number, number])) {
      return new HasItemFirstState(itemState.gender, itemState.character, itemState.direction)
    }

    return fallbackState
  }
}

export class HasItemFirstState extends BaseHasItemFirstState {
  transitionSingle(env: Environment): ItemState {
    return new HasItemSecondState(this.gender, this.character, this.direction)
  }
}

export class HasItemSecondState extends HasItemState {
  transitionSingle(env: Environment): ItemState {
    const currentDirection = Direction[this.direction as TDirection]
    const fallbackState = new HasItemFirstState(this.gender, this.character, this.direction)
    if (!env.isAccessible(...currentDirection.coordinates)) {
      return new HasItemFirstState(this.gender, this.character, randomDirection(this.direction))
    }
    let state: SwitchPartnersState = env.get(...currentDirection.coordinates) as SwitchPartnersState
    let itemState = state.getItemState(this.gender)
    if (state instanceof CoupleSecondState) {
      if (
        state.nextGender === this.gender &&
        checkCoordinatesZero(currentDirection.coordinates as [number, number], state.nextCor)
      ) {
        return new HasItemFirstState(
          this.gender,
          (itemState as HasItemCoupleState).character,
          randomDirection(),
        )
      }
    }
    if (!(state instanceof NoCoupleState)) {
      return fallbackState // switching with a couple already failed.
    }

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

export class HasItemCoupleState extends HasItemState {
  transitionSingle(env: Environment): ItemState {
    throw new Error('a couple state cant use a single transition')
  }

  constructor(generatingItem: HasItemState) {
    super(generatingItem.gender, generatingItem.character, generatingItem.direction)
  }
}

export abstract class SwitchPartnersState extends MatingState {
  addItem(item: HasItemState): SwitchPartnersState {
    if (item.gender === Gender.MALE) {
      this.maleState = item
    }

    if (item.gender === Gender.FEMALE) {
      this.femaleState = item
    }

    if (this.maleState instanceof HasItemState && this.femaleState instanceof HasItemState) {
      return new CoupleFirstState(this.maleState, this.femaleState)
    }

    return new NoCoupleState(this.maleState, this.femaleState)
  }
}

export class NoCoupleState extends SwitchPartnersState {
  constructor(maleState?: ItemState, femaleState?: ItemState) {
    super(
      maleState || new NoItemFirstState(Gender.MALE),
      femaleState || new NoItemFirstState(Gender.FEMALE),
    )
  }

  transition(env: Environment): SwitchPartnersState {
    const nextMale: ItemState = this.maleState.transitionSingle(env)
    const nextFemale: ItemState = this.femaleState.transitionSingle(env)

    if (nextMale instanceof HasItemState && nextFemale instanceof HasItemState) {
      return new CoupleFirstState(
        new HasItemCoupleState(nextMale),
        new HasItemCoupleState(nextFemale),
      )
    }

    return new NoCoupleState(nextMale, nextFemale)
  }
}

export abstract class CoupleState extends SwitchPartnersState {
  public maleState: HasItemCoupleState
  public femaleState: HasItemCoupleState
  constructor(maleState: HasItemCoupleState, femaleState: HasItemCoupleState) {
    super(maleState, femaleState)
    this.maleState = maleState
    this.femaleState = femaleState
  }
}

export class CoupleFirstState extends CoupleState {
  constructor(maleState: HasItemCoupleState, femaleState: HasItemCoupleState) {
    // randomize direction for better switching each two-cycles
    let newMaleState = new HasItemCoupleState(maleState)
    newMaleState.direction = randomDirection(maleState.direction)
    let newFemaleState = new HasItemCoupleState(femaleState)
    newFemaleState.direction = randomDirection(newFemaleState.direction)
    super(newMaleState, newFemaleState)
  }

  private isBetterMatch(
    current: HasItemState,
    tested: ItemState,
    cor: [number, number],
    checkDirection: boolean = true,
  ): boolean {
    if (!(tested instanceof HasItemState)) {
      return false
    }

    // we are looking for items heading our way. couples direction will be changed randomly
    // to ensure we can switch with them as well
    if (!checkDirection) {
      return this.matingScore > calcMatingScore(current, tested)
    }
    const itemDirection = Direction[tested.direction]
    return (
      checkCoordinatesZero(
        cor as [number, number],
        itemDirection.coordinates as [number, number],
      ) && this.matingScore > calcMatingScore(current, tested)
    )
  }

  transition(env: Environment): CoupleSecondState {
    let backupItem: [number, number] | undefined = undefined
    let backupGender: Gender | undefined = undefined
    for (let cor of Object.values(Direction).map(d => d.coordinates as [number, number])) {
      if (!env.isAccessible(...cor)) {
        continue
      }
      const state: SwitchPartnersState = env.get(...cor) as SwitchPartnersState

      const femaleState: ItemState = state.getItemState(Gender.FEMALE)
      const maleState: ItemState = state.getItemState(Gender.MALE)

      if (this.isBetterMatch(this.femaleState, maleState, cor)) {
        return new CoupleSecondState(this.maleState, this.femaleState, cor, Gender.MALE)
      }

      if (this.isBetterMatch(this.maleState, femaleState, cor)) {
        return new CoupleSecondState(this.maleState, this.femaleState, cor, Gender.FEMALE)
      }

      if (!backupItem) {
        if (this.isBetterMatch(this.femaleState, maleState, cor, false)) {
          backupItem = cor
          backupGender = Gender.MALE
        }
      }
      if (!backupItem) {
        if (this.isBetterMatch(this.maleState, femaleState, cor, false)) {
          backupItem = cor
          backupGender = Gender.FEMALE
        }
      }
    }

    // if we have a backup item let's use it, otherwise nothing was found.
    return new CoupleSecondState(this.maleState, this.femaleState, backupItem, backupGender)
  }
}

export class CoupleSecondState extends CoupleState {
  public nextGender?: Gender
  public nextCor?: [number, number]
  constructor(
    maleState: HasItemCoupleState,
    femaleState: HasItemCoupleState,
    nextCor?: [number, number],
    nextGender?: Gender,
  ) {
    super(maleState, femaleState)
    this.nextCor = nextCor
    this.nextGender = nextGender
  }

  transition(env: Environment): CoupleFirstState {
    const fallbackState = new CoupleFirstState(this.maleState, this.femaleState)
    if (!this.nextCor || this.nextGender === undefined) {
      return fallbackState
    }
    if (!env.isAccessible(...this.nextCor)) {
      return fallbackState
    }
    let state: SwitchPartnersState = env.get(...this.nextCor) as SwitchPartnersState

    if (state instanceof CoupleSecondState && state.nextGender !== this.nextGender) {
      // the neighbor did not agree to the switch
      return fallbackState
    }

    const itemState: ItemState = state.getItemState(this.nextGender)

    if (!(itemState instanceof HasItemState)) {
      return fallbackState
    }

    const itemDirection =
      state instanceof CoupleSecondState
        ? { coordinates: state.nextCor }
        : Direction[itemState.direction as TDirection]
    if (checkCoordinatesZero(this.nextCor, itemDirection.coordinates as [number, number])) {
      if (this.nextGender === Gender.FEMALE) {
        // switch female
        return new CoupleFirstState(this.maleState, new HasItemCoupleState(itemState))
      }

      if (this.nextGender === Gender.MALE) {
        // switch male
        return new CoupleFirstState(new HasItemCoupleState(itemState), this.femaleState)
      }

      throw new Error('invalid gender')
    }

    return fallbackState
  }
}

export function fillBoard(automata: MatingAutomata) {
  return fillMatingAutomata(automata, HasItemFirstState)
}
