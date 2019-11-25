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
import { number } from 'prop-types'

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
    // a failed step is more expensive
    const fallbackState = new HasItemFirstState(
      this.gender,
      this.character,
      this.direction,
      this.stepsCount + 1,
    )
    if (!env.isAccessible(...currentDirection.coordinates)) {
      return new HasItemFirstState(
        this.gender,
        this.character,
        randomDirection(this.seed, this.direction),
      )
    }
    let state: MovingCouplesState = env.get(...currentDirection.coordinates) as MovingCouplesState
    let itemState = state.getItemState(this.gender)
    if (state instanceof CoupleSecondStateSwitch) {
      if (
        state.nextGender === this.gender &&
        checkCoordinatesZero(currentDirection.coordinates as [number, number], state.nextCor)
      ) {
        return new HasItemFirstState(this.gender, (itemState as HasItemCoupleState).character) // new direction
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
    super(
      generatingItem.gender,
      generatingItem.character,
      generatingItem.direction,
      generatingItem.stepsCount,
    )
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
  public stepNumber: number
  constructor(
    maleState: HasItemCoupleState,
    femaleState: HasItemCoupleState,
    direction: TDirection,
    stepNumber: number = 0,
  ) {
    super(maleState, femaleState)
    this.maleState = maleState
    this.femaleState = femaleState
    this.direction = direction
    this.stepNumber = stepNumber
  }

  get seed() {
    return Direction[this.direction].number + this.stepNumber
  }
}

export class CoupleFirstState extends CoupleState {
  get stepLimit() {
    return (this.seed % 10) + 10
  }
  constructor(
    maleState: HasItemCoupleState,
    femaleState: HasItemCoupleState,
    direction?: TDirection,
    stepNumber: number = 0,
  ) {
    // randomize direction for better switching each two-cycles
    let seed = maleState.seed + femaleState.seed
    let tmpDirection = direction ? direction : randomDirection(seed)
    super(maleState, femaleState, tmpDirection, stepNumber + 1)
    if (stepNumber > this.stepLimit) {
      this.direction = randomDirection(this.seed, this.direction)
      console.log(
        'using new direction',
        this.direction,
        'step num',
        this.stepNumber,
        'limit',
        this.stepLimit,
      )
      this.stepNumber = 0
    }
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
          this.stepNumber,
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
        this.stepNumber,
        backupItem,
        backupGender,
      )
    }

    // no better match found, attempting move
    return new CoupleSecondStateMove(
      this.maleState,
      this.femaleState,
      this.direction,
      this.stepNumber,
    )
  }
}

export abstract class CoupleSecondState extends CoupleState {}

export class CoupleSecondStateMove extends CoupleState {
  transition(env: Environment): MovingCouplesState {
    const currentDirection = Direction[this.direction as TDirection]
    // a failed move is more expensive
    const fallbackState = new CoupleFirstState(
      this.maleState,
      this.femaleState,
      this.direction,
      this.stepNumber + 1,
    )
    if (!env.isAccessible(...currentDirection.coordinates)) {
      let triedDirections = [this.direction]
      let newDirection: TDirection | undefined = undefined
      do {
        newDirection = randomDirection(this.seed, ...triedDirections)
        triedDirections = [newDirection, ...triedDirections]
      } while (!env.isAccessible(...Direction[newDirection].coordinates))
      console.log(
        'inaccessible enc, new direction',
        newDirection,
        'stepnum',
        this.stepNumber,
        'direction',
        this.direction,
      )
      return new CoupleFirstState(this.maleState, this.femaleState, newDirection, this.stepNumber)
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
    stepNumber: number,
    nextCor?: [number, number],
    nextGender?: Gender,
  ) {
    super(maleState, femaleState, direction, stepNumber)
    this.nextCor = nextCor
    this.nextGender = nextGender
  }

  transition(env: Environment): CoupleFirstState {
    // not charging extra here - not a move attempt
    const fallbackState = new CoupleFirstState(
      this.maleState,
      this.femaleState,
      this.direction,
      this.stepNumber,
    )
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
        return new CoupleFirstState(
          this.maleState,
          new HasItemCoupleState(itemState),
          this.direction,
          this.stepNumber,
        )
      }

      if (this.nextGender === Gender.MALE) {
        // switch male
        return new CoupleFirstState(
          new HasItemCoupleState(itemState),
          this.femaleState,
          this.direction,
          this.stepNumber,
        )
      }

      throw new Error('invalid gender')
    }

    return fallbackState
  }
}

export function fillBoard(automata: MatingAutomata) {
  return fillMatingAutomata(automata, HasItemFirstState)
}
