import { useEffect, useMemo, useRef, useState } from "react";
import {
  Activity,
  AlertTriangle,
  Brain,
  CheckCircle2,
  Gauge,
  Heart,
  Moon,
  RefreshCw,
  Shield,
  Sparkles,
  Sun,
  Timer,
  Waves,
  Zap,
} from "lucide-react";

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

function ProgressBar({ label, value, color = "linear-gradient(90deg,#06b6d4,#6366f1)" }) {
  return (
    <div style={{ display: "grid", gap: 6 }}>
      <div className="row" style={{ justifyContent: "space-between" }}>
        <span className="muted" style={{ fontSize: 12 }}>
          {label}
        </span>
        <span style={{ fontSize: 12, color: "#c7f4ff" }}>{value}%</span>
      </div>
      <div style={{ height: 10, borderRadius: 999, overflow: "hidden", border: "1px solid rgba(56,133,170,0.45)", background: "rgba(2,8,20,0.88)" }}>
        <div style={{ width: `${value}%`, height: "100%", background: color, transition: "width 360ms ease" }} />
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, color = "#67e8f9" }) {
  return (
    <div className="card" style={{ background: "rgba(15,23,42,0.6)", borderColor: "rgba(71,85,105,0.5)" }}>
      <div className="row" style={{ justifyContent: "space-between" }}>
        <p className="muted" style={{ margin: 0, fontSize: 10, textTransform: "uppercase", letterSpacing: "0.18em" }}>
          {label}
        </p>
        <Icon size={16} color={color} />
      </div>
      <p style={{ margin: "8px 0 0", fontSize: 24, fontWeight: 700, color }}>{value}</p>
    </div>
  );
}

function SectionCard({ title, subtitle, icon: Icon, children }) {
  return (
    <section className="card" style={{ borderRadius: 22, padding: 18, background: "rgba(8,15,30,0.8)", borderColor: "rgba(51,65,85,0.7)" }}>
      <div style={{ marginBottom: 14 }}>
        <div className="row" style={{ gap: 8 }}>
          {Icon ? <Icon size={18} color="#22d3ee" /> : null}
          <h3 style={{ margin: 0 }}>{title}</h3>
        </div>
        {subtitle ? (
          <p className="muted" style={{ margin: "6px 0 0", fontSize: 13 }}>
            {subtitle}
          </p>
        ) : null}
      </div>
      {children}
    </section>
  );
}

