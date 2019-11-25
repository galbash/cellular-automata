import State from '../../cellular_automata/state'
import Environment from '../../cellular_automata/environment'
import { randomDirection, TDirection } from './directions'

export default abstract class BaseMatingState extends State {
  clone(): BaseMatingState {
    throw new Error('deprecated, will be removed.')
  }
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
  abstract transition(env: Environment): BaseMatingState
  abstract addItem(item: HasItemState): BaseMatingState
}

const NO_PAIR_PENELTY: number = 101
export const calcMatingScore = (p1: ItemState, p2: ItemState) => {
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

export abstract class BaseHasItemFirstState extends HasItemState {
  constructor(gender: Gender, character: number, direction?: TDirection) {
    let realDirection =
      Math.random() < HasItemState.CHANGE_DIRACTION_CHANCE
        ? randomDirection(direction)
        : direction || randomDirection()
    super(gender, character, realDirection)
  }
}
