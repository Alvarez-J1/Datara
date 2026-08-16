"use client";

import * as React from "react";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import EqualizerIcon from "@mui/icons-material/Equalizer";
import ExitToAppIcon from "@mui/icons-material/ExitToApp";
import HomeIcon from "@mui/icons-material/Home";
import Person2Icon from "@mui/icons-material/Person2";
import SettingsIcon from "@mui/icons-material/Settings";
import Box from "@mui/material/Box";
import Divider from "@mui/material/Divider";
import MuiDrawer from "@mui/material/Drawer";
import IconButton from "@mui/material/IconButton";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import { alpha, useTheme } from "@mui/material/styles";
import { removeAuthToken } from "@/lib/api/client";
import { clearDemoMode } from "@/lib/demoMode";
import Link from "next/link";
import { usePathname } from "next/navigation";
import scss from "./SideMenu.module.scss";

const drawerWidth = 248;
const closedWidth = 72;

const navigationItems = [
  { href: "/dashboard", icon: <HomeIcon aria-hidden="true" />, label: "Overview" },
  { href: "/dashboard/data", icon: <EqualizerIcon aria-hidden="true" />, label: "Data" },
  { href: "/dashboard/profile", icon: <Person2Icon aria-hidden="true" />, label: "Profile" },
  { href: "/dashboard/settings", icon: <SettingsIcon aria-hidden="true" />, label: "Settings" },
];

const isActiveRoute = (pathname: string | null, href: string) => {
  if (!pathname) return false;
  if (href === "/dashboard") return pathname === "/dashboard";
  return pathname.startsWith(href);
};

export default function SideMenu() {
  const theme = useTheme();
  const pathname = usePathname();
  const [open, setOpen] = React.useState(false);
  const drawerSize = open ? drawerWidth : closedWidth;

  const handleDrawerToggle = () => {
    setOpen((current) => !current);
  };

  // Hard redirect so the signed-in page is fully torn down and the browser's
  // Back button can't restore it after logout.
  const handleSignOut = () => {
    clearDemoMode();
    removeAuthToken();
    window.location.href = "/auth/signin";
  };

  return (
    <MuiDrawer
      anchor="left"
      open={open}
      sx={{
        boxSizing: "border-box",
        flexShrink: 0,
        whiteSpace: "nowrap",
        width: drawerSize,
        "& .MuiDrawer-paper": {
          backgroundColor: "background.paper",
          borderRight: "1px solid",
          borderColor: "divider",
          boxSizing: "border-box",
          height: { xs: "calc(100% - 58px)", sm: "calc(100% - 66px)" },
          left: 0,
          overflowX: "hidden",
          px: 1,
          py: 1.25,
          top: { xs: "58px", sm: "66px" },
          transition: theme.transitions.create("width", {
            duration: theme.transitions.duration.shorter,
            easing: theme.transitions.easing.easeInOut,
          }),
          width: drawerSize,
        },
      }}
      variant="permanent"
    >
      <div className={scss.drawerHeader}>
        {open && (
          <Typography className={scss.workspaceLabel}>Workspace</Typography>
        )}
        <Tooltip title={open ? "Collapse navigation" : "Expand navigation"}>
          <IconButton
            aria-expanded={open}
            aria-label={open ? "Collapse navigation" : "Expand navigation"}
            onClick={handleDrawerToggle}
            size="small"
          >
            {open ? <ChevronLeftIcon /> : <ChevronRightIcon />}
          </IconButton>
        </Tooltip>
      </div>

      <Divider sx={{ my: 1 }} />

      <List className={scss.navList} component="nav" aria-label="Dashboard navigation">
        {navigationItems.map((item) => {
          const selected = isActiveRoute(pathname, item.href);

          return (
            <ListItem key={item.label} disablePadding sx={{ display: "block" }}>
              <Tooltip title={open ? "" : item.label} placement="right">
                <ListItemButton
                  aria-current={selected ? "page" : undefined}
                  component={Link}
                  href={item.href}
                  prefetch={false}
                  selected={selected}
                  sx={{
                    borderRadius: "8px",
                    color: selected ? "text.primary" : "text.secondary",
                    justifyContent: open ? "initial" : "center",
                    minHeight: 44,
                    my: 0.35,
                    px: open ? 1.5 : 1,
                    position: "relative",
                    transition:
                      "background-color 160ms ease, color 160ms ease, transform 160ms ease",
                    "&.Mui-selected": {
                      backgroundColor: alpha(theme.palette.secondary.main, theme.palette.mode === "dark" ? 0.12 : 0.08),
                    },
                    "&.Mui-selected::before": {
                      backgroundColor: "secondary.main",
                      borderRadius: "999px",
                      content: '""',
                      height: 24,
                      left: 4,
                      position: "absolute",
                      width: 3,
                    },
                    "&.Mui-selected:hover": {
                      backgroundColor: alpha(theme.palette.secondary.main, theme.palette.mode === "dark" ? 0.16 : 0.11),
                    },
                    "&:hover": {
                      backgroundColor: alpha(theme.palette.text.primary, theme.palette.mode === "dark" ? 0.08 : 0.05),
                      color: "text.primary",
                      transform: "translateX(1px)",
                    },
                  }}
                >
                  <ListItemIcon
                    sx={{
                      "& .MuiSvgIcon-root": {
                        fontSize: 28,
                      },
                      color: "inherit",
                      justifyContent: "center",
                      minWidth: 0,
                      mr: open ? 1.5 : 0,
                    }}
                  >
                    {item.icon}
                  </ListItemIcon>

                  <ListItemText
                    primary={
                      <Typography sx={{ fontSize: "0.9rem", fontWeight: selected ? 720 : 640 }}>
                        {item.label}
                      </Typography>
                    }
                    sx={{
                      flex: open ? "1 1 auto" : "0 0 0",
                      minWidth: 0,
                      opacity: open ? 1 : 0,
                      overflow: "hidden",
                      width: open ? "auto" : 0,
                    }}
                  />
                </ListItemButton>
              </Tooltip>
            </ListItem>
          );
        })}
      </List>

      <Box sx={{ mt: "auto" }}>
        <Divider sx={{ my: 1 }} />
        <Tooltip title={open ? "" : "Sign out"} placement="right">
          <ListItemButton
            aria-label="Sign out"
            onClick={handleSignOut}
            sx={{
              borderRadius: "8px",
              color: "text.secondary",
              justifyContent: open ? "initial" : "center",
              minHeight: 44,
              px: open ? 1.5 : 1,
              "&:hover": {
                backgroundColor: alpha(theme.palette.error.main, theme.palette.mode === "dark" ? 0.16 : 0.09),
                color: "error.main",
              },
            }}
          >
            <ListItemIcon
              sx={{
                "& .MuiSvgIcon-root": {
                  fontSize: 28,
                },
                color: "inherit",
                justifyContent: "center",
                minWidth: 0,
                mr: open ? 1.5 : 0,
              }}
            >
              <ExitToAppIcon />
            </ListItemIcon>
            <ListItemText
              primary={
                <Typography sx={{ fontSize: "0.9rem", fontWeight: 650 }}>
                  Sign out
                </Typography>
              }
              sx={{
                flex: open ? "1 1 auto" : "0 0 0",
                minWidth: 0,
                opacity: open ? 1 : 0,
                overflow: "hidden",
                width: open ? "auto" : 0,
              }}
            />
          </ListItemButton>
        </Tooltip>
      </Box>
    </MuiDrawer>
  );
}
