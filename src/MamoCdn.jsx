import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
  Database,
  ExternalLink,
  Globe,
  HardDrive,
  Loader2,
  MapPin,
  Maximize2,
  MonitorPlay,
  Pause,
  Play,
  Radio,
  RefreshCw,
  Shield,
  Terminal,
  Volume2,
  VolumeX,
  Wifi,
} from "lucide-react";

const MASTER_P2P = [
  {
    title: "Tears of Steel",
    url: "https://storage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4",
    poster: "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c2/Tears_of_Steel_poster.jpg/800px-Tears_of_Steel_poster.jpg",
    color: "#8b5cf6",
  },
  {
    title: "Sintel",
    url: "https://storage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4",
    poster: "https://upload.wikimedia.org/wikipedia/commons/thumb/8/8f/Sintel_poster.jpg/800px-Sintel_poster.jpg",
    color: "#06b6d4",
  },
  {
    title: "Big Buck Bunny",
    url: "https://storage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
    poster: "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c5/Big_Buck_Bunny_Six_Flies.png/800px-Big_Buck_Bunny_Six_Flies.png",
    color: "#10b981",
  },
  {
    title: "Elephants Dream",
    url: "https://storage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4",
    poster: "https://images.unsplash.com/photo-1478720568477-152d9b164e26?auto=format&fit=crop&w=900&q=80",
    color: "#ef4444",
  },
];

const DEFAULT_STREAM_URL = "https://storage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4";

const BASE_CATALOG = [
  {
    id: "can_cbc_news",
    title: "CBC News Explore",
    category: "Canada",
    kind: "iptv",
    source: "mp4",
    url: "https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
    fallbackUrl: DEFAULT_STREAM_URL,
    synopsis: "Canal Canada relaye par MAMO avec flux stabilise localement.",
    poster: "https://images.unsplash.com/photo-1585829365295-ab7cd400c167?auto=format&fit=crop&w=900&q=80",
    nodeTitle: "CBC-NODE-QC",
    color: "#ef4444",
  },
  {
    id: "can_global",
    title: "Global News Local",
    category: "Canada",
    kind: "iptv",
    source: "mp4",
    url: "https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4",
    fallbackUrl: DEFAULT_STREAM_URL,
    synopsis: "Canal d'actualite Canada via pipeline de diffusion MAMO.",
    poster: "https://images.unsplash.com/photo-1495020689067-958852a7765e?auto=format&fit=crop&w=900&q=80",
    nodeTitle: "GLOBAL-SATELLITE",
    color: "#06b6d4",
  },
  {
    id: "can_toutv",
    title: "ICI TOU.TV",
    category: "Canada",
    kind: "iptv",
    source: "mp4",
    url: "https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4",
    fallbackUrl: DEFAULT_STREAM_URL,
    synopsis: "Bibliotheque Canada relayee dans le hub MAMO pour lecture directe.",
    poster: "https://images.unsplash.com/photo-1555990209-661001f3db97?auto=format&fit=crop&w=900&q=80",
    nodeTitle: "RADIO-CANADA-HUB",
    color: "#22c55e",
  },
  {
    id: "can_gem",
    title: "CBC Gem",
    category: "Canada",
    kind: "iptv",
    source: "mp4",
    url: "https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4",
    fallbackUrl: DEFAULT_STREAM_URL,
    synopsis: "Flux Canada encapsule dans un lecteur MAMO stable et direct.",
    poster: "https://images.unsplash.com/photo-1551817820-fb1604a169b1?auto=format&fit=crop&w=900&q=80",
    nodeTitle: "GEM-CONNECTOR",
    color: "#f59e0b",
  },
  {
    id: "int_france24",
    title: "France 24 Francais",
    category: "International",
    kind: "iptv",
    source: "mp4",
    url: "https://storage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4",
    fallbackUrl: DEFAULT_STREAM_URL,
    synopsis: "Flux international relaye via CDN MAMO avec lecture directe.",
    poster: "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?auto=format&fit=crop&w=900&q=80",
    nodeTitle: "F24-PARIS-RELAY",
    color: "#ef4444",
  },
  {
    id: "int_redbull",
    title: "Red Bull TV",
    category: "International",
    kind: "iptv",
    source: "hls",
    url: "https://rbmn-live.akamaized.net/hls/live/590964/BoRB-AT/master.m3u8",
    fallbackUrl: DEFAULT_STREAM_URL,
    synopsis: "Sports extremes, festivals et culture urbaine.",
    poster: "https://images.unsplash.com/photo-1533745848184-3db07256e163?auto=format&fit=crop&w=900&q=80",
    nodeTitle: "REDBULL-CORE",
    color: "#1d4ed8",
  },
  {
    id: "int_nasa",
    title: "NASA Live HD",
    category: "International",
    kind: "iptv",
    source: "mp4",
    url: "https://storage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4",
    fallbackUrl: DEFAULT_STREAM_URL,
    synopsis: "Canal science spatial remappe dans le hub MAMO pour lecture directe.",
    poster: "https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?auto=format&fit=crop&w=900&q=80",
    nodeTitle: "NASA-DEEP-SPACE",
    color: "#8b5cf6",
  },
];

const FALLBACK_SYNC_LINES = [
  "> INITIALISATION MAMO TITAN V7.2...",
  "> DETECTION LIVE DES NODES MAMO...",
  "> INDEXATION DU REGISTRE DISTRIBUE...",
  "> ACTIVATION DU WORKER CDN...",
  "> RACCORDEMENT AU CANAL MESH...",
  "> HUB OPERATIONNEL.",
];

let hlsLoaderPromise = null;

function buildCdnRegistryUrl(api, userAddress) {
  const base = api("/api/platform/cdn/registry");
  const params = new URLSearchParams();
  if (userAddress) params.set("walletAddress", userAddress);
  const query = params.toString();
  return query ? `${base}?${query}` : base;
}

function buildCdnServiceUrl(api, action = "") {
  return action ? api(`/api/platform/cdn/service/${action}`) : api("/api/platform/cdn/service");
}

function buildSignalHubUrl(api, userAddress = "") {
  const base = api("/api/platform/signal-hub");
  const params = new URLSearchParams({ logLimit: "8" });
  if (userAddress) params.set("walletAddress", userAddress);
  return `${base}?${params.toString()}`;
}

function buildMeshServiceUrl(api) {
  return api("/api/sdr/mesh/service?auto_start=true");
}

function buildMeshSnapshotUrl(api) {
  return api("/api/sdr/mesh");
}

async function fetchWithTimeout(resource, options = {}, timeoutMs = 6000) {
  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(resource, { ...options, signal: controller.signal });
  } finally {
    window.clearTimeout(timeoutId);
  }
}

function createFallbackCatalog() {
  const generated = [...BASE_CATALOG];
  for (let i = 0; i < 12; i += 1) {
    const base = MASTER_P2P[i % MASTER_P2P.length];
    generated.push({
      id: `p2p_${i}`,
      title: `${base.title} #${i + 1}`,
      category: "P2P",
      kind: "p2p",
      source: "mp4",
      url: base.url,
      poster: base.poster,
      synopsis: `Source decentralisee Node #${i + 100}. Flux haute fidelite indexe par MAMO.`,
      nodeTitle: `NODE-TX-${i + 1}`,
      color: base.color,
      peers: Math.floor(Math.random() * 900) + 100,
      priority: i < 4 ? "high" : "medium",
      freshness: "fresh",
      replicaCount: 2,
      desiredReplicas: 3,
      syncState: "ready",
      holders: [],
    });
  }
  return generated;
}

