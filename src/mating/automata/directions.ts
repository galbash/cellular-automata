export const Direction = {
  UP: { name: 'UP', coordinates: [-1, 0], number: 0 },
  UP_RIGHT: { name: 'UP_RIGHT', coordinates: [-1, 1], number: 4 },
  RIGHT: { name: 'RIGHT', coordinates: [0, 1], number: 1 },
  UP_LEFT: { name: 'UP_LEFT', coordinates: [-1, -1], number: 5 },
  DOWN: { name: 'DOWN', coordinates: [1, 0], number: 2 },
  DOWN_LEFT: { name: 'DOWN_LEFT', coordinates: [1, -1], number: 6 },
  LEFT: { name: 'LEFT', coordinates: [0, -1], number: 3 },
  DOWN_RIGHT: { name: 'DOWN_RIGHT', coordinates: [1, 1], number: 7 },
}
export const VNDirection = {
  UP: { name: 'UP', coordinates: [-1, 0], number: 0 },
  RIGHT: { name: 'RIGHT', coordinates: [0, 1], number: 1 },
  DOWN: { name: 'DOWN', coordinates: [1, 0], number: 2 },
  LEFT: { name: 'LEFT', coordinates: [0, -1], number: 3 },
}
export type TDirection = keyof typeof Direction

export enum EnvType {
  VN,
  Moore,
}

let envType: EnvType = EnvType.Moore
export function setenv(env: EnvType) {
  envType = env
}

export function getDirectionsObject() {
  switch (envType) {
    case EnvType.VN:
      return VNDirection
    case EnvType.Moore:
      return Direction
  }
}

export function randomDirection(seed: number, ...current: TDirection[]): TDirection {
  let directions = Object.keys(getDirectionsObject())
  if (current.length) {
    directions = directions.filter(k => current.indexOf(k as TDirection) === -1)
  }

  let directionsCount = directions.length
  let index = seed % directionsCount
  return directions[index] as TDirection
}

export function nextDirection(current: TDirection): TDirection {
  let directions = Object.keys(getDirectionsObject())
  let index = directions.indexOf(current)
  let nextIndex = (index + 1) % directions.length
  return directions[nextIndex] as TDirection
}
