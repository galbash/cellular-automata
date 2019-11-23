import State from '../../cellular_automata/state'

export default abstract class BaseMatingState extends State {
  abstract get matingScore(): number
}
