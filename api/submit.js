"use strict";

const { json, methodNotAllowed, readBody, clientIp, hashIp, errorToResponse, rateLimit } = require("./_lib/http");
const { validateSubmission } = require("./_lib/validate");
const { getStore, newId } = require("./_lib/store");
const { LIMITS } = require("./_lib/config");

module.exports = async (req, res) => {
  if (req.method !== "POST") return methodNotAllowed(res, "POST");

  try {
    const ip = clientIp(req);
    const limited = rateLimit(`submit:${hashIp(ip)}`, { limit: 5, windowMs: 60 * 60 * 1000 });
    if (!limited.ok) {
      res.setHeader("Retry-After", String(limited.retryAfter));
      return json(res, 429, {
        error: "rate_limited",
        message: "Too many submissions from this connection. Please try again later."
      });
    }

    const store = getStore();
    if (!store.configured) {
      return json(res, 503, {
        error: "storage_not_configured",
        message:
          "Submissions are temporarily unavailable because no storage backend is configured on this deployment. Nothing has been saved."
      });
    }

    const body = await readBody(req, LIMITS.payload);
    const result = validateSubmission(body);

    if (result.honeypot) {
      return json(res, 201, { ok: true, reference: "-------" });
    }

    if (!result.hasStartedAt) {
      return json(res, 400, {
        error: "invalid_request",
        message: "This submission could not be verified. Please reload the page and try again."
      });
    }

    if (result.tooFast) {
      return json(res, 429, {
        error: "too_fast",
        message: "That was submitted unusually quickly. Please take a moment and try again."
      });
    }

    if (!result.ok) {
      return json(res, 422, {
        error: "validation_failed",
        message: "Please correct the highlighted fields.",
        errors: result.errors
      });
    }

    const now = new Date().toISOString();
    const id = newId("sub");

    let screenshot = null;
    if (result.value.image) {
      const stored = await store.putImage(id, result.value.image.buffer, result.value.image.mime, result.value.image.ext);
      screenshot = { id: stored.id, mime: stored.mime };
    }

    const startedAt = Number(body.startedAt);
    const record = {
      id,
      createdAt: now,
      updatedAt: now,
      status: "pending",
      published: false,
      publishedAt: null,
      reviewedAt: null,
      clientName: result.value.clientName,
      project: result.value.project,
      email: result.value.email,
      role: result.value.role,
      url: result.value.url,
      testimonial: result.value.testimonial,
      work: result.value.work,
      details: result.value.details,
      attribution: result.value.attribution,
      consent: true,
      consentAt: now,
      screenshot,
      allowScreenshot: true,
      embed: result.value.url ? "on" : "off",
      embedCheckedAt: null,
      source: {
        ipHash: hashIp(ip),
        ua: String(req.headers["user-agent"] || "").slice(0, 180),
        elapsedMs: Date.now() - startedAt
      }
    };

    await store.put(record);

    return json(res, 201, {
      ok: true,
      reference: id.slice(-6).toUpperCase(),
      message: "Received. It stays private until it has been reviewed."
    });
  } catch (err) {
    return errorToResponse(res, err);
  }
};
