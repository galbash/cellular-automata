import State from '../../cellular_automata/state'

export default abstract class BaseMatingState extends State {
  abstract get matingScore(): number
  clone(): BaseMatingState {
    throw new Error('deprecated, will be removed.')
  }
}
