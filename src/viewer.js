/**
 * SpeckleViewerWidget front-end module.
 *
 * Two loading modes:
 * 1. URL mode:   model.speckle_url is set → load via SpeckleLoader + UrlHelper
 * 2. Local mode: model.objects_json is set → load via SpeckleOfflineLoader (no network)
 *
 * SpeckleOfflineLoader expects an array of Base objects with the root first.
 * Python produces: { root_ids: [...], objects: { id: json_string } }
 */

import {
  Viewer,
  DefaultViewerParams,
  SpeckleLoader,
  SpeckleOfflineLoader,
  CameraController,
  SelectionExtension,
  UrlHelper,
} from "@speckle/viewer";

// ── Helpers ────────────────────────────────────────────────────────────────────

/**
 * Convert the Python-produced payload to the array-with-root-first format
 * that SpeckleOfflineLoader / ObjectLoader2 expects.
 */
function payloadToObjectsArray(payload) {
  const { root_ids, objects } = payload;
  const parsed = {};
  for (const [id, jsonStr] of Object.entries(objects)) {
    parsed[id] = JSON.parse(jsonStr);
  }

  const result = [];
  // Root objects first (one per root_id)
  for (const rootId of root_ids) {
    if (parsed[rootId]) result.push(parsed[rootId]);
  }
  // Then all non-root objects
  const rootSet = new Set(root_ids);
  for (const [id, obj] of Object.entries(parsed)) {
    if (!rootSet.has(id)) result.push(obj);
  }
  return result;
}

// ── Render ─────────────────────────────────────────────────────────────────────

export async function render({ model, el }) {
  // ── Container ──────────────────────────────────────────────────────────────
  const style = document.createElement("style");
  style.textContent = `
    .speckle-viewer-wrap {
      position: relative;
      width: 100%;
      border-radius: 8px;
      overflow: hidden;
      background: #1a1a2e;
    }
    .speckle-viewer-wrap canvas {
      display: block;
      width: 100% !important;
    }
    .speckle-viewer-overlay {
      position: absolute;
      inset: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      font-family: system-ui, -apple-system, sans-serif;
      font-size: 14px;
      pointer-events: none;
    }
    .speckle-viewer-overlay .msg {
      background: rgba(0,0,0,0.6);
      color: #e2e8f0;
      padding: 8px 14px;
      border-radius: 6px;
    }
    .speckle-viewer-overlay .error {
      background: rgba(220,38,38,0.8);
      color: #fff;
    }
  `;
  el.appendChild(style);

  const wrap = document.createElement("div");
  wrap.className = "speckle-viewer-wrap";
  wrap.style.height = `${model.get("height")}px`;
  el.appendChild(wrap);

  const overlay = document.createElement("div");
  overlay.className = "speckle-viewer-overlay";
  wrap.appendChild(overlay);

  // ── Viewer init ─────────────────────────────────────────────────────────────
  const viewer = new Viewer(wrap, { ...DefaultViewerParams, verbose: false });
  await viewer.init();
  viewer.createExtension(CameraController);
  viewer.createExtension(SelectionExtension);

  // ── State ───────────────────────────────────────────────────────────────────
  let loadId = 0; // increment on each new load to cancel stale operations

  function showOverlay(msg, isError = false) {
    overlay.innerHTML = "";
    if (msg) {
      const span = document.createElement("span");
      span.className = isError ? "msg error" : "msg";
      span.textContent = msg;
      overlay.appendChild(span);
    }
  }

  function setError(msg) {
    model.set("error_message", msg);
    model.set("is_loading", false);
    model.save_changes();
    showOverlay(msg, true);
  }

  // ── Load URL mode ───────────────────────────────────────────────────────────
  async function loadUrl(myLoadId) {
    const speckleUrl = model.get("speckle_url");
    const token = model.get("token") || "";

    showOverlay("Loading…");
    model.set("is_loading", true);
    model.set("error_message", "");
    model.save_changes();

    try {
      await viewer.unloadAll();
      if (loadId !== myLoadId) return; // stale

      const urls = await UrlHelper.getResourceUrls(speckleUrl, token || undefined);
      for (const url of urls) {
        if (loadId !== myLoadId) return;
        const loader = new SpeckleLoader(viewer.getWorldTree(), url, token || "");
        await viewer.loadObject(loader, true);
      }

      if (loadId !== myLoadId) return;
      showOverlay("");
      model.set("is_loading", false);
      model.save_changes();
    } catch (err) {
      if (loadId !== myLoadId) return;
      setError(err.message || "Failed to load object.");
    }
  }

  // ── Load local objects mode ─────────────────────────────────────────────────
  async function loadObjects(myLoadId) {
    const objectsJson = model.get("objects_json");

    showOverlay("Loading…");
    model.set("is_loading", true);
    model.set("error_message", "");
    model.save_changes();

    try {
      const payload = JSON.parse(objectsJson);
      const objectsArray = payloadToObjectsArray(payload);

      if (!objectsArray.length) {
        throw new Error("No objects to load.");
      }

      await viewer.unloadAll();
      if (loadId !== myLoadId) return;

      // Load each root object separately so they each get their own subtree
      for (const rootId of payload.root_ids) {
        if (loadId !== myLoadId) return;

        // Build a sub-array: root + all its referenced children
        const rootObj = objectsArray.find((o) => o.id === rootId);
        if (!rootObj) continue;

        const childIds = rootObj.__closure ? Object.keys(rootObj.__closure) : [];
        const subArray = [
          rootObj,
          ...objectsArray.filter((o) => childIds.includes(o.id)),
        ];

        const loader = new SpeckleOfflineLoader(
          viewer.getWorldTree(),
          subArray,
          rootId
        );
        await viewer.loadObject(loader, true);
      }

      if (loadId !== myLoadId) return;
      showOverlay("");
      model.set("is_loading", false);
      model.save_changes();
    } catch (err) {
      if (loadId !== myLoadId) return;
      setError(err.message || "Failed to load local objects.");
    }
  }

  // ── Reload dispatcher ───────────────────────────────────────────────────────
  async function reload() {
    const myLoadId = ++loadId;
    const speckleUrl = model.get("speckle_url");
    const objectsJson = model.get("objects_json");

    if (speckleUrl) {
      await loadUrl(myLoadId);
    } else if (objectsJson) {
      await loadObjects(myLoadId);
    } else {
      await viewer.unloadAll();
      showOverlay("");
    }
  }

  // ── Reactivity ──────────────────────────────────────────────────────────────
  model.on("change:speckle_url", reload);
  model.on("change:objects_json", reload);
  model.on("change:height", () => {
    wrap.style.height = `${model.get("height")}px`;
  });

  // Initial load if values are already set
  const initialUrl = model.get("speckle_url");
  const initialObjects = model.get("objects_json");
  if (initialUrl || initialObjects) {
    reload();
  }

  // ── Cleanup ─────────────────────────────────────────────────────────────────
  return () => {
    loadId = Infinity; // cancel any in-progress loads
    viewer.dispose();
  };
}
