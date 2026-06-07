import type { ReactNode } from "react";
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
    <main
      style={{
        background: "var(--erg-bg)",
        color: "#0f172a",
        fontFamily: "var(--font-app)",
        minHeight: "100svh",
        padding: "calc(env(safe-area-inset-top, 0px) + 16px) 16px calc(env(safe-area-inset-bottom, 0px) + 24px)",
      }}
    >
      <div
        style={{
          margin: "0 auto",
          maxWidth: 400,
          width: "100%",
        }}
      >
        <section
          style={{
            background: "var(--erg-blue)",
            borderRadius: 8,
            boxShadow: "0 1px 2px rgba(0,0,0,0.08)",
            color: "#ffffff",
            overflow: "hidden",
            padding: "20px",
          }}
        >
          <div
            style={{
              alignItems: "center",
              display: "flex",
              gap: 12,
            }}
          >
            <img
              alt="ERG"
              src={ERG_ASSETS.logo}
              style={{
                backgroundColor: "#ffffff",
                borderRadius: 8,
                boxShadow: "0 1px 2px rgba(0,0,0,0.08)",
                display: "block",
                height: 48,
                objectFit: "contain",
                padding: "8px 10px",
                width: "auto",
              }}
            />
            <div style={{ minWidth: 0 }}>
              <p
                style={{
                  color: "rgba(255,255,255,0.72)",
                  fontSize: 10,
                  fontWeight: 600,
                  letterSpacing: 0,
                  margin: 0,
                  textTransform: "none",
                }}
              >
                {copy.badge}
              </p>
              <p
                style={{
                  color: "#ffffff",
                  fontSize: 14,
                  fontWeight: 600,
                  lineHeight: 1.35,
                  margin: "4px 0 0",
                }}
              >
                {copy.mobileLabel}
              </p>
            </div>
          </div>

          <h1
            style={{
              color: "#ffffff",
              fontSize: 22,
              fontWeight: 600,
              letterSpacing: 0,
              lineHeight: 1.2,
              margin: "20px 0 0",
            }}
          >
            {copy.title}
          </h1>
          <p
            style={{
              color: "rgba(255,255,255,0.82)",
              fontSize: 14,
              lineHeight: 1.7,
              margin: "12px 0 0",
            }}
          >
            {copy.description}
          </p>

          <div
            style={{
              display: "flex",
              gap: 8,
              marginTop: 20,
              overflowX: "auto",
              paddingBottom: 4,
            }}
          >
            {copy.trustItems.slice(0, 3).map((item) => {
              const Icon = item.icon;

              return (
                <div
                  key={item.label}
                  style={{
                    backdropFilter: "blur(12px)",
                    backgroundColor: "rgba(255,255,255,0.10)",
                    border: "1px solid rgba(255,255,255,0.12)",
                    borderRadius: 8,
                    minWidth: 128,
                    padding: "12px",
                  }}
                >
                  <Icon color="#ffffff" size={16} />
                  <p
                    style={{
                      color: "rgba(255,255,255,0.92)",
                      fontSize: 11,
                      fontWeight: 600,
                      letterSpacing: 0,
                      lineHeight: 1.4,
                      margin: "12px 0 0",
                      textTransform: "none",
                    }}
                  >
                    {item.label}
                  </p>
                  <p
                    style={{
                      color: "rgba(255,255,255,0.7)",
                      fontSize: 12,
                      lineHeight: 1.55,
                      margin: "4px 0 0",
                    }}
                  >
                    {item.caption}
                  </p>
                </div>
              );
            })}
          </div>
        </section>

        <section style={{ marginTop: 16 }}>{children}</section>
      </div>
    </main>
  );
}
