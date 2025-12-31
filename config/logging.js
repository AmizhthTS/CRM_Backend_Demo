import dotenv from "dotenv";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load logging configuration from JSON file
let loggingConfigFile = {
  requests: true,
  responses: true,
  errors: true,
  auth: true,
  database: true,
  swagger: true,
  headers: false,
};

try {
  const configPath = join(__dirname, "logging.config.json");
  const fileContents = readFileSync(configPath, "utf8");
  loggingConfigFile = { ...loggingConfigFile, ...JSON.parse(fileContents) };
} catch (error) {
  // Use defaults if file doesn't exist
}

// Logging Configuration
export const loggingConfig = {
  enabled: process.env.NODE_ENV !== "production",
  logRequests: loggingConfigFile.requests,
  logResponses: loggingConfigFile.responses,
  logErrors: loggingConfigFile.errors,
  logAuth: loggingConfigFile.auth,
  logDatabase: loggingConfigFile.database,
  logSwagger: loggingConfigFile.swagger,
  logHeaders: loggingConfigFile.headers,

  // Color codes for better visibility
  colors: {
    reset: "\x1b[0m",
    bright: "\x1b[1m",
    red: "\x1b[31m",
    green: "\x1b[32m",
    yellow: "\x1b[33m",
    blue: "\x1b[34m",
    magenta: "\x1b[35m",
    cyan: "\x1b[36m",
  },
};

// Request Logging Middleware
export const requestLogger = (req, res, next) => {
  if (!loggingConfig.enabled || !loggingConfig.logRequests) {
    return next();
  }

  const { method, originalUrl, ip, headers } = req;
  const timestamp = new Date().toISOString();

  const { cyan, yellow, reset, bright } = loggingConfig.colors;

  console.log(
    `${cyan}[${timestamp}]${reset} ${bright}${method}${reset} ${yellow}${originalUrl}${reset} - IP: ${ip}`
  );

  // Log auth token if present (only in development)
  if (loggingConfig.logAuth && headers.token) {
    console.log(`  Auth Token: ${headers.token.substring(0, 20)}...`);
  }

  // Log headers if enabled
  if (loggingConfig.logHeaders) {
    console.log(
      `  Headers:`,
      JSON.stringify(
        {
          "content-type": headers["content-type"],
          "user-agent": headers["user-agent"],
          origin: headers["origin"],
          referer: headers["referer"],
        },
        null,
        2
      )
    );
  }

  next();
};

// Response Logging Middleware
export const responseLogger = (req, res, next) => {
  if (!loggingConfig.enabled || !loggingConfig.logResponses) {
    return next();
  }

  const originalSend = res.send;
  const startTime = Date.now();

  res.send = function (data) {
    const duration = Date.now() - startTime;
    const { green, red, yellow, reset, bright } = loggingConfig.colors;

    const statusColor =
      res.statusCode >= 400 ? red : res.statusCode >= 300 ? yellow : green;

    console.log(
      `  ${statusColor}${bright}${res.statusCode}${reset} - ${duration}ms`
    );

    return originalSend.call(this, data);
  };

  next();
};

// Error Logging Middleware
export const errorLogger = (err, req, res, next) => {
  if (loggingConfig.enabled && loggingConfig.logErrors) {
    const { red, reset, bright } = loggingConfig.colors;
    console.error(
      `${red}${bright}[ERROR]${reset} ${req.method} ${req.originalUrl}`
    );
    console.error(`  Message: ${err.message}`);
    console.error(`  Stack: ${err.stack}`);
  }
  next(err);
};
