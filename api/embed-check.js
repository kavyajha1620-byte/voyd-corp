"use strict";

const dns = require("node:dns").promises;
const net = require("node:net");
const { json, methodNotAllowed, requireAdmin, errorToResponse, rateLimit, hashIp, clientIp } = require("./_lib/http");
const { normalizeUrl } = require("./_lib/validate");
const { isPrivateAddress } = require("./image");

const TIMEOUT_MS = 6000;

async function assertPublicHost(hostname) {
  if (net.isIP(hostname)) {
    if (isPrivateAddress(hostname)) throw blocked("That address points to a private network.");
    return;
  }
  let records;
  try {
    records = await dns.lookup(hostname, { all: true });
  } catch (err) {
    throw blocked("That website address could not be resolved.");
  }
  if (!records.length) throw blocked("That website address could not be resolved.");
  if (records.some((record) => isPrivateAddress(record.address))) {
    throw blocked("That address resolves to a private network and will not be previewed.");
  }
}

function blocked(message) {
  const err = new Error("preview_invalid");
  err.status = 400;
  err.code = "preview_invalid";
  err.publicMessage = message;
  return err;
}

function sameOriginOfHost(targetUrl, requestHost) {
  try {
    const target = new URL(targetUrl);
    const normalized = String(requestHost || "").split(":")[0].toLowerCase();
    return target.hostname.toLowerCase() === normalized;
  } catch (err) {
    return false;
  }
}

module.exports = async (req, res) => {
  if (req.method !== "GET" && req.method !== "POST") return methodNotAllowed(res, "GET, POST");

  try {
    const isAdmin = Boolean(req.headers.authorization);
    if (!isAdmin) {
      const limited = rateLimit(`preview:${hashIp(clientIp(req))}`, { limit: 40, windowMs: 10 * 60 * 1000 });
      if (!limited.ok) {
        return json(res, 429, { error: "rate_limited", message: "Too many preview checks. Please wait a moment." });
      }
    } else {
      requireAdmin(req);
    }

    const raw = req.query && typeof req.query.url === "string" ? req.query.url : null;
    if (!raw) return json(res, 400, { error: "missing_url", message: "A website address is required." });

    const normalized = normalizeUrl(raw);
    if (!normalized.ok) return json(res, 400, { error: "invalid_url", message: normalized.error });

    if (sameOriginOfHost(normalized.value, req.headers.host)) {
      return json(res, 200, {
        url: normalized.value,
        status: 200,
        blocked: true,
        reason: "self",
        message: "This is the site you are already viewing, so no embedded preview is needed.",
        checkedAt: new Date().toISOString()
      });
    }

    const parsed = new URL(normalized.value);
    await assertPublicHost(parsed.hostname);

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
    let response;
    try {
      response = await fetch(normalized.value, {
        method: "GET",
        redirect: "follow",
        signal: controller.signal,
        headers: {
          "User-Agent": "VOYD-Preview-Check/1.0 (+https://voydcorp.vercel.app)",
          Accept: "text/html,application/xhtml+xml"
        }
      });
    } catch (err) {
      const reason = err && err.name === "AbortError" ? "timeout" : "unreachable";
      return json(res, 200, {
        url: normalized.value,
        status: 0,
        blocked: true,
        reason,
        message:
          reason === "timeout"
            ? "That website did not respond in time, so the live preview has been replaced with a direct link."
            : "That website could not be reached, so the live preview has been replaced with a direct link.",
        checkedAt: new Date().toISOString()
      });
    } finally {
      clearTimeout(timer);
    }

    const xfo = (response.headers.get("x-frame-options") || "").toLowerCase();
    const csp = (response.headers.get("content-security-policy") || "").toLowerCase();
    const ancestorMatch = csp.match(/frame-ancestors([^;]*)/);
    const frameAncestors = ancestorMatch ? ancestorMatch[1].trim() : null;
    const type = (response.headers.get("content-type") || "").toLowerCase();

    let verdict = {
      url: normalized.value,
      status: response.status,
      blocked: false,
      xFrameOptions: xfo || null,
      frameAncestors,
      checkedAt: new Date().toISOString()
    };

    if (xfo.includes("deny") || xfo.includes("sameorigin") || xfo.includes("allow-from")) {
      verdict.blocked = true;
      verdict.reason = "x_frame_options";
      verdict.message =
        "This website sends an X-Frame-Options header, so it cannot be embedded here. That is a security setting on their side and it is not bypassed.";
    } else if (frameAncestors !== null && !frameAncestors.includes("*")) {
      verdict.blocked = true;
      verdict.reason = "frame_ancestors";
      verdict.message =
        "This website sets a Content-Security-Policy frame-ancestors rule, so it cannot be embedded here. That is a security setting on their side and it is not bypassed.";
    } else if (type && !type.includes("html")) {
      verdict.blocked = true;
      verdict.reason = "not_html";
      verdict.message = "That address does not serve a web page, so it is linked instead of embedded.";
    } else {
      verdict.reason = "allowed";
      verdict.message = "This website allows embedding.";
    }

    try {
      if (response.body && response.body.cancel) await response.body.cancel();
    } catch (err) {
      /* ignore */
    }

    return json(res, 200, verdict);
  } catch (err) {
    return errorToResponse(res, err);
  }
};
