"use client";

import AdbIcon from "@mui/icons-material/Adb";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import CheckCircleOutlineRoundedIcon from "@mui/icons-material/CheckCircleOutlineRounded";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import Button from "@mui/material/Button";
import Tab from "@mui/material/Tab";
import Tabs from "@mui/material/Tabs";
import TextField from "@mui/material/TextField";
import { alpha, useTheme } from "@mui/material/styles";
import { login, register } from "@/lib/api/auth";
import { ApiError, removeAuthToken, useHasAuthToken } from "@/lib/api/client";
import { clearDemoMode, enableDemoMode } from "@/lib/demoMode";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  type CSSProperties,
  type FormEvent,
  useEffect,
  useRef,
  useState,
} from "react";
import scss from "./Login.module.scss";

// Free-tier hosting can cold-start slowly on the first request. If the demo
// login hasn't resolved by this point, we let the user know why it's taking
// a while instead of leaving the button looking frozen.
const DEMO_SLOW_LOAD_THRESHOLD_MS = 5000;

type AuthMode = "signIn" | "signUp";

const DEMO_EMAIL = "admin@datara.local";
const DEMO_PASSWORD = "DataraDemo123!";

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
  const hasAuthToken = useHasAuthToken();
  const router = useRouter();
  const theme = useTheme();
  const [authMode, setAuthMode] = useState<AuthMode>("signIn");
  const [email, setEmail] = useState("");
  const [formError, setFormError] = useState("");
  const [isDemoSlow, setIsDemoSlow] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const demoSlowTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isDark = theme.palette.mode === "dark";
  const isLoading = isSubmitting;
  const isSignedIn = hasAuthToken;

  // Hard redirect so the signed-in page is fully torn down and the browser's
  // Back button can't restore it after logout.
  const handleSignOut = async () => {
    setIsSubmitting(true);
    clearDemoMode();
    removeAuthToken();
    window.location.href = "/auth/signin";
  };

  const handleCredentialsSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const submittedEmail = String(formData.get("email") ?? email);
    const submittedName = String(formData.get("name") ?? name);
    const submittedPassword = String(formData.get("password") ?? password);

    setEmail(submittedEmail);
    setName(submittedName);
    setPassword(submittedPassword);
    setFormError("");
    setIsSubmitting(true);
    clearDemoMode();
    removeAuthToken();

    try {
      if (authMode === "signIn") {
        await login({ email: submittedEmail, password: submittedPassword });
      } else {
        try {
          await register({
            email: submittedEmail,
            name: submittedName,
            password: submittedPassword,
          });
        } catch (error) {
          if (!isDuplicateEmailError(error)) {
            throw error;
          }

          try {
            await login({ email: submittedEmail, password: submittedPassword });
          } catch {
            setAuthMode("signIn");
            setFormError(
              `An account for ${normalizeEmail(submittedEmail)} already exists. Sign in with that email, or use a different email to create a new account.`
            );
            return;
          }
        }
      }

      router.push("/dashboard");
    } catch (error) {
      setFormError(getAuthErrorMessage(error, authMode));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDemoAccess = async () => {
    setIsSubmitting(true);
    setFormError("");
    setIsDemoSlow(false);
    enableDemoMode();

    demoSlowTimerRef.current = setTimeout(() => {
      setIsDemoSlow(true);
    }, DEMO_SLOW_LOAD_THRESHOLD_MS);

    try {
      await login({ email: DEMO_EMAIL, password: DEMO_PASSWORD });
    } catch {
      // Demo mode still bypasses the frontend route guard if the backend is unavailable.
    } finally {
      if (demoSlowTimerRef.current) {
        clearTimeout(demoSlowTimerRef.current);
        demoSlowTimerRef.current = null;
      }

      router.push("/dashboard");
      setIsSubmitting(false);
      setIsDemoSlow(false);
    }
  };

  const handleAuthModeChange = (_event: unknown, value: AuthMode) => {
    setAuthMode(value);
    setFormError("");
  };

  useEffect(() => {
    return () => {
      if (demoSlowTimerRef.current) {
        clearTimeout(demoSlowTimerRef.current);
      }
    };
  }, []);

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
                {isSignedIn ? "You are signed in" : "Start with your workspace"}
              </h2>
              <p>
                {isSignedIn
                  ? "Continue into your analytics workspace or sign out of this session."
                  : "Sign in or create an account to review revenue metrics, pipeline performance, and customer activity."}
              </p>
            </div>

            {isSignedIn ? (
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
              <>
                <Tabs
                  aria-label="Datara authentication mode"
                  className={scss.authTabs}
                  onChange={handleAuthModeChange}
                  value={authMode}
                  variant="fullWidth"
                >
                  <Tab label="Sign In" value="signIn" />
                  <Tab label="Sign Up" value="signUp" />
                </Tabs>

                <form className={scss.authForm} onSubmit={handleCredentialsSubmit}>
                  {authMode === "signUp" && (
                    <TextField
                      autoComplete="name"
                      className={scss.authField}
                      disabled={isLoading}
                      label="Name"
                      name="name"
                      onChange={(event) => setName(event.target.value)}
                      required
                      size="small"
                      value={name}
                    />
                  )}

                  <TextField
                    autoComplete="email"
                    className={scss.authField}
                    disabled={isLoading}
                    label="Email"
                    name="email"
                    onChange={(event) => setEmail(event.target.value)}
                    required
                    size="small"
                    type="email"
                    value={email}
                  />

                  <TextField
                    autoComplete={
                      authMode === "signIn" ? "current-password" : "new-password"
                    }
                    className={scss.authField}
                    disabled={isLoading}
                    label="Password"
                    name="password"
                    onChange={(event) => setPassword(event.target.value)}
                    required
                    size="small"
                    type="password"
                    value={password}
                  />

                  {formError && <p className={scss.formError}>{formError}</p>}

                  <Button
                    className={scss.primaryCta}
                    disabled={isLoading}
                    type="submit"
                    variant="contained"
                  >
                    {isSubmitting
                      ? "Please wait..."
                      : authMode === "signIn"
                        ? "Sign In"
                        : "Sign Up"}
                  </Button>
                </form>

                <div className={scss.demoAccess}>
                  <Button
                    className={scss.demoCta}
                    disabled={isLoading}
                    onClick={handleDemoAccess}
                    variant="text"
                  >
                    {isSubmitting ? "Opening demo..." : "View Demo Workspace"}
                  </Button>
                  <span>Skip sign in and explore Datara with preloaded sample data.</span>
                </div>

                {isDemoSlow && (
                  <div className={scss.demoSlowNotice} role="status">
                    <InfoOutlinedIcon fontSize="small" />
                    <p>
                      <strong>Demo server is hosted on a free tier.</strong>{" "}
                      The first request can take 30-60 seconds while it wakes
                      up from inactivity - thanks for your patience.
                    </p>
                  </div>
                )}
              </>
            )}

            <p className={scss.securityNote}>
              Protected access is encrypted and scoped to your Datara workspace.
            </p>
          </div>

        </div>
      </div>
    </section>
  );
};

const getAuthErrorMessage = (error: unknown, authMode: AuthMode): string => {
  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }

  return authMode === "signIn"
    ? "Unable to sign in with those credentials."
    : "Unable to create your account.";
};

const isDuplicateEmailError = (error: unknown): boolean => {
  if (error instanceof ApiError && error.status === 409) {
    return true;
  }

  return (
    error !== null &&
    typeof error === "object" &&
    "status" in error &&
    (error as { status?: unknown }).status === 409
  );
};

const normalizeEmail = (value: string): string => {
  return value.trim().toLowerCase();
};

export default Login;
