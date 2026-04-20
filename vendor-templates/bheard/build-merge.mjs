import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");

const hoolixPath = path.join(root, "hoolix", "assets", "css", "style.css");
const innohubPath = path.join(root, "innohub", "assets", "css", "style.css");
const outCss = path.join(__dirname, "assets", "css", "style.css");

let hoolix = fs.readFileSync(hoolixPath, "utf8").replace(/\r\n/g, "\n");

hoolix = hoolix.replace(
  /\/\*-----------------------------------\*\\\s*\n\s*#ABOUT\s*\n\\\*-----------------------------------\*\/[\s\S]*?(?=\/\*-----------------------------------\*\\\s*\n\s*#SERVICE)/,
  ""
);

const about992 = `  /**
   * ABOUT
   */

  .about .container {
    grid-template-columns: 1fr 1fr;
    align-items: center;
  }

`;

hoolix = hoolix.replace(about992, "");

const about1200 = `  /**
   * ABOUT
   */

  .about .container { grid-template-columns: 1fr 0.7fr; }

`;

hoolix = hoolix.replace(about1200, "");

const innohubRaw = fs.readFileSync(innohubPath, "utf8").replace(/\r\n/g, "\n");
const innLines = innohubRaw.split("\n");

const reusedAnchor = innohubRaw.indexOf("  #REUSED STYLE");
if (reusedAnchor < 0) throw new Error("REUSED not found");
const reusedStart = innohubRaw.lastIndexOf(
  "/*-----------------------------------",
  reusedAnchor
);
const headerAnchor = innohubRaw.indexOf("  #HEADER", reusedAnchor + 10);
if (headerAnchor < 0) throw new Error("HEADER not found");
const headerStart = innohubRaw.lastIndexOf(
  "/*-----------------------------------",
  headerAnchor
);
if (headerStart < 0) throw new Error("HEADER not found");
const reusedChunk = innohubRaw.slice(reusedStart, headerStart).trim();

const projAnchor = innohubRaw.indexOf("  #PROJECT");
if (projAnchor < 0) throw new Error("PROJECT not found");
const projStart = innohubRaw.lastIndexOf(
  "/*-----------------------------------",
  projAnchor
);
const footAnchor = innohubRaw.indexOf("  #FOOTER", projAnchor + 10);
if (footAnchor < 0) throw new Error("FOOTER not found");
const footStart = innohubRaw.lastIndexOf(
  "/*-----------------------------------",
  footAnchor
);
const projectChunk = innohubRaw.slice(projStart, footStart).trim();

const mediaAnchor = innohubRaw.indexOf("  #MEDIA QUERIES");
if (mediaAnchor < 0) throw new Error("MEDIA not found");
const mediaStart = innohubRaw.lastIndexOf(
  "/*-----------------------------------",
  mediaAnchor
);
const brandStart = innohubRaw.indexOf(
  "/* -------------------------------------------------------------------------- */",
  mediaStart
);
if (brandStart < 0) throw new Error("brand block");
const mediaChunk = innohubRaw.slice(mediaStart, brandStart).trim();

const rootLineIdx = innLines.findIndex((l) => /^:root\s*\{/.test(l));
if (rootLineIdx < 0) throw new Error(":root not found");
let brace = 0;
let rootEndLine = rootLineIdx;
for (let k = rootLineIdx; k < innLines.length; k++) {
  for (const ch of innLines[k]) {
    if (ch === "{") brace++;
    else if (ch === "}") brace--;
  }
  rootEndLine = k;
  if (brace === 0) break;
}
const rootInner = innLines.slice(rootLineIdx + 1, rootEndLine).join("\n").trim();

let innohubScoped = [reusedChunk, projectChunk, mediaChunk].join("\n\n");
innohubScoped = innohubScoped.replace(/@keyframes pulse\b/g, "@keyframes ih-pulse");
innohubScoped = innohubScoped.replace(/\banimation:\s*pulse\b/g, "animation: ih-pulse");
/* Media blocks use :root — inside @scope that would hit <html>; use :scope for .ih variables */
innohubScoped = innohubScoped.replace(/:root/g, ":scope");

const scopedInner = innohubScoped
  .split("\n")
  .map((l) => "  " + l)
  .join("\n");

const scopedBlock = `
time,
label,
textarea {
  display: block;
}

/*-----------------------------------*\\
  #INNOHUB SECTIONS (scoped — Bheard merge)
\\*-----------------------------------*/

.ih {
  display: contents;
}

@scope (.ih) {
  :scope {
${rootInner
  .split("\n")
  .map((l) => "    " + l)
  .join("\n")}
  }

${scopedInner}
}
`;

fs.mkdirSync(path.dirname(outCss), { recursive: true });
fs.writeFileSync(outCss, hoolix + "\n" + scopedBlock, "utf8");
console.log("Wrote", outCss);
