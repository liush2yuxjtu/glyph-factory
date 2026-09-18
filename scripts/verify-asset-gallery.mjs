import fs from "node:fs";
import vm from "node:vm";

const registryText = fs.readFileSync(new URL("../docs/asset-registry.js", import.meta.url), "utf8");
const engineText = fs.readFileSync(new URL("../public/glyph-engine-v3.js", import.meta.url), "utf8");
const html = fs.readFileSync(new URL("../docs/index.html", import.meta.url), "utf8");
const galleryJs = fs.readFileSync(new URL("../docs/gallery.js", import.meta.url), "utf8");

const sandbox = { window: {} };
vm.createContext(sandbox);
vm.runInContext(registryText, sandbox, { filename: "asset-registry.js" });

const assets = sandbox.window.GLYPH_ASSET_REGISTRY;
const flows = sandbox.window.GLYPH_FLOW_SCREENS;

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

assert(Array.isArray(assets), "asset registry must be an array");
assert(assets.length === 16, "expected 16 interactive assets");
assert(Array.isArray(flows), "flow screens must be an array");
assert(flows.length === 6, "expected 6 flow screens");

const ids = new Set();
for (const asset of assets) {
  assert(!ids.has(asset.id), "duplicate asset id: " + asset.id);
  ids.add(asset.id);
  for (const key of ["name", "cn", "family", "act", "firstAha", "firstAhaTitle", "appears", "purpose", "action", "worldEffect", "accent"]) {
    assert(asset[key] !== undefined && asset[key] !== "", asset.id + " missing " + key);
  }
  assert(asset.act >= 1 && asset.act <= 6, asset.id + " has invalid act");
  const escapedTitle = asset.firstAhaTitle.replace(/[.*+?^\${}()|[\]\\]/g, "\\$&");
  const pattern = new RegExp("aha\\(\\s*['\\\"]" + asset.firstAha + "['\\\"]\\s*,\\s*\\d+\\s*,\\s*['\\\"]" + escapedTitle + "['\\\"]");
  assert(pattern.test(engineText), asset.id + " Aha title drifted from public/glyph-engine-v3.js");
}

const seenActs = new Set();
for (const flow of flows) {
  seenActs.add(flow.act);
  assert(/^S0[1-6]$/.test(flow.id), "invalid flow id: " + flow.id);
  assert(flow.assets.length > 0, flow.id + " must reference assets");
  flow.assets.forEach((assetId) => assert(ids.has(assetId), flow.id + " references unknown asset " + assetId));
  for (const key of ["title", "subtitle", "userGoal", "interaction", "shift", "ahaRange"]) {
    assert(flow[key], flow.id + " missing " + key);
  }
}
assert([...seenActs].sort().join(",") === "1,2,3,4,5,6", "flows must cover ACT I–VI");

assert(html.includes('id="asset-canvas"'), "index must expose the 3D canvas");
assert(html.includes('id="flow-screen"'), "index must expose the Screens + Flows surface");
assert(html.includes("./asset-registry.js"), "index must load the registry");
assert(html.includes("./gallery.js"), "index must load the gallery runtime");
assert(galleryJs.includes("three@0.186.0"), "Three.js version must stay pinned");
assert(galleryJs.includes("setAnimationLoop"), "3D runtime must animate");
assert(galleryJs.includes("createFallbackRenderer") && galleryJs.includes("supportsWebGL"), "gallery must remain interactive when WebGL is unavailable");
assert(galleryJs.includes("pointerdown") && galleryJs.includes("pointerup"), "3D stage must support pointer interaction");
assert(galleryJs.includes("triggerAsset"), "asset interaction path is missing");

console.log("Glyph Factory 3D asset gallery verification PASS");
console.log("assets:", assets.length);
console.log("flow screens:", flows.length);
console.log("Aha references: synced with public/glyph-engine-v3.js");
