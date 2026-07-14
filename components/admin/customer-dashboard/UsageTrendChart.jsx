'use client'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
} from 'chart.js'
import { Line } from 'react-chartjs-2'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Filler, Tooltip)

const LINE_COLOR = '#5B8DEF'
const FILL_COLOR = 'rgba(91, 141, 239, 0.12)'

// Small inline curve chart for one Report drill-down row. Single series, so
// no legend (the row's own label already says what's plotted) — a 2px
// smoothed line, ~10% area wash, and a hover tooltip per the dataviz mark
// spec. Chart.js only registers what's used above (tree-shaken bundle).
export default function UsageTrendChart({ points }) {
  if (!points.length) {
    return (
      <div className="h-[120px] flex items-center justify-center text-xs text-subtle">
        Select a date range
      </div>
    )
  }

  const data = {
    labels: points.map((p) => p.label),
    datasets: [
      {
        data: points.map((p) => p.value),
        borderColor: LINE_COLOR,
        backgroundColor: FILL_COLOR,
        borderWidth: 2,
        pointRadius: 4,
        pointHoverRadius: 5,
        pointBackgroundColor: LINE_COLOR,
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
        tension: 0.4,
        fill: true,
      },
    ],
  }

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: { mode: 'index', intersect: false },
    plugins: {
      legend: { display: false },
      tooltip: {
        displayColors: false,
        callbacks: { title: () => '', label: (ctx) => `${ctx.parsed.y} coins` },
      },
    },
    scales: {
      x: { display: false },
      y: {
        display: true,
        border: { display: false },
        grid: { color: 'rgba(148, 163, 184, 0.18)' },
        ticks: { color: '#94a3b8', font: { size: 10 }, maxTicksLimit: 3 },
      },
    },
  }

  return (
    <div className="h-[120px]">
      <Line data={data} options={options} />
    </div>
  )
}
