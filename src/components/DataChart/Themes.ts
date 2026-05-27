import type { ChartConfiguration } from "chart.js";

export const lightOptions: ChartConfiguration["options"] = {
  color: "#64748b",
  scales: {
    y: {
      beginAtZero: true,
      border: {
        display: false,
      },
      grid: {
        color: "rgba(15, 23, 42, 0.08)",
      },
      ticks: {
        color: "#64748b",
        padding: 10,
      },
    },
    x: {
      border: {
        display: false,
      },
      grid: {
        display: false,
      },
      ticks: {
        color: "#64748b",
        padding: 8,
      },
    },
  },
  plugins: {
    legend: {
      position: "bottom",
      labels: {
        boxHeight: 8,
        boxWidth: 8,
        color: "#475569",
        usePointStyle: true,
      },
    },
    tooltip: {
      backgroundColor: "#111827",
      borderColor: "rgba(255, 255, 255, 0.08)",
      borderWidth: 1,
      bodyColor: "#e5e7eb",
      displayColors: true,
      padding: 12,
      titleColor: "#ffffff",
    },
  },
};

export const darkOptions: ChartConfiguration["options"] = {
  color: "#94a3b8",
  scales: {
    y: {
      beginAtZero: true,
      border: {
        display: false,
      },
      grid: {
        color: "rgba(148, 163, 184, 0.14)",
      },
      ticks: {
        color: "#94a3b8",
        padding: 10,
      },
    },
    x: {
      border: {
        display: false,
      },
      grid: {
        display: false,
      },
      ticks: {
        color: "#94a3b8",
        padding: 8,
      },
    },
  },
  plugins: {
    legend: {
      position: "bottom",
      labels: {
        boxHeight: 8,
        boxWidth: 8,
        color: "#cbd5e1",
        usePointStyle: true,
      },
    },
    tooltip: {
      backgroundColor: "#f8fafc",
      borderColor: "rgba(15, 23, 42, 0.12)",
      borderWidth: 1,
      bodyColor: "#334155",
      displayColors: true,
      padding: 12,
      titleColor: "#111827",
    },
  },
};
