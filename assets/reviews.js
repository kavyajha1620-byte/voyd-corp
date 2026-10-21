(() => {
  "use strict";

  const qs = (selector, context = document) => context.querySelector(selector);
  const qsa = (selector, context = document) => Array.from(context.querySelectorAll(selector));

  const BATCH = 6;

  /*
   * VOYD CORP's own self-initiated concept websites.
   *
   * These are real, working sites we designed and built ourselves — not
   * customer reviews. The homepage shows them here as a project showcase so
   * visitors can see the actual work, with real live previews.
   *
   * Rules kept deliberately strict:
   *   - No invented person names, job titles, locations, ratings, or photos.
   *   - No fabricated quotations or invented customer experiences anywhere.
   *   - Each entry is labelled as a concept build ONCE, at the section level,
   *     rather than repeating a warning badge on every card.
   */
  const PROJECTS = [
    {
      id: "lumen",
      category: "Skincare / DTC storefront",
      project: "Lumen Skincare",
      details:
        "A storefront that leads with one simple benefit, then unfolds ingredients and ritual in the order a first-time buyer actually needs them.",
      url: "/projects/lumen-skincare"
    },
    {
      id: "atelier",
      category: "Fine jewellery",
      project: "Atelier Éclat",
      details:
        "A dark, editorial boutique where material filtering and price sorting do the quiet work, so the pieces stay the focus.",
      url: "/projects/atelier-jewels"
    },
    {
      id: "meridian",
      category: "Fashion / Label",
      project: "Meridian",
      details:
        "A lookbook-led wardrobe label with size-aware product detail and a working bag, kept calm instead of noisy.",
      url: "/projects/meridian-fashion"
    },
    {
      id: "saffron",
      category: "Restaurant / Hospitality",
      project: "Saffron & Stone",
      details:
        "A restaurant site that trades the usual menu grid for appetite, atmosphere, and a reason to book.",
      url: "/projects/saffron-and-stone"
    },
    {
      id: "halcyon",
      category: "Boutique hotel",
      project: "Halcyon House",
      details:
        "A coastal retreat with a date-range availability search and honest room rates that make booking feel effortless.",
      url: "/projects/halcyon-house"
    },
    {
      id: "ironbark",
      category: "Auto detailing",
      project: "Ironbark Detailing",
      details:
        "An interactive quote builder that updates as you choose, so the price feels transparent before anyone calls.",
      url: "/projects/ironbark-detailing"
    },
    {
      id: "fable",
      category: "Interior design",
      project: "Fable & Moss",
      details:
        "A filterable portfolio with full project write-ups, so the studio reads as considered rather than crowded.",
      url: "/projects/fable-and-moss"
    },
    {
      id: "pulse",
      category: "Fitness studio",
      project: "Pulse Studio",
      details:
        "A day-by-day timetable with class filtering that turns a wall of sessions into something you can actually book.",
      url: "/projects/pulse-studio"
    },
    {
      id: "northbeam",
      category: "SaaS platform",
      project: "Northbeam",
      details:
        "A product tour, a billing toggle, and a real interface preview in place of the usual pile of unproven adjectives.",
      url: "/projects/northbeam-saas"
    },
    {
      id: "woodwright",
      category: "Furniture / Home",
      project: "Woodwright & Loom",
      details:
        "A material-filtered catalogue with clear product specs, built for made-to-order work that needs explaining.",
      url: "/projects/woodwright-loom"
    }
  ];

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

  /* ── Project showcase card ─────────────────────────────
   * A real, live preview of one of our own concept builds.
   * No testimonial language, no warning badges: the section
   * labels the whole collection once.
   */
  const workCard = (entry) => {
    const li = document.createElement("li");
    li.className = "work-card";
    li.dataset.reveal = "";

    const preview = document.createElement("div");
    preview.className = "work-card__preview";

    const chrome = document.createElement("span");
    chrome.className = "work-card__chrome";
    chrome.setAttribute("aria-hidden", "true");
    chrome.append(document.createElement("span"), document.createElement("span"), document.createElement("span"));
    preview.append(chrome);

    const link = safeUrl(entry.url);
    if (link) {
      const frame = document.createElement("iframe");
      frame.className = "work-card__frame";
      frame.src = link;
      frame.title = `${entry.project} — live preview`;
      frame.loading = "lazy";
      frame.tabIndex = -1;
      frame.setAttribute("scrolling", "no");
      frame.setAttribute("aria-hidden", "true");
      preview.append(frame);

      const overlay = document.createElement("a");
      overlay.className = "work-card__overlay";
      overlay.href = link;
      overlay.target = "_blank";
      overlay.rel = "noopener noreferrer";
      overlay.tabIndex = -1;
      overlay.setAttribute("aria-hidden", "true");
      preview.append(overlay);
    }

    li.append(preview);

    const body = document.createElement("div");
    body.className = "work-card__body";

    const category = document.createElement("span");
    category.className = "work-card__category";
    category.textContent = entry.category;
    body.append(category);

    const project = document.createElement("h3");
    project.className = "work-card__project";
    project.textContent = entry.project;
    body.append(project);

    const details = document.createElement("p");
    details.className = "work-card__details";
    details.textContent = entry.details || "";
    body.append(details);

    li.append(body);

    if (link) {
      const visit = document.createElement("a");
      visit.className = "work-card__link";
      visit.href = link;
      visit.target = "_blank";
      visit.rel = "noopener noreferrer";
      visit.textContent = "View live site";
      const arrow = document.createElement("span");
      arrow.setAttribute("aria-hidden", "true");
      arrow.textContent = "↗";
      visit.append(" ", arrow);
      li.append(visit);
    }

    return li;
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
    const work = qs("#work-showcase");
    if (!section || !list || !status || !empty || !work) return;

    const workList = qs("#work-list");
    if (workList) {
      const fragment = document.createDocumentFragment();
      const nodes = PROJECTS.map((project) => {
        const node = workCard(project);
        fragment.append(node);
        return node;
      });
      workList.append(fragment);
      applyReveal(nodes);
    }

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
