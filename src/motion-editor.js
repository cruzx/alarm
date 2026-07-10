const FIGMA_TOKEN_STORAGE_KEY = "motionForge.figmaToken";
const TARGET_FIGMA_URL = "https://www.figma.com/design/uDgk4GWtOgO63qUFpzoa68/PC%E9%A6%96%E9%A1%B5for-%E5%BC%80%E5%8F%91?node-id=0-1&t=Lx5HHL9DQLjQ3Ew8-1";

export function createMotionEditor({ motionForge, canvas }) {
  const playbackIcons = {
    first: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 5h2v14H6z"/><path d="m19 6-9 6 9 6z"/></svg>`,
    previous: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m15 6-9 6 9 6z"/><path d="M17 5h2v14h-2z"/></svg>`,
    play: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m8 5 11 7-11 7z"/></svg>`,
    pause: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 5h4v14H7z"/><path d="M13 5h4v14h-4z"/></svg>`,
    next: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m9 6 9 6-9 6z"/><path d="M5 5h2v14H5z"/></svg>`,
    last: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M16 5h2v14h-2z"/><path d="m5 6 9 6-9 6z"/></svg>`,
  };
  const app = document.createElement("main");
  app.className = "motion-forge-editor";
  app.innerHTML = `
    <aside class="panel project-panel">
      <div class="panel-head">
        <strong>Project Tools</strong>
        <span>${motionForge.width} x ${motionForge.height}</span>
      </div>
      <div class="figma-url-import">
        <input id="figmaUrl" type="text" placeholder="粘贴 Figma 页面链接或 MCP 链接" autocomplete="off" />
        <div class="figma-token-row">
          <input id="figmaToken" type="password" placeholder="Figma token with file_content:read" autocomplete="off" />
          <button id="forgetFigmaToken" type="button">Forget</button>
        </div>
        <div class="figma-actions">
          <button id="fetchFigma" type="button">导入 Figma 图层</button>
          <button id="applyHomepageMotion" type="button">给勾选图层加动效</button>
        </div>
      </div>
      <div id="importStatus" class="import-status">No Figma layers imported</div>
      <div class="target-tools">
        <button id="selectDetailTargets" type="button">勾选可动图层</button>
        <button id="clearTargets" type="button">清空勾选</button>
        <button id="groupTargets" type="button">成组勾选</button>
        <button id="ungroupLayer" type="button">取消成组</button>
        <button id="moveLayerUp" type="button">上移图层</button>
        <button id="moveLayerDown" type="button">下移图层</button>
        <button id="deleteLayer" class="danger-action" type="button">删除图层</button>
      </div>
      <div class="layer-list"></div>
    </aside>
    <section class="stage-panel">
      <div class="topbar">
        <div>
          <strong id="projectTitle">${motionForge.project.name}</strong>
          <span id="timeReadout">0.00s</span>
        </div>
        <div class="transport">
          <button id="renderProject" class="render-action" type="button">下载工程</button>
        </div>
      </div>
      <div class="prompt-bar">
        <div class="prompt-targets" id="promptTargets"></div>
        <input id="motionBrief" type="text" placeholder="描述选中图层要怎么动" autocomplete="off" />
        <button id="createMotion" type="button">执行</button>
        <span id="briefStatus">Blank project</span>
      </div>
      <div class="composition"></div>
      <div class="playback-bar">
        <div class="transport playback-transport">
          <button id="goStart" class="icon-button" type="button" title="最前面" aria-label="最前面">${playbackIcons.first}</button>
          <button id="prevFrame" class="icon-button" type="button" title="上一帧" aria-label="上一帧">${playbackIcons.previous}</button>
          <button id="playPause" class="icon-button primary" type="button" title="暂停" aria-label="暂停">${playbackIcons.pause}</button>
          <button id="nextFrame" class="icon-button" type="button" title="下一帧" aria-label="下一帧">${playbackIcons.next}</button>
          <button id="goEnd" class="icon-button" type="button" title="最后面" aria-label="最后面">${playbackIcons.last}</button>
        </div>
        <div class="canvas-size-controls">
          <span>画布</span>
          <input id="canvasWidth" type="number" min="120" max="4096" step="1" value="${motionForge.width}" aria-label="画布宽度" />
          <span>×</span>
          <input id="canvasHeight" type="number" min="120" max="4096" step="1" value="${motionForge.height}" aria-label="画布高度" />
          <button id="applyCanvasSize" type="button">应用</button>
          <button id="zoomControl" type="button">Fit</button>
          <button id="qualityToggle" type="button">HQ</button>
        </div>
      </div>
    </section>
    <aside class="panel inspector-panel">
      <div class="panel-head">
        <strong>AI Content Generator</strong>
        <span class="credit-pill">1623</span>
      </div>
      <div class="ai-preview-box">
        <strong id="selectedLayerName">No layer</strong>
        <span>Select a Figma layer to edit motion properties</span>
      </div>
      <div class="engine-panel">
        <div class="panel-head compact">
          <strong>Motion Engine</strong>
          <span id="engineStatus">Three.js</span>
        </div>
        <div class="engine-options" role="radiogroup" aria-label="Motion engine">
          <button class="engine-option selected" data-engine="three" type="button">Three.js</button>
          <button class="engine-option" data-engine="p5" type="button">p5.js</button>
          <button class="engine-option" data-engine="lottie" type="button">Lottie</button>
          <button class="engine-option" data-engine="css" type="button">CSS Motion</button>
        </div>
      </div>
      <div class="property-list"></div>
      <button id="exportProject" type="button">Export Project JSON</button>
    </aside>
    <section class="timeline-panel">
      <div class="timeline-ruler"></div>
      <div class="timeline-body"></div>
      <input id="timelineScrub" class="scrubber" type="range" min="0" max="${motionForge.duration}" step="${1 / motionForge.fps}" value="0" />
    </section>
  `;

  document.body.innerHTML = "";
  document.body.appendChild(app);

  const composition = app.querySelector(".composition");
  const previewFrame = document.createElement("div");
  previewFrame.className = "preview-frame";
  const previewEmpty = document.createElement("div");
  previewEmpty.className = "preview-empty";
  previewEmpty.innerHTML = `
    <strong>Figma page is not imported yet</strong>
    <span>Add a Figma token, then fetch and animate this page.</span>
  `;
  const figmaStage = document.createElement("div");
  figmaStage.className = "figma-stage";
  const canvasGuide = document.createElement("div");
  canvasGuide.className = "canvas-guide";
  previewFrame.appendChild(canvas);
  previewFrame.appendChild(canvasGuide);
  previewFrame.appendChild(previewEmpty);
  previewFrame.appendChild(figmaStage);
  composition.appendChild(previewFrame);

  let selectedLayerId = motionForge.project.layers[0]?.id || "";
  let selectedPropertyId = selectedLayerId ? Object.keys(motionForge.project.layers[0].properties)[0] : "";
  let playing = false;
  let draggingLayerId = "";
  const figmaLayerElements = new Map();
  const undoStack = [];
  const redoStack = [];
  let pendingPropertySnapshot = null;
  let previewQuality = "HQ";
  let currentZoom = "fit";
  let activeCanvasDrag = null;
  let zoomIndex = 0;
  const zoomOptions = [
    { label: "Fit", value: "fit" },
    { label: "20%", value: 0.2 },
    { label: "33%", value: 0.33 },
    { label: "50%", value: 0.5 },
    { label: "75%", value: 0.75 },
    { label: "100%", value: 1 },
    { label: "200%", value: 2 },
    { label: "500%", value: 5 },
  ];

  const layerList = app.querySelector(".layer-list");
  const propertyList = app.querySelector(".property-list");
  const timelineBody = app.querySelector(".timeline-body");
  const ruler = app.querySelector(".timeline-ruler");
  const scrubber = app.querySelector("#timelineScrub");
  const playPause = app.querySelector("#playPause");
  const timeReadout = app.querySelector("#timeReadout");
  const importStatus = app.querySelector("#importStatus");
  const projectTitle = app.querySelector("#projectTitle");
  const briefStatus = app.querySelector("#briefStatus");
  const figmaTokenInput = app.querySelector("#figmaToken");
  const figmaUrlInput = app.querySelector("#figmaUrl");
  const motionBriefInput = app.querySelector("#motionBrief");
  const promptTargets = app.querySelector("#promptTargets");
  const engineStatus = app.querySelector("#engineStatus");
  const zoomControl = app.querySelector("#zoomControl");
  const qualityToggle = app.querySelector("#qualityToggle");
  const canvasWidthInput = app.querySelector("#canvasWidth");
  const canvasHeightInput = app.querySelector("#canvasHeight");
  const canvasSizeLabel = app.querySelector(".panel-head span");
  const selectDetailTargets = app.querySelector("#selectDetailTargets");
  const clearTargets = app.querySelector("#clearTargets");
  const groupTargets = app.querySelector("#groupTargets");
  const ungroupLayer = app.querySelector("#ungroupLayer");
  const moveLayerUp = app.querySelector("#moveLayerUp");
  const moveLayerDown = app.querySelector("#moveLayerDown");
  const deleteLayer = app.querySelector("#deleteLayer");
  const applyHomepageMotionButton = app.querySelector("#applyHomepageMotion");
  let selectedMotionEngine = "three";

  figmaUrlInput.value = TARGET_FIGMA_URL;
  motionBriefInput.value = "PC 首页进入动效：导航先出现，主视觉轻微上移淡入，卡片和内容模块错峰浮入，整体有轻微景深感";

  const storedFigmaToken = readStoredFigmaToken();
  if (storedFigmaToken) {
    figmaTokenInput.value = storedFigmaToken;
    importStatus.textContent = "Figma token loaded from this browser";
  }

  const getLayer = (layerId) => motionForge.project.layers.find((layer) => layer.id === layerId);
  const getValue = (layerId, propertyId, seconds) => motionForge.valueAt(layerId, propertyId, seconds);
  const setStatus = (message) => {
    briefStatus.textContent = message;
  };
  const setPlayButton = (isPlaying) => {
    playPause.innerHTML = isPlaying ? playbackIcons.pause : playbackIcons.play;
    playPause.title = isPlaying ? "暂停" : "播放";
    playPause.setAttribute("aria-label", isPlaying ? "暂停" : "播放");
  };
  const projectSnapshot = () => ({
    project: JSON.parse(motionForge.exportProject()),
    selectedLayerId,
    selectedPropertyId,
    time: Number(scrubber.value),
  });
  const snapshotsMatch = (a, b) => JSON.stringify(a) === JSON.stringify(b);
  const pushHistory = () => {
    const snapshot = projectSnapshot();
    if (!undoStack.length || !snapshotsMatch(undoStack.at(-1), snapshot)) {
      undoStack.push(snapshot);
      if (undoStack.length > 80) undoStack.shift();
      redoStack.splice(0, redoStack.length);
      return true;
    }
    return false;
  };
  const restoreSnapshot = (snapshot, status) => {
    if (!snapshot || !motionForge.restoreProjectSnapshot?.(snapshot)) return;
    selectedLayerId = snapshot.selectedLayerId && getLayer(snapshot.selectedLayerId) ? snapshot.selectedLayerId : (motionForge.project.layers[0]?.id || "");
    selectedPropertyId = selectedLayerId && getLayer(selectedLayerId)?.properties[snapshot.selectedPropertyId]
      ? snapshot.selectedPropertyId
      : (selectedLayerId ? Object.keys(getLayer(selectedLayerId).properties)[0] : "");
    const seconds = Math.max(0, Math.min(motionForge.duration, Number(snapshot.time) || 0));
    scrubber.value = String(seconds);
    motionForge.seek(seconds);
    setStatus(status);
    renderAll();
    updateClock(seconds);
  };
  const undo = () => {
    if (pendingPropertySnapshot && !snapshotsMatch(pendingPropertySnapshot, projectSnapshot())) {
      redoStack.push(projectSnapshot());
      restoreSnapshot(pendingPropertySnapshot, "已撤销");
      pendingPropertySnapshot = null;
      return;
    }
    pendingPropertySnapshot = null;
    if (!undoStack.length) {
      setStatus("没有可撤销的操作");
      return;
    }
    redoStack.push(projectSnapshot());
    restoreSnapshot(undoStack.pop(), "已撤销");
  };
  const redo = () => {
    if (!redoStack.length) {
      setStatus("没有可重做的操作");
      return;
    }
    undoStack.push(projectSnapshot());
    restoreSnapshot(redoStack.pop(), "已重做");
  };
  const formatZoom = (value) => value === "fit" ? "Fit" : `${Math.round(Number(value) * 100)}%`;
  const setPreviewZoom = (value, statusPrefix = "预览缩放") => {
    currentZoom = motionForge.setPreviewZoom?.(value) ?? value;
    zoomControl.textContent = formatZoom(currentZoom);
    const matchedIndex = zoomOptions.findIndex((option) => option.value === currentZoom || Number(option.value) === Number(currentZoom));
    if (matchedIndex >= 0) zoomIndex = matchedIndex;
    setStatus(`${statusPrefix} ${formatZoom(currentZoom)}`);
    updateCanvasGuide();
    renderFigmaLayers(Number(scrubber.value));
  };
  const zoomByWheel = (deltaY) => {
    const baseZoom = currentZoom === "fit"
      ? previewFrame.clientWidth / motionForge.width
      : Number(currentZoom);
    const direction = deltaY < 0 ? 1 : -1;
    const factor = direction > 0 ? 1.1 : 1 / 1.1;
    setPreviewZoom(Math.max(0.2, Math.min(5, baseZoom * factor)), "画布缩放");
  };
  const updateDraggedLayerPosition = (event) => {
    if (!activeCanvasDrag) return;
    const scale = previewFrame.clientWidth / motionForge.width || 1;
    let dx = (event.clientX - activeCanvasDrag.startClientX) / scale;
    let dy = (event.clientY - activeCanvasDrag.startClientY) / scale;
    if (event.shiftKey) {
      if (Math.abs(dx) >= Math.abs(dy)) {
        dy = 0;
      } else {
        dx = 0;
      }
    }
    const layer = getLayer(activeCanvasDrag.layerId);
    if (!layer) return;
    const nextX = activeCanvasDrag.startX + dx;
    const nextY = activeCanvasDrag.startY + dy;
    const positionX = layer.properties.positionX;
    const positionY = layer.properties.positionY;
    if (!positionX || !positionY) return;
    positionX.value = nextX;
    positionY.value = nextY;
    motionForge.setKeyframe(layer.id, "positionX", Number(scrubber.value), nextX);
    motionForge.setKeyframe(layer.id, "positionY", Number(scrubber.value), nextY);
    layer.figma.x = nextX;
    layer.figma.y = nextY;
    renderProperties();
    renderTimeline();
    renderFigmaLayers(Number(scrubber.value));
  };
  const finishCanvasDrag = () => {
    if (!activeCanvasDrag) return;
    activeCanvasDrag.element?.classList.remove("dragging-canvas-layer");
    activeCanvasDrag = null;
    document.body.classList.remove("canvas-layer-dragging");
    setStatus("图层位置已更新");
    renderLayers();
    updateActionAvailability();
  };
  const activeMotionTargets = () => {
    const selected = getLayer(selectedLayerId);
    if (selected && !selected.staticCanvas) return [selected];
    return motionForge.project.layers.filter((layer) => layer.kind === "figma" && layer.motionTarget && !layer.staticCanvas);
  };
  const renderPromptTargets = () => {
    const targets = activeMotionTargets();
    if (!targets.length) {
      promptTargets.innerHTML = `<span class="target-chip empty">未选图层</span>`;
      return;
    }
    promptTargets.innerHTML = targets.slice(0, 3).map((layer) => (
      `<button class="target-chip active" data-layer="${layer.id}" type="button">${escapeHtml(layer.name)}</button>`
    )).join("") + (targets.length > 3 ? `<span class="target-chip more">+${targets.length - 3}</span>` : "");
    promptTargets.querySelectorAll("[data-layer]").forEach((chip) => {
      chip.addEventListener("click", () => selectLayerById(chip.dataset.layer, "已选中提示词目标"));
    });
  };
  const setKeyframes = (layer, propertyId, keyframes, value = keyframes.at(-1)?.value) => {
    const property = layer.properties[propertyId];
    if (!property) return;
    property.keyframes = keyframes.map((keyframe) => ({
      time: Math.max(0, Math.min(motionForge.duration, keyframe.time)),
      value: Number(keyframe.value),
    })).sort((a, b) => a.time - b.time);
    property.value = Number(value);
  };
  const applyPromptMotionToTargets = () => {
    const targets = activeMotionTargets();
    if (!targets.length) {
      setStatus("先点击或勾选一个图层");
      motionBriefInput.focus();
      return;
    }
    const prompt = motionBriefInput.value.trim() || "轻微上移淡入";
    const lower = prompt.toLowerCase();
    pushHistory();
    const duration = motionForge.duration;
    const enter = Math.min(duration * 0.36, 0.9);
    const settle = Math.min(duration * 0.52, enter + 0.26);
    const wantsDown = prompt.includes("下") || lower.includes("down");
    const wantsLeft = prompt.includes("左") || lower.includes("left");
    const wantsRight = prompt.includes("右") || lower.includes("right");
    const wantsRotate = prompt.includes("旋转") || lower.includes("rotate") || selectedMotionEngine === "three";
    const wantsBounce = prompt.includes("弹") || lower.includes("bounce") || selectedMotionEngine === "p5";
    const wantsDepth = prompt.includes("景深") || lower.includes("depth") || selectedMotionEngine === "three";
    const wantsScale = prompt.includes("放大") || prompt.includes("缩放") || lower.includes("scale") || wantsDepth;
    const offsetY = wantsDown ? -44 : 44;
    const offsetX = wantsLeft ? 40 : (wantsRight ? -40 : 0);
    targets.forEach((layer, index) => {
      if (layer.kind === "figma") {
        layer.motionTarget = true;
        layer.figma.previewVisible = true;
      }
      const baseX = layer.properties.positionX?.value ?? layer.figma?.x ?? motionForge.width / 2;
      const baseY = layer.properties.positionY?.value ?? layer.figma?.y ?? motionForge.height / 2;
      const delay = Math.min(0.5, index * 0.06);
      const inTime = Math.min(duration - 0.1, enter + delay);
      const settleTime = Math.min(duration - 0.05, settle + delay);
      setKeyframes(layer, "positionX", [
        { time: 0, value: baseX + offsetX },
        { time: delay, value: baseX + offsetX },
        { time: inTime, value: baseX },
        { time: duration, value: baseX },
      ], baseX);
      setKeyframes(layer, "positionY", [
        { time: 0, value: baseY + offsetY },
        { time: delay, value: baseY + offsetY },
        { time: inTime, value: wantsBounce ? baseY - 8 : baseY },
        { time: settleTime, value: baseY },
        { time: duration, value: baseY },
      ], baseY);
      setKeyframes(layer, "opacity", [
        { time: 0, value: lower.includes("flash") ? 35 : 0 },
        { time: delay, value: lower.includes("flash") ? 35 : 0 },
        { time: inTime, value: 100 },
        { time: duration, value: 100 },
      ], 100);
      if (wantsScale) {
        const startScale = selectedMotionEngine === "lottie" ? 96 : 92;
        setKeyframes(layer, "scale", [
          { time: 0, value: startScale },
          { time: delay, value: startScale },
          { time: inTime, value: wantsBounce ? 104 : 101 },
          { time: settleTime, value: 100 },
          { time: duration, value: 100 },
        ], 100);
      }
      if (wantsRotate) {
        const rotate = selectedMotionEngine === "three" ? (index % 2 === 0 ? -5 : 5) : (index % 2 === 0 ? -2 : 2);
        setKeyframes(layer, "rotation", [
          { time: 0, value: rotate },
          { time: delay, value: rotate },
          { time: inTime, value: 0 },
          { time: duration, value: 0 },
        ], 0);
      }
    });
    motionForge.seek(0);
    setStatus(`${engineLabel(selectedMotionEngine)} 已生成 ${targets.length} 个图层动效`);
    importStatus.textContent = `动效已应用到：${targets.map((layer) => layer.name).slice(0, 2).join("、")}${targets.length > 2 ? "..." : ""}`;
    selectedLayerId = targets[0].id;
    selectedPropertyId = "positionY";
    renderAll();
  };
  const engineLabel = (engine) => ({
    three: "Three.js",
    p5: "p5.js",
    lottie: "Lottie",
    css: "CSS Motion",
  })[engine] || "Three.js";

  function selectLayerById(layerId, status = "") {
    const layer = getLayer(layerId);
    if (!layer) return;
    selectedLayerId = layer.id;
    selectedPropertyId = Object.keys(layer.properties)[0] || "";
    if (status) setStatus(status);
    renderLayers();
    renderProperties();
    renderTimeline();
    focusTimelineOnLayer(layer.id);
    renderFigmaLayers(Number(scrubber.value));
    renderPromptTargets();
  }

  function groupSelectedTargets() {
    const targets = motionForge.project.layers.filter((layer) => layer.kind === "figma" && layer.motionTarget && !layer.staticCanvas);
    if (targets.length < 2) return;
    pushHistory();
    const groupCount = new Set(motionForge.project.layers.map((layer) => layer.groupName).filter(Boolean)).size + 1;
    const groupName = `组 ${groupCount}`;
    targets.forEach((layer) => {
      layer.groupName = groupName;
    });
    importStatus.textContent = `已把 ${targets.length} 个图层成组`;
    renderAll();
  }

  function ungroupSelectedLayer() {
    const selectedLayer = getLayer(selectedLayerId);
    const groupName = selectedLayer?.groupName;
    if (!groupName) return;
    pushHistory();
    motionForge.project.layers.forEach((layer) => {
      if (layer.groupName === groupName) delete layer.groupName;
    });
    importStatus.textContent = `已取消 ${groupName}`;
    renderAll();
  }

  function moveSelectedLayer(delta) {
    const index = motionForge.project.layers.findIndex((layer) => layer.id === selectedLayerId);
    const nextIndex = index + delta;
    if (index < 0 || nextIndex < 0 || nextIndex >= motionForge.project.layers.length) return;
    pushHistory();
    const [layer] = motionForge.project.layers.splice(index, 1);
    motionForge.project.layers.splice(nextIndex, 0, layer);
    importStatus.textContent = delta < 0 ? "图层已上移" : "图层已下移";
    renderAll();
  }

  function moveLayerBefore(layerId, targetLayerId) {
    if (!layerId || !targetLayerId || layerId === targetLayerId) return;
    const index = motionForge.project.layers.findIndex((layer) => layer.id === layerId);
    if (index < 0) return;
    pushHistory();
    const [layer] = motionForge.project.layers.splice(index, 1);
    const targetIndex = motionForge.project.layers.findIndex((item) => item.id === targetLayerId);
    if (targetIndex < 0) {
      motionForge.project.layers.push(layer);
    } else {
      motionForge.project.layers.splice(targetIndex, 0, layer);
    }
    selectedLayerId = layer.id;
    selectedPropertyId = Object.keys(layer.properties)[0] || "";
    importStatus.textContent = "图层顺序已更新";
    renderAll();
  }

  function deleteSelectedLayer() {
    const index = motionForge.project.layers.findIndex((layer) => layer.id === selectedLayerId);
    if (index < 0) return;
    pushHistory();
    const [removed] = motionForge.project.layers.splice(index, 1);
    selectedLayerId = motionForge.project.layers[Math.min(index, motionForge.project.layers.length - 1)]?.id || "";
    selectedPropertyId = selectedLayerId ? Object.keys(getLayer(selectedLayerId).properties)[0] : "";
    importStatus.textContent = `已删除 ${removed.name}`;
    renderAll();
  }

  function isEditableEventTarget(target) {
    return target instanceof HTMLInputElement ||
      target instanceof HTMLTextAreaElement ||
      target instanceof HTMLSelectElement ||
      target?.isContentEditable;
  }

  function isTextEntryEventTarget(target) {
    if (target instanceof HTMLTextAreaElement || target?.isContentEditable) return true;
    if (!(target instanceof HTMLInputElement)) return false;
    return ["", "email", "number", "password", "search", "tel", "text", "url"].includes(target.type);
  }

  function visibleProjectLayers() {
    const layerByFigmaId = new Map(
      motionForge.project.layers
        .filter((layer) => layer.kind === "figma" && layer.figma?.nodeId)
        .map((layer) => [layer.figma.nodeId, layer])
    );
    const isHiddenByCollapsedParent = (layer) => {
      let parentId = layer.figma?.parentId || "";
      while (parentId) {
        const parent = layerByFigmaId.get(parentId);
        if (!parent) return false;
        if (parent.expanded === false) return true;
        parentId = parent.figma?.parentId || "";
      }
      return false;
    };
    return motionForge.project.layers.filter((layer) => !isHiddenByCollapsedParent(layer));
  }

  function toggleLayerExpanded(layerId) {
    const layer = getLayer(layerId);
    if (!layer?.figma?.hasChildren) return;
    pushHistory();
    layer.expanded = layer.expanded === false;
    importStatus.textContent = layer.expanded ? `已展开 ${layer.name}` : `已收起 ${layer.name}`;
    if (!visibleProjectLayers().some((visibleLayer) => visibleLayer.id === selectedLayerId)) {
      selectedLayerId = layer.id;
      selectedPropertyId = Object.keys(layer.properties)[0] || "";
    }
    renderAll();
  }

  function renderLayers() {
    if (!motionForge.project.layers.length) {
      layerList.innerHTML = `<div class="empty-state">No layers yet</div>`;
      return;
    }

    layerList.innerHTML = visibleProjectLayers()
      .map((layer) => `
        <div class="layer-row ${layer.id === selectedLayerId ? "selected" : ""} ${layer.staticCanvas ? "static-canvas" : ""} ${layer.figma?.hasChildren ? "figma-parent-layer" : ""} ${layer.expanded === false ? "collapsed" : ""}" data-layer="${layer.id}" role="button" tabindex="0" draggable="true" style="--layer-depth:${Math.min(8, layer.figma?.depth || 0)}">
          ${layer.figma?.hasChildren ? `<button class="expand-toggle" type="button" aria-label="${layer.expanded === false ? "展开" : "收起"} ${escapeHtml(layer.name)}" title="${layer.expanded === false ? "展开" : "收起"}"></button>` : `<span class="expand-spacer"></span>`}
          <label class="target-check" title="Motion target">
            <input type="checkbox" ${layer.motionTarget ? "checked" : ""} ${layer.staticCanvas ? "disabled" : ""} aria-label="Use ${escapeHtml(layer.name)} as motion target" />
          </label>
          <span style="--layer-color:${layer.color}"></span>
          <strong>${layer.name}${layer.groupName ? `<em>${escapeHtml(layer.groupName)}</em>` : ""}</strong>
          <small>${layer.staticCanvas ? "Static" : (layer.kind === "figma" ? layer.figma.type : "3D")}</small>
        </div>
      `)
      .join("");

    layerList.querySelectorAll(".layer-row").forEach((row) => {
      const checkbox = row.querySelector("input");
      row.querySelector(".expand-toggle")?.addEventListener("click", (event) => {
        event.preventDefault();
        event.stopPropagation();
        toggleLayerExpanded(row.dataset.layer);
      });
      row.querySelector(".target-check")?.addEventListener("click", (event) => {
        event.stopPropagation();
      });
      checkbox?.addEventListener("change", (event) => {
        event.stopPropagation();
        pushHistory();
        motionForge.setMotionTarget(row.dataset.layer, checkbox.checked);
        importStatus.textContent = checkbox.checked ? "已勾选为动效目标" : "已取消动效目标";
        updateActionAvailability();
        renderFigmaLayers(Number(scrubber.value));
      });

      const selectLayer = () => selectLayerById(row.dataset.layer, "已选中图层");
      row.addEventListener("click", selectLayer);
      row.addEventListener("keydown", (event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          selectLayer();
        }
      });
      row.addEventListener("dragstart", (event) => {
        draggingLayerId = row.dataset.layer;
        event.dataTransfer.effectAllowed = "move";
        event.dataTransfer.setData("text/plain", draggingLayerId);
        row.classList.add("dragging");
        selectLayerById(draggingLayerId);
      });
      row.addEventListener("dragover", (event) => {
        if (!draggingLayerId || draggingLayerId === row.dataset.layer) return;
        event.preventDefault();
        event.dataTransfer.dropEffect = "move";
        row.classList.add("drop-target");
      });
      row.addEventListener("dragleave", () => {
        row.classList.remove("drop-target");
      });
      row.addEventListener("drop", (event) => {
        event.preventDefault();
        row.classList.remove("drop-target");
        moveLayerBefore(event.dataTransfer.getData("text/plain") || draggingLayerId, row.dataset.layer);
      });
      row.addEventListener("dragend", () => {
        draggingLayerId = "";
        row.classList.remove("dragging", "drop-target");
      });
    });
  }

  function renderProperties() {
    const layer = getLayer(selectedLayerId);
    if (!layer) {
      app.querySelector("#selectedLayerName").textContent = "No layer";
      propertyList.innerHTML = `<div class="empty-state">Create motion or import Figma layers</div>`;
      return;
    }

    app.querySelector("#selectedLayerName").textContent = layer.name;
    propertyList.innerHTML = Object.entries(layer.properties)
      .map(([propertyId, property]) => `
        <label class="property-row ${propertyId === selectedPropertyId ? "selected" : ""}" data-property="${propertyId}">
          <span>${property.label}</span>
          <input type="range" min="${property.min}" max="${property.max}" step="${property.step ?? 1}" value="${property.value}" />
          <output>${formatValue(property.value, property.unit)}</output>
          <button type="button">Key</button>
        </label>
      `)
      .join("");

    propertyList.querySelectorAll(".property-row").forEach((row) => {
      const propertyId = row.dataset.property;
      const property = layer.properties[propertyId];
      const input = row.querySelector("input");
      const output = row.querySelector("output");
      const keyButton = row.querySelector("button");

      row.addEventListener("click", () => {
        selectedPropertyId = propertyId;
        renderTimeline();
        renderProperties();
      });

      input.addEventListener("input", () => {
        if (!pendingPropertySnapshot) pendingPropertySnapshot = projectSnapshot();
        property.value = Number(input.value);
        output.textContent = formatValue(property.value, property.unit);
        motionForge.setKeyframe(selectedLayerId, propertyId, Number(scrubber.value), property.value);
        renderTimeline();
        renderFigmaLayers(Number(scrubber.value));
      });

      input.addEventListener("change", () => {
        if (!pendingPropertySnapshot) return;
        if (!snapshotsMatch(pendingPropertySnapshot, projectSnapshot())) {
          undoStack.push(pendingPropertySnapshot);
          if (undoStack.length > 80) undoStack.shift();
          redoStack.splice(0, redoStack.length);
        }
        pendingPropertySnapshot = null;
      });

      keyButton.addEventListener("click", (event) => {
        event.stopPropagation();
        pushHistory();
        motionForge.setKeyframe(selectedLayerId, propertyId, Number(scrubber.value), property.value);
        renderTimeline();
        renderFigmaLayers(Number(scrubber.value));
      });
    });
  }

  function renderTimeline() {
    const total = motionForge.duration;
    const current = Number(scrubber.value);
    ruler.innerHTML = `<div class="timeline-scale">${Array.from({ length: Math.floor(total) + 1 }, (_, second) => (
      `<span style="left:${(second / total) * 100}%">${second}s</span>`
    )).join("")}</div>`;
    updateTimelinePlayhead(current);

    if (!motionForge.project.layers.length) {
      timelineBody.innerHTML = `<div class="timeline-empty">Timeline is waiting for layers</div>`;
      return;
    }

    const visibleLayers = visibleProjectLayers();
    timelineBody.innerHTML = visibleLayers.map((layer) => {
      const tracks = Object.entries(layer.properties).map(([propertyId, property]) => `
        <div class="track ${layer.id === selectedLayerId && propertyId === selectedPropertyId ? "selected" : ""}" data-layer="${layer.id}" data-property="${propertyId}">
          <span>${property.label}</span>
          <div class="track-lane">
            ${property.keyframes.map((keyframe) => (
              `<button class="keyframe ${layer.id === selectedLayerId && propertyId === selectedPropertyId && Math.abs(keyframe.time - current) < 0.02 ? "active" : ""}" style="left:${(keyframe.time / total) * 100}%" data-time="${keyframe.time}" data-value="${keyframe.value}" type="button" title="${keyframe.time.toFixed(2)}s · ${formatValue(keyframe.value, property.unit)}" aria-label="${property.label} keyframe at ${keyframe.time.toFixed(2)} seconds"></button>`
            )).join("")}
          </div>
        </div>
      `).join("");
      return `<div class="track-group ${layer.id === selectedLayerId ? "selected-layer" : ""}" data-layer="${layer.id}"><strong>${layer.name}</strong>${tracks}</div>`;
    }).join("");

    timelineBody.querySelectorAll(".track").forEach((track) => {
      track.addEventListener("click", () => {
        selectedLayerId = track.dataset.layer;
        selectedPropertyId = track.dataset.property;
        renderAll();
      });
    });

    timelineBody.querySelectorAll(".keyframe").forEach((keyframe) => {
      keyframe.addEventListener("click", (event) => {
        event.stopPropagation();
        scrubber.value = keyframe.dataset.time;
        motionForge.seek(Number(keyframe.dataset.time));
        updateClock(Number(keyframe.dataset.time));
        renderTimeline();
      });
    });
  }

  function updateTimelinePlayhead(seconds) {
    const percent = `${(Math.max(0, Math.min(motionForge.duration, seconds)) / motionForge.duration) * 100}%`;
    timelineBody.style.setProperty("--playhead", percent);
  }

  function focusTimelineOnLayer(layerId) {
    const group = timelineBody.querySelector(`.track-group[data-layer="${CSS.escape(layerId)}"]`);
    if (!group) return;
    const targetTop = group.offsetTop - (timelineBody.clientHeight - group.clientHeight) / 2;
    timelineBody.scrollTo({
      top: Math.max(0, targetTop),
      behavior: "smooth",
    });
    group.classList.add("focus-pulse");
    window.setTimeout(() => group.classList.remove("focus-pulse"), 650);
  }

  function downloadTextFile(filename, text, type = "application/json") {
    const blob = new Blob([text], { type });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }

  async function copyProjectJson(statusTarget = briefStatus) {
    const json = motionForge.exportProject();
    try {
      await navigator.clipboard.writeText(json);
      statusTarget.textContent = "Project JSON copied";
      return true;
    } catch {
      downloadTextFile("motion-forge-project.json", json);
      statusTarget.textContent = "Clipboard blocked; JSON downloaded";
      return false;
    }
  }

  function renderProjectExport() {
    downloadTextFile("motion-forge-project.json", motionForge.exportProject());
    setStatus("工程文件已下载");
    importStatus.textContent = "这是工程 JSON；最终 MP4/Lottie 需要运行导出命令";
  }

  function renderFigmaLayers(seconds) {
    const figmaLayers = motionForge.project.layers.filter((layer) => layer.kind === "figma");
    const scale = previewFrame.clientWidth / motionForge.width || 1;
    const visibleLayerIds = new Set(figmaLayers.map((layer) => layer.id));

    figmaLayerElements.forEach((element, layerId) => {
      if (!visibleLayerIds.has(layerId)) {
        element.remove();
        figmaLayerElements.delete(layerId);
      }
    });

    figmaLayers.forEach((layer) => {
      const x = getValue(layer.id, "positionX", seconds);
      const y = getValue(layer.id, "positionY", seconds);
      const s = getValue(layer.id, "scale", seconds) / 100;
      const r = getValue(layer.id, "rotation", seconds);
      const opacity = getValue(layer.id, "opacity", seconds) / 100;
      const showContent = layer.figma.isCanvasSnapshot || layer.figma.previewVisible !== false || layer.motionTarget;
      const hasImage = showContent && Boolean(layer.figma.imageUrl);
      const style = [
        `left:${x * scale}px`,
        `top:${y * scale}px`,
        `width:${layer.figma.width * scale}px`,
        `height:${layer.figma.height * scale}px`,
        `background:${showContent && !hasImage ? layer.figma.fill : "transparent"}`,
        `border-radius:${layer.figma.radius * scale}px`,
        `opacity:${opacity}`,
        `transform:translate(-50%, -50%) rotate(${r}deg) scale(${s})`,
        `color:${layer.figma.textColor}`,
      ].join(";");
      const content = layer.figma.type === "TEXT" ? escapeHtml(layer.figma.characters || layer.name) : "";
      let element = figmaLayerElements.get(layer.id);

      if (!element) {
        element = document.createElement("div");
        element.dataset.layer = layer.id;
        element.role = "button";
        element.tabIndex = 0;
        element.addEventListener("click", (event) => {
          event.stopPropagation();
          selectLayerById(layer.id, "已选中画布图层");
        });
        element.addEventListener("pointerdown", (event) => {
          if (event.button !== 0) return;
          event.preventDefault();
          event.stopPropagation();
          selectLayerById(layer.id, "已选中画布图层");
          if (layer.staticCanvas) return;
          pushHistory();
          if (layer.kind === "figma" && !layer.motionTarget) {
            layer.motionTarget = true;
            importStatus.textContent = "已勾选为动效目标";
          }
          activeCanvasDrag = {
            layerId: layer.id,
            element,
            startClientX: event.clientX,
            startClientY: event.clientY,
            startX: getValue(layer.id, "positionX", Number(scrubber.value)),
            startY: getValue(layer.id, "positionY", Number(scrubber.value)),
          };
          document.body.classList.add("canvas-layer-dragging");
          element.classList.add("dragging-canvas-layer");
          element.setPointerCapture?.(event.pointerId);
        });
        element.addEventListener("keydown", (event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            event.stopPropagation();
            selectLayerById(layer.id, "已选中画布图层");
          }
        });
        figmaLayerElements.set(layer.id, element);
        figmaStage.appendChild(element);
      }

      element.className = `figma-layer ${layer.figma.type.toLowerCase()} ${hasImage ? "has-image" : ""} ${showContent ? "" : "ghost"} ${layer.id === selectedLayerId ? "selected" : ""} ${activeCanvasDrag?.layerId === layer.id ? "dragging-canvas-layer" : ""}`;
      element.setAttribute("aria-label", `选择 ${layer.name}`);
      element.style.cssText = style;
      figmaStage.appendChild(element);
      if (!showContent) {
        if (element.innerHTML) element.innerHTML = "";
        delete element.dataset.imageUrl;
        delete element.dataset.textContent;
      } else if (hasImage) {
        if (element.dataset.imageUrl !== layer.figma.imageUrl) {
          element.innerHTML = `<img src="${escapeHtml(layer.figma.imageUrl)}" alt="" />`;
          element.dataset.imageUrl = layer.figma.imageUrl;
        }
      } else if (element.dataset.textContent !== content || element.dataset.imageUrl) {
        element.innerHTML = content;
        element.dataset.textContent = content;
        delete element.dataset.imageUrl;
      }
    });
  }

  function updateClock(seconds) {
    timeReadout.textContent = `${seconds.toFixed(2)}s`;
    scrubber.value = String(seconds);
    updateTimelinePlayhead(seconds);
    renderFigmaLayers(seconds);
    updatePreviewEmpty();
    updateCanvasGuide();
  }

  function renderAll() {
    if (selectedLayerId && !getLayer(selectedLayerId)) {
      selectedLayerId = motionForge.project.layers[0]?.id || "";
    }
    if (selectedLayerId && !selectedPropertyId) {
      selectedPropertyId = Object.keys(getLayer(selectedLayerId).properties)[0] || "";
    }
    projectTitle.textContent = motionForge.project.name;
    renderLayers();
    renderProperties();
    renderTimeline();
    renderFigmaLayers(Number(scrubber.value));
    renderPromptTargets();
    updatePreviewEmpty();
    updateCanvasGuide();
    updateActionAvailability();
  }

  function updateActionAvailability() {
    const figmaLayers = motionForge.project.layers.filter((layer) => layer.kind === "figma");
    const targetableLayers = figmaLayers.filter((layer) => !layer.staticCanvas);
    const selectedTargets = targetableLayers.filter((layer) => layer.motionTarget);
    const selectedLayer = getLayer(selectedLayerId);
    const selectedLayerIndex = motionForge.project.layers.findIndex((layer) => layer.id === selectedLayerId);
    selectDetailTargets.disabled = targetableLayers.length === 0;
    clearTargets.disabled = selectedTargets.length === 0;
    applyHomepageMotionButton.disabled = selectedTargets.length === 0;
    groupTargets.disabled = selectedTargets.length < 2;
    ungroupLayer.disabled = !selectedLayer?.groupName;
    moveLayerUp.disabled = selectedLayerIndex <= 0;
    moveLayerDown.disabled = selectedLayerIndex < 0 || selectedLayerIndex >= motionForge.project.layers.length - 1;
    deleteLayer.disabled = !selectedLayer;
  }

  function updatePreviewEmpty() {
    const hasVisibleScene = motionForge.project.layers.length > 0;
    previewEmpty.hidden = hasVisibleScene;
  }

  function updateCanvasGuide() {
    const scale = previewFrame.clientWidth / motionForge.width || 1;
    const canvasBounds = motionForge.project.canvas || {
      x: 0,
      y: 0,
      width: motionForge.width,
      height: motionForge.height,
    };
    canvasGuide.hidden = motionForge.project.layers.every((layer) => layer.kind !== "figma");
    canvasGuide.style.left = `${canvasBounds.x * scale}px`;
    canvasGuide.style.top = `${canvasBounds.y * scale}px`;
    canvasGuide.style.width = `${canvasBounds.width * scale}px`;
    canvasGuide.style.height = `${canvasBounds.height * scale}px`;
    const top = canvasBounds.y * scale;
    const left = canvasBounds.x * scale;
    const right = Math.max(0, previewFrame.clientWidth - (canvasBounds.x + canvasBounds.width) * scale);
    const bottom = Math.max(0, previewFrame.clientHeight - (canvasBounds.y + canvasBounds.height) * scale);
    figmaStage.style.clipPath = `inset(${top}px ${right}px ${bottom}px ${left}px)`;
  }

  function needsFigmaImport() {
    const brief = motionBriefInput.value.toLowerCase();
    return Boolean(figmaUrlInput.value.trim()) && (
      brief.includes("figma") ||
      brief.includes("homepage") ||
      motionBriefInput.value.includes("首页") ||
      motionForge.project.layers.every((layer) => layer.kind !== "figma")
    );
  }

  async function fetchAndAnimateFigma() {
    const url = figmaUrlInput.value.trim();
    const token = figmaTokenInput.value.trim();
    if (!url) {
      importStatus.textContent = "Paste a Figma URL first";
      figmaUrlInput.focus();
      return false;
    }
    if (!token) {
      importStatus.textContent = "Figma token is required before this page can be shown";
      briefStatus.textContent = "Add Figma token first";
      figmaTokenInput.focus();
      return false;
    }

    try {
      saveFigmaToken(token);
      importStatus.textContent = "Fetching Figma file...";
      briefStatus.textContent = "Fetching Figma...";
      const figmaSource = await fetchFigmaFile(url, token);
      const layers = figmaJsonToLayers(figmaSource.json, motionForge, { targetNodeId: figmaSource.nodeId });
      await attachFigmaImages(layers, figmaSource.fileKey, token);
      pushHistory();
      const imported = motionForge.importFigmaLayers(layers);
      importStatus.textContent = `Imported ${imported} Figma layers from URL; select target layers, then animate`;
      briefStatus.textContent = "Select target layers";
      selectedLayerId = layers[0]?.id || selectedLayerId;
      selectedPropertyId = selectedLayerId ? Object.keys(getLayer(selectedLayerId).properties)[0] : "";
      renderAll();
      return true;
    } catch (error) {
      importStatus.textContent = `Figma fetch failed: ${error.message}`;
      briefStatus.textContent = "Figma fetch failed";
      renderAll();
      return false;
    }
  }

  scrubber.addEventListener("input", () => {
    playing = false;
    setPlayButton(false);
    motionForge.seek(Number(scrubber.value));
    updateClock(Number(scrubber.value));
  });

  zoomControl.addEventListener("click", () => {
    zoomIndex = (zoomIndex + 1) % zoomOptions.length;
    const option = zoomOptions[zoomIndex];
    setPreviewZoom(option.value);
  });

  composition.addEventListener("wheel", (event) => {
    if (!event.shiftKey) return;
    event.preventDefault();
    zoomByWheel(event.deltaY);
  }, { passive: false });

  window.addEventListener("pointermove", updateDraggedLayerPosition);
  window.addEventListener("pointerup", finishCanvasDrag);
  window.addEventListener("pointercancel", finishCanvasDrag);

  qualityToggle.addEventListener("click", () => {
    previewQuality = previewQuality === "HQ" ? "Draft" : "HQ";
    qualityToggle.textContent = previewQuality;
    motionForge.setPreviewQuality?.(previewQuality);
    setStatus(`${previewQuality} 预览质量`);
  });

  playPause.addEventListener("click", () => {
    playing = !playing;
    if (playing) {
      setPlayButton(true);
      motionForge.play();
    } else {
      setPlayButton(false);
      motionForge.pause();
    }
  });

  app.querySelector("#renderProject").addEventListener("click", renderProjectExport);
  app.querySelector("#goStart").addEventListener("click", () => {
    motionForge.seek(0);
    setStatus("已到最前面");
  });
  app.querySelector("#prevFrame").addEventListener("click", () => {
    playing = false;
    setPlayButton(false);
    motionForge.seek(Math.max(0, Number(scrubber.value) - 1 / motionForge.fps));
    setStatus("已到上一帧");
  });
  app.querySelector("#nextFrame").addEventListener("click", () => {
    playing = false;
    setPlayButton(false);
    motionForge.seek(Math.min(motionForge.duration - 1 / motionForge.fps, Number(scrubber.value) + 1 / motionForge.fps));
    setStatus("已到下一帧");
  });
  app.querySelector("#goEnd").addEventListener("click", () => {
    motionForge.seek(motionForge.duration - 1 / motionForge.fps);
    setStatus("已到最后面");
  });
  app.querySelector("#applyCanvasSize").addEventListener("click", () => {
    const recordedHistory = pushHistory();
    const result = motionForge.setCanvasSize?.(Number(canvasWidthInput.value), Number(canvasHeightInput.value));
    if (!result) {
      if (recordedHistory) undoStack.pop();
      setStatus("画布尺寸无效");
      return;
    }
    canvasWidthInput.value = result.width;
    canvasHeightInput.value = result.height;
    canvasSizeLabel.textContent = `${result.width} x ${result.height}`;
    setStatus("画布尺寸已更新");
    renderAll();
  });
  figmaTokenInput.addEventListener("input", () => {
    const token = figmaTokenInput.value.trim();
    if (token) {
      saveFigmaToken(token);
      importStatus.textContent = "Figma token saved locally";
    }
  });
  app.querySelector("#forgetFigmaToken").addEventListener("click", () => {
    clearStoredFigmaToken();
    figmaTokenInput.value = "";
    figmaTokenInput.focus();
    importStatus.textContent = "Saved Figma token cleared";
  });
  app.querySelector("#createMotion").addEventListener("click", async () => {
    if (needsFigmaImport()) {
      await fetchAndAnimateFigma();
      return;
    }

    if (activeMotionTargets().length) {
      applyPromptMotionToTargets();
      return;
    }

    pushHistory();
    const result = motionForge.createMotionFromPrompt(motionBriefInput.value);
    briefStatus.textContent = result;
    selectedLayerId = motionForge.project.layers[0]?.id || "";
    selectedPropertyId = selectedLayerId ? Object.keys(getLayer(selectedLayerId).properties)[0] : "";
    renderAll();
  });
  app.querySelectorAll(".engine-option").forEach((button) => {
    button.addEventListener("click", () => {
      selectedMotionEngine = button.dataset.engine || "three";
      app.querySelectorAll(".engine-option").forEach((option) => {
        option.classList.toggle("selected", option === button);
      });
      engineStatus.textContent = engineLabel(selectedMotionEngine);
      setStatus(`使用 ${engineLabel(selectedMotionEngine)} 生成动效`);
    });
  });
  app.querySelector("#exportProject").addEventListener("click", () => copyProjectJson(app.querySelector("#selectedLayerName")));
  app.querySelector("#fetchFigma").addEventListener("click", fetchAndAnimateFigma);
  app.querySelector("#applyHomepageMotion").addEventListener("click", () => {
    pushHistory();
    const result = motionForge.applyHomepageMotion?.() || applyHomepageMotion(motionForge);
    importStatus.textContent = result;
    selectedLayerId = motionForge.project.layers.find((layer) => layer.kind === "figma" && layer.motionTarget)?.id || selectedLayerId;
    selectedPropertyId = selectedLayerId ? Object.keys(getLayer(selectedLayerId).properties)[0] : "";
    renderAll();
  });
  groupTargets.addEventListener("click", groupSelectedTargets);
  ungroupLayer.addEventListener("click", ungroupSelectedLayer);
  moveLayerUp.addEventListener("click", () => moveSelectedLayer(-1));
  moveLayerDown.addEventListener("click", () => moveSelectedLayer(1));
  deleteLayer.addEventListener("click", deleteSelectedLayer);
  app.querySelector("#selectDetailTargets").addEventListener("click", () => {
    pushHistory();
    motionForge.project.layers.forEach((layer) => {
      if (layer.kind === "figma") motionForge.setMotionTarget(layer.id, !layer.staticCanvas);
    });
    importStatus.textContent = "已勾选可做动效的图层";
    renderAll();
  });
  app.querySelector("#clearTargets").addEventListener("click", () => {
    pushHistory();
    motionForge.project.layers.forEach((layer) => {
      if (layer.kind === "figma") motionForge.setMotionTarget(layer.id, false);
    });
    importStatus.textContent = "已清空图层勾选";
    renderAll();
  });

  window.addEventListener("motionforge:time", (event) => updateClock(event.detail.seconds));
  window.addEventListener("motionforge:resize-preview", () => {
    updateCanvasGuide();
    renderFigmaLayers(Number(scrubber.value));
  });
  window.addEventListener("keydown", (event) => {
    const key = event.key.toLowerCase();
    const commandKey = event.metaKey || event.ctrlKey;
    if (commandKey && (key === "z" || key === "y") && !isTextEntryEventTarget(event.target)) {
      event.preventDefault();
      if (key === "y" || event.shiftKey) {
        redo();
      } else {
        undo();
      }
      return;
    }
    if (isEditableEventTarget(event.target)) return;
    if ((event.key === "Delete" || event.key === "Backspace") && selectedLayerId) {
      event.preventDefault();
      deleteSelectedLayer();
    }
    if (commandKey && key === "g") {
      event.preventDefault();
      groupSelectedTargets();
    }
  });
  renderAll();
  if (storedFigmaToken && TARGET_FIGMA_URL && !motionForge.project.layers.length) {
    window.setTimeout(() => {
      fetchAndAnimateFigma();
    }, 150);
  }
  setPlayButton(false);
}

