import { Grid, Paper, Typography } from "@mui/material";
import type { ChartConfiguration } from "chart.js";
import DataChart from "@/components/DataChart/DataChart";
import { revenueTrendData } from "@/components/mockData";
import scss from "./TransactionsPerDay.module.scss";

const revenueTrendOptions: ChartConfiguration["options"] = {
  interaction: {
    intersect: false,
    mode: "index",
  },
  plugins: {
    legend: {
      display: false,
    },
  },
  scales: {
    y: {
      ticks: {
        callback: (value: string | number) => `$${value}K`,
      },
    },
  },
};

const insightMetrics = [
  {
    label: "Qualified pipeline",
    value: "$1.42M",
    change: "+22.8%",
    context: "from 318 active opportunities",
  },
  {
    label: "Sales cycle",
    value: "18 days",
    change: "-3.4 days",
    context: "median time to paid conversion",
  },
  {
    label: "Expansion revenue",
    value: "$72.8K",
    change: "+14.1%",
    context: "from existing workspace upgrades",
  },
];

const TransactionsPerDay = () => {
  return (
    <Grid container className={scss.wrapper} spacing={2.5}>
      <Grid size={12} sx={{ minWidth: 0, width: "100%" }}>
        <Paper className={scss.transactions}>
          <div className={scss.chartHeader}>
            <div>
              <Typography className={scss.kicker}>Revenue Trend</Typography>
              <Typography className={scss.title} component="h2">
              Revenue growth is outperforming projections
              </Typography>
            </div>
            <Typography className={scss.period}>Jan-Dec 2026</Typography>
          </div>

          <div className={scss.chartBody}>
            <div className={scss.chart}>
              <DataChart
                data={revenueTrendData}
                options={revenueTrendOptions}
                type="line"
              />
            </div>

            <aside className={scss.insightRail} aria-label="Revenue trend highlights">
              <Typography className={scss.railTitle}>Pipeline metrics</Typography>
              {insightMetrics.map((metric) => (
                <div className={scss.insightItem} key={metric.label}>
                  <div>
                    <Typography className={scss.insightLabel}>{metric.label}</Typography>
                    <Typography className={scss.insightContext}>
                      {metric.context}
                    </Typography>
                  </div>
                  <div className={scss.insightNumbers}>
                    <Typography className={scss.insightValue}>{metric.value}</Typography>
                    <Typography className={scss.insightChange}>
                      {metric.change}
                    </Typography>
                  </div>
                </div>
              ))}
            </aside>
          </div>
        </Paper>
      </Grid>
    </Grid>
  );
};

export default TransactionsPerDay;
