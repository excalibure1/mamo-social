import { useEffect, useMemo, useRef, useState } from "react";
import {
  Activity,
  AlertTriangle,
  Archive,
  Bell,
  CheckCircle2,
  Cloud,
  Command,
  Cpu,
  Database,
  Download,
  Globe,
  HardDrive,
  Languages,
  Network,
  Radio,
  RefreshCw,
  Save,
  Search,
  Send,
  ShieldCheck,
  Terminal,
  User,
  Wallet,
  Wifi,
} from "lucide-react";

const STORAGE_KEY = "mamo_tcv_complete_v2";

const translations = {
  fr: {
    app: "MAMO tCV",
    subtitle: "Station decentralisee complete",
    online: "Reseau MAMO: En ligne",
    dashboard: "Tableau de bord",
    identity: "Identite numerique",
    wallet: "Wallet",
    network: "Reseau mesh",
    storage: "Stockage",
    telemetry: "Telemetrie SDR",
    logs: "Journal",
    settings: "Reglages",
    walletConnected: "Wallet connecte",
    walletDisconnected: "Wallet deconnecte",
    walletUnavailable: "Aucun wallet injecte detecte",
    connect: "Connecter wallet",
    refresh: "Rafraichir wallet",
    disconnect: "Deconnecter",
    sync: "Synchroniser",
    snapshot: "Creer snapshot",
    discover: "Decouvrir des pairs",
    save: "Sauvegarder",
    searchPlaceholder: "Rechercher dans les modules, pairs, logs...",
    commandPlaceholder: "Commande: help, scan, sync, snapshot, clear, wallet connect",
  },
  en: {
    app: "MAMO tCV",
    subtitle: "Complete decentralized station",
    online: "MAMO Network: Online",
    dashboard: "Dashboard",
    identity: "Digital identity",
    wallet: "Wallet",
    network: "Mesh network",
    storage: "Storage",
    telemetry: "SDR telemetry",
    logs: "Logs",
    settings: "Settings",
    walletConnected: "Wallet connected",
    walletDisconnected: "Wallet disconnected",
    walletUnavailable: "No injected wallet detected",
    connect: "Connect wallet",
    refresh: "Refresh wallet",
    disconnect: "Disconnect",
    sync: "Sync",
    snapshot: "Create snapshot",
    discover: "Discover peers",
    save: "Save",
    searchPlaceholder: "Search modules, peers, logs...",
    commandPlaceholder: "Command: help, scan, sync, snapshot, clear, wallet connect",
  },
};

const initialState = {
  locale: "fr",
  activeTab: "dashboard",
  profile: {
    name: "Capitaine Refractaire",
    role: "Architecte de systemes decentralises",
    did: "did:mamo:0xMAMO4A2F",
    wallet: "0xMAMO...4A2F",
    publicKey: "ed25519:8xDf7Yq...L9pZQrt5M2v",
    ipfsAnchor: "ipfs://bafybeic3mamo7snapshot",
  },
  wallet: {
    connected: false,
    address: "",
    balance: "--",
    chainId: "--",
    networkName: "Not connected",
    provider: "Injected EVM",
    lastSync: null,
  },
  metrics: {
    uptime: 99.94,
    activeNodes: 48,
    bandwidth: 182,
    storageUsed: 14.7,
    signal: -63,
    latency: 26,
    cpu: 31,
    memory: 44,
    temperature: 42,
  },
  sdr: {
    enabled: true,
    frequency: 433.92,
    modulation: "LoRa / FSK / GFSK",
    protocol: "MAMO Social RF v1.2",
    noiseFloor: -85,
    txrx: "RX/TX EN COURS",
  },
  projects: [
    { id: "qip-ygg", name: "QIP-YGG", desc: "Quantum Interdimensional Protocol", status: "Active", tech: "Rust / Libp2p" },
    { id: "mamo-os", name: "MAMO OS", desc: "Systeme d'exploitation decentralise", status: "Stable", tech: "C++ / Kernel" },
    { id: "sdr-social", name: "Mamo Social SDR", desc: "Reseau social radio securise", status: "Beta", tech: "Python / GNU Radio" },
    { id: "ipfs-vault", name: "Vault IPFS", desc: "Coffre distribue avec snapshots locaux", status: "Online", tech: "IPFS / AES" },
  ],
  peers: [
    { id: "peer-1", name: "Node Joliette-Alpha", region: "QC", status: "online", latency: 24, signal: -61, channel: "433.92 MHz", protocol: "MAMO-RF" },
    { id: "peer-2", name: "Node Montreal-Delta", region: "QC", status: "online", latency: 31, signal: -69, channel: "868.10 MHz", protocol: "Mesh/IPFS" },
  ],
  snapshots: [
    { id: "s1", cid: "bafybeid7snapshotmamo01", size: "1.2 MB", createdAt: new Date().toISOString() },
    { id: "s2", cid: "bafybeid7snapshotmamo00", size: "978 KB", createdAt: new Date(Date.now() - 3600 * 1000).toISOString() },
  ],
  alerts: [
    { id: "a1", level: "info", message: "Kernel MAMO initialise avec succes." },
    { id: "a2", level: "success", message: "Canal SDR 433.92 MHz synchronise." },
  ],
  notes: "Bloc-notes operateur pret.",
  logs: [],
};

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? { ...initialState, ...JSON.parse(raw) } : initialState;
  } catch {
    return initialState;
  }
}

