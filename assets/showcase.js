(() => {
  "use strict";

  /*
   * Service categories + published client work.
   *
   * Only real, approved work appears here. The live projects are read from the
   * portfolio section, and published projects can also arrive from /api/projects.
   * Nothing is seeded, invented or filled in for show. Categories without a real
   * project display a "Projects coming soon" empty state instead.
   */

  const CATEGORIES = [
    { slug: "website-development", label: "Website Development" },
    { slug: "app-development", label: "App Development" },
    { slug: "ai-automation", label: "AI Automation" },
    { slug: "business-process-automation", label: "Business Process Automation" },
    { slug: "seo", label: "SEO" },
    { slug: "digital-marketing", label: "Digital Marketing" },
    { slug: "social-media-marketing", label: "Social Media Marketing" },
    { slug: "branding-graphic-design", label: "Branding & Graphic Design" },
    { slug: "ui-ux-design", label: "UI/UX Design" },
    { slug: "custom-software-development", label: "Custom Software Development" },
    { slug: "crm-business-management", label: "CRM & Business Management Systems" },
    { slug: "api-development-integrations", label: "API Development & Integrations" }
  ];

  const LABEL = Object.fromEntries(CATEGORIES.map((category) => [category.slug, category.label]));

  /* Real client work that lives outside the two portfolio tabs. */
  const CLIENT_PROJECTS = [
    {
      id: "client-iris-labs-crm",
      category: "crm-business-management",
      title: "Iris Labs Agency OS",
      summary:
        "An internal agency CRM for leads, projects, payments and team chat in one secure workspace.",
      description:
        "Iris Labs Agency OS is an internal agency CRM covering the lead pipeline, project delivery, commissions, payments and team chat behind a secure sign-in.",
      tech: ["CRM", "Projects", "Payments", "Team chat"],
      liveUrl: "https://irislabs-crm-mu.vercel.app/login",
      screenshots: [{ url: "assets/projects/irislabs-crm.jpg" }],
      client: true
    }
  ];


  /* ── cover art for entries without a screenshot ───────── */
  const PALETTES = {
    "website-development": ["#e9e3d2", "#2145d8"],
    "app-development": ["#dfe4f7", "#1736d6"],
    "ai-automation": ["#e4e7f2", "#3a3f8f"],
    "business-process-automation": ["#e8e4d6", "#2c4a7a"],
    "seo": ["#e6ebdf", "#2f6b46"],
    "digital-marketing": ["#f3e3d7", "#a8471f"],
    "social-media-marketing": ["#f4e0e6", "#9c2f5a"],
    "branding-graphic-design": ["#efe5d3", "#1d1a16"],
    "ui-ux-design": ["#e2e9ef", "#2a5a76"],
    "custom-software-development": ["#e6e3ee", "#4a3a7a"],
    "crm-business-management": ["#e9e7dc", "#4d5a2f"],
    "api-development-integrations": ["#e0eae8", "#1f5f5a"]
  };

  const escapeXml = (value) =>
    String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");

  const coverFor = (project) => {
    const palette = PALETTES[project.category] || ["#efe9dc", "#2145d8"];
    const words = String(project.title || "VOYD").split(/\s+/);
    const mark = words.slice(0, 2).map((word) => word.charAt(0).toUpperCase()).join("");
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 500" role="img" aria-label="${escapeXml(project.title || "Project")}">
<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${palette[0]}"/><stop offset="1" stop-color="${palette[0]}" stop-opacity=".55"/></linearGradient></defs>
<rect width="800" height="500" fill="url(#g)"/>
<circle cx="640" cy="120" r="150" fill="${palette[1]}" opacity=".12"/>
<circle cx="150" cy="430" r="190" fill="${palette[1]}" opacity=".08"/>
<text x="56" y="250" font-family="Georgia, 'Times New Roman', serif" font-style="italic" font-size="120" fill="${palette[1]}" opacity=".92">${escapeXml(mark)}</text>
<text x="58" y="322" font-family="Helvetica, Arial, sans-serif" font-size="19" letter-spacing="4" fill="${palette[1]}" opacity=".62">${escapeXml((LABEL[project.category] || "").toUpperCase())}</text>
</svg>`;
    return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
  };

  const qs = (selector, context = document) => context.querySelector(selector);
  const qsa = (selector, context = document) => Array.from(context.querySelectorAll(selector));
  const safeUrl = (value) => {
    if (!value) return null;
    try {
      const url = new URL(value, window.location.href);
      if (url.protocol !== "http:" && url.protocol !== "https:") return null;
      return url.toString();
    } catch (err) {
      return null;
    }
  };

  let projects = [];
  let activeFilter = "all";

  const byCategory = (slug) => projects.filter((project) => project.category === slug);

  /* ── media: uploaded screenshot, live preview, or cover ── */
  const mediaFor = (project, { preview = true } = {}) => {
    const shot = Array.isArray(project.screenshots) ? project.screenshots.find((item) => item && item.url) : null;
    if (shot) {
      const img = document.createElement("img");
      img.className = "showcase-media__img";
      img.src = shot.url;
      img.alt = "";
      img.loading = "lazy";
      img.decoding = "async";
      return img;
    }
    const live = safeUrl(project.liveUrl);
    if (live && preview) {
      const frame = document.createElement("iframe");
      frame.className = "showcase-media__frame";
      frame.src = live;
      frame.title = `${project.title} — live preview`;
      frame.loading = "lazy";
      frame.tabIndex = -1;
      frame.setAttribute("scrolling", "no");
      frame.setAttribute("aria-hidden", "true");
      return frame;
    }
    const img = document.createElement("img");
    img.className = "showcase-media__img";
    img.src = coverFor(project);
    img.alt = "";
    img.loading = "lazy";
    img.decoding = "async";
    return img;
  };

  const applyReveal = (nodes) => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) {
      nodes.forEach((node) => node.classList.add("in-view"));
      return;
    }
    nodes.forEach((node, i) => {
      window.requestAnimationFrame(() => {
        window.setTimeout(() => node.classList.add("in-view"), Math.min(i, 6) * 45);
      });
    });
  };

  /* ── dialog ───────────────────────────────────────────── */
  const openProject = (project) => {
    const dialog = qs("#project-dialog");
    if (!dialog || typeof dialog.showModal !== "function") return;

    qs("#project-dialog-cat").textContent = LABEL[project.category] || "Project";
    qs("#project-dialog-title").textContent = project.title;

    const desc = qs("#project-dialog-desc");
    desc.textContent = project.description || project.summary || "";

    const media = qs("#project-dialog-media");
    media.textContent = "";

    const shots = Array.isArray(project.screenshots) ? project.screenshots.filter((shot) => shot && shot.url) : [];
    const live = safeUrl(project.liveUrl);

    if (shots.length) {
      const main = document.createElement("img");
      main.className = "project-dialog__shot";
      main.src = shots[0].url;
      main.alt = `${project.title} screenshot`;
      media.append(main);

      if (shots.length > 1) {
        const strip = document.createElement("div");
        strip.className = "project-dialog__thumbs";
        shots.forEach((shot) => {
          const thumb = document.createElement("button");
          thumb.type = "button";
          thumb.className = "project-dialog__thumb";
          thumb.setAttribute("aria-label", "Show screenshot");
          const img = document.createElement("img");
          img.src = shot.url;
          img.alt = "";
          img.loading = "lazy";
          thumb.append(img);
          thumb.addEventListener("click", () => {
            main.src = shot.url;
            strip.querySelectorAll("button").forEach((button) => button.classList.remove("is-active"));
            thumb.classList.add("is-active");
          });
          strip.append(thumb);
        });
        strip.firstChild.classList.add("is-active");
        media.append(strip);
      }
    } else if (live) {
      const frame = document.createElement("iframe");
      frame.className = "project-dialog__frame";
      frame.src = live;
      frame.title = `${project.title} — live preview`;
      frame.loading = "lazy";
      media.append(frame);
    } else {
      const cover = document.createElement("img");
      cover.className = "project-dialog__shot";
      cover.src = coverFor(project);
      cover.alt = "";
      media.append(cover);
    }

    const tech = qs("#project-dialog-tech");
    tech.textContent = "";
    (project.tech || []).forEach((item) => {
      const chip = document.createElement("span");
      chip.textContent = item;
      tech.append(chip);
    });

    const link = qs("#project-dialog-link");
    if (live) {
      link.href = live;
      link.hidden = false;
    } else {
      link.hidden = true;
      link.removeAttribute("href");
    }

    if (!dialog.open) dialog.showModal();
  };

  /* ── cards ────────────────────────────────────────────── */
  const card = (project) => {
    const li = document.createElement("li");
    li.className = "showcase-card";

    const button = document.createElement("button");
    button.type = "button";
    button.className = "showcase-card__button";
    button.setAttribute("aria-label", `Open ${project.title}`);

    const media = document.createElement("span");
    media.className = "showcase-media";
    media.append(mediaFor(project));
    const chrome = document.createElement("span");
    chrome.className = "showcase-media__chrome";
    chrome.setAttribute("aria-hidden", "true");
    chrome.append(document.createElement("span"), document.createElement("span"), document.createElement("span"));
    media.append(chrome);
    button.append(media);

    const body = document.createElement("span");
    body.className = "showcase-card__body";

    const cat = document.createElement("span");
    cat.className = "showcase-card__cat";
    cat.textContent = LABEL[project.category] || "";
    body.append(cat);

    const title = document.createElement("span");
    title.className = "showcase-card__title";
    title.textContent = project.title;
    body.append(title);

    if (project.summary) {
      const summary = document.createElement("span");
      summary.className = "showcase-card__summary";
      summary.textContent = project.summary;
      body.append(summary);
    }

    if (Array.isArray(project.tech) && project.tech.length) {
      const tech = document.createElement("span");
      tech.className = "showcase-card__tech";
      project.tech.slice(0, 4).forEach((item) => {
        const chip = document.createElement("span");
        chip.textContent = item;
        tech.append(chip);
      });
      body.append(tech);
    }

    const cta = document.createElement("span");
    cta.className = "showcase-card__cta";
    cta.textContent = "View project ↗";
    body.append(cta);

    button.append(body);
    button.addEventListener("click", () => openProject(project));
    li.append(button);
    return li;
  };

  const miniCard = (project) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "sp-card";
    button.setAttribute("aria-label", `View ${project.title}`);

    const media = document.createElement("span");
    media.className = "sp-card__media";
    media.append(mediaFor(project, { preview: false }));
    button.append(media);

    const meta = document.createElement("span");
    meta.className = "sp-card__meta";
    const title = document.createElement("span");
    title.className = "sp-card__title";
    title.textContent = project.title;
    const tag = document.createElement("span");
    tag.className = "sp-card__tag";
    tag.textContent = project.client ? "Client project" : "Published project";
    meta.append(title, tag);
    button.append(meta);

    button.addEventListener("click", () => openProject(project));
    return button;
  };

  /* ── rendering ────────────────────────────────────────── */
  const renderStrip = () => {
    document.querySelectorAll("[data-service-projects]").forEach((holder) => {
      const slugs = (holder.getAttribute("data-service-projects") || "")
        .split(",")
        .map((slug) => slug.trim())
        .filter(Boolean);
      const list = projects.filter((project) => slugs.includes(project.category)).slice(0, 2);
      holder.textContent = "";
      if (!list.length) {
        holder.remove();
        return;
      }
      holder.setAttribute(
        "aria-label",
        `${slugs.length === 1 ? LABEL[slugs[0]] : `${LABEL[slugs[0]]} and related`} projects`
      );
      list.forEach((project) => holder.append(miniCard(project)));
    });
  };

  const renderFilters = () => {
    const bar = qs("#showcase-filters");
    if (!bar) return;
    bar.textContent = "";

    const all = document.createElement("button");
    all.type = "button";
    all.className = "showcase-filter is-active";
    all.dataset.filter = "all";
    all.setAttribute("role", "tab");
    all.setAttribute("aria-selected", "true");
    all.textContent = "All";
    const allCount = document.createElement("span");
    allCount.textContent = String(projects.length);
    all.append(allCount);
    bar.append(all);

    CATEGORIES.forEach((category) => {
      const count = byCategory(category.slug).length;
      const button = document.createElement("button");
      button.type = "button";
      button.className = "showcase-filter";
      button.classList.toggle("is-empty", count === 0);
      button.dataset.filter = category.slug;
      button.setAttribute("role", "tab");
      button.setAttribute("aria-selected", "false");
      button.textContent = category.label;
      if (!count) button.title = "Projects coming soon";
      const badge = document.createElement("span");
      badge.textContent = String(count);
      button.append(badge);
      bar.append(button);
    });

    bar.addEventListener("click", (event) => {
      const button = event.target.closest("button[data-filter]");
      if (!button) return;
      activeFilter = button.dataset.filter;
      bar.querySelectorAll("button").forEach((item) => {
        const on = item === button;
        item.classList.toggle("is-active", on);
        item.setAttribute("aria-selected", on ? "true" : "false");
      });
      renderGrid();
    });
  };

  const renderEmpty = (empty) => {
    if (!empty) return;
    const category = CATEGORIES.find((item) => item.slug === activeFilter);
    const label = category ? category.label : "Portfolio";
    empty.textContent = "";

    const kicker = document.createElement("p");
    kicker.className = "showcase-empty__kicker";
    kicker.textContent = label;

    const title = document.createElement("p");
    title.className = "showcase-empty__title";
    title.textContent = "Projects coming soon.";

    const note = document.createElement("p");
    note.className = "showcase-empty__note";
    note.textContent = category
      ? `We only publish real, delivered ${label} work. New projects will appear here as they are completed.`
      : "We only publish real, delivered work. New projects will appear here as they are completed.";

    empty.append(kicker, title, note);
  };

  const renderGrid = () => {
    const grid = qs("#showcase-grid");
    const empty = qs("#showcase-empty");
    if (!grid) return;

    const list = activeFilter === "all" ? projects : projects.filter((project) => project.category === activeFilter);
    grid.textContent = "";
    const nodes = [];
    list.forEach((project) => {
      const node = card(project);
      nodes.push(node);
      grid.append(node);
    });
    if (empty) {
      empty.hidden = list.length > 0;
      if (!list.length) renderEmpty(empty);
    }
    applyReveal(nodes);
  };

  const setCount = () => {
    const countEl = qs("#showcase-count");
    if (countEl) countEl.textContent = String(projects.length);
  };

  /* Read the real, static portfolio cards so there is one source of truth. */
  const readClientProjects = () => {
    const panels = [
      { root: qs("#portfolio-web"), category: "website-development" },
      { root: qs("#portfolio-app"), category: "app-development" }
    ];
    const found = [];

    panels.forEach(({ root, category }) => {
      if (!root) return;
      qsa(".portfolio-card", root).forEach((card, index) => {
        const title = qs("h3", card)?.textContent.trim();
        const description = qs(".portfolio-card__body p", card)?.textContent.trim() || "";
        const link = qs(".portfolio-card__link", card) || qs(".portfolio-card__media", card);
        const liveUrl = link?.href || "";
        const image = qs(".portfolio-card__media img", card);
        const shot = image?.getAttribute("src");
        if (!title || !liveUrl) return;
        found.push({
          id: `client-${category}-${index + 1}`,
          category,
          title,
          summary: description,
          description,
          tech: [],
          liveUrl,
          screenshots: shot ? [{ url: shot }] : [],
          client: true
        });
      });
    });

    return found;
  };

  const merge = (apiProjects) => {
    const merged = [];
    const seen = new Set();
    const seenUrls = new Set();

    const add = (project) => {
      if (!project || !LABEL[project.category]) return;
      const key = project.id || project.liveUrl || project.title;
      if (seen.has(key)) return;
      const urlKey = String(project.liveUrl || "").replace(/\/$/, "").toLowerCase();
      if (urlKey && seenUrls.has(urlKey)) return;
      seen.add(key);
      if (urlKey) seenUrls.add(urlKey);
      merged.push(project);
    };

    readClientProjects().forEach(add);
    CLIENT_PROJECTS.forEach(add);
    (Array.isArray(apiProjects) ? apiProjects : []).forEach(add);
    return merged;
  };

  const show = (apiProjects) => {
    projects = merge(apiProjects);
    setCount();
    renderStrip();
    renderFilters();
    renderGrid();
  };

  const init = () => {
    const root = qs("#service-projects");
    if (!root) return;

    const dialog = qs("#project-dialog");
    if (dialog) {
      const close = qs("#project-dialog-close");
      close?.addEventListener("click", () => dialog.close());
      dialog.addEventListener("click", (event) => {
        if (event.target === dialog) dialog.close();
      });
    }

    fetch("/api/projects", { headers: { Accept: "application/json" } })
      .then((response) => {
        if (!response.ok) throw new Error(`status ${response.status}`);
        return response.json();
      })
      .then((data) => {
        const list = Array.isArray(data.projects) ? data.projects : [];
        show(list);
      })
      .catch(() => show([]));
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init, { once: true });
  } else {
    init();
  }
})();
