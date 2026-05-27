import type { ThemeOptions } from "@mui/material/styles";

const lightTheme: ThemeOptions = {
  palette: {
    mode: "light",
    primary: {
      main: "#111827",
      contrastText: "#ffffff",
    },
    secondary: {
      main: "#14b8a6",
      contrastText: "#042f2e",
    },
    success: {
      main: "#0f9f6e",
    },
    warning: {
      main: "#d97706",
    },
    info: {
      main: "#2563eb",
    },
    error: {
      main: "#dc2626",
    },
    background: {
      default: "#f6f7f9",
      paper: "#ffffff",
    },
    text: {
      primary: "#111827",
      secondary: "#64748b",
    },
    divider: "rgba(15, 23, 42, 0.1)",
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
          background: "#f6f7f9",
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
          color: "#111827",
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

export default lightTheme;
