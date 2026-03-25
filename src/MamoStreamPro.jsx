import { useEffect, useMemo, useRef, useState } from "react";
import {
  Activity,
  AlertTriangle,
  Bell,
  Cpu,
  Database,
  Download,
  Gauge,
  Lock,
  Network,
  Radio,
  RefreshCw,
  Search,
  Settings,
  Share2,
  Shield,
  Trash2,
  Wallet,
  Wifi,
} from "lucide-react";

const STORAGE_KEY = "mamo-stream-pro-state-v3";
const TYPES = {
  SDR: { label: "Radio SDR", icon: Radio },
  NETWORK: { label: "Reseau", icon: Network },
  BLOCKCHAIN: { label: "Blockchain", icon: Database },
  ALERT: { label: "Alerte", icon: AlertTriangle },
  DEVICE: { label: "Appareil", icon: Wifi },
};
const PANELS = [
  { id: "overview", label: "Vue generale", icon: Activity },
  { id: "architecture", label: "Stack MAMO", icon: Share2 },
  { id: "feed", label: "Flux", icon: Activity },
  { id: "scanner", label: "Scanner SDR", icon: Radio },
  { id: "registry", label: "Registre", icon: Database },
  { id: "aibridge", label: "AI Bridge", icon: Cpu },
  { id: "security", label: "Securite", icon: Shield },
  { id: "settings", label: "Reglages", icon: Settings },
];

const MAMO_MESH_CENTER_MHZ = 1561.098;
const MAMO_MESH_SPAN_KHZ = 1000;
const MAMO_MESH_BIN_KHZ = 15.625;
const MAMO_MESH_GAIN_DB = 28;
const MAMO_MESH_INTEGRATION_SECONDS = 1;
const MAMO_STACK_MODULES = [
  {
    title: "Node MAMO",
    role: "Le cerveau",
    tool: "MAMO Node",
    detail: "Reoit les commandes, compresse les paquets et conserve les cles privees de l'operateur.",
  },
  {
    title: "Reseau Mesh",
    role: "Le systeme nerveux",
    tool: "Reticulum / Meshtastic",
    detail: "Routage resilient, rebond multi-node, frequency hopping et diffusion souveraine hors FAI classique.",
  },
  {
    title: "Logs MAMO",
    role: "La boite noire",
    tool: "JSON / CSV / registre local",
    detail: "Horodatage UTC, SNR, offset, lock, meshReady et hash des evenements pour audit et tracabilite.",
  },
  {
    title: "Monitoring",
    role: "Le cockpit",
    tool: "Grafana / Loki",
    detail: "Visualisation temps reel des collisions, latence, pics radio, sante du mesh et alertes de defense.",
  },
];
const MAMO_MESH_LOG_SCHEMA = `{
  "timestampUtc": "2026-03-24T21:41:00Z",
  "targetFrequencyMHz": 1561.098,
  "peakFrequencyMHz": 1560.9222,
  "peakPowerDb": -32.73,
  "noiseMeanDb": -38.16,
  "snrDb": 5.43,
  "offsetMHz": -0.1758,
  "lockAcquired": true,
  "meshReady": false,
  "quality": "weak-lock"
}`;
const MAMO_PROBE_COMMAND = `Invoke-WebRequest -UseBasicParsing http://127.0.0.1:8000/api/sdr/mesh/service?auto_start=true | Select-Object -ExpandProperty Content
Invoke-WebRequest -UseBasicParsing http://127.0.0.1:8000/api/sdr/mesh | Select-Object -ExpandProperty Content`;
const MAMO_DIRECT_PROBE_COMMAND = `python backend/scripts/mesh_sdr_probe.py --watch --format json`;
const MAMO_LOG_TAIL_COMMAND = `Invoke-WebRequest -UseBasicParsing http://127.0.0.1:8000/api/sdr/mesh/logs?limit=20 | Select-Object -ExpandProperty Content`;
const MAMO_BACKEND_COMMANDS = `powershell -ExecutionPolicy Bypass -File "C:/Users/tommy/Documents/RoyaumeMamo/NouveauTravail/backend/scripts/start_mamo_mesh_service.ps1"
powershell -ExecutionPolicy Bypass -File "C:/Users/tommy/Documents/RoyaumeMamo/NouveauTravail/backend/scripts/start_mamo_mesh_service.ps1" -Reload
Invoke-WebRequest -Method Post -UseBasicParsing http://127.0.0.1:8000/api/sdr/mesh/service/start | Select-Object -ExpandProperty Content
python backend/scripts/mesh_sdr_probe.py --watch --format json
python backend/scripts/mesh_sdr_probe.py --watch --format csv`;
const MAMO_OPENAI_RESPONSES_CURL = `curl https://api.openai.com/v1/responses \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer $OPENAI_API_KEY" \\
  -d '{
    "model": "gpt-5.2",
    "input": [
      {
        "role": "system",
        "content": "You are a senior coding agent. Return code only."
      },
      {
        "role": "user",
        "content": "Write a Python helper that parses MAMO SDR mesh logs."
      }
    ]
  }'`;
const MAMO_OPENAI_RESPONSES_PYTHON = `from openai import OpenAI

client = OpenAI()

response = client.responses.create(
    model="gpt-5.2",
    input=[
        {"role": "system", "content": "You are a senior coding agent. Return code only."},
        {"role": "user", "content": "Create a Python parser for MAMO mesh telemetry."},
    ],
)

print(response.output_text)`;
const MAMO_AI_PROMPTS = [
  "Generate only working code. No markdown fences.",
  "Analyze this mesh log and return only the corrected line of code.",
  "Add Sphinx docstrings without changing the logic.",
];
const MAMO_MESH_LOG_KEYS = [
  "timestampUtc",
  "targetFrequencyMHz",
  "peakFrequencyMHz",
  "peakPowerDb",
  "noiseMeanDb",
  "snrDb",
  "offsetMHz",
  "lockAcquired",
  "meshReady",
  "quality",
];

