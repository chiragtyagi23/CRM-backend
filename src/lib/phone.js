/** Strip to digits only. */
function digitsOnly(contact) {
  return String(contact ?? "").replace(/\D/g, "");
}

/**
 * India E.164 digits (91 + 10-digit mobile) for wa.me links.
 * e.g. 9149209086 → 919149209086
 */
function toIndiaWhatsAppDigits(contact) {
  let d = digitsOnly(contact);
  if (!d) return null;

  if (d.length === 11 && d.startsWith("0")) {
    d = d.slice(1);
  }

  if (d.length === 12 && d.startsWith("91")) {
    return d;
  }

  if (d.length === 10) {
    return `91${d}`;
  }

  return d.length >= 10 ? d : null;
}

function toWhatsAppHref(contact, text) {
  const digits = toIndiaWhatsAppDigits(contact);
  if (!digits) return null;
  const base = `https://wa.me/${digits}`;
  if (!text || !String(text).trim()) return base;
  return `${base}?text=${encodeURIComponent(String(text))}`;
}

module.exports = { digitsOnly, toIndiaWhatsAppDigits, toWhatsAppHref };
