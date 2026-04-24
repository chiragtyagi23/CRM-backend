/**
 * OpenAPI 3.0 document for CRM-backend (Express).
 * Served at GET /api/openapi.json and browsed via /api/docs.
 */
const openapi = {
  openapi: "3.0.3",
  info: {
    title: "CRM Backend API",
    description:
      "Express + Postgres CRM API: auth, campaigns (full payload), uploads, capture leads, site visits.",
    version: "1.0.0",
  },
  servers: [{ url: "http://localhost:4000", description: "Local (change in Swagger UI for other hosts)" }],
  tags: [
    { name: "Auth", description: "CRM signup / login / admin users" },
    { name: "Campaigns", description: "Campaign list and full create/update" },
    { name: "Uploads", description: "Image and video uploads (multipart)" },
    { name: "Capture leads", description: "Lead capture CRUD" },
    { name: "Site visits", description: "Site visit CRUD" },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
        description: "JWT from POST /api/auth/login or /api/auth/signup",
      },
    },
    schemas: {
      Error: {
        type: "object",
        properties: {
          error: { type: "string" },
          details: { type: "object", description: "Present on some 400 validation errors" },
        },
      },
      AuthUser: {
        type: "object",
        properties: {
          id: { type: "string", format: "uuid" },
          name: { type: "string" },
          email: { type: "string", format: "email" },
          role: { type: "string", enum: ["admin", "user", "no-role"] },
        },
      },
      AuthTokenResponse: {
        type: "object",
        properties: {
          token: { type: "string" },
          user: { $ref: "#/components/schemas/AuthUser" },
        },
      },
      CampaignListResponse: {
        type: "object",
        properties: {
          items: { type: "array", items: { type: "object", additionalProperties: true } },
        },
      },
      CampaignFull: {
        type: "object",
        description: "Full campaign graph (see Zod CampaignFullCreateSchema in repo)",
        additionalProperties: true,
      },
      CaptureLead: { type: "object", additionalProperties: true },
      CaptureLeadsList: {
        type: "object",
        properties: {
          items: { type: "array", items: { $ref: "#/components/schemas/CaptureLead" } },
        },
      },
      SiteVisit: { type: "object", additionalProperties: true },
      SiteVisitsList: {
        type: "object",
        properties: {
          items: { type: "array", items: { $ref: "#/components/schemas/SiteVisit" } },
        },
      },
      CrmUserList: {
        type: "object",
        properties: {
          items: {
            type: "array",
            items: {
              type: "object",
              properties: {
                id: { type: "string", format: "uuid" },
                name: { type: "string" },
                email: { type: "string" },
                role: { type: "string" },
                created_at: { type: "string", format: "date-time" },
                updated_at: { type: "string", format: "date-time" },
              },
            },
          },
        },
      },
      UploadSuccess: {
        type: "object",
        properties: {
          message: { type: "string", example: "File uploaded successfully" },
          url: {
            type: "string",
            example: "/uploads/example.jpg",
            description: "Relative `/uploads/...` path when S3 is not configured; absolute HTTPS URL when S3 is enabled.",
          },
          file: {
            type: "object",
            properties: {
              filename: { type: "string" },
              mimetype: { type: "string" },
              size: { type: "integer" },
            },
          },
        },
      },
    },
    parameters: {
      IdPath: {
        name: "id",
        in: "path",
        required: true,
        schema: { type: "string", format: "uuid" },
        description: "Resource UUID",
      },
    },
  },
  paths: {
    "/api/auth/signup": {
      post: {
        tags: ["Auth"],
        summary: "Register CRM user",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["name", "email", "password"],
                properties: {
                  name: { type: "string" },
                  email: { type: "string", format: "email" },
                  password: { type: "string", format: "password" },
                  role: { type: "string", enum: ["admin", "user", "no-role"], description: "Defaults to no-role if omitted" },
                },
              },
            },
          },
        },
        responses: {
          201: { description: "Created", content: { "application/json": { schema: { $ref: "#/components/schemas/AuthTokenResponse" } } } },
          400: { description: "Missing fields", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
          409: { description: "Email already exists", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
        },
      },
    },
    "/api/auth/login": {
      post: {
        tags: ["Auth"],
        summary: "Login",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["email", "password"],
                properties: {
                  email: { type: "string", format: "email" },
                  password: { type: "string", format: "password" },
                },
              },
            },
          },
        },
        responses: {
          200: { description: "OK", content: { "application/json": { schema: { $ref: "#/components/schemas/AuthTokenResponse" } } } },
          400: { description: "Bad request", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
          401: { description: "Invalid credentials", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
        },
      },
    },
    "/api/auth/users": {
      get: {
        tags: ["Auth"],
        summary: "List CRM users (admin)",
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: "role",
            in: "query",
            schema: { type: "string" },
            description: "Filter by role (e.g. admin, user, no-role)",
          },
        ],
        responses: {
          200: { description: "OK", content: { "application/json": { schema: { $ref: "#/components/schemas/CrmUserList" } } } },
          401: { description: "Unauthorized", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
          403: { description: "Forbidden (not admin)", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
        },
      },
    },
    "/api/campaigns": {
      get: {
        tags: ["Campaigns"],
        summary: "List campaigns",
        responses: {
          200: { description: "OK", content: { "application/json": { schema: { $ref: "#/components/schemas/CampaignListResponse" } } } },
        },
      },
    },
    "/api/campaigns/full": {
      post: {
        tags: ["Campaigns"],
        summary: "Create campaign with nested relations",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/CampaignFull" },
            },
          },
        },
        responses: {
          201: { description: "Created", content: { "application/json": { schema: { $ref: "#/components/schemas/CampaignFull" } } } },
          400: { description: "Validation error", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
        },
      },
    },
    "/api/campaigns/{id}": {
      get: {
        tags: ["Campaigns"],
        summary: "Get campaign by id",
        parameters: [{ $ref: "#/components/parameters/IdPath" }],
        responses: {
          200: { description: "OK", content: { "application/json": { schema: { $ref: "#/components/schemas/CampaignFull" } } } },
          404: { description: "Not found", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
        },
      },
    },
    "/api/campaigns/{id}/full": {
      put: {
        tags: ["Campaigns"],
        summary: "Replace/update full campaign graph",
        parameters: [{ $ref: "#/components/parameters/IdPath" }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/CampaignFull" },
            },
          },
        },
        responses: {
          200: { description: "OK", content: { "application/json": { schema: { $ref: "#/components/schemas/CampaignFull" } } } },
          400: { description: "Validation error", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
        },
      },
    },
    "/api/upload": {
      post: {
        tags: ["Uploads"],
        summary: "Upload image (multipart)",
        parameters: [
          {
            name: "draft",
            in: "query",
            required: false,
            schema: { type: "string", enum: ["1"] },
            description: "If `draft=1`, file stays on API disk only (no S3). Omit for final upload when S3 is configured.",
          },
        ],
        requestBody: {
          required: true,
          content: {
            "multipart/form-data": {
              schema: {
                type: "object",
                required: ["image"],
                properties: {
                  image: { type: "string", format: "binary", description: "Form field name: image" },
                },
              },
            },
          },
        },
        responses: {
          201: { description: "Created", content: { "application/json": { schema: { $ref: "#/components/schemas/UploadSuccess" } } } },
          400: { description: "No file", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
        },
      },
    },
    "/api/upload/video": {
      post: {
        tags: ["Uploads"],
        summary: "Upload video (multipart)",
        parameters: [
          {
            name: "draft",
            in: "query",
            required: false,
            schema: { type: "string", enum: ["1"] },
            description: "If `draft=1`, file stays on API disk only (no S3). Omit for final upload when S3 is configured.",
          },
        ],
        requestBody: {
          required: true,
          content: {
            "multipart/form-data": {
              schema: {
                type: "object",
                required: ["video"],
                properties: {
                  video: { type: "string", format: "binary", description: "Form field name: video" },
                },
              },
            },
          },
        },
        responses: {
          201: { description: "Created", content: { "application/json": { schema: { $ref: "#/components/schemas/UploadSuccess" } } } },
          400: { description: "No file", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
        },
      },
    },
    "/api/capture-leads": {
      get: {
        tags: ["Capture leads"],
        summary: "List capture leads",
        responses: {
          200: { description: "OK", content: { "application/json": { schema: { $ref: "#/components/schemas/CaptureLeadsList" } } } },
        },
      },
      post: {
        tags: ["Capture leads"],
        summary: "Create capture lead",
        security: [{ bearerAuth: [] }],
        requestBody: {
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/CaptureLead" },
            },
          },
        },
        responses: {
          201: { description: "Created", content: { "application/json": { schema: { $ref: "#/components/schemas/CaptureLead" } } } },
          401: { description: "Unauthorized", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
          403: { description: "Forbidden (admin only)", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
        },
      },
    },
    "/api/capture-leads/bulk": {
      post: {
        tags: ["Capture leads"],
        summary: "Bulk create capture leads (admin, all-or-nothing)",
        description:
          "Validates every row with the same rules as the CRM bulk upload UI (name, phone, email). Returns 400 with `failures` if any row fails; otherwise creates all rows in one transaction.",
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["source", "leads"],
                properties: {
                  source: { type: "string", description: "Campaign title (stored as lead source)" },
                  leads: {
                    type: "array",
                    maxItems: 500,
                    items: {
                      type: "object",
                      required: ["name", "number", "email"],
                      properties: {
                        name: { type: "string" },
                        number: { type: "string", description: "Phone / mobile" },
                        email: { type: "string", format: "email" },
                      },
                    },
                  },
                },
              },
            },
          },
        },
        responses: {
          201: {
            description: "All leads created",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    count: { type: "integer" },
                    items: { type: "array", items: { $ref: "#/components/schemas/CaptureLead" } },
                  },
                },
              },
            },
          },
          400: {
            description: "Validation failed or bad request",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    error: { type: "string" },
                    message: { type: "string" },
                    failures: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          rowNumber: { type: "integer" },
                          name: { type: "string" },
                          phone: { type: "string" },
                          email: { type: "string" },
                          errors: { type: "array", items: { type: "string" } },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
          401: { description: "Unauthorized", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
          403: { description: "Forbidden", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
        },
      },
    },
    "/api/capture-leads/{id}": {
      get: {
        tags: ["Capture leads"],
        summary: "Get capture lead by id",
        parameters: [{ $ref: "#/components/parameters/IdPath" }],
        responses: {
          200: { description: "OK", content: { "application/json": { schema: { $ref: "#/components/schemas/CaptureLead" } } } },
          404: { description: "Not found", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
        },
      },
      patch: {
        tags: ["Capture leads"],
        summary: "Update capture lead",
        security: [{ bearerAuth: [] }],
        parameters: [{ $ref: "#/components/parameters/IdPath" }],
        requestBody: {
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/CaptureLead" },
            },
          },
        },
        responses: {
          200: { description: "OK", content: { "application/json": { schema: { $ref: "#/components/schemas/CaptureLead" } } } },
          401: { description: "Unauthorized", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
          403: { description: "Forbidden", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
          404: { description: "Not found", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
        },
      },
      delete: {
        tags: ["Capture leads"],
        summary: "Delete capture lead",
        security: [{ bearerAuth: [] }],
        parameters: [{ $ref: "#/components/parameters/IdPath" }],
        responses: {
          204: { description: "No content" },
          401: { description: "Unauthorized", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
          403: { description: "Forbidden", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
          404: { description: "Not found", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
        },
      },
    },
    "/api/site-visits": {
      get: {
        tags: ["Site visits"],
        summary: "List site visits",
        responses: {
          200: { description: "OK", content: { "application/json": { schema: { $ref: "#/components/schemas/SiteVisitsList" } } } },
        },
      },
      post: {
        tags: ["Site visits"],
        summary: "Create site visit",
        requestBody: {
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/SiteVisit" },
            },
          },
        },
        responses: {
          201: { description: "Created", content: { "application/json": { schema: { $ref: "#/components/schemas/SiteVisit" } } } },
        },
      },
    },
    "/api/site-visits/{id}": {
      get: {
        tags: ["Site visits"],
        summary: "Get site visit by id",
        parameters: [{ $ref: "#/components/parameters/IdPath" }],
        responses: {
          200: { description: "OK", content: { "application/json": { schema: { $ref: "#/components/schemas/SiteVisit" } } } },
          404: { description: "Not found", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
        },
      },
      patch: {
        tags: ["Site visits"],
        summary: "Update site visit",
        parameters: [{ $ref: "#/components/parameters/IdPath" }],
        requestBody: {
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/SiteVisit" },
            },
          },
        },
        responses: {
          200: { description: "OK", content: { "application/json": { schema: { $ref: "#/components/schemas/SiteVisit" } } } },
          404: { description: "Not found", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
        },
      },
      delete: {
        tags: ["Site visits"],
        summary: "Delete site visit",
        parameters: [{ $ref: "#/components/parameters/IdPath" }],
        responses: {
          204: { description: "No content" },
          404: { description: "Not found", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
        },
      },
    },
  },
};

module.exports = { openapi };
