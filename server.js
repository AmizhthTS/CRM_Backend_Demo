import dotenv from "dotenv";
import express from "express";
import cors from "cors";
import path from "path";
import swaggerUi from "swagger-ui-express";
import { connectDB } from "./config/db.js";
import { verifyEmailConnection } from "./config/mailer.js";
import { swaggerSpec } from "./swagger/swagger.js";
import {
  loggingConfig,
  requestLogger,
  responseLogger,
  errorLogger,
} from "./config/logging.js";
import { uploadThingRoutes, uploadRoutes } from "./routes/uploadRoute.js";
import authRoutes from "./routes/authRoutes.js";
import mailTemplateRoute from "./routes/mailTemplateRoute.js";
import teamRoute from "./routes/teamRoutes.js";
import leadsRoute from "./routes/leadsRoutes.js";
import componyRoute from "./routes/componyRoutes.js";
import contactRoute from "./routes/contactRoutes.js";
import dealsRoute from "./routes/dealsRoute.js";
import taskRoute from "./routes/taskRoute.js";
import dashboardRoute from "./routes/dashboardRoutes.js";
dotenv.config();

const PORT = process.env.PORT || 5000;
const app = express();

// LOGGING MIDDLEWARE (Non-Production Only)
if (loggingConfig.enabled) {
  app.use(requestLogger);
  app.use(responseLogger);
  console.log("Logging middleware enabled (Development Mode)");
}

app.use(express.json());
app.use(cors());
app.use(express.static(path.resolve("static")));
app.use("/uploads", express.static("uploads"));

// SWAGGER API DOCUMENTATION
const swaggerUiOptions = {
  customCss: `
    .swagger-ui .topbar { display: none }
    .swagger-ui .information-container { margin: 30px 0 }
    .swagger-ui .info { margin: 20px 0 }
  `,
  customSiteTitle: "JustBorn Garments API Documentation",
  swaggerOptions: {
    persistAuthorization: true,
    displayRequestDuration: true,
    filter: true,
    tryItOutEnabled: true,
    requestInterceptor: (req) => {
      console.log(`[Swagger] ${req.method} ${req.url}`);
      return req;
    },
  },
};

app.use(
  "/api-docs",
  (req, res, next) => {
    if (loggingConfig.enabled && loggingConfig.logSwagger) {
      console.log(
        `API Documentation accessed: ${req.method} ${req.originalUrl}`
      );
    }
    next();
  },
  swaggerUi.serve,
  swaggerUi.setup(swaggerSpec, swaggerUiOptions)
);

// Swagger JSON endpoint
app.get("/api-docs.json", (req, res) => {
  if (loggingConfig.enabled && loggingConfig.logSwagger) {
    console.log("Swagger JSON specification requested");
  }
  res.setHeader("Content-Type", "application/json");
  res.send(swaggerSpec);
});

// UPLOADTHING ROUTES
app.use("/api/uploadthing", uploadThingRoutes);
// UPLOAD ROUTES (Admin image upload)
app.use("/api/upload", uploadRoutes);
// MAIN ROUTES
app.use("/api/auth", authRoutes);
app.use("/api/mail-template", mailTemplateRoute);
app.use("/api/teams", teamRoute);
app.use("/api/leads", leadsRoute);
app.use("/api/companies", componyRoute);
app.use("/api/contacts", contactRoute);
app.use("/api/deals", dealsRoute);
app.use("/api/tasks", taskRoute);
app.use("/api/dashboard", dashboardRoute);
// FRONTEND ROUTE
app.get("/", (req, res) => {
  return res.status(200).sendFile(path.resolve("./static/index.html"));
});

// ERROR LOGGING MIDDLEWARE (should be after routes)
if (loggingConfig.enabled) {
  app.use(errorLogger);
}

// START SERVER
app.listen(PORT, async () => {
  await connectDB();
  await verifyEmailConnection();

  // Initialize newsletter scheduler
  // initializeNewsletterScheduler();

  // Initialize coupon expiration scheduler
  // initializeCouponScheduler();

  console.log(`Server started on port ${PORT}`);
  console.log(
    `API Documentation available at: http://localhost:${PORT}/api-docs`
  );
  console.log(
    `Swagger JSON spec available at: http://localhost:${PORT}/api-docs.json`
  );
  console.log(`Environment: ${process.env.NODE_ENV || "development"}`);

  if (loggingConfig.enabled) {
    console.log("\nLogging Configuration:");
    console.log(
      `  - Requests: ${loggingConfig.logRequests ? "ENABLED" : "DISABLED"}`
    );
    console.log(
      `  - Responses: ${loggingConfig.logResponses ? "ENABLED" : "DISABLED"}`
    );
    console.log(
      `  - Errors: ${loggingConfig.logErrors ? "ENABLED" : "DISABLED"}`
    );
    console.log(`  - Auth: ${loggingConfig.logAuth ? "ENABLED" : "DISABLED"}`);
    console.log(
      `  - Headers: ${loggingConfig.logHeaders ? "ENABLED" : "DISABLED"}`
    );
    console.log(
      `  - Swagger: ${loggingConfig.logSwagger ? "ENABLED" : "DISABLED"}`
    );
  } else {
    console.log("Logging disabled (Production Mode)");
  }
});
