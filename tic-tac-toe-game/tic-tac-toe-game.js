const getGeneratorRange = function* (start, stop, step) {
  let n = start;
  while (n < stop) {
    yield n;
    n += step;
  }
};
const getRange =
  (start, stop, step) => [...getGeneratorRange(start, stop, step)];
const forwardSlashDiagonale = getRange(2, 7, 2)
const backwardSlashDiagonale = getRange(0, 9, 4)
const columns = getRange(0, 3, 1).map((c) => getRange(c, c + 7, 3))
const rows = getRange(0, 7, 3).map((c) => getRange(c, c + 3, 1))
export const allAxes = [
  forwardSlashDiagonale,
  backwardSlashDiagonale,
  ...columns,
  ...rows,
]
