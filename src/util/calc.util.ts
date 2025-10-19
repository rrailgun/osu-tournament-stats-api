

export function calculateAccuracy(count300: number, count100: number, count50: number, countmiss: number): number {
  const totalHits = count300 + count100 + count50 + countmiss;
  if (totalHits === 0) return 0;
  return ((50 * count50 + 100 * count100 + 300 * count300) / (300 * totalHits)) * 100;
}