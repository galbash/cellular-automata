/**
 * zips two array together: [1, 2, 3], [4, 5, 6] => [[1, 4], [2, 5], [3, 6]]
 */
const zip = (arr1: any[], arr2: any[] = []) => arr1.map((k, i) => [k, arr2[i]])

/**
 * checks if the sum of two grid co-ordinates is zero. used to match move requests
 */
export function checkCoordinatesZero(c1: [number, number], c2?: [number, number]): boolean {
  return (c2 && zip(c1, c2).every(([firstCor, secondCor]) => firstCor + secondCor === 0)) || false
}