const DEFAULT_METRICS = {
  sdrBandwidthKHz: 0,
  scanLatencyMs: 0,
  sdrActivePeaks: 0,
  sdrSnrDb: 0,
  sdrNoiseMeanDb: 0,
  sdrOffsetMHz: 0,
  sdrLockAcquired: false,
  sdrMeshReady: false,
  sdrTimestampUtc: "",
  blockEvents: 0,
  purchaseOrders: 0,
  alerts: 0,
  threatScore: 0,
  devicesDetected: 0,
  defenderStatus: "unknown",
  sdrBridge: "unavailable",
  sdrPeakDb: 0,
  sdrPeakHz: 0,
  sdrServiceRunning: false,
  sdrServiceLastUpdatedUtc: "",
  sdrServiceIntervalSeconds: 0,
  sdrServiceError: "",
  sdrServiceSuccessCount: 0,
  sdrServiceAutostart: false,
  sdrLogPath: "",
  sdrLogEntryCount: 0,
};

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
const randomId = () => Math.random().toString(36).slice(2, 10).toUpperCase();
const nowStamp = () => new Date().toLocaleTimeString("fr-CA", { hour12: false });
const shortAddress = (address) => (!address ? "-" : `${address.slice(0, 6)}...${address.slice(-4)}`);
const formatFrequencyMHz = (value) => (typeof value === "number" ? (value / 1_000_000).toFixed(4) : "-");
const formatSigned = (value, digits = 2) => (typeof value === "number" ? `${value >= 0 ? "+" : ""}${value.toFixed(digits)}` : "-");
const normalizeErrorMessage = (error, fallback) => {
  if (error?.name === "AbortError") return "request_timeout";
  return error?.message || fallback;
};

async function fetchWithTimeout(resource, options = {}, timeoutMs = 6000) {
  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(resource, { ...options, signal: controller.signal });
  } finally {
    window.clearTimeout(timeoutId);
  }
}

function loadSavedState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function saveState(state) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // ignore
  }
}

function buildLog({ type, title, payload, details = {}, severity = "ok", source = "local" }) {
  return {
    id: `${Date.now()}-${randomId()}`,
    time: nowStamp(),
    type,
    title,
    payload,
    details,
    source,
    severity,
  };
}

