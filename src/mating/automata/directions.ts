export const Direction = {
  UP: { name: 'UP', coordinates: [-1, 0], number: 0 },
  RIGHT: { name: 'RIGHT', coordinates: [0, 1], number: 1 },
  DOWN: { name: 'DOWN', coordinates: [1, 0], number: 2 },
  LEFT: { name: 'LEFT', coordinates: [0, -1], number: 3 },
}
export type TDirection = keyof typeof Direction

export function randomDirection(seed: number, ...current: TDirection[]): TDirection {
  let directions = Object.keys(Direction)
  if (current.length) {
    directions = directions.filter(k => current.indexOf(k as TDirection) === -1)
  }

  let directionsCount = directions.length
  let index = seed % directionsCount
  return directions[index] as TDirection
}
