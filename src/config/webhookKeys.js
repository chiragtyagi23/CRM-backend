const WEBHOOK_SOURCE_KEYS = {
  "99acres": "NINETY_NINE_ACRES_API_KEY",
  housing: "HOUSING_API_KEY",
  magicbricks: "MAGICBRICKS_API_KEY",
};

function getWebhookApiKey(source) {
  const envName = WEBHOOK_SOURCE_KEYS[source];
  const specific = envName ? process.env[envName]?.trim() : "";
  const shared = process.env.WEBHOOK_API_KEY?.trim() || "";
  return specific || shared || null;
}

module.exports = { getWebhookApiKey, WEBHOOK_SOURCE_KEYS };
