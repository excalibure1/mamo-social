import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Activity,
  ChevronRight,
  FileText,
  Globe,
  Loader2,
  Lock,
  MessageSquare,
  Mic,
  MicOff,
  Paperclip,
  PhoneOff,
  RefreshCw,
  Search,
  Send,
  Shield,
  Trash2,
  UserCircle,
  UserPlus,
  Users,
  Video,
  VideoOff,
  X,
} from "lucide-react";

const FALLBACK_CONTACTS = [
  { id: "mesh-core", name: "MAMO Mesh Core", alias: "@mesh_core", status: "offline", type: "trusted", meta: "Service en attente" },
  { id: "defender-core", name: "Defender Core", alias: "@defender_core", status: "offline", type: "trusted", meta: "Defender non synchronise" },
];

const FALLBACK_FEED = [
  {
    id: "fallback-feed-1",
    author: "MAMO Mesh",
    text: "Le hub de distribution attend le prochain snapshot mesh.",
    time: "--:--:--",
    isSystem: true,
    severity: "warning",
  },
];

function shortAddress(value) {
  if (!value) return "Moi (Local)";
  if (value.length < 12) return value;
  return `${value.slice(0, 6)}...${value.slice(-4)}`;
}

function buildHubUrl(api, userAddress) {
  const base = api("/api/platform/signal-hub");
  const params = new URLSearchParams({ logLimit: "10" });
  if (userAddress) params.set("walletAddress", userAddress);
  return `${base}?${params.toString()}`;
}

function dedupeContacts(contacts) {
  const map = new Map();
  contacts.forEach((contact) => {
    if (!contact?.id) return;
    if (!map.has(contact.id)) map.set(contact.id, contact);
  });
  return Array.from(map.values());
}

function normalizeContacts(rawContacts = []) {
  if (!Array.isArray(rawContacts) || !rawContacts.length) return FALLBACK_CONTACTS;
  return rawContacts.map((contact, index) => ({
    id: contact.id || `remote-contact-${index}`,
    name: contact.name || "Node MAMO",
    alias: contact.alias || `@node_${index + 1}`,
    status: contact.status === "online" ? "online" : "offline",
    type: contact.type || "peer",
    meta: contact.meta || "",
    source: "remote",
  }));
}

function normalizeFeed(rawFeed = []) {
  if (!Array.isArray(rawFeed) || !rawFeed.length) return FALLBACK_FEED;
  return rawFeed.map((entry, index) => ({
    id: entry.id || `remote-feed-${index}`,
    author: entry.author || "MAMO Mesh",
    text: entry.text || "Message distribue",
    time: entry.time || "--:--:--",
    isSystem: Boolean(entry.isSystem),
    severity: entry.severity || "ok",
    timestampUtc: entry.timestampUtc || "",
  }));
}

