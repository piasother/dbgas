// DB Gas — server-side SEO layer.
// Search engines get a real page per URL (title, description, canonical, schema,
// readable text) instead of an empty <div id="root">. The React app still loads
// and takes over exactly as before.
//
// Settings (optional, in cPanel > Setup Node.js App > Environment variables):
//   SITE_URL  e.g. https://www.dbgas.co.zw   (default http://www.dbgas.co.zw —
//             switch to https once the SSL certificate is active)

import type { Express, Request, Response, NextFunction } from "express";
import fs from "fs";
import path from "path";

const SITE_URL = (process.env.SITE_URL || "https://www.dbgas.co.zw").replace(/\/+$/, "");

const BUSINESS = {
  name: "DB Gas",
  legalName: "DREWBULLE Supplies (Pvt) Ltd",
  phone: "+263713314920",
  phoneDisplay: "071 331 4920",
  email: "accounts@drewbulle.co.zw",
  street: "Stand 15002, Donnington West",
  city: "Bulawayo",
  country: "ZW",
};

const LOCATIONS = [
  { name: "DB Gas Head Office (Wholesale & Retail LPG Sales)", street: "Stand 15002, Donnington West", hours: "Mon–Fri 8am–6pm, Sun 8am–1pm, closed Saturday", sunday: true },
  { name: "DB Gas Retail LPG Sales, Glengarry", street: "16a Glengarry, Harare Road", hours: "Mon–Fri 8am–6pm, Sun 8am–1pm, closed Saturday", sunday: true },
  { name: "DB Gas Accessories, Reticulation & Delivery Bookings (Drew Bulle (Pvt) Ltd)", street: "Unit H23, ZITF, Hillside Road", hours: "Mon–Fri 8am–6pm, closed Saturday and Sunday", sunday: false },
];

interface SeoPage {
  path: string;
  title: string;
  description: string;
  h1: string;
  intro?: string;
  sections?: [string, string][];
  service?: string;
  index: boolean;
  priority?: string;
}

