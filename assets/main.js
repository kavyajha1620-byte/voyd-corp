(() => {
  const root = document.documentElement;
  const qs = (selector, context = document) => context.querySelector(selector);
  const qsa = (selector, context = document) => Array.from(context.querySelectorAll(selector));
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)");
  const clamp = (value, min, max) => Math.min(Math.max(value, min), max);
  const randomItem = (items) => items[Math.floor(Math.random() * items.length)];

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
      .map((link) => {
        const href = link.getAttribute("href") || "";
        const section = href.length > 1 && href.startsWith("#") ? qs(href) : null;
        return { link, section };
      })
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
        if (link.getAttribute("aria-current") === "page") return;
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
    initServiceAccordion();
    initYear();
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init, { once: true });
  } else {
    init();
  }
})();
