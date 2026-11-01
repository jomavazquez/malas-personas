// scripts/prerender.mjs
// Writes an HTML copy, with the content already rendered, of every public page so that search
// engines and AI crawlers can read it without running JavaScript.
// Starts `vite preview` on dist/, opens each route with Playwright (in English) and writes
// dist/prerender/<name>.html. dist/index.html is left untouched: it stays the empty shell that
// nginx serves as the fallback for every other route (rooms, games, account, 404).
// In the browser, App.tsx (PrerenderSwap) removes the prerendered content once React has
// painted the real page.
// Usage: node scripts/prerender.mjs   (skipped with SKIP_PRERENDER=1)

import { readFile, writeFile, mkdir } from "node:fs/promises";
import { join } from "node:path";
import { preview } from "vite";
import { chromium } from "@playwright/test";

const DIST = "dist";

// Route -> file name in dist/prerender/. Must match the nginx rules.
const ROUTES = {
  "/": "home",
  "/help-center": "help-center",
  "/team-ideas": "team-ideas",
  "/contact": "contact",
  "/legal-notice": "legal-notice",
  "/privacy-policy": "privacy-policy",
  "/cookies-policy": "cookies-policy",
};

if( process.env.SKIP_PRERENDER === "1" ){
  console.log("Prerender: skipped (SKIP_PRERENDER=1)");
  process.exit(0);
}

const shell = await readFile(join(DIST, "index.html"), "utf8");
if( !shell.includes('<div id="root"></div>') ){
  throw new Error('Prerender: dist/index.html does not contain <div id="root"></div>');
}

// Use the installed Chrome if there is one; otherwise Playwright's Chromium.
const launchBrowser = async () => {
  try {
    return await chromium.launch({ channel: "chrome" });
  } catch {
    return await chromium.launch();
  }
};

const server = await preview({ preview: { port: 4180 }, logLevel: "error" });
const baseUrl = server.resolvedUrls.local[0].replace(/\/$/, "");
const browser = await launchBrowser();

try {
  const page = await browser.newPage({ locale: "en-US" });
  await mkdir(join(DIST, "prerender"), { recursive: true });

  for( const [route, name] of Object.entries(ROUTES) ){
    await page.goto(`${baseUrl}${route}`, { waitUntil: "load" });
    // Every public page has an H1: it's the signal that the real page has been painted
    await page.waitForSelector("#root h1", { state: "attached", timeout: 15000 });
    await page.evaluate(() => document.fonts.ready);
    await page.waitForTimeout(300);

    const { content, canonical } = await page.evaluate(() => ({
      content: document.getElementById("root").innerHTML,
      canonical: document.querySelector('link[rel="canonical"]')?.getAttribute("href") ?? "",
    }));

    // React puts the canonical link in <head>; copy it marked so PrerenderSwap removes it once
    // React adds its own and there aren't two.
    const head = canonical ? `<link rel="canonical" href="${canonical}" data-prerender />\n  </head>` : "</head>";
    // "inert": the content can be seen and read but not used until React replaces it
    // (e.g. so the contact form can't be submitted via GET with the data in the URL).
    const html = shell
      .replace('<div id="root"></div>', `<div id="prerender" inert>${content}</div><div id="root"></div>`)
      .replace("</head>", head);

    await writeFile(join(DIST, "prerender", `${name}.html`), html);
  }

  console.log(`Prerender: ${Object.keys(ROUTES).length} pages written to ${DIST}/prerender/`);
} finally {
  await browser.close();
  server.httpServer.close();
}