function VideoCallInterface({ contact, onHangUp }) {
  const [isCamOn, setIsCamOn] = useState(true);
  const [isMicOn, setIsMicOn] = useState(true);
  const [callDuration, setCallDuration] = useState(0);
  const [mediaError, setMediaError] = useState(null);
  const localVideoRef = useRef(null);
  const streamRef = useRef(null);
  const [localStream, setLocalStream] = useState(null);

  const setActiveStream = (stream) => {
    streamRef.current = stream;
    setLocalStream(stream);
    if (localVideoRef.current) localVideoRef.current.srcObject = stream || null;
  };

  const stopAllTracks = (stream) => {
    if (!stream) return;
    stream.getTracks().forEach((track) => {
      try {
        track.stop();
      } catch {
        // no-op
      }
    });
  };

  useEffect(() => {
    const startMedia = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        setActiveStream(stream);
      } catch {
        setMediaError("Permission refusee ou camera introuvable.");
        setIsCamOn(false);
        setIsMicOn(false);
      }
    };
    startMedia();
    return () => {
      stopAllTracks(streamRef.current);
      setActiveStream(null);
    };
  }, []);

  useEffect(() => {
    if (!localStream) return;
    localStream.getVideoTracks().forEach((track) => {
      track.enabled = isCamOn;
    });
  }, [isCamOn, localStream]);

  useEffect(() => {
    if (!localStream) return;
    localStream.getAudioTracks().forEach((track) => {
      track.enabled = isMicOn;
    });
  }, [isMicOn, localStream]);

  useEffect(() => {
    const timer = setInterval(() => setCallDuration((prev) => prev + 1), 1000);
    return () => clearInterval(timer);
  }, []);

  const handleToggleCamera = async () => {
    const current = streamRef.current;
    if (!current) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        setActiveStream(stream);
        setIsCamOn(true);
        setIsMicOn(true);
        setMediaError(null);
      } catch {
        setMediaError("Impossible de reactiver la camera.");
      }
      return;
    }

    if (isCamOn) {
      current.getVideoTracks().forEach((track) => {
        try {
          track.stop();
          current.removeTrack(track);
        } catch {
          // no-op
        }
      });
      setIsCamOn(false);
      return;
    }

    try {
      const camOnly = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
      const newTrack = camOnly.getVideoTracks()[0];
      current.addTrack(newTrack);
      setActiveStream(current);
      setIsCamOn(true);
      setMediaError(null);
    } catch {
      setMediaError("Impossible de reactiver la camera.");
      setIsCamOn(false);
    }
  };

  const handleHangUp = () => {
    stopAllTracks(streamRef.current);
    setActiveStream(null);
    onHangUp();
  };

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60)
      .toString()
      .padStart(2, "0");
    const s = (seconds % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  return (
    <div className="telecom-window">
      <div className="telecom-header">
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <Shield size={16} style={{ color: "#22c55e" }} />
          <div>
            <strong style={{ color: "#fff" }}>Lien securise : {contact.name}</strong>
            <div className="telecom-muted">E2EE | Latence locale | Canal prive</div>
          </div>
        </div>
        <div className="telecom-chip">{formatTime(callDuration)}</div>
      </div>

      <div className="telecom-body two-cols">
        <div className="telecom-video-card">
          <div className="telecom-overlay">Reception du flux de {contact.alias}...</div>
          <UserCircle size={64} style={{ color: "#475569" }} />
        </div>
        <div className="telecom-video-card">
          <video ref={localVideoRef} autoPlay playsInline muted className={isCamOn ? "telecom-video" : "telecom-video hidden"} />
          {(!isCamOn || mediaError) && (
            <div className="telecom-overlay">
              <VideoOff size={28} />
              <div>{mediaError || "Camera desactivee"}</div>
            </div>
          )}
        </div>
      </div>

      <div className="telecom-controls">
        <button className={isMicOn ? "telecom-btn" : "telecom-btn danger"} onClick={() => setIsMicOn((value) => !value)}>
          {isMicOn ? <Mic size={18} /> : <MicOff size={18} />}
        </button>
        <button className="telecom-btn hangup" onClick={handleHangUp}>
          <PhoneOff size={20} />
        </button>
        <button className={isCamOn ? "telecom-btn" : "telecom-btn danger"} onClick={handleToggleCamera}>
          {isCamOn ? <Video size={18} /> : <VideoOff size={18} />}
        </button>
      </div>
    </div>
  );
}

function PrivateChat({ contact }) {
  const [messages, setMessages] = useState([{ id: 1, sender: "them", text: "Connexion etablie. Tu me recois ?", time: "12:00" }]);
  const [input, setInput] = useState("");

  const handleSend = (event) => {
    event.preventDefault();
    if (!input.trim()) return;
    setMessages((prev) => [
      ...prev,
      { id: Date.now(), sender: "me", text: input, time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) },
    ]);
    setInput("");
  };

  return (
    <div className="telecom-window">
      <div className="telecom-header">
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div className="telecom-dot online" />
          <strong style={{ color: "#fff" }}>Chat prive : {contact.name}</strong>
        </div>
        <Lock size={16} style={{ color: "#22c55e" }} />
      </div>

      <div className="telecom-feed">
        {messages.map((msg) => (
          <div key={msg.id} className={`telecom-msg ${msg.sender === "me" ? "me" : "them"}`}>
            <p>{msg.text}</p>
            <small>{msg.time}</small>
          </div>
        ))}
      </div>

      <form onSubmit={handleSend} className="telecom-input-row">
        <input
          type="text"
          value={input}
          onChange={(event) => setInput(event.target.value)}
          placeholder={`Message securise a ${contact.name}...`}
        />
        <button type="submit">
          <Send size={16} />
        </button>
      </form>
    </div>
  );
}

