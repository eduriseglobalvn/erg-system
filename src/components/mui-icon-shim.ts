import { createElement, type ReactNode, type SVGProps } from "react";

type MuiIconShimProps = SVGProps<SVGSVGElement> & {
  fontSize?: "inherit" | "small" | "medium" | "large" | string;
  title?: string;
};

export function createMuiIconShim(displayName: string) {
  function MuiIconShim(props: MuiIconShimProps) {
    return renderIconGlyph(displayName, props);
  }

  MuiIconShim.displayName = `${displayName}Shim`;
  return MuiIconShim;
}

function renderIconSvg({ title, children, ...props }: MuiIconShimProps & { children: ReactNode }) {
  return createElement(
    "svg",
    {
      "aria-hidden": title ? undefined : true,
      fill: "none",
      height: "1em",
      role: title ? "img" : undefined,
      stroke: "currentColor",
      strokeLinecap: "round",
      strokeLinejoin: "round",
      strokeWidth: 2,
      viewBox: "0 0 24 24",
      width: "1em",
      ...props,
    },
    title ? createElement("title", null, title) : null,
    children,
  );
}

function renderIconGlyph(displayName: string, props: MuiIconShimProps) {
  const name = displayName.toLowerCase();

  if (name.includes("add") || name.includes("plus")) {
    return renderIconSvg({
      ...props,
      children: [createElement("path", { d: "M12 5v14", key: "v" }), createElement("path", { d: "M5 12h14", key: "h" })],
    });
  }

  if (name.includes("remove") || name.includes("horizontalrule")) {
    return renderIconSvg({ ...props, children: createElement("path", { d: "M5 12h14" }) });
  }

  if (name.includes("close") || name.includes("highlightoff")) {
    return renderIconSvg({
      ...props,
      children: [
        createElement("path", { d: "M18 6 6 18", key: "a" }),
        createElement("path", { d: "m6 6 12 12", key: "b" }),
      ],
    });
  }

  if (name.includes("check") || name.includes("verified")) {
    return renderIconSvg({ ...props, children: createElement("path", { d: "m5 12 4 4L19 6" }) });
  }

  if (name.includes("chevronleft") || name.includes("arrowback")) {
    return renderIconSvg({ ...props, children: createElement("path", { d: "m15 18-6-6 6-6" }) });
  }

  if (name.includes("chevronright") || name.includes("arrowforward")) {
    return renderIconSvg({
      ...props,
      children: [
        createElement("path", { d: "M5 12h14", key: "line" }),
        createElement("path", { d: "m13 6 6 6-6 6", key: "head" }),
      ],
    });
  }

  if (name.includes("arrowup")) {
    return renderIconSvg({
      ...props,
      children: [
        createElement("path", { d: "M12 19V5", key: "line" }),
        createElement("path", { d: "m6 11 6-6 6 6", key: "head" }),
      ],
    });
  }

  if (name.includes("arrowdown") || name.includes("expand") || name.includes("drop")) {
    return renderIconSvg({ ...props, children: createElement("path", { d: "m6 9 6 6 6-6" }) });
  }

  if (name.includes("search")) {
    return renderIconSvg({
      ...props,
      children: [
        createElement("circle", { cx: "11", cy: "11", r: "6", key: "circle" }),
        createElement("path", { d: "m16 16 4 4", key: "handle" }),
      ],
    });
  }

  if (name.includes("delete")) {
    return renderIconSvg({
      ...props,
      children: [
        createElement("path", { d: "M4 7h16", key: "top" }),
        createElement("path", { d: "M10 11v6", key: "left" }),
        createElement("path", { d: "M14 11v6", key: "right" }),
        createElement("path", { d: "M6 7l1 14h10l1-14", key: "bin" }),
        createElement("path", { d: "M9 7V4h6v3", key: "lid" }),
      ],
    });
  }

  if (name.includes("copy") || name.includes("contentpaste")) {
    return renderIconSvg({
      ...props,
      children: [
        createElement("rect", { height: "12", rx: "2", width: "10", x: "8", y: "8", key: "front" }),
        createElement("path", { d: "M6 16H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1", key: "back" }),
      ],
    });
  }

  if (name.includes("contentcut")) {
    return renderIconSvg({
      ...props,
      children: [
        createElement("circle", { cx: "6", cy: "6", r: "2", key: "top" }),
        createElement("circle", { cx: "6", cy: "18", r: "2", key: "bottom" }),
        createElement("path", { d: "M8 8 20 20", key: "a" }),
        createElement("path", { d: "M20 4 8 16", key: "b" }),
      ],
    });
  }

  if (name.includes("upload") || name.includes("publish")) {
    return renderIconSvg({
      ...props,
      children: [
        createElement("path", { d: "M12 16V4", key: "line" }),
        createElement("path", { d: "m6 10 6-6 6 6", key: "head" }),
        createElement("path", { d: "M4 20h16", key: "base" }),
      ],
    });
  }

  if (name.includes("download")) {
    return renderIconSvg({
      ...props,
      children: [
        createElement("path", { d: "M12 4v12", key: "line" }),
        createElement("path", { d: "m6 10 6 6 6-6", key: "head" }),
        createElement("path", { d: "M4 20h16", key: "base" }),
      ],
    });
  }

  if (name.includes("home")) {
    return renderIconSvg({
      ...props,
      children: [
        createElement("path", { d: "m3 11 9-8 9 8", key: "roof" }),
        createElement("path", { d: "M5 10v10h14V10", key: "body" }),
        createElement("path", { d: "M10 20v-6h4v6", key: "door" }),
      ],
    });
  }

  if (name.includes("account") || name.includes("group")) {
    return renderIconSvg({
      ...props,
      children: [
        createElement("circle", { cx: "12", cy: "8", r: "4", key: "head" }),
        createElement("path", { d: "M4 21a8 8 0 0 1 16 0", key: "body" }),
      ],
    });
  }

  if (name.includes("login")) {
    return renderIconSvg({
      ...props,
      children: [
        createElement("path", { d: "M10 17l5-5-5-5", key: "head" }),
        createElement("path", { d: "M15 12H3", key: "line" }),
        createElement("path", { d: "M21 3v18", key: "wall" }),
      ],
    });
  }

  if (name.includes("logout")) {
    return renderIconSvg({
      ...props,
      children: [
        createElement("path", { d: "M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4", key: "door" }),
        createElement("path", { d: "M16 17l5-5-5-5", key: "head" }),
        createElement("path", { d: "M21 12H9", key: "line" }),
      ],
    });
  }

  if (name.includes("setting") || name.includes("tune") || name.includes("palette")) {
    return renderIconSvg({
      ...props,
      children: [
        createElement("circle", { cx: "12", cy: "12", r: "3", key: "center" }),
        createElement("path", { d: "M12 2v3", key: "top" }),
        createElement("path", { d: "M12 19v3", key: "bottom" }),
        createElement("path", { d: "M2 12h3", key: "left" }),
        createElement("path", { d: "M19 12h3", key: "right" }),
        createElement("path", { d: "m4.9 4.9 2.1 2.1", key: "tl" }),
        createElement("path", { d: "m17 17 2.1 2.1", key: "br" }),
      ],
    });
  }

  if (name.includes("school") || name.includes("workspacepremium")) {
    return renderIconSvg({
      ...props,
      children: [
        createElement("path", { d: "m2 9 10-5 10 5-10 5z", key: "cap" }),
        createElement("path", { d: "M6 11.5V16c2 2 10 2 12 0v-4.5", key: "base" }),
        createElement("path", { d: "M22 9v6", key: "tassel" }),
      ],
    });
  }

  if (name.includes("book") || name.includes("spellcheck")) {
    return renderIconSvg({
      ...props,
      children: [
        createElement("path", { d: "M4 5.5A2.5 2.5 0 0 1 6.5 3H11v17H6.5A2.5 2.5 0 0 0 4 22z", key: "left" }),
        createElement("path", { d: "M20 5.5A2.5 2.5 0 0 0 17.5 3H13v17h4.5A2.5 2.5 0 0 1 20 22z", key: "right" }),
      ],
    });
  }

  if (name.includes("assignment") || name.includes("fact") || name.includes("rule") || name.includes("checklist")) {
    return renderIconSvg({
      ...props,
      children: [
        createElement("rect", { height: "16", rx: "2", width: "14", x: "5", y: "4", key: "board" }),
        createElement("path", { d: "m9 12 2 2 4-5", key: "check" }),
        createElement("path", { d: "M9 17h6", key: "line" }),
      ],
    });
  }

  if (
    name.includes("chart") ||
    name.includes("analytics") ||
    name.includes("autograph") ||
    name.includes("insight") ||
    name.includes("timeline") ||
    name.includes("trending")
  ) {
    return renderIconSvg({
      ...props,
      children: [
        createElement("path", { d: "M4 19V9", key: "a" }),
        createElement("path", { d: "M10 19V5", key: "b" }),
        createElement("path", { d: "M16 19v-7", key: "c" }),
        createElement("path", { d: "M22 19H2", key: "base" }),
      ],
    });
  }

  if (name.includes("route") || name.includes("map")) {
    return renderIconSvg({
      ...props,
      children: [
        createElement("circle", { cx: "6", cy: "18", r: "2", key: "start" }),
        createElement("circle", { cx: "18", cy: "6", r: "2", key: "end" }),
        createElement("path", { d: "M8 18h3a3 3 0 0 0 0-6h2a3 3 0 0 0 3-3V8", key: "route" }),
      ],
    });
  }

  if (name.includes("image") || name.includes("photo")) {
    return renderIconSvg({
      ...props,
      children: [
        createElement("rect", { height: "14", rx: "2", width: "18", x: "3", y: "5", key: "frame" }),
        createElement("circle", { cx: "8", cy: "10", r: "1.5", key: "sun" }),
        createElement("path", { d: "m21 16-5-5L5 22", key: "mountain" }),
      ],
    });
  }

  if (name.includes("video") || name.includes("play") || name.includes("preview") || name.includes("visibility") || name.includes("slideshow")) {
    return renderIconSvg({
      ...props,
      children: [
        createElement("path", { d: "M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z", key: "eye" }),
        createElement("path", { d: "m10 9 5 3-5 3z", key: "play" }),
      ],
    });
  }

  if (name.includes("star") || name.includes("event") || name.includes("military") || name.includes("emoji")) {
    return renderIconSvg({ ...props, children: createElement("path", { d: "m12 3 2.7 5.5 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.8 1-6.1-4.4-4.3 6.1-.9z" }) });
  }

  if (name.includes("warning")) {
    return renderIconSvg({
      ...props,
      children: [
        createElement("path", { d: "M12 3 2 21h20z", key: "shape" }),
        createElement("path", { d: "M12 9v5", key: "line" }),
        createElement("path", { d: "M12 17h.01", key: "dot" }),
      ],
    });
  }

  if (name.includes("notification") || name.includes("bell")) {
    return renderIconSvg({
      ...props,
      children: [
        createElement("path", { d: "M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9", key: "bell" }),
        createElement("path", { d: "M10 21h4", key: "base" }),
      ],
    });
  }

  if (name.includes("lock")) {
    return renderIconSvg({
      ...props,
      children: [
        createElement("rect", { height: "11", rx: "2", width: "16", x: "4", y: "10", key: "body" }),
        createElement("path", { d: "M8 10V7a4 4 0 0 1 8 0v3", key: "shackle" }),
      ],
    });
  }

  if (name.includes("table")) {
    return renderIconSvg({
      ...props,
      children: [
        createElement("rect", { height: "16", rx: "2", width: "18", x: "3", y: "4", key: "frame" }),
        createElement("path", { d: "M3 10h18", key: "row1" }),
        createElement("path", { d: "M3 15h18", key: "row2" }),
      ],
    });
  }

  if (name.includes("format") || name.includes("text") || name.includes("subscript") || name.includes("superscript")) {
    return renderIconSvg({
      ...props,
      children: [
        createElement("path", { d: "M4 6h16", key: "top" }),
        createElement("path", { d: "M12 6v12", key: "stem" }),
        createElement("path", { d: "M8 18h8", key: "base" }),
      ],
    });
  }

  if (name.includes("audio")) {
    return renderIconSvg({
      ...props,
      children: [
        createElement("path", { d: "M9 18V5l12-2v13", key: "bar" }),
        createElement("circle", { cx: "6", cy: "18", r: "3", key: "left" }),
        createElement("circle", { cx: "18", cy: "16", r: "3", key: "right" }),
      ],
    });
  }

  return renderIconSvg({
    ...props,
    children: [
      createElement("rect", { height: "16", rx: "3", width: "16", x: "4", y: "4", key: "frame" }),
      createElement("path", { d: "M8 12h8", key: "h" }),
      createElement("path", { d: "M12 8v8", key: "v" }),
    ],
  });
}
