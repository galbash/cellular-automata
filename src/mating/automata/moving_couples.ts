import BaseMatingState, {
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
      const state: MovingCouplesState = env.get(...cor) as MovingCouplesState
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
    let state: MovingCouplesState = env.get(...this.nextItemCor) as MovingCouplesState
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
    let state: MovingCouplesState = env.get(...currentDirection.coordinates) as MovingCouplesState
    let itemState = state.getItemState(this.gender)
    if (state instanceof CoupleSecondStateSwitch) {
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

export abstract class MovingCouplesState extends BaseMatingState {
  addItem(item: HasItemState): MovingCouplesState {
    if (item.gender === Gender.MALE) {
      this.maleState = item
    }

    if (item.gender === Gender.FEMALE) {
      this.femaleState = item
    }

    if (this.maleState instanceof HasItemState && this.femaleState instanceof HasItemState) {
      return new CoupleFirstState(this.maleState, this.femaleState)
    }

    return new NoCoupleFirstState(this.maleState, this.femaleState)
  }
}

export abstract class NoCoupleState extends MovingCouplesState {
  constructor(maleState?: ItemState, femaleState?: ItemState) {
    super(
      maleState || new NoItemFirstState(Gender.MALE),
      femaleState || new NoItemFirstState(Gender.FEMALE),
    )
  }
}

export class NoCoupleFirstState extends NoCoupleState {
  private isItemBusy(item: ItemState): boolean {
    return item.occupied || (item as NoItemSecondState).nextItemCor !== undefined
  }

  transition(env: Environment): MovingCouplesState {
    const nextMale: ItemState = this.maleState.transitionSingle(env)
    const nextFemale: ItemState = this.femaleState.transitionSingle(env)

    if (this.isItemBusy(nextMale) || this.isItemBusy(nextFemale)) {
      return new NoCoupleMoveSingleSecondState(nextMale, nextFemale)
    }

    // if no single found, attempt to move couple
    let backupItem: [number, number] | undefined = undefined
    for (let cor of Object.values(Direction).map(d => d.coordinates as [number, number])) {
      if (!env.isAccessible(...cor)) {
        continue
      }
      const state: MovingCouplesState = env.get(...cor) as MovingCouplesState
      if (!(state instanceof CoupleState)) {
        continue
      }

      // we are looking for item that was heading our way, will probably
      // continue heading this way.
      const coupleDirection = Direction[state.direction]
      if (checkCoordinatesZero(cor, coupleDirection.coordinates as [number, number])) {
        return new NoCoupleMoveCoupleSecondState(this.maleState, this.femaleState, cor)
      } else if (!backupItem) {
        // if we don't find anything better
        backupItem = cor
      }
    }

    // if we have a backup item let's use it, otherwise nothing was found.
    return new NoCoupleMoveCoupleSecondState(this.maleState, this.femaleState, backupItem)
  }
}

export class NoCoupleMoveSingleSecondState extends NoCoupleState {
  transition(env: Environment): MovingCouplesState {
    const nextMale: ItemState = this.maleState.transitionSingle(env)
    const nextFemale: ItemState = this.femaleState.transitionSingle(env)

    if (nextMale instanceof HasItemState && nextFemale instanceof HasItemState) {
      return new CoupleFirstState(
        new HasItemCoupleState(nextMale),
        new HasItemCoupleState(nextFemale),
      )
    }

    return new NoCoupleFirstState(nextMale, nextFemale)
  }
}

export class NoCoupleMoveCoupleSecondState extends NoCoupleState {
  public nextCoupleCor?: [number, number]
  constructor(maleState: ItemState, femaleState: ItemState, cor?: [number, number]) {
    super(maleState, femaleState)
    this.nextCoupleCor = cor
  }

  transition(env: Environment): MovingCouplesState {
    const fallbackState = new NoCoupleFirstState(this.maleState, this.femaleState)
    if (!this.nextCoupleCor) {
      return fallbackState
    }
    if (!env.isAccessible(...this.nextCoupleCor)) {
      return fallbackState
    }
    let state: MovingCouplesState = env.get(...this.nextCoupleCor) as MovingCouplesState
    if (!(state instanceof CoupleSecondStateMove)) {
      return fallbackState
    }

    const itemDirection = Direction[state.direction as TDirection]
    if (checkCoordinatesZero(this.nextCoupleCor, itemDirection.coordinates as [number, number])) {
      return new CoupleFirstState(state.maleState, state.femaleState, state.direction)
    }

    return fallbackState
  }
}

export abstract class CoupleState extends MovingCouplesState {
  public maleState: HasItemCoupleState
  public femaleState: HasItemCoupleState
  public direction: TDirection
  constructor(
    maleState: HasItemCoupleState,
    femaleState: HasItemCoupleState,
    direction: TDirection,
  ) {
    super(maleState, femaleState)
    this.maleState = maleState
    this.femaleState = femaleState
    this.direction = direction
  }
}

export class CoupleFirstState extends CoupleState {
  constructor(
    maleState: HasItemCoupleState,
    femaleState: HasItemCoupleState,
    direction?: TDirection,
  ) {
    // randomize direction for better switching each two-cycles
    let realDirection =
      Math.random() < HasItemState.CHANGE_DIRACTION_CHANCE
        ? randomDirection(direction)
        : direction || randomDirection()
    super(maleState, femaleState, realDirection)
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

  private findBetterMatch(
    other: MovingCouplesState,
    cor: [number, number],
    checkDirection: boolean = true,
  ): Gender | undefined {
    let isBetter: boolean =
      this.matingScore + other.matingScore >
      calcMatingScore(this.maleState, other.femaleState) +
        calcMatingScore(other.maleState, this.femaleState)
    if (!isBetter) {
      return undefined // if the mating is not better, don't switch
    }

    let gender: Gender | undefined = undefined
    let otherDirection
    if (other instanceof CoupleState) {
      otherDirection = Direction[other.direction]
      gender = Gender.FEMALE // switch females for couple switches
    } else if (other instanceof NoCoupleState) {
      if (other.maleState instanceof HasItemState) {
        otherDirection = Direction[other.maleState.direction]
        gender = Gender.MALE
      } else {
        if (other.femaleState instanceof HasItemState) {
          otherDirection = Direction[other.femaleState.direction]
          gender = Gender.FEMALE
        }
      }
    }

    if (checkDirection) {
      if (!otherDirection) {
        return undefined // nothing sutible was found
      }
      isBetter =
        isBetter && checkCoordinatesZero(otherDirection.coordinates as [number, number], cor)
    }

    if (isBetter) {
      return gender
    }

    return undefined
  }

  transition(env: Environment): CoupleSecondState {
    let backupItem: [number, number] | undefined = undefined
    let backupGender: Gender | undefined = undefined
    for (let cor of Object.values(Direction).map(d => d.coordinates as [number, number])) {
      if (!env.isAccessible(...cor)) {
        continue
      }
      const state: MovingCouplesState = env.get(...cor) as MovingCouplesState

      let betterGender = this.findBetterMatch(state, cor)
      if (betterGender !== undefined) {
        return new CoupleSecondStateSwitch(
          this.maleState,
          this.femaleState,
          this.direction,
          cor,
          betterGender,
        )
      }

      if (backupGender === undefined) {
        backupGender = this.findBetterMatch(state, cor, false)
        backupItem = cor
      }
    }

    if (backupItem && backupGender) {
      return new CoupleSecondStateSwitch(
        this.maleState,
        this.femaleState,
        this.direction,
        backupItem,
        backupGender,
      )
    }

    // no better match found, attempting move
    return new CoupleSecondStateMove(this.maleState, this.femaleState, this.direction)
  }
}

export abstract class CoupleSecondState extends CoupleState {}

export class CoupleSecondStateMove extends CoupleState {
  transition(env: Environment): MovingCouplesState {
    const currentDirection = Direction[this.direction as TDirection]
    const fallbackState = new CoupleFirstState(this.maleState, this.femaleState, this.direction)
    if (!env.isAccessible(...currentDirection.coordinates)) {
      return new CoupleFirstState(this.maleState, this.femaleState, randomDirection(this.direction))
    }

    let state: MovingCouplesState = env.get(...currentDirection.coordinates) as MovingCouplesState
    if (!(state instanceof NoCoupleMoveCoupleSecondState)) {
      return fallbackState
    }

    if (
      checkCoordinatesZero(currentDirection.coordinates as [number, number], state.nextCoupleCor)
    ) {
      // move successful
      return new NoCoupleFirstState()
    }

    return fallbackState
  }
}

export class CoupleSecondStateSwitch extends CoupleSecondState {
  public nextGender?: Gender
  public nextCor?: [number, number]
  constructor(
    maleState: HasItemCoupleState,
    femaleState: HasItemCoupleState,
    direction: TDirection,
    nextCor?: [number, number],
    nextGender?: Gender,
  ) {
    super(maleState, femaleState, direction)
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
    let state: MovingCouplesState = env.get(...this.nextCor) as MovingCouplesState

    if (state instanceof CoupleSecondStateMove) {
      return fallbackState // these states don't mix.
    }

    if (state instanceof CoupleSecondStateSwitch && state.nextGender !== this.nextGender) {
      // the neighbor did not agree to the switch
      return fallbackState
    }

    const itemState: ItemState = state.getItemState(this.nextGender)

    if (!(itemState instanceof HasItemState)) {
      return fallbackState
    }

    const itemDirection =
      state instanceof CoupleSecondStateSwitch
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
