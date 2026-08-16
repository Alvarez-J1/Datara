"use client";

import scss from "./Footer.module.scss";
import { Button, Paper } from "@mui/material";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { clearDemoMode, useDemoMode } from "@/lib/demoMode";
import { removeAuthToken, useHasAuthToken } from "@/lib/api/client";

const Footer = () => {
  const isDemoMode = useDemoMode();
  const hasAuthToken = useHasAuthToken();
  const router = useRouter();
  const hasWorkspaceAccess = isDemoMode || hasAuthToken;

  const handleAuthAction = () => {
    if (hasWorkspaceAccess) {
      clearDemoMode();
      removeAuthToken();
      // Hard redirect so the signed-in page is fully torn down and the
      // browser's Back button can't restore it after logout.
      window.location.href = "/auth/signin";
      return;
    }

    router.push("/auth/signin");
  };

  return (
    <footer className={scss.footer}>
      <Paper
        sx={{
          backgroundColor: "background.paper",
          border: "1px solid",
          borderColor: "divider",
          borderRadius: "8px",
          p: { xs: 1.5, sm: 2 },
          width: "100%",
        }}
      >
        <nav aria-label="Footer navigation">
          <ul className={scss.footerList}>
            <li>
              <Link href="/dashboard" prefetch={false}>Home</Link>
            </li>
            <li>
              <Link href="/dashboard/data" prefetch={false}>Data</Link>
            </li>
            <li>
              <Link href="/dashboard/profile" prefetch={false}>Profile</Link>
            </li>
            <li>
              <Link href="/dashboard/settings" prefetch={false}>Settings</Link>
            </li>
            <li>
              <span>Terms & Conditions</span>
            </li>
            <li>
              <span>Accessibility statement</span>
            </li>
            <li>
              <Button
                aria-label={hasWorkspaceAccess ? "Sign out of Datara" : "Sign in to Datara"}
                color={hasWorkspaceAccess ? "error" : "success"}
                onClick={handleAuthAction}
                variant="text"
              >
                {hasWorkspaceAccess ? "Sign Out" : "Sign In"}
              </Button>
            </li>
          </ul>
        </nav>
      </Paper>
    </footer>
  );
};

export default Footer;
