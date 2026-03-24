import React, { useRef, useState } from "react";
import { Box, CheckCircle2, Image as ImageIcon, Info, Loader2, Sparkles, UploadCloud, Wallet } from "lucide-react";

export default function DreamboxModule() {
  const [walletConnected, setWalletConnected] = useState(false);
  const [walletAddress, setWalletAddress] = useState("");
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState("idle");
  const [statusMessage, setStatusMessage] = useState("");
  const [gallery, setGallery] = useState([
    {
      id: 1,
      title: "L'Écho de MAMO",
      description: "Première résonance dans la Dreambox.",
      imageUrl:
        "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=500&auto=format&fit=crop",
      cid: "ipfs://bafybeigdyrzt5sfp7udm7hu76uh7y26nf3efuylqabf3oclgtqy55fbzdi",
    },
  ]);

  const fileInputRef = useRef(null);

  const handleConnectWallet = () => {
    setTimeout(() => {
      setWalletAddress("0x71C...974E");
      setWalletConnected(true);
    }, 500);
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      const url = URL.createObjectURL(selectedFile);
      setPreviewUrl(url);
    }
  };

  const simulateIPFSUpload = async () =>
    new Promise((resolve) => {
      setTimeout(() => {
        resolve(`ipfs://bafy...${Math.random().toString(36).substring(2, 10)}`);
      }, 2500);
    });

  const simulateSmartContractMint = async () =>
    new Promise((resolve) => {
      setTimeout(() => resolve(true), 3000);
    });

  const handleMint = async (e) => {
    e.preventDefault();
    if (!walletConnected) {
      alert("Veuillez connecter votre portefeuille d'abord !");
      return;
    }
    if (!file || !title) return;

    try {
      setStatus("uploading");
      setStatusMessage("1/3 : Cristallisation sur IPFS...");
      const ipfsCid = await simulateIPFSUpload();

      setStatus("minting");
      setStatusMessage("2/3 : Signature du contrat intelligent MAMO...");
      await simulateSmartContractMint(ipfsCid);

      setStatus("success");
      setStatusMessage("Succès ! Œuvre immortalisée dans la Dreambox.");

      const newArtwork = {
        id: Date.now(),
        title,
        description,
        imageUrl: previewUrl,
        cid: ipfsCid,
      };
      setGallery((prev) => [newArtwork, ...prev]);

      setTimeout(() => {
        setStatus("idle");
        setFile(null);
        setPreviewUrl("");
        setTitle("");
        setDescription("");
      }, 4000);
    } catch {
      setStatus("error");
      setStatusMessage("Une distorsion est apparue lors de la création.");
    }
  };

  return (
    <div style={{ width: "100%" }}>
      <nav className="dreambox-nav">
        <div className="dreambox-brand">
          <div className="dreambox-logo">
            <Box className="w-6 h-6 text-white" />
          </div>
          <h1>
            MAMO <span>Dreambox</span>
          </h1>
        </div>
        <button onClick={handleConnectWallet} className={walletConnected ? "dreambox-wallet connected" : "dreambox-wallet"}>
          <Wallet className="w-4 h-4" />
          {walletConnected ? walletAddress : "Connecter le Cerveau (Wallet)"}
        </button>
      </nav>

      <main className="dreambox-main">
        <div className="dreambox-left">
          <div>
            <h2>Forger une Œuvre</h2>
            <p className="dreambox-muted">
              Insufflez la vie à vos visions. Les créations sont stockées sur IPFS et sécurisées par le réseau MAMO.
            </p>
          </div>

          <form onSubmit={handleMint} className="dreambox-form">
            <div onClick={() => fileInputRef.current?.click()} className={`dreambox-dropzone ${previewUrl ? "has-preview" : ""}`}>
              <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*,audio/*,video/*" className="hidden" />

              {previewUrl ? (
                <div className="dreambox-preview-wrap">
                  <img src={previewUrl} alt="Preview" className="dreambox-preview" />
                  <div className="dreambox-preview-overlay">
                    <p>
                      <UploadCloud className="w-5 h-5" /> Remplacer l'essence
                    </p>
                  </div>
                </div>
              ) : (
                <div className="dreambox-placeholder">
                  <div className="dreambox-placeholder-icon">
                    <ImageIcon className="w-8 h-8" />
                  </div>
                  <p className="dreambox-placeholder-title">Déposer l'artéfact ici</p>
                  <p className="dreambox-muted">JPG, PNG, GIF, MP4 (Max 100MB)</p>
                </div>
              )}
            </div>

            <div className="dreambox-field-group">
              <div>
                <label>Titre de la vision</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Ex: Nébuleuse Fragmentée"
                  required
                />
              </div>
              <div>
                <label>Description mystique</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Décrivez les origines de cet artéfact..."
                />
              </div>
            </div>

            <button type="submit" disabled={!file || !title || status !== "idle"} className="dreambox-mint-btn">
              {status === "idle" && (
                <>
                  <Sparkles className="w-5 h-5" /> Cristalliser l'Œuvre (Mint)
                </>
              )}
              {(status === "uploading" || status === "minting") && (
                <>
                  <Loader2 className="w-5 h-5 spin" /> {statusMessage}
                </>
              )}
              {status === "success" && (
                <>
                  <CheckCircle2 className="w-5 h-5" /> {statusMessage}
                </>
              )}
              {status === "error" && statusMessage}
            </button>

            <div className="dreambox-note">
              <Info className="w-4 h-4" />
              <p>
                Forger un NFT sur la Dreambox requiert des frais de gaz (MAMO). Le processus est irréversible et
                décentralisé sur IPFS.
              </p>
            </div>
          </form>
        </div>

        <div className="dreambox-right">
          <div className="dreambox-gallery-head">
            <h2>
              <Box className="w-6 h-6" /> Galerie Onirique
            </h2>
            <span>{gallery.length} Artéfacts</span>
          </div>

          <div className="dreambox-grid">
            {gallery.map((nft) => (
              <div key={nft.id} className="dreambox-card">
                <div className="dreambox-card-media">
                  <img src={nft.imageUrl} alt={nft.title} />
                  <div className="dreambox-card-grad" />
                  <h3>{nft.title}</h3>
                </div>
                <div className="dreambox-card-body">
                  <p>{nft.description || "Aucune description mystique."}</p>
                  <div className="dreambox-card-meta">
                    <span>
                      <Box className="w-3 h-3" /> MAMO Network
                    </span>
                    <a href="#" title={nft.cid}>
                      {nft.cid.substring(0, 12)}...
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}

