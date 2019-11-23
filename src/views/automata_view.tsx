import React, { Component } from 'react'
import { Slider, Layout } from 'antd'

import Grid2D from '../components/2dgrid'
import Automata from '../cellular_automata/automata'
import { SliderValue } from 'antd/es/slider'
import Button from 'antd/es/button/button'
import State from '../cellular_automata/state'

const MAX_SLIDER_VALUE = 5
const MIN_INTERVAL_MS = 1000
const SPEED_INTERVALS = MIN_INTERVAL_MS / MAX_SLIDER_VALUE

interface IProps {
  automataCreator: () => Automata
  onGenerate: (automata: Automata) => void
  cellDisplay: (state: State) => React.ReactElement
  automataDetailsDisplay: (automata: Automata) => React.ReactElement
}

interface IState {
  speed: number
  running: boolean
  automata: Automata
  updateFunctionId?: number
}

export default class AutomataView extends Component<IProps, IState> {
  state: IState = {
    speed: 10,
    running: false,
    automata: this.props.automataCreator(),
  }

  static defaultProps = {
    automataDetailsDisplay: (automata: Automata) => null,
  }

  onSliderChange = async (value: SliderValue) => {
    let speed = (MAX_SLIDER_VALUE - (value as number)) * SPEED_INTERVALS
    this.setState({ speed }, this.handleSpeedChange)
  }

  handleSpeedChange = () => {
    let { running } = this.state
    if (running) {
      this.stopAutomata()
      this.startAutomata()
    }
  }

  stopAutomata = () => {
    let { updateFunctionId } = this.state
    clearInterval(updateFunctionId)
  }

  startAutomata = () => {
    let { updateFunctionId, speed } = this.state
    updateFunctionId = window.setInterval(this.intervalHandler, speed)
    this.setState({
      updateFunctionId,
    })
  }

  onGenerateClick = async () => {
    const automata = this.props.automataCreator()
    this.props.onGenerate(automata)
    this.setState({
      automata,
    })
  }

  intervalHandler = () => {
    let { automata } = this.state
    automata.step()
    this.setState({
      automata,
    })
  }

  onStartClick = async () => {
    let { running } = this.state
    if (running) {
      this.stopAutomata()
    } else {
      this.startAutomata()
    }

    this.setState({
      running: !running,
    })
  }

  renderCells = () =>
    (this.state.automata.grid as State[][]).map(arr =>
      arr.map(state => this.props.cellDisplay(state)),
    )

  render() {
    let { running, automata } = this.state
    return (
      <React.Fragment>
        Generation: {automata.generation} {this.props.automataDetailsDisplay(automata)}{' '}
        <Button onClick={this.onGenerateClick} disabled={running}>
          Generate
        </Button>
        <Button onClick={this.onStartClick}>{running ? 'Stop' : 'Start'}</Button>
        <Button disabled={running} onClick={this.intervalHandler}>
          Single Step
        </Button>
        <Slider
          tipFormatter={null}
          max={MAX_SLIDER_VALUE}
          min={0}
          defaultValue={MAX_SLIDER_VALUE}
          onAfterChange={this.onSliderChange}
        />
        <Grid2D cells={this.renderCells()} />
      </React.Fragment>
    )
  }
}
