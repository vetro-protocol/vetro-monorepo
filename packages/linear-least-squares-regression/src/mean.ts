export function mean(dataset: number[]) {
  if (dataset.length === 0) {
    throw new Error("Cannot compute mean of an empty dataset");
  }
  return dataset.reduce((sum, value) => sum + value, 0) / dataset.length;
}
