import MatingAutomata from './automata'
import BaseMatingState, { Gender, HasItemState, ItemState } from './mating_states'
import { MAX_CHARACTER } from './utils'

const ITEM_NUM = 50
export function fillMatingAutomata(
  automata: MatingAutomata,
  itemCreator: new (g: Gender, char: number) => HasItemState,
) {
  const rand = () => Math.floor(Math.random() * (MAX_CHARACTER + 1))
  for (let i = 0; i < ITEM_NUM; i++) {
    let maleState: BaseMatingState
    let maleItemState: ItemState
    let x
    let y
    do {
      x = Math.floor(Math.random() * automata.size)
      y = Math.floor(Math.random() * automata.size)
      maleState = (automata.grid as BaseMatingState[][])[x][y]
      maleItemState = maleState.getItemState(Gender.MALE)
    } while (!maleItemState || maleItemState instanceof HasItemState)
    ;(automata.grid as BaseMatingState[][])[x][y] = maleState.addItem(
      new itemCreator(Gender.MALE, rand() as number),
    )
  }
  for (let i = 0; i < ITEM_NUM; i++) {
    let femaleState: BaseMatingState
    let femaleItemState: ItemState
    let x
    let y
    do {
      x = Math.floor(Math.random() * automata.size)
      y = Math.floor(Math.random() * automata.size)
      femaleState = (automata.grid as BaseMatingState[][])[x][y]
      femaleItemState = femaleState.getItemState(Gender.FEMALE)
    } while (!femaleItemState || femaleItemState instanceof HasItemState)
    ;(automata.grid as BaseMatingState[][])[x][y] = femaleState.addItem(
      new itemCreator(Gender.FEMALE, rand() as number),
    )
  }
}
