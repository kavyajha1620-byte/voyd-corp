(() => {
  "use strict";

  const qs = (selector, context = document) => context.querySelector(selector);
  const qsa = (selector, context = document) => Array.from(context.querySelectorAll(selector));

  const BATCH = 6;

  /*
   * Genuine customer reviews only.
   *
   * Every card comes from an approved, authenticated submission. Nothing here
   * invents person names, job titles, locations, ratings, photos or quotations.
   */
  const initialsOf = (name) => {
    const clean = String(name || "").replace(/[^A-Za-z\s]/g, " ").trim();
    if (!clean) return "VC";
    return clean
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part.charAt(0).toUpperCase())
      .join("");
  };

  const hostOf = (value) => {
    try {
      const url = new URL(value, window.location.href);
      return url.hostname.replace(/^www\./, "") || "review";
    } catch (err) {
      return "";
    }
  };

  const safeUrl = (value) => {
    try {
      const url = new URL(value, window.location.href);
      if (url.protocol !== "http:" && url.protocol !== "https:") return null;
      return url.toString();
    } catch (err) {
      return null;
    }
  };

  const formatDate = (value) => {
    if (!value) return "";
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return "";
    return parsed.toLocaleDateString("en-IN", { year: "numeric", month: "short" });
  };

  /* ── Genuine customer review card ──────────────────────
   * Rendered only for approved, authenticated submissions.
   * Never fabricated.
   */
  const reviewCard = (entry) => {
    const li = document.createElement("li");
    li.className = "review-card";
    li.dataset.reveal = "";

    const head = document.createElement("div");
    head.className = "review-card__head";

    const avatar = document.createElement("span");
    avatar.className = "review-card__avatar";
    avatar.setAttribute("aria-hidden", "true");
    avatar.textContent = initialsOf(entry.credit || entry.project);
    head.append(avatar);

    const id = document.createElement("div");
    id.className = "review-card__id";

    if (entry.category) {
      const category = document.createElement("span");
      category.className = "review-card__category";
      category.textContent = entry.category;
      id.append(category);
    }

    const project = document.createElement("h3");
    project.className = "review-card__project";
    project.textContent = entry.credit || entry.project || "Client";
    id.append(project);

    if (entry.credit && entry.project) {
      const byline = document.createElement("span");
      byline.className = "review-card__byline";
      byline.textContent = entry.project;
      id.append(byline);
    }
    head.append(id);
    li.append(head);

    const body = document.createElement("p");
    body.className = "review-card__body";
    body.textContent = entry.testimonial || "";
    li.append(body);

    if (entry.details) {
      const details = document.createElement("p");
      details.className = "review-card__details";
      details.textContent = entry.details;
      li.append(details);
    }

    const foot = document.createElement("div");
    foot.className = "review-card__foot";

    const meta = document.createElement("div");
    meta.className = "review-card__meta";
    const date = formatDate(entry.publishedAt || entry.year);
    if (date) {
      const dateLine = document.createElement("span");
      dateLine.className = "review-card__date";
      dateLine.textContent = date;
      meta.append(dateLine);
    }
    if (entry.url) {
      const host = document.createElement("span");
      host.className = "review-card__host";
      host.textContent = hostOf(entry.url);
      meta.append(host);
    }
    foot.append(meta);

    const link = safeUrl(entry.url);
    if (link) {
      const visit = document.createElement("a");
      visit.className = "review-card__link";
      visit.href = link;
      visit.target = "_blank";
      visit.rel = "noopener noreferrer";
      visit.textContent = "Visit live website";
      const arrow = document.createElement("span");
      arrow.setAttribute("aria-hidden", "true");
      arrow.textContent = "↗";
      visit.append(" ", arrow);
      foot.append(visit);
    }
    li.append(foot);

    return li;
  };

  const applyReveal = (nodes) => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) {
      nodes.forEach((node) => node.classList.add("in-view"));
      return;
    }
    nodes.forEach((node, i) => {
      window.requestAnimationFrame(() => {
        window.setTimeout(() => node.classList.add("in-view"), Math.min(i, 5) * 60);
      });
    });
  };

  const init = () => {
    const section = qs("#reviews");
    const list = qs("#reviews-list");
    const status = qs("#reviews-status");
    const empty = qs("#reviews-empty");
    const countEl = qs("#reviews-count");
    const note = qs("#reviews-note");
    const controls = qs("#reviews-controls");
    const more = qs("#reviews-more");
    if (!section || !list || !status || !empty) return;

    qsa("[data-reviews-open-form]").forEach((button) =>
      button.addEventListener("click", () => {
        window.location.href = "/testimonials#share";
      })
    );

    const setCount = (n) => {
      if (countEl) countEl.textContent = String(n);
    };

    let all = [];
    let rendered = 0;

    const revealControls = () => {
      if (!controls) return;
      const hasMore = rendered < all.length;
      controls.hidden = !hasMore;
      if (more) more.hidden = !hasMore;
    };

    const renderBatch = () => {
      const slice = all.slice(rendered, rendered + BATCH);
      const fragment = document.createDocumentFragment();
      const nodes = slice.map((entry) => {
        const node = reviewCard(entry);
        fragment.append(node);
        return node;
      });
      list.append(fragment);
      rendered += slice.length;
      applyReveal(nodes);
      revealControls();
    };

    const show = (entries) => {
      status.hidden = true;
      all = entries;
      setCount(entries.length);

      if (!entries.length) {
        empty.hidden = false;
        if (controls) controls.hidden = true;
        return;
      }

      empty.hidden = true;
      list.hidden = false;
      renderBatch();
    };

    more?.addEventListener("click", () => {
      if (rendered < all.length) renderBatch();
    });

    fetch("/api/entries", { headers: { Accept: "application/json" } })
      .then((response) => {
        if (!response.ok) throw new Error(`status ${response.status}`);
        return response.json();
      })
      .then((data) => {
        const entries = Array.isArray(data.entries) ? data.entries : [];
        if (entries.length) {
          note && (note.textContent =
            "Every review here was submitted by a client and approved before publishing.");
          show(entries);
          return;
        }
        note && (note.textContent =
          "No customer reviews have been published yet. We would rather show nothing than invent praise.");
        show([]);
      })
      .catch(() => {
        note && (note.textContent =
          "Could not reach the reviews service just now. Please try again shortly.");
        show([]);
      });
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init, { once: true });
  } else {
    init();
  }
})();
