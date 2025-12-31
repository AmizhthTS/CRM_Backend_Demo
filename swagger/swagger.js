import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { readFileSync } from "fs";
import { load } from "js-yaml";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Helper function to load YAML files
const loadYaml = (filePath) => {
  try {
    const fileContents = readFileSync(filePath, "utf8");
    return load(fileContents);
  } catch (error) {
    console.error(`Error loading ${filePath}:`, error.message);
    return null;
  }
};

// Load all path files
const authPaths = loadYaml(join(__dirname, "./paths/auth.yaml"));
const usersPaths = loadYaml(join(__dirname, "./paths/users.yaml"));
const teamPaths = loadYaml(join(__dirname, "./paths/team.yaml"));

// Load schemas
const schemas = loadYaml(join(__dirname, "./schemas/schemas.yaml"));

// Normalize YAML shape since some files export paths directly instead of under `paths`
const toPaths = (doc) => {
  if (!doc) return {};
  return typeof doc.paths === "object" ? doc.paths : doc;
};

// Merge all paths
const allPaths = {
  ...toPaths(authPaths),
  ...toPaths(usersPaths),
  ...toPaths(teamPaths),
};

// Build the complete Swagger specification
export const swaggerSpec = {
  openapi: "3.0.0",
  info: {
    title: "JustBorn Garments API",
    version: "1.0.0",
    description:
      "API documentation for JustBorn Garments e-commerce platform. Use the Authorize button to add your JWT token for authenticated endpoints.",
    contact: {
      name: "API Support",
      email: "support@justborngarments.com",
    },
  },
  servers: [
    {
      url: "http://localhost:5000",
      description: "Development server",
    },
    {
      url: "https://api.justborngarments.com",
      description: "Production server",
    },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
        description: "Enter your JWT token in the format: Bearer <token>",
      },
      tokenAuth: {
        type: "apiKey",
        in: "header",
        name: "token",
        description: "Enter your JWT token directly (without 'Bearer' prefix)",
      },
    },
    schemas: schemas?.components?.schemas || {},
  },
  paths: allPaths,
  security: [],
};
