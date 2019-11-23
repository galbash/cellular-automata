import React, { Component } from 'react'
import { hot } from 'react-hot-loader/root'
import AutomataView from './views/automata_view'
import GOLCell from './game_of_life/components/cell'
import GOLAutomata, { fillRandom } from './game_of_life/automata/automata'
import './App.css'
import MatingCell from './mating/components/cell'
import MatingAutomata, { matingFillRandom } from './mating/automata/automata'
import GOLState from './game_of_life/automata/state'
import State from './cellular_automata/state'
import MatingState, {default as SimpleMatingState} from './mating/automata/states/simple_state'
import Automata from './cellular_automata/automata'
import MatingAutomataDetails from './mating/components/automata_details'
import { Menu, Layout, Dropdown } from 'antd'
import { ClickParam } from 'antd/es/menu'
import FirstSightTransition from "./mating/automata/transitions/first_sight";
const { Header, Content } = Layout

@hot
class App extends Component {
  state = {
    game: 'Mating Option 1',
  }

  AUTOMATAS: Map<String, React.ReactElement> = new Map([
    [
      'Game Of Life',
      <AutomataView
        cellDisplay={(state: State) => <GOLCell state={state as GOLState} />}
        automataCreator={() => new GOLAutomata(50)}
        onGenerate={fillRandom}
      />,
    ],
    [
      'Mating Option 1',
      <AutomataView
        cellDisplay={(state: State) => <MatingCell state={state as MatingState} />}
        automataCreator={() => new MatingAutomata(50, SimpleMatingState, FirstSightTransition)}
        onGenerate={(automata: Automata) => matingFillRandom(automata as MatingAutomata)}
        automataDetailsDisplay={(automata: Automata) => (
          <MatingAutomataDetails automata={automata as MatingAutomata} />
        )}
      />,
    ],
  ])
  handleMenuClick = (event: ClickParam) => {
    this.setState({
      game: event.key,
    })
  }

  render() {
      const menu = (<Menu onClick={this.handleMenuClick}>
          {[...this.AUTOMATAS.keys()].map((name: String) => (
              <Menu.Item key={name as string}>{name}</Menu.Item>
          ))}
      </Menu>)

      return <Layout>
          <Header><h1 style={{color: 'white'}}>Cellular Automata</h1></Header>
          <Content>
              Game:{' '}
              <Dropdown.Button overlay={menu}>
                  {this.state.game}
              </Dropdown.Button>
              <br/>
              {this.AUTOMATAS.get(this.state.game)}
          </Content>
      </Layout>
  }
}

export default App
