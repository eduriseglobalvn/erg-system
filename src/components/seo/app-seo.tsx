import { useEffect } from "react";
import { useLocation } from "@tanstack/react-router";

import { ERG_ASSETS, formatPageTitle, getSeoForLocation } from "@/config/seo";

function upsertMeta(selector: string, attributes: Record<string, string>) {
  let element = document.head.querySelector<HTMLMetaElement>(selector);

  if (!element) {
    element = document.createElement("meta");
    document.head.appendChild(element);
  }

  Object.entries(attributes).forEach(([key, value]) => {
    element?.setAttribute(key, value);
  });
}

function upsertLink(rel: string, href: string, attributes: Record<string, string> = {}) {
  let element = document.head.querySelector<HTMLLinkElement>(`link[rel="${rel}"]`);

  if (!element) {
    element = document.createElement("link");
    element.rel = rel;
    document.head.appendChild(element);
  }

  element.href = href;
  Object.entries(attributes).forEach(([key, value]) => {
    element?.setAttribute(key, value);
  });
}

/** Tab title for a page whose views switch without changing the URL (the student portal). */
export function usePageTitle(page: string) {
  useEffect(() => {
    document.title = formatPageTitle(page);
  }, [page]);
}

export function AppSeo() {
  const location = useLocation();

  useEffect(() => {
    const seo = getSeoForLocation(location.pathname);
    // No query string: it can carry a post-login redirect target, and one page must have one address.
    const url = `${window.location.origin}${location.pathname}`;

    document.documentElement.lang = "vi";
    document.title = seo.title;

    upsertMeta('meta[name="description"]', { name: "description", content: seo.description });
    upsertMeta('meta[name="keywords"]', { name: "keywords", content: seo.keywords.join(", ") });
    upsertMeta('meta[name="robots"]', { name: "robots", content: seo.indexable ? "index, follow" : "noindex, nofollow" });
    upsertMeta('meta[property="og:type"]', { property: "og:type", content: "website" });
    upsertMeta('meta[property="og:locale"]', { property: "og:locale", content: "vi_VN" });
    upsertMeta('meta[property="og:url"]', { property: "og:url", content: url });
    upsertMeta('meta[property="og:site_name"]', { property: "og:site_name", content: "Edurise Global" });
    upsertMeta('meta[property="og:title"]', { property: "og:title", content: seo.title });
    upsertMeta('meta[property="og:description"]', { property: "og:description", content: seo.description });
    upsertMeta('meta[property="og:image"]', { property: "og:image", content: seo.ogImage });
    upsertMeta('meta[property="og:image:alt"]', { property: "og:image:alt", content: seo.ogImageAlt });
    upsertMeta('meta[name="twitter:card"]', { name: "twitter:card", content: "summary_large_image" });
    upsertMeta('meta[name="twitter:title"]', { name: "twitter:title", content: seo.title });
    upsertMeta('meta[name="twitter:description"]', { name: "twitter:description", content: seo.description });
    upsertMeta('meta[name="twitter:image"]', { name: "twitter:image", content: seo.ogImage });

    upsertLink("canonical", url);
    upsertLink("icon", ERG_ASSETS.favicon, { type: "image/png", sizes: "32x32" });
    upsertLink("shortcut icon", ERG_ASSETS.favicon, { type: "image/png" });
    upsertLink("apple-touch-icon", ERG_ASSETS.appleTouchIcon, { sizes: "180x180" });
  }, [location.pathname]);

  return null;
}
