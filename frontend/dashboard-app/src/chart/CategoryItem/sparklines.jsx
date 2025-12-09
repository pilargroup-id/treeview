import React from "react";

export default function SparkLine({ data }) {
  const width = 120;
  const height = 40;

  const max = Math.max(...data);
  const min = Math.min(...data);

  const points = data
    .map((d, i) => {
      const x = (i / (data.length - 1)) * width;
      const y = height - ((d - min) / (max - min)) * height;
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <svg width={width} height={height}>
      <polyline fill="none" stroke="#4caf50" strokeWidth="2" points={points} />
    </svg>
  );
}