function shortAddress(value = "") {
  if (!value) return "--";
  if (value.length < 12) return value;
  return `${value.slice(0, 6)}...${value.slice(-4)}`;
}

function formatWeiToEth(hexValue = "0x0") {
  try {
    const wei = BigInt(hexValue);
    const base = BigInt("1000000000000000000");
    const whole = wei / base;
    const fraction = (wei % base).toString().padStart(18, "0").slice(0, 4).replace(/0+$/, "");
    return `${whole.toString()}${fraction ? `.${fraction}` : ""} ETH`;
  } catch {
    return "--";
  }
}

function getChainName(chainId = "") {
  const networks = {
    "0x1": "Ethereum Mainnet",
    "0x89": "Polygon",
    "0xaa36a7": "Sepolia",
    "0x13882": "Polygon Amoy",
  };
  return networks[chainId] || (chainId ? `EVM ${chainId}` : "--");
}

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function generateCid() {
  return `bafybei${Math.random().toString(36).slice(2, 15)}${Date.now().toString(36)}`;
}

function TcvMiniStat({ icon: Icon, label, value }) {
  return (
    <div className="card tcv-mini-stat">
      <div className="tcv-mini-stat-label">
        <Icon size={14} />
        <span>{label}</span>
      </div>
      <div className="tcv-mini-stat-value">{value}</div>
    </div>
  );
}