function MetricBox({ label, value, icon: Icon }) {
  return (
    <div className="card">
      <div className="row" style={{ justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <p className="muted" style={{ margin: 0, textTransform: "uppercase", letterSpacing: "0.16em", fontSize: 11 }}>{label}</p>
          <h3 style={{ margin: "8px 0 0", fontSize: 24 }}>{value}</h3>
        </div>
        <div className="card" style={{ padding: 9 }}><Icon size={16} /></div>
      </div>
    </div>
  );
}

function EventRow({ log, active, onClick }) {
  const Icon = TYPES[log.type]?.icon || Activity;
  return (
    <button
      onClick={onClick}
      className={`w-full rounded-2xl border p-3 text-left transition ${active ? "neon" : ""}`}
      style={{
        borderColor: active ? "rgba(0,238,255,0.45)" : "rgba(255,255,255,0.08)",
        background: log.severity === "critical" ? "rgba(244,63,94,0.08)" : log.severity === "warning" ? "rgba(245,158,11,0.08)" : "rgba(255,255,255,0.03)",
      }}
    >
      <div className="row" style={{ alignItems: "flex-start" }}>
        <div className="card" style={{ padding: 8 }}><Icon size={14} /></div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="row" style={{ flexWrap: "wrap", gap: 8 }}>
            <strong style={{ color: "#fff" }}>{log.title}</strong>
            <span className="muted" style={{ fontSize: 11 }}>{log.type}</span>
            <span className="muted" style={{ fontSize: 11 }}>{log.time}</span>
          </div>
          <div className="muted" style={{ fontSize: 12, marginTop: 2 }}>{log.source}</div>
          <div style={{ marginTop: 6, color: "#e8f2ff" }}>{log.payload}</div>
        </div>
      </div>
    </button>
  );
}

function KV({ label, value }) {
  return <div className="row" style={{ justifyContent: "space-between", padding: "10px 12px", borderRadius: 12, border: "1px solid rgba(255,255,255,0.06)", background: "rgba(255,255,255,0.03)" }}><span className="muted">{label}</span><span style={{ color: "#fff", textAlign: "right" }}>{value}</span></div>;
}

function CodeCard({ title, code, onCopy }) {
  return (
    <div className="card">
      <div className="row" style={{ justifyContent: "space-between", alignItems: "center" }}>
        <h3 style={{ margin: 0 }}>{title}</h3>
        <button onClick={() => onCopy(title, code)}>Copier</button>
      </div>
      <pre
        style={{
          marginTop: 12,
          whiteSpace: "pre-wrap",
          wordBreak: "break-word",
          fontSize: 12,
          lineHeight: 1.5,
          color: "#d8f6ff",
        }}
      >
        {code}
      </pre>
    </div>
  );
}

export default function MamoStreamPro({ api, authToken = "", userAddress = "", isLocalDevHost = false }) {
  const saved = loadSavedState();
  const [panel, setPanel] = useState(saved?.panel || "overview");
  const [search, setSearch] = useState("");
  const [selectedType, setSelectedType] = useState(saved?.selectedType || "ALL");
  const [sessionName, setSessionName] = useState(saved?.sessionName || "MAMO Stream Pro");
  const [walletAddress, setWalletAddress] = useState(saved?.walletAddress || userAddress || "");
  const [walletChain, setWalletChain] = useState(saved?.walletChain || "");
  const [walletStatus, setWalletStatus] = useState(saved?.walletStatus || "Deconnecte");
  const [logs, setLogs] = useState(saved?.logs || []);
  const [selectedLogId, setSelectedLogId] = useState(saved?.selectedLogId || "");
  const [sdrSnapshot, setSdrSnapshot] = useState(saved?.sdrSnapshot || null);
  const [meshLogTail, setMeshLogTail] = useState(saved?.meshLogTail || []);
  const [toast, setToast] = useState("");
  const [metrics, setMetrics] = useState(saved?.metrics || DEFAULT_METRICS);
  const feedRef = useRef(null);
  const mountedRef = useRef(true);
  const refreshInFlightRef = useRef(false);
  const metricsRef = useRef(saved?.metrics || DEFAULT_METRICS);
  const selectedLogIdRef = useRef(saved?.selectedLogId || "");
  const copyText = async (label, value) => {
    try {
      await navigator.clipboard?.writeText(value);
      setToast(`${label} copie.`);
    } catch {
      setToast(`Impossible de copier ${label}.`);
    }
  };

  const appendLog = (entry) => {
    setLogs((current) => [entry, ...current].slice(0, 200));
    setSelectedLogId(entry.id);
  };

  useEffect(() => {
    saveState({
      panel,
      selectedType,
      sessionName,
      walletAddress,
      walletChain,
      walletStatus,
      selectedLogId,
      sdrSnapshot,
      meshLogTail: meshLogTail.slice(0, 12),
      metrics,
      logs: logs.slice(0, 200),
    });
  }, [panel, selectedType, sessionName, walletAddress, walletChain, walletStatus, selectedLogId, sdrSnapshot, meshLogTail, metrics, logs]);

  useEffect(() => {
    metricsRef.current = metrics;
  }, [metrics]);

  useEffect(() => {
    selectedLogIdRef.current = selectedLogId;
  }, [selectedLogId]);

  useEffect(() => () => {
    mountedRef.current = false;
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem("mamo-stream-pro-export", JSON.stringify({ updatedAt: new Date().toISOString(), sessionName, walletAddress, metrics, latest: logs.slice(0, 20) }));
      window.dispatchEvent(new CustomEvent("mamo-stream-pro:update", { detail: { sessionName, walletAddress, metrics } }));
    } catch {
      // ignore
    }
  }, [sessionName, walletAddress, metrics, logs]);

  useEffect(() => {
    if (!logs.length) return;
    if (!selectedLogId) setSelectedLogId(logs[0].id);
  }, [logs, selectedLogId]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(""), 2200);
    return () => clearTimeout(t);
  }, [toast]);

  useEffect(() => {
    if (!feedRef.current) return;
    feedRef.current.scrollTop = 0;
  }, [logs]);

  useEffect(() => {
    const provider = window?.ethereum;
    if (!provider?.on) return;
    const handleAccountsChanged = (accounts) => {
      const address = accounts?.[0] || "";
      setWalletAddress(address);
      setWalletStatus(address ? "Connecte" : "Deconnecte");
    };
    const handleChainChanged = (chainId) => setWalletChain(chainId || "");
    provider.on("accountsChanged", handleAccountsChanged);
    provider.on("chainChanged", handleChainChanged);
    return () => {
      provider.removeListener?.("accountsChanged", handleAccountsChanged);
      provider.removeListener?.("chainChanged", handleChainChanged);
    };
  }, []);

  const connectWallet = async () => {
    try {
      if (typeof window === "undefined" || !window.ethereum) {
        setWalletStatus("Aucun wallet detecte");
        setToast("Wallet non detecte dans ce navigateur.");
        return;
      }
      const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
      const chainId = await window.ethereum.request({ method: "eth_chainId" });
      const address = (accounts && accounts[0]) || "";
      setWalletAddress(address);
      setWalletChain(chainId || "");
      setWalletStatus(address ? "Connecte" : "Deconnecte");
      appendLog(buildLog({ type: "BLOCKCHAIN", title: "Wallet connecte", payload: address ? `Adresse ${shortAddress(address)} · chain ${chainId}` : "Connexion annulee", source: "window.ethereum", severity: address ? "ok" : "warning" }));
      setToast(address ? "Wallet connecte." : "Connexion annulee.");
    } catch (error) {
      setWalletStatus("Erreur de connexion");
      setToast(error?.message || "Impossible de connecter le wallet.");
      appendLog(buildLog({ type: "ALERT", title: "Echec wallet", payload: error?.message || "Impossible de connecter le wallet.", source: "window.ethereum", severity: "warning" }));
    }
  };

  const disconnectWallet = () => {
    setWalletAddress("");
    setWalletChain("");
    setWalletStatus("Deconnecte");
    setToast("Session wallet retiree localement.");
  };

  const clearLogs = () => {
    setLogs([]);
    setSelectedLogId("");
    setToast("Historique vide.");
  };

  const exportJson = () => {
    const payload = { exportedAt: new Date().toISOString(), sessionName, walletAddress, walletChain, metrics, logs };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "mamo-stream-export.json";
    a.click();
    URL.revokeObjectURL(url);
    setToast("Export JSON pret.");
  };

  const refreshLiveData = async (forceMesh = false) => {
    if (refreshInFlightRef.current) return;
    refreshInFlightRef.current = true;
    const nextLogs = [];
    try {
      const previousMetrics = metricsRef.current || DEFAULT_METRICS;
      const authHeaders = authToken ? { Authorization: `Bearer ${authToken}` } : {};
      let devicesDetected = 0;
      if (navigator.mediaDevices?.enumerateDevices) {
        try {
          const devices = await navigator.mediaDevices.enumerateDevices();
          devicesDetected = devices.length;
          nextLogs.push(buildLog({ type: "DEVICE", title: "Inventaire appareils", payload: `${devices.length} peripheriques detectes par le navigateur`, source: "navigator.mediaDevices", details: { count: devices.length } }));
        } catch (error) {
          nextLogs.push(buildLog({ type: "ALERT", title: "Inventaire appareils indisponible", payload: normalizeErrorMessage(error, "Impossible de lire les peripheriques navigateur"), source: "navigator.mediaDevices", severity: "warning" }));
        }
      }

      let defenderStatus = previousMetrics.defenderStatus || "unknown";
      let sdrBridge = previousMetrics.sdrBridge || "unavailable";
      let sdrPeakDb = Number(previousMetrics.sdrPeakDb || 0);
      let sdrPeakHz = Number(previousMetrics.sdrPeakHz || 0);
      let sdrBandwidthKHz = Number(previousMetrics.sdrBandwidthKHz || 0);
      let scanLatencyMs = Number(previousMetrics.scanLatencyMs || 0);
      let sdrActivePeaks = Number(previousMetrics.sdrActivePeaks || 0);
      let sdrSnrDb = Number(previousMetrics.sdrSnrDb || 0);
      let sdrNoiseMeanDb = Number(previousMetrics.sdrNoiseMeanDb || 0);
      let sdrOffsetMHz = Number(previousMetrics.sdrOffsetMHz || 0);
      let sdrLockAcquired = Boolean(previousMetrics.sdrLockAcquired);
      let sdrMeshReady = Boolean(previousMetrics.sdrMeshReady);
      let sdrTimestampUtc = previousMetrics.sdrTimestampUtc || "";
      let sdrServiceRunning = Boolean(previousMetrics.sdrServiceRunning);
      let sdrServiceLastUpdatedUtc = previousMetrics.sdrServiceLastUpdatedUtc || "";
      let sdrServiceIntervalSeconds = Number(previousMetrics.sdrServiceIntervalSeconds || 0);
      let sdrServiceError = previousMetrics.sdrServiceError || "";
      let sdrServiceSuccessCount = Number(previousMetrics.sdrServiceSuccessCount || 0);
      let sdrServiceAutostart = Boolean(previousMetrics.sdrServiceAutostart);
      let sdrLogPath = previousMetrics.sdrLogPath || "";
      let sdrLogEntryCount = Number(previousMetrics.sdrLogEntryCount || 0);

      const [defenderResult, serviceResult, meshResult, logsResult] = await Promise.allSettled([
        fetchWithTimeout(api("/api/defender/ping")),
        fetchWithTimeout(api("/api/sdr/mesh/service?auto_start=true"), { headers: authHeaders }),
        fetchWithTimeout(api(forceMesh ? "/api/sdr/mesh?force=true" : "/api/sdr/mesh"), { headers: authHeaders }),
        fetchWithTimeout(api("/api/sdr/mesh/logs?limit=8"), { headers: authHeaders }),
      ]);

      if (defenderResult.status === "fulfilled") {
        try {
          const data = await defenderResult.value.json();
          defenderStatus = data?.status || "unknown";
          nextLogs.push(buildLog({ type: "NETWORK", title: "Defender ping", payload: `${data?.status || "unknown"} · ${data?.network || "unknown"}`, source: "Mamora Defender", details: data || {}, severity: data?.status === "ok" ? "ok" : "warning" }));
        } catch (error) {
          nextLogs.push(buildLog({ type: "ALERT", title: "Defender indisponible", payload: normalizeErrorMessage(error, "Impossible de lire Defender"), source: "backend", severity: "warning" }));
        }
      } else {
        nextLogs.push(buildLog({ type: "ALERT", title: "Defender indisponible", payload: normalizeErrorMessage(defenderResult.reason, "Impossible de joindre Defender"), source: "backend", severity: "warning" }));
      }

      if (serviceResult.status === "fulfilled") {
        let serviceData = {};
        try {
          serviceData = await serviceResult.value.json();
        } catch {
          serviceData = {};
        }
        if (serviceResult.value.ok) {
          sdrServiceRunning = Boolean(serviceData?.running);
          sdrServiceLastUpdatedUtc = serviceData?.lastUpdatedUtc || sdrServiceLastUpdatedUtc;
          sdrServiceIntervalSeconds = Number(serviceData?.intervalSeconds || sdrServiceIntervalSeconds || 0);
          sdrServiceError = serviceData?.lastError?.message || "";
          sdrServiceSuccessCount = Number(serviceData?.successCount || sdrServiceSuccessCount || 0);
          sdrServiceAutostart = Boolean(serviceData?.autostart);
          sdrLogPath = serviceData?.logPath || sdrLogPath;
          nextLogs.push(buildLog({
            type: "NETWORK",
            title: "Service mesh",
            payload: `${sdrServiceRunning ? "actif" : "inactif"} · interval ${sdrServiceIntervalSeconds || "-"} s · refresh ${forceMesh ? "force" : "partage"}`,
            source: "backend-sdr-service",
            details: serviceData || {},
            severity: sdrServiceRunning ? "ok" : "warning",
          }));
        } else {
          nextLogs.push(buildLog({
            type: "ALERT",
            title: "Service mesh indisponible",
            payload: serviceData?.detail || `sdr_service_status_${serviceResult.value.status}`,
            source: "backend-sdr-service",
            severity: "warning",
          }));
        }
      } else {
        nextLogs.push(buildLog({
          type: "ALERT",
          title: "Service mesh indisponible",
          payload: normalizeErrorMessage(serviceResult.reason, "Impossible de lire le statut du service mesh"),
          source: "backend-sdr-service",
          severity: "warning",
        }));
      }

      if (meshResult.status === "fulfilled") {
        let meshData = {};
        try {
          meshData = await meshResult.value.json();
        } catch {
          meshData = {};
        }
        if (meshResult.value.ok) {
          if (mountedRef.current) setSdrSnapshot(meshData);
          sdrBridge = "connected";
          sdrServiceRunning = Boolean(meshData?.service?.running ?? sdrServiceRunning);
          sdrServiceLastUpdatedUtc = meshData?.service?.lastUpdatedUtc || sdrServiceLastUpdatedUtc;
          sdrServiceIntervalSeconds = Number(meshData?.service?.intervalSeconds || sdrServiceIntervalSeconds || 0);
          sdrServiceError = meshData?.service?.lastError?.message || sdrServiceError;
          sdrServiceSuccessCount = Number(meshData?.service?.successCount || sdrServiceSuccessCount || 0);
          sdrServiceAutostart = Boolean(meshData?.service?.autostart ?? sdrServiceAutostart);
          sdrLogPath = meshData?.service?.logPath || sdrLogPath;
          sdrPeakDb = Number(meshData?.peakPowerDb || 0);
          sdrPeakHz = Number(meshData?.peakFrequencyMHz || 0) * 1_000_000;
          sdrBandwidthKHz = Number(meshData?.spanKHz || 0);
          scanLatencyMs = Number(meshData?.scanDurationMs || 0);
          sdrActivePeaks = Number(meshData?.activePeakCount || 0);
          sdrSnrDb = Number(meshData?.snrDb || 0);
          sdrNoiseMeanDb = Number(meshData?.noiseMeanDb || 0);
          sdrOffsetMHz = Number(meshData?.offsetMHz || 0);
          sdrLockAcquired = Boolean(meshData?.lockAcquired);
          sdrMeshReady = Boolean(meshData?.meshReady);
          sdrTimestampUtc = meshData?.timestampUtc || "";
          nextLogs.push(buildLog({
            type: "SDR",
            title: "Snapshot mesh MAMO",
            payload: `Lock ${sdrLockAcquired ? "oui" : "non"} · SNR ${sdrSnrDb.toFixed(2)} dB · offset ${formatSigned(sdrOffsetMHz, 4)} MHz · ${forceMesh ? "scan force" : "snapshot service"}`,
            source: "mesh-sdr",
            details: {
              timestampUtc: sdrTimestampUtc,
              peakFrequencyMHz: meshData?.peakFrequencyMHz,
              peakPowerDb: meshData?.peakPowerDb,
              noiseMeanDb: meshData?.noiseMeanDb,
              snrDb: meshData?.snrDb,
              offsetMHz: meshData?.offsetMHz,
              lockAcquired: meshData?.lockAcquired,
              meshReady: meshData?.meshReady,
              quality: meshData?.quality,
            },
            severity: sdrMeshReady ? "ok" : sdrLockAcquired ? "warning" : "critical",
          }));
        } else {
          sdrBridge = meshData?.detail === "missing_authorization" || meshData?.detail === "insufficient_permissions" ? "protected" : previousMetrics.sdrBridge || "unavailable";
          nextLogs.push(buildLog({
            type: "ALERT",
            title: "SDR indisponible",
            payload: meshData?.detail || `sdr_mesh_${meshResult.value.status}`,
            source: "backend-sdr",
            severity: "warning",
          }));
        }
      } else {
        sdrBridge = previousMetrics.sdrBridge || "unavailable";
        nextLogs.push(buildLog({
          type: "ALERT",
          title: "SDR indisponible",
          payload: normalizeErrorMessage(meshResult.reason, "Impossible de lire le signal SDR"),
          source: "backend-sdr",
          severity: "warning",
        }));
      }

      if (logsResult.status === "fulfilled") {
        let logsData = {};
        try {
          logsData = await logsResult.value.json();
        } catch {
          logsData = {};
        }
        if (logsResult.value.ok) {
          if (mountedRef.current) setMeshLogTail(Array.isArray(logsData?.entries) ? logsData.entries : []);
          sdrLogPath = logsData?.path || sdrLogPath;
          sdrLogEntryCount = Number(logsData?.count || 0);
        } else {
          nextLogs.push(buildLog({
            type: "ALERT",
            title: "Journal mesh indisponible",
            payload: logsData?.detail || `sdr_mesh_logs_${logsResult.value.status}`,
            source: "backend-sdr-log",
            severity: "warning",
          }));
        }
      } else {
        nextLogs.push(buildLog({
          type: "ALERT",
          title: "Journal mesh indisponible",
          payload: normalizeErrorMessage(logsResult.reason, "Impossible de lire le journal JSONL mesh"),
          source: "backend-sdr-log",
          severity: "warning",
        }));
      }

      const anomalyCount = nextLogs.filter((entry) => entry.severity !== "ok").length;
      const threatScore = clamp(
        (defenderStatus === "ok" ? 8 : 30) +
          (sdrBridge === "connected" ? 4 : 32) +
          (sdrMeshReady ? 0 : sdrLockAcquired ? 10 : 24) +
          (sdrSnrDb < 10 ? Math.ceil((10 - sdrSnrDb) * 2) : 0) +
          anomalyCount * 4,
        0,
        100
      );

      const liveAddress = walletAddress || userAddress || "";
      let blockEvents = 0;
      let purchaseOrders = 0;
      if (liveAddress) {
        try {
          const balanceRes = await fetchWithTimeout(api(`/api/web3/balance/${liveAddress}`));
          const balanceData = await balanceRes.json();
          nextLogs.push(buildLog({ type: "BLOCKCHAIN", title: "Solde Web3", payload: `${shortAddress(liveAddress)} · ${balanceData?.balanceInWei || "0"} wei`, source: balanceData?.source || "backend", details: balanceData || {} }));
        } catch (error) {
          nextLogs.push(buildLog({ type: "ALERT", title: "Balance Web3 indisponible", payload: normalizeErrorMessage(error, "Lecture balance impossible"), source: "backend", severity: "warning" }));
        }

        try {
          const eventsRes = await fetchWithTimeout(api(`/api/web3/events/mining?address=${encodeURIComponent(liveAddress)}&limit=20`));
          const eventsData = await eventsRes.json();
          blockEvents = Array.isArray(eventsData?.events) ? eventsData.events.length : 0;
          nextLogs.push(buildLog({ type: "BLOCKCHAIN", title: "Evenements mining", payload: `${blockEvents} evenements pour ${shortAddress(liveAddress)}`, source: eventsData?.source || "backend", details: { count: blockEvents } }));
        } catch (error) {
          nextLogs.push(buildLog({ type: "ALERT", title: "Mining events indisponibles", payload: normalizeErrorMessage(error, "Lecture events impossible"), source: "backend", severity: "warning" }));
        }

        if (authToken) {
          try {
            const ordersRes = await fetchWithTimeout(api(`/api/purchase/orders?walletAddress=${encodeURIComponent(liveAddress)}`), { headers: { Authorization: `Bearer ${authToken}` } });
            const ordersData = await ordersRes.json();
            purchaseOrders = Array.isArray(ordersData?.orders) ? ordersData.orders.length : 0;
            nextLogs.push(buildLog({ type: "NETWORK", title: "Ordres banking", payload: `${purchaseOrders} ordres pour ${shortAddress(liveAddress)}`, source: "banking", details: { count: purchaseOrders } }));
          } catch (error) {
            nextLogs.push(buildLog({ type: "ALERT", title: "Ordres banking indisponibles", payload: normalizeErrorMessage(error, "Lecture orders impossible"), source: "banking", severity: "warning" }));
          }
        }
      }

      if (mountedRef.current) {
        setMetrics({
        sdrBandwidthKHz,
        scanLatencyMs,
        sdrActivePeaks,
        sdrSnrDb,
        sdrNoiseMeanDb,
        sdrOffsetMHz,
        sdrLockAcquired,
        sdrMeshReady,
        sdrTimestampUtc,
        blockEvents,
        purchaseOrders,
        alerts: anomalyCount,
        threatScore,
        devicesDetected,
        defenderStatus,
        sdrBridge,
        sdrPeakDb,
        sdrPeakHz,
        sdrServiceRunning,
        sdrServiceLastUpdatedUtc,
        sdrServiceIntervalSeconds,
        sdrServiceError,
        sdrServiceSuccessCount,
        sdrServiceAutostart,
        sdrLogPath,
        sdrLogEntryCount,
        });
      }

      if (nextLogs.length) {
        if (mountedRef.current) {
          setLogs((current) => [...nextLogs.reverse(), ...current].slice(0, 200));
          if (!selectedLogIdRef.current && nextLogs[0]) setSelectedLogId(nextLogs[0].id);
        }
      }
    } catch (error) {
      if (mountedRef.current) {
        appendLog(buildLog({ type: "ALERT", title: "Refresh impossible", payload: normalizeErrorMessage(error, "Erreur de rafraichissement"), source: "engine", severity: "critical" }));
      }
    } finally {
      refreshInFlightRef.current = false;
    }
  };

  useEffect(() => {
    refreshLiveData(true);
    const interval = setInterval(() => refreshLiveData(false), isLocalDevHost ? 8000 : 12000);
    return () => clearInterval(interval);
  }, [authToken, userAddress, walletAddress, isLocalDevHost]);

  const filteredLogs = useMemo(() => logs.filter((log) => {
    const typeOk = selectedType === "ALL" || log.type === selectedType;
    const searchText = `${log.title} ${log.payload} ${log.source}`.toLowerCase();
    const searchOk = !search.trim() || searchText.includes(search.trim().toLowerCase());
    return typeOk && searchOk;
  }), [logs, selectedType, search]);

  const selectedLog = logs.find((item) => item.id === selectedLogId) || filteredLogs[0] || null;
  const registryRows = useMemo(() => filteredLogs.slice(0, 8).map((log, idx) => ({ key: `REG-${idx + 1}`, source: log.source, type: log.type, stamp: log.time, checksum: `${log.id.slice(0, 6)}-${log.type.slice(0, 3)}-${idx + 1}` })), [filteredLogs]);
  const sdrTopBins = useMemo(
    () => (sdrSnapshot?.activePeaks ? sdrSnapshot.activePeaks : sdrSnapshot?.scan?.summary?.activePeaks || []),
    [sdrSnapshot]
  );

  return (
    <section className="panel glass neon">
      <div className="card">
        <div className="row" style={{ flexWrap: "wrap", justifyContent: "space-between" }}>
          <div>
            <h2 style={{ marginBottom: 6 }}>MAMO Stream Pro</h2>
            <p className="muted">Moteur prive d'agregation et de distribution. Il alimente la plateforme avec les sources reelles disponibles.</p>
          </div>
          <div className="row" style={{ flexWrap: "wrap" }}>
            <span className="tcv-chip tcv-chip-amber"><Lock size={14} /> Prive</span>
            <button onClick={() => refreshLiveData(true)}><RefreshCw size={14} /> Rafraichir</button>
            <button onClick={exportJson}><Download size={14} /> Export JSON</button>
          </div>
        </div>
      </div>

      <div className="tcv-layout" style={{ marginTop: 12 }}>
        <aside className="card tcv-sidebar">
          <div className="tcv-profile">
            <div className="tcv-avatar"><Activity size={18} /></div>
            <div><div className="tcv-profile-name">{sessionName}</div><div className="muted">Moteur prive de distribution</div></div>
          </div>
          <div className="tcv-profile-meta">
            <div><span>Wallet</span><strong>{walletAddress ? shortAddress(walletAddress) : "Aucun"}</strong></div>
            <div><span>Chain</span><strong>{walletChain || "—"}</strong></div>
            <div><span>Defender</span><strong>{metrics.defenderStatus}</strong></div>
            <div><span>SDR bridge</span><strong>{metrics.sdrBridge}</strong></div>
          </div>
          <div className="tcv-nav">
            {PANELS.map(({ id, label, icon: Icon }) => <button key={id} className={`tcv-nav-btn ${panel === id ? "active" : ""}`} onClick={() => setPanel(id)}><span><Icon size={15} /> {label}</span></button>)}
          </div>
          <div className="card" style={{ marginTop: 14 }}>
            <h3 style={{ fontSize: 15 }}>Wallet</h3>
            <div className="tcv-list">
              <div className="tcv-list-item"><div><strong>Statut</strong><p>{walletStatus}</p></div></div>
              <div className="row"><button onClick={connectWallet}><Wallet size={14} /> Connecter</button><button onClick={disconnectWallet}><Trash2 size={14} /> Retirer</button></div>
            </div>
          </div>
        </aside>

        <main className="tcv-content">
          <div className="tcv-toolbar">
            <div className="tcv-search"><Search size={16} /><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Rechercher dans les logs" /></div>
            <div className="row">
              <select value={selectedType} onChange={(e) => setSelectedType(e.target.value)}><option value="ALL">Tous les types</option>{Object.keys(TYPES).map((type) => <option key={type} value={type}>{TYPES[type].label}</option>)}</select>
              <button onClick={clearLogs}><Trash2 size={14} /> Vider</button>
            </div>
          </div>

          {panel === "overview" && <div className="grid two"><MetricBox label="Bande SDR" value={`${metrics.sdrBandwidthKHz} kHz`} icon={Activity} /><MetricBox label="Latence scan" value={`${metrics.scanLatencyMs} ms`} icon={Gauge} /><MetricBox label="SNR" value={`${metrics.sdrSnrDb.toFixed(2)} dB`} icon={Radio} /><MetricBox label="Offset" value={`${formatSigned(metrics.sdrOffsetMHz, 4)} MHz`} icon={Network} /><MetricBox label="Lock" value={metrics.sdrLockAcquired ? "Oui" : "Non"} icon={Lock} /><MetricBox label="Events chain" value={metrics.blockEvents} icon={Database} /><MetricBox label="Ordres banking" value={metrics.purchaseOrders} icon={Wallet} /><MetricBox label="Risque reel" value={`${metrics.threatScore}/100`} icon={Shield} /><div className="card"><h3>Etat du pont</h3><div className="tcv-list"><div className="tcv-list-item"><div><strong>Frequence MAMO</strong><p>Canal mesh principal</p></div><span className={metrics.sdrBridge === "connected" ? "ok" : "warn"}>{MAMO_MESH_CENTER_MHZ} MHz</span></div><div className="tcv-list-item"><div><strong>UTC</strong><p>Horodatage de reference du snapshot</p></div><span className="ok">{metrics.sdrTimestampUtc || "-"}</span></div><div className="tcv-list-item"><div><strong>Service mesh</strong><p>Worker partage pour toute la plateforme</p></div><span className={metrics.sdrServiceRunning ? "ok" : "warn"}>{metrics.sdrServiceRunning ? "actif" : "arrete"}</span></div><div className="tcv-list-item"><div><strong>Cadence</strong><p>Intervalle du service</p></div><span className={metrics.sdrServiceRunning ? "ok" : "warn"}>{metrics.sdrServiceIntervalSeconds ? `${metrics.sdrServiceIntervalSeconds}s` : "-"}</span></div><div className="tcv-list-item"><div><strong>Mesh ready</strong><p>Synchro exploitable pour le reseau</p></div><span className={metrics.sdrMeshReady ? "ok" : "warn"}>{metrics.sdrMeshReady ? "oui" : "non"}</span></div><div className="tcv-list-item"><div><strong>Bruit moyen</strong><p>Niveau de fond radio</p></div><span className={metrics.sdrBridge === "connected" ? "ok" : "warn"}>{metrics.sdrNoiseMeanDb ? `${metrics.sdrNoiseMeanDb.toFixed(2)} dB` : "-"}</span></div><div className="tcv-list-item"><div><strong>Pic radio</strong><p>Dernier snapshot partage</p></div><span className={metrics.sdrBridge === "connected" ? "ok" : "warn"}>{metrics.sdrPeakHz ? `${formatFrequencyMHz(metrics.sdrPeakHz)} MHz` : "-"}</span></div><div className="tcv-list-item"><div><strong>Devices</strong><p>Detection navigateur</p></div><span className="ok">{metrics.devicesDetected}</span></div></div></div><div className="card"><h3>Distribution</h3><p className="muted">Le moteur publie un export local dans `mamo-stream-pro-export`, emet l'evenement `mamo-stream-pro:update` et distribue maintenant un snapshot mesh partage via `/api/sdr/mesh` pour les autres modules MAMO.</p></div></div>}

          {panel === "architecture" && <div className="grid two">{MAMO_STACK_MODULES.map((module) => <div key={module.title} className="card"><div className="row" style={{ justifyContent: "space-between", alignItems: "center" }}><h3 style={{ margin: 0 }}>{module.title}</h3><span className="tcv-chip tcv-chip-amber">{module.role}</span></div><div className="tcv-list" style={{ marginTop: 12 }}><KV label="Outil suggere" value={module.tool} /><KV label="Role" value={module.detail} /></div></div>)}<div className="card"><h3>Profil radio mesh</h3><div className="tcv-list"><KV label="Centre" value={`${MAMO_MESH_CENTER_MHZ} MHz`} /><KV label="Span" value={`${MAMO_MESH_SPAN_KHZ} kHz`} /><KV label="Bin" value={`${MAMO_MESH_BIN_KHZ} kHz`} /><KV label="Gain" value={`${MAMO_MESH_GAIN_DB} dB`} /><KV label="Integration" value={`${MAMO_MESH_INTEGRATION_SECONDS} s`} /></div></div><div className="card"><h3>Modules operateurs</h3><div className="tcv-list"><KV label="Protocole mesh" value="Reticulum ou Meshtastic" /><KV label="Monitoring" value="Grafana + Loki" /><KV label="Distribution" value="Event mamo-stream-pro:update + export local + /api/sdr/mesh partage" /><KV label="Registre" value={MAMO_MESH_LOG_KEYS.join(", ")} /><KV label="Journal JSONL" value={metrics.sdrLogPath || "backend/data/mamo-mesh-log.jsonl"} /></div></div><CodeCard title="Probe service JSON" code={MAMO_PROBE_COMMAND} onCopy={copyText} /><CodeCard title="Tail journal mesh" code={MAMO_LOG_TAIL_COMMAND} onCopy={copyText} /><CodeCard title="Probe direct hardware" code={MAMO_DIRECT_PROBE_COMMAND} onCopy={copyText} /><CodeCard title="Commandes backend" code={MAMO_BACKEND_COMMANDS} onCopy={copyText} /><CodeCard title="Schema logs mesh" code={MAMO_MESH_LOG_SCHEMA} onCopy={copyText} /></div>}

          {panel === "feed" && <div className="grid two" style={{ gridTemplateColumns: "minmax(0,1fr) 320px" }}><div className="card"><h3>Flux live</h3><div ref={feedRef} className="tcv-terminal">{filteredLogs.length ? filteredLogs.map((log) => <EventRow key={log.id} log={log} active={log.id === selectedLogId} onClick={() => setSelectedLogId(log.id)} />) : <div className="muted">Aucun log pour ce filtre.</div>}</div></div><div className="card"><h3>Details</h3>{selectedLog ? <div className="tcv-list"><KV label="Type" value={selectedLog.type} /><KV label="Source" value={selectedLog.source} /><KV label="Payload" value={selectedLog.payload} />{Object.entries(selectedLog.details || {}).map(([key, value]) => <KV key={key} label={key} value={String(value)} />)}</div> : <div className="muted">Aucun evenement selectionne.</div>}</div></div>}

          {panel === "scanner" && <div className="grid two"><div className="card"><h3>Scanner SDR</h3>{sdrSnapshot ? <div className="tcv-list"><KV label="Timestamp UTC" value={sdrSnapshot.timestampUtc || "-"} /><KV label="Frequence cible" value={`${sdrSnapshot.targetFrequencyMHz} MHz`} /><KV label="Pic" value={`${Number(sdrSnapshot.peakFrequencyMHz || 0).toFixed(4)} MHz`} /><KV label="Puissance pic" value={`${Number(sdrSnapshot.peakPowerDb || 0).toFixed(2)} dB`} /><KV label="Bruit moyen" value={`${Number(sdrSnapshot.noiseMeanDb || 0).toFixed(2)} dB`} /><KV label="SNR" value={`${Number(sdrSnapshot.snrDb || 0).toFixed(2)} dB`} /><KV label="Offset" value={`${formatSigned(Number(sdrSnapshot.offsetMHz || 0), 4)} MHz`} /><KV label="Lock" value={sdrSnapshot.lockAcquired ? "Oui" : "Non"} /><KV label="Mesh ready" value={sdrSnapshot.meshReady ? "Oui" : "Non"} /><KV label="Qualite" value={sdrSnapshot.quality || "-"} /><KV label="Latence scan" value={`${Number(sdrSnapshot.scanDurationMs || 0).toFixed(2)} ms`} /><KV label="Bins" value={String(sdrSnapshot.binCount || 0)} /></div> : <p className="warn">Le pont SDR ne renvoie pas encore de scan. Si tu es en public, il restera protege; en local il doit repondre via `rtl_power`.</p>}</div><div className="card"><h3>Sources reelles raccordees</h3><div className="tcv-list"><div className="tcv-list-item"><div><strong>Bridge</strong><p>/api/sdr/mesh</p></div><span className={metrics.sdrBridge === "connected" ? "ok" : "warn"}>{metrics.sdrBridge}</span></div><div className="tcv-list-item"><div><strong>Service</strong><p>/api/sdr/mesh/service</p></div><span className={metrics.sdrServiceRunning ? "ok" : "warn"}>{metrics.sdrServiceRunning ? "actif" : "arrete"}</span></div><div className="tcv-list-item"><div><strong>Derniere mise a jour</strong><p>Snapshot partage</p></div><span>{metrics.sdrServiceLastUpdatedUtc || "-"}</span></div><div className="tcv-list-item"><div><strong>Succes service</strong><p>Cycles valides</p></div><span>{metrics.sdrServiceSuccessCount}</span></div><div className="tcv-list-item"><div><strong>Dongle</strong><p>{sdrSnapshot?.device?.vendor || "RTL-SDR"}</p></div><span>{sdrSnapshot?.device?.tuner || "-"}</span></div><div className="tcv-list-item"><div><strong>Wallet</strong><p>window.ethereum</p></div><span>{walletAddress ? "OK" : "OFF"}</span></div><div className="tcv-list-item"><div><strong>Defender</strong><p>/api/defender/ping</p></div><span>{metrics.defenderStatus}</span></div><div className="tcv-list-item"><div><strong>Web3 events</strong><p>/api/web3/events/mining</p></div><span>{metrics.blockEvents}</span></div></div>{metrics.sdrServiceError ? <p className="warn" style={{ marginTop: 12 }}>Erreur service: {metrics.sdrServiceError}</p> : null}{sdrTopBins.length ? <div className="tcv-list" style={{ marginTop: 12 }}>{sdrTopBins.map((bin, index) => <KV key={`${bin.frequencyHz}-${index}`} label={`Peak ${index + 1}`} value={`${Number((bin.frequencyHz || 0) / 1_000_000).toFixed(4)} MHz · ${Number(bin.powerDb || 0).toFixed(2)} dB`} />)}</div> : null}</div></div>}

          {panel === "registry" && <div className="grid two"><div className="card"><h3>Registre local</h3><div className="table-wrap"><table className="bloomberg"><thead><tr><th>Cle</th><th>Source</th><th>Type</th><th>Horodatage</th><th>Checksum</th></tr></thead><tbody>{registryRows.map((row) => <tr key={row.key}><td>{row.key}</td><td>{row.source}</td><td>{row.type}</td><td>{row.stamp}</td><td>{row.checksum}</td></tr>)}</tbody></table></div></div><div className="card"><h3>Journal mesh JSONL</h3><div className="tcv-list"><KV label="Chemin" value={metrics.sdrLogPath || "-"} /><KV label="Entrees chargees" value={String(metrics.sdrLogEntryCount || 0)} /></div>{meshLogTail.length ? <div className="tcv-list" style={{ marginTop: 12 }}>{meshLogTail.map((entry, index) => <KV key={`${entry.timestampUtc || entry.message || index}-${index}`} label={entry.kind === "error" ? `Erreur ${index + 1}` : `Snapshot ${index + 1}`} value={entry.kind === "error" ? `${entry.timestampUtc || "-"} · ${entry.message || "-"}` : `${entry.timestampUtc || "-"} · SNR ${Number(entry.snrDb || 0).toFixed(2)} dB · lock ${entry.lockAcquired ? "oui" : "non"}`} />)}</div> : <p className="muted" style={{ marginTop: 12 }}>Aucune entree JSONL chargee.</p>}</div></div>}

          {panel === "aibridge" && <div className="grid two"><div className="card"><div className="row" style={{ justifyContent: "space-between", alignItems: "center" }}><h3 style={{ margin: 0 }}>AI Bridge</h3><span className="tcv-chip tcv-chip-amber"><Cpu size={14} /> Backend only</span></div><div className="tcv-list" style={{ marginTop: 12 }}><KV label="Mode recommande" value="Responses API" /><KV label="Modele code" value="gpt-5.2" /><KV label="Usage" value="Generation, debug, documentation et outils de code pour MAMO" /><KV label="Securite" value="Ne jamais exposer la cle API dans le frontend" /></div><p className="muted" style={{ marginTop: 12 }}>Le bridge IA doit tourner cote node ou backend, jamais directement dans le navigateur public.</p></div><div className="card"><h3>Note de compatibilite</h3><div className="tcv-list"><KV label="Codex historique" value="Retire" /><KV label="Equivalent actuel" value="Responses API + modeles GPT-5.x" /><KV label="Cible" value="Automatiser les scripts, parseurs et correctifs MAMO" /></div></div><CodeCard title="OpenAI Responses cURL" code={MAMO_OPENAI_RESPONSES_CURL} onCopy={copyText} /><CodeCard title="OpenAI Responses Python" code={MAMO_OPENAI_RESPONSES_PYTHON} onCopy={copyText} /><div className="card"><div className="row" style={{ justifyContent: "space-between", alignItems: "center" }}><h3 style={{ margin: 0 }}>Prompt presets</h3><button onClick={() => copyText("Prompts IA", MAMO_AI_PROMPTS.join("\n"))}>Copier</button></div><div className="tcv-list" style={{ marginTop: 12 }}>{MAMO_AI_PROMPTS.map((prompt) => <KV key={prompt} label="Prompt" value={prompt} />)}</div></div></div>}

          {panel === "security" && <div className="grid two"><div className="card"><h3>Posture securite</h3><div className="tcv-list"><div className="tcv-list-item"><div><strong>Confidentialite</strong><p>Moteur prive, reserve a l'operateur</p></div><span className="ok">verrouille</span></div><div className="tcv-list-item"><div><strong>Threat score</strong><p>Agrege depuis Defender + disponibilite des ponts</p></div><span className={metrics.threatScore < 30 ? "ok" : "warn"}>{metrics.threatScore}/100</span></div><div className="tcv-list-item"><div><strong>Wallet</strong><p>Source bancaire et blockchain</p></div><span className={walletAddress ? "ok" : "warn"}>{walletAddress ? "lie" : "absent"}</span></div></div></div><div className="card"><h3>Actions</h3><div className="row" style={{ flexWrap: "wrap" }}><button onClick={() => refreshLiveData(true)}><RefreshCw size={14} /> Sync sources</button><button onClick={exportJson}><Download size={14} /> Export</button></div></div></div>}

          {panel === "settings" && <div className="grid two"><div className="card"><h3>Reglages</h3><label>Nom de session<input value={sessionName} onChange={(e) => setSessionName(e.target.value)} /></label><div className="tcv-list" style={{ marginTop: 12 }}><KV label="Autostart service" value={metrics.sdrServiceAutostart ? "Oui" : "Non"} /><KV label="Derniere erreur service" value={metrics.sdrServiceError || "-"} /></div><div className="row" style={{ marginTop: 12 }}><button onClick={() => refreshLiveData(true)}><RefreshCw size={14} /> Sync</button><button onClick={exportJson}><Download size={14} /> Export</button></div></div><div className="card"><h3>Stockage local</h3><p className="muted">Etat persiste dans localStorage et peut etre reexporte.</p><button onClick={() => { localStorage.removeItem(STORAGE_KEY); localStorage.removeItem("mamo-stream-pro-export"); setToast("Stockage local supprime. Recharge la page pour repartir a zero."); }}><Trash2 size={14} /> Supprimer le stockage local</button></div></div>}
        </main>
      </div>

      {toast ? <div className="tcv-toast info"><Bell size={16} /><span>{toast}</span></div> : null}
    </section>
  );
}


