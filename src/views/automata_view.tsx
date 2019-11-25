import React, { Component } from 'react'
import { Slider, Layout, InputNumber } from 'antd'

import Grid2D from '../components/2dgrid'
import Automata from '../cellular_automata/automata'
import { SliderValue } from 'antd/es/slider'
import Button from 'antd/es/button/button'
import State from '../cellular_automata/state'

const MAX_SLIDER_VALUE = 5
const MIN_INTERVAL_MS = 1000
const SPEED_INTERVALS = MIN_INTERVAL_MS / MAX_SLIDER_VALUE
const DEFAULT_AUTOMATA_SIZE = 50
const DEFAULT_FAST_FORWARD_STEPS = 100

interface IProps {
  automataCreator: (size: number) => Automata
  onGenerate: (automata: Automata) => void
  cellDisplay: (state: State) => React.ReactElement
  automataDetailsDisplay: (automata: Automata) => React.ReactElement
}

interface IState {
  speed: number
  running: boolean
  automata: Automata
  updateFunctionId?: number
  automataSizeInput: number
  stepsOnFastForward: number
  fastForwardLoading: boolean
}

export default class AutomataView extends Component<IProps, IState> {
  state: IState = {
    speed: 10,
    running: false,
    automata: this.props.automataCreator(DEFAULT_AUTOMATA_SIZE),
    automataSizeInput: DEFAULT_AUTOMATA_SIZE,
    stepsOnFastForward: DEFAULT_FAST_FORWARD_STEPS,
    fastForwardLoading: false,
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

  generateNewAutomata = () => {
    const automata = this.props.automataCreator(this.state.automataSizeInput)
    this.props.onGenerate(automata)
    return new Promise(resolve => {
      this.setState(
        {
          automata,
        },
        resolve,
      )
    })
  }

  onGenerateClick = async () => {
    await this.generateNewAutomata()
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

  onAutomataSizeChange = (value: number | undefined) => {
    if (value) {
      this.setState({
        automataSizeInput: value,
      })
    }
  }

  onFastForwardChange = (value: number | undefined) => {
    if (value) {
      this.setState({
        stepsOnFastForward: value,
      })
    }
  }

  onFastForward = () => {
    let { automata } = this.state
    let that = this
    this.setState(
      {
        fastForwardLoading: true,
      },
      () => {
        setTimeout(() => {
          // allowing loading to render
          for (let i = 0; i < this.state.stepsOnFastForward; i++) {
            automata.step()
          }
          that.setState({
            automata,
            fastForwardLoading: false,
          })
        }, 300)
      },
    )
  }

  render() {
    let { running, automata, fastForwardLoading } = this.state
    let disabled = running || fastForwardLoading
    return (
      <React.Fragment>
        Generation: {automata.generation} {this.props.automataDetailsDisplay(automata)} Size:
        <InputNumber
          disabled={disabled}
          min={20}
          max={100}
          defaultValue={DEFAULT_AUTOMATA_SIZE}
          onChange={this.onAutomataSizeChange}
        />
        <Button onClick={this.onGenerateClick} disabled={disabled}>
          Generate
        </Button>
        <Button disabled={fastForwardLoading} onClick={this.onStartClick}>
          {running ? 'Stop' : 'Start'}
        </Button>
        <Button disabled={disabled} onClick={this.intervalHandler}>
          Single Step
        </Button>{' '}
        Generations:
        <InputNumber
          disabled={disabled}
          min={1}
          defaultValue={DEFAULT_FAST_FORWARD_STEPS}
          onChange={this.onFastForwardChange}
        />
        <Button onClick={this.onFastForward} disabled={disabled} loading={fastForwardLoading}>
          Fast Forward
        </Button>
        <br />
        Speed:
        <Slider
          tipFormatter={null}
          max={MAX_SLIDER_VALUE}
          min={0}
          defaultValue={MAX_SLIDER_VALUE}
          onAfterChange={this.onSliderChange}
        />
        {automata && <Grid2D cells={this.renderCells()} />}
      </React.Fragment>
    )
  }
}
