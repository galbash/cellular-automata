import State from '../../cellular_automata/state'
import Environment from '../../cellular_automata/environment'
import { Direction, nextDirection, randomDirection, TDirection } from './directions'

/**
 * different items genders
 */
export enum Gender {
  MALE = 1, // so we can do !gender
  FEMALE,
}

/**
 * Basic state of all mating automata state
 */
export default abstract class BaseMatingState extends State {
  public maleState: ItemState
  public femaleState: ItemState

  /**
   * @param {Gender} g the gender whose state we want
   * @return {ItemState} The state of the item
   */
  getItemState(g: Gender): ItemState {
    if (g === Gender.MALE) {
      return this.maleState
    }
    if (g === Gender.FEMALE) {
      return this.femaleState
    }

    throw new Error('invalid gender')
  }

  /**
   * @param {Gender} g the gender we are checking
   * @return {boolean} True if an item of that gender exists in our state
   */
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

  /**
   * @return {number} mating score for current cell
   */
  get matingScore(): number {
    return calcMatingScore(this.maleState, this.femaleState)
  }

  /**
   * performs a transition for the state
   */
  abstract transition(env: Environment): BaseMatingState

  /**
   * adds an item to the state, used for initialization
   */
  abstract addItem(item: HasItemState): BaseMatingState
}

const NO_PAIR_PENELTY: number = 101
/**
 * calculates the mating score of two items
 */
export const calcMatingScore = (p1: ItemState, p2: ItemState) => {
  if (!(p1 instanceof HasItemState) && !(p2 instanceof HasItemState)) {
    return 0
  }

  if (!(p1 instanceof HasItemState) || !(p2 instanceof HasItemState)) {
    return NO_PAIR_PENELTY
  }

  return Math.abs(p1.character - p2.character)
}

/**
 * the state of an item (male / female) in a cell
 */
export abstract class ItemState {
  public gender: Gender

  constructor(gender: Gender) {
    this.gender = gender
  }

  /**
   * transition rule in case it is a single item in a cell
   */
  abstract transitionSingle(env: Environment): ItemState

  /**
   * @return {boolean} true if an item exists, false otherwise
   */
  abstract get occupied(): boolean
}

/**
 * a state that indicates there is no item of the searched gender in the cell
 */
export abstract class NoItemState extends ItemState {
  get occupied(): boolean {
    return false
  }
}

/**
 * a state that indicates there is an item of the searched gender in the cell
 */
export abstract class HasItemState extends ItemState {
  public character: number
  public direction: TDirection
  public stepsCount: number // counter of steps in current direction

  constructor(gender: Gender, character: number, direction: TDirection, stepsCount: number = 0) {
    super(gender)
    this.character = character
    this.direction = direction
    this.stepsCount = stepsCount
  }

  get occupied(): boolean {
    return true
  }

  /**
   * @return {number} seed for pseudo-random decisions on this item
   */
  get seed(): number {
    return Direction[this.direction].number + this.stepsCount
  }
}

/**
 * Base class for first cycle steps on items which exists in a cell
 */
export abstract class BaseHasItemFirstState extends HasItemState {
  static STEP_LIMIT: number = 10

  constructor(gender: Gender, character: number, direction?: TDirection, stepsCount: number = 0) {
    let tmpDirection = direction ? direction : randomDirection(character)
    let realStepsCount = stepsCount + 1
    super(gender, character, tmpDirection, realStepsCount)
    if (this.stepsCount > BaseHasItemFirstState.STEP_LIMIT) {
      this.direction = nextDirection(this.direction)
      this.stepsCount = 0
    }
  }
}
