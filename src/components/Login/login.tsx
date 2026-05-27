"use client";

import AdbIcon from "@mui/icons-material/Adb";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import AutoGraphRoundedIcon from "@mui/icons-material/AutoGraphRounded";
import CheckCircleOutlineRoundedIcon from "@mui/icons-material/CheckCircleOutlineRounded";
import GoogleIcon from "@mui/icons-material/Google";
import InsightsRoundedIcon from "@mui/icons-material/InsightsRounded";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import TrendingUpRoundedIcon from "@mui/icons-material/TrendingUpRounded";
import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import { alpha, useTheme } from "@mui/material/styles";
import Link from "next/link";
import { signIn, signOut, useSession } from "next-auth/react";
import { type CSSProperties, useState } from "react";
import scss from "./Login.module.scss";

const previewMetrics = [
  { label: "ARR forecast", value: "$1.18M", change: "+18.4%" },
  { label: "Pipeline health", value: "3.4x", change: "target" },
  { label: "Win rate", value: "28.6%", change: "+4.1%" },
];

const activityItems = [
  "Enterprise deal moved to closing stage",
  "Pricing page conversion up 2.1%",
  "Renewal risk reduced across 14 accounts",
];

const Login = () => {
  const { data: session, status } = useSession();
  const theme = useTheme();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isDark = theme.palette.mode === "dark";
  const isLoading = status === "loading" || isSubmitting;

  const handleSignIn = async () => {
    setIsSubmitting(true);
    await signIn("google", { callbackUrl: "/dashboard" });
    setIsSubmitting(false);
  };

  const handleSignOut = async () => {
    setIsSubmitting(true);
    await signOut({ callbackUrl: "/auth/signin" });
    setIsSubmitting(false);
  };

  return (
    <section
      className={scss.authShell}
      style={
        {
          "--auth-accent": theme.palette.secondary.main,
          "--auth-bg": theme.palette.background.default,
          "--auth-border": theme.palette.divider,
          "--auth-muted": theme.palette.text.secondary,
          "--auth-panel": theme.palette.background.paper,
          "--auth-soft": alpha(theme.palette.secondary.main, isDark ? 0.12 : 0.07),
          "--auth-text": theme.palette.text.primary,
        } as CSSProperties
      }
    >
      <div className={scss.backgroundGrid} aria-hidden="true" />

      <div className={scss.authLayout}>
        <div className={scss.brandColumn}>
          <div className={scss.brandBadge}>
            <span className={scss.bugMark}>
              <AdbIcon fontSize="small" />
            </span>
            <span>Datara</span>
          </div>

          <div className={scss.brandCopy}>
            <p className={scss.eyebrow}>Analytics workspace</p>
            <h1>Modern analytics built for clarity.</h1>
            <p>
              Monitor revenue and performance metrics in a clean workspace built for faster decisions.
            </p>
          </div>

          <div className={scss.previewPanel} aria-label="Datara dashboard preview">
            <div className={scss.previewHeader}>
              <div>
                <span className={scss.previewKicker}>Weekly performance</span>
                <strong>Revenue overview</strong>
              </div>
            </div>

            <div className={scss.previewMetrics}>
              {previewMetrics.map((metric) => (
                <div className={scss.previewMetric} key={metric.label}>
                  <span>{metric.label}</span>
                  <strong>{metric.value}</strong>
                  <em>{metric.change}</em>
                </div>
              ))}
            </div>

            <div className={scss.chartPreview}>
              <div className={scss.chartLine} />
              {[42, 54, 48, 66, 74, 86, 96].map((height, index) => (
                <span
                  className={scss.chartBar}
                  key={height + index}
                  style={{ "--bar-height": `${height}%` } as CSSProperties}
                />
              ))}
            </div>

            <div className={scss.activityList}>
              {activityItems.map((item) => (
                <div className={scss.activityItem} key={item}>
                  <CheckCircleOutlineRoundedIcon fontSize="small" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className={scss.cardColumn}>
          <div className={scss.authCard}>
            <div className={scss.cardIcon}>
              <LockOutlinedIcon fontSize="small" />
            </div>

            <div className={scss.cardCopy}>
              <p className={scss.eyebrow}>Secure workspace access</p>
              <h2>
                {session ? "You are signed in" : "Welcome back to Datara"}
              </h2>
              <p>
                {session
                  ? "Continue into your analytics workspace or sign out of this session."
                  : "Sign in to review revenue metrics, pipeline performance, and customer activity."}
              </p>
            </div>

            <div className={scss.valueProps} aria-label="Authentication benefits">
              <span>
                <InsightsRoundedIcon fontSize="small" />
                Live metrics
              </span>
              <span>
                <AutoGraphRoundedIcon fontSize="small" />
                Forecasting
              </span>
              <span>
                <TrendingUpRoundedIcon fontSize="small" />
                Revenue trends
              </span>
            </div>

            {session ? (
              <div className={scss.sessionActions}>
                <Button
                  className={scss.primaryCta}
                  component={Link}
                  endIcon={<ArrowForwardIcon />}
                  href="/dashboard"
                  variant="contained"
                >
                  Continue to dashboard
                </Button>
                <Button
                  className={scss.secondaryCta}
                  disabled={isLoading}
                  onClick={handleSignOut}
                  variant="text"
                >
                  {isLoading ? "Signing out..." : "Sign out"}
                </Button>
              </div>
            ) : (
              <Button
                className={scss.primaryCta}
                disabled={isLoading}
                onClick={handleSignIn}
                startIcon={
                  isLoading ? (
                    <CircularProgress color="inherit" size={18} />
                  ) : (
                    <GoogleIcon />
                  )
                }
                variant="contained"
              >
                {status === "loading" ? "Checking session..." : "Continue with Google"}
              </Button>
            )}

            <p className={scss.securityNote}>
              Protected with Google OAuth. Access is encrypted and scoped to
              your Datara workspace.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Login;
