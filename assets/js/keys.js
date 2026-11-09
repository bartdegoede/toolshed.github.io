// Keyboard navigation in the style of the toolshed TUI. Everything is a real
// link, so the mouse, touch, the back button and screen readers work as usual;
// this only adds keys on top. Keys with Cmd/Ctrl/Alt are never intercepted,
// and nothing is while typing in the search box (except esc/enter/arrows).
const list = document.getElementById("list");
const page = document.getElementById("content");
const keys = document.getElementById("keys");
const help = document.getElementById("help");
const searchBox = list.querySelector(".search");
const q = document.getElementById("q");
const links = [...list.querySelectorAll("#items a")];

let focus = sessionStorage.getItem("ts-focus") || "list";
let cursor = Math.max(0, links.findIndex((a) => a.hasAttribute("aria-current")));

const visible = () => links.filter((a) => !a.parentElement.classList.contains("hidden"));

function render() {
  links.forEach((a, i) => a.classList.toggle("cursor", i === cursor && focus === "list"));
  list.classList.toggle("focused", focus === "list");
  page.classList.toggle("focused", focus === "page");
  const k = (key, what) => `<b>${key}</b> ${what}`;
  const sep = "<i>·</i>";
  let parts;
  if (!searchBox.hidden && document.activeElement === q) {
    parts = [k("type", "to filter"), k("↑↓", "move"), k("enter", "open"), k("esc", "clear")];
  } else if (focus === "page") {
    parts = [k("j k", "scroll"), k("space", "page down"), k("g G", "top / bottom"), k("tab", "list"), k("?", "keys")];
  } else {
    parts = [k("↑↓", "move"), k("enter", "open"), k("tab", "page"), k("/", "search"), k("?", "keys")];
  }
  keys.innerHTML = parts.join(sep);
}

function move(delta) {
  const vis = visible();
  if (!vis.length) return;
  let i = vis.indexOf(links[cursor]);
  i = i < 0 ? 0 : Math.min(vis.length - 1, Math.max(0, i + delta));
  cursor = links.indexOf(vis[i]);
  links[cursor].scrollIntoView({ block: "nearest" });
  render();
}

function setFocus(f) {
  focus = f;
  sessionStorage.setItem("ts-focus", f);
  (f === "page" ? page : list).focus({ preventScroll: true });
  render();
}

function open() {
  const a = links[cursor];
  if (a && !a.hasAttribute("aria-current")) location.href = a.href;
}

function filter() {
  const terms = q.value.toLowerCase().split(/\s+/).filter(Boolean);
  links.forEach((a) => {
    const hit = terms.every((t) => a.dataset.text.includes(t));
    a.parentElement.classList.toggle("hidden", !hit);
  });
  const vis = visible();
  document.getElementById("none").hidden = vis.length > 0;
  if (vis.length && !vis.includes(links[cursor])) cursor = links.indexOf(vis[0]);
  render();
}

function closeSearch() {
  q.value = "";
  filter();
  searchBox.hidden = true;
  setFocus("list");
}

list.tabIndex = -1;
list.addEventListener("focusin", () => { if (focus !== "list") { focus = "list"; render(); } });
page.addEventListener("focusin", () => { if (focus !== "page") { focus = "page"; render(); } });
list.addEventListener("mousedown", () => { focus = "list"; render(); });
page.addEventListener("mousedown", () => { focus = "page"; render(); });
q.addEventListener("input", filter);
help.addEventListener("click", () => { help.hidden = true; });

document.addEventListener("keydown", (e) => {
  if (e.metaKey || e.ctrlKey || e.altKey) return;
  if (!help.hidden) { help.hidden = true; e.preventDefault(); return; }

  if (document.activeElement === q) {
    switch (e.key) {
      case "Escape": e.preventDefault(); closeSearch(); return;
      case "Enter": e.preventDefault(); sessionStorage.setItem("ts-focus", "list"); open(); return;
      case "ArrowDown": e.preventDefault(); move(1); return;
      case "ArrowUp": e.preventDefault(); move(-1); return;
    }
    return; // typing
  }
  if (e.target.closest && e.target.closest("input, textarea, select, [contenteditable]")) return;

  const onPane = [document.body, list, page].includes(document.activeElement);
  if (e.key === "Tab" && !e.shiftKey && onPane) {
    e.preventDefault();
    setFocus(focus === "list" ? "page" : "list");
    return;
  }
  if (e.key === "?") { e.preventDefault(); help.hidden = false; return; }
  if (e.key === "/") { e.preventDefault(); searchBox.hidden = false; q.focus(); render(); return; }

  if (focus === "page") {
    const step = 64;
    switch (e.key) {
      case "j": case "ArrowDown": e.preventDefault(); page.scrollBy({ top: step }); break;
      case "k": case "ArrowUp": e.preventDefault(); page.scrollBy({ top: -step }); break;
      case " ": e.preventDefault(); page.scrollBy({ top: (e.shiftKey ? -1 : 1) * page.clientHeight * 0.85 }); break;
      case "g": page.scrollTo({ top: 0 }); break;
      case "G": page.scrollTo({ top: page.scrollHeight }); break;
      case "Escape": case "h": case "ArrowLeft": e.preventDefault(); setFocus("list"); break;
    }
    return;
  }
  switch (e.key) {
    case "j": case "ArrowDown": e.preventDefault(); move(1); break;
    case "k": case "ArrowUp": e.preventDefault(); move(-1); break;
    case "g": case "Home": e.preventDefault(); move(-links.length); break;
    case "G": case "End": e.preventDefault(); move(links.length); break;
    case "Enter": case "l": case "ArrowRight": e.preventDefault(); open(); break;
    case "Escape": if (!searchBox.hidden) closeSearch(); break;
  }
});

// The install command's copy button.
document.querySelectorAll("[data-copy]").forEach((b) => b.addEventListener("click", async () => {
  try { await navigator.clipboard.writeText(b.dataset.copy); b.textContent = "copied"; }
  catch { b.textContent = "select it"; }
  setTimeout(() => { b.textContent = "copy"; }, 1500);
}));

// On a phone the list sits above the page; don't move focus around there.
// Analytics events (no-ops without analytics, see partials/analytics.html).
// With Tag Manager they're dataLayer events (add a GA4 event tag with a custom
// event trigger for each); with plain GA4 they go through gtag.
const track = (name, params) => {
  if (typeof window.gtag === "function") window.gtag("event", name, params || {});
  else if (Array.isArray(window.dataLayer)) window.dataLayer.push({ event: name, ...(params || {}) });
};
document.querySelectorAll("[data-copy]").forEach((b) => b.addEventListener("click", () => track("copy_install")));
let searched = false;
q.addEventListener("change", () => { if (q.value.trim()) track("search", { search_term: q.value.trim().slice(0, 80) }); });
q.addEventListener("input", () => { if (!searched && q.value.trim()) { searched = true; track("search_start"); } });
document.addEventListener("keydown", (e) => {
  if (!e.metaKey && !e.ctrlKey && !e.altKey && ["j", "k", "?", "/"].includes(e.key) && document.activeElement !== q) {
    if (!sessionStorage.getItem("ts-keys")) { sessionStorage.setItem("ts-keys", "1"); track("keyboard_nav", { key: e.key }); }
  }
});

const narrow = matchMedia("(max-width: 760px)").matches;
if (narrow) focus = "list";
else if (focus === "page") page.focus({ preventScroll: true }); else list.focus({ preventScroll: true });
render();