async function fetchFigmaFile(figmaUrl, token) {
  const { fileKey, nodeId } = parseFigmaUrl(figmaUrl);
  const response = await fetch(`https://api.figma.com/v1/files/${fileKey}`, {
    headers: {
      "X-Figma-Token": token,
    },
  });

  if (!response.ok) {
    const body = await response.text().catch(() => "");
    throw new Error(`${response.status} ${response.statusText}${body ? `: ${body.slice(0, 120)}` : ""}`);
  }

  return {
    fileKey,
    nodeId,
    json: await response.json(),
  };
}

async function attachFigmaImages(layers, fileKey, token) {
  const nodeIds = layers
    .filter((layer) => layer.figma.isCanvasSnapshot || (!layer.figma.hasChildren && layer.figma.type !== "TEXT"))
    .map((layer) => layer.figma.nodeId)
    .filter(Boolean);
  if (!nodeIds.length) return;
  const params = new URLSearchParams({
    ids: nodeIds.join(","),
    format: "png",
    scale: "2",
  });
  const response = await fetch(`https://api.figma.com/v1/images/${fileKey}?${params}`, {
    headers: {
      "X-Figma-Token": token,
    },
  });
  if (!response.ok) return;
  const payload = await response.json();
  layers.forEach((layer) => {
    const imageUrl = payload.images?.[layer.figma.nodeId];
    if (imageUrl) layer.figma.imageUrl = imageUrl;
  });
}