const PAGES: SeoPage[] = [
  {
    path: "/",
    title: "LPG Gas Refills & Delivery in Bulawayo | DB Gas Zimbabwe",
    description:
      "DB Gas sells LPG in Bulawayo: 9kg, 19kg and 48kg cylinder refills, wholesale bulk gas, gas installations and delivery. ZERA licensed. Call 071 331 4920.",
    h1: "LPG Gas Refills, Wholesale & Installations in Bulawayo",
    intro:
      "DB Gas is a ZERA-licensed LPG supplier based in Donnington West, Bulawayo. We refill 9kg, 19kg and 48kg gas cylinders, supply bulk LPG to businesses, and install gas systems for homes, restaurants, lodges, schools and farms across Zimbabwe.",
    sections: [
      ["Gas cylinder refills", "Quick refills for 9kg, 19kg and 48kg LPG cylinders, sold by the kilogram from our Bulawayo depot."],
      ["Wholesale LPG supply", "Bulk LPG for retailers, hotels, institutions and industry, delivered by our own tankers."],
      ["Gas installations", "Professional LPG tank and pipework installations and pressure testing for commercial and residential properties."],
      ["Gas reticulation", "Piped LPG systems designed, installed and pressure tested by DB Gas. Completed projects include Cresta Hotel, Kings City, Padel Bulawayo, NUST Main Campus, NUST Town Campus and household installations across Bulawayo."],
      ["Safety & compliance", "ZERA compliance support and safety audits for businesses using LPG."],
      ["Who we supply", "Bakeries and restaurants, lodges and hotels, schools and hospitals, dairy and poultry farms, and households across Bulawayo."],
    ],
    index: true,
    priority: "1.0",
  },
  {
    path: "/gas-reticulation",
    title: "LPG Gas Reticulation & Piping Installation in Bulawayo | DB Gas",
    description:
      "DB Gas designs and installs LPG gas reticulation in Bulawayo and Zimbabwe for hotels, universities, sports venues and homes. Bulk tanks, pipework, pressure testing, ZERA compliant. Call 071 331 4920.",
    h1: "Gas Reticulation & Piping Installation in Bulawayo",
    intro:
      "DB Gas designs, installs and pressure tests LPG gas reticulation systems for hotels, universities, sports venues, restaurants and homes across Bulawayo and Zimbabwe, piping gas safely from a central tank or cylinder bank to every point of use.",
    sections: [
      ["Completed reticulation projects", "Cresta Hotel, Kings City, Padel Bulawayo, NUST Main Campus, NUST Town Campus, and household installations across Bulawayo."],
      ["What's included", "Site visit and design, bulk tanks and cylinder manifolds, regulators and meters, copper and steel pipework, leak and pressure testing, ZERA and Bulawayo City Council compliance support, and ongoing gas supply and maintenance."],
      ["Who it's for", "Commercial kitchens in hotels, lodges and restaurants; university laboratories; sports and leisure venues; and homes."],
    ],
    service: "LPG gas reticulation and piping installation",
    index: true,
    priority: "0.9",
  },
  {
    path: "/inventory",
    title: "Buy LPG Gas Cylinders & Accessories Online | DB Gas Bulawayo",
    description:
      "Order LPG gas refills, cylinders, regulators and hoses online from DB Gas Bulawayo. Pay online and collect in Bulawayo or get it delivered.",
    h1: "LPG Cylinders, Refills & Gas Accessories",
    intro:
      "Browse DB Gas products: 9kg, 19kg and 48kg LPG refills, gas cylinders, regulators, hoses and fittings. Order online for collection or delivery in Bulawayo.",
    index: true,
    priority: "0.9",
  },
  {
    path: "/installation-guide",
    title: "LPG Gas Installation Guide & Requirements | DB Gas Zimbabwe",
    description:
      "What you need for a safe, compliant LPG gas installation in Zimbabwe: ZERA and Bulawayo City Council requirements, tank placement and professional installation by DB Gas.",
    h1: "LPG Gas Installation Guide",
    intro:
      "Planning a gas installation for your home or business? This guide covers ZERA and Bulawayo City Council requirements, tank and cylinder placement, and how DB Gas handles professional installation and pressure testing.",
    index: true,
    priority: "0.8",
  },
  {
    path: "/safety-guide",
    title: "LPG Gas Safety Tips: Leaks, Storage & Emergencies | DB Gas",
    description:
      "How to use LPG gas safely at home and at work: detecting leaks, what to do in an emergency, and safe cylinder handling. Advice from DB Gas Bulawayo.",
    h1: "LPG Gas Safety Guide",
    intro:
      "Practical LPG safety advice from DB Gas: how to spot and handle a gas leak, safe cylinder handling, and what to do in an emergency.",
    index: true,
    priority: "0.7",
  },
  {
    path: "/storage-checklist",
    title: "LPG Cylinder Storage Checklist | DB Gas Zimbabwe",
    description:
      "A simple checklist for storing LPG gas cylinders safely at home or on business premises: ventilation, distances, upright storage and inspections.",
    h1: "LPG Cylinder Storage Checklist",
    intro:
      "Use this checklist to store LPG gas cylinders safely: keep them upright, outdoors or well ventilated, away from drains and ignition sources, and inspected regularly.",
    index: true,
    priority: "0.6",
  },
  // Private pages: served normally but never indexed
  { path: "/account", title: "My Account | DB Gas", description: "Your DB Gas account.", h1: "My Account", index: false },
  { path: "/checkout", title: "Checkout | DB Gas", description: "Complete your DB Gas order.", h1: "Checkout", index: false },
  { path: "/admin", title: "Admin | DB Gas", description: "DB Gas admin.", h1: "Admin", index: false },
  { path: "/login", title: "Sign in | DB Gas", description: "Sign in to your DB Gas account.", h1: "Sign in", index: false },
  { path: "/reset-password", title: "Reset password | DB Gas", description: "Reset your DB Gas password.", h1: "Reset password", index: false },
];

const NOT_FOUND: SeoPage = {
  path: "", title: "Page not found | DB Gas", description: "This page could not be found.", h1: "Page not found", index: false };

const esc = (s: unknown) =>
  String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

function localBusinessSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    "@id": SITE_URL + "/#business",
    name: BUSINESS.name,
    legalName: BUSINESS.legalName,
    description:
      "LPG gas supplier in Bulawayo, Zimbabwe: cylinder refills, wholesale bulk LPG, gas installations and delivery.",
    url: SITE_URL + "/",
    logo: SITE_URL + "/images/db-gas-logo.png",
    image: SITE_URL + "/images/db-gas-48kg.jpg",
    telephone: BUSINESS.phone,
    email: BUSINESS.email,
    priceRange: "$",
    address: {
      "@type": "PostalAddress",
      streetAddress: BUSINESS.street,
      addressLocality: BUSINESS.city,
      addressCountry: BUSINESS.country,
    },
    areaServed: [{ "@type": "City", name: "Bulawayo" }, { "@type": "Country", name: "Zimbabwe" }],
    department: LOCATIONS.slice(1).map((l) => ({
      "@type": "LocalBusiness",
      name: l.name,
      telephone: BUSINESS.phone,
      address: { "@type": "PostalAddress", streetAddress: l.street, addressLocality: "Bulawayo", addressCountry: "ZW" },
      openingHoursSpecification: [
        { "@type": "OpeningHoursSpecification", dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"] as string | string[], opens: "08:00", closes: "18:00" },
        ...(l.sunday ? [{ "@type": "OpeningHoursSpecification", dayOfWeek: "Sunday" as string | string[], opens: "08:00", closes: "13:00" }] : []),
      ],
    })),
    openingHoursSpecification: [
      { "@type": "OpeningHoursSpecification", dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"], opens: "08:00", closes: "18:00" },
      { "@type": "OpeningHoursSpecification", dayOfWeek: "Sunday", opens: "08:00", closes: "13:00" },
    ],
    makesOffer: ["LPG cylinder refills", "Wholesale LPG supply", "LPG gas installations", "LPG accessories"].map((n) => ({
      "@type": "Offer",
      itemOffered: { "@type": "Service", name: n },
    })),
  };
}

function headTags(page: SeoPage, url: string) {
  const tags = [
    `<link rel="canonical" href="${esc(url)}">`,
    `<meta name="robots" content="${page.index ? "index, follow" : "noindex, nofollow"}">`,
    `<meta name="theme-color" content="#1e3a8a">`,
    `<meta property="og:site_name" content="DB Gas">`,
    `<meta property="og:url" content="${esc(url)}">`,
    `<meta property="og:image" content="${SITE_URL}/images/db-gas-48kg.jpg">`,
    `<meta property="og:locale" content="en_ZW">`,
    `<meta name="twitter:card" content="summary_large_image">`,
    `<meta name="twitter:title" content="${esc(page.title)}">`,
    `<meta name="twitter:description" content="${esc(page.description)}">`,
    `<meta name="geo.region" content="ZW-BU">`,
    `<meta name="geo.placename" content="Bulawayo">`,
  ];
  if (page.service) {
    const svc = {
      "@context": "https://schema.org",
      "@type": "Service",
      name: page.service,
      serviceType: "Gas reticulation installation",
      url: url,
      areaServed: [{ "@type": "City", name: "Bulawayo" }, { "@type": "Country", name: "Zimbabwe" }],
      provider: { "@id": SITE_URL + "/#business" },
    };
    tags.push(`<script type="application/ld+json">${JSON.stringify(svc).replace(/</g, "\\u003c")}</script>`);
  }
  if (page.index) {
    tags.push(`<script type="application/ld+json">${JSON.stringify(localBusinessSchema()).replace(/</g, "\\u003c")}</script>`);
  }
  if (page.path === "/") {
    // Tells Google the site's name, so results read "DB Gas" instead of "dbgas.co.zw".
    const website = {
      "@context": "https://schema.org",
      "@type": "WebSite",
      name: BUSINESS.name,
      alternateName: ["DB Gas Zimbabwe", "dbgas.co.zw"],
      url: SITE_URL + "/",
    };
    tags.push(`<script type="application/ld+json">${JSON.stringify(website).replace(/</g, "\\u003c")}</script>`);
  }
  return tags.join("\n    ");
}

