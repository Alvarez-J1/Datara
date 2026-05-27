import type { ThemeOptions } from "@mui/material/styles";

const darkTheme: ThemeOptions = {
  palette: {
    mode: "dark",
    primary: {
      main: "#f8fafc",
      contrastText: "#111827",
    },
    secondary: {
      main: "#2dd4bf",
      contrastText: "#042f2e",
    },
    success: {
      main: "#34d399",
    },
    warning: {
      main: "#fbbf24",
    },
    info: {
      main: "#60a5fa",
    },
    error: {
      main: "#f87171",
    },
    background: {
      default: "#0e1116",
      paper: "#151922",
    },
    text: {
      primary: "#f8fafc",
      secondary: "#94a3b8",
    },
    divider: "rgba(148, 163, 184, 0.18)",
  },
  shape: {
    borderRadius: 8,
  },
  typography: {
    fontFamily:
      "var(--font-geist-sans), Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
    h3: {
      fontSize: "clamp(2rem, 4vw, 3.25rem)",
      fontWeight: 760,
      letterSpacing: "0",
      lineHeight: 1.05,
    },
    h4: {
      fontSize: "clamp(1.5rem, 3vw, 2.25rem)",
      fontWeight: 720,
      letterSpacing: "0",
      lineHeight: 1.14,
    },
    h5: {
      fontWeight: 700,
      letterSpacing: "0",
    },
    button: {
      fontWeight: 650,
      textTransform: "none",
    },
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          background: "#0e1116",
        },
        "*": {
          boxSizing: "border-box",
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundImage: "none",
          boxShadow: "none",
          color: "#f8fafc",
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: "8px",
          minWidth: "auto",
          textTransform: "none",
          whiteSpace: "nowrap",
        },
      },
    },
    MuiIconButton: {
      styleOverrides: {
        root: {
          borderRadius: "8px",
        },
      },
    },
    MuiPaper: {
      defaultProps: {
        elevation: 0,
      },
      styleOverrides: {
        root: {
          backgroundImage: "none",
        },
      },
    },
    MuiTooltip: {
      styleOverrides: {
        tooltip: {
          borderRadius: "8px",
          fontSize: "0.75rem",
          lineHeight: 1.45,
        },
      },
    },
  },
};

export default darkTheme;
