import { Grid } from "@mui/material";
import DataCard, { DataCardProps } from "@/components/Dashboard/DataCard/DataCard";
import scss from "./DataRibbon.module.scss";

const metrics: DataCardProps[] = [
  {
    accent: "#14b8a6",
    context: "Revenue tracking 6.2% above plan",
    description: "Total revenue from active customer accounts this quarter.",
    title: "Net Revenue",
    trend: "+18.4%",
    trendLabel: "vs previous quarter",
    value: "$284.6K",
  },
  {
    accent: "#2563eb",
    context: "1,842 orders processed in the last 90 days",
    description: "Completed purchases across self-serve and sales channels.",
    title: "Orders",
    trend: "+12.7%",
    trendLabel: "trailing 90 days",
    value: "1,842",
  },
  {
    accent: "#f59e0b",
    context: "$38.90 increase from bundled plans",
    description: "Average revenue generated per completed order.",
    title: "Avg. Order Value",
    trend: "+7.9%",
    trendLabel: "month over month",
    value: "$194.20",
  },
  {
    accent: "#f43f5e",
    context: "Conversion rate improved after pricing changes",
    description: "Percentage of visitors who upgraded to a paid workspace.",
    title: "Conversion",
    trend: "+2.1%",
    trendLabel: "last 30 days",
    value: "8.6%",
  },
];

const DataRibbon = () => {
  return (
    <Grid
      className={scss.dataRibbon}
      container
      spacing={2.5}
      sx={{ maxWidth: "100%", width: "100%" }}
    >
      {metrics.map((metric) => (
        <Grid key={metric.title} size={{ xs: 12, sm: 6, lg: 3 }}>
          <DataCard {...metric} />
        </Grid>
      ))}
    </Grid>
  );
};

export default DataRibbon;