// Readable HTML placed inside #root. Crawlers and link previews read it;
// React replaces it the moment the app starts.
function bodyContent(page: SeoPage) {
  const nav = PAGES.filter((p) => p.index)
    .map((p) => `<a href="${p.path}">${esc(p.h1)}</a>`)
    .join(" · ");
  const sections = (page.sections || [])
    .map(([h, t]) => `<h2>${esc(h)}</h2><p>${esc(t)}</p>`)
    .join("");
  return `<main style="max-width:860px;margin:0 auto;padding:24px 16px;font-family:Inter,system-ui,sans-serif;color:#1f2937">
<h1>${esc(page.h1)}</h1>
${page.intro ? `<p>${esc(page.intro)}</p>` : ""}
${sections}
<h2>Contact DB Gas</h2>
<ul>${LOCATIONS.map((l) => `<li><strong>${esc(l.name)}</strong>: ${esc(l.street)}, Bulawayo. Hours: ${esc(l.hours)}</li>`).join("")}</ul>
<p>Phone &amp; WhatsApp: <a href="tel:${BUSINESS.phone}">${BUSINESS.phoneDisplay}</a> · Email: <a href="mailto:${BUSINESS.email}">${BUSINESS.email}</a></p>
<nav>${nav}</nav>
</main>`;
}

function findPage(p: string) {
  const clean = p.length > 1 ? p.replace(/\/+$/, "") : p;
  return PAGES.find((x) => x.path === clean);
}

export function registerSeo(app: Express, distPath: string) {
  const template = fs.readFileSync(path.resolve(distPath, "index.html"), "utf8");
  const cache = new Map<string, string>();

  function render(page: SeoPage, reqPath: string): string {
    const key = page.path || "404:" + reqPath;
    const hit = cache.get(key);
    if (hit) return hit;
    const url = SITE_URL + (page.path || reqPath);
    const html = template
      .replace(/<title>[\s\S]*?<\/title>/, `<title>${esc(page.title)}</title>`)
      .replace(/<meta name="description"[^>]*>/, `<meta name="description" content="${esc(page.description)}">`)
      .replace(/<meta property="og:title"[^>]*>/, `<meta property="og:title" content="${esc(page.title)}">`)
      .replace(/<meta property="og:description"[^>]*>/, `<meta property="og:description" content="${esc(page.description)}">`)
      .replace("</head>", `    ${headTags(page, url)}\n  </head>`)
      .replace('<div id="root"></div>', `<div id="root">${bodyContent(page)}</div>`);
    if (page.path) cache.set(key, html);
    return html;
  }

  // One address for Google: send dbgas.co.zw to www.dbgas.co.zw
  app.use((req: Request, res: Response, next: NextFunction) => {
    const host = String(req.headers.host || "").toLowerCase().split(":")[0];
    if (host === "dbgas.co.zw" && (req.method === "GET" || req.method === "HEAD")) {
      return res.redirect(301, SITE_URL + req.originalUrl);
    }
    next();
  });

  app.get("/robots.txt", (_req: Request, res: Response) => {
    res.set("Cache-Control", "public, max-age=3600");
    res.type("text/plain").send(
      [
        "User-agent: *",
        "Disallow: /admin",
        "Disallow: /account",
        "Disallow: /checkout",
        "Disallow: /login",
        "Disallow: /reset-password",
        "Disallow: /api/",
        "",
        `Sitemap: ${SITE_URL}/sitemap.xml`,
        "",
      ].join("\n"),
    );
  });

  app.get("/sitemap.xml", (_req: Request, res: Response) => {
    res.set("Cache-Control", "public, max-age=3600");
    const today = new Date().toISOString().slice(0, 10);
    const urls = PAGES.filter((p) => p.index)
      .map((p) => `  <url><loc>${SITE_URL}${p.path}</loc><lastmod>${today}</lastmod><priority>${p.priority}</priority></url>`)
      .join("\n");
    res.type("application/xml").send(
      `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`,
    );
  });

  // Old address of the reticulation page.
  app.get("/gas-reticulation.html", (_req: Request, res: Response) => res.redirect(301, "/gas-reticulation"));

  // Page requests (no file extension, not the API) get the per-page HTML.
  app.use((req: Request, res: Response, next: NextFunction) => {
    if (req.method !== "GET" && req.method !== "HEAD") return next();
    if (req.path.startsWith("/api") || path.extname(req.path)) return next();
    const page = findPage(req.path);
    res.set("Cache-Control", "no-cache");
    if (page) return res.type("html").send(render(page, req.path));
    // Unknown URL: the app shows its own "not found" screen, and Google is told 404.
    res.status(404).type("html").send(render(NOT_FOUND, req.path));
  });
}
