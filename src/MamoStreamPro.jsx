import { useEffect, useMemo, useRef, useState } from "react";
import {
  Activity,
  AlertTriangle,
  Bell,
  Database,
  Download,
  Gauge,
  Lock,
  Network,
  Radio,
  RefreshCw,
  Search,
  Settings,
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
  { id: "feed", label: "Flux", icon: Activity },
  { id: "scanner", label: "Scanner SDR", icon: Radio },
  { id: "registry", label: "Registre", icon: Database },
  { id: "security", label: "Securite", icon: Shield },
  { id: "settings", label: "Reglages", icon: Settings },
];

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
const randomId = () => Math.random().toString(36).slice(2, 10).toUpperCase();
const nowStamp = () => new Date().toLocaleTimeString("fr-CA", { hour12: false });
const shortAddress = (address) => (!address ? "-" : `${address.slice(0, 6)}...${address.slice(-4)}`);

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
  const [toast, setToast] = useState("");
  const [metrics, setMetrics] = useState({ throughput: 0, latency: 0, activeNodes: 0, blockEvents: 0, purchaseOrders: 0, alerts: 0, threatScore: 0, devicesDetected: 0, defenderStatus: "unknown", sdrBridge: "unavailable" });
  const feedRef = useRef(null);

  const appendLog = (entry) => {
    setLogs((current) => [entry, ...current].slice(0, 200));
    setSelectedLogId(entry.id);
  };

  useEffect(() => {
    saveState({ panel, selectedType, sessionName, walletAddress, walletChain, walletStatus, selectedLogId, logs: logs.slice(0, 200) });
  }, [panel, selectedType, sessionName, walletAddress, walletChain, walletStatus, selectedLogId, logs]);

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

  const refreshLiveData = async () => {
    const nextLogs = [];
    try {
      const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
      const throughput = clamp(Math.round(Number(connection?.downlink || 0) * 1000), 0, 3000);
      const latency = clamp(Number(connection?.rtt || 0), 0, 200);
      let devicesDetected = 0;
      if (navigator.mediaDevices?.enumerateDevices) {
        const devices = await navigator.mediaDevices.enumerateDevices();
        devicesDetected = devices.length;
        nextLogs.push(buildLog({ type: "DEVICE", title: "Inventaire appareils", payload: `${devices.length} peripheriques detectes par le navigateur`, source: "navigator.mediaDevices", details: { count: devices.length } }));
      }

      let defenderStatus = "offline";
      try {
        const res = await fetch(api("/api/defender/ping"));
        const data = await res.json();
        defenderStatus = data?.status || "unknown";
        nextLogs.push(buildLog({ type: "NETWORK", title: "Defender ping", payload: `${data?.status || "unknown"} · ${data?.network || "unknown"}`, source: "Mamora Defender", details: data || {}, severity: data?.status === "ok" ? "ok" : "warning" }));
      } catch (error) {
        nextLogs.push(buildLog({ type: "ALERT", title: "Defender indisponible", payload: error?.message || "Impossible de joindre Defender", source: "backend", severity: "warning" }));
      }

      const liveAddress = walletAddress || userAddress || "";
      let blockEvents = 0;
      let purchaseOrders = 0;
      if (liveAddress) {
        try {
          const balanceRes = await fetch(api(`/api/web3/balance/${liveAddress}`));
          const balanceData = await balanceRes.json();
          nextLogs.push(buildLog({ type: "BLOCKCHAIN", title: "Solde Web3", payload: `${shortAddress(liveAddress)} · ${balanceData?.balanceInWei || "0"} wei`, source: balanceData?.source || "backend", details: balanceData || {} }));
        } catch (error) {
          nextLogs.push(buildLog({ type: "ALERT", title: "Balance Web3 indisponible", payload: error?.message || "Lecture balance impossible", source: "backend", severity: "warning" }));
        }

        try {
          const eventsRes = await fetch(api(`/api/web3/events/mining?address=${encodeURIComponent(liveAddress)}&limit=20`));
          const eventsData = await eventsRes.json();
          blockEvents = Array.isArray(eventsData?.events) ? eventsData.events.length : 0;
          nextLogs.push(buildLog({ type: "BLOCKCHAIN", title: "Evenements mining", payload: `${blockEvents} evenements pour ${shortAddress(liveAddress)}`, source: eventsData?.source || "backend", details: { count: blockEvents } }));
        } catch (error) {
          nextLogs.push(buildLog({ type: "ALERT", title: "Mining events indisponibles", payload: error?.message || "Lecture events impossible", source: "backend", severity: "warning" }));
        }

        if (authToken) {
          try {
            const ordersRes = await fetch(api(`/api/purchase/orders?walletAddress=${encodeURIComponent(liveAddress)}`), { headers: { Authorization: `Bearer ${authToken}` } });
            const ordersData = await ordersRes.json();
            purchaseOrders = Array.isArray(ordersData?.orders) ? ordersData.orders.length : 0;
            nextLogs.push(buildLog({ type: "NETWORK", title: "Ordres banking", payload: `${purchaseOrders} ordres pour ${shortAddress(liveAddress)}`, source: "banking", details: { count: purchaseOrders } }));
          } catch (error) {
            nextLogs.push(buildLog({ type: "ALERT", title: "Ordres banking indisponibles", payload: error?.message || "Lecture orders impossible", source: "banking", severity: "warning" }));
          }
        }
      }

      nextLogs.push(buildLog({ type: "SDR", title: "Pont SDR", payload: "Aucun endpoint SDR live expose par le backend actuel", source: "antenna-bridge", severity: "warning", details: { backendBridge: "missing" } }));

      setMetrics({
        throughput,
        latency,
        activeNodes: clamp(blockEvents + devicesDetected + 4, 0, 240),
        blockEvents,
        purchaseOrders,
        alerts: nextLogs.filter((entry) => entry.severity !== "ok").length,
        threatScore: clamp((defenderStatus === "ok" ? 8 : 42) + 18, 0, 100),
        devicesDetected,
        defenderStatus,
        sdrBridge: "unavailable",
      });

      if (nextLogs.length) {
        setLogs((current) => [...nextLogs.reverse(), ...current].slice(0, 200));
        if (!selectedLogId && nextLogs[0]) setSelectedLogId(nextLogs[0].id);
      }
    } catch (error) {
      appendLog(buildLog({ type: "ALERT", title: "Refresh impossible", payload: error?.message || "Erreur de rafraichissement", source: "engine", severity: "critical" }));
    }
  };

  useEffect(() => {
    refreshLiveData();
    const interval = setInterval(refreshLiveData, isLocalDevHost ? 8000 : 12000);
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
            <button onClick={refreshLiveData}><RefreshCw size={14} /> Rafraichir</button>
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

          {panel === "overview" && <div className="grid two"><MetricBox label="Debit" value={`${metrics.throughput} kbps`} icon={Activity} /><MetricBox label="Latence" value={`${metrics.latency} ms`} icon={Gauge} /><MetricBox label="Noeuds actifs" value={metrics.activeNodes} icon={Network} /><MetricBox label="Events chain" value={metrics.blockEvents} icon={Database} /><MetricBox label="Ordres banking" value={metrics.purchaseOrders} icon={Wallet} /><MetricBox label="Risque" value={`${metrics.threatScore}/100`} icon={Shield} /><div className="card"><h3>Etat du pont</h3><div className="tcv-list"><div className="tcv-list-item"><div><strong>Defender</strong><p>Source backend</p></div><span className={metrics.defenderStatus === "ok" ? "ok" : "warn"}>{metrics.defenderStatus}</span></div><div className="tcv-list-item"><div><strong>SDR live</strong><p>Backend materiel requis</p></div><span className="warn">{metrics.sdrBridge}</span></div><div className="tcv-list-item"><div><strong>Devices</strong><p>Detection navigateur</p></div><span className="ok">{metrics.devicesDetected}</span></div></div></div><div className="card"><h3>Distribution</h3><p className="muted">Le moteur publie un export local dans `mamo-stream-pro-export` et emet l'evenement `mamo-stream-pro:update` pour aider les autres interfaces MAMO cote client.</p></div></div>}

          {panel === "feed" && <div className="grid two" style={{ gridTemplateColumns: "minmax(0,1fr) 320px" }}><div className="card"><h3>Flux live</h3><div ref={feedRef} className="tcv-terminal">{filteredLogs.length ? filteredLogs.map((log) => <EventRow key={log.id} log={log} active={log.id === selectedLogId} onClick={() => setSelectedLogId(log.id)} />) : <div className="muted">Aucun log pour ce filtre.</div>}</div></div><div className="card"><h3>Details</h3>{selectedLog ? <div className="tcv-list"><KV label="Type" value={selectedLog.type} /><KV label="Source" value={selectedLog.source} /><KV label="Payload" value={selectedLog.payload} />{Object.entries(selectedLog.details || {}).map(([key, value]) => <KV key={key} label={key} value={String(value)} />)}</div> : <div className="muted">Aucun evenement selectionne.</div>}</div></div>}

          {panel === "scanner" && <div className="grid two"><div className="card"><h3>Scanner SDR</h3><p className="warn">Aucune route SDR materielle reelle n'est exposee dans le backend actuel. Ce panneau reflete honnetement l'etat du pont antenne.</p><div className="tcv-list"><div className="tcv-list-item"><div><strong>Bridge</strong><p>backend / antenna</p></div><span className="warn">{metrics.sdrBridge}</span></div><div className="tcv-list-item"><div><strong>Signal quality</strong><p>Disponible si pont live expose</p></div><span>{metrics.sdrBridge === "connected" ? "92%" : "0%"}</span></div></div></div><div className="card"><h3>Sources reelles raccordees</h3><div className="tcv-list"><div className="tcv-list-item"><div><strong>Wallet</strong><p>window.ethereum</p></div><span>{walletAddress ? "OK" : "OFF"}</span></div><div className="tcv-list-item"><div><strong>Defender</strong><p>/api/defender/ping</p></div><span>{metrics.defenderStatus}</span></div><div className="tcv-list-item"><div><strong>Web3 events</strong><p>/api/web3/events/mining</p></div><span>{metrics.blockEvents}</span></div></div></div></div>}

          {panel === "registry" && <div className="card"><h3>Registre local</h3><div className="table-wrap"><table className="bloomberg"><thead><tr><th>Cle</th><th>Source</th><th>Type</th><th>Horodatage</th><th>Checksum</th></tr></thead><tbody>{registryRows.map((row) => <tr key={row.key}><td>{row.key}</td><td>{row.source}</td><td>{row.type}</td><td>{row.stamp}</td><td>{row.checksum}</td></tr>)}</tbody></table></div></div>}

          {panel === "security" && <div className="grid two"><div className="card"><h3>Posture securite</h3><div className="tcv-list"><div className="tcv-list-item"><div><strong>Confidentialite</strong><p>Moteur prive, reserve a l'operateur</p></div><span className="ok">verrouille</span></div><div className="tcv-list-item"><div><strong>Threat score</strong><p>Agrege depuis Defender + disponibilite des ponts</p></div><span className={metrics.threatScore < 30 ? "ok" : "warn"}>{metrics.threatScore}/100</span></div><div className="tcv-list-item"><div><strong>Wallet</strong><p>Source bancaire et blockchain</p></div><span className={walletAddress ? "ok" : "warn"}>{walletAddress ? "lie" : "absent"}</span></div></div></div><div className="card"><h3>Actions</h3><div className="row" style={{ flexWrap: "wrap" }}><button onClick={refreshLiveData}><RefreshCw size={14} /> Sync sources</button><button onClick={exportJson}><Download size={14} /> Export</button></div></div></div>}

          {panel === "settings" && <div className="grid two"><div className="card"><h3>Reglages</h3><label>Nom de session<input value={sessionName} onChange={(e) => setSessionName(e.target.value)} /></label><div className="row" style={{ marginTop: 12 }}><button onClick={refreshLiveData}><RefreshCw size={14} /> Sync</button><button onClick={exportJson}><Download size={14} /> Export</button></div></div><div className="card"><h3>Stockage local</h3><p className="muted">Etat persiste dans localStorage et peut etre reexporte.</p><button onClick={() => { localStorage.removeItem(STORAGE_KEY); localStorage.removeItem("mamo-stream-pro-export"); setToast("Stockage local supprime. Recharge la page pour repartir a zero."); }}><Trash2 size={14} /> Supprimer le stockage local</button></div></div>}
        </main>
      </div>

      {toast ? <div className="tcv-toast info"><Bell size={16} /><span>{toast}</span></div> : null}
    </section>
  );
}


