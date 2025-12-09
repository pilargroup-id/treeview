export function randomWalk(value) {
    const change = (Math.random() - 0.5) * 2;
    return Math.max(1, value + change);
  }
  