// Reemplace con el número real de FES (formato internacional, sin + ni espacios)
const WHATSAPP_NUMBER = "56900000000";

document.querySelectorAll("[data-year]").forEach((el) => (el.textContent = new Date().getFullYear()));

// Menú móvil
const nav = document.getElementById("nav");
const navToggle = document.getElementById("navToggle");
navToggle.addEventListener("click", () => {
  const open = nav.classList.toggle("is-open");
  navToggle.setAttribute("aria-expanded", open);
});

// Enlaces de WhatsApp
const waUrl = (text = "Hola, quisiera información sobre los servicios de FES.") =>
  `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(text)}`;
document.querySelectorAll("[data-whatsapp-link]").forEach((a) => {
  a.href = waUrl();
  a.target = "_blank";
  a.rel = "noopener";
});

// Formulario de contacto: abre WhatsApp con la consulta
const form = document.getElementById("contactForm");
if (form) {
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const d = new FormData(form);
    const lines = [
      `Hola, mi nombre es ${d.get("nombre")}.`,
      `Servicio: ${d.get("servicio")}`,
      `Teléfono: ${d.get("telefono")}`,
      d.get("mensaje") && `Mensaje: ${d.get("mensaje")}`,
    ].filter(Boolean);
    window.open(waUrl(lines.join("\n")), "_blank", "noopener");
  });
}
