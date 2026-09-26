
const sites = {
  A: {
    title: "Shackleton Rim",
    score: 0.82,
    rating: "HIGH",
    ice: "0.82",
    confidence: "88%",
    terrain: "Medium",
    signal: "Strong",
    pct: 82,
    insight: "Strong simulated water-ice signature with high confidence. Moderate terrain complexity makes this a promising follow-up target."
  },
  B: {
    title: "Malapert Ridge",
    score: 0.56,
    rating: "MEDIUM",
    ice: "0.56",
    confidence: "71%",
    terrain: "Low",
    signal: "Moderate",
    pct: 56,
    insight: "Moderate resource signal but favorable terrain. This site may be useful as a lower-risk comparison target for rover operations."
  },
  C: {
    title: "Shadow Basin",
    score: 0.91,
    rating: "HIGH",
    ice: "0.91",
    confidence: "79%",
    terrain: "High",
    signal: "Strong",
    pct: 91,
    insight: "Highest simulated resource potential in the survey. Terrain risk is elevated, so additional mobility and illumination data would be useful."
  },
  D: {
    title: "Polar Plain",
    score: 0.24,
    rating: "LOW",
    ice: "0.24",
    confidence: "92%",
    terrain: "Low",
    signal: "Weak",
    pct: 24,
    insight: "Low simulated resource potential despite excellent confidence and accessible terrain. Likely a lower-priority exploration target."
  }
};

let activeSite = null;
const shortlist = new Set();

const $ = (id) => document.getElementById(id);

function showToast(message) {
  const t = $("toast");
  t.textContent = message;
  t.classList.add("show");
  clearTimeout(window.__toastTimer);
  window.__toastTimer = setTimeout(() => t.classList.remove("show"), 1800);
}

function renderSite(key) {
  activeSite = key;
  const site = sites[key];

  document.querySelectorAll(".zone").forEach(z => z.classList.toggle("active", z.dataset.zone === key));
  $("emptyScan").classList.add("hidden");
  $("scanContent").classList.remove("hidden");
  $("scanTitle").textContent = site.title;
  $("scanState").textContent = "LIVE";
  $("scanState").classList.add("live");

  $("resourceScore").textContent = site.score.toFixed(2);
  $("rating").textContent = site.rating;
  $("rating").className = `rating ${site.rating.toLowerCase()}`;
  $("iceIndex").textContent = site.ice;
  $("confidence").textContent = site.confidence;
  $("terrainRisk").textContent = site.terrain;
  $("signalQuality").textContent = site.signal;
  $("chartPercent").textContent = `${site.pct}%`;
  $("resourceBar").style.width = `${site.pct}%`;
  $("insightText").textContent = site.insight;
  $("shortlistBtn").textContent = shortlist.has(key) ? "Remove from Mission Shortlist" : "Add to Mission Shortlist";
}

function renderShortlist() {
  const grid = $("shortlistGrid");
  grid.innerHTML = "";
  $("shortlistEmpty").style.display = shortlist.size ? "none" : "grid";

  [...shortlist].forEach(key => {
    const site = sites[key];
    const card = document.createElement("article");
    card.className = "short-card";
    card.innerHTML = `
      <div class="short-card-top">
        <h4>${site.title}</h4>
        <span class="mini-score">${site.score.toFixed(2)}</span>
      </div>
      <p>${site.rating} potential · ${site.confidence} confidence · ${site.terrain} terrain risk</p>
    `;
    grid.appendChild(card);
  });
}

document.querySelectorAll(".zone").forEach(zone => {
  zone.addEventListener("click", () => renderSite(zone.dataset.zone));
});

$("shortlistBtn").addEventListener("click", () => {
  if (!activeSite) return;
  if (shortlist.has(activeSite)) {
    shortlist.delete(activeSite);
    showToast(`${sites[activeSite].title} removed from shortlist`);
  } else {
    shortlist.add(activeSite);
    showToast(`${sites[activeSite].title} added to shortlist`);
  }
  renderShortlist();
  renderSite(activeSite);
});

$("toggleHeat").addEventListener("click", () => {
  $("lunarMap").classList.toggle("heat");
  $("toggleHeat").classList.toggle("active");
});

$("resetMap").addEventListener("click", () => {
  activeSite = null;
  shortlist.clear();
  document.querySelectorAll(".zone").forEach(z => z.classList.remove("active"));
  $("scanContent").classList.add("hidden");
  $("emptyScan").classList.remove("hidden");
  $("scanTitle").textContent = "Select a survey zone";
  $("scanState").textContent = "IDLE";
  $("scanState").classList.remove("live");
  $("lunarMap").classList.remove("heat");
  $("toggleHeat").classList.remove("active");
  renderShortlist();
  showToast("Mission workspace reset");
});

$("demoBtn").addEventListener("click", async () => {
  document.querySelector("#scanner").scrollIntoView({ behavior: "smooth" });
  const order = ["A","C","B"];
  for (const key of order) {
    await new Promise(r => setTimeout(r, 800));
    renderSite(key);
  }
  await new Promise(r => setTimeout(r, 500));
  if (!shortlist.has("C")) shortlist.add("C");
  renderShortlist();
  renderSite("C");
  showToast("Demo complete — Shadow Basin shortlisted");
});

renderShortlist();
