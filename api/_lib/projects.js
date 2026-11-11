"use strict";

const { str, para, normalizeUrl } = require("./validate");
const { LIMITS } = require("./config");

/*
 * The single source of truth for service categories. The public site, the
 * admin form and the API all read this list, so labels can never drift.
 */
const CATEGORIES = [
  { slug: "website-development", label: "Website Development", blurb: "Sites that make the next step obvious." },
  { slug: "app-development", label: "App Development", blurb: "Product interfaces people keep using." },
  { slug: "ai-automation", label: "AI Automation", blurb: "Workflows that think for themselves." },
  { slug: "business-process-automation", label: "Business Process Automation", blurb: "The busywork, quietly removed." },
  { slug: "seo", label: "SEO", blurb: "Found by the people already looking." },
  { slug: "digital-marketing", label: "Digital Marketing", blurb: "Campaigns with a clear argument." },
  { slug: "social-media-marketing", label: "Social Media Marketing", blurb: "A feed with a point of view." },
  { slug: "branding-graphic-design", label: "Branding & Graphic Design", blurb: "An identity that holds up." },
  { slug: "ui-ux-design", label: "UI/UX Design", blurb: "Interfaces that explain themselves." },
  { slug: "custom-software-development", label: "Custom Software Development", blurb: "Tools built for how you actually work." },
  { slug: "crm-business-management", label: "CRM & Business Management Systems", blurb: "One place for the whole operation." },
  { slug: "api-development-integrations", label: "API Development & Integrations", blurb: "Systems that speak to each other." }
];

const CATEGORY_SLUGS = CATEGORIES.map((category) => category.slug);
const MAX_SHOTS = 8;
const MAX_TECH = 12;

const PROJECT_LIMITS = {
  title: [2, 120],
  summary: [0, 300],
  description: [0, 4000],
  tech: 40,
  url: LIMITS.url[1],
  shots: MAX_SHOTS
};

function listFrom(value) {
  if (Array.isArray(value)) return value.map((item) => str(item, PROJECT_LIMITS.tech)).filter(Boolean);
  if (typeof value === "string") {
    return value
      .split(/[,\n]/)
      .map((item) => str(item, PROJECT_LIMITS.tech))
      .filter(Boolean);
  }
  return [];
}

function normalizeScreenshots(value) {
  if (!Array.isArray(value)) return [];
  const seen = new Set();
  const out = [];
  for (const item of value) {
    const id = typeof item === "string" ? item : item && typeof item.id === "string" ? item.id : "";
    const clean = id.trim();
    if (!clean || clean.length > 80) continue;
    if (!/^[a-z0-9_.-]+$/i.test(clean)) continue;
    if (seen.has(clean)) continue;
    seen.add(clean);
    const mime = item && typeof item.mime === "string" ? str(item.mime, 40) : "";
    out.push(mime ? { id: clean, mime } : { id: clean });
    if (out.length >= MAX_SHOTS) break;
  }
  return out;
}

function validateProject(input) {
  const errors = {};
  const source = input && typeof input === "object" ? input : {};

  const category = str(source.category, 60);
  if (!CATEGORY_SLUGS.includes(category)) errors.category = "Choose one of the service categories.";

  const title = str(source.title, PROJECT_LIMITS.title[1] + 20);
  if (title.length < PROJECT_LIMITS.title[0]) errors.title = "Give the project a name.";
  else if (title.length > PROJECT_LIMITS.title[1]) errors.title = `Keep the name under ${PROJECT_LIMITS.title[1]} characters.`;

  const summary = str(source.summary, PROJECT_LIMITS.summary[1] + 100);
  if (summary.length > PROJECT_LIMITS.summary[1]) errors.summary = `Keep the summary under ${PROJECT_LIMITS.summary[1]} characters.`;

  const description = para(source.description, PROJECT_LIMITS.description[1] + 200);
  if (description.length > PROJECT_LIMITS.description[1]) {
    errors.description = `Keep the description under ${PROJECT_LIMITS.description[1]} characters.`;
  }

  const tech = listFrom(source.tech).slice(0, MAX_TECH);
  if (listFrom(source.tech).length > MAX_TECH) errors.tech = `List up to ${MAX_TECH} technologies.`;

  const urlResult = normalizeUrl(source.liveUrl);
  if (!urlResult.ok) errors.liveUrl = urlResult.error;

  const screenshots = normalizeScreenshots(source.screenshots);

  return {
    ok: Object.keys(errors).length === 0,
    errors,
    value: {
      category,
      title,
      summary,
      description,
      tech,
      liveUrl: urlResult.value || "",
      screenshots
    }
  };
}

function decorate(store, project) {
  const shots = Array.isArray(project.screenshots) ? project.screenshots : [];
  return {
    ...project,
    screenshots: shots
      .map((shot) => {
        const url = store.publicImage({ screenshot: shot });
        return url ? { id: shot.id, url } : null;
      })
      .filter(Boolean)
  };
}

module.exports = {
  CATEGORIES,
  CATEGORY_SLUGS,
  PROJECT_LIMITS,
  validateProject,
  normalizeScreenshots,
  decorate
};
