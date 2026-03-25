import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Shield,
  Activity,
  AlertTriangle,
  Radio,
  Wallet,
  Cpu,
  HardDrive,
  Gauge,
  Database,
  TerminalSquare,
  Lock,
  Power,
  RefreshCw,
  Radar,
  Bell,
  Network,
  Binary,
  TimerReset,
  Wifi,
  Users,
  ScanLine,
  CheckCircle2,
  ChevronRight,
  Clock3,
  Zap,
} from "lucide-react";

const THREATS = [
  {
    id: "evt-001",
    level: "Eleve",
    source: "Gateway Externe",
    title: "Anomalie de signature EIP-191",
    detail: "Nonce reutilise detecte, transaction suspendue automatiquement.",
    time: "11:42:08",
    status: "Bloquee",
  },
  {
    id: "evt-002",
    level: "Moyen",
    source: "Spectre Local",
    title: "Emission inconnue proche du canal radio",
    detail: "Pattern proche d'un brouillage intermittent, niveau sous surveillance.",
    time: "11:41:26",
    status: "Surveillance",
  },
  {
    id: "evt-003",
    level: "Faible",
    source: "Core Runtime",
    title: "Pic inhabituel de requetes KYC",
    detail: "Le schema a ete isole, aucune propagation laterale observee.",
    time: "11:39:11",
    status: "Isolee",
  },
];

const SERVICES = [
  "Scanner Heuristique",
  "Quantum Wallet Shield",
  "Controle Spectral SDR",
  "Lockdown Engine",
  "Cloud Tunnel Watch",
  "Chef Signature Gate",
  "Base de logs securisee",
  "Canal WebSocket",
];

const AUDIT_SEED = [
  { id: "aud-001", time: "11:42:12", actor: "Chef Gate", action: "Validation signature", result: "Acceptee" },
  { id: "aud-002", time: "11:41:26", actor: "SDR Watch", action: "Scan spectral", result: "Signal suspect marque" },
  { id: "aud-003", time: "11:40:09", actor: "Wallet Shield", action: "Simulation transaction", result: "Contrat mis en quarantaine" },
  { id: "aud-004", time: "11:38:44", actor: "Runtime Guard", action: "Isolation pattern", result: "Propagation stoppee" },
];

const TABS = [
  { id: "overview", label: "Vue d'ensemble" },
  { id: "radar", label: "Radar" },
  { id: "wallet", label: "Quantum Bank" },
  { id: "sdr", label: "SDR" },
  { id: "audit", label: "Audit" },
  { id: "lockdown", label: "LOCKDOWN" },
];

const TELEMETRY = [
  { icon: Network, label: "Canaux actifs" },
  { icon: Binary, label: "Patterns inconnus" },
  { icon: Bell, label: "Alertes locales" },
  { icon: TimerReset, label: "Scan cyclique" },
  { icon: Wifi, label: "Reseaux proches" },
  { icon: Users, label: "Appareils suivis" },
];

function buildSignalHubUrl(api, userAddress) {
  const base = api("/api/platform/signal-hub");
  const params = new URLSearchParams({ logLimit: "10" });
  if (userAddress) params.set("walletAddress", userAddress);
  return `${base}?${params.toString()}`;
}

function formatHubTime(value) {
  if (!value) return "--:--:--";
  try {
    return new Date(value).toLocaleTimeString("fr-CA", { hour12: false });
  } catch {
    return String(value).slice(11, 19) || "--:--:--";
  }
}

function levelFromThreatScore(score) {
  if (score >= 50) return "Eleve";
  if (score >= 25) return "Moyen";
  return "Faible";
}

