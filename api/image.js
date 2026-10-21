"use strict";

const { json, methodNotAllowed, requireAdmin, errorToResponse } = require("./_lib/http");
const { getStore } = require("./_lib/store");

const MIME_BY_EXT = { png: "image/png", jpg: "image/jpeg", webp: "image/webp" };

function isPrivateAddress(address) {
  if (!address) return true;
  if (address === "::1" || address === "::") return true;
  const ip = address.replace(/^::ffff:/, "");
  const parts = ip.split(".");
  if (parts.length !== 4) return false;
  const a = Number(parts[0]);
  const b = Number(parts[1]);
  if (a === 10 || a === 127 || a === 0) return true;
  if (a === 172 && b >= 16 && b <= 31) return true;
  if (a === 192 && b === 168) return true;
  if (a === 169 && b === 254) return true;
  if (a === 100 && b >= 64 && b <= 127) return true;
  return false;
}

module.exports = async (req, res) => {
  if (req.method !== "GET" && req.method !== "HEAD") return methodNotAllowed(res, "GET, HEAD");

  try {
    const store = getStore();
    const id = typeof req.query.id === "string" ? req.query.id.trim() : "";
    if (!id || id.length > 80 || !/^[a-z0-9_.-]+$/i.test(id)) {
      return json(res, 400, { error: "invalid_id", message: "Invalid screenshot reference." });
    }

    const image = await store.getImage(id);
    if (!image) return json(res, 404, { error: "not_found", message: "Screenshot not found." });

    const entries = store.configured ? await store.list() : [];
    const owner = entries.find((entry) => entry.screenshot && entry.screenshot.id === id);

    const isPublicEntry =
      owner &&
      owner.status === "approved" &&
      owner.published === true &&
      owner.consent === true &&
      owner.allowScreenshot !== false;

    if (!isPublicEntry) requireAdmin(req);

    const ext = Object.keys(MIME_BY_EXT).find((key) => image.mime === MIME_BY_EXT[key]) || "jpg";
    res.statusCode = 200;
    res.setHeader("Content-Type", image.mime);
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("Content-Disposition", `inline; filename="screenshot.${ext}"`);
    res.setHeader("Content-Security-Policy", "default-src 'none'; img-src 'self'; sandbox");
    res.setHeader("Cache-Control", isPublicEntry ? "public, max-age=300, stale-while-revalidate=86400" : "private, no-store");
    res.end(image.buffer);
    return undefined;
  } catch (err) {
    return errorToResponse(res, err);
  }
};

module.exports.isPrivateAddress = isPrivateAddress;
