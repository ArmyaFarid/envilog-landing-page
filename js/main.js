/* ==========================================================================
   enviLog — landing page interactions (vanilla JS, no dependencies)
   ========================================================================== */
(() => {
    "use strict";

    const root = document.documentElement;
    const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const finePointerQuery = window.matchMedia("(hover: hover) and (pointer: fine) and (min-width: 960px)");
    const canAnimate = () => !motionQuery.matches;
    const canHoverFx = () => canAnimate() && finePointerQuery.matches;

    /* ----------------------------------------------------------------------
       1. Copyright year
       ---------------------------------------------------------------------- */
    document.querySelectorAll("[data-year]").forEach((el) => {
        el.textContent = String(new Date().getFullYear());
    });

    /* ----------------------------------------------------------------------
       2. Hero title: wrap each word in a span (text stays identical)
       ---------------------------------------------------------------------- */
    const splitWords = (el) => {
        const words = el.textContent.trim().split(/\s+/);
        el.textContent = "";
        words.forEach((word, i) => {
            const span = document.createElement("span");
            span.className = "word";
            span.style.setProperty("--i", String(i));
            span.textContent = word;
            el.append(span);
            if (i < words.length - 1) el.append(" ");
        });
    };

    /* ----------------------------------------------------------------------
       2b. FR / EN translation. French lives in the HTML; English is below.
           Choice order: ?lang= parameter, saved choice, browser language.
       ---------------------------------------------------------------------- */
    const EN = {
        "meta.title": "enviLog | Sustainably optimize your business processes",
        "meta.description": "Sustainably optimize your business processes. enviLog has innovative expertise in processing data from the e-government sector and private companies.",
        "skip": "Skip to content",
        "nav.main": "Main navigation",
        "nav.mobile": "Mobile navigation",
        "nav.solutions": "Solutions",
        "nav.application": "Our web application",
        "nav.axes": "Our areas of focus",
        "nav.conception": "Design and development",
        "contact": "Contact us",
        "hero.title": "Sustainably optimize your business processes",
        "solutions.title": "e-Government — CRM",
        "egov.title": "e-Government",
        "egov.text": "More modern ministries and agencies.",
        "egov.tag1": "Ministry",
        "egov.tag2": "State-owned companies",
        "egov.tag3": "Smart cities",
        "egov.tag4": "Health",
        "egov.tag5": "Energy",
        "egov.tag6": "Education",
        "crm.text": "To manage their interactions with customers and prospects. Our CRM system helps your business improve customer relationships, streamline processes and increase profitability.",
        "app.lead1": "enviLog has innovative expertise in processing data from the e-government sector and private companies.",
        "app.lead2": "Every sector benefits from enviLog’s modular and flexible capabilities, so features can be tailored to specific needs.",
        "axes.sub": "We work across many sectors to offer you a cutting-edge solution",
        "axes.t1": "E-GOVERNMENT",
        "axes.t2": "HEALTH",
        "axes.t3": "MINING",
        "axes.t4": "HUMANITARIAN AND SOCIAL ACTION",
        "axes.t5": "AGRICULTURE AND LIVESTOCK",
        "axes.t6": "EDUCATION",
        "axes.t7": "PROFESSIONAL SERVICES",
        "axes.t8": "DEFENSE",
        "conception.label": "DESIGN",
        "conception.lead1": "We have cutting-edge expertise in many services, such as: information systems design and development, <span class=\"hl\">business intelligence (BI)</span> and <span class=\"hl\">artificial intelligence (AI)</span>, remote development, technology infrastructure, database administration and systems administration.",
        "conception.lead2": "Our goal is to support our clients in acquiring, managing and using their data so they can get the most value out of it.",
        "powered": "Powered by",
        "cta.title": "Take action",
        "cta.text": "Contact us for a personalized demo of our tool and discover how it can transform your decision-making process.",
        "totop": "Back to top",
    };

    const i18nTargets = [
        ["data-i18n", (el) => el.innerHTML, (el, v) => { el.innerHTML = v; }],
        ["data-i18n-label", (el) => el.getAttribute("aria-label"), (el, v) => el.setAttribute("aria-label", v)],
        ["data-i18n-content", (el) => el.getAttribute("content"), (el, v) => el.setAttribute("content", v)],
    ];

    // Snapshot the French text before anything (word split) rewrites it
    const FR = new Map();
    i18nTargets.forEach(([attr, read]) => {
        document.querySelectorAll(`[${attr}]`).forEach((el) => FR.set(`${attr}|${el.getAttribute(attr)}`, read(el)));
    });

    const langSwitch = document.querySelector("[data-lang-switch]");

    const readSavedLang = () => {
        try {
            return localStorage.getItem("lang");
        } catch {
            return null;
        }
    };

    const setLang = (lang) => {
        root.lang = lang;
        i18nTargets.forEach(([attr, , write]) => {
            document.querySelectorAll(`[${attr}]`).forEach((el) => {
                const key = el.getAttribute(attr);
                write(el, lang === "en" ? EN[key] : FR.get(`${attr}|${key}`));
            });
        });
        document.querySelectorAll("[data-split-words]").forEach(splitWords);
        if (langSwitch) {
            const next = lang === "en" ? "fr" : "en";
            langSwitch.textContent = next.toUpperCase();
            langSwitch.lang = next;
            langSwitch.setAttribute("aria-label", next === "en" ? "English (EN)" : "Français (FR)");
        }
    };

    const requestedLang = new URLSearchParams(window.location.search).get("lang")
        || readSavedLang()
        || (navigator.language.toLowerCase().startsWith("en") ? "en" : "fr");
    setLang(requestedLang === "en" ? "en" : "fr");

    langSwitch?.addEventListener("click", () => {
        const lang = root.lang === "en" ? "fr" : "en";
        setLang(lang);
        try {
            localStorage.setItem("lang", lang);
        } catch {
            // Storage blocked (private mode): the choice lasts for this page view only
        }
    });

    /* ----------------------------------------------------------------------
       3. Scroll-driven UI: nav state, progress bar, back-to-top, parallax
       ---------------------------------------------------------------------- */
    const header = document.querySelector("[data-header]");
    const progressBar = document.querySelector(".scroll-progress__bar");
    const toTop = document.querySelector("[data-to-top]");
    const hero = document.querySelector(".hero");
    const parallaxEls = Array.from(document.querySelectorAll("[data-parallax]"));

    let ticking = false;

    const updateParallax = () => {
        const enabled = canHoverFx();
        const viewportCenter = window.innerHeight / 2;
        parallaxEls.forEach((el) => {
            if (!enabled) {
                el.style.transform = "";
                return;
            }
            const rect = el.getBoundingClientRect();
            if (rect.bottom < -200 || rect.top > window.innerHeight + 200) return;
            const offset = (rect.top + rect.height / 2 - viewportCenter) * Number(el.dataset.parallax);
            el.style.transform = `translate3d(0, ${offset.toFixed(1)}px, 0)`;
        });
    };

    const onScroll = () => {
        const y = window.scrollY;
        const max = root.scrollHeight - window.innerHeight;

        header?.classList.toggle("is-scrolled", y > 40);
        if (progressBar) progressBar.style.transform = `scaleX(${max > 0 ? y / max : 0})`;
        if (toTop && hero) toTop.classList.toggle("is-shown", y > hero.offsetHeight * 0.8);
        updateParallax();
        // Above the first spied section (hero): no active link
        if (spySections.length && spySections[0].getBoundingClientRect().top > window.innerHeight * 0.5) setActive(null);

        ticking = false;
    };

    const requestScrollUpdate = () => {
        if (ticking) return;
        ticking = true;
        window.requestAnimationFrame(onScroll);
    };

    window.addEventListener("scroll", requestScrollUpdate, { passive: true });
    window.addEventListener("resize", requestScrollUpdate, { passive: true });

    /* ----------------------------------------------------------------------
       4. Mobile menu: toggle, Esc to close, focus trap, scroll lock
       ---------------------------------------------------------------------- */
    const toggle = document.querySelector("[data-menu-toggle]");
    const menu = document.querySelector("[data-mobile-menu]");
    let closeTimer = null;

    const menuFocusables = () => [toggle, ...menu.querySelectorAll("a[href]")];

    const openMenu = () => {
        window.clearTimeout(closeTimer);
        menu.hidden = false;
        // Next frame so the opacity transition runs after display changes
        window.requestAnimationFrame(() => menu.classList.add("is-open"));
        toggle.setAttribute("aria-expanded", "true");
        document.body.classList.add("is-locked");
        menu.querySelector("a[href]")?.focus();
    };

    const closeMenu = (returnFocus = true) => {
        if (menu.hidden) return;
        menu.classList.remove("is-open");
        toggle.setAttribute("aria-expanded", "false");
        document.body.classList.remove("is-locked");
        closeTimer = window.setTimeout(() => {
            menu.hidden = true;
        }, canAnimate() ? 450 : 0);
        if (returnFocus) toggle.focus();
    };

    if (toggle && menu) {
        toggle.addEventListener("click", () => {
            if (toggle.getAttribute("aria-expanded") === "true") closeMenu();
            else openMenu();
        });

        menu.addEventListener("click", (event) => {
            if (event.target.closest("a")) closeMenu(false);
        });

        document.addEventListener("keydown", (event) => {
            if (menu.hidden) return;
            if (event.key === "Escape") {
                closeMenu();
                return;
            }
            if (event.key !== "Tab") return;
            const items = menuFocusables();
            const first = items[0];
            const last = items[items.length - 1];
            if (event.shiftKey && document.activeElement === first) {
                event.preventDefault();
                last.focus();
            } else if (!event.shiftKey && document.activeElement === last) {
                event.preventDefault();
                first.focus();
            }
        });

        window.matchMedia("(min-width: 1100px)").addEventListener("change", (event) => {
            if (event.matches) closeMenu(false);
        });
    }

    /* ----------------------------------------------------------------------
       5. Scrollspy: highlight the nav link of the section in view
       ---------------------------------------------------------------------- */
    const navLinks = Array.from(document.querySelectorAll(".nav__link, .mobile-menu__link"));
    const spySections = Array.from(new Set(navLinks.map((link) => link.getAttribute("href"))))
        .map((hash) => document.querySelector(hash))
        .filter(Boolean);

    const setActive = (id) => {
        navLinks.forEach((link) => {
            const isActive = id !== null && link.getAttribute("href") === `#${id}`;
            link.classList.toggle("is-active", isActive);
            if (isActive) link.setAttribute("aria-current", "true");
            else link.removeAttribute("aria-current");
        });
    };

    if ("IntersectionObserver" in window && spySections.length) {
        const spy = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) setActive(entry.target.id);
                });
            },
            { rootMargin: "-45% 0px -50% 0px" },
        );
        spySections.forEach((section) => spy.observe(section));
    }

    /* ----------------------------------------------------------------------
       6. Scroll reveal (data-reveal, data-delay, data-stagger on parent)
       ---------------------------------------------------------------------- */
    document.querySelectorAll("[data-stagger]").forEach((parent) => {
        const step = Number(parent.dataset.stagger) || 80;
        parent.querySelectorAll(":scope > [data-reveal]").forEach((child, i) => {
            child.dataset.delay = String(i * step);
        });
    });

    const revealEls = document.querySelectorAll("[data-reveal]");
    revealEls.forEach((el) => {
        if (el.dataset.delay) el.style.setProperty("--reveal-delay", `${el.dataset.delay}ms`);
    });

    if ("IntersectionObserver" in window) {
        const revealer = new IntersectionObserver(
            (entries, observer) => {
                entries.forEach((entry) => {
                    if (!entry.isIntersecting) return;
                    entry.target.classList.add("is-visible");
                    observer.unobserve(entry.target);
                });
            },
            { rootMargin: "0px 0px -8% 0px", threshold: 0.12 },
        );
        revealEls.forEach((el) => revealer.observe(el));
    } else {
        revealEls.forEach((el) => el.classList.add("is-visible"));
    }

    onScroll();

    /* ----------------------------------------------------------------------
       7. 3D tilt on hover (hero mockup, sector tiles) — max ±8°
       ---------------------------------------------------------------------- */
    const MAX_TILT = 8;

    document.querySelectorAll("[data-tilt]").forEach((el) => {
        el.addEventListener("pointermove", (event) => {
            if (!canHoverFx()) return;
            const rect = el.getBoundingClientRect();
            const x = (event.clientX - rect.left) / rect.width - 0.5;
            const y = (event.clientY - rect.top) / rect.height - 0.5;
            el.style.transition = "transform 120ms linear";
            el.style.transform = `perspective(900px) rotateX(${(-y * MAX_TILT * 2).toFixed(2)}deg) rotateY(${(x * MAX_TILT * 2).toFixed(2)}deg)`;
        });

        el.addEventListener("pointerleave", () => {
            el.style.transition = "";
            el.style.transform = "";
        });
    });

    /* ----------------------------------------------------------------------
       8. Magnetic buttons (desktop only)
       ---------------------------------------------------------------------- */
    const MAGNET_RANGE = 8;

    document.querySelectorAll("[data-magnetic]").forEach((btn) => {
        btn.addEventListener("pointermove", (event) => {
            if (!canHoverFx()) return;
            const rect = btn.getBoundingClientRect();
            const x = ((event.clientX - rect.left) / rect.width - 0.5) * 2;
            const y = ((event.clientY - rect.top) / rect.height - 0.5) * 2;
            btn.style.transform = `translate(${(x * MAGNET_RANGE).toFixed(1)}px, ${(y * MAGNET_RANGE * 0.6).toFixed(1)}px)`;
        });

        btn.addEventListener("pointerleave", () => {
            btn.style.transform = "";
        });
    });
})();
