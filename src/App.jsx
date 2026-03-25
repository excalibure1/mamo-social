import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import MamoTelecom from "./MamoTelecom";
import DreamboxModule from "./DreamboxModule";
import EconomyModule from "./EconomyModule";
import MamoMeteo from "./MamoMeteo";
import MamoDefenderPro from "./MamoDefenderPro";
import SimqModule from "./SimqModule";
import MamoCdn from "./MamoCdn";
import MamoTcvStation from "./MamoTcvStation";
import MamoStreamPro from "./MamoStreamPro";

const isLocalDevHost =
  typeof window !== "undefined" && ["127.0.0.1", "localhost"].includes(window.location.hostname);
const DEFAULT_BACKEND_URL = isLocalDevHost ? "http://127.0.0.1:8002" : "http://127.0.0.1:8000";
const BACKEND_URL = (import.meta.env.VITE_BACKEND_URL || DEFAULT_BACKEND_URL).trim();
const API = (path) => (BACKEND_URL ? `${BACKEND_URL}${path}` : path);
const CHEF_ID = "mamo:identity:3D0DF572F300";
const ELITE_PRICE_LABEL = "50$ en ETH";
const ELITE_PLAN = "Elite Quantum";
const STANDARD_PLAN = "Standard";
const CHEF_PLAN = "Chef";
const SESSION_TIMEOUT_MS = 15 * 60 * 1000;

const normalize = (str) =>
  String(str || "")
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();

const generateMamoId = () => {
  const hash = Array.from({ length: 12 }, () => Math.floor(Math.random() * 16).toString(16).toUpperCase()).join("");
  return `mamo:identity:${hash}`;
};

const createUser = (role = STANDARD_PLAN) => ({
  id: generateMamoId(),
  role,
  createdAt: new Date().toISOString(),
  accessKey: `QK-${Math.random().toString(36).slice(2, 10).toUpperCase()}`,
});

const shortenAddress = (value) => {
  if (!value) return "unsigned";
  return `${value.slice(0, 6)}...${value.slice(-4)}`;
};

const sha256Hex = async (value) => {
  const data = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
};

const toErrorText = (error, fallback = "operation_failed") => {
  const text = String(error?.message || "").trim();
  return text || fallback;
};

const describeBankingDetail = (detail) => {
  const normalized = normalize(detail);
  if (!normalized) return "operation_banking_failed";
  if (normalized === "chef_wallet_not_configured") {
    return "Aucun wallet Chef n'est configure cote backend. Le mode local peut auto-debloquer Chef apres signature.";
  }
  if (normalized === "chef_wallet_mismatch") {
    return "Le wallet signe ne correspond pas au wallet Chef autorise.";
  }
  if (normalized === "missing_authorization") {
    return "Session wallet absente. Clique sur Connect Wallet avant de lancer l'achat.";
  }
  if (normalized === "invalid_authorization_header") {
    return "Session wallet invalide. Reconnecte le wallet.";
  }
  if (normalized === "invalid_token_signature" || normalized === "token_expired") {
    return "Session wallet expiree ou invalide. Reconnecte le wallet.";
  }
  if (normalized === "wallet_not_registered") {
    return "Wallet non enregistre cote backend. Reconnecte le wallet pour recreer la session.";
  }
  if (normalized === "kyc_required") {
    return "KYC requis avant achat. Lance le KYC puis valide-le avant de continuer.";
  }
  return detail;
};

class QuantumEntanglementEngine {
  constructor() {
    this.coherenceDecay = 0.95;
    this.noiseLevel = 0.1;
  }

  perform(config) {
    const strength = 0.7 + Math.random() * 0.3;
    const complexity = Math.min(1, (config.qubitCount * config.entanglementDepth) / 80);
    const quality = Math.min(1, (strength * 0.65 + complexity * 0.35) * config.coherenceBoost);
    const coherenceTime = 120 * quality * (1 - this.noiseLevel * (1 - config.noiseReduction));
    const efficiency = Math.min(1, quality * (coherenceTime / 100));
    return {
      entanglementQuality: quality,
      coherenceTime,
      efficiency,
      qubitsEntangled: Math.min(config.qubitCount, Math.round(config.qubitCount * quality)),
    };
  }
}

function EntanglementVisualizer({ state, isMining }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    let raf = 0;
    let t = 0;

    const draw = () => {
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      canvas.width = w * 2;
      canvas.height = h * 2;
      ctx.scale(2, 2);
      ctx.fillStyle = "rgba(5,10,22,0.28)";
      ctx.fillRect(0, 0, w, h);

      const cx = w / 2;
      const cy = h / 2;
      const orbit = Math.min(w, h) * 0.34;
      const count = 10;
      for (let i = 0; i < count; i += 1) {
        const a = (i / count) * Math.PI * 2 + t;
        const x = cx + Math.cos(a) * orbit;
        const y = cy + Math.sin(a) * orbit;
        ctx.beginPath();
        ctx.fillStyle = isMining ? "rgba(0,238,255,0.95)" : "rgba(120,140,170,0.75)";
        ctx.arc(x, y, 5 + state.entanglementQuality * 5, 0, Math.PI * 2);
        ctx.fill();

        if (isMining) {
          const a2 = ((i + 1) / count) * Math.PI * 2 + t;
          const x2 = cx + Math.cos(a2) * orbit;
          const y2 = cy + Math.sin(a2) * orbit;
          ctx.strokeStyle = `rgba(209,70,255,${0.2 + state.entanglementQuality * 0.6})`;
          ctx.lineWidth = 1 + state.entanglementQuality * 1.8;
          ctx.beginPath();
          ctx.moveTo(x, y);
          ctx.lineTo(x2, y2);
          ctx.stroke();
        }
      }

      ctx.fillStyle = "rgba(255,255,255,0.9)";
      ctx.font = "600 14px Fira Code, monospace";
      ctx.fillText(`Quality ${(state.entanglementQuality * 100).toFixed(1)}%`, 18, 28);
      ctx.fillText(`Coherence ${state.coherenceTime.toFixed(1)} ms`, 18, 52);
      t += 0.015;
      raf = requestAnimationFrame(draw);
    };

    draw();
    return () => cancelAnimationFrame(raf);
  }, [state, isMining]);

  return <canvas ref={canvasRef} className="viz" />;
}

