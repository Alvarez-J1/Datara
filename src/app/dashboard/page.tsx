"use client";

import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Login from "@/components/Login/login";
import DataRibbon from "@/components/Dashboard/DataRibbon/dataRibbon";
import TransactionsBottomRow from "@/components/Dashboard/TransactionsBottomRow/TransactionsBottomRow";
import TransactionsPerDay from "@/components/Dashboard/TransactionsPerDay/TransactionsPerDay";
import Footer from "@/components/Footer/Footer";
import { useSession } from "next-auth/react";
import scss from "./Dashboard.module.scss";

export default function Home() {
  const { data: session } = useSession();

  if (!session) {
    return <Login />;
  }

  return (
    <Box component="main" className={scss.dashboardPage}>
      <section className={scss.dashboardHero}>
        <div className={scss.heroCopy}>
          <Typography className={scss.eyebrow}>Revenue analytics</Typography>
          <Typography variant="h3" component="h1">
            Executive Overview
          </Typography>
          <Typography className={scss.heroText}>
          Track revenue performance, conversion trends, and pipeline activity in one centralized dashboard
          </Typography>
        </div>

        <div className={scss.heroPanel} aria-label="Quarterly forecast status">
          <div className={scss.statusRow}>
            <span className={scss.statusDot} />
            <Typography className={scss.statusLabel}>Forecast active</Typography>
          </div>
          <Typography className={scss.heroPanelValue}>$1.18M</Typography>
          <Typography className={scss.heroPanelText}>
            Q4 pipeline coverage at 3.4x target
          </Typography>
        </div>
      </section>

      <div className={scss.dashboardStack}>
        <DataRibbon />
        <TransactionsPerDay />
        <TransactionsBottomRow />
      </div>

      <Footer />
    </Box>
  );
}
