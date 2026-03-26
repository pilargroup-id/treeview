import React from "react";

const WAVE_LINES = [
  {
    d: "M-80,170 C60,120 220,120 360,170 S650,220 820,170 S1080,120 1160,170",
    stroke: "rgba(107, 163, 208, 0.24)",
    strokeWidth: 4,
  },
  {
    d: "M-100,280 C70,235 220,335 390,280 S700,225 860,280 S1090,335 1180,280",
    stroke: "rgba(107, 163, 208, 0.18)",
    strokeWidth: 3,
  },
  {
    d: "M-60,420 C120,360 250,470 420,420 S700,365 890,420 S1090,470 1170,420",
    stroke: "rgba(107, 163, 208, 0.16)",
    strokeWidth: 4,
  },
  {
    d: "M-90,610 C80,560 220,660 380,610 S660,560 840,610 S1070,660 1160,610",
    stroke: "rgba(107, 163, 208, 0.14)",
    strokeWidth: 3,
  },
  {
    d: "M-70,790 C120,720 260,850 440,790 S720,730 900,790 S1110,850 1190,790",
    stroke: "rgba(107, 163, 208, 0.2)",
    strokeWidth: 4,
  },
  {
    d: "M-100,980 C70,930 230,1030 390,980 S680,930 860,980 S1100,1030 1180,980",
    stroke: "rgba(107, 163, 208, 0.16)",
    strokeWidth: 3,
  },
  {
    d: "M-80,1140 C110,1080 260,1180 430,1140 S720,1100 900,1140 S1110,1185 1200,1140",
    stroke: "rgba(107, 163, 208, 0.18)",
    strokeWidth: 4,
  },
];

export default function BackgroundMobile() {
  return (
    <div style={styles.container}>
      <svg
        viewBox="0 0 1000 1400"
        preserveAspectRatio="none"
        style={styles.svg}
      >
        <rect width="1000" height="1400" fill="#F4F8FC" />

        <path
          d="M0,0 H1000 V150 C840,205 665,70 500,115 C335,160 170,230 0,185 Z"
          fill="rgba(107, 163, 208, 0.18)"
        />
        <path
          d="M0,95 C170,30 315,165 490,110 C665,55 820,10 1000,75 V230 H0 Z"
          fill="rgba(255, 255, 255, 0.52)"
        />
        <path
          d="M0,1220 C180,1160 340,1270 500,1225 C680,1175 835,1070 1000,1120 V1400 H0 Z"
          fill="rgba(107, 163, 208, 0.12)"
        />

        {WAVE_LINES.map((wave, index) => (
          <path
            key={index}
            d={wave.d}
            fill="none"
            stroke={wave.stroke}
            strokeWidth={wave.strokeWidth}
            strokeLinecap="round"
          />
        ))}
      </svg>
    </div>
  );
}

const styles = {
  container: {
    position: "absolute",
    inset: 0,
    width: "100%",
    height: "100%",
    overflow: "hidden",
    backgroundColor: "#F4F8FC",
  },
  svg: {
    position: "absolute",
    inset: 0,
    width: "100%",
    height: "100%",
  },
};