function formatNodeStatus(status) {
  return status === "online" ? "EN LIGNE" : "HORS LIGNE";
}

function loadHlsLibrary() {
  if (typeof window === "undefined") {
    return Promise.resolve(null);
  }
  if (window.Hls) {
    return Promise.resolve(window.Hls);
  }
  if (hlsLoaderPromise) {
    return hlsLoaderPromise;
  }

  hlsLoaderPromise = new Promise((resolve, reject) => {
    const existing = document.querySelector('script[data-mamo-hls="true"]');
    if (existing) {
      existing.addEventListener("load", () => resolve(window.Hls || null), { once: true });
      existing.addEventListener("error", () => reject(new Error("hls_script_load_failed")), { once: true });
      return;
    }

    const script = document.createElement("script");
    script.src = "https://cdn.jsdelivr.net/npm/hls.js@latest";
    script.async = true;
    script.dataset.mamoHls = "true";
    script.onload = () => resolve(window.Hls || null);
    script.onerror = () => reject(new Error("hls_script_load_failed"));
    document.head.appendChild(script);
  });

  return hlsLoaderPromise;
}

function buildNodeArt(color) {
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(
    `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><rect width="100" height="100" rx="20" fill="#0f172a"/><circle cx="50" cy="50" r="30" fill="none" stroke="${color}" stroke-width="2" opacity="0.35"/><circle cx="50" cy="50" r="8" fill="${color}"/></svg>`
  )}`;
}

function toNumber(value, fallback = 0) {
  const nextValue = Number(value);
  return Number.isFinite(nextValue) ? nextValue : fallback;
}

function buildMeshSignalHubFallback(meshSnapshot, meshService) {
  if (!meshSnapshot) return null;
  const activePeaks = Array.isArray(meshSnapshot.activePeaks) ? meshSnapshot.activePeaks : [];
  const contacts = [
    {
      id: "mesh-core",
      name: "MAMO Mesh Core",
      alias: "@mesh_core",
      status: meshService?.running ? "online" : "offline",
      type: "trusted",
      meta: `${meshSnapshot.targetFrequencyMHz || "-"} MHz | ${meshSnapshot.quality || "watch"}`,
    },
    ...activePeaks.slice(0, 4).map((peak, index) => ({
      id: `mesh-peak-${index + 1}`,
      name: `Node Peak ${index + 1}`,
      alias: `@peak_${index + 1}`,
      status: "online",
      type: "peer",
      meta: `${peak.frequencyMHz || "-"} MHz | ${peak.powerDb || "-"} dB`,
    })),
  ];

  return {
    timestampUtc: meshSnapshot.timestampUtc || "",
    source: "mamo-cdn-live-fallback",
    mesh: {
      available: true,
      snapshot: meshSnapshot,
      service: meshService || {},
      logPath: meshService?.logPath || "",
      logCount: 0,
      logTail: [],
    },
    telecom: {
      activeNodes: Math.max(toNumber(meshSnapshot.activePeakCount, 0), contacts.length),
      channel: {
        label: "MAMO Mesh",
        frequencyMHz: meshSnapshot.targetFrequencyMHz || null,
        quality: meshSnapshot.quality || "watch",
        meshReady: Boolean(meshSnapshot.meshReady),
        serviceRunning: Boolean(meshService?.running),
      },
      contacts,
      meshFeed: [],
    },
    distribution: {
      health: meshSnapshot.meshReady ? "ready" : meshSnapshot.lockAcquired ? "watch" : "degraded",
      threatScore: meshSnapshot.meshReady ? 18 : meshSnapshot.lockAcquired ? 34 : 56,
      lastMeshEventUtc: meshSnapshot.timestampUtc || "",
    },
  };
}

function buildDerivedNodes(signalHub, existingNodes = [], catalog = []) {
  const nodesById = new Map();
  existingNodes.forEach((node, index) => {
    const key = String(node.id || node.alias || node.name || `node-${index}`).toLowerCase();
    nodesById.set(key, { ...node });
  });

  const contacts = Array.isArray(signalHub?.telecom?.contacts) ? signalHub.telecom.contacts : [];
  contacts.forEach((contact, index) => {
    const key = String(contact.id || contact.alias || contact.name || `contact-${index}`).toLowerCase();
    const existing = nodesById.get(key) || {};
    const capacityGb = Math.max(32, toNumber(existing.capacityGb, contact.type === "trusted" ? 128 : 64));
    const usedGb = Math.min(capacityGb, Math.max(4, toNumber(existing.usedGb, 10 + index * 6)));
    const storedContentCount = Math.max(1, toNumber(existing.storedContentCount, Math.min(Math.max(catalog.length, 1), 2 + index)));
    nodesById.set(key, {
      id: contact.id || existing.id || `mesh-contact-${index + 1}`,
      name: contact.name || existing.name || `Node MAMO ${index + 1}`,
      alias: contact.alias || existing.alias || `@mamo_node_${index + 1}`,
      status: contact.status || existing.status || "online",
      meta: contact.meta || existing.meta || "Node mesh",
      type: contact.type || existing.type || "peer",
      capacityGb,
      usedGb,
      replicatedCount: Math.max(toNumber(existing.replicatedCount, 0), Math.min(storedContentCount, Math.max(1, index + 1))),
      storedContentCount,
    });
  });

  const nodes = Array.from(nodesById.values());
  const targetCount = Math.max(toNumber(signalHub?.telecom?.activeNodes, 0), nodes.length);
  for (let index = nodes.length; index < targetCount; index += 1) {
    nodes.push({
      id: `mesh-live-${index + 1}`,
      name: `MAMO Live Node ${index + 1}`,
      alias: `@mesh_live_${index + 1}`,
      status: "online",
      meta: signalHub?.telecom?.channel?.frequencyMHz ? `${signalHub.telecom.channel.frequencyMHz} MHz` : "Node mesh",
      type: "peer",
      capacityGb: 64,
      usedGb: Math.min(64, 12 + index * 4),
      replicatedCount: Math.max(1, Math.min(catalog.length || 1, index + 1)),
      storedContentCount: Math.max(1, Math.min(catalog.length || 1, index + 2)),
    });
  }

  return nodes.sort((left, right) => {
    const leftOnline = left.status === "online" ? 1 : 0;
    const rightOnline = right.status === "online" ? 1 : 0;
    if (leftOnline !== rightOnline) return rightOnline - leftOnline;
    return String(left.name || "").localeCompare(String(right.name || ""));
  });
}

function buildDerivedSyncQueue(catalog = [], nodes = [], existingQueue = [], service = {}) {
  if (Array.isArray(existingQueue) && existingQueue.length) {
    return existingQueue;
  }

  const onlineNodes = nodes.filter((node) => node.status === "online");
  if (!catalog.length || !onlineNodes.length) return [];

  return catalog
    .slice(0, Math.min(6, catalog.length))
    .map((item, index) => {
      const holders = Array.isArray(item.holders) ? item.holders : [];
      const currentReplicas = Math.max(toNumber(item.replicaCount, holders.length), holders.length);
      const desiredReplicas = Math.max(toNumber(item.desiredReplicas, 0), Math.min(3, Math.max(1, onlineNodes.length)));
      const targetNode = onlineNodes[(index + currentReplicas) % onlineNodes.length];
      return {
        id: `live-sync-${item.id}`,
        title: item.title,
        reason: item.syncState === "ready" ? "mesh_distribution" : "catalog_sync",
        currentReplicas,
        desiredReplicas,
        targetNodeName: targetNode?.name || "MAMO Mesh Core",
        priority: item.priority || (index < 2 ? "critical" : "medium"),
        state: service.running ? "queued" : "pending",
        progress: service.running ? Math.min(92, Math.round((currentReplicas / desiredReplicas) * 100)) : 0,
      };
    })
    .filter((job) => job.currentReplicas < job.desiredReplicas || job.priority === "critical");
}

function mergeLiveRegistrySnapshot({
  registryPayload,
  signalHubPayload,
  cdnServicePayload,
  meshServicePayload,
  meshPayload,
}) {
  const catalog = Array.isArray(registryPayload?.catalog) && registryPayload.catalog.length
    ? registryPayload.catalog
    : createFallbackCatalog();
  const meshSnapshot = signalHubPayload?.mesh?.snapshot || registryPayload?.signalHub?.mesh?.snapshot || meshPayload || null;
  const fallbackSignalHub = buildMeshSignalHubFallback(meshSnapshot, meshServicePayload);
  const signalHub = signalHubPayload || registryPayload?.signalHub || fallbackSignalHub;
  const mergedSignalHub = signalHub
    ? {
        ...signalHub,
        mesh: {
          ...(signalHub.mesh || {}),
          available: Boolean(meshSnapshot || signalHub.mesh?.available),
          snapshot: meshSnapshot || signalHub.mesh?.snapshot || null,
          service: {
            ...(signalHub.mesh?.service || {}),
            ...(meshServicePayload || {}),
          },
          logPath: signalHub.mesh?.logPath || meshServicePayload?.logPath || "",
        },
      }
    : null;

  const nodes = buildDerivedNodes(mergedSignalHub, registryPayload?.nodes || [], catalog);
  const onlineNodes = nodes.filter((node) => node.status === "online").length;
  const distribution = {
    ...(registryPayload?.distribution || {}),
    ...(mergedSignalHub?.distribution || {}),
  };
  if (!distribution.health) {
    distribution.health = meshSnapshot?.meshReady
      ? "ready"
      : meshSnapshot?.lockAcquired || meshServicePayload?.running
        ? "watch"
        : "degraded";
  }
  if (!distribution.lastMeshEventUtc) {
    distribution.lastMeshEventUtc = mergedSignalHub?.timestampUtc || meshSnapshot?.timestampUtc || "";
  }

  const serviceBase = registryPayload?.service || {};
  const service = {
    ...serviceBase,
    ...(cdnServicePayload || {}),
    running: Boolean(serviceBase.running || cdnServicePayload?.running || meshServicePayload?.running || mergedSignalHub?.telecom?.channel?.serviceRunning),
    intervalSeconds: toNumber(cdnServicePayload?.intervalSeconds, toNumber(serviceBase.intervalSeconds, toNumber(meshServicePayload?.intervalSeconds, 0))),
    processedJobs: Math.max(
      toNumber(cdnServicePayload?.processedJobs, 0),
      toNumber(serviceBase.processedJobs, 0),
      toNumber(meshServicePayload?.successCount, 0)
    ),
    lastUpdatedUtc:
      cdnServicePayload?.lastUpdatedUtc ||
      serviceBase.lastUpdatedUtc ||
      meshServicePayload?.lastUpdatedUtc ||
      meshSnapshot?.timestampUtc ||
      mergedSignalHub?.timestampUtc ||
      "",
    autostart: Boolean(cdnServicePayload?.autostart ?? serviceBase.autostart ?? meshServicePayload?.autostart ?? false),
    logPath: cdnServicePayload?.logPath || serviceBase.logPath || meshServicePayload?.logPath || mergedSignalHub?.mesh?.logPath || "",
  };

  const syncQueue = buildDerivedSyncQueue(catalog, nodes, registryPayload?.syncQueue || [], service);
  if (!service.latestJob && syncQueue.length) {
    service.latestJob = {
      title: syncQueue[0].title,
      targetNodeName: syncQueue[0].targetNodeName,
      afterReplicas: syncQueue[0].currentReplicas,
      desiredReplicas: syncQueue[0].desiredReplicas,
    };
  }

  const freshAssets = catalog.filter((item) => ["fresh", "live", "synced", "ready"].includes(String(item.freshness || item.syncState || "").toLowerCase())).length;
  const criticalAssets = catalog.filter((item) => ["critical", "high"].includes(String(item.priority || "").toLowerCase())).length;

  return {
    timestampUtc: registryPayload?.timestampUtc || mergedSignalHub?.timestampUtc || meshSnapshot?.timestampUtc || new Date().toISOString(),
    source: registryPayload?.source || mergedSignalHub?.source || "mamo-cdn-live-fallback",
    ...(registryPayload || {}),
    catalog,
    nodes,
    syncQueue,
    service,
    signalHub: mergedSignalHub,
    distribution,
    summary: {
      ...(registryPayload?.summary || {}),
      contentCount: catalog.length,
      nodeCount: nodes.length,
      onlineNodes,
      queuedSyncJobs: syncQueue.length,
      freshAssets,
      criticalAssets,
    },
  };
}

function resolvePlayableUrl(item) {
  return item?.playbackUrl || item?.url || item?.fallbackUrl || DEFAULT_STREAM_URL;
}

function resolvePreviewUrl(item) {
  return item?.previewUrl || item?.playbackUrl || item?.url || item?.fallbackUrl || DEFAULT_STREAM_URL;
}

function buildLiveSyncState({ snapshot, summary, nodes, queue, service, mesh, distribution, loading, error }) {
  const detectedNodes = Number(summary?.nodeCount || nodes.length || 0);
  const onlineNodes = Number(summary?.onlineNodes || nodes.filter((node) => node.status === "online").length || 0);
  const queuedJobs = Number(summary?.queuedSyncJobs || queue.length || 0);
  const contentCount = Number(summary?.contentCount || 0);
  const freshAssets = Number(summary?.freshAssets || 0);
  const meshLabel = mesh?.targetFrequencyMHz ? `${mesh.targetFrequencyMHz} MHz | ${mesh.quality || "watch"}` : "canal en attente";
  const serviceLabel = service?.running ? `ACTIF | ${service.intervalSeconds || 0}s` : "EN ATTENTE";
  const distributionLabel = distribution?.health || "watch";

  if (!snapshot) {
    return {
      status: loading ? "Detection live des nodes MAMO..." : "Initialisation du registre distribue...",
      progress: loading ? 24 : 10,
      lines: [
        `> DETECTION LIVE DES NODES MAMO... ${detectedNodes} detectes`,
        `> REGISTRE DISTRIBUE... ${loading ? "connexion en cours" : "pret a scanner"}`,
        `> WORKER CDN... ${serviceLabel}`,
        `> CANAL MESH... ${meshLabel}`,
        error ? `> ERREUR REGISTRE... ${error}` : FALLBACK_SYNC_LINES[FALLBACK_SYNC_LINES.length - 1],
      ],
    };
  }

  const progress = Math.min(
    100,
    Math.max(
      72,
      28
        + Math.min(28, detectedNodes * 4)
        + Math.min(18, onlineNodes * 3)
        + (service?.running ? 12 : 0)
        + (mesh ? 10 : 0)
        + Math.min(12, Math.floor(contentCount / 2))
    )
  );

  return {
    status: error ? "Registre MAMO degrade mais disponible" : `Nodes detectes: ${detectedNodes} | ${onlineNodes} en ligne`,
    progress,
    lines: [
      `> DETECTION LIVE DES NODES MAMO... ${detectedNodes} detectes / ${onlineNodes} en ligne`,
      `> CATALOGUE DISTRIBUE... ${contentCount} contenus indexes | ${freshAssets} assets frais`,
      `> WORKER CDN... ${serviceLabel}`,
      `> FILE DE SYNC... ${queuedJobs} jobs`,
      `> CANAL MESH... ${meshLabel}`,
      error ? `> REGISTRE... ${error}` : `> HUB... ${distributionLabel} | ${snapshot.timestampUtc || "sync live"}`,
    ],
  };
}

function PlayerNodeCard({ item }) {
  return (
    <div className="cdn-player-node">
      <img src={item.nodeImage} alt={item.nodeTitle} />
      <div>
        <p className="cdn-mini-label">Liaison active</p>
        <p className="cdn-player-node-title">{item.nodeTitle}</p>
      </div>
    </div>
  );
}

export default function MamoCdn({ api = (path) => path, authToken = "", userAddress = "" }) {
  const playerVideoRef = useRef(null);
  const hlsRef = useRef(null);
  const playerRootRef = useRef(null);
  const syncCancelledRef = useRef(false);
  const mountedRef = useRef(true);
  const previewVideoRefs = useRef(new Map());
  const previewIntervalRef = useRef(0);
  const previewPlayPromiseRef = useRef(null);

  const [mode, setMode] = useState("hero");
  const [currentTab, setCurrentTab] = useState("P2P");
  const [playerItem, setPlayerItem] = useState(null);
  const [playerLoading, setPlayerLoading] = useState(false);
  const [playerMuted, setPlayerMuted] = useState(true);
  const [playerVolume, setPlayerVolume] = useState(0.8);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showUnmuteHint, setShowUnmuteHint] = useState(false);
  const [previewItemId, setPreviewItemId] = useState(null);
  const [previewRemaining, setPreviewRemaining] = useState(15);
  const [isTouchDevice, setIsTouchDevice] = useState(false);
  const [registrySnapshot, setRegistrySnapshot] = useState(null);
  const [registryLoading, setRegistryLoading] = useState(false);
  const [registryError, setRegistryError] = useState("");

  const mediaData = useMemo(() => {
    const source = registrySnapshot?.catalog?.length ? registrySnapshot.catalog : createFallbackCatalog();
    return source.map((item) => ({
      ...item,
      playbackUrl: item.playbackPath ? api(item.playbackPath) : resolvePlayableUrl(item),
      previewUrl: item.previewPath ? api(item.previewPath) : resolvePreviewUrl(item),
      nodeImage: buildNodeArt(item.color || "#06b6d4"),
    }));
  }, [api, registrySnapshot]);

  const filteredItems = useMemo(
    () => mediaData.filter((item) => item.category === currentTab),
    [mediaData, currentTab]
  );
  const cdnNodes = useMemo(() => registrySnapshot?.nodes || [], [registrySnapshot]);
  const syncQueue = useMemo(() => registrySnapshot?.syncQueue || [], [registrySnapshot]);
  const replicationService = registrySnapshot?.service || {};
  const replicationHistory = useMemo(() => registrySnapshot?.replicationHistory || [], [registrySnapshot]);
  const registrySummary = registrySnapshot?.summary || {
    contentCount: mediaData.length,
    nodeCount: 0,
    onlineNodes: 0,
    queuedSyncJobs: 0,
    freshAssets: 0,
    criticalAssets: 0,
  };
  const meshInfo = registrySnapshot?.signalHub?.mesh?.snapshot || null;
  const distribution = registrySnapshot?.distribution || {};
  const latestReplicationJob = replicationService.latestJob || null;
  const syncState = useMemo(
    () =>
      buildLiveSyncState({
        snapshot: registrySnapshot,
        summary: registrySummary,
        nodes: cdnNodes,
        queue: syncQueue,
        service: replicationService,
        mesh: meshInfo,
        distribution,
        loading: registryLoading,
        error: registryError,
      }),
    [registrySnapshot, registrySummary, cdnNodes, syncQueue, replicationService, meshInfo, distribution, registryLoading, registryError]
  );

  useEffect(() => {
    return () => {
      mountedRef.current = false;
      syncCancelledRef.current = true;
      window.clearInterval(previewIntervalRef.current);
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return undefined;
    const media = window.matchMedia("(max-width: 780px), (pointer: coarse)");
    const syncTouchMode = () => setIsTouchDevice(media.matches);
    syncTouchMode();
    if (media.addEventListener) {
      media.addEventListener("change", syncTouchMode);
      return () => media.removeEventListener("change", syncTouchMode);
    }
    media.addListener(syncTouchMode);
    return () => media.removeListener(syncTouchMode);
  }, []);

  const refreshRegistry = useCallback(async (silent = false) => {
    if (!silent && mountedRef.current) setRegistryLoading(true);
    try {
      const headers = {};
      if (authToken) headers.Authorization = `Bearer ${authToken}`;
      const [registryResult, hubResult, cdnServiceResult, meshServiceResult, meshResult] = await Promise.allSettled([
        fetchWithTimeout(buildCdnRegistryUrl(api, userAddress), { headers }),
        fetchWithTimeout(buildSignalHubUrl(api, userAddress), { headers }),
        fetchWithTimeout(buildCdnServiceUrl(api), { headers }),
        fetchWithTimeout(buildMeshServiceUrl(api), { headers }),
        fetchWithTimeout(buildMeshSnapshotUrl(api), { headers }),
      ]);

      let registryPayload = null;
      let hubPayload = null;
      let cdnServicePayload = null;
      let meshServicePayload = null;
      let meshPayload = null;

      if (registryResult.status === "fulfilled" && registryResult.value.ok) {
        registryPayload = await registryResult.value.json();
      }
      if (hubResult.status === "fulfilled" && hubResult.value.ok) {
        hubPayload = await hubResult.value.json();
      }
      if (cdnServiceResult.status === "fulfilled" && cdnServiceResult.value.ok) {
        cdnServicePayload = await cdnServiceResult.value.json();
      }
      if (meshServiceResult.status === "fulfilled" && meshServiceResult.value.ok) {
        meshServicePayload = await meshServiceResult.value.json();
      }
      if (meshResult.status === "fulfilled" && meshResult.value.ok) {
        meshPayload = await meshResult.value.json();
      }

      const payload = mergeLiveRegistrySnapshot({
        registryPayload,
        signalHubPayload: hubPayload,
        cdnServicePayload,
        meshServicePayload,
        meshPayload,
      });

      if (!payload?.catalog?.length && !payload?.nodes?.length && !payload?.signalHub) {
        const registryStatus = registryResult.status === "fulfilled" ? registryResult.value.status : "unreachable";
        throw new Error(`cdn_registry_${registryStatus}`);
      }

      if (mountedRef.current) {
        setRegistrySnapshot(payload);
        const liveAvailable = Boolean(hubPayload || meshPayload || meshServicePayload || cdnServicePayload);
        setRegistryError(registryPayload || liveAvailable ? "" : "cdn_registry_unavailable");
      }
      return payload;
    } catch (error) {
      if (mountedRef.current) {
        setRegistryError(String(error?.message || "cdn_registry_unavailable"));
      }
      return null;
    } finally {
      if (!silent && mountedRef.current) setRegistryLoading(false);
    }
  }, [api, authToken, userAddress]);

  const toggleCdnService = useCallback(async (desiredRunning) => {
    try {
      const headers = {};
      if (authToken) headers.Authorization = `Bearer ${authToken}`;
      const response = await fetchWithTimeout(buildCdnServiceUrl(api, desiredRunning ? "start" : "stop"), {
        method: "POST",
        headers,
      });
      if (!response.ok) {
        throw new Error(`cdn_service_${response.status}`);
      }
      await refreshRegistry(true);
    } catch (error) {
      if (mountedRef.current) {
        setRegistryError(String(error?.message || "cdn_service_unavailable"));
      }
    }
  }, [api, authToken, refreshRegistry]);

  useEffect(() => {
    refreshRegistry(false);
    const intervalId = window.setInterval(() => {
      refreshRegistry(true);
    }, 8000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [refreshRegistry]);

  useEffect(() => {
    if (!playerItem || playerItem.source === "youtube" || playerItem.kind === "external") {
      return undefined;
    }

    const video = playerVideoRef.current;
    if (!video) return undefined;

    let cancelled = false;
    setPlayerLoading(true);
    setShowUnmuteHint(true);
    setIsPlaying(false);
    video.dataset.fallbackApplied = "";
    video.muted = playerMuted;
    video.volume = playerVolume;
    video.playsInline = true;
    video.autoplay = true;
    video.controls = isTouchDevice;
    video.preload = "metadata";
    video.crossOrigin = "anonymous";
    video.disableRemotePlayback = true;

    const safePlay = async () => {
      try {
        if (playerItem.source !== "hls" && video.currentSrc) {
          video.load();
        }
        await video.play();
        if (!cancelled) {
          setIsPlaying(true);
          setPlayerLoading(false);
        }
      } catch {
        if (!cancelled) {
          setIsPlaying(false);
          setPlayerLoading(false);
        }
      }
    };

    const onPlay = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);
    const onWaiting = () => setPlayerLoading(true);
    const onCanPlay = () => setPlayerLoading(false);
    const onVolumeChange = () => {
      const muted = Boolean(video.muted) || Number(video.volume) === 0;
      setPlayerMuted(muted);
      if (!muted || isTouchDevice) {
        setShowUnmuteHint(false);
      }
    };
    const onFullscreenEntered = () => {
      setShowUnmuteHint(false);
    };
    const fallbackToSafeStream = async () => {
      const fallbackUrl = playerItem.fallbackUrl || DEFAULT_STREAM_URL;
      if (!fallbackUrl || video.dataset.fallbackApplied === fallbackUrl) {
        setPlayerLoading(false);
        return;
      }
      video.dataset.fallbackApplied = fallbackUrl;
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
      video.src = fallbackUrl;
      await safePlay();
    };
    const onError = () => {
      fallbackToSafeStream();
    };

    video.addEventListener("play", onPlay);
    video.addEventListener("pause", onPause);
    video.addEventListener("waiting", onWaiting);
    video.addEventListener("canplay", onCanPlay);
    video.addEventListener("volumechange", onVolumeChange);
    video.addEventListener("webkitbeginfullscreen", onFullscreenEntered);
    document.addEventListener("fullscreenchange", onFullscreenEntered);
    video.addEventListener("error", onError);

    const init = async () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }

      if (playerItem.source === "hls") {
        if (video.canPlayType("application/vnd.apple.mpegurl")) {
          video.src = playerItem.url;
          await safePlay();
          return;
        }

        try {
          const HlsLib = await loadHlsLibrary();
          if (!HlsLib || !HlsLib.isSupported()) {
            video.src = playerItem.url;
            await safePlay();
            return;
          }
          const hls = new HlsLib();
          hlsRef.current = hls;
          hls.loadSource(playerItem.url);
          hls.attachMedia(video);
          hls.on(HlsLib.Events.MANIFEST_PARSED, () => {
            if (!cancelled) safePlay();
          });
          hls.on(HlsLib.Events.ERROR, () => {
            if (!cancelled) fallbackToSafeStream();
          });
        } catch {
          await fallbackToSafeStream();
        }
        return;
      }

      video.src = resolvePlayableUrl(playerItem);
      await safePlay();
    };

    init();

    return () => {
      cancelled = true;
      video.pause();
      video.removeEventListener("play", onPlay);
      video.removeEventListener("pause", onPause);
      video.removeEventListener("waiting", onWaiting);
      video.removeEventListener("canplay", onCanPlay);
      video.removeEventListener("volumechange", onVolumeChange);
      video.removeEventListener("webkitbeginfullscreen", onFullscreenEntered);
      document.removeEventListener("fullscreenchange", onFullscreenEntered);
      video.removeEventListener("error", onError);
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, [playerItem, playerMuted, playerVolume, isTouchDevice]);

  useEffect(() => {
    if (!playerItem || playerItem.source === "youtube") return;
    if (isTouchDevice || !playerMuted) {
      setShowUnmuteHint(false);
      return;
    }
    setShowUnmuteHint(true);
  }, [playerItem, playerMuted, isTouchDevice]);

  useEffect(() => {
    const video = playerVideoRef.current;
    if (!video) return;
    video.muted = playerMuted;
    video.volume = playerVolume;
  }, [playerMuted, playerVolume]);

  const startConnection = async () => {
    syncCancelledRef.current = false;
    setMode("sync");
    const bootStartedAt = Date.now();
    const failOpenTimer = window.setTimeout(() => {
      if (!syncCancelledRef.current) {
        setMode("app");
        void refreshRegistry(true);
      }
    }, 2200);

    try {
      let payload = await refreshRegistry(false);
      if (syncCancelledRef.current) return;

      const serviceRunning = Boolean(payload?.service?.running || replicationService.running);
      if (!serviceRunning) {
        await toggleCdnService(true);
        payload = await refreshRegistry(true);
      }

      for (let attempt = 0; attempt < 3; attempt += 1) {
        if (syncCancelledRef.current) return;
        // Short live polling window so the sync screen reflects real nodes before entering the app.
        // eslint-disable-next-line no-await-in-loop
        await new Promise((resolve) => window.setTimeout(resolve, 450));
        // eslint-disable-next-line no-await-in-loop
        payload = await refreshRegistry(true);
        if (payload?.summary?.nodeCount && payload?.catalog?.length) {
          break;
        }
      }
    } catch (error) {
      if (mountedRef.current) {
        setRegistryError(String(error?.message || "cdn_boot_failed"));
      }
    } finally {
      window.clearTimeout(failOpenTimer);
      const remainingBootMs = Math.max(0, 1600 - (Date.now() - bootStartedAt));
      if (remainingBootMs > 0) {
        await new Promise((resolve) => window.setTimeout(resolve, remainingBootMs));
      }
      if (!syncCancelledRef.current) {
        setMode("app");
        void refreshRegistry(true);
      }
    }
  };

  const stopPreview = async (itemId) => {
    window.clearInterval(previewIntervalRef.current);
    const video = previewVideoRefs.current.get(itemId);
    if (video) {
      try {
        if (previewPlayPromiseRef.current) {
          await previewPlayPromiseRef.current.catch(() => {});
        }
      } catch {
        // ignore
      }
      video.pause();
      video.currentTime = 0;
      video.removeAttribute("src");
      delete video.dataset.previewSrc;
      video.load();
      previewPlayPromiseRef.current = null;
    }
    setPreviewItemId((current) => (current === itemId ? null : current));
    setPreviewRemaining(15);
  };

  const startPreview = async (item) => {
    if (item.kind !== "p2p" && item.source !== "mp4") return;
    await stopPreview(previewItemId);
    const video = previewVideoRefs.current.get(item.id);
    if (!video) return;
    const nextUrl = resolvePreviewUrl(item);

    setPreviewItemId(item.id);
    setPreviewRemaining(15);
    video.currentTime = 0;
    video.muted = true;
    video.preload = "metadata";
    video.crossOrigin = "anonymous";
    if (video.dataset.previewSrc !== nextUrl) {
      video.dataset.previewSrc = nextUrl;
      video.src = nextUrl;
      video.load();
    }
    previewPlayPromiseRef.current = video.play();
    await previewPlayPromiseRef.current.catch(() => {});

    previewIntervalRef.current = window.setInterval(() => {
      setPreviewRemaining((prev) => {
        if (prev <= 1) {
          stopPreview(item.id);
          return 15;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const openPlayer = (item) => {
    if (item.kind === "external") {
      window.open(item.externalUrl, "_blank", "noopener,noreferrer");
      return;
    }
    stopPreview(previewItemId);
    setPlayerMuted(true);
    setPlayerVolume(0.8);
    setPlayerItem(item);
    setPlayerLoading(item.source !== "youtube");
    setShowUnmuteHint(item.source !== "youtube" && !isTouchDevice);
  };

  const closePlayer = () => {
    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }
    const video = playerVideoRef.current;
    if (video) {
      video.pause();
      video.removeAttribute("src");
      video.load();
    }
    setPlayerItem(null);
    setPlayerLoading(false);
    setShowUnmuteHint(false);
    setIsPlaying(false);
  };

  const togglePlay = async () => {
    const video = playerVideoRef.current;
    if (!video || !playerItem || playerItem.source === "youtube") return;
    if (video.paused) {
      try {
        await video.play();
      } catch {
        setIsPlaying(false);
      }
    } else {
      video.pause();
    }
  };

  const toggleMute = () => {
    if (!playerItem || playerItem.source === "youtube") return;
    setPlayerMuted((prev) => !prev);
  };

  const unmutePlayer = () => {
    if (!playerItem || playerItem.source === "youtube") return;
    setPlayerMuted(false);
    setShowUnmuteHint(false);
  };

  const handleVolume = (value) => {
    const nextValue = Number(value);
    setPlayerVolume(nextValue);
    if (nextValue > 0) {
      setPlayerMuted(false);
      setShowUnmuteHint(false);
    }
  };

  const toggleFullscreen = async () => {
    const root = playerRootRef.current;
    const video = playerVideoRef.current;
    if (video && playerItem?.source !== "youtube") {
      setShowUnmuteHint(false);
      if (typeof video.requestFullscreen === "function" && !document.fullscreenElement) {
        await video.requestFullscreen();
        return;
      }
      if (typeof video.webkitEnterFullscreen === "function") {
        video.webkitEnterFullscreen();
        return;
      }
    }
    if (!root) return;
    if (!document.fullscreenElement) {
      await root.requestFullscreen?.();
    } else {
      await document.exitFullscreen?.();
    }
  };

  return (
    <section className="cdn-root">
      {mode === "hero" && (
        <div className="cdn-hero">
          <div className="cdn-hero-mark">
            <div className="cdn-hero-icon">
              <MonitorPlay size={64} color="#06b6d4" />
              <span className="cdn-badge">V7.2</span>
            </div>
          </div>
          <h1 className="cdn-hero-title">
            MAMO<span>TITAN</span>
          </h1>
          <p className="cdn-hero-subtitle">
            Liaison multi-sources Canada et P2P cinema. Hub Saint-Gabriel.
          </p>
          <button type="button" className="cdn-primary-btn" onClick={startConnection}>
            <Terminal size={26} />
            INITIALISER LE RESEAU
          </button>
        </div>
      )}

      {mode === "sync" && (
        <div className="cdn-sync-screen">
          <div className="cdn-sync-card">
            <div className="cdn-sync-bar" style={{ width: `${syncState.progress}%` }} />
            <Loader2 size={44} color="#06b6d4" className="spin" />
            <p className="cdn-sync-status">{syncState.status}</p>
            <div className="cdn-sync-logs">
              {syncState.lines.map((line) => (
                <p key={line}>{line}</p>
              ))}
            </div>
          </div>
        </div>
      )}

      {mode === "app" && (
        <div className="cdn-shell">
          <header className="cdn-header">
            <div className="cdn-brand-group">
              <button type="button" className="cdn-brand" onClick={() => setCurrentTab("Canada")}>
                <Globe size={30} color="#06b6d4" />
                <span>MAMO</span>
              </button>
              <nav className="cdn-tabs">
                {["Canada", "International", "P2P"].map((tab) => (
                  <button
                    key={tab}
                    type="button"
                    className={`cdn-tab-btn ${currentTab === tab ? "active" : ""}`}
                    onClick={() => setCurrentTab(tab)}
                  >
                    {tab === "P2P" ? "Cinema P2P" : tab}
                  </button>
                ))}
              </nav>
            </div>

            <div className="cdn-hub-pill">
              <MapPin size={14} color="#22c55e" />
              <span>
                {meshInfo?.targetFrequencyMHz ? `${meshInfo.targetFrequencyMHz} MHz` : "Saint-Gabriel Hub"} | {distribution.health || "watch"}
              </span>
            </div>
          </header>

          <div className="cdn-main">
            <div className="grid two" style={{ marginBottom: 16, gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))" }}>
              <div className="card">
                <div className="row" style={{ justifyContent: "space-between" }}>
                  <div>
                    <p className="muted" style={{ margin: 0, fontSize: 12 }}>Catalogue dynamique</p>
                    <h3 style={{ margin: "8px 0 0" }}>{registrySummary.contentCount}</h3>
                  </div>
                  <Database size={18} />
                </div>
              </div>
              <div className="card">
                <div className="row" style={{ justifyContent: "space-between" }}>
                  <div>
                    <p className="muted" style={{ margin: 0, fontSize: 12 }}>Nodes en ligne</p>
                    <h3 style={{ margin: "8px 0 0" }}>{registrySummary.onlineNodes}/{registrySummary.nodeCount}</h3>
                  </div>
                  <Wifi size={18} />
                </div>
              </div>
              <div className="card">
                <div className="row" style={{ justifyContent: "space-between" }}>
                  <div>
                    <p className="muted" style={{ margin: 0, fontSize: 12 }}>File de sync</p>
                    <h3 style={{ margin: "8px 0 0" }}>{registrySummary.queuedSyncJobs}</h3>
                  </div>
                  <RefreshCw size={18} />
                </div>
              </div>
              <div className="card">
                <div className="row" style={{ justifyContent: "space-between" }}>
                  <div>
                    <p className="muted" style={{ margin: 0, fontSize: 12 }}>Canal mesh</p>
                    <h3 style={{ margin: "8px 0 0" }}>{meshInfo?.quality || "offline"}</h3>
                    <p className="muted" style={{ margin: "6px 0 0", fontSize: 12 }}>
                      {meshInfo ? `SNR ${meshInfo.snrDb} dB | ${meshInfo.activePeakCount} pics` : "Signal en attente"}
                    </p>
                  </div>
                  <Radio size={18} />
                </div>
              </div>
              <div className="card">
                <div className="row" style={{ justifyContent: "space-between" }}>
                  <div>
                    <p className="muted" style={{ margin: 0, fontSize: 12 }}>Worker CDN</p>
                    <h3 style={{ margin: "8px 0 0" }}>{replicationService.running ? "actif" : "pause"}</h3>
                    <p className="muted" style={{ margin: "6px 0 0", fontSize: 12 }}>
                      jobs {replicationService.processedJobs || 0} | {replicationService.intervalSeconds || 0}s
                    </p>
                  </div>
                  <RefreshCw size={18} />
                </div>
              </div>
            </div>

            <div className="card" style={{ marginBottom: 16 }}>
              <div className="row" style={{ justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap" }}>
                <div>
                  <h3 style={{ marginBottom: 6 }}>Registre CDN distribue</h3>
                  <p className="muted" style={{ margin: 0 }}>
                    Hashes, priorite, fraicheur et possession des contenus a travers les nodes MAMO.
                  </p>
                </div>
                <div className="row" style={{ flexWrap: "wrap" }}>
                  <span className="cdn-hub-pill" style={{ background: "rgba(6, 182, 212, 0.12)" }}>
                    <Shield size={14} color="#22d3ee" />
                    <span>{distribution.health || "watch"}</span>
                  </span>
                  <span className="cdn-hub-pill" style={{ background: replicationService.running ? "rgba(34, 197, 94, 0.12)" : "rgba(245, 158, 11, 0.12)" }}>
                    <RefreshCw size={14} color={replicationService.running ? "#22c55e" : "#f59e0b"} />
                    <span>{replicationService.running ? "replication active" : "replication stop"}</span>
                  </span>
                  <button type="button" className="cdn-icon-btn" onClick={() => toggleCdnService(!replicationService.running)} style={{ minWidth: 44 }}>
                    {replicationService.running ? <Pause size={18} /> : <Play size={18} />}
                  </button>
                  <button type="button" className="cdn-icon-btn" onClick={() => refreshRegistry(false)} style={{ minWidth: 44 }}>
                    <RefreshCw size={18} />
                  </button>
                  <button type="button" className="cdn-icon-btn" onClick={startConnection} style={{ minWidth: 44 }}>
                    <Terminal size={18} />
                  </button>
                </div>
              </div>
              {registryError ? <p className="warn" style={{ marginTop: 10 }}>Registre: {registryError}</p> : null}
              {registryLoading ? <p className="muted" style={{ marginTop: 10 }}>Chargement du registre distribue...</p> : null}
              {latestReplicationJob ? (
                <p className="muted" style={{ marginTop: 10 }}>
                  Dernier job: {latestReplicationJob.title} vers {latestReplicationJob.targetNodeName} | {latestReplicationJob.afterReplicas}/{latestReplicationJob.desiredReplicas} replicas
                </p>
              ) : null}
            </div>

            <div className="grid two" style={{ marginBottom: 16, alignItems: "start" }}>
              <div className="card">
                <div className="row" style={{ justifyContent: "space-between" }}>
                  <h3 style={{ margin: 0 }}>Statut des nodes</h3>
                  <HardDrive size={18} />
                </div>
                <div style={{ marginTop: 12, display: "grid", gap: 10 }}>
                  {cdnNodes.slice(0, 6).map((node) => (
                    <div
                      key={node.id}
                      style={{
                        border: "1px solid rgba(0,238,255,0.18)",
                        borderRadius: 12,
                        background: "rgba(5,16,31,0.92)",
                        padding: 12,
                      }}
                    >
                      <div className="row" style={{ justifyContent: "space-between", alignItems: "flex-start" }}>
                        <div>
                          <strong style={{ color: "#fff" }}>{node.name}</strong>
                          <div className="muted" style={{ fontSize: 12, marginTop: 4 }}>{node.alias} | {node.meta || "Node mesh"}</div>
                        </div>
                        <span className={node.status === "online" ? "ok" : "warn"} style={{ fontSize: 12 }}>
                          {formatNodeStatus(node.status)}
                        </span>
                      </div>
                      <div className="row" style={{ marginTop: 8, justifyContent: "space-between", fontSize: 12 }}>
                        <span className="muted">Stockage</span>
                        <span>{node.usedGb} / {node.capacityGb} GB</span>
                      </div>
                      <div className="row" style={{ marginTop: 6, justifyContent: "space-between", fontSize: 12 }}>
                        <span className="muted">Replications</span>
                        <span>{node.replicatedCount || 0} | {node.storedContentCount || 0} contenus</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="card">
                <div className="row" style={{ justifyContent: "space-between" }}>
                  <h3 style={{ margin: 0 }}>File de sync</h3>
                  <RefreshCw size={18} />
                </div>
                <div style={{ marginTop: 12, display: "grid", gap: 10 }}>
                  {syncQueue.length ? (
                    syncQueue.slice(0, 6).map((job) => (
                      <div
                        key={job.id}
                        style={{
                          border: "1px solid rgba(0,238,255,0.18)",
                          borderRadius: 12,
                          background: "rgba(5,16,31,0.92)",
                          padding: 12,
                        }}
                      >
                        <div className="row" style={{ justifyContent: "space-between", alignItems: "flex-start" }}>
                          <div>
                            <strong style={{ color: "#fff" }}>{job.title}</strong>
                            <div className="muted" style={{ fontSize: 12, marginTop: 4 }}>
                              {job.reason} | {job.currentReplicas}/{job.desiredReplicas} replicas | {job.state}
                            </div>
                          </div>
                          <span className={job.priority === "critical" ? "warn" : "ok"} style={{ fontSize: 12 }}>
                            {job.priority}
                          </span>
                        </div>
                        <div className="muted" style={{ marginTop: 8, fontSize: 12 }}>
                          Cible: {job.targetNodeName} | progression {job.progress || 0}%
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="muted" style={{ margin: 0 }}>Aucune replication en attente.</p>
                  )}
                </div>
              </div>
            </div>

            <div className="card" style={{ marginBottom: 16 }}>
              <div className="row" style={{ justifyContent: "space-between" }}>
                <h3 style={{ margin: 0 }}>Activite de replication</h3>
                <Database size={18} />
              </div>
              <div style={{ marginTop: 12, display: "grid", gap: 10 }}>
                {replicationHistory.length ? (
                  replicationHistory.slice(0, 6).map((job) => (
                    <div
                      key={`${job.id}-${job.timestampUtc}`}
                      style={{
                        border: "1px solid rgba(0,238,255,0.18)",
                        borderRadius: 12,
                        background: "rgba(5,16,31,0.92)",
                        padding: 12,
                      }}
                    >
                      <div className="row" style={{ justifyContent: "space-between", alignItems: "flex-start" }}>
                        <div>
                          <strong style={{ color: "#fff" }}>{job.title}</strong>
                          <div className="muted" style={{ fontSize: 12, marginTop: 4 }}>
                            {job.reason} | {job.beforeReplicas} -> {job.afterReplicas} replicas
                          </div>
                        </div>
                        <span className="ok" style={{ fontSize: 12 }}>{job.priority}</span>
                      </div>
                      <div className="muted" style={{ marginTop: 8, fontSize: 12 }}>
                        {job.targetNodeName} | {job.timestampUtc}
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="muted" style={{ margin: 0 }}>Le worker n'a pas encore traite de job.</p>
                )}
              </div>
            </div>

            <div className="cdn-headline">
              <h2>{currentTab === "P2P" ? "Cinema P2P" : currentTab}</h2>
              <span>{filteredItems.length} SOURCES</span>
            </div>

            <div className="cdn-grid">
              {filteredItems.map((item) => {
                const isPreviewing = previewItemId === item.id;
                return (
                  <article key={item.id} className="cdn-card">
                    <div className="cdn-card-media">
                      <div className={`cdn-preview-layer ${isPreviewing ? "active" : ""}`}>
                        <video
                          ref={(node) => {
                            if (node) previewVideoRefs.current.set(item.id, node);
                            else previewVideoRefs.current.delete(item.id);
                          }}
                          muted
                          loop
                          playsInline
                          preload="none"
                          crossOrigin="anonymous"
                          className="cdn-preview-video"
                          onError={() => stopPreview(item.id)}
                        />
                        <div className="cdn-preview-countdown">{previewRemaining}s</div>
                        <div className="cdn-preview-label">PREVIEW NODE</div>
                      </div>

                      <img src={item.poster} alt={item.title} className="cdn-poster" />
                      <div className="cdn-poster-overlay" />

                      <button
                        type="button"
                        className="cdn-node-thumb"
                        onMouseEnter={() => startPreview(item)}
                        onMouseLeave={() => stopPreview(item.id)}
                        onFocus={() => startPreview(item)}
                        onBlur={() => stopPreview(item.id)}
                      >
                        <img src={item.nodeImage} alt={item.nodeTitle} />
                        <div className="cdn-node-title">{item.nodeTitle}</div>
                        <div className={`cdn-node-bar ${isPreviewing ? "active" : ""}`} />
                      </button>

                      <button type="button" className="cdn-play-overlay" onClick={() => openPlayer(item)}>
                        {item.kind === "external" ? <ExternalLink size={28} /> : <Play size={28} />}
                      </button>
                    </div>

                    <button type="button" className="cdn-card-meta" onClick={() => openPlayer(item)}>
                      <h3>{item.title}</h3>
                      <span>
                        {item.kind === "p2p"
                          ? `PEERS: ${item.peers}`
                          : `SYNC ${String(item.syncState || "ready").toUpperCase()} | ${item.replicaCount || 0}/${item.desiredReplicas || 0}`}
                      </span>
                      <div className="muted" style={{ marginTop: 8, fontSize: 12 }}>
                        hash {item.hash?.slice(0, 10) || "local"} | {item.priority || "medium"} | {item.freshness || "fresh"}
                      </div>
                    </button>
                  </article>
                );
              })}
            </div>
          </div>

          <footer className="cdn-footer">MAMO TITAN v7.2.0 - CINEMA DECENTRALISE</footer>

          {playerItem ? (
            <div className="cdn-player" ref={playerRootRef}>
              <div className="cdn-player-top">
                <button type="button" className="cdn-player-close" onClick={closePlayer}>
                  <ArrowLeft size={18} />
                  <span>Fermer la liaison</span>
                </button>
                <PlayerNodeCard item={playerItem} />
              </div>

              <div className="cdn-player-stage">
                {playerItem.source === "youtube" ? (
                  <iframe
                    className="cdn-player-frame"
                    src={`https://www.youtube.com/embed/${playerItem.youtubeId}?autoplay=1&mute=1&rel=0`}
                    title={playerItem.title}
                    allow="autoplay; encrypted-media; picture-in-picture"
                    allowFullScreen
                  />
                ) : (
                  <video
                    ref={playerVideoRef}
                    className="cdn-player-video"
                    poster={playerItem.poster}
                    muted={playerMuted}
                    playsInline
                    preload="metadata"
                    crossOrigin="anonymous"
                    disableRemotePlayback
                    controls={isTouchDevice}
                  />
                )}

                {playerLoading ? (
                  <div className="cdn-player-loader">
                    <Loader2 size={52} color="#22d3ee" className="spin" />
                    <p>Liaison MAMO...</p>
                  </div>
                ) : null}

                {showUnmuteHint && playerItem.source !== "youtube" ? (
                  <button type="button" className="cdn-unmute-hint" onClick={unmutePlayer}>
                    <Volume2 size={22} />
                    Activer l'audio
                  </button>
                ) : null}
              </div>

              <div className="cdn-player-bottom">
                <div className="cdn-player-info">
                  <button
                    type="button"
                    className="cdn-main-play"
                    onClick={togglePlay}
                    disabled={playerItem.source === "youtube"}
                  >
                    {isPlaying ? <Pause size={26} /> : <Play size={26} />}
                  </button>
                  <div>
                    <h3>{playerItem.title}</h3>
                    <p>{playerItem.synopsis}</p>
                  </div>
                </div>

                <div className="cdn-player-controls">
                  <button
                    type="button"
                    className="cdn-icon-btn"
                    onClick={toggleMute}
                    disabled={playerItem.source === "youtube"}
                  >
                    {playerMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
                  </button>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.01"
                    value={playerVolume}
                    onChange={(event) => handleVolume(event.target.value)}
                    disabled={playerItem.source === "youtube"}
                  />
                  <button type="button" className="cdn-icon-btn" onClick={toggleFullscreen}>
                    <Maximize2 size={20} />
                  </button>
                </div>
              </div>
            </div>
          ) : null}
        </div>
      )}
    </section>
  );
}
