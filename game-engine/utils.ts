const getRandomWord = (length: number) =>
  new Array(length)
    .fill(0)
    .map((_) => String.fromCharCode(Math.random() * 26 + 'A'.charCodeAt(0)))
    .join('')
const getGeneratorRange = function* (
  start: number,
  stop: number,
  step: number
) {
  let n = start
  while (n < stop) {
    yield n
    n += step
  }
}
const getRange = (start: number, stop: number, step: number) => [
  ...getGeneratorRange(start, stop, step),
]
export { getRandomWord, getGeneratorRange, getRange }
