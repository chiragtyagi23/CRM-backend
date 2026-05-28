/**
 * Same rules as CRM `BulkUploadLeads.tsx` (name, phone, email).
 * Used by POST /api/capture-leads/bulk — all rows must pass or the request is rejected.
 */

const PHONE_REGEX = /^[+]?[0-9\s-]{10,18}$/;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * @param {Record<string, unknown>} raw
 * @param {number} rowNumber — 1-based display row (e.g. Excel row with header on row 1)
 * @returns {{ rowNumber: number, name: string, phone: string, email: string, errors: string[] }}
 */
function validateBulkLeadRow(raw, rowNumber) {
  const name =
    raw?.name != null && raw?.name !== ""
      ? String(raw.name).trim()
      : raw?.Name != null
        ? String(raw.Name).trim()
        : "";
  const phoneRaw =
    raw?.number != null && raw?.number !== ""
      ? String(raw.number).trim()
      : raw?.phone != null
        ? String(raw.phone).trim()
        : raw?.["Mobile No."] != null
          ? String(raw["Mobile No."]).trim()
          : raw?.["Mobile No"] != null
            ? String(raw["Mobile No"]).trim()
            : "";

  const emailRaw =
    raw?.email != null && raw?.email !== ""
      ? String(raw.email).trim()
      : raw?.["Email Id"] != null
        ? String(raw["Email Id"]).trim()
        : raw?.["Email ID"] != null
          ? String(raw["Email ID"]).trim()
          : "";

  const errors = [];

  if (!name) errors.push("Name is required");
  if (!phoneRaw) errors.push("Mobile No. is required");
  else if (!PHONE_REGEX.test(phoneRaw)) errors.push("Invalid phone number format");
  if (!emailRaw) errors.push("Email Id is required");
  else if (!EMAIL_REGEX.test(emailRaw)) errors.push("Invalid email format");

  return {
    rowNumber,
    name: name || "",
    phone: phoneRaw || "",
    email: emailRaw || "",
    errors,
  };
}

const DEFAULT_CHUNK_SIZE = 150;

/**
 * Validates all rows using `Promise.all` per chunk (async scheduling). Validation work is still
 * synchronous; chunking yields between batches under load. Same outcome as a single sequential loop.
 *
 * @param {unknown[]} rows
 * @param {number} [chunkSize]
 * @returns {Promise<{ ok: true, rows: { name: string, number: string, email: string }[] } | { ok: false, failures: ReturnType<typeof validateBulkLeadRow>[] }>}
 */
async function validateAllBulkRows(rows, chunkSize = DEFAULT_CHUNK_SIZE) {
  /** @type {ReturnType<typeof validateBulkLeadRow>[]} */
  const failures = [];
  /** @type { { name: string, number: string, email: string }[]} */
  const normalized = [];

  for (let i = 0; i < rows.length; i += chunkSize) {
    const slice = rows.slice(i, i + chunkSize);
    /** @type {ReturnType<typeof validateBulkLeadRow>[]} */
    const chunkResults = await Promise.all(
      slice.map((raw, j) =>
        Promise.resolve().then(() => {
          const idx = i + j;
          const rowNumber = idx + 2;
          const row = raw && typeof raw === "object" ? raw : {};
          return validateBulkLeadRow(row, rowNumber);
        }),
      ),
    );

    for (const result of chunkResults) {
      if (result.errors.length > 0) failures.push(result);
      else normalized.push({ name: result.name, number: result.phone, email: result.email });
    }
  }

  if (failures.length > 0) return { ok: false, failures };
  return { ok: true, rows: normalized };
}

module.exports = { validateBulkLeadRow, validateAllBulkRows, PHONE_REGEX, EMAIL_REGEX };
