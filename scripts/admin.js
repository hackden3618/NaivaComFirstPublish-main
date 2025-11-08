// small admin wiring to App (exposed by scripts/home.js)
document.addEventListener("DOMContentLoaded", () => {
  // password gate logic
  const gate = document.getElementById("pw-gate");
  const pwForm = document.getElementById("pw-form");
  const pwInput = document.getElementById("pw-input");
  const pwError = document.getElementById("pw-error");
  const AUTH_KEY = "naivacom-admin-auth";

  function isAuthed() {
    return sessionStorage.getItem(AUTH_KEY) === "1";
  }
  function unlock() {
    if (gate) gate.style.display = "none";
  }
  function lock() {
    if (gate) gate.style.display = "flex";
  }

  // unlock if already authed
  if (isAuthed()) unlock();

  if (pwForm) {
    pwForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const val = pwInput.value || "";
      if (val === "komoKomo") {
        sessionStorage.setItem(AUTH_KEY, "1");
        unlock();
      } else {
        if (pwError) pwError.style.display = "block";
        if (pwError) pwError.textContent = "Wrong password";
        setTimeout(() => pwError && (pwError.style.display = "none"), 2000);
      }
    });
  }

  const svcForm = document.getElementById("service-form");
  const svcList = document.getElementById("admin-services-list");
  const projForm = document.getElementById("project-form");
  const projList = document.getElementById("admin-projects-list");
  const testForm = document.getElementById("testimonial-form");
  const testList = document.getElementById("admin-testimonials-list");

  // Team management elements: inject a small team section if not present
  const teamForm = (function createTeamForm() {
    const existing = document.getElementById("admin-team");
    if (existing) return existing.querySelector("#team-form");
    const sec = document.createElement("section");
    sec.id = "admin-team";
    sec.innerHTML = `
      <h2>Manage Your team</h2>
      <form id="team-form">
        <input name="name" placeholder="Full name" required />
        <input name="role" placeholder="Role / Title" />
        <input name="avatar" placeholder="Avatar image path (optional)" />
        <input name="portfolio" placeholder="Portfolio URL (optional)" />
        <textarea name="bio" placeholder="Short bio (optional)"></textarea>
        <button type="submit">Hire / Add team member</button>
      </form>
      <div class="list" id="admin-team-list"></div>
    `;
    const main = document.querySelector("main") || document.body;
    const clearBtnNode = document.getElementById("clear-data");
    if (clearBtnNode && main.contains(clearBtnNode))
      main.insertBefore(sec, clearBtnNode);
    else main.appendChild(sec);
    return document.getElementById("team-form");
  })();
  const teamList = document.getElementById("admin-team-list");
  const clearBtn = document.getElementById("clear-data");
  const toggleEditBtn = document.getElementById("toggle-edit");
  const editStatus = document.getElementById("edit-status");
  const toggleProcessesBtn = document.getElementById("toggle-processes");
  const processesPanel = document.getElementById("processes-panel");
  const processLog = document.getElementById("process-log");
  const clearProcessBtn = document.getElementById("clear-process-log");
  const pauseProcessBtn = document.getElementById("pause-process-log");
  let processPaused = false;

  // --- Collapsible sections helpers ---
  function getOrCreateSection(id, nodes) {
    let sec = document.getElementById(id);
    if (sec) return sec;
    // create a section wrapper and move provided nodes into it
    sec = document.createElement("section");
    sec.id = id;
    const first = nodes.find(Boolean);
    if (!first) return sec;
    const parent = first.parentNode || document.body;
    parent.insertBefore(sec, first);
    nodes.forEach((n) => {
      if (!n) return;
      sec.appendChild(n);
    });
    return sec;
  }

  function addCollapsible(sectionEl, key, title) {
    if (!sectionEl) return;
    if (sectionEl.dataset.collapsible === "1") return;
    sectionEl.dataset.collapsible = "1";
    const header = document.createElement("div");
    header.className = "admin-section-header";
    const btn = document.createElement("button");
    btn.className = "section-toggle";
    btn.type = "button";
    btn.setAttribute("aria-expanded", "true");
    btn.textContent = title;
    header.appendChild(btn);
    // collect children to move into content
    const content = document.createElement("div");
    content.className = "admin-section-content";
    // move all children into content
    while (sectionEl.firstChild) {
      content.appendChild(sectionEl.firstChild);
    }
    sectionEl.appendChild(header);
    sectionEl.appendChild(content);

    // restore collapsed state
    const collapsed =
      localStorage.getItem("naivacom-admin-collapsed-" + key) === "1";
    if (collapsed) {
      content.style.display = "none";
      btn.setAttribute("aria-expanded", "false");
    }

    btn.addEventListener("click", () => {
      const isOpen = btn.getAttribute("aria-expanded") === "true";
      if (isOpen) {
        btn.setAttribute("aria-expanded", "false");
        content.style.display = "none";
        localStorage.setItem("naivacom-admin-collapsed-" + key, "1");
      } else {
        btn.setAttribute("aria-expanded", "true");
        content.style.display = "";
        localStorage.setItem("naivacom-admin-collapsed-" + key, "0");
      }
    });
  }

  // editing is disabled by default; require explicit enable
  let editEnabled = sessionStorage.getItem("naivacom-edit-enabled") === "1";

  function setEditMode(on) {
    lock();
    editEnabled = !!on;
    sessionStorage.setItem("naivacom-edit-enabled", editEnabled ? "1" : "0");
    // enable/disable forms
    [svcForm, testForm, projForm, teamForm].forEach((f) => {
      if (!f) return;
      Array.from(f.querySelectorAll("input,textarea,button")).forEach((el) => {
        if (el.id === "toggle-edit") return;
        el.disabled = !editEnabled;
      });
    });
    if (editStatus)
      editStatus.textContent = editEnabled
        ? "Disable editing"
        : "Editing disabled";
    // update toggle-edit button label
    if (toggleEditBtn)
      toggleEditBtn.textContent = editEnabled
        ? "Disable Editing"
        : "Enable Editing";
  }

  /* -----------------------
     Generic modal & toast helpers
     ----------------------- */
  const genericModal = document.getElementById("admin-generic-modal");
  const modalTitle = genericModal && genericModal.querySelector("#modal-title");
  const modalBody = genericModal && genericModal.querySelector("#modal-body");
  const modalCancel =
    genericModal && genericModal.querySelector("#modal-cancel");
  const modalConfirm =
    genericModal && genericModal.querySelector("#modal-confirm");
  const toasts = document.getElementById("admin-toasts");

  function showToast(message, type = "info", timeout = 2800) {
    if (!toasts) return;
    const node = document.createElement("div");
    node.className = "undo-toast";
    node.textContent = message;
    toasts.appendChild(node);
    setTimeout(() => node.remove(), timeout);
  }

  function showConfirm(title, html) {
    return new Promise((resolve) => {
      if (!genericModal) return resolve(false);
      modalTitle.textContent = title || "Confirm";
      modalBody.innerHTML = `<p>${html || ""}</p>`;
      genericModal.style.display = "flex";
      modalConfirm.textContent = "Confirm";
      modalCancel.textContent = "Cancel";
      function cleanup() {
        modalConfirm.removeEventListener("click", onConfirm);
        modalCancel.removeEventListener("click", onCancel);
        genericModal.style.display = "none";
      }
      function onConfirm() {
        cleanup();
        resolve(true);
      }
      function onCancel() {
        cleanup();
        resolve(false);
      }
      modalConfirm.addEventListener("click", onConfirm);
      modalCancel.addEventListener("click", onCancel);
    });
  }

  function showPrompt(title, label, defaultValue = "") {
    return new Promise((resolve) => {
      if (!genericModal) return resolve(null);
      modalTitle.textContent = title || "Input";
      modalBody.innerHTML = `<label style="display:block;margin-bottom:8px;">${
        label || ""
      }</label><input id="_modal_input" value="${String(
        defaultValue || ""
      )}" style="width:100%;padding:8px;border-radius:6px;border:1px solid rgba(0,0,0,0.08);" />`;
      genericModal.style.display = "flex";
      modalConfirm.textContent = "OK";
      modalCancel.textContent = "Cancel";
      const input = genericModal.querySelector("#_modal_input");
      input.focus();
      function cleanup() {
        modalConfirm.removeEventListener("click", onOk);
        modalCancel.removeEventListener("click", onCancel);
        genericModal.style.display = "none";
      }
      function onOk() {
        const val = input.value;
        cleanup();
        resolve(val);
      }
      function onCancel() {
        cleanup();
        resolve(null);
      }
      modalConfirm.addEventListener("click", onOk);
      modalCancel.addEventListener("click", onCancel);
    });
  }

  // render lists for admin area (services, testimonials, projects, team)
  function renderLists() {
    // team list
    if (teamList && typeof App !== "undefined" && App.getTeams) {
      teamList.innerHTML = "";
      (App.getTeams() || []).forEach((m) => {
        const row = document.createElement("div");
        row.className = "row draggable-row";
        row.setAttribute("draggable", "true");
        row.dataset.id = String(m.id);
        row.innerHTML = `
          <span class="drag-handle" title="Drag to reorder" aria-hidden="true">≡</span>
          <div class="meta">
            <img class="thumb" src="${
              m.avatar || "images/icons/default-avatar.svg"
            }" alt="${m.name}" />
            <div>
              <strong>${m.name}</strong>
              <div class="muted-small">${m.role || ""}</div>
            </div>
          </div>
          <div>
            <button class="viewBtn" data-type="team" data-id="${
              m.id
            }">View</button>
            <button data-action="edit" data-type="team" data-id="${
              m.id
            }">Edit</button>
            <button data-action="rank" data-type="team" data-id="${
              m.id
            }">Rank</button>
            <button data-action="delete" data-type="team" data-id="${
              m.id
            }">Delete</button>
          </div>`;
        teamList.appendChild(row);
      });
    }

    // services
    if (svcList && typeof App !== "undefined" && App.getServices) {
      svcList.innerHTML = "";
      (App.getServices() || []).forEach((s) => {
        const row = document.createElement("div");
        row.className = "row";
        row.innerHTML = `
          <div class="meta">
            <img class="thumb" src="${
              s.image || "images/webDevcard.webp"
            }" alt="${s.title}" />
            <div>
              <strong>${s.title}</strong>
              <div class="muted-small">${s.description || ""}</div>
            </div>
          </div>
          <div>
            <button class="viewBtn" data-type="service" data-id="${
              s.id
            }">View</button>
            <button data-action="edit" data-type="service" data-id="${
              s.id
            }">Edit</button>
            <button data-action="delete" data-type="service" data-id="${
              s.id
            }">Delete</button>
          </div>`;
        svcList.appendChild(row);
      });
    }

    // testimonials
    if (testList && typeof App !== "undefined" && App.getTestimonials) {
      testList.innerHTML = "";
      (App.getTestimonials() || []).forEach((t) => {
        const row = document.createElement("div");
        row.className = "row";
        row.innerHTML = `
          <div class="meta">
            <img class="thumb" src="${
              t.avatar || "images/icons/default-avatar.svg"
            }" alt="${t.name}" />
            <div>
              <strong>${t.name}</strong>
              <div class="muted-small">${t.role || ""}</div>
              <div class="muted-rating">Rating: ${t.rating || ""}</div>
            </div>
          </div>
          <div>
            <button class="viewBtn" data-type="testimonial" data-id="${
              t.id
            }">View</button>
            <button data-action="edit" data-type="testimonial" data-id="${
              t.id
            }">Edit</button>
            <button data-action="delete" data-type="testimonial" data-id="${
              t.id
            }">Delete</button>
          </div>`;
        testList.appendChild(row);
      });
    }

    // projects
    if (projList && typeof App !== "undefined" && App.getProjects) {
      projList.innerHTML = "";
      (App.getProjects() || []).forEach((p) => {
        const row = document.createElement("div");
        row.className = "row";
        row.innerHTML = `
          <div class="meta">
            <img class="thumb" src="${
              p.image || "images/webDevcard.webp"
            }" alt="${p.title}" />
            <div>
              <strong>${p.title}</strong>
              <div class="muted-small">${p.description || ""}</div>
            </div>
          </div>
          <div>
            <button class="viewBtn" data-type="project" data-id="${
              p.id
            }">View</button>
            <button data-action="edit" data-type="project" data-id="${
              p.id
            }">Edit</button>
            <button data-action="delete" data-type="project" data-id="${
              p.id
            }">Delete</button>
          </div>`;
        projList.appendChild(row);
      });
    }
  }

  // Note: authentication modal and client-side gating removed ~ edits execute immediately when editing enabled

  // wire team form submit
  if (teamForm) {
    teamForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      if (!editEnabled)
        return showToast("Enable editing to add content", "info");
      const ok = await showConfirm(
        "Add team member",
        "Confirm adding this team member?"
      );
      if (!ok) return;
      const fd = new FormData(teamForm);
      const item = {
        id: Date.now(),
        name: fd.get("name"),
        role: fd.get("role") || "",
        avatar: fd.get("avatar") || "images/icons/default-avatar.svg",
        portfolio: fd.get("portfolio") || "",
        bio: fd.get("bio") || "",
      };
      if (typeof App !== "undefined" && App.addTeam) App.addTeam(item);
      teamForm.reset();
      renderLists();
      showToast("Team member added");
    });
  }

  // general delegated clicks for edit/delete/view actions
  document.body.addEventListener("click", async (e) => {
    const btn = e.target.closest("button");
    if (!btn) return;
    const action = btn.getAttribute("data-action");
    const type = btn.getAttribute("data-type");
    const id = Number(btn.getAttribute("data-id"));
    // view buttons handled by separate class
    if (btn.classList.contains("viewBtn")) return;
    if (!action || !type || !id) return;
    if (!editEnabled && action !== "view")
      return showToast("Enable editing to perform this action", "info");

    if (action === "rank") {
      if (
        type === "team" &&
        typeof App !== "undefined" &&
        App.getTeams &&
        App.moveTeam
      ) {
        const list = App.getTeams();
        const idx = list.findIndex((t) => t.id === id);
        if (idx === -1) return alert("Team member not found");
        const input = await showPrompt(
          "Set rank",
          "Set rank position (1 = top):",
          String(idx + 1)
        );
        if (!input) return;
        const n = Number(input);
        if (isNaN(n) || n < 1) return showToast("Invalid rank", "error");
        const newIndex = Math.max(0, Math.min(n - 1, list.length - 1));
        App.moveTeam(id, newIndex);
        renderLists();
      }
      return;
    }

    if (action === "delete") {
      lock();
      const okDel = await showConfirm(
        "Delete item",
        "Delete this item? This cannot be undone."
      );
      if (!okDel) return;
      if (type === "team" && App.deleteTeam) App.deleteTeam(id);
      if (type === "service" && App.deleteService) App.deleteService(id);
      if (type === "testimonial" && App.deleteTestimonial)
        App.deleteTestimonial(id);
      if (type === "project" && App.deleteProject) App.deleteProject(id);
      renderLists();
      showToast("Item deleted");
      return;
    }

    if (action === "edit") {
      lock();
      // simple prompt-based edit to keep UI small; require auth before edits
      if (type === "team" && App.getTeams && App.updateTeam) {
        const current = App.getTeams().find((t) => t.id === id);
        if (!current) return alert("Team member not found");
        const name =
          (await showPrompt("Edit name", "Name:", current.name)) ||
          current.name;
        const role =
          (await showPrompt("Edit role", "Role:", current.role || "")) ||
          current.role;
        const avatar =
          (await showPrompt(
            "Edit avatar",
            "Avatar URL:",
            current.avatar || ""
          )) || current.avatar;
        const portfolio =
          (await showPrompt(
            "Edit portfolio",
            "Portfolio URL:",
            current.portfolio || ""
          )) || current.portfolio;
        const bio =
          (await showPrompt("Edit bio", "Short bio:", current.bio || "")) ||
          current.bio;
        const updated = Object.assign({}, current, {
          name,
          role,
          avatar,
          portfolio,
          bio,
        });
        App.updateTeam(updated);
        renderLists();
      }
      if (type === "service" && App.getServices && App.updateService) {
        const current = App.getServices().find((s) => s.id === id);
        if (!current) return showToast("Service not found", "error");
        const title =
          (await showPrompt("Edit service title", "Title:", current.title)) ||
          current.title;
        const description =
          (await showPrompt(
            "Edit description",
            "Description:",
            current.description || ""
          )) || current.description;
        const image =
          (await showPrompt(
            "Edit image URL",
            "Image URL:",
            current.image || ""
          )) || current.image;
        const updated = Object.assign({}, current, {
          title,
          description,
          image,
        });
        App.updateService(updated);
        renderLists();
      }
      if (
        type === "testimonial" &&
        App.getTestimonials &&
        App.updateTestimonial
      ) {
        const current = App.getTestimonials().find((t) => t.id === id);
        if (!current) return showToast("Testimonial not found", "error");
        const name =
          (await showPrompt("Edit name", "Name:", current.name)) ||
          current.name;
        const role =
          (await showPrompt("Edit role", "Role:", current.role || "")) ||
          current.role;
        const avatar =
          (await showPrompt(
            "Edit avatar",
            "Avatar URL:",
            current.avatar || ""
          )) || current.avatar;
        const rating = Number(
          (await showPrompt(
            "Edit rating",
            "Rating 0-100:",
            current.rating || 80
          )) || current.rating
        );
        const comment =
          (await showPrompt(
            "Edit comment",
            "Comment:",
            current.comment || ""
          )) || current.comment;
        const updated = Object.assign({}, current, {
          name,
          role,
          avatar,
          rating,
          comment,
        });
        App.updateTestimonial(updated);
        renderLists();
      }
      if (type === "project" && App.getProjects && App.updateProject) {
        const current = App.getProjects().find((p) => p.id === id);
        if (!current) return showToast("Project not found", "error");
        const title =
          (await showPrompt("Edit project title", "Title:", current.title)) ||
          current.title;
        const description =
          (await showPrompt(
            "Edit description",
            "Description:",
            current.description || ""
          )) || current.description;
        const image =
          (await showPrompt(
            "Edit image URL",
            "Image URL:",
            current.image || ""
          )) || current.image;
        const link =
          (await showPrompt(
            "Edit link",
            "Project link:",
            current.link || ""
          )) || current.link;
        const updated = Object.assign({}, current, {
          title,
          description,
          image,
          link,
        });
        App.updateProject(updated);
        renderLists();
      }
    }
  });

  // make view modal
  const modal = document.createElement("div");
  modal.id = "admin-view-modal";
  modal.innerHTML = `
    <div class="overlay" tabindex="-1"></div>
    <div class="dialog" role="dialog" aria-modal="true" aria-label="Content preview">
      <button class="closeBtn" aria-label="Close">Close</button>
      <img class="preview" src="" alt="preview image" />
      <div class="meta">
        <h3 class="title"></h3>
        <p class="desc"></p>
        <p class="extra"></p>
        <p class="externalLink-wrap"><a class="externalLink button-like" href="#" target="_blank" rel="noopener">Open link</a></p>
      </div>
    </div>`;
  document.body.appendChild(modal);
  // Authentication modal removed ~ edits execute immediately when editing is enabled
  const viewModal = document.getElementById("admin-view-modal");
  const viewPreview = viewModal.querySelector("img.preview");
  const viewTitle = viewModal.querySelector(".title");
  const viewDesc = viewModal.querySelector(".desc");
  const viewExtra = viewModal.querySelector(".extra");
  const viewLink = viewModal.querySelector(".externalLink");
  const closeBtn = viewModal.querySelector(".closeBtn");

  function openViewModal(type, id) {
    let data = null;
    if (type === "service" && App.getServices)
      data = App.getServices().find((s) => s.id === id);
    if (type === "testimonial" && App.getTestimonials)
      data = App.getTestimonials().find((t) => t.id === id);
    if (type === "project" && App.getProjects)
      data = App.getProjects().find((p) => p.id === id);
    if (type === "team" && App.getTeams)
      data = App.getTeams().find((m) => m.id === id);
    if (!data) return alert("Item not found");
    viewTitle.textContent = data.title || data.name || "Preview";
    viewDesc.textContent = data.description || data.comment || data.bio || "";
    viewExtra.textContent = data.role ? `Role: ${data.role}` : "";
    if (data.avatar) {
      viewPreview.src = data.avatar;
      viewPreview.style.display = "";
    } else if (data.image) {
      viewPreview.src = data.image;
      viewPreview.style.display = "";
    } else {
      viewPreview.style.display = "none";
    }
    if (data.link || data.portfolio) {
      viewLink.href = data.link || data.portfolio;
      viewLink.style.display = "inline-block";
    } else {
      viewLink.style.display = "none";
    }
    viewModal.style.display = "flex";
    closeBtn.focus();
  }

  function closeViewModal() {
    viewModal.style.display = "none";
  }
  closeBtn.addEventListener("click", closeViewModal);
  viewModal.querySelector(".overlay").addEventListener("click", closeViewModal);
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeViewModal();
  });

  // delegated click for view buttons
  document.body.addEventListener("click", (e) => {
    const btn = e.target.closest(".viewBtn");
    if (!btn) return;
    const type = btn.getAttribute("data-type");
    const id = Number(btn.getAttribute("data-id"));
    openViewModal(type, id);
  });

  // Drag-and-drop reordering for team list
  (function wireDragDrop() {
    if (!teamList) return;
    let dragSrc = null;

    teamList.addEventListener("dragstart", (e) => {
      const row = e.target.closest(".draggable-row");
      if (!row) return;
      dragSrc = row;
      e.dataTransfer.effectAllowed = "move";
      try {
        e.dataTransfer.setData("text/plain", row.dataset.id || "");
      } catch (er) {
        /* some browsers require setData */
      }
      row.classList.add("dragging");
    });

    teamList.addEventListener("dragover", (e) => {
      e.preventDefault();
      const over = e.target.closest(".draggable-row");
      if (!over || over === dragSrc) return;
      const rect = over.getBoundingClientRect();
      const after = e.clientY > rect.top + rect.height / 2;
      if (after) {
        over.parentNode.insertBefore(dragSrc, over.nextSibling);
      } else {
        over.parentNode.insertBefore(dragSrc, over);
      }
    });

    teamList.addEventListener("drop", (e) => {
      e.preventDefault();
      const rows = Array.from(teamList.querySelectorAll(".draggable-row"));
      const ids = rows.map((r) => Number(r.dataset.id));
      // reorder team in App according to ids sequence
      if (typeof App !== "undefined" && App.getTeams && App.setTeam) {
        const current = App.getTeams();
        // build new ordered array using current items matching ids
        const newOrder = ids
          .map((id) => current.find((c) => c.id === id))
          .filter(Boolean);
        if (newOrder.length) App.setTeam(newOrder);
      } else if (typeof App !== "undefined" && App.moveTeam) {
        // fallback: call moveTeam for each id to align order
        ids.forEach((id, idx) => {
          App.moveTeam(id, idx);
        });
      }
      renderLists();
    });

    teamList.addEventListener("dragend", (e) => {
      const row = e.target.closest(".draggable-row");
      if (row) row.classList.remove("dragging");
      dragSrc = null;
    });
  })();

  // wire up other form handlers (services/testimonials/projects) if present
  if (svcForm) {
    svcForm.addEventListener("submit", (e) => {
      e.preventDefault();
      if (!editEnabled) return alert("Enable editing to add content");
      if (!confirm("Confirm adding this service?")) return;
      const fd = new FormData(svcForm);
      const item = {
        id: Date.now(),
        title: fd.get("title"),
        image: fd.get("image") || "images/webDevcard.webp",
        description: fd.get("description"),
      };
      if (App.addService) App.addService(item);
      svcForm.reset();
      renderLists();
    });
  }

  if (testForm) {
    testForm.addEventListener("submit", (e) => {
      e.preventDefault();
      if (!editEnabled) return alert("Enable editing to add content");
      if (!confirm("Confirm adding this testimonial?")) return;
      const fd = new FormData(testForm);
      const rawRating = Number(fd.get("rating") || 0);
      const item = {
        id: Date.now(),
        name: fd.get("name"),
        role: fd.get("role"),
        avatar: fd.get("avatar") || "images/icons/default-avatar.png",
        rating: rawRating,
        comment: fd.get("comment"),
      };
      if (App.addTestimonial) App.addTestimonial(item);
      testForm.reset();
      renderLists();
    });
  }

  if (projForm) {
    projForm.addEventListener("submit", (e) => {
      e.preventDefault();
      if (!editEnabled) return alert("Enable editing to add content");
      const fd = new FormData(projForm);
      const item = {
        id: Date.now(),
        title: fd.get("title"),
        image: fd.get("image") || "images/webDevcard.webp",
        link: fd.get("link") || "",
        description: fd.get("description") || "",
      };
      if (App.addProject) App.addProject(item);
      projForm.reset();
      renderLists();
    });
  }

  // delegated delete/edit for svc/test/proj/team via data-action above (handled earlier)

  if (clearBtn) {
    clearBtn.addEventListener("click", () => {
      lock();
      if (confirm("Clear stored data?")) {
        localStorage.removeItem("naivacom-services");
        localStorage.removeItem("naivacom-testimonials");
        localStorage.removeItem("naivacom-projects");
        localStorage.removeItem("naivacom-team");
        location.reload();
      }
    });
  }

  if (toggleEditBtn) {
    toggleEditBtn.addEventListener("click", () => {
      if (editEnabled) {
        if (confirm("Disable editing?")) setEditMode(false);
        return;
      }
      if (
        confirm(
          "Enable editing ~ this will allow adding and deleting site content. Continue?"
        )
      ) {
        setEditMode(true);
      }
    });
  }

  // Process log helpers
  function appendProcessLine(line) {
    if (processPaused) return;
    if (!processLog) return;
    const now = new Date().toISOString();
    processLog.textContent += `[${now}] ${line}\n`;
    processLog.scrollTop = processLog.scrollHeight;
  }

  if (toggleProcessesBtn) {
    toggleProcessesBtn.addEventListener("click", () => {
      const isOpen =
        toggleProcessesBtn.getAttribute("aria-expanded") === "true";
      if (isOpen) {
        toggleProcessesBtn.setAttribute("aria-expanded", "false");
        toggleProcessesBtn.textContent = "Show processes";
        if (processesPanel) processesPanel.style.display = "none";
      } else {
        toggleProcessesBtn.setAttribute("aria-expanded", "true");
        toggleProcessesBtn.textContent = "Hide processes";
        if (processesPanel) processesPanel.style.display = "block";
      }
    });
  }

  if (clearProcessBtn) {
    clearProcessBtn.addEventListener("click", () => {
      if (processLog) processLog.textContent = "";
    });
  }

  if (pauseProcessBtn) {
    pauseProcessBtn.addEventListener("click", () => {
      processPaused = !processPaused;
      pauseProcessBtn.textContent = processPaused ? "Resume" : "Pause";
    });
  }

  // listen for global App process events
  window.addEventListener("naivacom:process", (e) => {
    const detail = (e && e.detail) || {};
    appendProcessLine(detail.message || "process event");
  });

  // Remote config: save endpoint and post to server
  const remoteEndpointInput = document.getElementById("remote-endpoint");
  const remoteKeyInput = document.getElementById("remote-key");
  const saveRemoteBtn = document.getElementById("save-remote");
  const postRemoteBtn = document.getElementById("post-remote");

  // load saved remote config from localStorage if present
  try {
    const savedEndpoint = localStorage.getItem("naivacom-remote-endpoint");
    const savedKey = localStorage.getItem("naivacom-remote-key");
    if (savedEndpoint && remoteEndpointInput)
      remoteEndpointInput.value = savedEndpoint;
    if (savedKey && remoteKeyInput) remoteKeyInput.value = savedKey;
  } catch (e) {}

  if (saveRemoteBtn) {
    saveRemoteBtn.addEventListener("click", () => {
      const url = remoteEndpointInput && remoteEndpointInput.value;
      const key = remoteKeyInput && remoteKeyInput.value;
      if (!url) return alert("Provide a remote endpoint URL first");
      try {
        localStorage.setItem("naivacom-remote-endpoint", url);
        localStorage.setItem("naivacom-remote-key", key || "");
      } catch (e) {}
      if (typeof App !== "undefined" && App.setRemoteEndpoint) {
        App.setRemoteEndpoint(url, key || null);
        alert(
          "Remote endpoint saved locally. Use 'Post to server' to push current data."
        );
      }
    });
  }

  if (postRemoteBtn) {
    postRemoteBtn.addEventListener("click", async () => {
      lock();
      // require admin gate/password
      if (!isAuthed())
        return alert("Enter admin password to post changes to server");
      const url = remoteEndpointInput && remoteEndpointInput.value;
      const key = remoteKeyInput && remoteKeyInput.value;
      if (!url) return alert("Set a remote endpoint first and save it");
      if (!confirm("Post current content to the remote server now?")) return;
      // configure App and push
      if (typeof App !== "undefined" && App.setRemoteEndpoint && App.syncNow) {
        App.setRemoteEndpoint(url, key || null);
        try {
          // show pending status
          const statusEl = document.getElementById("post-status");
          if (statusEl) {
            statusEl.textContent = "Posting...";
            statusEl.className = "";
          }
          const ok = await App.syncNow();
          if (ok) {
            if (statusEl) {
              statusEl.textContent = "Post successful";
              statusEl.className = "post-success";
            }
            appendProcessLine("post-remote -> success");
            showToast("Posted site data to remote server.");
          } else {
            if (statusEl) {
              statusEl.textContent = "Post failed";
              statusEl.className = "post-fail";
            }
            appendProcessLine("post-remote -> failed");
            showToast("Failed to post to server", "error");
          }
        } catch (e) {
          const statusEl = document.getElementById("post-status");
          if (statusEl) {
            statusEl.textContent = "Post failed";
            statusEl.className = "post-fail";
          }
          appendProcessLine("post-remote -> exception " + (e && e.message));
          showToast("Failed to post to server: " + (e && e.message), "error");
        }
      } else {
        alert("Remote sync not available in this build.");
      }
    });
  }

  renderLists();
});
