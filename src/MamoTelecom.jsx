import React, { useEffect, useRef, useState } from "react";
import {
  Activity,
  Bell,
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
  Radio,
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

const MOCK_CONTACTS = [
  { id: "n1", name: "Mamo Alpha", alias: "@alpha_prime", status: "online", type: "trusted" },
  { id: "n2", name: "Station Delta", alias: "@delta_node", status: "online", type: "peer" },
  { id: "n3", name: "Observateur 77", alias: "@obs_77", status: "offline", type: "peer" },
];

const MOCK_MESH_FEED = [
  { id: 1, author: "Système", text: "Réseau P2P initialisé. Connexions chiffrées actives.", time: "12:00", isSystem: true },
  { id: 2, author: "Station Delta", text: "Quelqu'un capte le signal sur la fréquence 433 ?", time: "12:05", isSystem: false },
  { id: 3, author: "Mamo Alpha", text: "Affirmatif. Le relais fonctionne bien ici.", time: "12:08", isSystem: false },
];

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
        setMediaError("Permission refusée ou caméra introuvable.");
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
        setMediaError("Impossible de redémarrer la caméra.");
      }
      return;
    }

    if (isCamOn) {
      // Stop réel des tracks vidéo -> LED caméra s'éteint.
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
      setMediaError("Impossible de réactiver la caméra.");
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
            <strong style={{ color: "#fff" }}>Lien sécurisé : {contact.name}</strong>
            <div className="telecom-muted">E2EE • Latence: 24ms • Canal: P2P</div>
          </div>
        </div>
        <div className="telecom-chip">{formatTime(callDuration)}</div>
      </div>

      <div className="telecom-body two-cols">
        <div className="telecom-video-card">
          <div className="telecom-overlay">Réception du flux de {contact.alias}...</div>
          <UserCircle size={64} style={{ color: "#475569" }} />
        </div>
        <div className="telecom-video-card">
          <video ref={localVideoRef} autoPlay playsInline muted className={isCamOn ? "telecom-video" : "telecom-video hidden"} />
          {(!isCamOn || mediaError) && (
            <div className="telecom-overlay">
              <VideoOff size={28} />
              <div>{mediaError || "Caméra désactivée"}</div>
            </div>
          )}
        </div>
      </div>

      <div className="telecom-controls">
        <button className={isMicOn ? "telecom-btn" : "telecom-btn danger"} onClick={() => setIsMicOn((v) => !v)}>
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
  const [messages, setMessages] = useState([{ id: 1, sender: "them", text: "Connexion établie. Tu me reçois ?", time: "12:00" }]);
  const [input, setInput] = useState("");

  const handleSend = (e) => {
    e.preventDefault();
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
          <strong style={{ color: "#fff" }}>Chat Privé : {contact.name}</strong>
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
          onChange={(e) => setInput(e.target.value)}
          placeholder={`Message sécurisé à ${contact.name}...`}
        />
        <button type="submit">
          <Send size={16} />
        </button>
      </form>
    </div>
  );
}

export default function MamoTelecom() {
  const [activeView, setActiveView] = useState("feed");
  const [selectedContact, setSelectedContact] = useState(null);
  const [expandedContactId, setExpandedContactId] = useState(null);
  const [contacts, setContacts] = useState(MOCK_CONTACTS);
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchingNetwork, setIsSearchingNetwork] = useState(false);
  const [meshMessages, setMeshMessages] = useState(MOCK_MESH_FEED);
  const [meshInput, setMeshInput] = useState("");
  const [isMeshBroadcasting, setIsMeshBroadcasting] = useState(false);
  const [meshStream, setMeshStream] = useState(null);
  const meshVideoRef = useRef(null);
  const fileInputRef = useRef(null);

  const startCommunication = (contact, type) => {
    setSelectedContact(contact);
    setActiveView(type);
  };

  const removeContact = (contactId) => {
    setContacts((prev) => prev.filter((c) => c.id !== contactId));
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

  const handleSearchPeer = (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    setIsSearchingNetwork(true);
    setTimeout(() => {
      const newContact = {
        id: `n${Date.now()}`,
        name: "Nouveau Pair Mamo",
        alias: searchQuery.startsWith("@") ? searchQuery : `@${searchQuery}`,
        status: "online",
        type: "peer",
      };
      setContacts((prev) => [newContact, ...prev]);
      setSearchQuery("");
      setIsSearchingNetwork(false);
      setShowSearch(false);
    }, 1500);
  };

  const handleSendMeshMessage = (e) => {
    e.preventDefault();
    if (!meshInput.trim()) return;
    const newMsg = {
      id: Date.now(),
      author: "Moi (Local)",
      text: meshInput,
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      isSystem: false,
    };
    setMeshMessages((prev) => [...prev, newMsg]);
    setMeshInput("");
  };

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const newMsg = {
      id: Date.now(),
      author: "Moi (Local)",
      text: `Fichier transféré : ${file.name} (${(file.size / 1024).toFixed(1)} KB)`,
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      isSystem: false,
      isFile: true,
    };
    setMeshMessages((prev) => [...prev, newMsg]);
    e.target.value = "";
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
          <h3 style={{ margin: 0, color: "#fff" }}>MAMO TELECOM</h3>
          <p className="telecom-muted" style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <Activity size={12} /> Centre de comms privé
          </p>
          <div className="telecom-chip" style={{ marginTop: 10, display: "inline-flex", gap: 6 }}>
            <UserCircle size={14} />
            Moi (Local)
          </div>
        </div>

        <button className={activeView === "feed" ? "telecom-nav active" : "telecom-nav"} onClick={endCommunication}>
          <Globe size={16} /> Flux Mesh Global
        </button>

        <div className="telecom-card telecom-contacts">
          <div className="telecom-contacts-header">
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <Users size={16} />
              <strong>Pairs détectés</strong>
            </div>
            <button className="telecom-icon-btn" onClick={() => setShowSearch((v) => !v)}>
              <UserPlus size={15} />
            </button>
          </div>

          {showSearch && (
            <form onSubmit={handleSearchPeer} className="telecom-search-row">
              <input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Alias P2P..." />
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
                    </div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <button
                      type="button"
                      className="telecom-trash-btn"
                      title={`Supprimer ${contact.name}`}
                      onClick={(e) => {
                        e.stopPropagation();
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
                  <Globe size={18} /> Flux Mesh Décentralisé
                </h2>
                <p className="telecom-muted">Canal public • Nœuds actifs: 42</p>
              </div>
            </div>

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
                    <Radio size={12} /> EN DIRECT (PUBLIC)
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
              <input value={meshInput} onChange={(e) => setMeshInput(e.target.value)} placeholder="Message public ou document..." />
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
