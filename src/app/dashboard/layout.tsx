"use client";

import SideMenu from "@/components/SideMenu/SideMenu";
import { useHasAuthToken } from "@/lib/api/client";
import { useDemoMode } from "@/lib/demoMode";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const isDemoMode = useDemoMode();
  const hasAuthToken = useHasAuthToken();

  return (
    <>
      <main
        style={{
          minHeight: "100vh",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          boxSizing: "border-box",
        }}
      >
        <div
          style={{
            flex: 1,
            width: "100%",
            minWidth: 0,
            boxSizing: "border-box",
          }}
        >
          {children}
        </div>
      </main>
      {/* Permanent drawer is position:fixed; keeping it out of main avoids flex sizing quirks. */}
      {(isDemoMode || hasAuthToken) && <SideMenu />}
    </>
  );
}
