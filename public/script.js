(() => {
  const cfg = window.FES_CONFIG || {};

  const waUrl = (text) =>
    `https://wa.me/${cfg.whatsapp}` + (text ? `?text=${encodeURIComponent(text)}` : "");

  const available = {
    whatsapp: Boolean(cfg.whatsapp),
    email: Boolean(cfg.email),
    instagram: Boolean(cfg.instagramUrl),
    location: Boolean(cfg.location),
    hours: Boolean(cfg.hours),
    booking: Boolean(cfg.bookingUrl),
  };

  // ---------- Datos de contacto desde config.js ----------
  // Bloques que solo se muestran si el dato existe
  document.querySelectorAll("[data-show-if]").forEach((el) => {
    const keys = el.dataset.showIf.split(" ");
    el.hidden = !keys.some((k) => available[k]);
  });

  // Textos
  document.querySelectorAll("[data-text]").forEach((el) => {
    const value = cfg[el.dataset.text];
    if (value) el.textContent = value;
  });

  // Enlaces
  const hrefs = {
    whatsapp: (el) => waUrl(el.dataset.waText || "Hola, quisiera información sobre los servicios de FES."),
    email: () => `mailto:${cfg.email}`,
    instagram: () => cfg.instagramUrl,
    booking: () => cfg.bookingUrl,
  };
  document.querySelectorAll("[data-link]").forEach((el) => {
    const type = el.dataset.link;
    if (!available[type]) {
      el.hidden = true;
      return;
    }
    el.href = hrefs[type](el);
  });

  document.querySelectorAll("[data-year]").forEach((el) => (el.textContent = new Date().getFullYear()));

  // Datos estructurados para buscadores (se generan desde la misma configuración)
  const org = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name: "FES · First Ecology Solutions",
    legalName: "FES SpA",
    url: "https://fesspa.cl/",
    logo: "https://fesspa.cl/assets/icon-512.png",
    image: "https://fesspa.cl/assets/og-image.jpg",
    description: "Limpieza profesional y administración de departamentos en renta corta.",
  };
  if (cfg.whatsapp) org.telephone = `+${cfg.whatsapp}`;
  if (cfg.email) org.email = cfg.email;
  if (cfg.instagramUrl) org.sameAs = [cfg.instagramUrl];
  if (cfg.location)
    org.address = { "@type": "PostalAddress", addressLocality: "Concepción", addressRegion: "Biobío", addressCountry: "CL" };
  if (cfg.hours)
    org.openingHoursSpecification = [{
      "@type": "OpeningHoursSpecification",
      dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
      opens: "09:00",
      closes: "19:00",
    }];
  const ld = document.createElement("script");
  ld.type = "application/ld+json";
  ld.textContent = JSON.stringify(org);
  document.head.appendChild(ld);

  // ---------- Menú móvil ----------
  const nav = document.getElementById("nav");
  const toggle = document.getElementById("navToggle");
  if (nav && toggle) {
    const setOpen = (open) => {
      nav.classList.toggle("is-open", open);
      toggle.setAttribute("aria-expanded", String(open));
      toggle.setAttribute("aria-label", open ? "Cerrar menú" : "Abrir menú");
    };
    toggle.addEventListener("click", () => setOpen(toggle.getAttribute("aria-expanded") !== "true"));
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && nav.classList.contains("is-open")) {
        setOpen(false);
        toggle.focus();
      }
    });
    document.addEventListener("click", (e) => {
      if (nav.classList.contains("is-open") && !nav.contains(e.target) && !toggle.contains(e.target)) setOpen(false);
    });
    window.matchMedia("(min-width: 801px)").addEventListener("change", (e) => e.matches && setOpen(false));
  }

  // ---------- Formulario de contacto ----------
  const form = document.getElementById("contactForm");
  if (!form) return;

  const status = document.getElementById("formStatus");
  const submitBtn = form.querySelector("[type=submit]");
  const channelNote = document.getElementById("formChannel");
  const channel = available.whatsapp ? "whatsapp" : available.email ? "email" : null;

  if (!channel) {
    form.hidden = true;
    return;
  }
  if (channel === "email") {
    submitBtn.textContent = "Continuar en mi correo";
    channelNote.textContent =
      "Al continuar se abrirá su aplicación de correo con la consulta ya redactada. La consulta se envía cuando usted presiona «Enviar» en su correo.";
  }

  // Preseleccionar servicio desde la URL (?servicio=renta-corta)
  const pre = new URLSearchParams(location.search).get("servicio");
  if (pre) {
    const opt = form.servicio.querySelector(`option[value="${CSS.escape(pre)}"]`);
    if (opt) form.servicio.value = pre;
  }

  const rules = {
    nombre: (v) => (v.trim().length >= 2 ? "" : "Ingrese su nombre."),
    telefono: (v) => {
      const digits = v.replace(/\D/g, "");
      if (!digits) return "Ingrese un teléfono de contacto.";
      if (/[^\d\s+()-]/.test(v) || digits.length < 8 || digits.length > 12)
        return "Ingrese un teléfono válido, por ejemplo +56 9 1234 5678.";
      return "";
    },
    servicio: (v) => (v ? "" : "Seleccione el servicio que le interesa."),
  };

  const showError = (field, msg) => {
    const box = document.getElementById(`${field.name}-error`);
    field.setAttribute("aria-invalid", msg ? "true" : "false");
    if (box) {
      box.textContent = msg;
      box.hidden = !msg;
    }
  };

  const validate = (field) => {
    const rule = rules[field.name];
    if (!rule) return true;
    const msg = rule(field.value);
    showError(field, msg);
    return !msg;
  };

  Object.keys(rules).forEach((name) => {
    const field = form.elements[name];
    field.addEventListener("blur", () => field.value && validate(field));
    field.addEventListener("input", () => field.getAttribute("aria-invalid") === "true" && validate(field));
    field.addEventListener("change", () => field.getAttribute("aria-invalid") === "true" && validate(field));
  });

  const buildMessage = (d) => {
    const serviceLabel = form.servicio.options[form.servicio.selectedIndex].text;
    return [
      `Hola FES, mi nombre es ${d.get("nombre").trim()}.`,
      `Me interesa: ${serviceLabel}.`,
      d.get("comuna").trim() && `Comuna: ${d.get("comuna").trim()}.`,
      `Mi teléfono: ${d.get("telefono").trim()}.`,
      d.get("mensaje").trim() && `\n${d.get("mensaje").trim()}`,
    ]
      .filter(Boolean)
      .join("\n");
  };

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const invalid = Object.keys(rules)
      .map((name) => form.elements[name])
      .filter((f) => !validate(f));
    if (invalid.length) {
      status.hidden = true;
      invalid[0].focus();
      return;
    }

    const text = buildMessage(new FormData(form));
    const url =
      channel === "whatsapp"
        ? waUrl(text)
        : `mailto:${cfg.email}?subject=${encodeURIComponent("Consulta desde el sitio web")}&body=${encodeURIComponent(text)}`;

    if (channel === "whatsapp") window.open(url, "_blank", "noopener");
    else window.location.href = url;

    const appName = channel === "whatsapp" ? "WhatsApp" : "su correo";
    status.innerHTML = "";
    const title = document.createElement("p");
    title.className = "form-status__title";
    title.textContent = `Falta un paso: envíe el mensaje en ${appName}`;
    const body = document.createElement("p");
    body.textContent =
      channel === "whatsapp"
        ? "Abrimos WhatsApp con su consulta ya escrita. Su mensaje nos llegará cuando presione «Enviar» en WhatsApp."
        : "Abrimos su correo con la consulta ya redactada. Nos llegará cuando presione «Enviar» en su correo.";
    const actions = document.createElement("p");
    actions.className = "form-status__actions";
    const again = document.createElement("a");
    again.href = url;
    again.className = "btn btn--secondary btn--sm";
    again.textContent = `Abrir ${channel === "whatsapp" ? "WhatsApp" : "correo"} de nuevo`;
    if (channel === "whatsapp") {
      again.target = "_blank";
      again.rel = "noopener";
    }
    actions.appendChild(again);
    if (navigator.clipboard) {
      const copy = document.createElement("button");
      copy.type = "button";
      copy.className = "btn btn--secondary btn--sm";
      copy.textContent = "Copiar mensaje";
      copy.addEventListener("click", async () => {
        try {
          await navigator.clipboard.writeText(text);
          copy.textContent = "Mensaje copiado";
        } catch {
          copy.textContent = "No se pudo copiar";
        }
      });
      actions.appendChild(copy);
    }
    status.append(title, body, actions);
    status.hidden = false;
    status.focus();
  });
})();
