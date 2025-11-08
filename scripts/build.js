document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("build-form");
  const btn = document.getElementById("submitBtn");
  const emoji = document.getElementById("emoji");
  const feedback = document.getElementById("feedback");

  function sendMailto(subject, body, to) {
    const url = `mailto:${to}?subject=${encodeURIComponent(
      subject
    )}&body=${encodeURIComponent(body)}`;
    // open in new tab
    window.location.href = url;
  }

  function sendWhatsApp(phone, text) {
    // sanitize phone for wa.me
    const p = phone.replace(/[^0-9+]/g, "");
    const plain = p.replace(/^\+/, "");
    const url = `https://wa.me/${plain}?text=${encodeURIComponent(text)}`;
    window.open(url, "_blank");
  }

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    btn.disabled = true;
    btn.textContent = "Submitting...";
    btn.appendChild(emoji);

    const fd = new FormData(form);
    const name = fd.get("name");
    const email = fd.get("email");
    const phone = fd.get("phone") || "+254796185828";
    const service = fd.get("service");
    const details = fd.get("details") || "";

    const subject = `NaivaCom project inquiry from ${name}`;
    const body = `Name: ${name}\nEmail: ${email}\nPhone: ${phone}\nService: ${service}\n\nDetails:\n${details}`;

    // open mailto (client will handle sending)
    sendMailto("info@naivacom.com", subject + "\n\n" + body, "info@naivacom.com");

    // also open whatsapp summary
    const waText = `NaivaCom inquiry from ${name} (${email}) - ${service}. Details: ${details}`;
    sendWhatsApp(phone || "+254796185828", waText);

    // friendly feedback and reset button after short delay
  feedback.textContent = `Thank you, ${name}! You've taken a wonderful step ~ we will follow up shortly.`;
    setTimeout(() => {
      btn.disabled = false;
      btn.innerHTML = 'Submit project <span id="emoji">✅</span>';
      form.reset();
    }, 2200);
  });

  // Populate service select and render service cards on build page
  function populateServices() {
    if (typeof App === "undefined" || !App.getServices) return;
    const services = App.getServices();
    const select = document.getElementById("service");
    const list = document.getElementById("build-services-list");
    if (!select) return;
    select.innerHTML = "";
    // add a placeholder option
    const placeholder = document.createElement("option");
    placeholder.value = "";
    placeholder.textContent = "Select a service...";
    select.appendChild(placeholder);
    services.forEach((s) => {
      const opt = document.createElement("option");
      opt.value = s.title || String(s.id);
      opt.textContent = s.title || s.id;
      select.appendChild(opt);
    });

    // render cards preview that map to same service values
    if (list) {
      list.innerHTML = "";
      services.forEach((s) => {
        const wrap = document.createElement("div");
        wrap.className = "svsItem";
        wrap.innerHTML = `
          <div class="card">
            ${s.image ? `<img src="${s.image}" alt="${s.title}" />` : ""}
            <div class="card-body">
              <h3>${s.title}</h3>
              <p class="muted">${s.description || ''}</p>
              <p><button data-service-title="${encodeURIComponent(s.title)}" class="choose-service button-like">Choose</button></p>
            </div>
          </div>`;
        list.appendChild(wrap);
      });
    }

    // preselect based on query param serviceId
    const params = new URLSearchParams(window.location.search);
    const sid = params.get("serviceId");
    if (sid) {
      // find service by id
      const found = services.find((x) => String(x.id) === String(sid));
      if (found) {
        // set select to service title if option exists
        for (const o of Array.from(select.options)) {
          if (o.value === (found.title || String(found.id))) {
            select.value = o.value;
            break;
          }
        }
      }
    }

    // click handler for choose buttons
    document.body.addEventListener('click', (ev) => {
      const btn = ev.target.closest && ev.target.closest('.choose-service');
      if (!btn) return;
      const title = decodeURIComponent(btn.getAttribute('data-service-title') || '');
      if (!title) return;
      // set select to the matched option if present
      const option = Array.from(select.options).find(o => o.value === title || o.textContent === title);
      if (option) select.value = option.value;
      // scroll to form
      document.getElementById('build-form').scrollIntoView({behavior:'smooth'});
    });
  }

  // run after small delay so App.init has seeded data
  setTimeout(populateServices, 300);
});
