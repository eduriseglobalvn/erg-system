import type { CSSProperties, ElementType, ReactNode } from "react";

import { ERG_ASSETS } from "@/config/seo";

type PortalMobileLoginShellCopy = {
  badge: string;
  description: string;
  mobileLabel: string;
  title: string;
  trustItems: Array<{
    caption: string;
    icon: ElementType;
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
          <img alt="ERG" src={ERG_ASSETS.logo} style={styles.logo} />
        </header>

        <section style={styles.formSlot}>{children}</section>
      </div>
    </main>
  );
}

const styles = {
  screen: {
    background:
      "linear-gradient(rgba(255,255,255,0.10), rgba(255,255,255,0.10)), url('https://media.erg.edu.vn/logo/bg.jpg') center / cover no-repeat",
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
  logo: {
    display: "block",
    filter: "drop-shadow(0 12px 26px rgba(72, 81, 156, 0.16))",
    height: "auto",
    objectFit: "contain",
    width: 112,
  },
  formSlot: {
    marginTop: 34,
  },
} satisfies Record<string, CSSProperties>;
