"use strict";
const concepts = JSON.parse(document.getElementById("concept-data").textContent);
const get = (id) => document.getElementById(id);
let selected = 0;
let filter = "all";
function selectFromHash() {
  let id;
  try { id = decodeURIComponent(location.hash.slice(1)); } catch { return; }
  const index = concepts.findIndex((asset) => asset.id === id);
  if (index < 0) return;
  selected = index;
  const asset = concepts[index];
  get("selected-kicker").textContent = `${String(index + 1).padStart(2, "0")} / ${asset.family.toUpperCase()} / ${asset.new ? "新提案" : "精修方向"}`;
  get("selected-title").replaceChildren(document.createTextNode(asset.name + " "));
  const cn = document.createElement("span");
  cn.textContent = asset.cn;
  get("selected-title").append(cn);
  get("hero-image").src = asset.image;
  get("hero-image").alt = `${asset.cn}：正面、右侧面、后方四分之三视角概念图`;
  get("hero-link").href = asset.image;
  get("original-link").href = asset.image;
  get("selected-purpose").textContent = asset.purpose;
  get("selected-action").textContent = asset.action;
  get("selected-effect").textContent = asset.worldEffect;
  get("position").textContent = `${String(index + 1).padStart(2, "0")} / ${concepts.length}`;
  document.querySelectorAll(".sheet-card").forEach((card) => card.setAttribute("aria-current", String(card.dataset.id === id)));
}
function applyFilters() {
  const search = get("search").value.trim().toLowerCase();
  let count = 0;
  document.querySelectorAll(".sheet-card").forEach((card) => {
    const category = filter === "all" || (filter === "new" ? card.dataset.new === "true" : card.dataset.family === filter);
    card.hidden = !(category && card.dataset.search.includes(search));
    if (!card.hidden) count++;
  });
  get("result-count").textContent = `${count} 张概念图`;
  get("empty").hidden = count > 0;
}
get("search").addEventListener("input", applyFilters);
document.querySelectorAll("[data-filter]").forEach((button) => button.addEventListener("click", () => {
  filter = button.dataset.filter;
  document.querySelectorAll("[data-filter]").forEach((item) => item.setAttribute("aria-pressed", String(item === button)));
  applyFilters();
}));
get("previous").addEventListener("click", () => { location.hash = concepts[(selected + concepts.length - 1) % concepts.length].id; });
get("next").addEventListener("click", () => { location.hash = concepts[(selected + 1) % concepts.length].id; });
document.querySelectorAll(".sheet-card").forEach((card) => card.addEventListener("click", () => get("selected").scrollIntoView()));
window.addEventListener("hashchange", selectFromHash);
selectFromHash();
