const zip = (arr1: any[], arr2: any[] = []) => arr1.map((k, i) => [k, arr2[i]])

export function checkCoordinatesZero(c1: [number, number], c2?: [number, number]): boolean {
  return (c2 && zip(c1, c2).every(([firstCor, secondCor]) => firstCor + secondCor === 0)) || false
}

export const MAX_CHARACTER = 100

export function characterRandom(character: number) {
  return (character % MAX_CHARACTER) / MAX_CHARACTER
}