export default function MamoTelecom({ api = (path) => path, authToken = "", userAddress = "", isLocalDevHost = false }) {
  const [activeView, setActiveView] = useState("feed");
  const [selectedContact, setSelectedContact] = useState(null);
  const [expandedContactId, setExpandedContactId] = useState(null);
  const [remoteContacts, setRemoteContacts] = useState(FALLBACK_CONTACTS);
  const [manualContacts, setManualContacts] = useState([]);
  const [dismissedContactIds, setDismissedContactIds] = useState([]);
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchingNetwork, setIsSearchingNetwork] = useState(false);
  const [remoteMeshMessages, setRemoteMeshMessages] = useState(FALLBACK_FEED);
  const [localMeshMessages, setLocalMeshMessages] = useState([]);
  const [meshInput, setMeshInput] = useState("");
  const [isMeshBroadcasting, setIsMeshBroadcasting] = useState(false);
  const [meshStream, setMeshStream] = useState(null);
  const [isRefreshingHub, setIsRefreshingHub] = useState(false);
  const [hubError, setHubError] = useState("");
  const [hubSnapshot, setHubSnapshot] = useState(null);
  const [lastHubSync, setLastHubSync] = useState("");
  const meshVideoRef = useRef(null);
  const fileInputRef = useRef(null);

  const operatorLabel = userAddress ? shortAddress(userAddress) : isLocalDevHost ? "Capitaine Refractaire" : "Moi (Local)";

  const contacts = useMemo(
    () =>
      dedupeContacts([...manualContacts, ...remoteContacts]).filter(
        (contact) => !dismissedContactIds.includes(contact.id)
      ),
    [dismissedContactIds, manualContacts, remoteContacts]
  );

  const meshMessages = useMemo(() => [...remoteMeshMessages, ...localMeshMessages], [localMeshMessages, remoteMeshMessages]);
  const telecomChannel = hubSnapshot?.telecom?.channel || {};
  const meshSnapshot = hubSnapshot?.mesh?.snapshot || null;
  const activeNodes = hubSnapshot?.telecom?.activeNodes || contacts.length || 0;

  const refreshTelecomHub = async (silent = false) => {
    if (!silent) setIsRefreshingHub(true);
    try {
      const headers = {};
      if (authToken) headers.Authorization = `Bearer ${authToken}`;
      const response = await fetch(buildHubUrl(api, userAddress), { headers });
      if (!response.ok) {
        throw new Error(`hub_${response.status}`);
      }
      const payload = await response.json();
      setHubSnapshot(payload);
      setRemoteContacts(normalizeContacts(payload?.telecom?.contacts));
      setRemoteMeshMessages(normalizeFeed(payload?.telecom?.meshFeed));
      setHubError("");
      setLastHubSync(new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }));
    } catch (error) {
      setHubError(String(error?.message || "hub_unavailable"));
    } finally {
      if (!silent) setIsRefreshingHub(false);
    }
  };

  useEffect(() => {
    refreshTelecomHub(false);
    const intervalId = window.setInterval(() => {
      refreshTelecomHub(true);
    }, 8000);
    return () => window.clearInterval(intervalId);
  }, [api, authToken, userAddress]);

  const startCommunication = (contact, type) => {
    setSelectedContact(contact);
    setActiveView(type);
  };

  const removeContact = (contactId) => {
    setManualContacts((prev) => prev.filter((contact) => contact.id !== contactId));
    setDismissedContactIds((prev) => (prev.includes(contactId) ? prev : [...prev, contactId]));
    if (expandedContactId === contactId) setExpandedContactId(null);
    if (selectedContact?.id === contactId) {
      setSelectedContact(null);
      setActiveView("feed");
    }
  };

  const endCommunication = () => {
    setActiveView("feed");
    setSelectedContact(null);
  };

  const handleSearchPeer = (event) => {
    event.preventDefault();
    if (!searchQuery.trim()) return;
    setIsSearchingNetwork(true);
    setTimeout(() => {
      const alias = searchQuery.startsWith("@") ? searchQuery : `@${searchQuery}`;
      const newContact = {
        id: `manual-${Date.now()}`,
        name: "Pair MAMO ajoute",
        alias,
        status: "online",
        type: "peer",
        meta: "Ajout manuel depuis Telecom",
        source: "manual",
      };
      setManualContacts((prev) => [newContact, ...prev]);
      setDismissedContactIds((prev) => prev.filter((id) => id !== newContact.id));
      setSearchQuery("");
      setIsSearchingNetwork(false);
      setShowSearch(false);
    }, 900);
  };

  const handleSendMeshMessage = (event) => {
    event.preventDefault();
    if (!meshInput.trim()) return;
    const newMsg = {
      id: `local-msg-${Date.now()}`,
      author: operatorLabel,
      text: meshInput,
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
      isSystem: false,
      severity: "ok",
    };
    setLocalMeshMessages((prev) => [...prev, newMsg]);
    setMeshInput("");
  };

  const handleFileUpload = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const newMsg = {
      id: `local-file-${Date.now()}`,
      author: operatorLabel,
      text: `Fichier transfere : ${file.name} (${(file.size / 1024).toFixed(1)} KB)`,
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
      isSystem: false,
      isFile: true,
      severity: "ok",
    };
    setLocalMeshMessages((prev) => [...prev, newMsg]);
    event.target.value = "";
  };

  const toggleMeshBroadcast = async () => {
    if (isMeshBroadcasting) {
      if (meshStream) meshStream.getTracks().forEach((track) => track.stop());
      setMeshStream(null);
      setIsMeshBroadcasting(false);
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      setMeshStream(stream);
      setIsMeshBroadcasting(true);
    } catch {
      // no-op
    }
  };

  useEffect(() => {
    if (isMeshBroadcasting && meshVideoRef.current && meshStream) {
      meshVideoRef.current.srcObject = meshStream;
    }
  }, [isMeshBroadcasting, meshStream]);

  useEffect(
    () => () => {
      if (meshStream) meshStream.getTracks().forEach((track) => track.stop());
    },
    [meshStream]
  );

  return (
    <div className="telecom-layout">
      <aside className="telecom-side">
        <div className="telecom-card">
          <div style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "flex-start" }}>
            <div>
              <h3 style={{ margin: 0, color: "#fff" }}>MAMO TELECOM</h3>
              <p className="telecom-muted" style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <Activity size={12} /> Backbone mesh distribue
              </p>
            </div>
            <button className="telecom-icon-btn" onClick={() => refreshTelecomHub(false)} title="Rafraichir le hub">
              <RefreshCw size={15} className={isRefreshingHub ? "spin" : ""} />
            </button>
          </div>

          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 10 }}>
            <div className="telecom-chip" style={{ display: "inline-flex", gap: 6 }}>
              <UserCircle size={14} />
              {operatorLabel}
            </div>
            <div className="telecom-chip">{telecomChannel.frequencyMHz ? `${Number(telecomChannel.frequencyMHz).toFixed(3)} MHz` : "Canal en attente"}</div>
            <div className="telecom-chip">{telecomChannel.quality || "offline"}</div>
          </div>

          <div className="telecom-muted" style={{ marginTop: 10 }}>
            {telecomChannel.serviceRunning ? "Service mesh actif" : "Service mesh en attente"} | {activeNodes} noeuds | sync {lastHubSync || "--:--:--"}
          </div>
          {hubError ? <div className="warn" style={{ marginTop: 8 }}>Hub: {hubError}</div> : null}
        </div>

        <button className={activeView === "feed" ? "telecom-nav active" : "telecom-nav"} onClick={endCommunication}>
          <Globe size={16} /> Flux Mesh Global
        </button>

        <div className="telecom-card telecom-contacts">
          <div className="telecom-contacts-header">
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <Users size={16} />
              <strong>Pairs distribues</strong>
            </div>
            <button className="telecom-icon-btn" onClick={() => setShowSearch((value) => !value)}>
              <UserPlus size={15} />
            </button>
          </div>

          {showSearch && (
            <form onSubmit={handleSearchPeer} className="telecom-search-row">
              <input value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} placeholder="Alias P2P..." />
              <button type="submit" disabled={isSearchingNetwork || !searchQuery.trim()}>
                {isSearchingNetwork ? <Loader2 size={14} className="spin" /> : <Search size={14} />}
              </button>
            </form>
          )}

          <div className="telecom-contact-list">
            {contacts.map((contact) => (
              <div key={contact.id} className="telecom-contact">
                <div className="telecom-contact-main">
                  <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                    <span className={`telecom-dot ${contact.status === "online" ? "online" : "offline"}`} />
                    <div style={{ textAlign: "left" }}>
                      <div style={{ color: "#e2e8f0", fontSize: 13 }}>{contact.name}</div>
                      <div className="telecom-muted">{contact.alias}</div>
                      {contact.meta ? <div className="telecom-muted" style={{ fontSize: 11 }}>{contact.meta}</div> : null}
                    </div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <button
                      type="button"
                      className="telecom-trash-btn"
                      title={`Supprimer ${contact.name}`}
                      onClick={(event) => {
                        event.stopPropagation();
                        removeContact(contact.id);
                      }}
                    >
                      <Trash2 size={13} />
                    </button>
                    <button
                      type="button"
                      className="telecom-chevron-btn"
                      onClick={() => setExpandedContactId(expandedContactId === contact.id ? null : contact.id)}
                    >
                      <ChevronRight size={14} className={expandedContactId === contact.id ? "rotated" : ""} />
                    </button>
                  </div>
                </div>

                {expandedContactId === contact.id && (
                  <div className="telecom-contact-actions">
                    <button onClick={() => startCommunication(contact, "chat")} disabled={contact.status !== "online"}>
                      <MessageSquare size={14} /> Texte
                    </button>
                    <button onClick={() => startCommunication(contact, "video")} disabled={contact.status !== "online"}>
                      <Video size={14} /> Cam-to-Cam
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </aside>

      <section className="telecom-main">
        {activeView === "feed" && (
          <div className="telecom-window">
            <div className="telecom-header">
              <div>
                <h2 style={{ margin: 0, color: "#fff", display: "flex", gap: 8, alignItems: "center" }}>
                  <Globe size={18} /> Flux Mesh Distribue
                </h2>
                <p className="telecom-muted">
                  Canal prive alimente par le journal mesh JSONL | {activeNodes} noeuds | {meshSnapshot?.quality || "offline"}
                </p>
              </div>
              <div style={{ textAlign: "right" }}>
                <div className="telecom-chip">{meshSnapshot?.lockAcquired ? "LOCK" : "SEARCH"}</div>
                <div className="telecom-muted" style={{ marginTop: 6 }}>
                  SNR {meshSnapshot?.snrDb ?? "-"} dB | Latence {meshSnapshot?.scanDurationMs ?? "-"} ms
                </div>
              </div>
            </div>

            {hubError ? (
              <div className="telecom-msg system" style={{ marginBottom: 12 }}>
                <strong>Hub indisponible</strong>
                <p>Le flux reste local tant que l'agregateur backend ne repond pas.</p>
              </div>
            ) : null}

            <div className="telecom-feed">
              {meshMessages.map((msg) => (
                <div key={msg.id} className={`telecom-msg ${msg.isSystem ? "system" : "them"}`}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                    <strong style={{ fontSize: 12 }}>{msg.author}</strong>
                    <small>{msg.time}</small>
                  </div>
                  {msg.isFile ? (
                    <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                      <FileText size={14} />
                      <span>{msg.text}</span>
                    </div>
                  ) : (
                    <p>{msg.text}</p>
                  )}
                </div>
              ))}

              {isMeshBroadcasting && (
                <div className="telecom-live">
                  <div className="telecom-live-badge">
                    <Activity size={12} /> EN DIRECT
                  </div>
                  <video ref={meshVideoRef} autoPlay muted playsInline className="telecom-video" />
                  <button className="telecom-close-live" onClick={toggleMeshBroadcast}>
                    <X size={14} />
                  </button>
                </div>
              )}
            </div>

            <form onSubmit={handleSendMeshMessage} className="telecom-input-row">
              <input type="file" ref={fileInputRef} onChange={handleFileUpload} style={{ display: "none" }} />
              <button type="button" onClick={() => fileInputRef.current?.click()}>
                <Paperclip size={16} />
              </button>
              <button type="button" onClick={toggleMeshBroadcast} className={isMeshBroadcasting ? "danger" : ""}>
                <Video size={16} />
              </button>
              <input value={meshInput} onChange={(event) => setMeshInput(event.target.value)} placeholder="Message prive ou document a distribuer..." />
              <button type="submit">
                <Send size={16} />
              </button>
            </form>
          </div>
        )}

        {activeView === "chat" && selectedContact && <PrivateChat contact={selectedContact} />}
        {activeView === "video" && selectedContact && <VideoCallInterface contact={selectedContact} onHangUp={endCommunication} />}
      </section>
    </div>
  );
}
