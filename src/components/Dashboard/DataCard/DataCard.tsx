import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import NorthEastIcon from "@mui/icons-material/NorthEast";
import RemoveIcon from "@mui/icons-material/Remove";
import SouthEastIcon from "@mui/icons-material/SouthEast";
import { IconButton, Paper, Tooltip, Typography } from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import scss from "./DataCard.module.scss";

export type DataCardProps = {
  accent: string;
  compact?: boolean;
  context: string;
  description: string;
  title: string;
  trend: string;
  trendLabel: string;
  trendTone?: "negative" | "neutral" | "positive";
  value: string;
};

const DataCard = ({
  accent,
  compact = false,
  context,
  description,
  title,
  trend,
  trendLabel,
  trendTone = "positive",
  value,
}: DataCardProps) => {
  const theme = useTheme();
  const TrendIcon =
    trendTone === "negative"
      ? SouthEastIcon
      : trendTone === "neutral"
        ? RemoveIcon
        : NorthEastIcon;
  const trendColor =
    trendTone === "negative"
      ? theme.palette.error.main
      : trendTone === "neutral"
        ? theme.palette.warning.main
        : theme.palette.success.main;

  return (
    <Paper
      className={`${scss.dataCard} ${compact ? scss.compact : ""}`}
      component="article"
      sx={{
        backgroundColor: "background.paper",
        border: "1px solid",
        borderColor: alpha(accent, theme.palette.mode === "dark" ? 0.18 : 0.12),
        boxShadow:
          theme.palette.mode === "dark"
            ? "0 10px 24px rgba(0, 0, 0, 0.18)"
            : "0 10px 24px rgba(15, 23, 42, 0.05)",
      }}
    >
      <div className={scss.cardHeader}>
        <Typography className={scss.label} component="h2">
          {title}
        </Typography>

        <Tooltip title={description}>
          <IconButton aria-label={`${title} details`} size="small">
            <InfoOutlinedIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </div>

      <div className={scss.metricBlock}>
        <Typography className={scss.value}>{value}</Typography>
        <span className={scss.trendPill} style={{ color: trendColor }}>
          <TrendIcon fontSize="inherit" />
          {trend}
        </span>
      </div>

      <div className={scss.contextRow}>
        <Typography className={scss.context}>{context}</Typography>
        <Typography className={scss.trendLabel}>{trendLabel}</Typography>
      </div>
    </Paper>
  );
};

export default DataCard;
