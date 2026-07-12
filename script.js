/**
 * script.js — Comportement du visiteur numérique de Fo Guang Shan Genève.
 *
 * Toute la donnée vient de data.js (TEMPLE_INFO, AREAS, TOUR_ITEMS).
 * Ce fichier ne contient aucun contenu textuel du temple : il se contente
 * de générer le HTML à partir des données et de gérer les interactions.
 */

(function () {
  "use strict";

  /* ------------------------------------------------------------------ */
  /* Utilitaires                                                         */
  /* ------------------------------------------------------------------ */

  const $ = (sel, root) => (root || document).querySelector(sel);
  const $$ = (sel, root) => Array.from((root || document).querySelectorAll(sel));

  function el(tag, attrs, children) {
    const node = document.createElement(tag);
    if (attrs) {
      Object.keys(attrs).forEach((key) => {
        if (key === "class") node.className = attrs[key];
        else if (key === "html") node.innerHTML = attrs[key];
        else if (key.startsWith("on") && typeof attrs[key] === "function") {
          node.addEventListener(key.slice(2), attrs[key]);
        } else {
          node.setAttribute(key, attrs[key]);
        }
      });
    }
    (children || []).forEach((child) => {
      if (child == null) return;
      node.appendChild(typeof child === "string" ? document.createTextNode(child) : child);
    });
    return node;
  }

  function formatTime(seconds) {
    if (!isFinite(seconds) || seconds < 0) seconds = 0;
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return m + ":" + String(s).padStart(2, "0");
  }

  function itemsByArea() {
    const map = {};
    AREAS.forEach((area) => (map[area] = []));
    TOUR_ITEMS.forEach((item) => {
      if (!map[item.area]) map[item.area] = [];
      map[item.area].push(item);
    });
    return map;
  }

  function findItem(id) {
    return TOUR_ITEMS.find((i) => i.id === id) || null;
  }

  function neighbours(id) {
    const idx = TOUR_ITEMS.findIndex((i) => i.id === id);
    return {
      prev: idx > 0 ? TOUR_ITEMS[idx - 1] : null,
      next: idx >= 0 && idx < TOUR_ITEMS.length - 1 ? TOUR_ITEMS[idx + 1] : null,
    };
  }

  /* ------------------------------------------------------------------ */
  /* Mémorisation de la dernière position de lecture                     */
  /* ------------------------------------------------------------------ */

  const STORAGE_KEY = "fgs-visite-derniere-position";

  function saveLastPosition(itemId) {
    try {
      localStorage.setItem(STORAGE_KEY, itemId);
    } catch (e) {
      /* stockage indisponible : tant pis, on continue sans mémoriser */
    }
  }

  function getLastPosition() {
    try {
      return localStorage.getItem(STORAGE_KEY);
    } catch (e) {
      return null;
    }
  }

  /* ------------------------------------------------------------------ */
  /* Rendu : page d'accueil                                              */
  /* ------------------------------------------------------------------ */

  function renderHome() {
    $("#hero-title").textContent = TEMPLE_INFO.name;
    $("#hero-tagline").textContent = TEMPLE_INFO.tagline;
    $("#home-intro").textContent = TEMPLE_INFO.intro;

    const howto = $("#howto-list");
    howto.innerHTML = "";
    TEMPLE_INFO.howToUse.forEach((step) => howto.appendChild(el("li", null, [step])));

    const featured = $("#featured-items");
    featured.innerHTML = "";
    TOUR_ITEMS.slice(0, 3).forEach((item) => featured.appendChild(buildTourCard(item)));
  }

  function buildTourCard(item) {
    const card = el("div", { class: "tour-card" }, [
      el("div", { class: "tour-card-media" }, [
        el("img", { src: item.image, alt: item.imageAlt, loading: "lazy" }),
      ]),
      el("div", { class: "tour-card-body" }, [
        el("span", { class: "tour-card-eyebrow" }, [item.category + " · " + item.area]),
        el("h3", { class: "tour-card-title" }, [item.title]),
        el("p", { class: "tour-card-desc" }, [item.shortDescription]),
        el("div", { class: "tour-card-actions" }, [
          el(
            "a",
            {
              href: "#visite/" + item.id,
              class: "btn btn-secondary",
              onclick: (e) => {
                e.preventDefault();
                goToView("visite", item.id);
              },
            },
            ["Voir la fiche"]
          ),
          el(
            "button",
            {
              class: "btn btn-secondary",
              onclick: () => playItem(item.id),
            },
            ["▶ Écouter"]
          ),
        ]),
      ]),
    ]);
    return card;
  }

  /* ------------------------------------------------------------------ */
  /* Rendu : sommaire latéral                                            */
  /* ------------------------------------------------------------------ */

  function renderSidebar() {
    const container = $("#sidebar-content");
    container.innerHTML = "";
    const grouped = itemsByArea();

    AREAS.forEach((area) => {
      const items = grouped[area] || [];
      if (!items.length) return;

      const wrap = el("div", { class: "toc-area" });
      const title = el(
        "button",
        { class: "toc-area-title", "aria-expanded": "true" },
        [
          el("span", null, [area]),
          el("span", { class: "toc-area-toggle-icon", "aria-hidden": "true" }, ["▾"]),
        ]
      );
      title.addEventListener("click", () => {
        const collapsed = wrap.classList.toggle("collapsed");
        title.setAttribute("aria-expanded", String(!collapsed));
      });

      const list = el(
        "ul",
        { class: "toc-list" },
        items.map((item) =>
          el("li", null, [
            el(
              "a",
              {
                href: "#visite/" + item.id,
                "data-toc-link": item.id,
                onclick: (e) => {
                  e.preventDefault();
                  goToView("visite", item.id);
                  closeMobileSidebar();
                },
              },
              [item.order + ". " + item.title]
            ),
          ])
        )
      );

      wrap.appendChild(title);
      wrap.appendChild(list);
      container.appendChild(wrap);
    });
  }

  function setCurrentTocLink(itemId) {
    $$(".toc-list a").forEach((a) => a.classList.remove("current"));
    const active = $('.toc-list a[data-toc-link="' + itemId + '"]');
    if (active) {
      active.classList.add("current");
      // S'assure que la zone correspondante n'est pas repliée
      const area = active.closest(".toc-area");
      if (area) area.classList.remove("collapsed");
    }
  }

  /* ------------------------------------------------------------------ */
  /* Rendu : vue Visite (filtres + zones + fiches détaillées)            */
  /* ------------------------------------------------------------------ */

  let activeAreaFilter = "Toutes les zones";
  let refreshScrollSpy = null; // assignée après initScrollSpy() dans init()

  function renderFilterBar() {
    const bar = $("#filter-bar");
    bar.innerHTML = "";
    const allChip = el(
      "button",
      {
        class: "filter-chip" + (activeAreaFilter === "Toutes les zones" ? " active" : ""),
        onclick: () => setAreaFilter("Toutes les zones"),
      },
      ["Toutes les zones"]
    );
    bar.appendChild(allChip);
    AREAS.forEach((area) => {
      const chip = el(
        "button",
        {
          class: "filter-chip" + (activeAreaFilter === area ? " active" : ""),
          onclick: () => setAreaFilter(area),
        },
        [area]
      );
      bar.appendChild(chip);
    });
  }

  function setAreaFilter(area) {
    activeAreaFilter = area;
    renderFilterBar();
    renderTourSections();
    if (refreshScrollSpy) requestAnimationFrame(refreshScrollSpy);
  }

  function renderTourSections() {
    const container = $("#tour-sections");
    container.innerHTML = "";
    const grouped = itemsByArea();

    AREAS.forEach((area) => {
      if (activeAreaFilter !== "Toutes les zones" && activeAreaFilter !== area) return;
      const items = grouped[area] || [];
      if (!items.length) return;

      const section = el("section", { class: "area-group", id: "zone-" + slugify(area) }, [
        el("div", { class: "area-group-head" }, [
          el("h2", null, [area]),
          el("span", { class: "area-group-count" }, [
            items.length + (items.length > 1 ? " éléments" : " élément"),
          ]),
        ]),
      ]);

      items.forEach((item) => section.appendChild(buildTourItem(item)));
      container.appendChild(section);
    });
  }

  function slugify(text) {
    return text
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
  }

  function buildTourItem(item) {
    const { prev, next } = neighbours(item.id);

    const article = el("article", { class: "tour-item", id: "item-" + item.id, "data-item-id": item.id }, [
      el("div", { class: "tour-item-head" }, [
        el("div", { class: "tour-item-media" }, [
          el(
            "button",
            {
              "aria-label": "Agrandir l'image : " + item.title,
              onclick: () => openImageModal(item.image, item.imageAlt),
            },
            [el("img", { src: item.image, alt: item.imageAlt, loading: "lazy" })]
          ),
          el("p", { class: "tour-item-media-caption" }, ["Touchez l'image pour l'agrandir"]),
        ]),
        el("div", { class: "tour-item-meta" }, [
          el("p", { class: "tour-item-eyebrow" }, [
            el("span", null, ["N° " + item.id]),
            el("span", { class: "sep" }, ["·"]),
            el("span", null, [item.category]),
            el("span", { class: "sep" }, ["·"]),
            el("span", null, [item.area]),
          ]),
          el("h2", { class: "tour-item-title" }, [item.title]),
          el("p", { class: "tour-item-short" }, [item.shortDescription]),
          el("div", { class: "tour-item-actions" }, [
            el(
              "button",
              { class: "btn btn-primary", onclick: () => playItem(item.id) },
              ["▶ Écouter le commentaire"]
            ),
            el(
              "a",
              { href: "#visite", class: "btn btn-secondary", onclick: (e) => { e.preventDefault(); openToc(); } },
              ["Sommaire"]
            ),
          ]),
        ]),
      ]),
      el(
        "div",
        { class: "tour-item-body" },
        item.fullText.map((para) => el("p", null, [para]))
      ),
      el("div", { class: "tour-item-nav" }, [
        prev
          ? el(
              "a",
              {
                href: "#visite/" + prev.id,
                class: "tour-item-nav-link prev",
                onclick: (e) => { e.preventDefault(); goToView("visite", prev.id); },
              },
              [
                el("span", { class: "tour-item-nav-label" }, ["← Précédent"]),
                el("span", { class: "tour-item-nav-title" }, [prev.title]),
              ]
            )
          : el("span", null, []),
        next
          ? el(
              "a",
              {
                href: "#visite/" + next.id,
                class: "tour-item-nav-link next",
                onclick: (e) => { e.preventDefault(); goToView("visite", next.id); },
              },
              [
                el("span", { class: "tour-item-nav-label" }, ["Suivant →"]),
                el("span", { class: "tour-item-nav-title" }, [next.title]),
              ]
            )
          : el("span", null, []),
      ]),
    ]);

    return article;
  }

  /* ------------------------------------------------------------------ */
  /* Rendu : Paroles du Dharma (texte long, accordéon)                   */
  /* ------------------------------------------------------------------ */

  function renderParoles() {
    const list = $("#paroles-list");
    list.innerHTML = "";
    TOUR_ITEMS.forEach((item) => {
      const details = el(
        "details",
        { class: "parole-entry", id: "parole-" + item.id },
        [
          el("summary", null, [
            el("span", null, [
              el("span", { class: "summary-eyebrow" }, ["N° " + item.id + " · " + item.area]),
              item.title,
            ]),
            el("span", { class: "parole-toggle-icon", "aria-hidden": "true" }, ["▾"]),
          ]),
          el(
            "div",
            { class: "parole-body" },
            item.fullText.map((para) => el("p", null, [para]))
          ),
        ]
      );
      list.appendChild(details);
    });
  }

  /* ------------------------------------------------------------------ */
  /* Rendu : Audioguide (liste de lecture complète)                      */
  /* ------------------------------------------------------------------ */

  function renderPlaylist() {
    const list = $("#playlist");
    list.innerHTML = "";
    TOUR_ITEMS.forEach((item) => {
      const row = el(
        "div",
        { class: "playlist-item", id: "playlist-" + item.id },
        [
          el(
            "button",
            {
              class: "playlist-play-btn",
              "aria-label": "Lire : " + item.title,
              onclick: () => playItem(item.id),
            },
            ["▶"]
          ),
          el("div", { class: "playlist-info" }, [
            el("div", { class: "playlist-title" }, [item.order + ". " + item.title]),
            el("div", { class: "playlist-meta" }, [item.area]),
          ]),
          el("div", { class: "playlist-duration" }, [formatTime(item.audioDuration)]),
        ]
      );
      list.appendChild(row);
    });
  }

  function highlightPlaylistItem(itemId) {
    $$(".playlist-item").forEach((row) => row.classList.remove("is-current"));
    const row = $("#playlist-" + itemId);
    if (row) row.classList.add("is-current");
  }

  /* ------------------------------------------------------------------ */
  /* Rendu : À propos                                                    */
  /* ------------------------------------------------------------------ */

  function renderApropos() {
    $("#apropos-intro").textContent = TEMPLE_INFO.intro;

    const opening = $("#apropos-opening");
    opening.innerHTML = "";
    TEMPLE_INFO.openingInfo.forEach((line) => opening.appendChild(el("li", null, [line])));

    const notices = $("#apropos-notices");
    notices.innerHTML = "";
    TEMPLE_INFO.notices.forEach((line) => notices.appendChild(el("li", null, [line])));

    const contact = $("#apropos-contact");
    contact.innerHTML = "";
    const c = TEMPLE_INFO.contact;
    [
      ["Adresse", c.address],
      ["Téléphone", c.phone],
      ["E-mail", c.email],
      ["Site web", c.website],
    ].forEach(([label, value]) => {
      contact.appendChild(el("dt", null, [label]));
      contact.appendChild(el("dd", null, [value]));
    });
  }

  /* ------------------------------------------------------------------ */
  /* Navigation entre vues                                               */
  /* ------------------------------------------------------------------ */

  const VIEWS = ["home", "visite", "paroles", "audioguide", "apropos"];

  function goToView(view, itemId) {
    if (VIEWS.indexOf(view) === -1) view = "home";

    VIEWS.forEach((v) => {
      const section = $("#view-" + v);
      if (section) section.hidden = v !== view;
    });

    $$(".main-nav a, [data-view-link]").forEach((a) => {
      a.classList.toggle("active", a.dataset.view === view);
    });

    closeMobileSidebar();
    window.scrollTo({ top: 0, behavior: "auto" });

    const hash = "#" + view + (itemId ? "/" + itemId : "");
    if (window.location.hash !== hash) {
      history.pushState(null, "", hash);
    }

    if (view === "visite" && itemId) {
      // Laisse le DOM se peindre avant de défiler vers la fiche
      requestAnimationFrame(() => {
        const target = $("#item-" + itemId);
        if (target) {
          target.scrollIntoView({ behavior: "smooth", block: "start" });
          setCurrentTocLink(itemId);
          saveLastPosition(itemId);
        }
      });
    }
  }

  function handleHashRoute() {
    const hash = window.location.hash.replace("#", "");
    if (!hash) return goToView("home");
    const [view, itemId] = hash.split("/");
    goToView(view, itemId);
  }

  window.addEventListener("popstate", handleHashRoute);

  /* ------------------------------------------------------------------ */
  /* Sommaire latéral — comportement tiroir mobile                       */
  /* ------------------------------------------------------------------ */

  function openMobileSidebar() {
    $("#sidebar").classList.add("open");
    $("#sidebar-backdrop").hidden = false;
    $("#hamburger-btn").setAttribute("aria-expanded", "true");
  }
  function closeMobileSidebar() {
    $("#sidebar").classList.remove("open");
    $("#sidebar-backdrop").hidden = true;
    $("#hamburger-btn").setAttribute("aria-expanded", "false");
  }
  function openToc() {
    if (window.innerWidth <= 980) openMobileSidebar();
    else $("#sidebar").scrollIntoView({ behavior: "smooth" });
  }

  /* ------------------------------------------------------------------ */
  /* Lecteur audio                                                       */
  /* ------------------------------------------------------------------ */

  const audioEl = () => $("#audio-element");
  let currentItemId = null;
  let isSeeking = false;

  function showAudioDock() {
    $("#audio-dock").hidden = false;
    document.body.classList.add("has-audio-dock");
  }
  function hideAudioDock() {
    $("#audio-dock").hidden = true;
    document.body.classList.remove("has-audio-dock");
    audioEl().pause();
  }

  function playItem(itemId) {
    const item = findItem(itemId);
    if (!item) return;

    currentItemId = itemId;
    const audio = audioEl();
    audio.src = item.audio;
    audio.playbackRate = parseFloat($("#audio-speed").value || "1");

    $("#audio-dock-eyebrow").textContent = "N° " + item.id + " · " + item.area;
    $("#audio-dock-title").textContent = item.title;
    $("#audio-duration").textContent = formatTime(item.audioDuration);
    $("#audio-seek").value = 0;
    $("#audio-current-time").textContent = "0:00";

    showAudioDock();
    highlightPlaylistItem(itemId);
    saveLastPosition(itemId);

    // La lecture ne démarre jamais toute seule à l'arrivée sur la page ;
    // ici, c'est une action explicite de la personne (clic sur Écouter),
    // donc on peut lancer la lecture.
    const playPromise = audio.play();
    if (playPromise && playPromise.catch) {
      playPromise.catch(() => {
        // Le fichier audio est un espace réservé (placeholder) tant que
        // les enregistrements définitifs ne sont pas fournis : un échec
        // de lecture ici est attendu et sans gravité.
        setPlayButtonState(false);
      });
    }
    setPlayButtonState(true);
  }

  function setPlayButtonState(isPlaying) {
    $("#audio-play-btn").textContent = isPlaying ? "❚❚" : "▶";
    $("#audio-play-btn").setAttribute("aria-label", isPlaying ? "Pause" : "Lecture");
  }

  function togglePlayPause() {
    const audio = audioEl();
    if (!currentItemId) return;
    if (audio.paused) {
      audio.play().catch(() => {});
      setPlayButtonState(true);
    } else {
      audio.pause();
      setPlayButtonState(false);
    }
  }

  function playRelative(offset) {
    if (!currentItemId) return;
    const idx = TOUR_ITEMS.findIndex((i) => i.id === currentItemId);
    const target = TOUR_ITEMS[idx + offset];
    if (target) playItem(target.id);
  }

  function initAudioPlayer() {
    const audio = audioEl();

    audio.addEventListener("timeupdate", () => {
      if (isSeeking) return;
      const item = findItem(currentItemId);
      const duration = audio.duration && isFinite(audio.duration) ? audio.duration : (item ? item.audioDuration : 0);
      const pct = duration ? (audio.currentTime / duration) * 100 : 0;
      $("#audio-seek").value = String(pct);
      $("#audio-current-time").textContent = formatTime(audio.currentTime);
    });

    audio.addEventListener("loadedmetadata", () => {
      if (isFinite(audio.duration)) {
        $("#audio-duration").textContent = formatTime(audio.duration);
      }
    });

    audio.addEventListener("ended", () => {
      setPlayButtonState(false);
      playRelative(1);
    });

    audio.addEventListener("play", () => setPlayButtonState(true));
    audio.addEventListener("pause", () => setPlayButtonState(false));

    $("#audio-play-btn").addEventListener("click", togglePlayPause);
    $("#audio-prev-btn").addEventListener("click", () => playRelative(-1));
    $("#audio-next-btn").addEventListener("click", () => playRelative(1));
    $("#audio-replay-btn").addEventListener("click", () => {
      audio.currentTime = 0;
      $("#audio-current-time").textContent = "0:00";
      $("#audio-seek").value = 0;
    });
    $("#audio-close-btn").addEventListener("click", () => {
      hideAudioDock();
      currentItemId = null;
      $$(".playlist-item").forEach((row) => row.classList.remove("is-current"));
    });

    const seek = $("#audio-seek");
    seek.addEventListener("input", () => {
      isSeeking = true;
      const item = findItem(currentItemId);
      const duration = audio.duration && isFinite(audio.duration) ? audio.duration : (item ? item.audioDuration : 0);
      $("#audio-current-time").textContent = formatTime((seek.value / 100) * duration);
    });
    seek.addEventListener("change", () => {
      const item = findItem(currentItemId);
      const duration = audio.duration && isFinite(audio.duration) ? audio.duration : (item ? item.audioDuration : 0);
      audio.currentTime = (seek.value / 100) * duration;
      isSeeking = false;
    });

    $("#audio-volume").addEventListener("input", (e) => {
      audio.volume = e.target.value / 100;
    });

    $("#audio-speed").addEventListener("change", (e) => {
      audio.playbackRate = parseFloat(e.target.value);
    });

    $("#play-all-btn").addEventListener("click", () => {
      if (TOUR_ITEMS.length) playItem(TOUR_ITEMS[0].id);
    });
  }

  /* ------------------------------------------------------------------ */
  /* Recherche                                                           */
  /* ------------------------------------------------------------------ */

  function openSearch() {
    $("#search-modal").hidden = false;
    $("#search-input").value = "";
    $("#search-results").innerHTML = '<p class="search-hint">Tapez au moins deux lettres pour lancer la recherche.</p>';
    setTimeout(() => $("#search-input").focus(), 30);
  }
  function closeSearch() {
    $("#search-modal").hidden = true;
  }

  function runSearch(query) {
    const results = $("#search-results");
    const q = query.trim().toLowerCase();
    if (q.length < 2) {
      results.innerHTML = '<p class="search-hint">Tapez au moins deux lettres pour lancer la recherche.</p>';
      return;
    }

    const matches = TOUR_ITEMS.filter((item) => {
      const haystack = [
        item.id,
        item.title,
        item.category,
        item.area,
        item.shortDescription,
        item.fullText.join(" "),
      ]
        .join(" ")
        .toLowerCase();
      return haystack.indexOf(q) !== -1;
    });

    results.innerHTML = "";
    if (!matches.length) {
      results.appendChild(el("p", { class: "search-hint" }, ["Aucun résultat pour « " + query + " »."]));
      return;
    }

    matches.forEach((item) => {
      const btn = el(
        "a",
        {
          href: "#visite/" + item.id,
          class: "search-result",
          onclick: (e) => {
            e.preventDefault();
            closeSearch();
            goToView("visite", item.id);
          },
        },
        [
          el("img", { src: item.image, alt: "", loading: "lazy" }),
          el("span", { class: "search-result-text" }, [
            el("span", { class: "search-result-title" }, [item.title]),
            el("br"),
            el("span", { class: "search-result-meta" }, ["N° " + item.id + " · " + item.category + " · " + item.area]),
            el("br"),
            el("span", { class: "search-result-desc" }, [item.shortDescription]),
          ]),
        ]
      );
      results.appendChild(btn);
    });
  }

  function initSearch() {
    const openBtn = $("#search-open-btn"); // 上排 nav 那顆已經拿掉了，這裡加個防呆，不要讓整個 initSearch 掛掉
    if (openBtn) openBtn.addEventListener("click", openSearch);
    $("#hero-search-btn").addEventListener("click", openSearch);
    $("#search-close-btn").addEventListener("click", closeSearch);
    $("#search-modal-backdrop").addEventListener("click", closeSearch);
    $("#search-input").addEventListener("input", (e) => runSearch(e.target.value));
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && !$("#search-modal").hidden) closeSearch();
      if (e.key === "Escape" && !$("#image-modal").hidden) closeImageModal();
    });
  }

  /* ------------------------------------------------------------------ */
  /* Agrandissement d'image                                              */
  /* ------------------------------------------------------------------ */

  function openImageModal(src, alt) {
    $("#image-modal-img").src = src;
    $("#image-modal-img").alt = alt;
    $("#image-modal").hidden = false;
  }
  function closeImageModal() {
    $("#image-modal").hidden = true;
    $("#image-modal-img").src = "";
  }

  function initImageModal() {
    $("#image-modal-close").addEventListener("click", closeImageModal);
    $("#image-modal-backdrop").addEventListener("click", closeImageModal);
  }

  /* ------------------------------------------------------------------ */
  /* Retour en haut                                                      */
  /* ------------------------------------------------------------------ */

  function initBackToTop() {
    const btn = $("#back-to-top");
    window.addEventListener(
      "scroll",
      () => {
        btn.hidden = window.scrollY < 480;
      },
      { passive: true }
    );
    btn.addEventListener("click", () => window.scrollTo({ top: 0, behavior: "smooth" }));
  }

  /* ------------------------------------------------------------------ */
  /* Repérage de la fiche actuellement visible (sommaire synchronisé)    */
  /* ------------------------------------------------------------------ */

  function initScrollSpy() {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const id = entry.target.dataset.itemId;
            if (id) {
              setCurrentTocLink(id);
              saveLastPosition(id);
            }
          }
        });
      },
      { rootMargin: "-30% 0px -60% 0px", threshold: 0 }
    );

    // Recrée les observateurs à chaque rendu de la liste (la liste est
    // reconstruite quand on change de filtre de zone)
    const refresh = () => {
      $$(".tour-item").forEach((node) => observer.observe(node));
    };
    refresh();
    return refresh;
  }

  /* ------------------------------------------------------------------ */
  /* En-tête : menu mobile                                               */
  /* ------------------------------------------------------------------ */

  function initHeader() {
    $("#hamburger-btn").addEventListener("click", () => {
      const isOpen = $("#sidebar").classList.contains("open");
      if (isOpen) closeMobileSidebar();
      else openMobileSidebar();
    });
    $("#sidebar-backdrop").addEventListener("click", closeMobileSidebar);
    $("#sidebar-close-btn").addEventListener("click", closeMobileSidebar);
    $("#toc-open-btn").addEventListener("click", openToc);

    $$("[data-view-link]").forEach((link) => {
      link.addEventListener("click", (e) => {
        // Les cartes avec une logique propre gèrent déjà leur propre clic ;
        // celles-ci sont les liens de navigation simples (en-tête, accueil).
        if (link.id === "hero-search-btn") return;
        e.preventDefault();
        goToView(link.dataset.view);
      });
    });
  }

  /* ------------------------------------------------------------------ */
  /* Initialisation générale                                             */
  /* ------------------------------------------------------------------ */

  function init() {
    renderHome();
    renderSidebar();
    renderFilterBar();
    renderTourSections();
    renderParoles();
    renderPlaylist();
    renderApropos();

    initHeader();
    initAudioPlayer();
    initSearch();
    initImageModal();
    initBackToTop();
    refreshScrollSpy = initScrollSpy();

    if (window.location.hash) {
      handleHashRoute();
    } else {
      const last = getLastPosition();
      goToView("home");
      if (last && findItem(last)) {
        // Propose discrètement de reprendre la lecture là où la personne
        // s'était arrêtée, sans forcer la navigation.
        const banner = el(
          "div",
          { class: "resume-banner" },
          [
            el("p", null, [
              "Vous étiez en train de consulter « " + findItem(last).title + " ». ",
            ]),
            el(
              "button",
              {
                class: "btn btn-secondary",
                onclick: () => goToView("visite", last),
              },
              ["Reprendre la visite"]
            ),
          ]
        );
        const heroSection = $("#view-home .hero");
        if (heroSection && heroSection.parentNode) {
          heroSection.parentNode.insertBefore(banner, heroSection.nextSibling);
        }
      }
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
