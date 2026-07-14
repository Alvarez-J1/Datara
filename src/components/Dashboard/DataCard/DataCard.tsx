import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import NorthEastIcon from "@mui/icons-material/NorthEast";
import RemoveIcon from "@mui/icons-material/Remove";
import SouthEastIcon from "@mui/icons-material/SouthEast";
import { ClickAwayListener, IconButton, Paper, Tooltip } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { useState } from "react";
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
  const [isTooltipOpen, setIsTooltipOpen] = useState(false);
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
        borderColor: "divider",
        boxShadow:
          theme.palette.mode === "dark"
            ? "0 10px 24px rgba(0, 0, 0, 0.18)"
            : "0 10px 24px rgba(15, 23, 42, 0.05)",
      }}
    >
      <div className={scss.cardHeader}>
        <h2 className={scss.label}>{title}</h2>

        <ClickAwayListener onClickAway={() => setIsTooltipOpen(false)}>
          <span className={scss.tooltipAnchor}>
            <Tooltip
              disableFocusListener
              disableHoverListener
              disableTouchListener
              onClose={() => setIsTooltipOpen(false)}
              open={isTooltipOpen}
              title={description}
            >
              <IconButton
                aria-expanded={isTooltipOpen}
                aria-label={`${title} details`}
                onBlur={() => setIsTooltipOpen(false)}
                onClick={(event) => {
                  event.stopPropagation();
                  setIsTooltipOpen(true);
                }}
                onFocus={() => setIsTooltipOpen(true)}
                onMouseEnter={() => setIsTooltipOpen(true)}
                onMouseLeave={() => setIsTooltipOpen(false)}
                size="small"
              >
                <InfoOutlinedIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </span>
        </ClickAwayListener>
      </div>

      <div className={scss.metricBlock}>
        <p className={scss.value}>{value}</p>
        <span className={scss.trendPill} style={{ color: trendColor }}>
          <TrendIcon fontSize="inherit" />
          {trend}
        </span>
      </div>

      <div className={scss.contextRow}>
        <p className={scss.context}>{context}</p>
        <p className={scss.trendLabel}>{trendLabel}</p>
      </div>
    </Paper>
  );
};

export default DataCard;
