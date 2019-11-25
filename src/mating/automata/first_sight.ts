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
  MALE = 1, // so we can do !gender
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
      return new HasItemFirstState(itemState.gender, itemState.character, itemState.direction)
    }

    return fallbackState
  }
}

export abstract class HasItemState extends ItemState {
  static CHANGE_DIRACTION_CHANCE: number = 0.1
  public character: number
  public direction: TDirection
  constructor(gender: Gender, character: number, direction: TDirection) {
    super(gender)
    this.character = character
    this.direction = direction
  }

  get occupied(): boolean {
    return true
  }
}

export class HasItemFirstState extends HasItemState {
  constructor(gender: Gender, character: number, direction?: TDirection) {
    let realDirection =
      Math.random() < HasItemState.CHANGE_DIRACTION_CHANCE
        ? randomDirection(direction)
        : direction || randomDirection()
    super(gender, character, realDirection)
  }

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
  abstract transition(env: Environment): FirstSightState

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

export function transition(env: Environment): FirstSightState {
  return (env.get(0, 0) as FirstSightState).transition(env)
}

export function fillBoard(automata: MatingAutomata) {
  const rand = () => Math.floor(Math.random() * 101)
  for (let i = 0; i < 50; i++) {
    let maleState: FirstSightState
    let maleItemState: ItemState
    let x
    let y
    do {
      x = Math.floor(Math.random() * automata.size)
      y = Math.floor(Math.random() * automata.size)
      maleState = (automata.grid as FirstSightState[][])[x][y]
      maleItemState = maleState.getItemState(Gender.MALE)
    } while (!maleItemState || maleItemState instanceof HasItemState)
    ;(automata.grid as FirstSightState[][])[x][y] = maleState.addItem(
      new HasItemFirstState(Gender.MALE, rand()),
    )
  }
  for (let i = 0; i < 50; i++) {
    let femaleState: FirstSightState
    let femaleItemState: ItemState
    let x
    let y
    do {
      x = Math.floor(Math.random() * automata.size)
      y = Math.floor(Math.random() * automata.size)
      femaleState = (automata.grid as FirstSightState[][])[x][y]
      femaleItemState = femaleState.getItemState(Gender.FEMALE)
    } while (!femaleItemState || femaleItemState instanceof HasItemState)
    ;(automata.grid as FirstSightState[][])[x][y] = femaleState.addItem(
      new HasItemFirstState(Gender.FEMALE, rand()),
    )
  }
}
