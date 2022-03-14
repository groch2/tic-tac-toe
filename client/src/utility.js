const getRange = function* (start, stop, step) {
  let n = start;
  while (n < stop) {
    yield n;
    n += step;
  }
};
const getArrayRange =
  (start, stop, step) => [...getRange(start, stop, step)];
export { getArrayRange };