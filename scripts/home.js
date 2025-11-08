document.addEventListener("DOMContentLoaded", () => {
  const toggle = document.querySelector('[data-toggle="nav"]');
  const header = document.querySelector("header");
  const navList = document.querySelector(".navList");

  if (!toggle || !header || !navList) return;

  const closeMenu = () => {
    toggle.setAttribute("aria-expanded", "false");
    header.removeAttribute("aria-expanded");
    toggle.setAttribute("aria-label", "Open menu");
  };

  const openMenu = () => {
    toggle.setAttribute("aria-expanded", "true");
    header.setAttribute("aria-expanded", "true");
    toggle.setAttribute("aria-label", "Close menu");
  };

  toggle.addEventListener("click", (e) => {
    const expanded = toggle.getAttribute("aria-expanded") === "true";
    if (expanded) closeMenu();
    else openMenu();
  });

  // close on outside click
  document.addEventListener("click", (e) => {
    if (!header.contains(e.target)) closeMenu();
  });

  // close on escape
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeMenu();
  });
});

/* Simple MVC for Services and Testimonials */
const App = (() => {
  // Models
  const servicesOffered = [];
  const testimonialsModel = [];
  // store team members in an object array named `teamMembers`
  const teamMembers = [];
  const projectsModel = [];

  // Views
  function renderServices(containerId = "services-list") {
    const container = document.getElementById(containerId);
    if (!container) return;
    container.innerHTML = "";
    servicesOffered.forEach((s, i) => {
      const cardWrap = document.createElement("div");
      cardWrap.className = "svsItem reveal";
      cardWrap.style.animationDelay = i * 60 + "ms";
      const card = document.createElement("article");
      card.className = "card";
      card.innerHTML = `
        ${
          s.image
            ? `<img src="${s.image}" alt="${escapeHtml(
                s.title
              )}" loading="lazy"/>`
            : ""
        }
        <div class="card-body">
          <h3>${escapeHtml(s.title)}</h3>
          <p class="muted">${escapeHtml(s.description)}</p>
        </div>`;
      cardWrap.appendChild(card);
      // wrap with a link to build page so clicking a service opens the build form
      const link = document.createElement("a");
      link.href = `build.html?serviceId=${encodeURIComponent(s.id)}`;
      link.className = "service-link-wrap";
      link.appendChild(cardWrap);
      container.appendChild(link);
    });
  }

  function renderTestimonials(containerId = "testimonials-list") {
    const container = document.getElementById(containerId);
    if (!container) return;
    container.innerHTML = "";
    let changed = false;
    testimonialsModel.forEach((t, i) => {
      // ensure there is a numeric rating 0-100; if missing, generate a random one and persist
      if (
        typeof t.rating === "undefined" ||
        t.rating === null ||
        isNaN(Number(t.rating))
      ) {
        t.rating = Math.floor(Math.random() * 36) + 60; // random 60-95
        changed = true;
      }

      const node = document.createElement("article");
      node.className = "testimonial-card tweet-style reveal";
      node.style.animationDelay = i * 70 + "ms";

      // compute star rating from stored rating (0-100) -> 0-5 scale
      const score = Number(t.rating || 0);
      const normalized = Math.max(0, Math.min(100, score)) / 10; // 0-10
      const starsRounded = Math.round(normalized / 2); // 0-5 integer
      const full = starsRounded;
      const empty = 5 - full;
      const starStr = "★".repeat(full) + "☆".repeat(empty);

      node.innerHTML = `
        <div class="tweet">
          <img class="avatar" src="${escapeHtml(
            t.avatar || "images/icons/default-avatar.svg"
          )}" alt="${escapeHtml(t.name)} avatar" />
          <div class="tweet-body">
            <div class="tweet-header"><strong>${escapeHtml(
              t.name
            )}</strong> <span class="role">${escapeHtml(
        t.role || ""
      )}</span> <span class="rating">${starStr} <small class="muted">(${(
        Math.round((normalized / 2) * 10) / 10
      ).toFixed(1)}/5)</small></span></div>
            <p class="quote">${escapeHtml(t.comment)}</p>
          </div>
        </div>`;
      container.appendChild(node);
    });
    if (changed) save();
  }

  function renderProjects(containerId = "projects-list") {
    const container = document.getElementById(containerId);
    if (!container) return;
    container.innerHTML = "";
    projectsModel.forEach((p, i) => {
      const wrap = document.createElement("div");
      wrap.className = "svsItem reveal";
      wrap.style.animationDelay = i * 60 + "ms";
      const card = document.createElement("article");
      card.className = "card";
      card.innerHTML = `
        ${
          p.image
            ? `<img src="${p.image}" alt="${escapeHtml(
                p.title
              )}" loading="lazy"/>`
            : ""
        }
        <div class="card-body">
          <h3>${escapeHtml(p.title)}</h3>
          <p class="muted">${escapeHtml(p.description || "")}</p>
          ${
            p.link
              ? `<p><a href="${escapeHtml(
                  p.link
                )}" target="_blank" rel="noopener" class="button-like">View Project</a></p>`
              : ""
          }
        </div>`;
      wrap.appendChild(card);
      container.appendChild(wrap);
    });
  }

  function renderTeam(containerId = "team-list") {
    const container = document.getElementById(containerId);
    if (!container) return;
    container.innerHTML = "";
    teamMembers.forEach((m, i) => {
      const wrap = document.createElement("div");
      wrap.className = "team-card reveal";
      wrap.style.animationDelay = i * 60 + "ms";

      // portfolio link (if missing, use '#')
      const href = m.portfolio ? m.portfolio : "#";

      wrap.innerHTML = `
        <a class="team-card-link" href="${escapeHtml(
          href
        )}" target="_blank" rel="noopener">
          <img class="team-avatar" src="${escapeHtml(
            m.avatar || "images/icons/default-avatar.svg"
          )}" alt="${escapeHtml(m.name)}" />
          <div class="team-body">
            <h3 class="team-name">${escapeHtml(m.name)}</h3>
            <p class="team-role">${escapeHtml(m.role || "")}</p>
          </div>
        </a>`;
      container.appendChild(wrap);
    });
  }

  // Controller
  function addService(item) {
    servicesOffered.push(item);
    renderServices();
    save();
  }
  function setServices(items) {
    servicesOffered.length = 0;
    servicesOffered.push(...items);
    renderServices();
    save();
  }
  function updateService(item) {
    const idx = servicesOffered.findIndex((s) => s.id === item.id);
    if (idx > -1) {
      servicesOffered[idx] = Object.assign({}, servicesOffered[idx], item);
      save();
      renderServices();
    }
  }
  function addTestimonial(item) {
    testimonialsModel.push(item);
    renderTestimonials();
    save();
  }
  function addProject(item) {
    projectsModel.push(item);
    renderProjects();
    save();
  }
  function updateProject(item) {
    const idx = projectsModel.findIndex((p) => p.id === item.id);
    if (idx > -1) {
      projectsModel[idx] = Object.assign({}, projectsModel[idx], item);
      save();
      renderProjects();
    }
  }
  function setProjects(items) {
    projectsModel.length = 0;
    projectsModel.push(...items);
    renderProjects();
    save();
  }
  function addTeam(item) {
    teamMembers.push(item);
    renderTeam();
    save();
  }
  function setTeam(items) {
    teamMembers.length = 0;
    teamMembers.push(...items);
    renderTeam();
    save();
  }
  function updateTeam(item) {
    const idx = teamMembers.findIndex((t) => t.id === item.id);
    if (idx > -1) {
      teamMembers[idx] = Object.assign({}, teamMembers[idx], item);
      save();
      renderTeam();
    }
  }

  // move a team member to a new index (0-based). Use for ranking where rank1 === index 0
  function moveTeam(id, newIndex) {
    const idx = teamMembers.findIndex((t) => t.id === id);
    if (idx === -1) return;
    const item = teamMembers.splice(idx, 1)[0];
    // bound newIndex between 0 and current length
    const bounded = Math.max(0, Math.min(newIndex, teamMembers.length));
    teamMembers.splice(bounded, 0, item);
    save();
    renderTeam();
  }
  function setTestimonials(items) {
    testimonialsModel.length = 0;
    testimonialsModel.push(...items);
    renderTestimonials();
    save();
  }

  function updateTestimonial(item) {
    const idx = testimonialsModel.findIndex((t) => t.id === item.id);
    if (idx > -1) {
      testimonialsModel[idx] = Object.assign({}, testimonialsModel[idx], item);
      save();
      renderTestimonials();
    }
  }

  // storage
  function save() {
    try {
      localStorage.setItem(
        "naivacom-services",
        JSON.stringify(servicesOffered)
      );
      localStorage.setItem(
        "naivacom-testimonials",
        JSON.stringify(testimonialsModel)
      );
      localStorage.setItem("naivacom-projects", JSON.stringify(projectsModel));
      localStorage.setItem("naivacom-team", JSON.stringify(teamMembers));
    } catch (e) {
      console.warn("Could not save data", e);
    }
  }

  // Optional remote sync adapter (clients can call App.setRemoteEndpoint(url, key))
  // When configured, save() will attempt to push the full data to the endpoint
  // and App.init() will try to fetch remote data to seed the app.
  let remoteEndpoint = null; // e.g. https://api.example.com/naivacom
  let remoteSecretKey = null; // optional auth key/header identifier

  async function remoteSave() {
    if (!remoteEndpoint) return;
    // notify listeners
    try {
      window.dispatchEvent(
        new CustomEvent("naivacom:process", {
          detail: { message: `remoteSave -> starting PUT ${remoteEndpoint}` },
        })
      );
    } catch (e) {}
    try {
      // attach updatedAt timestamps to items if missing
      const stamp = () => new Date().toISOString();
      const attach = (arr) =>
        arr.map((it) =>
          it && it.updatedAt
            ? it
            : Object.assign({}, it, { updatedAt: it.updatedAt || stamp() })
        );

      const payload = {
        services: attach(servicesOffered.slice()),
        testimonials: attach(testimonialsModel.slice()),
        projects: attach(projectsModel.slice()),
        team: attach(teamMembers.slice()),
        meta: { exportedAt: new Date().toISOString() },
      };
      const headers = { "Content-Type": "application/json" };
      if (remoteSecretKey) headers["X-NaivaCom-Key"] = remoteSecretKey;
      const res = await fetch(remoteEndpoint, {
        method: "PUT",
        headers,
        body: JSON.stringify(payload),
        cache: "no-store",
      });
      if (!res || !res.ok) {
        try {
          window.dispatchEvent(
            new CustomEvent("naivacom:process", {
              detail: {
                message: `remoteSave -> failed status ${res && res.status}`,
              },
            })
          );
        } catch (e) {}
        return false;
      }
      try {
        window.dispatchEvent(
          new CustomEvent("naivacom:process", {
            detail: { message: `remoteSave -> success` },
          })
        );
      } catch (e) {}
      return true;
    } catch (e) {
      // don't throw - network may not be available; log for debugging
      console.warn("Remote save failed", e);
      try {
        window.dispatchEvent(
          new CustomEvent("naivacom:process", {
            detail: { message: `remoteSave -> failed ${e && e.message}` },
          })
        );
      } catch (er) {}
      return false;
    }
  }

  async function remoteFetch() {
    if (!remoteEndpoint) return null;
    try {
      window.dispatchEvent(
        new CustomEvent("naivacom:process", {
          detail: { message: `remoteFetch -> GET ${remoteEndpoint}` },
        })
      );
    } catch (e) {}
    try {
      const headers = {};
      if (remoteSecretKey) headers["X-NaivaCom-Key"] = remoteSecretKey;
      const res = await fetch(remoteEndpoint, {
        method: "GET",
        headers,
        cache: "no-store",
      });
      if (!res.ok) throw new Error("Remote fetch failed: " + res.status);
      const data = await res.json();
      try {
        window.dispatchEvent(
          new CustomEvent("naivacom:process", {
            detail: { message: `remoteFetch -> success (received)` },
          })
        );
      } catch (e) {}
      return data;
    } catch (e) {
      console.warn("Remote fetch failed", e);
      try {
        window.dispatchEvent(
          new CustomEvent("naivacom:process", {
            detail: { message: `remoteFetch -> failed ${e && e.message}` },
          })
        );
      } catch (er) {}
      return null;
    }
  }

  function load() {
    try {
      const s = JSON.parse(localStorage.getItem("naivacom-services") || "null");
      const t = JSON.parse(
        localStorage.getItem("naivacom-testimonials") || "null"
      );
      const p = JSON.parse(localStorage.getItem("naivacom-projects") || "null");
      if (Array.isArray(s) && s.length) {
        servicesOffered.length = 0;
        servicesOffered.push(...s);
      }
      if (Array.isArray(t) && t.length) {
        testimonialsModel.length = 0;
        testimonialsModel.push(...t);
      }
      if (Array.isArray(p) && p.length) {
        projectsModel.length = 0;
        projectsModel.push(...p);
      }
      const tm = JSON.parse(localStorage.getItem("naivacom-team") || "null");
      if (Array.isArray(tm) && tm.length) {
        teamMembers.length = 0;
        teamMembers.push(...tm);
      }
    } catch (e) {
      console.warn("Could not load stored data", e);
    }
  }

  // Try to fetch remote data and merge into local models if remote endpoint is configured.
  // Merge strategy: last-write-wins using `updatedAt` timestamps on items; if remote items have newer updatedAt, they replace local ones.
  async function tryLoadRemoteAndMerge() {
    const remote = await remoteFetch();
    if (!remote) return;
    try {
      const mergeArray = (localArr, remoteArr) => {
        // build map by id
        const map = new Map();
        (localArr || []).forEach((it) => map.set(String(it.id), it));
        (remoteArr || []).forEach((it) => {
          const id = String(it.id);
          const local = map.get(id);
          // if local missing, accept remote
          if (!local) {
            map.set(id, it);
            return;
          }
          // compare updatedAt if present
          const localTS = local.updatedAt ? Date.parse(local.updatedAt) : 0;
          const remoteTS = it.updatedAt ? Date.parse(it.updatedAt) : 0;
          if (remoteTS >= localTS) {
            map.set(id, it);
          }
        });
        // return array sorted: keep remote order if provided, else local order
        const out = [];
        if (Array.isArray(remoteArr) && remoteArr.length) {
          remoteArr.forEach((it) => {
            const v = map.get(String(it.id));
            if (v) out.push(v);
          });
          // include any locals not in remote
          localArr.forEach((it) => {
            if (!remoteArr.find((r) => String(r.id) === String(it.id)))
              out.push(it);
          });
        } else {
          out.push(...localArr);
        }
        return out;
      };

      if (Array.isArray(remote.services) && remote.services.length) {
        const merged = mergeArray(servicesOffered.slice(), remote.services);
        servicesOffered.length = 0;
        servicesOffered.push(...merged);
        save();
      }
      if (Array.isArray(remote.testimonials) && remote.testimonials.length) {
        const merged = mergeArray(
          testimonialsModel.slice(),
          remote.testimonials
        );
        testimonialsModel.length = 0;
        testimonialsModel.push(...merged);
        save();
      }
      if (Array.isArray(remote.projects) && remote.projects.length) {
        const merged = mergeArray(projectsModel.slice(), remote.projects);
        projectsModel.length = 0;
        projectsModel.push(...merged);
        save();
      }
      if (Array.isArray(remote.team) && remote.team.length) {
        const merged = mergeArray(teamMembers.slice(), remote.team);
        teamMembers.length = 0;
        teamMembers.push(...merged);
        save();
      }
      // attach a top-level marker indicating when remote data was loaded
      try {
        window.dispatchEvent(
          new CustomEvent("naivacom:process", {
            detail: { message: `tryLoadRemoteAndMerge -> merged remote data` },
          })
        );
      } catch (e) {}
    } catch (e) {
      console.warn("Failed to merge remote data", e);
    }
    // announce that remote data was loaded
    try {
      window.dispatchEvent(
        new CustomEvent("naivacom:remoteLoaded", {
          detail: { at: new Date().toISOString() },
        })
      );
    } catch (e) {}
  }

  // Utilities
  function escapeHtml(str) {
    if (!str) return "";
    return String(str).replace(
      /[&<>"']/g,
      (s) =>
        ({
          "&": "&amp;",
          "<": "&lt;",
          ">": "&gt;",
          '"': "&quot;",
          "'": "&#39;",
        }[s])
    );
  }

  // initial sample data
  const sampleServices = [
    {
      id: 1,
      title: "Custom Web Development",
      description:
        "Responsive, accessible, and scalable web apps built to your spec.",
      image: "images/webDevcard.webp",
    },
    {
      id: 2,
      title: "UI / UX Design",
      description:
        "Design systems and interfaces that convert users into customers.",
      image: "images/webDevcard.webp",
    },
    {
      id: 3,
      title: "E-commerce Solutions",
      description:
        "Secure online stores with payment integrations and analytics.",
      image: "images/webDevcard.webp",
    },
    {
      id: 4,
      title: "Performance & SEO",
      description:
        "Speed, optimization, and search improvements that drive traffic.",
      image: "images/webDevcard.webp",
    },
  ];

  const sampleTestimonials = [
    {
      id: 1,
      name: "Aisha Mwangi",
      role: "Founder, Acme Foods",
      comment:
        "NaivaCom delivered a modern store that increased online orders by 83%, communication and delivery were excellent.",
    },
    {
      id: 2,
      name: "John Otieno",
      role: "CTO, Atlas Logistics",
      comment:
        "Their team rebuilt our dashboard with clear UX improvements and measurable performance gains.",
    },
    {
      id: 3,
      name: "Marta Kimani",
      role: "Marketing Lead, BrightMedia",
      comment:
        "Professional, timely and strategic, our conversion rate improved after the redesign.",
    },
  ];
  const sampleProjects = [
    {
      id: 1,
      title: "NaivaCom Portfolio Site",
      description:
        "A responsive marketing site built with performance in mind.",
      image: "images/webDevcard.webp",
      link: "#",
    },
    {
      id: 2,
      title: "E-commerce Demo",
      description: "A secure demo storefront with payment integration.",
      image: "images/webDevcard.webp",
      link: "#",
    },
  ];

  const sampleTeam = [
    {
      id: 1,
      name: "Aisha Mwangi",
      role: "Founder & CEO",
      avatar: "images/icons/default-avatar.svg",
      portfolio: "#",
    },
    {
      id: 2,
      name: "John Otieno",
      role: "Chief Technology Officer",
      avatar: "images/icons/default-avatar.svg",
      portfolio: "#",
    },
    {
      id: 3,
      name: "Marta Kimani",
      role: "Lead Product Designer",
      avatar: "images/icons/default-avatar.svg",
      portfolio: "#",
    },
  ];

  // public API
  return {
    async init() {
      load();

      // if a remote endpoint/key was saved by the admin UI, restore it so visitors can auto-load
      try {
        const savedEndpoint = localStorage.getItem("naivacom-remote-endpoint");
        const savedKey = localStorage.getItem("naivacom-remote-key");
        if (savedEndpoint) {
          // configure internal remote adapter
          remoteEndpoint = savedEndpoint;
          remoteSecretKey = savedKey || null;
          // attempt to fetch and merge remote data; if it fails continue with local
          await tryLoadRemoteAndMerge();
        }
      } catch (e) {
        // swallow errors - don't break page load
        console.warn("Failed to restore remote config", e);
      }

      // if no saved data, seed with samples
      if (!servicesOffered.length) setServices(sampleServices);
      else renderServices();
      if (!testimonialsModel.length) setTestimonials(sampleTestimonials);
      else renderTestimonials();
      if (!projectsModel.length) setProjects(sampleProjects);
      else renderProjects();
      if (!teamMembers.length) setTeam(sampleTeam);
      else renderTeam();
    },
    addService,
    addTestimonial,
    addProject,
    setServices,
    setTestimonials,
    setProjects,
    getServices: () => servicesOffered.slice(),
    getTestimonials: () => testimonialsModel.slice(),
    getProjects: () => projectsModel.slice(),
    getTeams: () => teamMembers.slice(),
    deleteService(id) {
      const idx = servicesOffered.findIndex((s) => s.id === id);
      if (idx > -1) {
        servicesOffered.splice(idx, 1);
        save();
        renderServices();
      }
    },
    deleteTestimonial(id) {
      const idx = testimonialsModel.findIndex((t) => t.id === id);
      if (idx > -1) {
        testimonialsModel.splice(idx, 1);
        save();
        renderTestimonials();
      }
    },
    deleteProject(id) {
      const idx = projectsModel.findIndex((p) => p.id === id);
      if (idx > -1) {
        projectsModel.splice(idx, 1);
        save();
        renderProjects();
      }
    },
    deleteTeam(id) {
      const idx = teamMembers.findIndex((t) => t.id === id);
      if (idx > -1) {
        teamMembers.splice(idx, 1);
        save();
        renderTeam();
      }
    },
    addTeam,
    updateTeam,
    moveTeam,
    updateService,
    updateProject,
    updateTestimonial,
    setTeam,
    // Remote sync API (optional): configure a server endpoint to centralize changes
    setRemoteEndpoint(url, secretKey) {
      remoteEndpoint = url || null;
      remoteSecretKey = secretKey || null;
    },
    // Trigger a one-off sync to push local state to remote endpoint
    async syncNow() {
      try {
        const ok = await remoteSave();
        return !!ok;
      } catch (e) {
        return false;
      }
    },
  };
})();

// auto-init
document.addEventListener("DOMContentLoaded", () => {
  App.init();
  // show a small banner when remote data is loaded
  window.addEventListener("naivacom:remoteLoaded", (e) => {
    try {
      const at = (e && e.detail && e.detail.at) || new Date().toISOString();
      // banner
      const existing = document.querySelector(".remote-sync-banner");
      if (existing) existing.remove();
      const b = document.createElement("div");
      b.className = "remote-sync-banner ok";
      b.textContent = `Data loaded from central server ${new Date(
        at
      ).toLocaleString()}`;
      document.body.appendChild(b);
      setTimeout(() => {
        b.classList.remove("ok");
      }, 7000);

      // add a small hint in contacts/footer area if present
      const hint = document.createElement("div");
      hint.className = "remote-sync-hint";
      hint.textContent = `Central data loaded ${new Date(at).toLocaleString()}`;
      const footer =
        document.querySelector("footer") || document.querySelector(".contacts");
      if (footer) footer.insertBefore(hint, footer.firstChild);
    } catch (err) {
      /* ignore */
    }
  });
});

// Theme toggle: add light mode support and persist preference
(function themeToggle() {
  const btn = document.getElementById("theme-toggle");
  if (!btn) return;
  const root = document.documentElement;

  function applyTheme(theme) {
    if (theme === "light") {
      root.classList.add("light");
      btn.textContent = "☀️";
      btn.setAttribute("aria-pressed", "true");
      btn.setAttribute("aria-label", "Switch to dark mode");
    } else {
      root.classList.remove("light");
      btn.textContent = "🌙";
      btn.setAttribute("aria-pressed", "false");
      btn.setAttribute("aria-label", "Switch to light mode");
    }
  }

  // load saved preference
  const saved = localStorage.getItem("naivacom-theme");
  if (saved) applyTheme(saved);

  btn.addEventListener("click", () => {
    const isLight = root.classList.contains("light");
    const next = isLight ? "dark" : "light";
    applyTheme(next);
    localStorage.setItem("naivacom-theme", next);
  });
})();

/* UX Improvements: lazy-load hero video and smooth-scroll */
(function heroVideoLazy() {
  const vid = document.getElementById("hero-video");
  if (!vid) return;

  // choose video source based on devicePixelRatio and network
  const dpr = window.devicePixelRatio || 1;
  const connection =
    navigator.connection ||
    navigator.mozConnection ||
    navigator.webkitConnection ||
    {};
  const saveData = connection.saveData || false;
  let preferHigh = dpr >= 2 && !saveData;

  const sources = [];
  // prefer 4k for high DPR on good connections
  if (preferHigh) {
    sources.push({
      src: "videos/demonstrationVideo_4k.mp4",
      type: "video/mp4",
    });
  }
  // fallback HD
  sources.push({
    src: "videos/demonstrationVideo_1080.mp4",
    type: "video/mp4",
  });

  // IntersectionObserver to lazy-load when hero is visible
  const obs = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          // load the first existing source
          (async () => {
            for (const s of sources) {
              try {
                // quick existence check via fetch HEAD for same-origin
                const res = await fetch(s.src, { method: "HEAD" });
                if (res && res.ok) {
                  const sourceEl = document.createElement("source");
                  sourceEl.src = s.src;
                  sourceEl.type = s.type;
                  vid.appendChild(sourceEl);
                  vid.load();
                  break;
                }
              } catch (e) {
                /* ignore and try next */
              }
            }
          })();
          obs.disconnect();
        }
      });
    },
    { rootMargin: "200px" }
  );

  obs.observe(vid);

  // Smooth scroll for anchor clicks
  if ("scrollBehavior" in document.documentElement.style) {
    document.documentElement.style.scrollBehavior = "smooth";
  }

  // Respect prefers-reduced-motion
  const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
  if (mediaQuery.matches) {
    document.documentElement.style.scrollBehavior = "auto";
  }
})();
