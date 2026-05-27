import { months } from "@/helper/Util";

const monthLabels = months({ count: 12, section: 3 });

export const revenueTrendData = {
  labels: monthLabels,
  datasets: [
    {
      label: "Net revenue",
      data: [182, 198, 214, 236, 229, 252, 268, 286, 319, 341, 356, 382],
      borderColor: "#14b8a6",
      backgroundColor: "rgba(20, 184, 166, 0.08)",
      borderWidth: 3,
      fill: true,
      pointBackgroundColor: "#ffffff",
      pointBorderColor: "#14b8a6",
      pointBorderWidth: 2,
      pointHoverRadius: 5,
      pointRadius: 3,
      tension: 0.38,
    },
    {
      label: "Forecast",
      data: [176, 190, 207, 221, 238, 247, 259, 274, 294, 318, 334, 351],
      borderColor: "#f59e0b",
      borderDash: [6, 6],
      borderWidth: 2,
      fill: false,
      pointRadius: 0,
      tension: 0.36,
    },
  ],
};

export const acquisitionMixData = {
  labels: ["Organic", "Paid", "Partners", "Outbound"],
  datasets: [
    {
      label: "Pipeline source",
      data: [42, 27, 18, 13],
      backgroundColor: ["#14b8a6", "#2563eb", "#f59e0b", "#f43f5e"],
      borderWidth: 0,
      hoverOffset: 8,
    },
  ],
};

export const retentionData = {
  labels: ["Expansion", "Renewals", "At risk"],
  datasets: [
    {
      label: "Account health",
      data: [34, 55, 11],
      backgroundColor: ["#22c55e", "#2dd4bf", "#f97316"],
      borderWidth: 0,
      hoverOffset: 8,
    },
  ],
};

export const customerTierData = {
  labels: ["Enterprise", "Scaleups", "SMB"],
  datasets: [
    {
      label: "Revenue tier",
      data: [48, 33, 19],
      backgroundColor: ["#475569", "#94a3b8", "#cbd5e1"],
      borderWidth: 0,
      hoverOffset: 8,
    },
  ],
};

export const regionData = {
  labels: ["North America", "Europe", "APAC", "LATAM"],
  datasets: [
    {
      label: "Regional revenue",
      data: [58, 22, 14, 6],
      backgroundColor: ["#14b8a6", "#8b5cf6", "#06b6d4", "#f59e0b"],
      borderWidth: 0,
      hoverOffset: 8,
    },
  ],
};
