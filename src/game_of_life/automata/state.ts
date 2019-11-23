import State from '../../cellular_automata/state'

export default class GOLState extends State {
  public alive: boolean

  constructor(alive: boolean = false) {
    super()
    this.alive = alive
  }

  clone(): GOLState {
    return new GOLState(this.alive)
  }
}