function parseFigmaUrl(value) {
  const rawValue = String(value || "").trim();
  const markdownLink = rawValue.match(/\(([^)]+)\)/);
  const candidate = markdownLink?.[1] || rawValue.match(/[a-z][a-z0-9+.-]*:\/\/[^\s"'<>]+/i)?.[0] || rawValue;
  let url;
  try {
    url = new URL(candidate);
  } catch {
    throw new Error("Invalid Figma URL or MCP link");
  }

  const fileKeyFromParams = url.searchParams.get("fileKey") ||
    url.searchParams.get("file-key") ||
    url.searchParams.get("file") ||
    url.searchParams.get("key");
  const parts = [url.hostname, ...url.pathname.split("/")]
    .filter(Boolean)
    .filter((part) => !["www.figma.com", "figma.com", "figma", "mcp"].includes(part.toLowerCase()));
  const marker = parts.findIndex((part) => ["file", "design", "proto", "board", "slides"].includes(part));
  const keyLikePart = parts.find((part) => /^[a-zA-Z0-9_-]{8,}$/.test(part) && !["file", "design", "proto", "board", "slides"].includes(part));
  const fileKey = fileKeyFromParams || (marker >= 0 ? parts[marker + 1] : "") || keyLikePart || "";
  const rawNodeId = url.searchParams.get("node-id") ||
    url.searchParams.get("nodeId") ||
    url.searchParams.get("node_id") ||
    url.searchParams.get("node") ||
    "";
  const nodeId = rawNodeId ? decodeURIComponent(rawNodeId).replaceAll("-", ":") : "";

  if (!fileKey || !/^[a-zA-Z0-9_-]+$/.test(fileKey)) {
    throw new Error("Could not find Figma file key in URL or MCP link");
  }

  return { fileKey, nodeId };
}

function figmaJsonToLayers(figmaJson, motionForge, options = {}) {
  const root = figmaJson.document || Object.values(figmaJson.nodes || {})[0]?.document || figmaJson;
  const target = findFigmaNode(root, options.targetNodeId) || findDefaultFrame(root) || root;
  const targetBounds = target.absoluteBoundingBox || boundsOfChildren(target.children || []);
  const nodes = importableNodes(target);

  if (!targetBounds || !nodes.length) {
    throw new Error("No positioned Figma nodes found");
  }

  const figmaWidth = Math.max(1, targetBounds.width);
  const figmaHeight = Math.max(1, targetBounds.height);
  const fitScale = Math.min(motionForge.width / figmaWidth, motionForge.height / figmaHeight) * 0.82;
  const offsetX = (motionForge.width - figmaWidth * fitScale) / 2;
  const offsetY = (motionForge.height - figmaHeight * fitScale) / 2;
  motionForge.project.canvas = {
    x: offsetX,
    y: offsetY,
    width: figmaWidth * fitScale,
    height: figmaHeight * fitScale,
    sourceWidth: figmaWidth,
    sourceHeight: figmaHeight,
  };

  const targetNodeId = target.id || "target-frame";
  const safeTargetId = String(targetNodeId).replace(/[^a-zA-Z0-9_-]/g, "-");
  const canvasX = offsetX + (figmaWidth * fitScale) / 2;
  const canvasY = offsetY + (figmaHeight * fitScale) / 2;
  const canvasFill = figmaFill(target, 0);
  const canvasLayer = {
    id: `figma-canvas-${safeTargetId}`,
    kind: "figma",
    name: target.name || "Figma Canvas",
    color: "#22d3ee",
    expanded: true,
    motionTarget: false,
    staticCanvas: true,
    figma: {
      nodeId: targetNodeId,
      parentName: "",
      type: target.type || "FRAME",
      x: canvasX,
      y: canvasY,
      width: figmaWidth * fitScale,
      height: figmaHeight * fitScale,
      fill: canvasFill,
      radius: Number(target.cornerRadius || 0) * fitScale,
      characters: "",
      textColor: textColorFor(canvasFill),
      imageUrl: "",
      hasChildren: visiblePositionedChildren(target).length > 0,
      childCount: visiblePositionedChildren(target).length,
      parentId: "",
      depth: 0,
      groupPath: "",
      isCanvasSnapshot: true,
      previewVisible: true,
    },
    properties: transformProperties(canvasX, canvasY, motionForge),
  };

  const childLayers = nodes.slice(0, 180).map((entry, index) => {
    const node = entry.node || entry;
    const box = node.absoluteBoundingBox;
    const width = Math.max(2, box.width * fitScale);
    const height = Math.max(2, box.height * fitScale);
    const x = offsetX + (box.x - targetBounds.x) * fitScale + width / 2;
    const y = offsetY + (box.y - targetBounds.y) * fitScale + height / 2;
    const fill = figmaFill(node, index);
    const color = figmaColor(node, fill);
    const id = `figma-${String(node.id || index).replace(/[^a-zA-Z0-9_-]/g, "-")}`;
    const staticCanvas = isStaticCanvasNode(node, targetBounds);

    return {
      id,
      kind: "figma",
      name: node.name || `${node.type} ${index + 1}`,
      color,
      expanded: true,
      motionTarget: false,
      staticCanvas,
      figmaParentId: entry.parentId || "",
      figmaDepth: entry.depth || 0,
      figmaChildCount: entry.childCount || 0,
      figma: {
        nodeId: node.id || id,
        parentName: entry.parentName || "",
        parentId: entry.parentId || "",
        depth: entry.depth || 0,
        groupPath: entry.groupPath || "",
        type: node.type || "NODE",
        x,
        y,
        width,
        height,
        fill,
        radius: Number(node.cornerRadius || 0) * fitScale,
        characters: node.characters || "",
        textColor: textColorFor(fill),
        imageUrl: "",
        hasChildren: Boolean(entry.childCount || node.children?.length),
        childCount: entry.childCount || 0,
        isCanvasSnapshot: false,
        previewVisible: false,
      },
      properties: transformProperties(x, y, motionForge),
    };
  });

  return [canvasLayer, ...childLayers];
}

function isStaticCanvasNode(node, targetBounds) {
  const box = node.absoluteBoundingBox;
  if (!box || !targetBounds) return false;
  const coverage = (box.width * box.height) / Math.max(1, targetBounds.width * targetBounds.height);
  return coverage > 0.86 || (
    box.width >= targetBounds.width * 0.94 &&
    box.height >= targetBounds.height * 0.72
  );
}

function findFigmaNode(node, nodeId) {
  if (!node || !nodeId) return null;
  if (node.id === nodeId) return node;
  for (const child of node.children || []) {
    const found = findFigmaNode(child, nodeId);
    if (found) return found;
  }
  return null;
}

function findDefaultFrame(root) {
  const pages = (root.children || []).filter((node) => node.type === "PAGE");
  for (const page of pages.length ? pages : [root]) {
    const frame = (page.children || []).find((node) => node.absoluteBoundingBox && hasRenderableChildren(node));
    if (frame) return frame;
  }
  return null;
}

function importableNodes(target) {
  const children = (target.children || []).filter((node) => node.visible !== false && node.absoluteBoundingBox);
  if (!children.length) {
    return target.absoluteBoundingBox ? [{
      node: target,
      parentId: "",
      parentName: "",
      depth: 0,
      groupPath: "",
      childCount: visiblePositionedChildren(target).length,
    }] : [];
  }

  return children.flatMap((child) => figmaTreeEntries(child, {
    parentId: target.id || "",
    parentName: target.name || "",
    depth: 1,
    groupPath: "",
  }));
}

function hasRenderableChildren(node) {
  return (node.children || []).some((child) => child.visible !== false && child.absoluteBoundingBox);
}

function figmaTreeEntries(node, context) {
  if (!node || node.visible === false || !node.absoluteBoundingBox) return [];
  const children = visiblePositionedChildren(node);
  const isContainer = children.length > 0 && !isLeafRenderable(node);
  const nodeId = node.id || `${context.parentId}-${node.name || node.type || "node"}`;
  const isGroup = isFigmaGroupNode(node);
  const groupPath = isGroup
    ? [...(context.groupPath ? context.groupPath.split(" / ") : []), node.name || node.type || "Group"].join(" / ")
    : context.groupPath;
  const entry = {
    node,
    parentId: context.parentId,
    parentName: context.parentName,
    depth: context.depth,
    groupPath,
    childCount: children.length,
  };
  const nested = children.flatMap((child) => figmaTreeEntries(child, {
    parentId: nodeId,
    parentName: node.name || context.parentName,
    depth: context.depth + 1,
    groupPath,
  }));

  if (isContainer || hasVisiblePaint(node) || !nested.length) return [entry, ...nested];
  return nested;
}

function visiblePositionedChildren(node) {
  return (node.children || []).filter((child) => child.visible !== false && child.absoluteBoundingBox);
}

function isFigmaGroupNode(node) {
  return ["FRAME", "GROUP", "COMPONENT", "COMPONENT_SET", "INSTANCE", "SECTION"].includes(node.type);
}

function isLeafRenderable(node) {
  return [
    "BOOLEAN_OPERATION",
    "ELLIPSE",
    "LINE",
    "POLYGON",
    "RECTANGLE",
    "REGULAR_POLYGON",
    "SLICE",
    "STAR",
    "TEXT",
    "VECTOR",
  ].includes(node.type);
}

function hasVisiblePaint(node) {
  return [...(node.fills || []), ...(node.strokes || [])].some((paint) => (
    paint.visible !== false && (paint.opacity ?? 1) > 0
  ));
}

function boundsOfChildren(children) {
  const positioned = children.filter((node) => node.absoluteBoundingBox);
  if (!positioned.length) return null;
  const bounds = positioned.reduce((acc, node) => {
    const box = node.absoluteBoundingBox;
    acc.x = Math.min(acc.x, box.x);
    acc.y = Math.min(acc.y, box.y);
    acc.maxX = Math.max(acc.maxX, box.x + box.width);
    acc.maxY = Math.max(acc.maxY, box.y + box.height);
    return acc;
  }, { x: Infinity, y: Infinity, maxX: -Infinity, maxY: -Infinity });
  return {
    x: bounds.x,
    y: bounds.y,
    width: bounds.maxX - bounds.x,
    height: bounds.maxY - bounds.y,
  };
}

function transformProperties(x, y, motionForge) {
  return {
    positionX: property("Position X", "px", -motionForge.width, motionForge.width * 2, x),
    positionY: property("Position Y", "px", -motionForge.height, motionForge.height * 2, y),
    scale: property("Scale", "%", 0, 220, 100),
    rotation: property("Rotation", "deg", -360, 360, 0),
    opacity: property("Opacity", "%", 0, 100, 100),
  };
}

function property(label, unit, min, max, value) {
  return {
    label,
    unit,
    min,
    max,
    value,
    keyframes: [
      { time: 0, value },
    ],
  };
}

function figmaFill(node, index) {
  const solid = (node.fills || []).find((fill) => fill.visible !== false && fill.type === "SOLID");
  if (solid?.color) {
    const opacity = solid.opacity ?? 1;
    const { r, g, b } = solid.color;
    return `rgba(${Math.round(r * 255)}, ${Math.round(g * 255)}, ${Math.round(b * 255)}, ${opacity})`;
  }
  if (node.type === "TEXT") return "rgba(255,255,255,0.92)";
  const palette = ["#2fbf9b", "#f2c45a", "#6aa5ff", "#f27c7c", "#b78cff", "#ffffff"];
  return palette[index % palette.length];
}

function figmaColor(node, fill) {
  if (node.type === "TEXT") return "#ffffff";
  return fill.startsWith("#") ? fill : "#f2c45a";
}

function textColorFor(fill) {
  if (fill.includes("255,255,255") || fill.includes("255, 255, 255")) return "#101722";
  return "#ffffff";
}

function formatValue(value, unit) {
  return `${Math.round(value)}${unit}`;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function readStoredFigmaToken() {
  try {
    return window.localStorage.getItem(FIGMA_TOKEN_STORAGE_KEY) || "";
  } catch {
    return "";
  }
}

function saveFigmaToken(token) {
  try {
    window.localStorage.setItem(FIGMA_TOKEN_STORAGE_KEY, token);
  } catch {
    // Some browser privacy modes disable storage; the token can still be used for this session.
  }
}

function clearStoredFigmaToken() {
  try {
    window.localStorage.removeItem(FIGMA_TOKEN_STORAGE_KEY);
  } catch {
    // Ignore storage failures so the UI remains usable.
  }
}
