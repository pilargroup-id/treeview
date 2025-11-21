import React from 'react';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

export default function SpecificDateBarChart({ specificDates = [] }) {
  // Convert specificDates to labels and counts
  // Group by year if available, otherwise just show monthDay
  const dateMap = {};
  specificDates.forEach(date => {
    let label;
    if (typeof date === 'string') {
      label = date;
    } else {
      label = `${date.monthDay} ${date.year}`;
    }
    dateMap[label] = (dateMap[label] || 0) + 1;
  });
  const labels = Object.keys(dateMap);
  const data = Object.values(dateMap);

  const chartData = {
    labels,
    datasets: [
      {
        label: 'Jumlah Tanggal',
        data,
        backgroundColor: 'rgba(59, 130, 246, 0.7)',
        borderRadius: 6,
        maxBarThickness: 32,
      },
    ],
  };

  const options = {
    responsive: true,
    plugins: {
      legend: { display: false },
      title: { display: false },
      tooltip: { enabled: true },
    },
    scales: {
      x: {
        title: { display: false },
        ticks: { font: { size: 12 } },
      },
      y: {
        beginAtZero: true,
        title: { display: false },
        ticks: { stepSize: 1, precision: 0, font: { size: 12 } },
        min: 0,
        max: 1,
      },
    },
  };

  return (
    <div style={{ width: '100%', maxWidth: 700, margin: '24px auto 0', background: '#F8FAFC', borderRadius: 12, padding: 24, boxShadow: '0 2px 8px rgba(59,130,246,0.07)' }}>
      <Bar data={chartData} options={options} height={220} />
    </div>
  );
}
