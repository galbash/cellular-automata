export const Direction = {
  UP: { name: 'UP', coordinates: [-1, 0] },
  RIGHT: { name: 'RIGHT', coordinates: [0, 1] },
  DOWN: { name: 'DOWN', coordinates: [1, 0] },
  LEFT: { name: 'LEFT', coordinates: [0, -1] },
}
export type TDirection = keyof typeof Direction

export function randomDirection(current?: TDirection): TDirection {
  let directions = Object.keys(Direction)
  if (current) {
    directions = directions.filter(k => k !== current)
  }
  let directionsCount = directions.length
  let index = Math.floor(Math.random() * directionsCount) % directionsCount
  return directions[index] as TDirection
}