export default function MamoTcvStation() {
  const [state, setState] = useState(loadState);
  const [search, setSearch] = useState("");
  const [commandInput, setCommandInput] = useState("");
  const [toast, setToast] = useState(null);
  const commandInputRef = useRef(null);
  const t = translations[state.locale] || translations.fr;

  const pushLog = (message, type = "info") => {
    setState((prev) => ({
      ...prev,
      logs: [{ id: `${Date.now()}-${Math.random()}`, message, type, createdAt: new Date().toISOString() }, ...prev.logs].slice(0, 120),
    }));
  };

  const pushAlert = (message, level = "info") => {
    setState((prev) => ({
      ...prev,
      alerts: [{ id: `${Date.now()}-${Math.random()}`, level, message }, ...prev.alerts].slice(0, 8),
    }));
    setToast({ message, level });
  };

  const refreshWallet = async (silent = false) => {
    try {
      const provider = window?.ethereum;
      if (!provider?.request) {
        if (!silent) pushAlert(t.walletUnavailable, "warning");
        return;
      }

      const accounts = await provider.request({ method: "eth_accounts" });
      const chainId = await provider.request({ method: "eth_chainId" });
      const address = accounts?.[0] || "";
      const balanceHex = address ? await provider.request({ method: "eth_getBalance", params: [address, "latest"] }) : "0x0";

      setState((prev) => ({
        ...prev,
        wallet: {
          ...prev.wallet,
          connected: Boolean(address),
          address,
          balance: address ? formatWeiToEth(balanceHex) : "--",
          chainId: chainId || "--",
          networkName: getChainName(chainId),
          provider: provider.isMetaMask ? "MetaMask" : "Injected EVM",
          lastSync: new Date().toISOString(),
        },
        profile: {
          ...prev.profile,
          wallet: address ? shortAddress(address) : prev.profile.wallet,
        },
      }));

      if (!silent) {
        pushLog(address ? `Wallet refreshed: ${address}` : "Wallet provider detected but no account is connected.", address ? "success" : "warning");
        pushAlert(address ? t.walletConnected : t.walletUnavailable, address ? "success" : "warning");
      }
    } catch (error) {
      pushLog(`Wallet refresh failed: ${error?.message || "unknown error"}`, "error");
      if (!silent) pushAlert("Erreur wallet.", "warning");
    }
  };

  const connectWallet = async () => {
    try {
      const provider = window?.ethereum;
      if (!provider?.request) {
        pushAlert(t.walletUnavailable, "warning");
        return;
      }
      await provider.request({ method: "eth_requestAccounts" });
      await refreshWallet(true);
      pushLog("Wallet connection requested successfully.", "success");
      pushAlert(t.walletConnected, "success");
    } catch (error) {
      pushLog(`Wallet connect failed: ${error?.message || "unknown error"}`, "error");
      pushAlert("Connexion wallet refusee ou annulee.", "warning");
    }
  };

  const disconnectWallet = () => {
    setState((prev) => ({
      ...prev,
      wallet: {
        ...prev.wallet,
        connected: false,
        address: "",
        balance: "--",
        chainId: "--",
        networkName: "Not connected",
        lastSync: new Date().toISOString(),
      },
    }));
    pushLog("Wallet disconnected locally from the interface.", "warning");
    pushAlert(t.walletDisconnected, "info");
  };

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  useEffect(() => {
    refreshWallet(true);
    const provider = window?.ethereum;
    if (!provider?.on) return;
    const handleAccountsChanged = () => refreshWallet(true);
    const handleChainChanged = () => refreshWallet(true);
    provider.on("accountsChanged", handleAccountsChanged);
    provider.on("chainChanged", handleChainChanged);
    return () => {
      provider.removeListener?.("accountsChanged", handleAccountsChanged);
      provider.removeListener?.("chainChanged", handleChainChanged);
    };
  }, []);

  useEffect(() => {
    if (!toast) return;
    const timeout = setTimeout(() => setToast(null), 2600);
    return () => clearTimeout(timeout);
  }, [toast]);

  useEffect(() => {
    const interval = setInterval(() => {
      setState((prev) => ({
        ...prev,
        metrics: {
          ...prev.metrics,
          activeNodes: Math.max(12, prev.metrics.activeNodes + randomInt(-1, 2)),
          bandwidth: Math.max(80, prev.metrics.bandwidth + randomInt(-8, 9)),
          signal: Math.min(-50, Math.max(-86, prev.metrics.signal + randomInt(-2, 2))),
          latency: Math.min(75, Math.max(15, prev.metrics.latency + randomInt(-2, 3))),
          cpu: Math.min(92, Math.max(19, prev.metrics.cpu + randomInt(-4, 5))),
          memory: Math.min(95, Math.max(22, prev.metrics.memory + randomInt(-3, 4))),
          temperature: Math.min(71, Math.max(34, prev.metrics.temperature + randomInt(-1, 2))),
          uptime: Number((99.9 + Math.random() * 0.09).toFixed(2)),
          storageUsed: Number(Math.max(4, prev.metrics.storageUsed + (Math.random() * 0.08 - 0.03)).toFixed(1)),
        },
      }));
    }, 2200);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const logInterval = setInterval(() => {
      const templates = [
        "Telemetry packet signed and appended to local journal.",
        "Peer heartbeat received from mesh node.",
        "Distributed cache warmed for latest profile snapshot.",
        "SDR channel health check completed.",
        "Encrypted vault checksum verified.",
      ];
      pushLog(templates[randomInt(0, templates.length - 1)], "info");
    }, 7000);
    return () => clearInterval(logInterval);
  }, []);

  const filteredLogs = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return state.logs;
    return state.logs.filter((item) => item.message.toLowerCase().includes(q));
  }, [state.logs, search]);

  const handleSync = () => {
    const cid = generateCid();
    setState((prev) => ({
      ...prev,
      profile: { ...prev.profile, ipfsAnchor: `ipfs://${cid}` },
      snapshots: [{ id: cid, cid, size: `${(0.7 + Math.random()).toFixed(1)} MB`, createdAt: new Date().toISOString() }, ...prev.snapshots].slice(0, 10),
    }));
    pushLog(`Network sync executed. New anchor created: ipfs://${cid}`, "success");
    pushAlert("Synchronisation reseau terminee.", "success");
  };

  const handleSnapshot = () => {
    const cid = generateCid();
    setState((prev) => ({
      ...prev,
      snapshots: [{ id: cid, cid, size: `${(0.5 + Math.random() * 1.3).toFixed(1)} MB`, createdAt: new Date().toISOString() }, ...prev.snapshots].slice(0, 12),
    }));
    pushLog(`Snapshot created and queued for distributed storage: ${cid}`, "success");
    pushAlert("Nouveau snapshot cree.", "success");
  };

  const handleDiscoverPeers = () => {
    const newPeer = {
      id: `peer-${Date.now()}`,
      name: `Node QC-${randomInt(100, 999)}`,
      region: "QC",
      status: Math.random() > 0.2 ? "online" : "warning",
      latency: randomInt(19, 67),
      signal: randomInt(-81, -54),
      channel: ["433.92 MHz", "868.10 MHz", "915.00 MHz"][randomInt(0, 2)],
      protocol: ["MAMO-RF", "Mesh/IPFS", "Fallback"][randomInt(0, 2)],
    };
    setState((prev) => ({ ...prev, peers: [newPeer, ...prev.peers].slice(0, 12) }));
    pushLog(`Peer discovery completed. Node added: ${newPeer.name}`, "success");
    pushAlert("Nouveau pair trouve.", "info");
  };

  const handleExport = () => {
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `mamo-tcv-state-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    pushLog("Local state exported to JSON.", "success");
  };

  const handleCommand = (raw) => {
    const input = raw.trim().toLowerCase();
    if (!input) return;
    if (input === "help") pushLog("Commands: help, scan, sync, snapshot, clear, wallet connect, wallet refresh, wallet disconnect", "info");
    else if (input === "scan") handleDiscoverPeers();
    else if (input === "sync") handleSync();
    else if (input === "snapshot") handleSnapshot();
    else if (input === "clear") setState((prev) => ({ ...prev, logs: [] }));
    else if (input === "wallet connect") connectWallet();
    else if (input === "wallet refresh") refreshWallet();
    else if (input === "wallet disconnect") disconnectWallet();
    else pushLog(`Unknown command: ${raw}`, "error");
    setCommandInput("");
  };

  const tabs = [
    { id: "dashboard", label: t.dashboard, icon: Activity },
    { id: "identity", label: t.identity, icon: User },
    { id: "wallet", label: t.wallet, icon: Wallet },
    { id: "network", label: t.network, icon: Network },
    { id: "storage", label: t.storage, icon: Database },
    { id: "telemetry", label: t.telemetry, icon: Radio },
    { id: "logs", label: t.logs, icon: Terminal },
    { id: "settings", label: t.settings, icon: ShieldCheck },
  ];

  return (
    <section className="panel glass neon tcv-shell">
      <div className="tcv-header">
        <div>
          <h2>{t.app}</h2>
          <p className="muted">{t.subtitle}</p>
        </div>
        <div className="tcv-header-actions">
          <span className="tcv-chip tcv-chip-green">
            <Wifi size={14} /> {t.online}
          </span>
          <button className="tcv-chip-button" onClick={() => setState((prev) => ({ ...prev, locale: prev.locale === "fr" ? "en" : "fr" }))}>
            <Languages size={14} />
          </button>
          <button className="tcv-chip-button" onClick={handleExport}>
            <Download size={14} />
          </button>
        </div>
      </div>

      <div className="tcv-toolbar">
        <div className="tcv-search">
          <Search size={16} />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder={t.searchPlaceholder} />
        </div>
        <div className="row">
          <button onClick={handleSync}>{t.sync}</button>
          <button onClick={handleSnapshot}>{t.snapshot}</button>
          <button onClick={handleDiscoverPeers}>{t.discover}</button>
        </div>
      </div>

      <div className="tcv-layout">
        <aside className="card tcv-sidebar">
          <div className="tcv-profile">
            <div className="tcv-avatar">
              <User size={18} />
            </div>
            <div>
              <div className="tcv-profile-name">{state.profile.name}</div>
              <div className="muted">{state.profile.role}</div>
            </div>
          </div>
          <div className="tcv-profile-meta">
            <div><span>DID</span><strong>{state.profile.did}</strong></div>
            <div><span>Wallet</span><strong>{state.profile.wallet}</strong></div>
          </div>
          <div className="tcv-nav">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  className={`tcv-nav-btn ${state.activeTab === tab.id ? "active" : ""}`}
                  onClick={() => setState((prev) => ({ ...prev, activeTab: tab.id }))}
                >
                  <span><Icon size={15} /> {tab.label}</span>
                </button>
              );
            })}
          </div>
        </aside>

        <div className="tcv-content">
          {state.activeTab === "dashboard" && (
            <div className="grid two">
              <div className="card">
                <h3>Station Overview</h3>
                <div className="grid two">
                  <TcvMiniStat icon={Network} label="Active nodes" value={state.metrics.activeNodes} />
                  <TcvMiniStat icon={ShieldCheck} label="Uptime" value={`${state.metrics.uptime}%`} />
                  <TcvMiniStat icon={Wifi} label="Bandwidth" value={`${state.metrics.bandwidth} Mb/s`} />
                  <TcvMiniStat icon={Radio} label="Signal" value={`${state.metrics.signal} dBm`} />
                </div>
                <div className="row" style={{ marginTop: 12 }}>
                  <button onClick={() => setState((prev) => ({ ...prev, activeTab: "wallet" }))}><Wallet size={14} /> Wallet</button>
                  <button onClick={() => setState((prev) => ({ ...prev, activeTab: "telemetry" }))}><Radio size={14} /> SDR</button>
                  <button onClick={() => commandInputRef.current?.focus()}><Command size={14} /> Shell</button>
                </div>
              </div>

              <div className="card">
                <h3>Modules & Projets</h3>
                <div className="tcv-list">
                  {state.projects.map((project) => (
                    <div key={project.id} className="tcv-list-item">
                      <div>
                        <strong>{project.name}</strong>
                        <p>{project.desc}</p>
                      </div>
                      <span className="tcv-chip">{project.status}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="card">
                <h3>Journal operateur</h3>
                <textarea
                  value={state.notes}
                  onChange={(e) => setState((prev) => ({ ...prev, notes: e.target.value }))}
                  className="tcv-textarea"
                />
                <div className="row" style={{ marginTop: 12 }}>
                  <button onClick={() => setToast({ message: t.save, level: "success" })}><Save size={14} /> {t.save}</button>
                </div>
              </div>

              <div className="card">
                <h3>MAMO shell</h3>
                <div className="tcv-terminal">
                  {(state.logs.slice(0, 8) || []).map((log) => (
                    <div key={log.id} className={`tcv-log ${log.type}`}>
                      <span>[{new Date(log.createdAt).toLocaleTimeString()}]</span>
                      <span>{log.message}</span>
                    </div>
                  ))}
                </div>
                <div className="row" style={{ marginTop: 12 }}>
                  <input
                    ref={commandInputRef}
                    value={commandInput}
                    onChange={(e) => setCommandInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleCommand(commandInput)}
                    placeholder={t.commandPlaceholder}
                  />
                  <button onClick={() => handleCommand(commandInput)}><Send size={14} /></button>
                </div>
              </div>
            </div>
          )}

          {state.activeTab === "identity" && (
            <div className="grid two">
              <div className="card"><h3>DID</h3><p>{state.profile.did}</p></div>
              <div className="card"><h3>Public key</h3><p>{state.profile.publicKey}</p></div>
              <div className="card"><h3>Wallet</h3><p>{state.profile.wallet}</p></div>
              <div className="card"><h3>IPFS Anchor</h3><p>{state.profile.ipfsAnchor}</p></div>
            </div>
          )}

          {state.activeTab === "wallet" && (
            <div className="grid two">
              <div className="card">
                <h3>Wallet Access</h3>
                <p className="muted">MetaMask ou wallet EVM injecte.</p>
                <div className="grid two">
                  <TcvMiniStat icon={Wallet} label="Address" value={state.wallet.address || "--"} />
                  <TcvMiniStat icon={Globe} label="Network" value={state.wallet.networkName} />
                  <TcvMiniStat icon={RefreshCw} label="Balance" value={state.wallet.balance} />
                  <TcvMiniStat icon={CheckCircle2} label="Status" value={state.wallet.connected ? t.walletConnected : t.walletDisconnected} />
                </div>
                <div className="row" style={{ marginTop: 12 }}>
                  <button onClick={connectWallet}>{t.connect}</button>
                  <button onClick={() => refreshWallet()}>{t.refresh}</button>
                  <button onClick={disconnectWallet}>{t.disconnect}</button>
                </div>
              </div>
              <div className="card">
                <h3>Quick Summary</h3>
                <div className="tcv-wallet-box">
                  <div className="tcv-wallet-summary">{state.wallet.connected ? shortAddress(state.wallet.address) : "--"}</div>
                  <p>{state.wallet.connected ? t.walletConnected : t.walletUnavailable}</p>
                </div>
              </div>
            </div>
          )}

          {state.activeTab === "network" && (
            <div className="grid two">
              <div className="card">
                <h3>Discovered peers</h3>
                <div className="tcv-list">
                  {state.peers.map((peer) => (
                    <div key={peer.id} className="tcv-list-item">
                      <div>
                        <strong>{peer.name}</strong>
                        <p>{peer.channel} · {peer.protocol} · {peer.region}</p>
                      </div>
                      <span className={`tcv-chip ${peer.status === "online" ? "tcv-chip-green" : "tcv-chip-amber"}`}>{peer.status}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="card">
                <h3>Mesh Indicators</h3>
                <div className="grid two">
                  <TcvMiniStat icon={Network} label="Latency" value={`${state.metrics.latency} ms`} />
                  <TcvMiniStat icon={Radio} label="Signal" value={`${state.metrics.signal} dBm`} />
                  <TcvMiniStat icon={Cloud} label="Routing" value="Mesh + Cache" />
                  <TcvMiniStat icon={Bell} label="Alerts" value={state.alerts.length} />
                </div>
              </div>
            </div>
          )}

          {state.activeTab === "storage" && (
            <div className="grid two">
              <div className="card">
                <h3>Snapshots</h3>
                <div className="tcv-list">
                  {state.snapshots.map((snapshot) => (
                    <div key={snapshot.id} className="tcv-list-item">
                      <div>
                        <strong>ipfs://{snapshot.cid}</strong>
                        <p>{new Date(snapshot.createdAt).toLocaleString()}</p>
                      </div>
                      <span className="tcv-chip">{snapshot.size}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="card">
                <h3>Storage Summary</h3>
                <div className="grid two">
                  <TcvMiniStat icon={HardDrive} label="Used" value={`${state.metrics.storageUsed} GB`} />
                  <TcvMiniStat icon={Archive} label="Anchors" value={state.snapshots.length} />
                  <TcvMiniStat icon={Database} label="Mode" value="Incremental" />
                  <TcvMiniStat icon={Download} label="Export" value="JSON ready" />
                </div>
              </div>
            </div>
          )}

          {state.activeTab === "telemetry" && (
            <div className="grid two">
              <div className="card">
                <h3>SDR Telemetry</h3>
                <div className="tcv-waterfall">
                  {Array.from({ length: 42 }).map((_, idx) => (
                    <span key={idx} style={{ left: `${(idx * 7) % 100}%`, width: `${20 + ((idx * 3) % 24)}%`, opacity: 0.15 + (idx % 6) * 0.1 }} />
                  ))}
                </div>
                <div className="grid two" style={{ marginTop: 12 }}>
                  <TcvMiniStat icon={Radio} label="Frequency" value={`${state.sdr.frequency.toFixed(2)} MHz`} />
                  <TcvMiniStat icon={Activity} label="Noise floor" value={`${state.sdr.noiseFloor} dBm`} />
                  <TcvMiniStat icon={Cpu} label="Protocol" value={state.sdr.protocol} />
                  <TcvMiniStat icon={ShieldCheck} label="Status" value={state.sdr.txrx} />
                </div>
              </div>
              <div className="card">
                <h3>Controls</h3>
                <div className="tcv-stack">
                  <button onClick={() => setState((prev) => ({ ...prev, sdr: { ...prev.sdr, enabled: !prev.sdr.enabled } }))}>
                    {state.sdr.enabled ? "Disable SDR" : "Enable SDR"}
                  </button>
                  <button onClick={() => setState((prev) => ({ ...prev, sdr: { ...prev.sdr, frequency: Number((prev.sdr.frequency + 0.18).toFixed(2)) } }))}>
                    Shift frequency +0.18 MHz
                  </button>
                  <button onClick={() => setState((prev) => ({ ...prev, sdr: { ...prev.sdr, noiseFloor: prev.sdr.noiseFloor - 1 } }))}>
                    Recalibrate noise floor
                  </button>
                </div>
              </div>
            </div>
          )}

          {state.activeTab === "logs" && (
            <div className="card">
              <h3>Persistent live journal</h3>
              <div className="tcv-terminal">
                {filteredLogs.length === 0 ? <div className="muted">No logs yet.</div> : filteredLogs.map((log) => (
                  <div key={log.id} className={`tcv-log ${log.type}`}>
                    <span>[{new Date(log.createdAt).toLocaleTimeString()}]</span>
                    <span>{log.message}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {state.activeTab === "settings" && (
            <div className="grid two">
              <div className="card">
                <h3>Station settings</h3>
                <div className="tcv-list">
                  <div className="tcv-list-item">
                    <div><strong>Language</strong><p>FR / EN</p></div>
                    <button onClick={() => setState((prev) => ({ ...prev, locale: prev.locale === "fr" ? "en" : "fr" }))}>{state.locale.toUpperCase()}</button>
                  </div>
                  <div className="tcv-list-item">
                    <div><strong>Reset local state</strong><p>Reinitialiser la station locale</p></div>
                    <button
                      onClick={() => {
                        localStorage.removeItem(STORAGE_KEY);
                        setState(initialState);
                        pushAlert("Etat local reinitialise.", "warning");
                      }}
                    >
                      Reset
                    </button>
                  </div>
                </div>
              </div>
              <div className="card">
                <h3>Alerts bus</h3>
                <div className="tcv-list">
                  {state.alerts.map((alert) => (
                    <div key={alert.id} className="tcv-list-item">
                      <div>
                        <strong>{alert.level}</strong>
                        <p>{alert.message}</p>
                      </div>
                      <span className={`tcv-chip ${alert.level === "success" ? "tcv-chip-green" : alert.level === "warning" ? "tcv-chip-amber" : ""}`}>{alert.level}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {toast ? (
        <div className={`tcv-toast ${toast.level}`}>
          {toast.level === "success" ? <CheckCircle2 size={16} /> : toast.level === "warning" ? <AlertTriangle size={16} /> : <Bell size={16} />}
          <span>{toast.message}</span>
        </div>
      ) : null}
    </section>
  );
}