export default function SimqModule() {
  const canvasRef = useRef(null);
  const rafRef = useRef(0);
  const finishedRef = useRef(false);

  const [step, setStep] = useState("welcome");
  const [panel, setPanel] = useState("overview");
  const [name, setName] = useState("");
  const [ageRange, setAgeRange] = useState("18-30");
  const [mood, setMood] = useState(50);
  const [energyLevel, setEnergyLevel] = useState(55);
  const [stressLevel, setStressLevel] = useState(35);
  const [sleepHours, setSleepHours] = useState(7);
  const [manualBpm, setManualBpm] = useState(72);
  const [breathingRate, setBreathingRate] = useState(6);
  const [scanProgress, setScanProgress] = useState(0);
  const [results, setResults] = useState(null);

  const statusLabel = useMemo(() => {
    if (stressLevel >= 75) return "Charge elevee";
    if (energyLevel >= 75) return "Pic d'energie";
    if (mood >= 70) return "Etat stable";
    return "Analyse adaptive";
  }, [stressLevel, energyLevel, mood]);

  const buildResults = () => {
    const coherence = clamp(Math.round(100 - stressLevel * 0.6 + mood * 0.25), 42, 99);
    const recovery = clamp(Math.round(100 - stressLevel * 0.7 + sleepHours * 4), 35, 98);
    const vitality = clamp(Math.round(energyLevel * 0.7 + mood * 0.25 + sleepHours * 2.5), 40, 99);
    const focus = clamp(Math.round(50 + mood * 0.3 + sleepHours * 3 - stressLevel * 0.35), 35, 98);
    const hrv = clamp(Math.round(90 - stressLevel * 0.55 + breathingRate * 3), 30, 98);
    const sync = clamp(Math.round(70 + breathingRate * 3 - stressLevel * 0.2), 40, 99);
    const resonance = clamp(Math.round((coherence + vitality + sync) / 3), 45, 99);
    const cardiacLoad = clamp(Math.round(manualBpm * 0.9 + stressLevel * 0.4 - sleepHours * 3), 20, 99);
    const oxygen = clamp(Math.round(96 + sleepHours * 0.2 - stressLevel * 0.03), 92, 100);
    const bodyTemp = (36.3 + (energyLevel - 50) * 0.004 + 0.12).toFixed(1);
    const frequency = (430 + mood * 0.35 + breathingRate * 1.8 + (manualBpm - 70) * 0.25).toFixed(2);

    const alerts = [
      manualBpm > 110 ? "BPM declare eleve pour un etat de repos." : null,
      stressLevel > 80 ? "Charge de stress importante detectee dans les entrees." : null,
      oxygen < 94 ? "Saturation simulee basse: verifier avec un vrai appareil si besoin." : null,
    ].filter(Boolean);

    const recommendations = [
      stressLevel > 60 ? "Activer le mode respiration 4-4-6 pendant 2 minutes." : "Hydratation legere et pause ecran recommandees.",
      manualBpm > 95 ? "Rester assis et refaire une lecture manuelle du pouls apres repos." : "Le rythme actuel est compatible avec un mode de retour au calme.",
      sleepHours < 6 ? "Prevoir une fenetre de recuperation plus tot ce soir." : "Le sommeil soutient bien la recuperation globale.",
      breathingRate < 5 || breathingRate > 8
        ? "Regler la respiration guidee autour de 6 cycles/minute."
        : "Journal d'etat: noter energie, respiration et BPM pour comparer les tendances.",
    ];

    return {
      coherence,
      recovery,
      vitality,
      focus,
      hrv,
      sync,
      resonance,
      cardiacLoad,
      oxygen,
      bodyTemp,
      frequency,
      alerts,
      recommendations,
      timeline: [
        { label: "Repos", value: clamp(65 + sleepHours * 3 - stressLevel * 0.3, 30, 98) },
        { label: "Presence", value: clamp(55 + mood * 0.35, 25, 99) },
        { label: "Impulsion", value: clamp(40 + energyLevel * 0.5 - stressLevel * 0.15, 20, 98) },
      ],
    };
  };

  useEffect(() => {
    if (step !== "scanning") return undefined;
    const canvas = canvasRef.current;
    if (!canvas) return undefined;
    const ctx = canvas.getContext("2d");
    if (!ctx) return undefined;

    const startedAt = performance.now();
    const duration = 6200;
    finishedRef.current = false;

    const draw = (now) => {
      const width = canvas.clientWidth || 900;
      const height = canvas.clientHeight || 240;
      const dpr = window.devicePixelRatio || 1;
      const elapsed = now - startedAt;
      const progress = clamp((elapsed / duration) * 100, 0, 100);
      const t = elapsed / 1000;

      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, width, height);

      const gradient = ctx.createLinearGradient(0, 0, width, 0);
      gradient.addColorStop(0, "#06b6d4");
      gradient.addColorStop(0.5, "#6366f1");
      gradient.addColorStop(1, "#a855f7");

      ctx.beginPath();
      ctx.lineWidth = 3;
      ctx.strokeStyle = gradient;
      for (let x = 0; x < width; x += 1) {
        const y =
          height / 2 +
          Math.sin(x * 0.03 + t * 4) * (12 + mood * 0.08) +
          Math.cos(x * 0.015 + t * 2.5) * (10 + energyLevel * 0.05) +
          Math.sin(x * 0.045 + t * 6) * (manualBpm / 18);
        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();

      ctx.fillStyle = "rgba(255,255,255,0.8)";
      ctx.font = '600 14px "Fira Code", monospace';
      ctx.fillText(`Profil: ${name || "utilisateur"}`, 18, 26);
      ctx.fillText(`Respiration: ${breathingRate}/min`, 18, 48);
      ctx.fillText(`Pouls declare: ${manualBpm} BPM`, 18, 70);

      setScanProgress(Math.floor(progress));

      if (progress >= 100) {
        if (!finishedRef.current) {
          finishedRef.current = true;
          setResults(buildResults());
          setPanel("overview");
          setStep("results");
        }
        return;
      }

      rafRef.current = window.requestAnimationFrame(draw);
    };

    rafRef.current = window.requestAnimationFrame(draw);
    return () => window.cancelAnimationFrame(rafRef.current);
  }, [step, mood, energyLevel, manualBpm, breathingRate, name]);

  const startScan = (event) => {
    event.preventDefault();
    if (!name.trim()) return;
    setScanProgress(0);
    setResults(null);
    setStep("scanning");
  };

  const reset = () => {
    setStep("welcome");
    setPanel("overview");
    setScanProgress(0);
    setResults(null);
    window.cancelAnimationFrame(rafRef.current);
  };

  const navButton = (active) => ({
    width: "100%",
    display: "flex",
    alignItems: "center",
    gap: 10,
    padding: "12px 14px",
    borderRadius: 16,
    border: active ? "1px solid rgba(34,211,238,0.4)" : "1px solid rgba(71,85,105,0.45)",
    background: active ? "rgba(6,182,212,0.12)" : "rgba(15,23,42,0.35)",
    color: active ? "#67e8f9" : "#cbd5e1",
    fontWeight: 600,
  });

  return (
    <section className="panel glass neon" style={{ padding: 0, overflow: "hidden", background: "radial-gradient(900px 360px at 16% -12%, rgba(6,182,212,0.16), transparent), radial-gradient(720px 340px at 88% 2%, rgba(192,38,211,0.14), transparent), rgba(3,8,20,0.78)" }}>
      <div style={{ display: "grid", gridTemplateColumns: "320px minmax(0,1fr)", minHeight: 820 }}>
        <aside style={{ borderRight: "1px solid rgba(51,65,85,0.75)", background: "rgba(8,15,30,0.75)", padding: 24 }}>
          <div className="row" style={{ gap: 12, marginBottom: 18 }}>
            <div style={{ width: 56, height: 56, borderRadius: 18, background: "rgba(6,182,212,0.1)", border: "1px solid rgba(34,211,238,0.2)", display: "grid", placeItems: "center" }}>
              <Heart size={28} color="#22d3ee" />
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: 22 }}>SIMQ Scan Pro</h2>
              <p className="muted" style={{ margin: "4px 0 0", fontSize: 13 }}>
                Console bio-rythmique avancee
              </p>
            </div>
          </div>

          <div className="card" style={{ marginBottom: 14 }}>
            <p className="muted" style={{ margin: 0, fontSize: 10, textTransform: "uppercase", letterSpacing: "0.2em" }}>
              Statut noyau
            </p>
            <div className="row" style={{ justifyContent: "space-between", marginTop: 10 }}>
              <span>{statusLabel}</span>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 6, borderRadius: 999, padding: "5px 10px", border: "1px solid rgba(34,197,94,0.25)", background: "rgba(34,197,94,0.12)", color: "#86efac", fontSize: 12 }}>
                <Shield size={14} /> Actif
              </span>
            </div>
          </div>

          <div className="grid two" style={{ gridTemplateColumns: "1fr 1fr", marginBottom: 14 }}>
            <StatCard icon={Timer} label="Respiration" value={`${breathingRate}/min`} color="#22d3ee" />
            <StatCard icon={Heart} label="Pouls declare" value={`${manualBpm} BPM`} color="#fb7185" />
          </div>

          <div style={{ display: "grid", gap: 10 }}>
            {[
              ["welcome", "Accueil", Sparkles],
              ["form", "Parametres", Gauge],
              ["scanning", "Scan", Waves],
              ["results", "Resultats", Activity],
            ].map(([key, label, Icon]) => (
              <button key={key} type="button" onClick={() => (key === "results" && !results ? null : setStep(key))} style={navButton(step === key)}>
                <Icon size={16} />
                <span>{label}</span>
              </button>
            ))}
          </div>

          <div className="card" style={{ marginTop: 18, borderColor: "rgba(245,158,11,0.25)", background: "rgba(245,158,11,0.08)" }}>
            <div className="row" style={{ alignItems: "flex-start" }}>
              <AlertTriangle size={16} color="#fbbf24" style={{ marginTop: 2 }} />
              <p style={{ margin: 0, fontSize: 13, lineHeight: 1.55 }}>
                Module bien-etre uniquement. Les valeurs cardiaques ici sont basees sur des entrees manuelles, pas sur un vrai capteur medical.
              </p>
            </div>
          </div>
        </aside>

        <main style={{ padding: 26, display: "grid", gap: 18 }}>
          {step === "welcome" && (
            <div className="grid two" style={{ gridTemplateColumns: "1.15fr 0.85fr" }}>
              <SectionCard title="Station complete de scan personnel" icon={Sparkles} subtitle="Version avec pouls manuel, respiration guidee et synthese de recuperation.">
                <p className="muted" style={{ lineHeight: 1.65 }}>
                  Cette version ajoute un module de pouls manuel, un score de coherence cardiaque, une estimation de recuperation et un tableau de bord plus complet.
                </p>
                <div className="grid two" style={{ gridTemplateColumns: "repeat(3,minmax(0,1fr))", marginTop: 14 }}>
                  <StatCard icon={Heart} label="Scan cardiaque" value="Manuel + score" color="#fb7185" />
                  <StatCard icon={Brain} label="Stress / focus" value="Analyse mixte" color="#a78bfa" />
                  <StatCard icon={Timer} label="Recuperation" value="Sommeil + souffle" color="#86efac" />
                </div>
                <div style={{ marginTop: 14 }}>
                  <button type="button" className="row" style={{ padding: "12px 16px", borderRadius: 16 }} onClick={() => setStep("form")}>
                    Demarrer la configuration <Sparkles size={16} />
                  </button>
                </div>
              </SectionCard>

              <SectionCard title="Modules ajoutes" icon={Zap} subtitle="Blocs actifs dans l'onglet SIMQ">
                <div style={{ display: "grid", gap: 10 }}>
                  {[
                    "Frequence cardiaque declaree (BPM)",
                    "Respiration guidee et synchronisation souffle-coeur",
                    "Indice de charge cardiaque",
                    "Recuperation liee au sommeil",
                    "Temperature et oxygene simules a titre visuel",
                    "Alertes douces selon les entrees",
                  ].map((item) => (
                    <div key={item} className="card" style={{ background: "rgba(15,23,42,0.5)", borderColor: "rgba(71,85,105,0.45)" }}>
                      <div className="row" style={{ alignItems: "flex-start" }}>
                        <CheckCircle2 size={16} color="#4ade80" style={{ marginTop: 2 }} />
                        <span style={{ fontSize: 13, lineHeight: 1.5 }}>{item}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </SectionCard>
            </div>
          )}

          {step === "form" && (
            <form className="grid two" style={{ gridTemplateColumns: "1fr 0.95fr" }} onSubmit={startScan}>
              <SectionCard title="Parametres du scan" icon={Gauge} subtitle="Renseigne les indicateurs de depart avant l'analyse.">
                <div style={{ display: "grid", gap: 16 }}>
                  <label>
                    Nom / identifiant
                    <input value={name} onChange={(event) => setName(event.target.value)} placeholder="Tommy / operateur / invite" required />
                  </label>

                  <label>
                    Tranche d'age
                    <select value={ageRange} onChange={(event) => setAgeRange(event.target.value)}>
                      <option>13-17</option>
                      <option>18-30</option>
                      <option>31-45</option>
                      <option>46-60</option>
                      <option>61+</option>
                    </select>
                  </label>

                  <div className="grid two">
                    <label>
                      Sommeil (heures)
                      <input type="number" min="0" max="12" step="0.5" value={sleepHours} onChange={(event) => setSleepHours(Number(event.target.value))} />
                    </label>
                    <label>
                      Pouls declare (BPM)
                      <input type="number" min="40" max="180" value={manualBpm} onChange={(event) => setManualBpm(Number(event.target.value))} />
                    </label>
                  </div>

                  {[
                    ["Etat general", mood, setMood, 0, 100],
                    ["Niveau d'energie", energyLevel, setEnergyLevel, 0, 100],
                    ["Niveau de stress", stressLevel, setStressLevel, 0, 100],
                    ["Respiration (cycles/min)", breathingRate, setBreathingRate, 4, 10],
                  ].map(([label, value, setter, min, max]) => (
                    <div key={label}>
                      <div className="row" style={{ justifyContent: "space-between" }}>
                        <label style={{ margin: 0 }}>{label}</label>
                        <span style={{ fontSize: 12, color: "#67e8f9" }}>{value}</span>
                      </div>
                      <input type="range" min={min} max={max} value={value} onChange={(event) => setter(Number(event.target.value))} />
                    </div>
                  ))}

                  <button type="submit" className="row" style={{ justifyContent: "center", padding: "12px 16px", borderRadius: 16 }}>
                    Lancer le scan complet <Activity size={16} />
                  </button>
                </div>
              </SectionCard>

              <SectionCard title="Previsualisation des options" icon={Waves} subtitle="Modules actifs dans ce scan">
                <div className="grid two">
                  {[
                    { icon: Heart, title: "Coeur", text: "BPM, charge cardiaque, coherence." },
                    { icon: Timer, title: "Respiration", text: "Cycles/minute et synchronisation." },
                    { icon: Brain, title: "Stress", text: "Indice de pression percue." },
                    { icon: Moon, title: "Sommeil", text: "Score de recuperation estime." },
                    { icon: Sun, title: "Energie", text: "Vitalite et reserve adaptative." },
                    { icon: Shield, title: "Alertes douces", text: "Signalement non medical des entrees elevees." },
                  ].map(({ icon: Icon, title, text }) => (
                    <div key={title} className="card" style={{ background: "rgba(15,23,42,0.5)", borderColor: "rgba(71,85,105,0.45)" }}>
                      <div className="row" style={{ gap: 8 }}>
                        <Icon size={16} color="#22d3ee" />
                        <h3 style={{ margin: 0, fontSize: 15 }}>{title}</h3>
                      </div>
                      <p className="muted" style={{ margin: "8px 0 0", fontSize: 13, lineHeight: 1.5 }}>
                        {text}
                      </p>
                    </div>
                  ))}
                </div>
              </SectionCard>
            </form>
          )}

          {step === "scanning" && (
            <SectionCard title="Scan en cours" icon={Waves} subtitle={`Synchronisation du profil de ${name || "l'utilisateur"}`}>
              <div style={{ display: "grid", gap: 22, textAlign: "center" }}>
                <div style={{ position: "relative", height: 240, borderRadius: 24, overflow: "hidden", border: "1px solid rgba(51,65,85,0.75)", background: "rgba(2,8,20,0.95)" }}>
                  <canvas ref={canvasRef} style={{ width: "100%", height: "100%", display: "block" }} />
                </div>

                <div style={{ display: "grid", gap: 8, maxWidth: 760, width: "100%", margin: "0 auto" }}>
                  <div style={{ height: 12, borderRadius: 999, overflow: "hidden", border: "1px solid rgba(51,65,85,0.75)", background: "rgba(2,8,20,0.88)" }}>
                    <div style={{ width: `${scanProgress}%`, height: "100%", background: "linear-gradient(90deg,#06b6d4,#6366f1,#d946ef)", transition: "width 120ms linear" }} />
                  </div>
                  <p style={{ margin: 0, color: "#67e8f9", fontSize: 13 }}>{scanProgress}% termine</p>
                </div>

                <div className="grid two" style={{ gridTemplateColumns: "repeat(4,minmax(0,1fr))" }}>
                  <StatCard icon={Heart} label="BPM source" value={`${manualBpm} BPM`} color="#fb7185" />
                  <StatCard icon={Timer} label="Souffle" value={`${breathingRate}/min`} color="#22d3ee" />
                  <StatCard icon={Brain} label="Stress" value={`${stressLevel}%`} color="#a78bfa" />
                  <StatCard icon={Moon} label="Sommeil" value={`${sleepHours} h`} color="#86efac" />
                </div>
              </div>
            </SectionCard>
          )}

          {step === "results" && results && (
            <>
              <div className="row" style={{ flexWrap: "wrap" }}>
                {[
                  ["overview", "Vue globale"],
                  ["cardiac", "Cardiaque"],
                  ["recovery", "Recuperation"],
                  ["advice", "Conseils"],
                ].map(([key, label]) => (
                  <button key={key} type="button" onClick={() => setPanel(key)} style={{ padding: "10px 14px", borderRadius: 14, border: panel === key ? "1px solid rgba(34,211,238,0.35)" : "1px solid rgba(51,65,85,0.75)", background: panel === key ? "rgba(6,182,212,0.12)" : "rgba(2,8,20,0.6)", color: panel === key ? "#67e8f9" : "#cbd5e1" }}>
                    {label}
                  </button>
                ))}
                <button type="button" className="row" style={{ marginLeft: "auto", padding: "10px 14px", borderRadius: 14 }} onClick={reset}>
                  <RefreshCw size={16} /> Nouveau scan
                </button>
              </div>

              {panel === "overview" && (
                <div className="grid two" style={{ gridTemplateColumns: "1.2fr 0.8fr" }}>
                  <SectionCard title="Diagnostic integral" icon={Activity} subtitle={`Profil analyse : ${name} - Groupe ${ageRange}`}>
                    <div className="grid two" style={{ gridTemplateColumns: "repeat(3,minmax(0,1fr))", marginBottom: 16 }}>
                      <StatCard icon={Waves} label="Frequence" value={`${results.frequency} Hz`} color="#22d3ee" />
                      <StatCard icon={Heart} label="Coherence" value={`${results.coherence}%`} color="#fb7185" />
                      <StatCard icon={Zap} label="Resonance" value={`${results.resonance}%`} color="#a78bfa" />
                      <StatCard icon={Sun} label="Vitalite" value={`${results.vitality}%`} color="#fbbf24" />
                      <StatCard icon={Brain} label="Focus" value={`${results.focus}%`} color="#818cf8" />
                      <StatCard icon={Moon} label="Recuperation" value={`${results.recovery}%`} color="#86efac" />
                    </div>
                    <div style={{ display: "grid", gap: 12 }}>
                      <ProgressBar label="Regulation autonome" value={results.coherence} />
                      <ProgressBar label="Synchronisation souffle-coeur" value={results.sync} color="linear-gradient(90deg,#10b981,#06b6d4)" />
                      <ProgressBar label="Reserve adaptative" value={results.recovery} color="linear-gradient(90deg,#6366f1,#06b6d4)" />
                      <ProgressBar label="Clarte cognitive" value={results.focus} color="linear-gradient(90deg,#f59e0b,#eab308)" />
                    </div>
                  </SectionCard>

                  <SectionCard title="Panneau rapide" icon={Shield} subtitle="Synthese des releves generes">
                    <div className="grid two">
                      <StatCard icon={Heart} label="Pouls declare" value={`${manualBpm} BPM`} color="#fb7185" />
                      <StatCard icon={Timer} label="Respiration" value={`${breathingRate}/min`} color="#22d3ee" />
                      <StatCard icon={Activity} label="Temperature" value={`${results.bodyTemp} °C`} color="#fbbf24" />
                      <StatCard icon={Sparkles} label="Oxygene" value={`${results.oxygen}%`} color="#86efac" />
                    </div>
                    <div className="card" style={{ marginTop: 12, background: "rgba(15,23,42,0.5)", borderColor: "rgba(71,85,105,0.45)" }}>
                      <div style={{ display: "grid", gap: 12 }}>
                        {results.timeline.map((item) => (
                          <ProgressBar key={item.label} label={item.label} value={item.value} color="linear-gradient(90deg,#10b981,#06b6d4)" />
                        ))}
                      </div>
                    </div>
                  </SectionCard>
                </div>
              )}

              {panel === "cardiac" && (
                <div className="grid two">
                  <SectionCard title="Module cardiaque" icon={Heart} subtitle="Vue non medicale orientee bien-etre">
                    <div className="grid two">
                      <StatCard icon={Heart} label="Charge cardiaque" value={`${results.cardiacLoad}%`} color="#fb7185" />
                      <StatCard icon={Activity} label="HRV score" value={`${results.hrv}%`} color="#22d3ee" />
                      <StatCard icon={Timer} label="Synchro souffle-coeur" value={`${results.sync}%`} color="#86efac" />
                      <StatCard icon={Waves} label="Tolerance douce" value={`${clamp(100 - results.cardiacLoad + 18, 25, 98)}%`} color="#a78bfa" />
                    </div>
                  </SectionCard>

                  <SectionCard title="Alertes et prudence" icon={AlertTriangle} subtitle="Messages affiches selon les entrees">
                    <div style={{ display: "grid", gap: 10 }}>
                      {results.alerts.length === 0 ? (
                        <div className="card" style={{ background: "rgba(34,197,94,0.1)", borderColor: "rgba(34,197,94,0.25)" }}>
                          Aucune alerte douce declenchee par les parametres actuels.
                        </div>
                      ) : (
                        results.alerts.map((alert) => (
                          <div key={alert} className="card" style={{ background: "rgba(245,158,11,0.1)", borderColor: "rgba(245,158,11,0.25)" }}>
                            <div className="row" style={{ alignItems: "flex-start" }}>
                              <AlertTriangle size={16} color="#fbbf24" style={{ marginTop: 2 }} />
                              <span style={{ fontSize: 13, lineHeight: 1.5 }}>{alert}</span>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </SectionCard>
                </div>
              )}

              {panel === "recovery" && (
                <div className="grid two">
                  <SectionCard title="Recuperation et equilibre" icon={Moon} subtitle="Impact du sommeil, du stress et de la respiration">
                    <div style={{ display: "grid", gap: 12 }}>
                      <ProgressBar label="Recuperation" value={results.recovery} color="linear-gradient(90deg,#22c55e,#84cc16)" />
                      <ProgressBar label="Clarte mentale" value={results.focus} color="linear-gradient(90deg,#6366f1,#06b6d4)" />
                      <ProgressBar label="Vitalite" value={results.vitality} color="linear-gradient(90deg,#f59e0b,#eab308)" />
                      <ProgressBar label="Regulation autonome" value={results.coherence} color="linear-gradient(90deg,#06b6d4,#14b8a6)" />
                    </div>
                  </SectionCard>

                  <SectionCard title="Respiration guidee" icon={Timer} subtitle="Mini protocole integre a l'application">
                    <div style={{ display: "grid", gap: 10 }}>
                      {[
                        "Inspirer 4 sec - Bloquer 4 sec - Expirer 6 sec - Repeter 8 cycles.",
                        "Le tableau calcule mieux autour de 6 cycles/minute pour la coherence.",
                        "Historique journalier, graphiques 7 jours, export PDF et mode capteur Bluetooth peuvent etre ajoutes ensuite.",
                      ].map((text) => (
                        <div key={text} className="card" style={{ background: "rgba(15,23,42,0.5)", borderColor: "rgba(71,85,105,0.45)" }}>
                          <p className="muted" style={{ margin: 0, fontSize: 13, lineHeight: 1.55 }}>
                            {text}
                          </p>
                        </div>
                      ))}
                    </div>
                  </SectionCard>
                </div>
              )}

              {panel === "advice" && (
                <SectionCard title="Conseils personnalises" icon={CheckCircle2} subtitle="Actions simples a afficher apres chaque scan">
                  <div className="grid two">
                    {results.recommendations.map((item) => (
                      <div key={item} className="card" style={{ background: "rgba(15,23,42,0.5)", borderColor: "rgba(71,85,105,0.45)" }}>
                        <div className="row" style={{ alignItems: "flex-start" }}>
                          <CheckCircle2 size={18} color="#4ade80" style={{ marginTop: 2 }} />
                          <p style={{ margin: 0, fontSize: 13, lineHeight: 1.6 }}>{item}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </SectionCard>
              )}
            </>
          )}
        </main>
      </div>
    </section>
  );
}
