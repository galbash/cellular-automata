import BaseMatingState from './base_mating_state'
import Environment from '../../cellular_automata/environment'
import MatingAutomata from './automata'

const NO_PAIR_PENELTY: number = 101
const calcMatingScore = (p1: ItemState, p2: ItemState) => {
  if (!(p1 instanceof HasItemState) && !(p2 instanceof HasItemState)) {
    return 0
  }

  if (!(p1 instanceof HasItemState) || !(p2 instanceof HasItemState)) {
    return NO_PAIR_PENELTY
  }

  return Math.abs(p1.character - p2.character)
}
export enum Gender {
  MALE = 1,
  FEMALE,
}

export const Direction = {
  UP: { name: 'UP', coordinates: [-1, 0] },
  RIGHT: { name: 'RIGHT', coordinates: [0, 1] },
  DOWN: { name: 'DOWN', coordinates: [1, 0] },
  LEFT: { name: 'LEFT', coordinates: [0, -1] },
}

export type TDirection = keyof typeof Direction

function randomDirection(current?: TDirection): TDirection {
  let directions = Object.keys(Direction)
  if (current) {
    directions = directions.filter(k => k !== current)
  }
  let directionsCount = directions.length
  let index = Math.floor(Math.random() * directionsCount) % directionsCount
  return directions[index] as TDirection
}

const zip = (arr1: any[], arr2: any[] = []) => arr1.map((k, i) => [k, arr2[i]])

function checkCoordinatesZero(c1: [number, number], c2?: [number, number]): boolean {
  return (c2 && zip(c1, c2).every(([firstCor, secondCor]) => firstCor + secondCor === 0)) || false
}

export abstract class ItemState {
  public gender: Gender

  constructor(gender: Gender) {
    this.gender = gender
  }

  abstract transitionSingle(env: Environment): ItemState
  abstract get occupied(): boolean
}

export abstract class NoItemState extends ItemState {
  get occupied(): boolean {
    return false
  }
}

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

export abstract class HasItemState extends ItemState {
  static CHANGE_DIRACTION_CHANCE: number = 0.1
  public character: number
  public direction: TDirection
  constructor(gender: Gender, character: number, direction?: TDirection) {
    super(gender)
    this.character = character
    this.direction =
      Math.random() < HasItemState.CHANGE_DIRACTION_CHANCE
        ? randomDirection(direction)
        : direction || randomDirection()
  }

  get occupied(): boolean {
    return true
  }
}

export class HasItemFirstState extends HasItemState {
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

export abstract class SwitchPartnersState extends BaseMatingState {
  public maleState: ItemState
  public femaleState: ItemState

  getItemState(g: Gender): ItemState {
    if (g === Gender.MALE) {
      return this.maleState
    }
    if (g === Gender.FEMALE) {
      return this.femaleState
    }

    throw new Error('invalid gender')
  }

  has(g: Gender): boolean {
    let itemState: ItemState | undefined = undefined
    if (g === Gender.MALE) {
      itemState = this.maleState
    }
    if (g === Gender.FEMALE) {
      itemState = this.femaleState
    }

    if (!itemState) {
      throw new Error('invalid gender')
    }

    return itemState.occupied
  }

  constructor(maleState: ItemState, femaleState: ItemState) {
    super()
    this.maleState = maleState
    this.femaleState = femaleState
  }

  get matingScore(): number {
    return calcMatingScore(this.maleState, this.femaleState)
  }
  abstract transition(env: Environment): SwitchPartnersState

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
    let newMaleState = new HasItemCoupleState(maleState);
    newMaleState.direction = randomDirection(maleState.direction)
    let newFemaleState = new HasItemCoupleState(femaleState);
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

    if (state instanceof CoupleSecondState && state.nextGender != this.nextGender) {
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

export function transition(env: Environment): SwitchPartnersState {
  return (env.get(0, 0) as SwitchPartnersState).transition(env)
}

export function fillBoard(automata: MatingAutomata) {
  const rand = () => Math.floor(Math.random() * 101)
  for (let i = 0; i < 50; i++) {
    let maleState: SwitchPartnersState
    let maleItemState: ItemState
    let x
    let y
    do {
      x = Math.floor(Math.random() * automata.size)
      y = Math.floor(Math.random() * automata.size)
      maleState = (automata.grid as SwitchPartnersState[][])[x][y]
      maleItemState = maleState.getItemState(Gender.MALE)
    } while (!maleItemState || maleItemState instanceof HasItemState)
    ;(automata.grid as SwitchPartnersState[][])[x][y] = maleState.addItem(
      new HasItemFirstState(Gender.MALE, rand()),
    )
  }
  for (let i = 0; i < 50; i++) {
    let femaleState: SwitchPartnersState
    let femaleItemState: ItemState
    let x
    let y
    do {
      x = Math.floor(Math.random() * automata.size)
      y = Math.floor(Math.random() * automata.size)
      femaleState = (automata.grid as SwitchPartnersState[][])[x][y]
      femaleItemState = femaleState.getItemState(Gender.FEMALE)
    } while (!femaleItemState || femaleItemState instanceof HasItemState)
    ;(automata.grid as SwitchPartnersState[][])[x][y] = femaleState.addItem(
      new HasItemFirstState(Gender.FEMALE, rand()),
    )
  }
}