export default function App() {
  const lastActivityRef = useRef(Date.now());
  const [activeTab, setActiveTab] = useState("dashboard");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [digitalId, setDigitalId] = useState(null);
  const [isImporting, setIsImporting] = useState(false);
  const [importText, setImportText] = useState("");
  const [redeemCode, setRedeemCode] = useState("");
  const [grantId, setGrantId] = useState("");
  const [generatedCode, setGeneratedCode] = useState("");
  const [status, setStatus] = useState("Backend pending...");
  const [messages, setMessages] = useState([{ role: "assistant", text: "MAMO Command Center ready." }]);
  const [input, setInput] = useState("");
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [isForging, setIsForging] = useState(false);
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  const [userAddress, setUserAddress] = useState("0x1111111111111111111111111111111111111111");
  const walletAddress = userAddress;
  const setWalletAddress = setUserAddress;
  const [walletJwt, setWalletJwt] = useState("");
  const [walletConnected, setWalletConnected] = useState(false);
  const [walletVerified, setWalletVerified] = useState(false);
  const [sessionMeta, setSessionMeta] = useState(null);
  const [kycStatus, setKycStatus] = useState("pending");
  const [purchaseMethod, setPurchaseMethod] = useState("stripe");
  const [purchaseAmount, setPurchaseAmount] = useState("250");
  const [lastOrder, setLastOrder] = useState(null);
  const [orders, setOrders] = useState([]);
  const [bankingMessage, setBankingMessage] = useState("Aucune action bancaire lancÃ©e.");
  const [balanceWei, setBalanceWei] = useState("0");
  const [defender, setDefender] = useState({ status: "unknown" });
  const [auditLog, setAuditLog] = useState([]);
  const [mintDisabled, setMintDisabled] = useState(false);
  const [bridgeAmount, setBridgeAmount] = useState("1000000000000000000");
  const [bridgeProof, setBridgeProof] = useState(null);
  const [bridgeVerify, setBridgeVerify] = useState(null);

  const [isMining, setIsMining] = useState(false);
  const engine = useRef(new QuantumEntanglementEngine());
  const miningRef = useRef(null);
  const [miningState, setMiningState] = useState({
    entanglementQuality: 0,
    coherenceTime: 0,
    efficiency: 0,
    qubitsEntangled: 0,
  });
  const [config, setConfig] = useState({
    qubitCount: 8,
    entanglementDepth: 3,
    coherenceBoost: 1.0,
    noiseReduction: 0.5,
    algorithm: "bell_state",
  });
  const [rewards, setRewards] = useState({ qEnergy: 0, qEntangle: 0, totalMined: 0, lastRecordId: null });
  const [notifications, setNotifications] = useState([
    { id: 1, text: "Bienvenue sur le systÃ¨me MAMO", type: "info", time: new Date().toLocaleTimeString() },
  ]);
  const [sdrData, setSdrData] = useState(Array.from({ length: 40 }, () => Math.random() * 100));
  const [meshNodes, setMeshNodes] = useState([]);
  const [isScanningMesh, setIsScanningMesh] = useState(false);
  const [externalDeviceConnected, setExternalDeviceConnected] = useState(false);
  const [networkMessage, setNetworkMessage] = useState("Aucune vÃ©rification rÃ©seau lancÃ©e.");
  const [syncingBalance, setSyncingBalance] = useState(false);
  const [pingingDefender, setPingingDefender] = useState(false);
  const [balanceSource, setBalanceSource] = useState("-");
  const [chefLockedUntil, setChefLockedUntil] = useState(null);
  const [eliteAccessCodes, setEliteAccessCodes] = useState(() => {
    try {
      const saved = localStorage.getItem("mamo-elite-codes");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const tabs = useMemo(
    () => [
      { id: "dashboard", label: "Vue Globale" },
      { id: "economy", label: "Economie MAMO", chefOnly: true },
      { id: "banking", label: "Banking" },
      { id: "web3", label: "Web3 Mamora Quantum Bank", vip: true },
      { id: "ipfs", label: "Dreambox" },
      { id: "ai", label: "Command Center IA", chefOnly: true },
      { id: "defender", label: "MAMO Defender PRO", chefOnly: true },
      { id: "simq", label: "SIMQ" },
      { id: "cdn", label: "Mamo CDN" },
      { id: "tcv", label: "MAMO tCV", vip: true },
      { id: "streampro", label: "Mamo Stream Pro", privateOnly: true },
      { id: "telecom", label: "Mamo telecom" },
      { id: "meteo", label: "MAMO meteo" },
      { id: "options", label: "Options" },
    ],
    []
  );

  const pushNotif = useCallback((text, type = "info") => {
    setNotifications((prev) => [{ id: Date.now(), text, type, time: new Date().toLocaleTimeString() }, ...prev].slice(0, 15));
  }, []);

  const handleLogout = useCallback(
    (silent = false) => {
      localStorage.removeItem("mamo-production-session");
      setDigitalId(null);
      setWalletVerified(false);
      setSessionMeta(null);
      setWalletConnected(false);
      setWalletJwt("");
      setWalletAddress("0x1111111111111111111111111111111111111111");
      setActiveTab("dashboard");
      setShowUpgradeModal(false);
      setIsImporting(false);
      setImportText("");
      if (!silent) pushNotif("Session fermee.", "info");
    },
    [pushNotif]
  );

  const persistSignedSession = useCallback(async (nextUser, auth) => {
    const sessionHash = await sha256Hex(`${nextUser.id}|${auth.walletAddress}|${auth.signedAt}|${auth.signature}`);
    const nextRole = normalize(auth?.backend?.role || nextUser?.role || "");
    const nextAuth = {
      walletAddress: auth.walletAddress,
      walletVerified: true,
      sessionHash,
      lastActivityAt: Date.now(),
      signedAt: auth.signedAt,
      role: nextRole,
      jwt: auth?.backend?.jwt || "",
      kycApproved: Boolean(auth?.backend?.kycApproved),
    };
    setWalletAddress(nextAuth.walletAddress);
    setWalletVerified(true);
    setWalletConnected(true);
    setSessionMeta(nextAuth);
    lastActivityRef.current = nextAuth.lastActivityAt;
    setDigitalId(nextUser);
    localStorage.setItem("mamo-digital-id", JSON.stringify(nextUser));
  }, []);

  const requestWalletAddress = useCallback(async () => {
    if (typeof window === "undefined" || !window.ethereum) {
      throw new Error("Wallet Web3 requis pour ouvrir une session securisee.");
    }
    const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
    const address = String(accounts?.[0] || "").trim();
    if (!address) throw new Error("Aucun wallet detecte.");
    return address.toLowerCase();
  }, []);

  const requestAuthNonce = useCallback(async (walletAddress, purpose = "wallet_login") => {
    const response = await fetch(API("/api/auth/wallet/nonce"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ walletAddress, purpose }),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      const detail =
        typeof data?.detail === "string" ? data.detail : JSON.stringify(data?.detail || data || "nonce_request_failed");
      throw new Error(detail);
    }
    return data;
  }, []);

  const signAuthMessage = useCallback(async (walletAddress, message) => {
    let lastError = null;
    const attempts = [
      { method: "personal_sign", params: [message, walletAddress] },
      { method: "personal_sign", params: [walletAddress, message] },
    ];

    for (const attempt of attempts) {
      try {
        const signature = await window.ethereum.request(attempt);
        if (signature) return String(signature);
      } catch (error) {
        lastError = error;
      }
    }
    throw new Error(toErrorText(lastError, "wallet_signature_failed"));
  }, []);

  const authenticateWithBackend = useCallback(
    async (purpose = "wallet_login") => {
      setIsAuthenticating(true);
      try {
        const walletAddress = await requestWalletAddress();
        const nonceData = await requestAuthNonce(walletAddress, purpose);
        const signature = await signAuthMessage(walletAddress, nonceData.message);
        const signedAt = Date.now();

        const endpoint = purpose === "chef_login" ? "/api/auth/chef/validate" : "/api/auth/wallet";
        const payload =
          purpose === "chef_login"
            ? { walletAddress, nonce: nonceData.nonce, signature }
            : { walletAddress, nonce: nonceData.nonce, signature, purpose: "wallet_login" };

        const response = await fetch(API(endpoint), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const data = await response.json().catch(() => ({}));
        if (!response.ok) {
          const detail =
            typeof data?.detail === "string"
              ? data.detail
              : JSON.stringify(data?.detail || data || `${purpose}_auth_failed`);
          throw new Error(detail);
        }

        return { walletAddress, signature, signedAt, backend: data };
      } finally {
        setIsAuthenticating(false);
      }
    },
    [requestWalletAddress, requestAuthNonce, signAuthMessage]
  );

  const applyBackendSession = useCallback((backendPayload, walletAddress) => {
    const nextLastActivityAt = Date.now();
    const nextRole = normalize(backendPayload?.role || "");
    setWalletJwt(backendPayload?.jwt || "");
    setWalletConnected(true);
    setWalletVerified(true);
    setUserAddress(walletAddress);
    setSessionMeta((prev) => ({
      ...(prev || {}),
      walletAddress,
      walletVerified: true,
      jwt: backendPayload?.jwt || "",
      role: nextRole,
      kycApproved: Boolean(backendPayload?.kycApproved),
      lastActivityAt: nextLastActivityAt,
    }));
    lastActivityRef.current = nextLastActivityAt;
    if (typeof backendPayload?.kycApproved === "boolean") {
      setKycStatus(backendPayload.kycApproved ? "approved" : "pending");
    }
  }, []);

  useEffect(() => {
    const raw = localStorage.getItem("mamo-digital-id");
    if (!raw) return;
    try {
      const parsed = JSON.parse(raw);
      if (parsed?.id) setDigitalId(parsed);
    } catch {
      // ignore malformed persisted identity
    }
  }, []);

  useEffect(() => {
    const raw = localStorage.getItem("mamo-production-session");
    if (!raw) return;
    try {
      const parsed = JSON.parse(raw);
      const lastActivityAt = Number(parsed?.lastActivityAt || 0);
      if (!parsed?.jwt || !parsed?.walletAddress || !lastActivityAt) {
        localStorage.removeItem("mamo-production-session");
        return;
      }
      if (Date.now() - lastActivityAt > SESSION_TIMEOUT_MS) {
        localStorage.removeItem("mamo-production-session");
        return;
      }
      setWalletJwt(String(parsed.jwt));
      setWalletConnected(true);
      setWalletVerified(Boolean(parsed.walletVerified));
      setUserAddress(String(parsed.walletAddress));
      setSessionMeta(parsed);
      lastActivityRef.current = lastActivityAt;
      if (parsed?.kycStatus) {
        setKycStatus(String(parsed.kycStatus));
      }
    } catch {
      localStorage.removeItem("mamo-production-session");
    }
  }, []);

  useEffect(() => {
    if (!sessionMeta || !walletJwt || !walletAddress || !walletVerified) return;
    const snapshot = {
      ...sessionMeta,
      walletAddress,
      walletVerified,
      jwt: walletJwt,
      role: normalize(sessionMeta?.role || ""),
      kycStatus,
    };
    localStorage.setItem("mamo-production-session", JSON.stringify(snapshot));
  }, [sessionMeta, walletJwt, walletAddress, walletVerified, kycStatus]);

  useEffect(() => {
    localStorage.setItem("mamo-elite-codes", JSON.stringify(eliteAccessCodes));
  }, [eliteAccessCodes]);

  const createFreeStandardIdentity = useCallback(() => {
    const nextUser = createUser(STANDARD_PLAN);
    setDigitalId(nextUser);
    localStorage.setItem("mamo-digital-id", JSON.stringify(nextUser));
    pushNotif("Entree Standard ouverte. Wallet optionnel pour Banking et Web3.", "success");
    return nextUser;
  }, [pushNotif]);

  const loginAsStandard = useCallback(() => {
    createFreeStandardIdentity();
  }, [createFreeStandardIdentity]);

  const linkWalletSession = useCallback(
    async (targetUser = null, successMessage = "Wallet connecte et lie a la session.") => {
      const user = targetUser || digitalId || createFreeStandardIdentity();
      const auth = await authenticateWithBackend("wallet_login");
      applyBackendSession(auth.backend, auth.walletAddress);
      await persistSignedSession(user, auth);
      pushNotif(successMessage, "success");
      return { user, auth };
    },
    [digitalId, createFreeStandardIdentity, authenticateWithBackend, applyBackendSession, persistSignedSession, pushNotif]
  );

  const restoreEliteDemo = async () => {
    try {
      const nextUser = createUser(ELITE_PLAN);
      await linkWalletSession(nextUser, "Pass Elite Quantum restaure avec signature wallet.");
    } catch (error) {
      pushNotif(toErrorText(error, "Echec restauration Elite."), "warning");
    }
  };

  const createIdentity = loginAsStandard;

  const restoreIdentity = () => {
    const input = importText.trim();
    if (!input) return;
    try {
      const parsed = JSON.parse(input);
      if (!parsed?.id) throw new Error("invalid_json_identity");
      setDigitalId(parsed);
      localStorage.setItem("mamo-digital-id", JSON.stringify(parsed));
      setIsImporting(false);
      setImportText("");
      pushNotif("Identite JSON restauree.", "success");
    } catch {
      pushNotif("Format non reconnu. Utilisez un JSON d'identite valide.", "warning");
    }
  };

  const unlockChefAccess = async () => {
    if (chefLockedUntil && Date.now() < chefLockedUntil) {
      pushNotif("Mode Chef temporairement verrouille.", "warning");
      return false;
    }

    try {
      await ensureChefBackendSession();
      pushNotif("Session Chef reliee a la connexion Banking.", "success");
      return true;
    } catch (error) {
      const detail = describeBankingDetail(toErrorText(error, "Chef auth refused."));
      const lockMatch = detail.match(/chef_locked:(\d+)/);
      if (lockMatch) {
        setChefLockedUntil(Date.now() + Number(lockMatch[1]) * 1000);
        pushNotif("Trop de tentatives Chef. Verrouillage temporaire actif.", "warning");
      } else {
        pushNotif(detail, "warning");
      }
      return false;
    }
  };

  const handleForgeElite = async () => {
    setIsForging(true);
    try {
      const targetUser = {
        ...(digitalId || createUser(STANDARD_PLAN)),
        id: digitalId?.id || generateMamoId(),
        role: ELITE_PLAN,
        eliteGrantedAt: new Date().toISOString(),
        eliteSource: "mintElite()",
      };
      await linkWalletSession(targetUser, "SBT Elite forge avec signature wallet.");
      setShowUpgradeModal(false);
      setActiveTab("banking");
    } catch (error) {
      pushNotif(toErrorText(error, "Echec forge Elite."), "warning");
    } finally {
      setIsForging(false);
    }
  };

  const handleGrantElite = async () => {
    if (!grantId.trim()) {
      pushNotif("Entre un ID utilisateur avant de generer la cle.", "warning");
      return;
    }
    const raw = `ELITE|${grantId.trim()}|${Date.now()}|${Math.random().toString(36).slice(2, 10)}`;
    const signature = await sha256Hex(raw);
    const code = `ELITE-${signature.slice(0, 6).toUpperCase()}-${signature.slice(6, 12).toUpperCase()}`;
    const entry = {
      code,
      targetId: grantId.trim(),
      createdAt: new Date().toISOString(),
      used: false,
      lifetime: true,
      signature,
    };
    setEliteAccessCodes((prev) => [entry, ...prev].slice(0, 25));
    setGeneratedCode(code);
    setGrantId("");
    pushNotif("Cle d'acces Elite signee et generee.", "success");
  };

  const handleRedeemEliteCode = async () => {
    const input = redeemCode.trim();
    if (!input) {
      pushNotif("Entre une cle Elite Quantum.", "warning");
      return;
    }
    const index = eliteAccessCodes.findIndex((entry) => entry.code === input && !entry.used);
    if (index === -1) {
      pushNotif("Cle invalide ou deja utilisee.", "warning");
      return;
    }
    try {
      const entry = eliteAccessCodes[index];
      const targetUser = {
        ...(digitalId || createUser(STANDARD_PLAN)),
        id: digitalId?.id || entry.targetId || generateMamoId(),
        role: ELITE_PLAN,
        eliteGrantedAt: new Date().toISOString(),
        eliteSource: "chef-generated-code",
        lifetimeAccess: true,
      };
      await linkWalletSession(targetUser, "Cle Elite acceptee avec signature wallet.");
      setEliteAccessCodes((prev) =>
        prev.map((item, i) => (i === index ? { ...item, used: true, usedAt: new Date().toISOString() } : item))
      );
      setRedeemCode("");
    } catch (error) {
      pushNotif(toErrorText(error, "Echec activation Elite."), "warning");
    }
  };

  const isChef = useMemo(
    () =>
      digitalId?.id === CHEF_ID ||
      normalize(digitalId?.role) === normalize(CHEF_PLAN) ||
      (isLocalDevHost && Boolean(walletJwt) && walletVerified),
    [digitalId, walletJwt, walletVerified]
  );

  const sessionRole = useMemo(() => normalize(sessionMeta?.role || ""), [sessionMeta]);

  const hasChefSession = useMemo(
    () =>
      Boolean(walletJwt) &&
      walletVerified &&
      (sessionRole === normalize(CHEF_PLAN) || isLocalDevHost),
    [walletJwt, walletVerified, sessionRole]
  );

  const isElite = useMemo(
    () => isChef || normalize(digitalId?.role) === normalize(ELITE_PLAN),
    [digitalId, isChef]
  );
  const hasPremiumAccess = useMemo(() => isElite || isLocalDevHost, [isElite]);
  const hasPrivateAccess = useMemo(
    () => isLocalDevHost || hasChefSession || digitalId?.id === CHEF_ID || normalize(digitalId?.role) === normalize(CHEF_PLAN),
    [isLocalDevHost, hasChefSession, digitalId]
  );

  const remainingMinutes = sessionMeta
    ? Math.max(0, Math.ceil((SESSION_TIMEOUT_MS - (Date.now() - (sessionMeta.lastActivityAt || Date.now()))) / 60000))
    : 0;

  const lockoutRemainingMs = chefLockedUntil ? Math.max(0, chefLockedUntil - Date.now()) : 0;
  const chefPublicMessage =
    "Acces Chef public desactive ici. Utilise un wallet Chef configure cote backend, ou passe par l'environnement local.";

  const handleTabClick = async (tab) => {
    if (tab.chefOnly && !hasChefSession) {
      if (isChef) {
        const unlocked = await unlockChefAccess();
        if (unlocked) {
          setActiveTab(tab.id);
          setMobileMenuOpen(false);
          return;
        }
      }
      pushNotif(isChef ? "Session Chef backend requise. Debloque Chef avec signature wallet." : "Zone reservee au Chef.", "warning");
      return;
    }
    if (tab.vip && !hasPremiumAccess) {
      setShowUpgradeModal(true);
      pushNotif("Zone VIP verrouillee. Pass Elite requis.", "warning");
      return;
    }
    if (tab.privateOnly && !hasPrivateAccess) {
      pushNotif("Moteur prive reserve au Chef ou a l'environnement local.", "warning");
      return;
    }
    setActiveTab(tab.id);
    setMobileMenuOpen(false);
  };

  useEffect(() => {
    if (!digitalId || !sessionMeta) return;

    const touch = () => {
      const nextLastActivityAt = Date.now();
      lastActivityRef.current = nextLastActivityAt;
      setSessionMeta((prev) => (prev ? { ...prev, lastActivityAt: nextLastActivityAt } : prev));
    };

    const events = ["mousemove", "keydown", "click", "scroll"];
    events.forEach((eventName) => window.addEventListener(eventName, touch));

    const interval = window.setInterval(() => {
      if (Date.now() - lastActivityRef.current > SESSION_TIMEOUT_MS) {
        pushNotif("Session expiree pour inactivite.", "warning");
        handleLogout(true);
      }
    }, 15000);

    return () => {
      events.forEach((eventName) => window.removeEventListener(eventName, touch));
      window.clearInterval(interval);
    };
  }, [digitalId, sessionMeta, handleLogout, pushNotif]);

  const addAudit = (event) => {
    setAuditLog((prev) => [event, ...prev].slice(0, 120));
  };

  const authHeaders = useMemo(
    () => ({
      "Content-Type": "application/json",
      ...(walletJwt ? { Authorization: `Bearer ${walletJwt}` } : {}),
    }),
    [walletJwt]
  );

  const ensureWalletBankingSession = useCallback(async () => {
    if (walletJwt && walletVerified && userAddress) {
      return { jwt: walletJwt, walletAddress: userAddress, restored: false };
    }
    const auth = await authenticateWithBackend("wallet_login");
    applyBackendSession(auth.backend, auth.walletAddress);
    return {
      jwt: auth.backend?.jwt || "",
      walletAddress: auth.walletAddress,
      restored: true,
    };
  }, [walletJwt, walletVerified, userAddress, authenticateWithBackend, applyBackendSession]);

  const applyChefSession = useCallback(
    (backendPayload, walletAddress) => {
      const nextUser = {
        ...(digitalId || {}),
        id: backendPayload?.chefId || CHEF_ID,
        role: CHEF_PLAN,
        createdAt: digitalId?.createdAt || new Date().toISOString(),
        accessKey: digitalId?.accessKey || `QK-${Math.random().toString(36).slice(2, 10).toUpperCase()}`,
      };
      applyBackendSession(backendPayload, walletAddress);
      setDigitalId(nextUser);
      localStorage.setItem("mamo-digital-id", JSON.stringify(nextUser));
      setChefLockedUntil(null);
      setKycStatus("approved");
    },
    [applyBackendSession, digitalId]
  );

  const ensureChefBackendSession = useCallback(async () => {
    const session = await ensureWalletBankingSession();
    const response = await fetch(API("/api/auth/chef/session"), {
      method: "POST",
      headers: { Authorization: `Bearer ${session.jwt}` },
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      if (response.status === 404 && isLocalDevHost) {
        const localChefPayload = {
          ok: true,
          chefId: CHEF_ID,
          walletAddress: session.walletAddress,
          jwt: session.jwt,
          role: CHEF_PLAN,
          kycApproved: true,
          source: "local-front-fallback",
        };
        applyChefSession(localChefPayload, session.walletAddress);
        return {
          jwt: session.jwt,
          walletAddress: session.walletAddress,
          backend: localChefPayload,
          restored: session.restored,
        };
      }
      const detail =
        typeof data?.detail === "string"
          ? data.detail
          : JSON.stringify(data?.detail || data || "chef_session_upgrade_failed");
      throw new Error(describeBankingDetail(detail));
    }
    applyChefSession(data, session.walletAddress);
    return {
      jwt: data?.jwt || session.jwt,
      walletAddress: session.walletAddress,
      backend: data,
      restored: session.restored,
    };
  }, [ensureWalletBankingSession, applyChefSession]);

  const connectWallet = async () => {
    try {
      if (!digitalId) {
        createFreeStandardIdentity();
      }
      const session = await ensureWalletBankingSession();
      setBankingMessage(
        session.restored
          ? `Wallet connecte: ${session.walletAddress}`
          : `Wallet deja actif: ${session.walletAddress}`
      );
      await refreshOrders(session.walletAddress, session.jwt || "");
    } catch (e) {
      setBankingMessage(`Echec de connexion wallet: ${toErrorText(e, "wallet_connect_failed")}`);
    }
  };

  const initiateKyc = async () => {
    try {
      const session = await ensureWalletBankingSession();
      const res = await fetch(API("/api/kyc/initiate"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.jwt}`,
        },
        body: JSON.stringify({ walletAddress: session.walletAddress, provider: "persona" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(describeBankingDetail(data?.detail || "kyc_init_failed"));
      setKycStatus(data.status || "pending");
      setBankingMessage(`Session KYC creee (${data.provider}).`);
      pushNotif("KYC initialise cote backend.", "success");
    } catch (e) {
      setBankingMessage(`Impossible d'initialiser le KYC: ${toErrorText(e, "kyc_init_failed")}`);
    }
  };

  const checkKycStatus = async () => {
    try {
      const session = await ensureWalletBankingSession();
      const res = await fetch(API(`/api/kyc/status?walletAddress=${encodeURIComponent(session.walletAddress)}`), {
        method: "POST",
        headers: { Authorization: `Bearer ${session.jwt}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(describeBankingDetail(data?.detail || "kyc_status_failed"));
      setKycStatus(data.status || "pending");
      setBankingMessage(`KYC: ${data.status}`);
    } catch (e) {
      setBankingMessage(`Impossible de lire le statut KYC: ${toErrorText(e, "kyc_status_failed")}`);
    }
  };

  const approveKycDev = async () => {
    try {
      const session = await ensureChefBackendSession();
      const res = await fetch(API(`/api/kyc/approve?walletAddress=${encodeURIComponent(session.walletAddress)}`), {
        method: "POST",
        headers: { Authorization: `Bearer ${session.jwt}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(describeBankingDetail(data?.detail || "kyc_approve_failed"));
      setKycStatus("approved");
      setBankingMessage("KYC approuve (mode dev).");
      pushNotif("KYC valide en mode dev. Les achats sont maintenant autorises.", "success");
    } catch (e) {
      setBankingMessage(`Echec de l'approbation KYC dev: ${toErrorText(e, "kyc_approve_failed")}`);
    }
  };

  const initiatePurchase = async () => {
    try {
      const amountFiat = Number(purchaseAmount);
      if (!Number.isFinite(amountFiat) || amountFiat <= 0) {
        const message = "Entre un montant USD valide avant de lancer l'achat.";
        setBankingMessage(message);
        pushNotif(message, "warning");
        return;
      }

      const session = await ensureWalletBankingSession();
      if (kycStatus !== "approved") {
        const message = "KYC requis avant achat. Lance le KYC puis valide-le avant de continuer.";
        setBankingMessage(message);
        pushNotif(message, "warning");
        return;
      }

      const res = await fetch(API("/api/purchase/initiate"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.jwt}`,
        },
        body: JSON.stringify({
          walletAddress: session.walletAddress,
          amountFiat,
          method: purchaseMethod,
          currency: "usd",
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (data?.detail === "kyc_required") setKycStatus("pending");
        throw new Error(describeBankingDetail(data?.detail || "purchase_initiate_failed"));
      }
      setLastOrder(data);
      setBankingMessage(
        purchaseMethod === "stripe"
          ? `PaymentIntent cree (${data.order_id}).`
          : `Transfert Plaid cree (${data.order_id}).`
      );
      pushNotif("Ordre de paiement cree.", "success");
      await refreshOrders(session.walletAddress, session.jwt);
    } catch (e) {
      const message = `Achat refuse: ${toErrorText(e, "purchase_initiate_failed")}`;
      setBankingMessage(message);
      pushNotif(message, "warning");
    }
  };

  const confirmLastOrder = async (source = "stripe") => {
    if (!lastOrder?.order_id) return;
    try {
      const res = await fetch(API("/api/purchase/simulate-confirm"), {
        method: "POST",
        headers: authHeaders,
        body: JSON.stringify({ order_id: lastOrder.order_id, source }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.detail || "confirm_failed");
      setBankingMessage(`Ordre ${lastOrder.order_id} confirmÃ©. TX: ${data.tx_hash || "-"}`);
      await Promise.all([refreshOrders(userAddress), loadBalance(), loadEvents()]);
    } catch {
      setBankingMessage("Ã‰chec de confirmation webhook simulÃ©e.");
    }
  };

  const refreshOrders = async (wallet = userAddress, jwtOverride = "") => {
    try {
      const token = jwtOverride || walletJwt;
      const res = await fetch(API(`/api/purchase/orders?walletAddress=${encodeURIComponent(wallet)}`), {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const data = await res.json();
      setOrders(data.orders || []);
    } catch {
      setOrders([]);
    }
  };

  const loadBalance = async () => {
    setSyncingBalance(true);
    try {
      const res = await fetch(API(`/api/web3/balance/${encodeURIComponent(userAddress)}`));
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.detail || `http_${res.status}`);
      setBalanceWei(data.balanceInWei || "0");
      setBalanceSource(data.source || "unknown");
      setNetworkMessage(`Sync Balance OK (${new Date().toLocaleTimeString()}) - source: ${data.source || "unknown"}`);
    } catch (e) {
      setNetworkMessage(`Sync Balance failed: ${String(e.message || e)}`);
    } finally {
      setSyncingBalance(false);
    }
  };

  const loadEvents = async () => {
    const res = await fetch(API(`/api/web3/events/mining?address=${encodeURIComponent(userAddress)}&limit=40`));
    const data = await res.json();
    setAuditLog(data.events || []);
  };

  const loadDefender = async () => {
    setPingingDefender(true);
    try {
      const res = await fetch(API("/api/defender/ping"));
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.detail || "defender_ping_failed");
      setDefender(data);
      setMintDisabled(data.status !== "ok");
      const info = data.error ? ` - ${data.error}` : "";
      setNetworkMessage(`Ping Defender: ${data.status || "unknown"}${info}`);
    } catch (e) {
      setDefender({ status: "down", network: "warning" });
      setMintDisabled(true);
      setNetworkMessage(`Ping Defender failed: ${String(e.message || e)}`);
    } finally {
      setPingingDefender(false);
    }
  };

  useEffect(() => {
    const boot = async () => {
      try {
        await Promise.all([loadBalance(), loadEvents(), loadDefender()]);
        setStatus("Backend connected");
      } catch {
        setStatus("Backend unreachable");
      }
    };
    boot();
  }, []);

  useEffect(() => {
    const i1 = setInterval(() => {
      loadDefender().catch(() => {});
    }, 30000);
    const i2 = setInterval(() => {
      loadBalance().catch(() => {});
    }, 10000);
    return () => {
      clearInterval(i1);
      clearInterval(i2);
    };
  }, [userAddress]);

  useEffect(() => {
    if (activeTab !== "dashboard") return undefined;
    const timer = setInterval(() => {
      setSdrData((prev) => prev.map((v) => Math.max(5, Math.min(100, v + (Math.random() * 30 - 15)))));
    }, 150);
    return () => clearInterval(timer);
  }, [activeTab]);

  useEffect(() => {
    if (!digitalId?.id) return undefined;
    const timer = setInterval(() => {
      if (Math.random() > 0.6) {
        const isWarning = Math.random() > 0.5;
        const newAlert = {
          id: Date.now(),
          text: isWarning ? "InterfÃ©rence dÃ©tectÃ©e sur le canal LoRa" : "Nouveau pair connectÃ© au maillage",
          type: isWarning ? "warning" : "info",
          time: new Date().toLocaleTimeString(),
        };
        setNotifications((prev) => [newAlert, ...prev].slice(0, 15));
      }
    }, 10000);
    return () => clearInterval(timer);
  }, [digitalId?.id]);

  const scanMeshNetwork = () => {
    setIsScanningMesh(true);
    setMeshNodes([]);
    setTimeout(() => {
      setMeshNodes([
        { id: "Node-Alpha", dist: "14m", signal: "Excellent", type: "Relais", top: 30, left: 40 },
        { id: "SDR-Gateway-9", dist: "156m", signal: "Moyen", type: "Sortie", top: 70, left: 20 },
        { id: "Mamo-Peer-X", dist: "42m", signal: "Bon", type: "Mobile", top: 50, left: 80 },
      ]);
      setIsScanningMesh(false);
      setNotifications((prev) => [
        { id: Date.now(), text: "Scan maillage terminÃ© : 3 pairs trouvÃ©s", type: "info", time: new Date().toLocaleTimeString() },
        ...prev,
      ].slice(0, 15));
    }, 2500);
  };

  useEffect(() => {
    if (!isMining) {
      if (miningRef.current) clearInterval(miningRef.current);
      return;
    }
    miningRef.current = setInterval(async () => {
      const out = engine.current.perform(config);
      setMiningState(out);
      const baseReward = out.entanglementQuality * out.coherenceTime * out.efficiency * config.qubitCount;
      const qEnergy = Math.round(baseReward * 7);
      const qEntangle = Math.round(baseReward * 3);
      setRewards((prev) => ({
        ...prev,
        qEnergy: prev.qEnergy + qEnergy,
        qEntangle: prev.qEntangle + qEntangle,
        totalMined: prev.totalMined + qEnergy + qEntangle,
      }));

      if (out.entanglementQuality > 0.95) {
        const res = await fetch(API("/api/validation/entanglement"), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            address: userAddress,
            entanglementQuality: out.entanglementQuality,
            algorithm: config.algorithm,
            qubitCount: config.qubitCount,
          }),
        });
        const data = await res.json();
        if (data.success) {
          setRewards((prev) => ({ ...prev, lastRecordId: data.recordId }));
          addAudit({
            id: `local-${Date.now()}`,
            timestamp: new Date().toISOString(),
            address: userAddress,
            action: "EntanglementValidated",
            status: "success",
            transactionHash: null,
            details: { recordId: data.recordId, quality: out.entanglementQuality },
          });
        }
      }
    }, 2000);
    return () => {
      if (miningRef.current) clearInterval(miningRef.current);
    };
  }, [isMining, config, userAddress]);

  const claimReward = async () => {
    if (mintDisabled) return;
    const amount = Math.max(1, Math.floor(rewards.totalMined / 300));
    const payload = { to: userAddress, tokenId: 1, amount };
    const response = await fetch(API("/api/mamora/mint"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const txResponse = await response.json();
    if (txResponse.success) {
      addAudit({
        id: `tx-${Date.now()}`,
        timestamp: new Date().toISOString(),
        address: userAddress,
        action: "Mint",
        status: "success",
        transactionHash: txResponse.transactionHash,
        details: { amount, blockNumber: txResponse.blockNumber },
      });
      await loadBalance();
      await loadEvents();
      setRewards((prev) => ({ ...prev, totalMined: 0 }));
    } else {
      addAudit({
        id: `tx-f-${Date.now()}`,
        timestamp: new Date().toISOString(),
        address: userAddress,
        action: "Mint",
        status: "failed",
        transactionHash: null,
        details: { error: txResponse.error || "mint_failed" },
      });
    }
  };

  const generateBridgeProof = async () => {
    try {
      const res = await fetch(API("/api/bridge/proof/generate"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user: userAddress,
          amount: Number(bridgeAmount),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.detail || "bridge_generate_failed");
      setBridgeProof(data);
      setBridgeVerify(null);
    } catch (e) {
      setBridgeProof({ error: String(e.message || e) });
    }
  };

  const verifyBridgeProof = async () => {
    if (!bridgeProof || bridgeProof.error) return;
    try {
      const res = await fetch(API("/api/bridge/proof/verify"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(bridgeProof),
      });
      const data = await res.json();
      setBridgeVerify(data);
    } catch (e) {
      setBridgeVerify({ valid: false, reason: String(e.message || e) });
    }
  };

  const sendMessage = async () => {
    const question = input.trim();
    if (!question) return;
    setMessages((prev) => [...prev, { role: "user", text: question }]);
    setInput("");
    const res = await fetch(API("/api/ask"), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(walletJwt ? { Authorization: `Bearer ${walletJwt}` } : {}),
      },
      body: JSON.stringify({ question, context: "MAMO Command Center" }),
    });
    const data = await res.json();
    setMessages((prev) => [...prev, { role: "assistant", text: data.response || "No response." }]);
  };

  if (!digitalId) {
    return (
      <div className="entry-page">
        <section className="panel glass neon entry-panel">
          <h2>Digital ID - Portail d&apos;Entree Securise</h2>
          <p className="muted">
            L&apos;entree Standard est gratuite et immediate. Le wallet devient optionnel et sert seulement pour Banking, Web3, Elite et Chef.
          </p>
          <div className="card" style={{ marginTop: 12 }}>
            <div className="row">
              <button onClick={loginAsStandard}>
                Entrer Standard gratuitement
              </button>
              <button
                onClick={() => linkWalletSession(null, "Session Standard ouverte avec wallet lie.")}
                disabled={isAuthenticating}
              >
                {isAuthenticating ? "Signature..." : "Entrer + connecter wallet"}
              </button>
            </div>
            <div className="row" style={{ marginTop: 12 }}>
              <button onClick={restoreEliteDemo} disabled={isAuthenticating}>
                {isAuthenticating ? "Signature..." : "Restaurer Elite (wallet)"}
              </button>
            </div>

            <label style={{ display: "block", marginTop: 12 }}>Acces Chef</label>
            {isLocalDevHost ? (
              <div className="row">
                <button onClick={unlockChefAccess} disabled={isAuthenticating || lockoutRemainingMs > 0}>
                  {lockoutRemainingMs > 0 ? `Verrouille ${Math.ceil(lockoutRemainingMs / 60000)} min` : "Debloquer Chef"}
                </button>
              </div>
            ) : (
              <p className="warn" style={{ marginTop: 8 }}>
                {chefPublicMessage}
              </p>
            )}

            <label style={{ display: "block", marginTop: 12 }}>Cle Elite Quantum</label>
            <div className="row">
              <input
                value={redeemCode}
                onChange={(e) => setRedeemCode(e.target.value)}
                placeholder="Entrer cle Elite"
              />
              <button onClick={handleRedeemEliteCode} disabled={isAuthenticating}>
                Activer Elite
              </button>
            </div>

            <div className="row" style={{ marginTop: 12 }}>
              <button onClick={() => setIsImporting((v) => !v)}>{isImporting ? "Masquer JSON" : "Restaurer JSON"}</button>
            </div>
            {isImporting && (
              <>
                <label style={{ display: "block", marginTop: 12 }}>Code JSON d&apos;identite</label>
                <textarea
                  value={importText}
                  onChange={(e) => setImportText(e.target.value)}
                  placeholder='{"id":"mamo:identity:...","role":"Standard"}'
                  style={{ width: "100%", minHeight: 110, marginTop: 8 }}
                />
                <div className="row" style={{ marginTop: 8 }}>
                  <button onClick={() => setIsImporting(false)}>Annuler</button>
                  <button onClick={restoreIdentity}>Restaurer</button>
                </div>
              </>
            )}
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="page">
      <div className="mobile-topbar glass">
        <button className="mobile-menu-toggle" onClick={() => setMobileMenuOpen((prev) => !prev)}>
          {mobileMenuOpen ? "Fermer le menu" : "Menu"}
        </button>
        <div className="mobile-topbar-meta">
          <strong>MAMO Production</strong>
          <span>{tabs.find((tab) => tab.id === activeTab)?.label || "Navigation"}</span>
        </div>
      </div>

      {mobileMenuOpen && <button className="mobile-backdrop" onClick={() => setMobileMenuOpen(false)} aria-label="Fermer le menu" />}

      <aside className={`sidebar glass ${mobileMenuOpen ? "open" : ""}`}>
        <h1>MAMO Production</h1>
        <p className="status">{status}</p>
        <p className="muted" style={{ marginTop: 8, fontSize: 12 }}>
          Digital ID: {digitalId?.id || "-"}
        </p>
        <p className={isChef ? "ok" : isElite ? "ok" : "muted"} style={{ fontSize: 12 }}>
          Role: {isChef ? CHEF_PLAN : isElite ? ELITE_PLAN : STANDARD_PLAN}
        </p>
        <p className={walletVerified ? "ok" : "warn"} style={{ fontSize: 12 }}>
          Wallet signe: {walletVerified ? shortenAddress(walletAddress) : "non"}
        </p>
        <p className="muted" style={{ fontSize: 12 }}>
          Timeout session: {remainingMinutes} min
        </p>
        <div className="tabs">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => handleTabClick(tab)}
              className={activeTab === tab.id ? "tab active" : "tab"}
            >
              {tab.label}
              {tab.chefOnly && !isChef ? " [Chef uniquement]" : ""}
              {tab.vip && !isElite ? " [VIP verrouille]" : ""}
            </button>
          ))}
        </div>
      </aside>

      <main className="content">
        {activeTab === "dashboard" && (
          <section className="panel glass neon">
            <h2>MAMO-UNIVERS</h2>
            <p className="muted">Vue globale : certification Digital ID + SDR + maillage + alertes + appareils.</p>
            <div className="grid two">
              <div className="card">
                <h3>Certification Personne (Digital ID / SDI Control)</h3>
                <p>ID: {digitalId?.id || "-"}</p>
                <p>Role: {isChef ? CHEF_PLAN : isElite ? ELITE_PLAN : STANDARD_PLAN}</p>
                <p>CrÃ©Ã©e: {digitalId?.createdAt ? new Date(digitalId.createdAt).toLocaleString() : "-"}</p>
                <p className={walletVerified ? "ok" : "warn"}>
                  Wallet: {walletVerified ? `${shortenAddress(walletAddress)} (signe)` : "Non signe"}
                </p>
                <p className={kycStatus === "approved" ? "ok" : "warn"}>KYC/AML: {kycStatus}</p>
                <p className="muted">Session restante: {remainingMinutes} min</p>
                <div className="row">
                  <button onClick={() => setActiveTab("options")}>Ouvrir Options</button>
                  <button onClick={() => handleLogout(false)}>Verrouiller l'entree</button>
                </div>
              </div>

              <div className="card">
                <h3>Statut RÃ©seau & SÃ©curitÃ©</h3>
                <p>Web3 Balance: {balanceWei} wei</p>
                <p>Balance source: {balanceSource}</p>
                <p className={defender.status === "ok" ? "ok" : "warn"}>
                  Defender: {defender.status === "ok" ? "Network Secured" : "Warning"}
                </p>
                <p className="muted">Backend cible: {BACKEND_URL}</p>
                <p>QualitÃ© quantique: {(miningState.entanglementQuality * 100).toFixed(1)}%</p>
                <p>EfficacitÃ©: {(miningState.efficiency * 100).toFixed(1)}%</p>
                <div className="row">
                  <button onClick={loadBalance} disabled={syncingBalance}>
                    {syncingBalance ? "Sync..." : "Sync Balance"}
                  </button>
                  <button onClick={loadDefender} disabled={pingingDefender}>
                    {pingingDefender ? "Ping..." : "Ping Defender"}
                  </button>
                </div>
                <p className={networkMessage.includes("failed") ? "warn" : "muted"}>{networkMessage}</p>
              </div>
            </div>

            <div className="grid two">
              <div className="card">
                <h3>SDR (Scanner) - Spectre temps rÃ©el</h3>
                <div style={{ height: 180, display: "flex", alignItems: "end", gap: 2, padding: 10, border: "1px solid rgba(56,133,170,0.6)", borderRadius: 10 }}>
                  {sdrData.map((val, i) => (
                    <div key={i} style={{ flex: 1, height: "100%", background: "rgba(0,238,255,0.15)", borderRadius: 2, position: "relative", overflow: "hidden" }}>
                      <div
                        style={{
                          position: "absolute",
                          bottom: 0,
                          width: "100%",
                          height: `${val}%`,
                          background: "linear-gradient(180deg, #9ef4ff, #00eeff)",
                          transition: "height 120ms linear",
                        }}
                      />
                    </div>
                  ))}
                </div>
                <p className="muted">Canal LoRa 868MHz - animation dynamique active</p>
              </div>

              <div className="card">
                <h3>Maillage (RÃ©sonance)</h3>
                <div
                  style={{
                    position: "relative",
                    width: 260,
                    height: 260,
                    borderRadius: "50%",
                    margin: "0 auto 12px",
                    border: "1px solid rgba(0,238,255,0.25)",
                    display: "grid",
                    placeItems: "center",
                  }}
                >
                  <div style={{ position: "absolute", inset: 20, borderRadius: "50%", border: "1px solid rgba(0,238,255,0.12)" }} />
                  <div style={{ position: "absolute", inset: 50, borderRadius: "50%", border: "1px solid rgba(0,238,255,0.18)" }} />
                  {isScanningMesh && (
                    <div style={{ position: "absolute", inset: 0, borderRadius: "50%", border: "2px solid rgba(0,238,255,0.5)", animation: "pulse 1.4s infinite" }} />
                  )}
                  <div style={{ width: 14, height: 14, borderRadius: "50%", background: "#00eeff", boxShadow: "0 0 12px rgba(0,238,255,0.9)" }} />
                  {meshNodes.map((node, i) => (
                    <div
                      key={i}
                      title={`${node.id} - ${node.signal}`}
                      style={{
                        position: "absolute",
                        top: `${node.top}%`,
                        left: `${node.left}%`,
                        width: 10,
                        height: 10,
                        borderRadius: "50%",
                        background: "#4ade80",
                        boxShadow: "0 0 10px #4ade80",
                      }}
                    />
                  ))}
                </div>
                <button onClick={scanMeshNetwork} disabled={isScanningMesh}>
                  {isScanningMesh ? "Balayage en cours..." : "Scanner le rÃ©seau"}
                </button>
                <div style={{ marginTop: 10 }}>
                  {meshNodes.map((node) => (
                    <p key={node.id} style={{ margin: "4px 0" }}>
                      {node.id} - {node.type} - {node.dist} - {node.signal}
                    </p>
                  ))}
                </div>
              </div>
            </div>

            <div className="grid two">
              <div className="card">
                <h3>Alertes</h3>
                {(notifications || []).slice(0, 6).map((n) => (
                  <div key={n.id} style={{ borderLeft: `2px solid ${n.type === "warning" ? "#ffb86b" : "#00eeff"}`, paddingLeft: 10, marginBottom: 8 }}>
                    <p style={{ margin: 0 }}>{n.text}</p>
                    <small className="muted">{n.time}</small>
                  </div>
                ))}
              </div>

              <div className="card">
                <h3>Appareils</h3>
                <p className="ok">Cet appareil : MaÃ®tre / ContrÃ´leur</p>
                <p className={externalDeviceConnected ? "ok" : "muted"}>
                  Module SDR Externe: {externalDeviceConnected ? "ConnectÃ©" : "Non dÃ©tectÃ© (USB/Bluetooth)"}
                </p>
                <div className="row">
                  <button onClick={() => setExternalDeviceConnected(true)}>Appairer module</button>
                  <button onClick={() => setExternalDeviceConnected(false)}>Retirer module</button>
                </div>
              </div>

              <div className="card">
                <h3>MAMO tCV Station</h3>
                <p className="muted">Station decentralisee complete: identite, wallet, mesh, SDR, snapshots, journal et coffre portable.</p>
                <p className={hasPremiumAccess ? "ok" : "warn"}>
                  {hasPremiumAccess ? "Acces disponible sur cet environnement." : `Acces premium requis (${ELITE_PRICE_LABEL}).`}
                </p>
                <div className="row">
                  <button onClick={() => setActiveTab("tcv")}>Ouvrir MAMO tCV</button>
                  {!hasPremiumAccess && <button onClick={() => setShowUpgradeModal(true)}>Debloquer</button>}
                </div>
              </div>

              <div className="card">
                <h3>Mamo Stream Pro</h3>
                <p className="muted">Moteur prive d'agregation pour redistribuer wallet, banking, web3, defender et futures donnees SDR live vers les autres modules.</p>
                <p className={hasPrivateAccess ? "ok" : "warn"}>
                  {hasPrivateAccess ? "Acces prive autorise sur cet environnement." : "Reserve a toi en local ou a une session Chef."}
                </p>
                <div className="row">
                  <button onClick={() => setActiveTab("streampro")}>Ouvrir Stream Pro</button>
                </div>
              </div>
            </div>
          </section>
        )}

        {activeTab === "banking" && (
          <section className="panel glass neon">
            <h2>IntÃ©gration bancaire : Plaid / Stripe / AML-KYC avec MetaMask</h2>
            <p className="muted">
              {"Connexion wallet, conformite KYC et rails de paiement. Le compte Standard peut connecter son wallet; les achats MAMO restent reserves a Elite/Chef."}
            </p>

            <div className="grid two">
              <div className="card">
                <h3>1) Wallet & Session (MetaMask)</h3>
                <div className="row">
                  <input value={userAddress} onChange={(e) => setUserAddress(e.target.value)} />
                  <button onClick={connectWallet}>Connect Wallet</button>
                </div>
                <p>Session: {walletConnected ? "active" : "inactive"}</p>
                <p>JWT: {walletJwt ? `${walletJwt.slice(0, 24)}...` : "-"}</p>
              </div>

              <div className="card">
                <h3>2) Compliance KYC/AML</h3>
                <p>Statut KYC: {kycStatus}</p>
                <div className="row">
                  <button onClick={initiateKyc}>Initier KYC</button>
                  <button onClick={checkKycStatus}>VÃ©rifier statut</button>
                  {isLocalDevHost && <button onClick={approveKycDev}>Approve (dev)</button>}
                </div>
                <p className={kycStatus === "approved" ? "ok" : "warn"}>
                  {kycStatus === "approved" ? "KYC validÃ©: achats autorisÃ©s." : "KYC requis avant achat."}
                </p>
              </div>
            </div>

            {!isElite ? (
              <div className="card">
                <h3>3) Fonctions Elite verrouillees</h3>
                <p className="warn">
                  Le compte Standard peut connecter son wallet et preparer le KYC. Les achats MAMO, confirmations et le ledger complet restent reserves aux profils Elite Quantum ou Chef.
                </p>
                <button onClick={() => setShowUpgradeModal(true)}>Ouvrir modal Elite</button>
              </div>
            ) : (
              <div className="grid two">
                <div className="card">
                  <h3>3) Fund / Buy MAMO</h3>
                  <label>
                    MÃ©thode
                    <select value={purchaseMethod} onChange={(e) => setPurchaseMethod(e.target.value)}>
                      <option value="stripe">Buy with Card (Stripe)</option>
                      <option value="plaid">Bank Transfer (Plaid)</option>
                    </select>
                  </label>
                  <label>
                    Montant (USD)
                    <input value={purchaseAmount} onChange={(e) => setPurchaseAmount(e.target.value)} />
                  </label>
                  <div className="row">
                    <button onClick={initiatePurchase}>/api/purchase/initiate</button>
                    <button onClick={() => confirmLastOrder(purchaseMethod)}>Simuler webhook succÃ¨s</button>
                  </div>
                  <p>Dernier ordre: {lastOrder?.order_id || "-"}</p>
                  <p>Payload paiement: {lastOrder?.clientSecret || lastOrder?.transfer_id || "-"}</p>
                </div>

                <div className="card">
                  <h3>4) Ledger des ordres</h3>
                  <div className="table-wrap">
                    <table className="bloomberg">
                      <thead>
                        <tr>
                          <th>Order</th>
                          <th>MÃ©thode</th>
                          <th>Fiat</th>
                          <th>Tokens</th>
                          <th>Statut</th>
                          <th>Tx</th>
                        </tr>
                      </thead>
                      <tbody>
                        {orders.map((o) => (
                          <tr key={o.order_id}>
                            <td>{o.order_id.slice(0, 14)}...</td>
                            <td>{o.method}</td>
                            <td>{o.amount_fiat}</td>
                            <td>{o.amount_tokens}</td>
                            <td>{o.status}</td>
                            <td>
                              {o.tx_hash ? (
                                <a href={`https://polygonscan.com/tx/${o.tx_hash}`} target="_blank" rel="noreferrer">
                                  {o.tx_hash.slice(0, 12)}...
                                </a>
                              ) : (
                                "-"
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            <div className="card">
              <h3>Ã‰tat orchestration</h3>
              <p>{bankingMessage}</p>
              <p className="muted">
                {"Flow live: Wallet auth -> KYC approved -> purchase initiate -> Stripe/Plaid webhook -> mint ERC-1155."}
              </p>
            </div>
          </section>
        )}

        {activeTab === "economy" && !hasChefSession && (
          <section className="panel glass neon">
            <h2>Economie MAMO - Zone Chef uniquement</h2>
            <p className="warn">
              {isChef
                ? isLocalDevHost
                  ? "Session Chef backend requise. Debloque Chef avec signature wallet."
                  : chefPublicMessage
                : "Acces reserve au Chef."}
            </p>
          </section>
        )}

        {activeTab === "economy" && hasChefSession && (
          <EconomyModule api={API} digitalId={digitalId} userAddress={userAddress} chefId={CHEF_ID} authToken={walletJwt} />
        )}

        {activeTab === "web3" && !isElite && (
          <section className="panel glass neon">
            <h2>Web3 Mamora Quantum Bank - Zone VIP verrouillee</h2>
            <p className="warn">Acces Elite Quantum requis pour ce module Web3.</p>
            <button onClick={() => setShowUpgradeModal(true)}>Forger SBT Elite</button>
          </section>
        )}

        {activeTab === "web3" && isElite && (
          <section className="panel glass neon web3-panel">
            <h2>Architecture d'assemblage : Web3 Mamora Quantum Bank</h2>
            <p className="muted">
              {"RewardSystem -> /api/mamora/mint, balance sync -> /api/web3/balance, defender ping, validation >95%, and mining history from blockchain-style events."}
            </p>

            <div className="grid two">
              <div className="card">
                <h3>Wallet + Security</h3>
                <div className="row">
                  <input value={userAddress} onChange={(e) => setUserAddress(e.target.value)} />
                  <button onClick={() => loadBalance()}>Sync Balance</button>
                </div>
                <p>Balance in Wei: {balanceWei}</p>
                <p className={defender.status === "ok" ? "ok" : "warn"}>
                  {defender.status === "ok" ? "Shield: Network Secured" : "Shield: Defender issue"}
                </p>
              </div>

              <div className="card">
                <h3>{"RewardSystem -> ERC-1155 mint"}</h3>
                <p>Total mine pending: {rewards.totalMined.toLocaleString()}</p>
                <p>Last record: {rewards.lastRecordId || "none"}</p>
                <button disabled={mintDisabled} onClick={claimReward}>
                  {"Claim -> /api/mamora/mint"}
                </button>
              </div>
            </div>

            <div className="card">
              <h3>{"Bridge MAMO -> wMAMO (Proof of Entanglement)"}</h3>
              <div className="row">
                <input value={bridgeAmount} onChange={(e) => setBridgeAmount(e.target.value)} />
                <button onClick={generateBridgeProof}>Generate Proof</button>
                <button onClick={verifyBridgeProof}>Verify Proof</button>
              </div>
              {bridgeProof && <pre>{JSON.stringify(bridgeProof, null, 2)}</pre>}
              {bridgeVerify && <pre>{JSON.stringify(bridgeVerify, null, 2)}</pre>}
            </div>

            <div className="grid two">
              <div className="card">
                <h3>Entanglement Visualizer</h3>
                <EntanglementVisualizer state={miningState} isMining={isMining} />
                <div className="row compact">
                  <button onClick={() => setIsMining(true)} disabled={isMining}>
                    Start Mining
                  </button>
                  <button onClick={() => setIsMining(false)} disabled={!isMining}>
                    Stop Mining
                  </button>
                </div>
              </div>

              <div className="card">
                <h3>Mining Controls</h3>
                <label>
                  Qubits: {config.qubitCount}
                  <input
                    type="range"
                    min="4"
                    max="16"
                    step="2"
                    value={config.qubitCount}
                    onChange={(e) => setConfig((p) => ({ ...p, qubitCount: Number(e.target.value) }))}
                  />
                </label>
                <label>
                  Depth: {config.entanglementDepth}
                  <input
                    type="range"
                    min="1"
                    max="5"
                    value={config.entanglementDepth}
                    onChange={(e) => setConfig((p) => ({ ...p, entanglementDepth: Number(e.target.value) }))}
                  />
                </label>
                <label>
                  Coherence boost: {config.coherenceBoost.toFixed(1)}x
                  <input
                    type="range"
                    min="8"
                    max="20"
                    value={config.coherenceBoost * 10}
                    onChange={(e) => setConfig((p) => ({ ...p, coherenceBoost: Number(e.target.value) / 10 }))}
                  />
                </label>
                <label>
                  Noise reduction: {(config.noiseReduction * 100).toFixed(0)}%
                  <input
                    type="range"
                    min="0"
                    max="90"
                    step="5"
                    value={config.noiseReduction * 100}
                    onChange={(e) => setConfig((p) => ({ ...p, noiseReduction: Number(e.target.value) / 100 }))}
                  />
                </label>
                <label>
                  Algorithm
                  <select value={config.algorithm} onChange={(e) => setConfig((p) => ({ ...p, algorithm: e.target.value }))}>
                    <option value="bell_state">Bell State</option>
                    <option value="ghz_state">GHZ State</option>
                    <option value="cluster_state">Cluster State</option>
                  </select>
                </label>
                <p>
                  Quality: {(miningState.entanglementQuality * 100).toFixed(2)}% | Efficiency:{" "}
                  {(miningState.efficiency * 100).toFixed(2)}%
                </p>
              </div>
            </div>

            <div className="card">
              <h3>Audit Log / Mining History</h3>
              <div className="table-wrap">
                <table className="bloomberg">
                  <thead>
                    <tr>
                      <th>Timestamp</th>
                      <th>Action</th>
                      <th>Status</th>
                      <th>Tx Hash</th>
                      <th>Details</th>
                    </tr>
                  </thead>
                  <tbody>
                    {auditLog.map((e) => (
                      <tr key={e.id}>
                        <td>{new Date(e.timestamp).toLocaleTimeString()}</td>
                        <td>{e.action}</td>
                        <td>{e.status}</td>
                        <td>
                          {e.transactionHash ? (
                            <a href={`https://polygonscan.com/tx/${e.transactionHash}`} target="_blank" rel="noreferrer">
                              {String(e.transactionHash).slice(0, 14)}...
                            </a>
                          ) : (
                            "-"
                          )}
                        </td>
                        <td>{JSON.stringify(e.details || {})}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </section>
        )}

        {activeTab === "ipfs" && (
          <section className="panel glass neon">
            <DreamboxModule />
          </section>
        )}

        {activeTab === "ai" && !hasChefSession && (
          <section className="panel glass neon">
            <h2>Command Center IA - Zone Chef uniquement</h2>
            <p className="warn">
              {isChef
                ? isLocalDevHost
                  ? "Session Chef backend requise. Debloque Chef avec signature wallet."
                  : chefPublicMessage
                : "Acces reserve au Chef."}
            </p>
          </section>
        )}

        {activeTab === "ai" && hasChefSession && (
          <section className="panel glass neon">
            <h2>Command Center IA</h2>
            <div className="chat">
              {messages.map((m, i) => (
                <div key={i} className={m.role === "user" ? "msg user" : "msg assistant"}>
                  {m.text}
                </div>
              ))}
            </div>
            <div className="row">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                placeholder="Talk to MAMO..."
              />
              <button onClick={sendMessage}>Send</button>
            </div>
          </section>
        )}

        {activeTab === "defender" && !hasChefSession && (
          <section className="panel glass neon">
            <h2>MAMO Defender PRO - Zone Chef uniquement</h2>
            <p className="warn">
              {isChef
                ? isLocalDevHost
                  ? "Session Chef backend requise. Debloque Chef avec signature wallet."
                  : chefPublicMessage
                : "Acces reserve au Chef."}
            </p>
          </section>
        )}

        {activeTab === "defender" && hasChefSession && (
          <MamoDefenderPro api={API} authToken={walletJwt} userAddress={userAddress} isLocalDevHost={isLocalDevHost} />
        )}

        {activeTab === "simq" && <SimqModule />}

        {activeTab === "cdn" && <MamoCdn api={API} authToken={walletJwt} userAddress={userAddress} />}

        {activeTab === "tcv" && !hasPremiumAccess && (
          <section className="panel glass neon">
            <h2>MAMO tCV - Zone premium</h2>
            <p className="warn">
              MAMO tCV est reserve aux profils Elite Quantum ou Chef en public. Sur ton environnement local, l'acces reste libre pour Capitaine Refractaire.
            </p>
            <button onClick={() => setShowUpgradeModal(true)}>Activer l'acces premium</button>
          </section>
        )}

        {activeTab === "tcv" && hasPremiumAccess && <MamoTcvStation />}

        {activeTab === "streampro" && !hasPrivateAccess && (
          <section className="panel glass neon">
            <h2>Mamo Stream Pro - Moteur prive</h2>
            <p className="warn">
              Ce moteur reste reserve a Capitaine Refractaire en local ou a une session Chef validee. Il n'est pas expose au public.
            </p>
          </section>
        )}

        {activeTab === "streampro" && hasPrivateAccess && (
          <MamoStreamPro api={API} authToken={walletJwt} userAddress={userAddress} isLocalDevHost={isLocalDevHost} />
        )}

        {activeTab === "telecom" && (
          <section className="panel glass neon">
            <h2>Mamo telecom</h2>
            <p className="muted">Comms P2P privÃ© : flux mesh, chat sÃ©curisÃ©, cam-to-cam, recherche de pairs.</p>
            <MamoTelecom api={API} authToken={walletJwt} userAddress={userAddress} isLocalDevHost={isLocalDevHost} />
          </section>
        )}

        {activeTab === "meteo" && <MamoMeteo />}

        {activeTab === "options" && (
          <section className="panel glass neon">
            <h2>Options Digital ID</h2>
            <p className="muted">Gestion de la session signee wallet et des droits Standard / Elite / Chef.</p>
            <div className="grid two">
              <div className="card">
                <h3>Session active</h3>
                <p>ID: {digitalId?.id}</p>
                <p>Role: {isChef ? CHEF_PLAN : isElite ? ELITE_PLAN : STANDARD_PLAN}</p>
                <p>Creee: {digitalId?.createdAt ? new Date(digitalId.createdAt).toLocaleString() : "-"}</p>
                <p className={walletVerified ? "ok" : "warn"}>
                  Wallet: {walletVerified ? `${shortenAddress(walletAddress)} (signe)` : "Non signe"}
                </p>
                <p>Timeout restant: {remainingMinutes} min</p>
                <p className="muted">Session hash: {sessionMeta?.sessionHash ? `${sessionMeta.sessionHash.slice(0, 18)}...` : "-"}</p>
              </div>

              <div className="card">
                <h3>Upgrade Elite</h3>
                <p>Prix de reference: {ELITE_PRICE_LABEL}</p>
                <p className={isElite ? "ok" : "warn"}>{isElite ? "Acces Elite actif" : "Acces Elite verrouille"}</p>
                <button onClick={() => setShowUpgradeModal(true)} disabled={isElite}>
                  {isElite ? "Deja Elite" : "Forger SBT Elite"}
                </button>
              </div>
            </div>

            {isChef && (
              <div className="card" style={{ marginTop: 12 }}>
                <h3>Console Chef - Generation de cles Elite a vie</h3>
                <div className="row">
                  <input
                    value={grantId}
                    onChange={(e) => setGrantId(e.target.value)}
                    placeholder="ID utilisateur cible"
                  />
                  <button onClick={handleGrantElite}>Generer cle Elite</button>
                </div>
                {generatedCode && (
                  <p className="ok" style={{ marginTop: 8 }}>
                    Cle generee: {generatedCode}
                  </p>
                )}
                <p className="muted" style={{ marginTop: 8 }}>
                  Cles recentes: {eliteAccessCodes.slice(0, 3).map((c) => `${c.code}${c.used ? " (used)" : ""}`).join(" | ") || "-"}
                </p>
              </div>
            )}

            <div className="row">
              <button onClick={() => handleLogout(false)}>Verrouiller l&apos;entree</button>
              <button
                onClick={() => {
                  localStorage.removeItem("mamo-digital-id");
                  localStorage.removeItem("mamo-production-session");
                  handleLogout(true);
                }}
              >
                Supprimer l&apos;ID local
              </button>
            </div>
          </section>
        )}
      </main>

      {showUpgradeModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.72)",
            display: "grid",
            placeItems: "center",
            zIndex: 99,
            padding: 16,
          }}
        >
          <div className="panel glass neon" style={{ maxWidth: 560, width: "100%" }}>
            <h2>Acces Restreint : Zone Haute Securite</h2>
            <p className="muted">
              Banking et Web3 Mamora Quantum Bank sont reserves aux profils Elite Quantum et Chef.
            </p>
            <div className="card" style={{ marginTop: 10 }}>
              <p>Pass a forger: {ELITE_PLAN}</p>
              <p>Tarif: {ELITE_PRICE_LABEL}</p>
            </div>
            <div className="row" style={{ marginTop: 10 }}>
              <button onClick={handleForgeElite} disabled={isForging || isAuthenticating}>
                {isForging || isAuthenticating ? "Forge en cours..." : `Forger le SBT Elite (${ELITE_PRICE_LABEL})`}
              </button>
              <button onClick={() => setShowUpgradeModal(false)}>Fermer</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
