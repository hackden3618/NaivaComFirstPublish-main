document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("subscribe-form");
  const msg = document.getElementById("sub-msg");
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const fd = new FormData(form);
    const email = fd.get("email");
    const name = fd.get("name") || "";
    // client-only: we can't send emails from static site; show friendly message
    msg.textContent = `Thanks ${
      name || ""
    }! We'll notify ${email} when articles are published.`;
    form.reset();
  });
});
