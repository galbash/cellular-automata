import React, { Component } from 'react'
import { Grid, Row, Col } from 'react-flexbox-grid'

interface IProps {
  cells: React.ReactElement[][]
}

interface IState {}

export default class Grid2D extends Component<IProps, IState> {
  constructor(props: IProps) {
    super(props)
  }

  render() {
    return (
      <Grid fluid>
        {this.props.cells.map(arr => {
          return (
            <Row>
              {arr.map(cell => {
                return <Col>{cell}</Col>
              })}
            </Row>
          )
        })}
      </Grid>
    )
  }
}