function StatusBadge({ text }) {
  const low = String(text || "").toLowerCase();
  const danger = low.includes("bloq") || low.includes("quarantaine") || low.includes("eleve");
  const warn = low.includes("moyen") || low.includes("surveillance") || low.includes("suspect");
  const ok = low.includes("accep") || low.includes("fiable") || low.includes("active") || low.includes("stoppee");
  const color = danger
    ? { border: "1px solid rgba(244,63,94,0.5)", background: "rgba(244,63,94,0.12)", color: "#fda4af" }
    : warn
      ? { border: "1px solid rgba(245,158,11,0.5)", background: "rgba(245,158,11,0.12)", color: "#fdba74" }
      : ok
        ? { border: "1px solid rgba(16,185,129,0.5)", background: "rgba(16,185,129,0.12)", color: "#86efac" }
        : { border: "1px solid rgba(56,189,248,0.5)", background: "rgba(56,189,248,0.12)", color: "#7dd3fc" };
  return (
    <span
      style={{
        ...color,
        borderRadius: 999,
        padding: "4px 9px",
        fontSize: 11,
        fontWeight: 600,
        display: "inline-flex",
        alignItems: "center",
      }}
    >
      {text}
    </span>
  );
}

function ProgressBar({ value }) {
  return (
    <div style={{ width: "100%", height: 8, borderRadius: 999, border: "1px solid rgba(56,133,170,0.45)", background: "rgba(15,23,42,0.9)", overflow: "hidden" }}>
      <div style={{ width: `${Math.max(0, Math.min(100, value))}%`, height: "100%", background: "linear-gradient(90deg,#06b6d4,#38bdf8)", transition: "width 320ms ease" }} />
    </div>
  );
}

