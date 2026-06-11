import type { CSSProperties, ReactNode } from "react";
import type { LucideIcon } from "lucide-react";

import { ERG_ASSETS } from "@/config/seo";

type PortalMobileLoginShellCopy = {
  badge: string;
  description: string;
  mobileLabel: string;
  title: string;
  trustItems: Array<{
    caption: string;
    icon: LucideIcon;
    label: string;
  }>;
};

export function PortalMobileLoginShell({
  children,
  copy,
}: {
  children: ReactNode;
  copy: PortalMobileLoginShellCopy;
}) {
  return (
    <main style={styles.screen}>
      <div style={styles.glowTop} />
      <div style={styles.glowBottom} />
      <div style={styles.content}>
        <header style={styles.header}>
          <div style={styles.logoShell}>
            <img alt="ERG" src={ERG_ASSETS.mobileLogo} style={styles.logo} />
          </div>
          <p style={styles.appName}>ERG LMS</p>
          <p style={styles.portalName}>{copy.mobileLabel}</p>
        </header>

        <section style={styles.formSlot}>{children}</section>
      </div>
    </main>
  );
}

const styles = {
  screen: {
    background:
      "radial-gradient(circle at 50% -8%, rgba(49, 134, 246, 0.20), transparent 36%), linear-gradient(180deg, #f3f7fc 0%, #edf3fa 54%, #e8eff7 100%)",
    color: "#0f172a",
    fontFamily: "var(--font-app)",
    minHeight: "100svh",
    overflow: "hidden",
    padding:
      "calc(env(safe-area-inset-top, 0px) + 26px) 22px calc(env(safe-area-inset-bottom, 0px) + 28px)",
    position: "relative",
  },
  glowTop: {
    background: "rgba(255, 255, 255, 0.86)",
    borderRadius: 999,
    filter: "blur(22px)",
    height: 140,
    left: "50%",
    position: "absolute",
    top: 84,
    transform: "translateX(-50%)",
    width: 250,
  },
  glowBottom: {
    background: "rgba(49, 134, 246, 0.10)",
    borderRadius: 999,
    bottom: 86,
    filter: "blur(28px)",
    height: 180,
    position: "absolute",
    right: -70,
    width: 180,
  },
  content: {
    margin: "0 auto",
    maxWidth: 390,
    position: "relative",
    width: "100%",
    zIndex: 1,
  },
  header: {
    alignItems: "center",
    display: "grid",
    justifyItems: "center",
    textAlign: "center",
  },
  logoShell: {
    alignItems: "center",
    background: "rgba(255,255,255,0.82)",
    border: "1px solid rgba(49, 134, 246, 0.14)",
    borderRadius: 20,
    boxShadow: "0 18px 36px rgba(49, 134, 246, 0.16)",
    display: "inline-flex",
    height: 58,
    justifyContent: "center",
    marginBottom: 12,
    width: 58,
  },
  logo: {
    display: "block",
    height: 40,
    objectFit: "contain",
    width: 40,
  },
  appName: {
    color: "#1677e8",
    fontSize: 25,
    fontWeight: 850,
    letterSpacing: 0,
    margin: 0,
  },
  portalName: {
    color: "#8b95a5",
    fontSize: 11,
    fontWeight: 700,
    letterSpacing: 0,
    margin: "5px 0 0",
  },
  formSlot: {
    marginTop: 34,
  },
} satisfies Record<string, CSSProperties>;
