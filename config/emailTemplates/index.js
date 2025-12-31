import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import Handlebars from "handlebars";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const templatesDir = path.resolve(__dirname, "..", "templates");

function loadTemplate(name) {
  const filePath = path.join(templatesDir, `${name}.hbs`);
  if (!fs.existsSync(filePath)) {
    throw new Error(`Template not found: ${name}`);
  }
  const templateSource = fs.readFileSync(filePath, "utf-8");
  return Handlebars.compile(templateSource);
}

export function renderTemplate(name, context = {}) {
  const template = loadTemplate(name);
  return template(context);
}

export default { renderTemplate };
