import React, { Component, ReactElement } from 'react'
import { hot } from 'react-hot-loader/root'
import AutomataView from './views/automata_view'
import GOLCell from './game_of_life/components/cell'
import GOLAutomata, { fillRandom } from './game_of_life/automata/automata'
import './App.css'
import MatingAutomata from './mating/automata/automata'
import GOLState from './game_of_life/automata/state'
import State from './cellular_automata/state'
import Automata from './cellular_automata/automata'
import MatingAutomataDetails from './mating/components/automata_details'
import { Menu, Layout, Dropdown } from 'antd'
import { ClickParam } from 'antd/es/menu'
import MatingCell from './mating/components/cell'
import {
  NoCoupleState as FirstSightNoCoupleState,
  fillBoard as firstSightFillBoard,
} from './mating/automata/first_sight'
import {
  NoCoupleState as SwitchPartnersNoCoupleState,
  fillBoard as switchPartnersFillBoard,
} from './mating/automata/switch_partners'

import {
  NoCoupleFirstState as MovingCouplesNoCoupleState,
  fillBoard as movingCouplesFillBoard,
} from './mating/automata/moving_couples'
import { transition as matingTransition } from './mating/automata/transition'
import BaseMatingState from './mating/automata/mating_states'
const { Header, Content } = Layout

@hot
class App extends Component {
  state = {
    game: 'Mating Moving Couples',
  }

  AUTOMATAS: Map<String, () => ReactElement> = new Map([
    [
      'Game Of Life',
      () => (
        <AutomataView
          cellDisplay={(state: State) => <GOLCell state={state as GOLState} />}
          automataCreator={(size: number) => new GOLAutomata(size)}
          onGenerate={fillRandom}
        />
      ),
    ],
    [
      'Mating First Sight',
      () => (
        <AutomataView
          cellDisplay={(state: State) => <MatingCell state={state as BaseMatingState} />}
          automataCreator={(size: number) =>
            new MatingAutomata(size, FirstSightNoCoupleState, matingTransition)
          }
          onGenerate={(automata: Automata) => firstSightFillBoard(automata as MatingAutomata)}
          automataDetailsDisplay={(automata: Automata) => (
            <MatingAutomataDetails automata={automata as MatingAutomata} />
          )}
        />
      ),
    ],
    [
      'Mating Switch Partners',
      () => (
        <AutomataView
          cellDisplay={(state: State) => <MatingCell state={state as BaseMatingState} />}
          automataCreator={(size: number) =>
            new MatingAutomata(size, SwitchPartnersNoCoupleState, matingTransition)
          }
          onGenerate={(automata: Automata) => switchPartnersFillBoard(automata as MatingAutomata)}
          automataDetailsDisplay={(automata: Automata) => (
            <MatingAutomataDetails automata={automata as MatingAutomata} />
          )}
        />
      ),
    ],
    [
      'Mating Moving Couples',
      () => (
        <AutomataView
          cellDisplay={(state: State) => <MatingCell state={state as BaseMatingState} />}
          automataCreator={(size: number) =>
            new MatingAutomata(size, MovingCouplesNoCoupleState, matingTransition)
          }
          onGenerate={(automata: Automata) => movingCouplesFillBoard(automata as MatingAutomata)}
          automataDetailsDisplay={(automata: Automata) => (
            <MatingAutomataDetails automata={automata as MatingAutomata} />
          )}
        />
      ),
    ],
  ])
  handleMenuClick = (event: ClickParam) => {
    this.setState({
      game: event.key,
    })
  }

  render() {
    const menu = (
      <Menu onClick={this.handleMenuClick}>
        {[...this.AUTOMATAS.keys()].map((name: String) => (
          <Menu.Item key={name as string}>{name}</Menu.Item>
        ))}
      </Menu>
    )
    const automataViewGenerator = this.AUTOMATAS.get(this.state.game)

    return (
      <Layout>
        <Header>
          <h1 style={{ color: 'white' }}>Cellular Automata</h1>
        </Header>
        <Content>
          Game: <Dropdown.Button overlay={menu}>{this.state.game}</Dropdown.Button>
          <br />
          {automataViewGenerator && automataViewGenerator()}
        </Content>
      </Layout>
    )
  }
}

export default App
