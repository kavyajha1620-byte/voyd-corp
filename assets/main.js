(() => {
  const root = document.documentElement;
  const qs = (selector, context = document) => context.querySelector(selector);
  const qsa = (selector, context = document) => Array.from(context.querySelectorAll(selector));
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)");
  const clamp = (value, min, max) => Math.min(Math.max(value, min), max);
  const randomItem = (items) => items[Math.floor(Math.random() * items.length)];

  const caseStudies = {
    saffron: {
      title: "Saffron & Stone",
      category: "Hospitality / Concept",
      summary: "A restaurant site that trades the usual menu grid for appetite, atmosphere, and a reason to book.",
      role: "Design & front-end concept",
      scope: "One-page site, menu hierarchy, booking flow",
      build: "HTML, CSS, light JavaScript",
      year: "2026",
      sections: [
        {
          label: "Objective",
          heading: "Make the restaurant feel worth an evening.",
          body: "Give a modern Indian restaurant a web presence that feels as considered as its dining room, and make the path from curiosity to reservation obvious."
        },
        {
          label: "The problem",
          heading: "Most restaurant sites stop at the menu.",
          body: "They show what is served, but not why the place is worth the trip. The useful details get buried, and the atmosphere never makes it off the plate."
        },
        {
          label: "The approach",
          heading: "Lead with the room, then remove the friction.",
          body: "The page is built around one editorial promise: slow evenings, full tables.",
          list: [
            "Use an oversized serif, warm ink, and a single cobalt booking action to separate atmosphere from admin.",
            "Keep the menu scannable with strong hierarchy and let the booking path stay reachable from every viewport.",
            "Choose pace over density: fewer sections, clearer moments, no autoplay carousel."
          ]
        },
        {
          label: "Key decisions",
          heading: "Fewer pages, stronger moments.",
          list: [
            "A one-page site over a multi-page build; less to maintain and faster to read.",
            "No autoplay imagery. The atmosphere comes from type, colour, and rhythm.",
            "Practical details sit close to the booking action, not buried in the footer."
          ]
        },
        {
          label: "The solution",
          heading: "A composed one-page restaurant site.",
          body: "An atmospheric first screen, a legible menu, and a booking path that stays visible without shouting. The result feels like the room before the food arrives."
        }
      ]
    },
    fieldnote: {
      title: "Fieldnote",
      category: "Editorial / Concept",
      summary: "An independent publication that makes long-form reading feel less like homework.",
      role: "Design & front-end concept",
      scope: "Editorial identity, index, article template",
      build: "Fluid type scale, reading progress, accessible navigation",
      year: "2026",
      sections: [
        {
          label: "Objective",
          heading: "A home for essays that feels calm and credible.",
          body: "Create a publication that readers can stay with for a long time, where the writing is the main event and the interface knows when to disappear."
        },
        {
          label: "The problem",
          heading: "Density is not the same as seriousness.",
          body: "Editorial sites often greet good intent with a wall of grey text, unclear navigation, and three competing calls to action. The reader leaves before the first paragraph."
        },
        {
          label: "The approach",
          heading: "Treat the front page like a contents page.",
          body: "Generous rhythm, clear categories, and one obvious lead story give the reader somewhere to begin.",
          list: [
            "Pair a bookish serif with tight sans-serif labels and a disciplined cream palette.",
            "Build a fluid type scale and comfortable reading measure that hold up on small screens.",
            "Use one accent colour only for state and action."
          ]
        },
        {
          label: "Key decisions",
          heading: "Protect the reading experience.",
          list: [
            "No pop-ups, newsletter walls, or related-content carousels.",
            "Story previews prioritise titles and ideas over decorative imagery.",
            "Reading progress and archive navigation stay quiet until they are useful."
          ]
        },
        {
          label: "The solution",
          heading: "A publication that gets out of the way.",
          body: "A strong front page, a sensible archive, and an article template built for long attention spans. It feels like paper without pretending to be paper."
        }
      ]
    },
    lumen: {
      title: "Lumen",
      category: "E-commerce / Concept",
      summary: "A skincare store that explains the product without turning the page into a laboratory report.",
      role: "Design & front-end concept",
      scope: "Storefront, product page, cart interaction",
      build: "Responsive commerce layout, accessible controls",
      year: "2026",
      sections: [
        {
          label: "Objective",
          heading: "Make a small range feel clear and desirable.",
          body: "Help a first-time customer understand the product, trust the ritual, and get to checkout without comparing twelve tabs."
        },
        {
          label: "The problem",
          heading: "Too much proof, not enough product.",
          body: "Skincare e-commerce asks people to compare ingredients, claims, routines, bundles, reviews, and delivery promises all at once. The product itself gets lost in the evidence."
        },
        {
          label: "The approach",
          heading: "One benefit first. Detail on demand.",
          body: "The product page introduces a simple promise before opening up the supporting information.",
          list: [
            "Use a simple two-column product story that separates ritual from proof.",
            "Keep the path to cart short and make quantity, price, and delivery obvious.",
            "Let ingredient details expand rather than compete with the main promise."
          ]
        },
        {
          label: "Key decisions",
          heading: "No pressure tactics.",
          list: [
            "Fewer products on the first screen; the collection is small, so the page should feel curated.",
            "No urgency timers, invented scarcity, or fake review counts.",
            "Character comes from colour and typography, not a wall of badges."
          ]
        },
        {
          label: "The solution",
          heading: "A restrained storefront with a human voice.",
          body: "A clear product story, a familiar buying flow, and enough personality to feel like a brand rather than a catalogue. The details are there when needed."
        }
      ]
    },
    northline: {
      title: "Northline",
      category: "SaaS / Concept",
      summary: "A B2B landing page that replaces abstract claims with a concrete view of the product.",
      role: "Design & front-end concept",
      scope: "Landing narrative, product visual, CTA flow",
      build: "Responsive layout, CSS interface illustration",
      year: "2026",
      sections: [
        {
          label: "Objective",
          heading: "Explain the product in one scroll.",
          body: "Give a technical operations product a credible visual language and let a non-technical buyer understand what the product actually does."
        },
        {
          label: "The problem",
          heading: "Adjectives are not a product demo.",
          body: "SaaS landing pages often sell seamless, powerful, scalable. The buyer leaves without seeing the product do the job they need it to do."
        },
        {
          label: "The approach",
          heading: "Sell a day in the product.",
          body: "The page follows the work, not the feature list.",
          list: [
            "Use a live-looking dashboard as the main visual rather than a decorative illustration.",
            "Place proof, integrations, and support next to the claims they support.",
            "Keep one primary call to action and repeat it at natural decision points."
          ]
        },
        {
          label: "Key decisions",
          heading: "Specificity over superlatives.",
          list: [
            "Dark interface for product moments; cream for reading. Contrast signals a change in mode.",
            "No invented customer logos or performance metrics in the concept.",
            "The product visual is built in CSS so the page stays lightweight and responsive."
          ]
        },
        {
          label: "The solution",
          heading: "A clear, product-led landing page.",
          body: "An immediately legible promise, a tangible interface preview, and a low-friction next step. The page gives the buyer something to point at."
        }
      ]
    }
  };

  const initPageIntro = () => {
    const intro = qs(".page-intro");
    if (!intro) return;
    window.setTimeout(() => intro.remove(), 2400);
  };

  const initHeader = () => {
    const header = qs("#site-header");
    const progress = qs("#scroll-progress-bar");
    const navLinks = qsa(".desktop-nav a");
    const sections = navLinks
      .map((link) => ({ link, section: qs(link.getAttribute("href")) }))
      .filter((item) => item.section);
    let ticking = false;

    const update = () => {
      const scrollTop = window.scrollY || root.scrollTop;
      const maxScroll = root.scrollHeight - window.innerHeight;
      const progressValue = maxScroll > 0 ? clamp(scrollTop / maxScroll, 0, 1) : 0;
      if (progress) progress.style.transform = `scaleX(${progressValue})`;
      if (header) header.classList.toggle("is-scrolled", scrollTop > 16);

      const marker = window.innerHeight * 0.34;
      let current = "";
      sections.forEach(({ link, section }) => {
        const rect = section.getBoundingClientRect();
        if (rect.top <= marker && rect.bottom > marker) {
          current = link.getAttribute("href");
        }
      });
      if (maxScroll > 0 && scrollTop >= maxScroll - 8) {
        current = sections.length ? sections[sections.length - 1].link.getAttribute("href") : current;
      }
      navLinks.forEach((link) => {
        if (link.getAttribute("href") === current) {
          link.setAttribute("aria-current", "location");
        } else {
          link.removeAttribute("aria-current");
        }
      });
      ticking = false;
    };

    const requestUpdate = () => {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(update);
    };

    window.addEventListener("scroll", requestUpdate, { passive: true });
    window.addEventListener("resize", requestUpdate);
    update();
  };

  const initMobileMenu = () => {
    const toggle = qs("#nav-toggle");
    const menu = qs("#mobile-menu");
    if (!toggle || !menu) return;

    const setOpen = (open) => {
      toggle.setAttribute("aria-expanded", String(open));
      toggle.setAttribute("aria-label", open ? "Close navigation" : "Open navigation");
      menu.classList.toggle("is-open", open);
      menu.inert = !open;
    };

    setOpen(false);

    toggle.addEventListener("click", () => {
      setOpen(toggle.getAttribute("aria-expanded") !== "true");
    });

    qsa("a", menu).forEach((link) => {
      link.addEventListener("click", () => setOpen(false));
    });

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && toggle.getAttribute("aria-expanded") === "true") {
        setOpen(false);
        toggle.focus();
      }
    });

    document.addEventListener("click", (event) => {
      if (toggle.getAttribute("aria-expanded") !== "true") return;
      if (menu.contains(event.target) || toggle.contains(event.target)) return;
      setOpen(false);
    });

    window.addEventListener("resize", () => {
      if (window.innerWidth > 980) setOpen(false);
    });
  };

  const initReveals = () => {
    const items = qsa("[data-reveal]");
    if (!("IntersectionObserver" in window) || reducedMotion.matches) {
      items.forEach((item) => item.classList.add("in-view"));
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("in-view");
          observer.unobserve(entry.target);
        });
      },
      { threshold: 0.1, rootMargin: "0px 0px -6% 0px" }
    );

    items.forEach((item) => observer.observe(item));
  };

  const initPortrait = () => {
    const stage = qs("[data-portrait-stage]");
    const tilt = qs("[data-portrait-tilt]");
    const image = qs("#hero-portrait");
    if (!stage || !tilt) return;

    if (image) {
      image.addEventListener("error", () => {
        const fallback = image.getAttribute("data-fallback");
        if (fallback && !image.src.endsWith(fallback)) {
          image.src = fallback;
        }
      });
    }

    if (!finePointer.matches || reducedMotion.matches) return;

    let scrollOffset = 0;
    let pointerX = 0;
    let pointerY = 0;
    let hovering = false;

    const apply = () => {
      const lift = hovering ? -4 : 0;
      tilt.style.transform = `translateY(${(scrollOffset + lift).toFixed(2)}px) rotateX(${(-pointerY * 3.6).toFixed(2)}deg) rotateY(${(pointerX * 4.8).toFixed(2)}deg)`;
    };

    stage.addEventListener("pointermove", (event) => {
      const rect = stage.getBoundingClientRect();
      pointerX = (event.clientX - rect.left) / rect.width - 0.5;
      pointerY = (event.clientY - rect.top) / rect.height - 0.5;
      hovering = true;
      apply();
    });

    stage.addEventListener("pointerleave", () => {
      pointerX = 0;
      pointerY = 0;
      hovering = false;
      apply();
    });

    let ticking = false;
    window.addEventListener(
      "scroll",
      () => {
        if (ticking) return;
        ticking = true;
        window.requestAnimationFrame(() => {
          scrollOffset = clamp(window.scrollY * 0.045, 0, 28);
          apply();
          ticking = false;
        });
      },
      { passive: true }
    );
  };

  const initProjectCards = () => {
    const cards = qsa(".project-card");

    cards.forEach((card) => {
      const front = qs('[data-face="front"]', card);
      const back = qs('[data-face="back"]', card);
      const flipButton = qs(".flip-button", card);
      const flipBack = qs(".flip-back", card);
      if (!front || !back || !flipButton) return;

      back.inert = true;
      back.setAttribute("aria-hidden", "true");

      const setFlipped = (flipped) => {
        card.classList.toggle("is-flipped", flipped);
        flipButton.setAttribute("aria-expanded", String(flipped));
        front.inert = flipped;
        back.inert = !flipped;
        front.setAttribute("aria-hidden", String(flipped));
        back.setAttribute("aria-hidden", String(!flipped));
        window.setTimeout(() => {
          if (flipped) {
            const target = qs("[data-open-case]", back) || flipBack;
            if (target) target.focus({ preventScroll: true });
          } else {
            flipButton.focus({ preventScroll: true });
          }
        }, 360);
      };

      flipButton.addEventListener("click", () => setFlipped(true));
      if (flipBack) flipBack.addEventListener("click", () => setFlipped(false));
      card.addEventListener("keydown", (event) => {
        if (event.key === "Escape" && card.classList.contains("is-flipped")) {
          setFlipped(false);
        }
      });
    });
  };

  const initApproachTabs = () => {
    const tabs = qsa(".approach-tab");
    if (!tabs.length) return;
    const panels = tabs.map((tab) => qs(`#${tab.getAttribute("aria-controls")}`));

    const activate = (index, moveFocus = false) => {
      tabs.forEach((tab, tabIndex) => {
        const active = tabIndex === index;
        tab.classList.toggle("is-active", active);
        tab.setAttribute("aria-selected", String(active));
        tab.tabIndex = active ? 0 : -1;
        const panel = panels[tabIndex];
        if (panel) panel.hidden = !active;
      });
      if (moveFocus) tabs[index].focus();
    };

    tabs.forEach((tab, index) => {
      tab.addEventListener("click", () => activate(index));
      tab.addEventListener("keydown", (event) => {
        let next = null;
        if (event.key === "ArrowDown" || event.key === "ArrowRight") next = (index + 1) % tabs.length;
        if (event.key === "ArrowUp" || event.key === "ArrowLeft") next = (index - 1 + tabs.length) % tabs.length;
        if (event.key === "Home") next = 0;
        if (event.key === "End") next = tabs.length - 1;
        if (next === null) return;
        event.preventDefault();
        activate(next, true);
      });
    });
  };

  const initIdeaMachine = () => {
    const machine = qs(".idea-machine");
    const button = qs("#idea-button");
    const output = qs("#idea-output");
    const reelA = qs("#idea-reel-a");
    const reelB = qs("#idea-reel-b");
    const reelC = qs("#idea-reel-c");
    if (!machine || !button || !output || !reelA || !reelB || !reelC) return;

    const audiences = [
      "a neighbourhood bakery",
      "an independent architect",
      "a weekend ceramics studio",
      "a small B2B software team",
      "a solo photographer",
      "a new skincare label",
      "a two-person design practice",
      "a local music venue"
    ];
    const goals = [
      "turn a first visit into a booking",
      "make a new product feel inevitable",
      "explain a complex service clearly",
      "sell a small collection",
      "make browsing feel like a pleasure",
      "give the brand somewhere to live",
      "make the next step obvious",
      "earn trust before the first call"
    ];
    const feelings = [
      "warm and tactile",
      "quiet and editorial",
      "sharp and confident",
      "playful but precise",
      "minimal with a wink",
      "cinematic and calm",
      "bold but useful",
      "considered from top to bottom"
    ];

    let spinning = false;

    const setReels = (values) => {
      reelA.textContent = values[0];
      reelB.textContent = values[1];
      reelC.textContent = values[2];
    };

    const setOutput = (values) => {
      output.innerHTML = `Make a website for <strong>${values[0]}</strong> to <strong>${values[1]}</strong>, feeling <strong>${values[2]}</strong>.`;
      setReels(values);
    };

    const generate = () => {
      if (spinning) return;
      const finalValues = [randomItem(audiences), randomItem(goals), randomItem(feelings)];

      if (reducedMotion.matches) {
        setOutput(finalValues);
        return;
      }

      spinning = true;
      button.disabled = true;
      machine.classList.add("is-spinning");
      let ticks = 0;
      const interval = window.setInterval(() => {
        setReels([randomItem(audiences), randomItem(goals), randomItem(feelings)]);
        ticks += 1;
        if (ticks >= 10) {
          window.clearInterval(interval);
          setOutput(finalValues);
          machine.classList.remove("is-spinning");
          button.disabled = false;
          spinning = false;
          button.querySelector("span").textContent = "Give me another";
        }
      }, 70);
    };

    button.addEventListener("click", generate);
  };

  const initTypeLab = () => {
    const stage = qs(".type-stage");
    const sample = qs("#type-sample");
    const range = qs("#type-weight");
    const output = qs("#type-weight-value");
    const grotesque = qs("#type-grotesque");
    const serif = qs("#type-serif");
    if (!stage || !sample || !range || !output || !grotesque || !serif) return;

    const updateWeight = () => {
      sample.style.fontVariationSettings = `"wght" ${range.value}`;
      output.textContent = range.value;
    };

    range.addEventListener("input", updateWeight);
    updateWeight();

    const setFace = (isSerif) => {
      stage.classList.toggle("is-serif", isSerif);
      grotesque.classList.toggle("is-active", !isSerif);
      serif.classList.toggle("is-active", isSerif);
      grotesque.setAttribute("aria-pressed", String(!isSerif));
      serif.setAttribute("aria-pressed", String(isSerif));
      range.disabled = isSerif;
      output.textContent = isSerif ? "400" : range.value;
      if (!isSerif) sample.style.fontVariationSettings = `"wght" ${range.value}`;
    };

    grotesque.addEventListener("click", () => setFace(false));
    serif.addEventListener("click", () => setFace(true));
  };

  const initColourLab = () => {
    const poster = qs("#color-poster");
    const name = qs("#palette-name");
    const swatches = qsa(".palette-swatch");
    if (!poster || !name || !swatches.length) return;

    const palettes = {
      saffron: { bg: "#e6c59f", ink: "#251b16", accent: "#d4512a", label: "Saffron" },
      cobalt: { bg: "#c7d0f6", ink: "#0d1230", accent: "#2145d8", label: "Cobalt" },
      moss: { bg: "#d9dfbe", ink: "#171c14", accent: "#536b49", label: "Moss" },
      rose: { bg: "#f0c6c0", ink: "#2a151f", accent: "#b94c68", label: "Rose" }
    };

    swatches.forEach((swatch) => {
      swatch.addEventListener("click", () => {
        const palette = palettes[swatch.dataset.palette];
        if (!palette) return;
        poster.style.setProperty("--poster-bg", palette.bg);
        poster.style.setProperty("--poster-ink", palette.ink);
        poster.style.setProperty("--poster-accent", palette.accent);
        name.textContent = palette.label;
        swatches.forEach((item) => {
          const active = item === swatch;
          item.classList.toggle("is-active", active);
          item.setAttribute("aria-pressed", String(active));
        });
      });
    });
  };

  const initOrbitLab = () => {
    const stage = qs("#orbit-stage");
    const button = qs("#orbit-toggle");
    if (!stage || !button) return;

    button.addEventListener("click", () => {
      const paused = stage.classList.toggle("is-paused");
      button.setAttribute("aria-pressed", String(paused));
      button.innerHTML = paused
        ? 'Play motion <span aria-hidden="true">▶</span>'
        : 'Pause motion <span aria-hidden="true">Ⅱ</span>';
    });
  };

  const bindMotionToggle = (sectionSelector, buttonSelector) => {
    const section = qs(sectionSelector);
    const button = qs(buttonSelector);
    if (!section || !button) return;

    button.addEventListener("click", () => {
      const paused = section.classList.toggle("is-paused");
      button.setAttribute("aria-pressed", String(paused));
      button.innerHTML = paused
        ? 'Play motion <span aria-hidden="true">▶</span>'
        : 'Pause motion <span aria-hidden="true">Ⅱ</span>';
    });
  };

  const initLoopLab = () => bindMotionToggle(".loop-lab", "#loop-toggle");

  const initFieldLab = () => {
    const stage = qs("#field-stage");
    if (!stage) return;

    const cols = 14;
    const rows = 6;
    const total = cols * rows;
    const fragment = document.createDocumentFragment();

    for (let i = 0; i < total; i += 1) {
      const row = Math.floor(i / cols);
      const col = i % cols;
      const cell = document.createElement("span");
      cell.className = "field-cell";
      cell.style.setProperty("--delay", `${(-((row + col) / (cols + rows)) * 3.4).toFixed(2)}s`);
      fragment.appendChild(cell);
    }

    stage.appendChild(fragment);
    stage.addEventListener("pointerover", (event) => {
      const cell = event.target.closest(".field-cell");
      if (!cell || cell.classList.contains("is-hit")) return;
      cell.classList.add("is-hit");
      window.setTimeout(() => cell.classList.remove("is-hit"), 620);
    });

    bindMotionToggle(".field-lab", "#field-toggle");
  };

  const initEaseLab = () => bindMotionToggle(".ease-lab", "#ease-toggle");

  const initToast = () => {
    const toast = qs("#toast");
    let timer = null;

    return (message) => {
      if (!toast) return;
      toast.textContent = message;
      toast.classList.add("is-visible");
      window.clearTimeout(timer);
      timer = window.setTimeout(() => toast.classList.remove("is-visible"), 2400);
    };
  };

  const initCopyEmail = (showToast) => {
    const button = qs("#copy-email");
    if (!button) return;

    const fallbackCopy = (text) => {
      const area = document.createElement("textarea");
      area.value = text;
      area.setAttribute("readonly", "");
      area.style.position = "fixed";
      area.style.opacity = "0";
      document.body.appendChild(area);
      area.select();
      let copied = false;
      try {
        copied = document.execCommand("copy");
      } catch (error) {
        copied = false;
      }
      area.remove();
      return copied;
    };

    button.addEventListener("click", async () => {
      const email = button.dataset.email || "";
      if (!email) return;
      let copied = false;
      if (navigator.clipboard && window.isSecureContext) {
        try {
          await navigator.clipboard.writeText(email);
          copied = true;
        } catch (error) {
          copied = false;
        }
      }
      if (!copied) copied = fallbackCopy(email);
      showToast(copied ? "Email copied to clipboard." : email);
    });
  };

  const initCaseDialog = () => {
    const dialog = qs("#case-dialog");
    const close = qs("#case-close");
    const preview = qs("#case-preview");
    const title = qs("#case-dialog-title");
    const category = qs("#case-category");
    const summary = qs("#case-summary");
    const role = qs("#case-role");
    const scope = qs("#case-scope");
    const build = qs("#case-build");
    const year = qs("#case-year");
    const body = qs("#case-body");
    const scroll = qs("#case-scroll");
    const prev = qs("#case-prev");
    const next = qs("#case-next");
    if (!dialog || !close || !preview || !title || !body) return;

    const order = Object.keys(caseStudies);
    let active = null;
    let trigger = null;

    const fill = (slug) => {
      const data = caseStudies[slug];
      if (!data) return;
      active = slug;
      title.textContent = data.title;
      category.textContent = data.category;
      summary.textContent = data.summary;
      role.textContent = data.role;
      scope.textContent = data.scope;
      build.textContent = data.build;
      year.textContent = data.year;

      preview.innerHTML = "";
      const source = qs(`.project-card[data-project="${slug}"] .project-visual`);
      if (source) {
        const clone = source.cloneNode(true);
        clone.setAttribute("aria-hidden", "true");
        preview.appendChild(clone);
      }

      body.innerHTML = data.sections
        .map((section) => {
          const paragraph = section.body ? `<p>${section.body}</p>` : "";
          const list = section.list
            ? `<ul>${section.list.map((item) => `<li>${item}</li>`).join("")}</ul>`
            : "";
          return `
            <section class="case-section">
              <h3>${section.label}</h3>
              <div>
                <h4>${section.heading}</h4>
                ${paragraph}
                ${list}
              </div>
            </section>`;
        })
        .join("");

      if (scroll) scroll.scrollTop = 0;
    };

    const open = (slug, source) => {
      if (!caseStudies[slug]) return;
      fill(slug);
      trigger = source || document.activeElement;
      if (typeof dialog.showModal === "function") {
        dialog.showModal();
      } else {
        dialog.setAttribute("open", "");
      }
      document.body.classList.add("modal-open");
      window.requestAnimationFrame(() => close.focus({ preventScroll: true }));
    };

    const closeDialog = () => {
      if (typeof dialog.close === "function") {
        dialog.close();
      } else {
        dialog.removeAttribute("open");
        document.body.classList.remove("modal-open");
      }
    };

    qsa("[data-open-case]").forEach((button) => {
      button.addEventListener("click", () => open(button.dataset.openCase, button));
    });

    close.addEventListener("click", closeDialog);

    dialog.addEventListener("click", (event) => {
      if (event.target === dialog) closeDialog();
    });

    dialog.addEventListener("close", () => {
      document.body.classList.remove("modal-open");
      if (trigger && typeof trigger.focus === "function") trigger.focus({ preventScroll: true });
      trigger = null;
      active = null;
    });

    if (prev) {
      prev.addEventListener("click", () => {
        if (!active) return;
        const index = order.indexOf(active);
        fill(order[(index - 1 + order.length) % order.length]);
      });
    }

    if (next) {
      next.addEventListener("click", () => {
        if (!active) return;
        const index = order.indexOf(active);
        fill(order[(index + 1) % order.length]);
      });
    }
  };

  const initServiceAccordion = () => {
    const services = qsa(".service");
    services.forEach((service) => {
      service.addEventListener("toggle", () => {
        if (!service.open) return;
        services.forEach((other) => {
          if (other !== service) other.open = false;
        });
      });
    });
  };

  const initYear = () => {
    const year = qs("#year");
    if (year) year.textContent = String(new Date().getFullYear());
  };

  const init = () => {
    initPageIntro();
    initHeader();
    initMobileMenu();
    initReveals();
    initPortrait();
    initProjectCards();
    initApproachTabs();
    initIdeaMachine();
    initTypeLab();
    initColourLab();
    initOrbitLab();
    initLoopLab();
    initFieldLab();
    initEaseLab();
    const showToast = initToast();
    initCopyEmail(showToast);
    initCaseDialog();
    initServiceAccordion();
    initYear();
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init, { once: true });
  } else {
    init();
  }
})();
