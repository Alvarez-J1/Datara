"use client";

import scss from "./Footer.module.scss";
import { signIn, signOut, useSession } from "next-auth/react";
import { Button, Paper } from "@mui/material";
import Link from "next/link";

const Footer = () => {
  const { data: session } = useSession();

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
        <ul className={scss.footerList}>
          <li>
            <Link  href="/dashboard">Home</Link>
          </li>
          <li>
            <Link href="/dashboard/data">Data</Link>
          </li>
          <li>
            <Link href="/dashboard/profile">Profile</Link>
          </li>
          <li>
            <Link href="/dashboard/settings">Settings</Link>
          </li>
          <li>
            <Link
          href="#"
        onClick={(e) => e.preventDefault()}>Terms & Conditions</Link>
          </li>
          <li>
           <Link
          href="#"
        onClick={(e) => e.preventDefault()}
        >
  Accessibility statement
</Link>
          </li>
          <li>
            <Button
              variant="text"
              color={session ? "error" : "success"}
              onClick={() => (session ? signOut() : signIn())}
            >
              {session ? "Sign Out" : "Sign In"}
            </Button>
          </li>
        </ul>
      </Paper>
    </footer>
  );
};

export default Footer;
