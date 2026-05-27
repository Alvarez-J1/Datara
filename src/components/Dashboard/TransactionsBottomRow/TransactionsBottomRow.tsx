import { Grid, Paper, Typography } from "@mui/material";
import type { ChartConfiguration } from "chart.js";
import DataChart from "@/components/DataChart/DataChart";
import {
  acquisitionMixData,
  customerTierData,
  regionData,
  retentionData,
} from "@/components/mockData";
import scss from "./TransactionsBottomRow.module.scss";

const doughnutOptions: ChartConfiguration<"doughnut">["options"] = {
  cutout: "68%",
  plugins: {
    legend: {
      position: "bottom",
    },
  },
};

const analyticsCards = [
  {
    data: acquisitionMixData,
    detail: "Organic and partner-sourced accounts continue to carry the highest win rate.",
    highlight: "42%",
    label: "Organic pipeline",
    title: "Acquisition Mix",
  },
  {
    data: retentionData,
    detail: "Renewals remain healthy despite a small number of at-risk accounts.",
    highlight: "89%",
    label: "Healthy accounts",
    title: "Retention Health",
  },
  {
    data: customerTierData,
    detail: "Enterprise customers now make up the largest share of revenue.",
    highlight: "48%",
    label: "Enterprise share",
    title: "Customer Tiers",
  },
  {
    data: regionData,
    detail: "North America remains the largest market, while Europe continues to grow.",
    highlight: "58%",
    label: "NA revenue",
    title: "Regional Mix",
  },
];

const TransactionsBottomRow = () => {
  return (
    <Grid
      className={scss.bottomRow}
      container
      spacing={2.5}
      sx={{ maxWidth: "100%", width: "100%" }}
    >
      {analyticsCards.map((card) => (
        <Grid key={card.title} size={{ xs: 12, sm: 6, lg: 3 }}>
          <Paper className={scss.analyticsCard}>
            <div className={scss.cardHeader}>
              <div>
                <Typography className={scss.cardTitle} component="h3">
                  {card.title}
                </Typography>
                <Typography className={scss.cardDetail}>{card.detail}</Typography>
              </div>
            </div>

            <DataChart data={card.data} options={doughnutOptions} type="doughnut" />

            <div className={scss.cardFooter}>
              <Typography className={scss.highlight}>{card.highlight}</Typography>
              <Typography className={scss.footerLabel}>{card.label}</Typography>
            </div>
          </Paper>
        </Grid>
      ))}
    </Grid>
  );
};

export default TransactionsBottomRow;
