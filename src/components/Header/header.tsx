"use client";

import { ColorModeContext } from "@/app/providers";
import AdbIcon from "@mui/icons-material/Adb";
import DarkModeIcon from "@mui/icons-material/DarkMode";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import LightModeIcon from "@mui/icons-material/LightMode";
import AppBar from "@mui/material/AppBar";
import Avatar from "@mui/material/Avatar";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Container from "@mui/material/Container";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import Switch from "@mui/material/Switch";
import Toolbar from "@mui/material/Toolbar";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import useMediaQuery from "@mui/material/useMediaQuery";
import { useTheme } from "@mui/material/styles";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signIn, signOut, useSession } from "next-auth/react";
import * as React from "react";
import { useContext } from "react";

const getPageLabel = (pathname: string | null) => {
  if (!pathname || pathname === "/dashboard") return "Overview";

  const label = pathname.split("/").filter(Boolean).pop() ?? "Overview";
  if (label === "signin") return "Sign in";

  return label.charAt(0).toUpperCase() + label.slice(1);
};

const Header = () => {
  const { data: session } = useSession();
  const theme = useTheme();
  const pathname = usePathname();
  const tabletCheck = useMediaQuery("(min-width:768px)");
  const colorMode = useContext(ColorModeContext);
  const [anchorElUser, setAnchorElUser] = React.useState<null | HTMLElement>(null);
  const pageLabel = getPageLabel(pathname);
  const isDark = theme.palette.mode === "dark";

  const handleOpenUserMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorElUser(event.currentTarget);
  };

  const handleCloseUserMenu = () => {
    setAnchorElUser(null);
  };

  return (
    <AppBar
      elevation={0}
      position="fixed"
      sx={{
        backgroundColor: "background.paper",
        borderBottom: "1px solid",
        borderColor: "divider",
        color: "text.primary",
        width: "100%",
        zIndex: (currentTheme) => currentTheme.zIndex.drawer + 1,
      }}
    >
      <Container maxWidth={false} disableGutters>
        <Toolbar
          disableGutters
          sx={{
            gap: { xs: 1.5, sm: 2 },
            minHeight: { xs: 58, sm: 66 },
            px: { xs: 1.5, sm: 2.5, md: 3 },
          }}
        >
          <Box
            component={Link}
            href="/dashboard"
            sx={{
              alignItems: "center",
              color: "inherit",
              display: "flex",
              gap: 1.2,
              minWidth: 0,
              textDecoration: "none",
            }}
          >
            <Box
              sx={{
                alignItems: "center",
                backgroundColor: "text.primary",
                borderRadius: "8px",
                color: "background.paper",
                display: "inline-flex",
                height: 34,
                justifyContent: "center",
                width: 34,
              }}
            >
              <AdbIcon fontSize="small" />
            </Box>

            <Box sx={{ display: { xs: "none", sm: "block" }, minWidth: 0 }}>
              <Typography
                noWrap
                sx={{
                  fontFamily: "var(--font-geist-mono)",
                  fontSize: "1rem",
                  fontWeight: 780,
                  letterSpacing: "0.18em",
                  lineHeight: 1,
                }}
              >
                Datara
              </Typography>
              <Typography
                noWrap
                sx={{
                  color: "text.secondary",
                  fontSize: "0.72rem",
                  fontWeight: 650,
                  letterSpacing: "0.04em",
                  mt: 0.4,
                }}
              >
                Revenue analytics
              </Typography>
            </Box>
          </Box>

          {session && tabletCheck && (
            <Box
              sx={{
                borderLeft: "1px solid",
                borderColor: "divider",
                display: "flex",
                flexDirection: "column",
                ml: 1,
                pl: 2,
              }}
            >
              <Typography
                sx={{
                  color: "text.secondary",
                  fontSize: "0.72rem",
                  fontWeight: 700,
                  letterSpacing: "0.08em",
                  lineHeight: 1.2,
                  textTransform: "uppercase",
                }}
              >
                Dashboard
              </Typography>
              <Typography sx={{ fontSize: "0.92rem", fontWeight: 720, lineHeight: 1.25 }}>
                {pageLabel}
              </Typography>
            </Box>
          )}

          <Box sx={{ flexGrow: 1 }} />

          <Box
            sx={{
              alignItems: "center",
              border: "1px solid",
              borderColor: "divider",
              borderRadius: "8px",
              display: "flex",
              gap: 0.3,
              px: 0.6,
              py: 0.25,
            }}
          >
            <LightModeIcon
              fontSize="small"
              sx={{ color: isDark ? "text.disabled" : "warning.main" }}
            />
            <Switch
              checked={isDark}
              onChange={colorMode.toggleColorMode}
              slotProps={{ input: { "aria-label": "Toggle dark mode" } }}
              size="small"
            />
            <DarkModeIcon
              fontSize="small"
              sx={{ color: isDark ? "secondary.main" : "text.disabled" }}
            />
          </Box>

          {session ? (
            <Box sx={{ flexGrow: 0 }}>
              <Tooltip title="Open profile settings">
                <Button
                  aria-label="Open profile menu"
                  onClick={handleOpenUserMenu}
                  sx={{
                    border: "1px solid",
                    borderColor: "divider",
                    color: "text.primary",
                    gap: 1,
                    maxWidth: { xs: 72, sm: 260, md: 300 },
                    minWidth: 0,
                    overflow: "hidden",
                    px: { xs: 0.5, sm: 1 },
                    py: 0.45,
                  }}
                >
                  <Avatar
                    alt={session.user?.name ?? "User"}
                    src={session.user?.image ?? undefined}
                    sx={{ height: 30, width: 30 }}
                  />
                  {tabletCheck && (
                    <Box sx={{ minWidth: 0, textAlign: "left" }}>
                      <Typography
                        noWrap
                        sx={{ fontSize: "0.78rem", fontWeight: 720, lineHeight: 1.2 }}
                      >
                        {session.user?.name ?? "Datara user"}
                      </Typography>
                      <Typography
                        noWrap
                        sx={{
                          color: "text.secondary",
                          fontSize: "0.72rem",
                          lineHeight: 1.2,
                          maxWidth: 190,
                        }}
                      >
                        {session.user?.email}
                      </Typography>
                    </Box>
                  )}
                  <KeyboardArrowDownIcon fontSize="small" />
                </Button>
              </Tooltip>

              <Menu
                anchorEl={anchorElUser}
                onClose={handleCloseUserMenu}
                open={Boolean(anchorElUser)}
                slotProps={{
                  paper: {
                    sx: {
                      border: "1px solid",
                      borderColor: "divider",
                      borderRadius: "8px",
                      boxShadow: isDark
                        ? "0 10px 24px rgba(0, 0, 0, 0.28)"
                        : "0 10px 24px rgba(15, 23, 42, 0.1)",
                      mt: 1,
                      minWidth: 180,
                    },
                  },
                }}
              >
                <MenuItem onClick={handleCloseUserMenu}>
                  <Typography
                    component={Link}
                    href="/dashboard/profile"
                    sx={{
                      color: "text.primary",
                      textDecoration: "none",
                      width: "100%",
                    }}
                  >
                    Profile
                  </Typography>
                </MenuItem>
                <MenuItem onClick={() => signOut()}>
                  <Typography>Logout</Typography>
                </MenuItem>
              </Menu>
            </Box>
          ) : (
            <Button
              color="primary"
              onClick={() => signIn("google")}
              sx={{ minHeight: 40, px: { xs: 1.5, sm: 2 } }}
              variant="contained"
            >
              Sign in
            </Button>
          )}
        </Toolbar>
      </Container>
    </AppBar>
  );
};

export default Header;