function StatCard({ icon: Icon, title, value, hint }) {
  return (
    <div className="card">
      <div className="row" style={{ justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <p className="muted" style={{ margin: 0, textTransform: "uppercase", letterSpacing: "0.16em", fontSize: 11 }}>
            {title}
          </p>
          <h3 style={{ margin: "8px 0 4px", fontSize: 26 }}>{value}</h3>
          <p className="muted" style={{ margin: 0, fontSize: 12 }}>
            {hint}
          </p>
        </div>
        <div className="card" style={{ padding: 9 }}>
          <Icon size={16} />
        </div>
      </div>
    </div>
  );
}

export default function MamoDefenderPro({ api = (path) => path, authToken = "", userAddress = "" }) {
  const checkboxStyle = { flex: "0 0 auto", width: 18, height: 18, padding: 0, borderRadius: 4 };
  const [activeTab, setActiveTab] = useState("overview");
  const [selectedLevel, setSelectedLevel] = useState("Toutes");
  const [selectedTelemetry, setSelectedTelemetry] = useState("Canaux actifs");
  const [chefSignature, setChefSignature] = useState("0xMAMO-CHEF-SIGNATURE");
  const [zeroTrust, setZeroTrust] = useState(true);
  const [spectralWatch, setSpectralWatch] = useState(true);
  const [autoFreeze, setAutoFreeze] = useState(true);
  const [isSimMode, setIsSimMode] = useState(true);
  const [isLockdown, setIsLockdown] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastRefresh, setLastRefresh] = useState("11:42:12");
  const [auditTrail, setAuditTrail] = useState(AUDIT_SEED);
  const [load, setLoad] = useState({ cpu: 38, ram: 54, latency: 18, db: 92, ws: 97, disk: 71 });
  const [signalHub, setSignalHub] = useState(null);
  const [hubError, setHubError] = useState("");

  const chefVerified = chefSignature.trim().startsWith("0xMAMO") && chefSignature.trim().length >= 12;

  const fetchSignalHub = useCallback(async () => {
    try {
      const headers = {};
      if (authToken) headers.Authorization = `Bearer ${authToken}`;
      const response = await fetch(buildSignalHubUrl(api, userAddress), { headers });
      if (!response.ok) {
        throw new Error(`signal_hub_${response.status}`);
      }
      const payload = await response.json();
      setSignalHub(payload);
      setHubError("");
      setLastRefresh(new Date().toLocaleTimeString("fr-CA", { hour12: false }));
    } catch (error) {
      setHubError(String(error?.message || "signal_hub_unavailable"));
    }
  }, [api, authToken, userAddress]);

  useEffect(() => {
    const randomStep = (v, min, max, up = 4, down = 3) => Math.max(min, Math.min(max, v + (Math.random() > 0.5 ? up : -down)));
    const id = window.setInterval(() => {
      setLoad((prev) => ({
        cpu: randomStep(prev.cpu, 14, 94, 4, 3),
        ram: randomStep(prev.ram, 30, 91, 2, 2),
        latency: randomStep(prev.latency, 8, 55, 3, 2),
        db: randomStep(prev.db, 82, 100, 1, 1),
        ws: randomStep(prev.ws, 80, 100, 1, 1),
        disk: randomStep(prev.disk, 55, 93, 2, 1),
      }));
      setLastRefresh(new Date().toLocaleTimeString("fr-CA", { hour12: false }));
    }, 2200);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    fetchSignalHub();
    const intervalId = window.setInterval(() => {
      fetchSignalHub();
    }, 9000);
    return () => window.clearInterval(intervalId);
  }, [fetchSignalHub]);

  useEffect(() => {
    if (!signalHub) return;
    if (signalHub?.mesh?.available) setIsSimMode(false);

    const derivedAudit = (signalHub?.telecom?.meshFeed || []).slice(0, 6).map((entry, index) => ({
      id: `hub-audit-${index}-${entry.id || entry.time || index}`,
      time: entry.time || formatHubTime(entry.timestampUtc),
      actor: entry.author || "Mesh Hub",
      action: entry.text || "Evenement distribue",
      result: entry.severity === "critical" ? "Critique" : entry.severity === "warning" ? "Surveillance" : "Stable",
    }));

    setAuditTrail(derivedAudit.length ? derivedAudit : AUDIT_SEED);
  }, [signalHub]);

  const liveThreats = useMemo(() => {
    if (!signalHub) return THREATS;

    const snapshot = signalHub?.mesh?.snapshot;
    const distribution = signalHub?.distribution || {};
    const banking = signalHub?.banking || {};
    const defender = signalHub?.defender || {};
    const nextThreats = [];

    if (snapshot) {
      nextThreats.push({
        id: "mesh-link",
        level: snapshot.meshReady ? "Faible" : snapshot.lockAcquired ? "Moyen" : "Eleve",
        source: "Mesh Hub",
        title: snapshot.meshReady ? "Canal mesh verrouille" : snapshot.lockAcquired ? "Verrouillage partiel du mesh" : "Verrouillage mesh absent",
        detail: `SNR ${snapshot.snrDb} dB | offset ${snapshot.offsetMHz} MHz | ${snapshot.activePeakCount} pics actifs.`,
        time: formatHubTime(snapshot.timestampUtc),
        status: snapshot.quality || "searching",
      });
    }

    if (signalHub?.mesh?.error) {
      nextThreats.push({
        id: "mesh-error",
        level: "Eleve",
        source: "Mesh Service",
        title: "Erreur de distribution mesh",
        detail: signalHub.mesh.error,
        time: formatHubTime(signalHub.timestampUtc),
        status: "Degrade",
      });
    }

    if (defender.status && defender.status !== "ok") {
      nextThreats.push({
        id: "defender-status",
        level: "Moyen",
        source: "Mamora Defender",
        title: "Defender signale un etat degrade",
        detail: `Provider ${defender.provider || "Mamora Defender"} en mode ${defender.status}.`,
        time: formatHubTime(signalHub.timestampUtc),
        status: defender.status,
      });
    }

    if (userAddress && banking.available && !banking.authorized) {
      nextThreats.push({
        id: "banking-auth",
        level: "Faible",
        source: "Banking Relay",
        title: "Flux banking non autorise pour ce wallet",
        detail: `Le hub voit le wallet ${userAddress}, mais les ordres restent verrouilles tant que la session signee n'est pas valide.`,
        time: formatHubTime(signalHub.timestampUtc),
        status: banking.reason || "locked",
      });
    }

    if (distribution.threatScore >= 45) {
      nextThreats.push({
        id: "distribution-threat",
        level: levelFromThreatScore(distribution.threatScore),
        source: "Signal Hub",
        title: "Risque distribue eleve",
        detail: `Score ${distribution.threatScore}/100 sur les canaux ${Array.isArray(distribution.channels) ? distribution.channels.join(", ") : "mesh"}.`,
        time: formatHubTime(signalHub.timestampUtc),
        status: distribution.health || "watch",
      });
    }

    return nextThreats.length ? nextThreats : THREATS;
  }, [signalHub, userAddress]);

  const metrics = useMemo(() => {
    const threatScore = Number(signalHub?.distribution?.threatScore ?? 0);
    const meshSnapshot = signalHub?.mesh?.snapshot;
    const secureScore = isLockdown ? 99 : threatScore ? Math.max(8, 100 - threatScore) : zeroTrust && spectralWatch && autoFreeze ? 96 : 78;
    const walletRisk = isLockdown ? 4 : signalHub?.banking?.authorized ? Math.max(6, Math.round(threatScore * 0.45)) : chefVerified ? 18 : 33;
    const radioRisk = spectralWatch
      ? meshSnapshot
        ? Math.max(6, Math.min(95, 100 - Math.round(Number(meshSnapshot.snrDb || 0) * 7)))
        : isSimMode
          ? 18
          : 27
      : 51;
    const overall = isLockdown ? "NOIR" : threatScore >= 50 ? "ROUGE" : threatScore >= 25 ? "JAUNE" : "VERT";
    return { secureScore, walletRisk, radioRisk, overall };
  }, [autoFreeze, chefVerified, isLockdown, isSimMode, signalHub, spectralWatch, zeroTrust]);

  const filteredThreats = useMemo(() => {
    if (selectedLevel === "Toutes") return liveThreats;
    return liveThreats.filter((threat) => threat.level === selectedLevel);
  }, [liveThreats, selectedLevel]);

  const runRefresh = async () => {
    setIsRefreshing(true);
    await fetchSignalHub();
    window.setTimeout(() => setIsRefreshing(false), 500);
  };

  const rootStyle = {
    color: "#e8f2ff",
    background:
      "radial-gradient(900px 360px at 18% -10%, rgba(0, 238, 255, 0.14), transparent), radial-gradient(780px 340px at 86% 2%, rgba(188, 68, 255, 0.12), transparent), rgba(3, 10, 23, 0.72)",
    borderColor: "rgba(0, 238, 255, 0.55)",
  };

  return (
    <section className="panel glass neon" style={rootStyle}>
      <div className="card">
        <div className="row" style={{ flexWrap: "wrap", gap: 8 }}>
          <StatusBadge text="MAMO DEFENDER V4 PRO" />
          <StatusBadge text="Acces Chef uniquement" />
          <StatusBadge text={`Niveau ${metrics.overall}`} />
          {signalHub?.distribution?.health ? <StatusBadge text={`Hub ${signalHub.distribution.health}`} /> : null}
        </div>
        <h2 style={{ marginTop: 10 }}>Console defensive avancee pour la station MAMO</h2>
        <p className="muted">Validation Chef, telemetrie, audit, SDR et protocole LOCKDOWN centralises sur le signal hub distribue.</p>
        {hubError ? <p className="warn" style={{ marginTop: 8 }}>Hub: {hubError}</p> : null}
        <div className="row" style={{ flexWrap: "wrap" }}>
          <button className="row"><Shield size={14} /> Panneau Chef</button>
          <button className="row" onClick={() => setActiveTab("audit")}><TerminalSquare size={14} /> Logs vivants</button>
          <button className="row" onClick={runRefresh} disabled={isRefreshing}><RefreshCw size={14} className={isRefreshing ? "spin" : ""} /> {isRefreshing ? "Refresh..." : "Rafraichir"}</button>
          <button className="row" disabled={!chefVerified} onClick={() => setIsLockdown((v) => !v)} style={{ background: "linear-gradient(90deg,#fb7185,#f43f5e)", color: "#fff" }}><Lock size={14} /> {isLockdown ? "Lever LOCKDOWN" : "Declencher LOCKDOWN"}</button>
        </div>
      </div>

      <div className="grid two" style={{ gridTemplateColumns: "repeat(auto-fit,minmax(240px,1fr))", marginTop: 12 }}>
        <StatCard icon={Shield} title="Indice securite" value={`${metrics.secureScore}%`} hint={`Hub ${signalHub?.distribution?.health || "local"}`} />
        <StatCard icon={Wallet} title="Risque wallet" value={`${metrics.walletRisk}%`} hint={signalHub?.banking?.authorized ? "Flux banking autorise" : "Exposition replay/contract"} />
        <StatCard icon={Radio} title="Risque spectral" value={`${metrics.radioRisk}%`} hint={signalHub?.mesh?.snapshot ? `${signalHub.mesh.snapshot.targetFrequencyMHz} MHz | SNR ${signalHub.mesh.snapshot.snrDb} dB` : isSimMode ? "Mode simulation" : "Mode hardware"} />
        <StatCard icon={Cpu} title="CPU / RAM" value={`${load.cpu}% / ${load.ram}%`} hint={`Latence ${signalHub?.mesh?.snapshot?.scanDurationMs || load.latency}ms`} />
      </div>

      <div className="card" style={{ marginTop: 12 }}>
        <h3 style={{ marginBottom: 8 }}>Racine de confiance</h3>
        <label>
          Signature Chef
          <input value={chefSignature} onChange={(e) => setChefSignature(e.target.value)} />
        </label>
        <div className="row" style={{ justifyContent: "space-between", marginTop: 8 }}><span className="muted">Zero Trust</span><input style={checkboxStyle} type="checkbox" checked={zeroTrust} onChange={(e) => setZeroTrust(e.target.checked)} /></div>
        <div className="row" style={{ justifyContent: "space-between", marginTop: 8 }}><span className="muted">Surveillance SDR</span><input style={checkboxStyle} type="checkbox" checked={spectralWatch} onChange={(e) => setSpectralWatch(e.target.checked)} /></div>
        <div className="row" style={{ justifyContent: "space-between", marginTop: 8 }}><span className="muted">Gel auto economie</span><input style={checkboxStyle} type="checkbox" checked={autoFreeze} onChange={(e) => setAutoFreeze(e.target.checked)} /></div>
        <div className="row" style={{ justifyContent: "space-between", marginTop: 8 }}><span className="muted">Mode SDR materiel</span><input style={checkboxStyle} type="checkbox" checked={!isSimMode} onChange={(e) => setIsSimMode(!e.target.checked)} /></div>
        <p className={chefVerified ? "ok" : "warn"} style={{ marginTop: 10 }}>{chefVerified ? "Signature validee: actions sensibles autorisees." : "Signature non confirmee: fonctions Chef verrouillees."}</p>
      </div>

      <div className="row" style={{ flexWrap: "wrap", marginTop: 12 }}>
        {TABS.map((tab) => (
          <button key={tab.id} className={activeTab === tab.id ? "tab active" : "tab"} onClick={() => setActiveTab(tab.id)} style={{ fontSize: 11 }}>
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "overview" && (
        <div className="grid two" style={{ marginTop: 12 }}>
          <div className="card">
            <div className="row" style={{ justifyContent: "space-between" }}>
              <h3 style={{ margin: 0 }}>Flux de menaces</h3>
              <Activity size={16} />
            </div>
            <div className="row" style={{ margin: "10px 0", flexWrap: "wrap" }}>
              {["Toutes", "Faible", "Moyen", "Eleve"].map((level) => (
                <button key={level} onClick={() => setSelectedLevel(level)} style={{ padding: "6px 10px", fontSize: 11, borderRadius: 8, background: selectedLevel === level ? "rgba(6,182,212,0.2)" : "rgba(255,255,255,0.08)", color: "#e2f5ff" }}>{level}</button>
              ))}
            </div>
            {filteredThreats.map((t) => (
              <div key={t.id} className="card" style={{ marginBottom: 8 }}>
                <div className="row" style={{ justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div>
                    <div className="row" style={{ flexWrap: "wrap" }}><strong>{t.title}</strong><StatusBadge text={t.level} /><StatusBadge text={t.status} /></div>
                    <p className="muted" style={{ margin: "6px 0 0", fontSize: 13 }}>{t.detail}</p>
                  </div>
                  <div className="muted" style={{ fontSize: 11, textAlign: "right" }}><div>{t.source}</div><div>{t.time}</div></div>
                </div>
              </div>
            ))}
          </div>
          <div className="card">
            <h3>Etat des sous-systemes</h3>
            {SERVICES.map((name) => {
              const ok =
                name === "Cloud Tunnel Watch"
                  ? !isLockdown && signalHub?.defender?.status === "ok"
                  : name === "Chef Signature Gate"
                    ? chefVerified
                    : name === "Controle Spectral SDR"
                      ? spectralWatch && Boolean(signalHub?.mesh?.available)
                      : name === "Base de logs securisee"
                        ? Number(signalHub?.mesh?.logCount || 0) > 0
                        : true;
              return (
                <div key={name} className="row card" style={{ justifyContent: "space-between", marginBottom: 8 }}>
                  <span style={{ fontSize: 13 }}>{name}</span>
                  <span className={ok ? "ok" : "warn"} style={{ display: "inline-flex", gap: 6, fontSize: 12 }}>{ok ? <CheckCircle2 size={14} /> : <AlertTriangle size={14} />}{ok ? "Actif" : "Degrade"}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {activeTab === "radar" && (
        <div className="card" style={{ marginTop: 12 }}>
          <div className="row" style={{ justifyContent: "space-between" }}><h3 style={{ margin: 0 }}>Heuristique predictive multi-couches</h3><Radar size={16} /></div>
          <div style={{ marginTop: 10, minHeight: 260, borderRadius: 18, border: "1px solid rgba(56,189,248,0.28)", display: "grid", placeItems: "center", background: "radial-gradient(circle, rgba(34,211,238,0.15), transparent 55%), rgba(2,8,23,0.8)" }}>
            <Cpu size={36} />
          </div>
        </div>
      )}

      {activeTab === "wallet" && (
        <div className="card" style={{ marginTop: 12 }}>
          <h3>Pipeline de validation wallet</h3>
          {[
            "Reception de la requete de signature",
            "Verification nonce usage unique",
            "Simulation smart contract",
            "Analyse pattern drainer",
            "Decision Chef Gate / signature / blocage",
          ].map((s, i) => (
            <div key={s} className="row card" style={{ marginBottom: 8 }}>
              <div style={{ width: 30, height: 30, borderRadius: "50%", border: "1px solid rgba(56,189,248,0.45)", display: "grid", placeItems: "center", fontSize: 12 }}>{i + 1}</div>
              <div style={{ flex: 1, fontSize: 13 }}>{s}</div>
              <ChevronRight size={14} />
            </div>
          ))}
        </div>
      )}

      {activeTab === "sdr" && (
        <div className="grid two" style={{ marginTop: 12 }}>
          <div className="card">
            <div className="row" style={{ justifyContent: "space-between" }}><h3 style={{ margin: 0 }}>Waterfall SDR</h3><ScanLine size={16} /></div>
            <div style={{ marginTop: 10, display: "grid", gridTemplateColumns: "repeat(18,minmax(0,1fr))", gap: 4, height: 98, alignItems: "end" }}>
              {Array.from({ length: 18 }).map((_, i) => {
                const h = ((Math.sin(i * 0.8 + load.cpu / 14) + 1) / 2) * 80 + 10;
                return <div key={i} style={{ height: `${h}%`, borderRadius: "6px 6px 2px 2px", background: "linear-gradient(180deg,#7dd3fc,#0ea5e9,#1e3a8a)" }} />;
              })}
            </div>
            <p className="muted" style={{ marginTop: 8 }}>
              {signalHub?.mesh?.snapshot
                ? `Canal ${signalHub.mesh.snapshot.targetFrequencyMHz} MHz | qualite ${signalHub.mesh.snapshot.quality}`
                : isSimMode
                  ? "Mode simulation"
                  : "Mode hardware"}
            </p>
          </div>
          <div className="card">
            <h3>Telemetrie radio</h3>
            <div className="grid" style={{ gridTemplateColumns: "repeat(2,minmax(150px,1fr))" }}>
              {TELEMETRY.map((it) => (
                <button key={it.label} className="card" onClick={() => setSelectedTelemetry(it.label)} style={{ textAlign: "left", borderColor: selectedTelemetry === it.label ? "rgba(56,189,248,0.45)" : "rgba(255,255,255,0.15)" }}>
                  <it.icon size={16} />
                  <div style={{ marginTop: 6, fontWeight: 700 }}>{it.label}</div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === "audit" && (
        <div className="grid two" style={{ marginTop: 12 }}>
          <div className="card">
            <h3>Journal d'audit</h3>
            {auditTrail.map((a) => (
              <div key={a.id} className="card" style={{ marginBottom: 8 }}>
                <div className="row" style={{ justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div>
                    <div className="row" style={{ flexWrap: "wrap" }}><strong>{a.action}</strong><StatusBadge text={a.result} /></div>
                    <div className="muted" style={{ marginTop: 4, fontSize: 12 }}>{a.actor}</div>
                  </div>
                  <div className="muted" style={{ fontSize: 11 }}>{a.time}</div>
                </div>
              </div>
            ))}
          </div>
          <div className="card">
            <h3>Controle de traces</h3>
            <button className="row" style={{ width: "100%", justifyContent: "center", marginBottom: 8 }} disabled={!chefVerified}><Database size={14} /> Export JSON securise</button>
            <button className="row" style={{ width: "100%", justifyContent: "center", marginBottom: 8, background: "linear-gradient(90deg,#fb7185,#f43f5e)", color: "#fff" }} disabled={!chefVerified}><Zap size={14} /> Purge controlee des logs</button>
            <div className="card"><div className="row"><Clock3 size={14} /> Dernier refresh</div><div style={{ marginTop: 8, fontSize: 24, fontWeight: 700 }}>{lastRefresh}</div></div>
          </div>
        </div>
      )}

      {activeTab === "lockdown" && (
        <div className="card" style={{ marginTop: 12, borderColor: "rgba(244,63,94,0.35)" }}>
          <div className="row" style={{ justifyContent: "space-between" }}><h3 style={{ margin: 0 }}>Protocole LOCKDOWN</h3><Lock size={16} /></div>
          <p className="muted" style={{ marginTop: 8 }}>{isLockdown ? "Tunnel externe ferme, flux economiques geles, station locale active." : "Station connectee, prete a isoler en cas de breche."}</p>
          <button onClick={() => setIsLockdown((v) => !v)} disabled={!chefVerified} style={{ marginTop: 8, width: "100%", background: isLockdown ? "linear-gradient(90deg,#34d399,#10b981)" : "linear-gradient(90deg,#fb7185,#f43f5e)", color: isLockdown ? "#052114" : "#fff" }}>
            <Power size={14} style={{ marginRight: 6 }} />
            {isLockdown ? "Desactiver le protocole" : "Activer l'isolation totale"}
          </button>
        </div>
      )}
    </section>
  );
}
