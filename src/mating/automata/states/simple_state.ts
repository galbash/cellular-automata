import State from '../../../cellular_automata/state'

export const Direction = {
  UP: { name: 'UP', coordinates: [-1, 0] },
  RIGHT: { name: 'RIGHT', coordinates: [0, 1] },
  DOWN: { name: 'DOWN', coordinates: [1, 0] },
  LEFT: { name: 'LEFT', coordinates: [0, -1] },
}

export type TDirection = keyof typeof Direction

export interface Person {
  character: number
  direction?: TDirection
  moveAttempts?: number
}

export function randomDirection(): TDirection {
  let directions = Object.keys(Direction)
  let directionsCount = directions.length
  let index = Math.floor(Math.random() * directionsCount) % directionsCount
  return directions[index] as TDirection
}

export function calcMatingScore(p1: Person, p2: Person) {
  return Math.abs(p1.character - p2.character)
}

export default class SimpleMatingState extends State {
  public male?: Person
  public nextMale?: [number, number]

  public female?: Person

  constructor(male?: number, female?: number) {
    super()
    if (male) {
      this.male = { character: male }
    }

    if (female) {
      this.female = { character: female }
    }
  }

  clone(): SimpleMatingState {
    let x = new SimpleMatingState(this.male?.character, this.female?.character)
    if (x.male) {
      x.male.direction = this.male?.direction
    }
    if (this.nextMale) {
      x.nextMale = [...this.nextMale] as [number, number]
    }
    return x
  }

  get matingScore(): number {
    if (!this.male && !this.female) {
      return 0
    }

    if (!this.male || !this.female) {
      return 101 // highest penalty
    }

    return calcMatingScore(this.male, this.female)
  }
}
