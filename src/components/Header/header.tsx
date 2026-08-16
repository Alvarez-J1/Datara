"use client";

import { ColorModeContext } from "@/app/providers";
import DataraLogo from "@/components/Brand/DataraLogo";
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
import { clearDemoMode, useDemoMode } from "@/lib/demoMode";
import { removeAuthToken, useAuthUser, useHasAuthToken } from "@/lib/api/client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import * as React from "react";
import { useContext } from "react";

const getPageLabel = (pathname: string | null) => {
  if (!pathname || pathname === "/dashboard") return "Overview";

  const label = pathname.split("/").filter(Boolean).pop() ?? "Overview";
  if (label === "signin") return "Sign in";

  return label.charAt(0).toUpperCase() + label.slice(1);
};

const Header = () => {
  const isDemoMode = useDemoMode();
  const hasAuthToken = useHasAuthToken();
  const authUser = useAuthUser();
  const pathname = usePathname();
  const tabletCheck = useMediaQuery("(min-width:768px)");
  const colorMode = useContext(ColorModeContext);
  const [anchorElUser, setAnchorElUser] = React.useState<null | HTMLElement>(null);
  const pageLabel = getPageLabel(pathname);
  const isDark = colorMode.resolvedMode === "dark";
  const hasWorkspaceAccess = isDemoMode || hasAuthToken;
  const displayName = (isDemoMode ? "Demo Workspace" : authUser?.name) ?? "Demo Workspace";
  const displayEmail =
    (isDemoMode ? "Sample business analytics" : authUser?.email) ??
    "Sample business analytics";
  const userMenuButtonId = "header-user-menu-button";
  const userMenuId = "header-user-menu";

  const handleOpenUserMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorElUser(event.currentTarget);
  };

  const handleCloseUserMenu = () => {
    setAnchorElUser(null);
  };

  // A hard redirect (not router.push) so the signed-in page is fully torn
  // down and can't be restored by the browser's Back button after logout.
  const handleExitDemo = () => {
    clearDemoMode();
    removeAuthToken();
    handleCloseUserMenu();
    window.location.href = "/auth/signin";
  };

  const handleCredentialsLogout = () => {
    removeAuthToken();
    handleCloseUserMenu();
    window.location.href = "/auth/signin";
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
            prefetch={false}
            sx={{
              alignItems: "center",
              color: "inherit",
              display: "flex",
              minWidth: 0,
              textDecoration: "none",
            }}
          >
            <DataraLogo
              alt="Datara dashboard"
              variant="responsive"
              sx={{
                height: 34,
                maxWidth: { xs: 34, sm: 148 },
              }}
            />
          </Box>

          {hasWorkspaceAccess && tabletCheck && (
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
              aria-hidden="true"
              fontSize="small"
              sx={{ color: isDark ? "text.disabled" : "warning.main" }}
            />
            <Switch
              checked={isDark}
              disabled={colorMode.isSavingTheme}
              onChange={colorMode.toggleColorMode}
              slotProps={{
                input: {
                  "aria-label": isDark ? "Switch to light mode" : "Switch to dark mode",
                },
              }}
              size="small"
            />
            <DarkModeIcon
              aria-hidden="true"
              fontSize="small"
              sx={{ color: isDark ? "secondary.main" : "text.disabled" }}
            />
          </Box>

          {hasWorkspaceAccess ? (
            <Box sx={{ flexGrow: 0 }}>
              <Tooltip title="Open profile settings">
                <Button
                  aria-controls={anchorElUser ? userMenuId : undefined}
                  aria-expanded={anchorElUser ? "true" : undefined}
                  aria-haspopup="menu"
                  aria-label="Open profile menu"
                  id={userMenuButtonId}
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
                  <Avatar alt={displayName} sx={{ height: 30, width: 30 }} />
                  {tabletCheck && (
                    <Box sx={{ minWidth: 0, textAlign: "left" }}>
                      <Typography
                        noWrap
                        sx={{ fontSize: "0.78rem", fontWeight: 720, lineHeight: 1.2 }}
                      >
                        {displayName}
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
                        {displayEmail}
                      </Typography>
                    </Box>
                  )}
                  <KeyboardArrowDownIcon fontSize="small" />
                </Button>
              </Tooltip>

              <Menu
                anchorEl={anchorElUser}
                id={userMenuId}
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
                <MenuItem
                  component={Link}
                  href="/dashboard/profile"
                  onClick={handleCloseUserMenu}
                  prefetch={false}
                  sx={{
                    color: "text.primary",
                    textDecoration: "none",
                  }}
                >
                  Profile
                </MenuItem>
                <MenuItem onClick={isDemoMode ? handleExitDemo : handleCredentialsLogout}>
                  <Typography>{isDemoMode ? "Exit demo" : "Logout"}</Typography>
                </MenuItem>
              </Menu>
            </Box>
          ) : (
            <Button
              color="primary"
              component={Link}
              href="/auth/signin"
              prefetch={false}
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
