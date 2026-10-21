"use strict";

const { json, methodNotAllowed, requireAdmin, errorToResponse } = require("./_lib/http");
const { getStore } = require("./_lib/store");

function creditFor(entry) {
  switch (entry.attribution) {
    case "name":
      return entry.clientName || "";
    case "business":
      return entry.project || "";
    case "anonymous":
      return "";
    case "full":
    default:
      return [entry.clientName, entry.role].filter(Boolean).join(", ");
  }
}

function toPublic(entry, store) {
  const publishedAt = entry.publishedAt || entry.createdAt;
  return {
    id: entry.id,
    project: entry.project || "",
    credit: creditFor(entry),
    attribution: entry.attribution || "anonymous",
    testimonial: entry.testimonial || "",
    work: entry.work || "",
    details: entry.details || "",
    url: entry.url || "",
    embed: entry.url && entry.embed === "on" ? "on" : "off",
    screenshot: entry.allowScreenshot === false ? null : store.publicImage(entry),
    publishedAt,
    year: String(publishedAt || "").slice(0, 4)
  };
}

module.exports = async (req, res) => {
  if (req.method !== "GET") return methodNotAllowed(res, "GET");

  try {
    const store = getStore();
    const hasAuth = Boolean(req.headers.authorization);

    if (hasAuth) {
      requireAdmin(req);
      const entries = store.configured ? await store.list() : [];
      return json(res, 200, {
        configured: store.configured,
        driver: store.name,
        entries,
        count: entries.length
      });
    }

    const entries = store.configured ? await store.list() : [];
    const published = entries
      .filter(
        (entry) => entry && entry.status === "approved" && entry.published === true && entry.consent === true
      )
      .map((entry) => toPublic(entry, store));

    return json(
      res,
      200,
      { entries: published, count: published.length, driver: store.configured ? store.name : "none" },
      { "Cache-Control": "public, max-age=60, stale-while-revalidate=300" }
    );
  } catch (err) {
    return errorToResponse(res, err);
  }
};
