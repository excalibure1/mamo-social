import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
  ExternalLink,
  Globe,
  Loader2,
  MapPin,
  Maximize2,
  MonitorPlay,
  Pause,
  Play,
  Terminal,
  Volume2,
  VolumeX,
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

const SYNC_LINES = [
  "> INITIALISATION MAMO TITAN V7.2...",
  "> CHARGEMENT DES COUCHES CANADA & INTERNATIONAL...",
  "> INDEXATION DES 12 NODES CINEMA P2P...",
  "> ACTIVATION DU MOTEUR DE PREVIEW...",
  "> TUNNEL SAINT-GABRIEL : OPTIMISE.",
  "> HUB OPERATIONNEL.",
];

let hlsLoaderPromise = null;

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

export default function MamoCdn() {
  const playerVideoRef = useRef(null);
  const hlsRef = useRef(null);
  const playerRootRef = useRef(null);
  const syncCancelledRef = useRef(false);
  const previewVideoRefs = useRef(new Map());
  const previewIntervalRef = useRef(0);
  const previewPlayPromiseRef = useRef(null);

  const [mode, setMode] = useState("hero");
  const [syncLines, setSyncLines] = useState([]);
  const [syncProgress, setSyncProgress] = useState(0);
  const [currentTab, setCurrentTab] = useState("P2P");
  const [playerItem, setPlayerItem] = useState(null);
  const [playerLoading, setPlayerLoading] = useState(false);
  const [playerMuted, setPlayerMuted] = useState(true);
  const [playerVolume, setPlayerVolume] = useState(0.8);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showUnmuteHint, setShowUnmuteHint] = useState(false);
  const [previewItemId, setPreviewItemId] = useState(null);
  const [previewRemaining, setPreviewRemaining] = useState(15);

  const mediaData = useMemo(() => {
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
      });
    }
    return generated.map((item) => ({
      ...item,
      nodeImage: buildNodeArt(item.color),
    }));
  }, []);

  const filteredItems = useMemo(
    () => mediaData.filter((item) => item.category === currentTab),
    [mediaData, currentTab]
  );

  useEffect(() => {
    return () => {
      syncCancelledRef.current = true;
      window.clearInterval(previewIntervalRef.current);
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, []);

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
    video.controls = false;

    const safePlay = async () => {
      try {
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

      video.src = playerItem.url || playerItem.fallbackUrl || DEFAULT_STREAM_URL;
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
      video.removeEventListener("error", onError);
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, [playerItem, playerMuted, playerVolume]);

  useEffect(() => {
    const video = playerVideoRef.current;
    if (!video) return;
    video.muted = playerMuted;
    video.volume = playerVolume;
  }, [playerMuted, playerVolume]);

  const startConnection = async () => {
    syncCancelledRef.current = false;
    setMode("sync");
    setSyncLines([]);
    setSyncProgress(0);

    for (let i = 0; i < SYNC_LINES.length; i += 1) {
      if (syncCancelledRef.current) return;
      // Small staging delay for terminal-like feel.
      // This makes the handoff to the shell feel more deliberate.
      // eslint-disable-next-line no-await-in-loop
      await new Promise((resolve) => window.setTimeout(resolve, 550));
      setSyncLines((prev) => [...prev, SYNC_LINES[i]]);
      setSyncProgress(Math.round(((i + 1) / SYNC_LINES.length) * 100));
    }

    if (syncCancelledRef.current) return;
    await new Promise((resolve) => window.setTimeout(resolve, 700));
    if (!syncCancelledRef.current) setMode("app");
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

    setPreviewItemId(item.id);
    setPreviewRemaining(15);
    video.currentTime = 0;
    video.muted = true;
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
    setShowUnmuteHint(item.source !== "youtube");
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
            <div className="cdn-sync-bar" style={{ width: `${syncProgress}%` }} />
            <Loader2 size={44} color="#06b6d4" className="spin" />
            <p className="cdn-sync-status">Chargement des 12 Nodes Cinema...</p>
            <div className="cdn-sync-logs">
              {syncLines.map((line) => (
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
              <span>Saint-Gabriel Hub Active</span>
            </div>
          </header>

          <div className="cdn-main">
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
                          src={item.url || ""}
                          muted
                          loop
                          playsInline
                          className="cdn-preview-video"
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
                      <span>{item.kind === "p2p" ? `PEERS: ${item.peers}` : "LIVE STREAM"}</span>
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
