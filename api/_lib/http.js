"use strict";

const crypto = require("node:crypto");
const { adminToken } = require("./config");

function json(res, status, body, headers) {
  const payload = JSON.stringify(body);
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", "no-store");
  if (headers) {
    for (const [k, v] of Object.entries(headers)) res.setHeader(k, v);
  }
  res.end(payload);
}

function methodNotAllowed(res, allow) {
  res.setHeader("Allow", allow);
  json(res, 405, { error: "method_not_allowed", message: `Use ${allow}.` });
}

function readBody(req, maxBytes) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let size = 0;
    let settled = false;
    const done = (err, value) => {
      if (settled) return;
      settled = true;
      if (err) reject(err);
      else resolve(value);
    };

    req.on("data", (chunk) => {
      size += chunk.length;
      if (size > maxBytes) {
        done(Object.assign(new Error("payload_too_large"), { status: 413, code: "payload_too_large", publicMessage: "That upload is too large." }));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });
    req.on("end", () => {
      const raw = Buffer.concat(chunks).toString("utf8");
      if (!raw) return done(null, {});
      try {
        done(null, JSON.parse(raw));
      } catch (err) {
        done(Object.assign(new Error("invalid_json"), { status: 400, code: "invalid_json", publicMessage: "The request could not be read." }));
      }
    });
    req.on("error", (err) => done(err));
  });
}

function clientIp(req) {
  const fwd = req.headers["x-forwarded-for"];
  const raw = Array.isArray(fwd) ? fwd[0] : fwd;
  const ip = (raw || req.headers["x-real-ip"] || (req.socket && req.socket.remoteAddress) || "").split(",")[0].trim();
  return ip || "unknown";
}

function hashIp(ip) {
  return crypto.createHash("sha256").update(String(ip)).digest("hex").slice(0, 32);
}

function requireAdmin(req) {
  const expected = adminToken();
  if (!expected) {
    const err = new Error("admin_not_configured");
    err.status = 503;
    err.code = "admin_not_configured";
    err.publicMessage =
      "Administration is not configured on this deployment. Set the VOYD_ADMIN_TOKEN environment variable (16+ characters) to enable review and approval.";
    throw err;
  }

  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7).trim() : "";
  if (!token) {
    const err = new Error("unauthorized");
    err.status = 401;
    err.code = "unauthorized";
    err.publicMessage = "Missing admin credentials.";
    throw err;
  }

  const a = crypto.createHash("sha256").update(token).digest();
  const b = crypto.createHash("sha256").update(expected).digest();
  if (!crypto.timingSafeEqual(a, b)) {
    const err = new Error("unauthorized");
    err.status = 401;
    err.code = "unauthorized";
    err.publicMessage = "Invalid admin credentials.";
    throw err;
  }
  return true;
}

function errorToResponse(res, err) {
  const status = err && err.status ? err.status : 500;
  const code = (err && err.code) || "server_error";
  const message =
    (err && err.publicMessage) || (status === 500 ? "Something went wrong. Nothing was saved." : err.message);
  if (status === 500 && process.env.NODE_ENV !== "production") {
    console.error("[voyd-api]", err);
  }
  json(res, status, { error: code, message });
}

const buckets = new Map();

function rateLimit(key, { limit, windowMs }) {
  const now = Date.now();
  const bucket = buckets.get(key) || [];
  const fresh = bucket.filter((t) => now - t < windowMs);
  if (fresh.length >= limit) {
    return { ok: false, retryAfter: Math.ceil((windowMs - (now - fresh[0])) / 1000) };
  }
  fresh.push(now);
  buckets.set(key, fresh);
  if (buckets.size > 5000) {
    for (const [k, v] of buckets) {
      if (v.every((t) => now - t >= windowMs)) buckets.delete(k);
    }
  }
  return { ok: true };
}

module.exports = { json, methodNotAllowed, readBody, clientIp, hashIp, requireAdmin, errorToResponse, rateLimit };
