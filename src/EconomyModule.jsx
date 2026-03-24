import { useEffect, useMemo, useState } from "react";

function toNumber(value, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

export default function EconomyModule({ api, digitalId, userAddress, chefId, authToken }) {
  const identityId = digitalId?.id || "anonymous";
  const isChefIdentity = identityId === chefId;
  const hasAuthSession = Boolean(authToken);

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("Aucune action economique lancee.");
  const [dashboard, setDashboard] = useState(null);

  const [passiveForm, setPassiveForm] = useState({
    nodeId: "MAMO-NODE-01",
    uptimeSeconds: "3600",
    bandwidthMb: "650",
    storageGb: "4",
    signatureValid: true,
  });
  const [distributeNodeId, setDistributeNodeId] = useState("");

  const [routeForm, setRouteForm] = useState({
    recipientAddress: "0x000000000000000000000000000000000000dEaD",
    totalFeeMamo: "12",
    fragmentCount: "32",
  });
  const [activeRouteId, setActiveRouteId] = useState("");
  const [relayForm, setRelayForm] = useState({
    relayIdentityId: "mamo:identity:relay-01",
    shares: "8",
  });

  const [computeForm, setComputeForm] = useState({
    requestText: "Generer un rendu Nano Dreambox 512x512",
    budgetMamo: "18",
    tasksCount: "4",
    model: "nano-dreambox-v1",
  });
  const [activeJobId, setActiveJobId] = useState("");
  const [taskForm, setTaskForm] = useState({
    workerIdentityId: "mamo:identity:worker-01",
    taskId: "",
    resultHash: "0xresulthashdemo",
    signature: "0xsignaturedemo",
  });

  const [adminForm, setAdminForm] = useState({
    module: "compute",
    amount: "100",
  });

  const recentEvents = useMemo(() => dashboard?.recentAkashic || [], [dashboard]);

  const request = async (path, options = {}) => {
    const response = await fetch(api(path), {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
        ...(options.headers || {}),
      },
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      const detail =
        typeof data?.detail === "string" ? data.detail : JSON.stringify(data?.detail || data || `http_${response.status}`);
      throw new Error(detail);
    }
    return data;
  };

  const loadDashboard = async () => {
    if (!authToken) {
      setDashboard(null);
      setMessage("Session wallet requise. Connecte-toi dans Banking pour synchroniser l'economie.");
      return;
    }
    setLoading(true);
    try {
      const data = await request(`/api/economy/dashboard?identityId=${encodeURIComponent(identityId)}`);
      setDashboard(data);
      setMessage(`Dashboard economie synchronise (${new Date().toLocaleTimeString()}).`);
    } catch (error) {
      setMessage(`Echec dashboard economie: ${String(error.message || error)}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [identityId, authToken]);

  const computePassive = async () => {
    setLoading(true);
    try {
      const payload = {
        identityId,
        nodeId: passiveForm.nodeId,
        walletAddress: userAddress,
        uptimeSeconds: toNumber(passiveForm.uptimeSeconds, 0),
        bandwidthMb: toNumber(passiveForm.bandwidthMb, 0),
        storageGb: toNumber(passiveForm.storageGb, 0),
        signatureValid: !!passiveForm.signatureValid,
      };
      const data = await request("/api/economy/passive-mining/compute", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      setMessage(
        `Passive compute OK: node ${data.nodeId}, stability ${data.stabilityScore}%, reward ${data.computedRewardMamo} MAMO.`
      );
      await loadDashboard();
    } catch (error) {
      setMessage(`Passive compute refuse: ${String(error.message || error)}`);
    } finally {
      setLoading(false);
    }
  };

  const distributePassive = async () => {
    setLoading(true);
    try {
      const payload = {
        identityId,
        nodeId: distributeNodeId.trim() || null,
      };
      const data = await request("/api/economy/passive-mining/distribute", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      setMessage(`Distribution passive OK: ${data.distributedTotalMamo} MAMO.`);
      await loadDashboard();
    } catch (error) {
      setMessage(`Distribution passive refusee: ${String(error.message || error)}`);
    } finally {
      setLoading(false);
    }
  };

  const initiateRoute = async () => {
    setLoading(true);
    try {
      const payload = {
        senderIdentityId: identityId,
        senderAddress: userAddress,
        recipientAddress: routeForm.recipientAddress,
        totalFeeMamo: toNumber(routeForm.totalFeeMamo, 0),
        fragmentCount: toNumber(routeForm.fragmentCount, 1),
      };
      const data = await request("/api/economy/routing/initiate", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      setActiveRouteId(data.routeId);
      setMessage(
        `Route initiee ${data.routeId}. Frais charges: ${data.feeChargedMamo} MAMO${data.subsidizedByCommunity ? " (chef subventionne)" : ""}.`
      );
      await loadDashboard();
    } catch (error) {
      setMessage(`Initiation route refusee: ${String(error.message || error)}`);
    } finally {
      setLoading(false);
    }
  };

  const confirmRelay = async () => {
    setLoading(true);
    try {
      const payload = {
        routeId: activeRouteId,
        relayIdentityId: relayForm.relayIdentityId,
        shares: toNumber(relayForm.shares, 1),
      };
      const data = await request("/api/economy/routing/confirm-relay", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      const relayCount = Object.keys(data.relayShares || {}).length;
      setMessage(`Relay confirme sur ${data.routeId}. Relais actifs: ${relayCount}.`);
      await loadDashboard();
    } catch (error) {
      setMessage(`Confirmation relay refusee: ${String(error.message || error)}`);
    } finally {
      setLoading(false);
    }
  };

  const finalizeRoute = async () => {
    setLoading(true);
    try {
      const payload = {
        routeId: activeRouteId,
        requesterIdentityId: identityId,
      };
      const data = await request("/api/economy/routing/finalize", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      setMessage(`Route finalisee (${data.routeId}). Payouts: ${(data.payouts || []).length}.`);
      await loadDashboard();
    } catch (error) {
      setMessage(`Finalisation route refusee: ${String(error.message || error)}`);
    } finally {
      setLoading(false);
    }
  };

  const createComputeJob = async () => {
    setLoading(true);
    try {
      const payload = {
        requesterIdentityId: identityId,
        requesterAddress: userAddress,
        requestText: computeForm.requestText,
        model: computeForm.model,
        budgetMamo: toNumber(computeForm.budgetMamo, 0),
        tasksCount: toNumber(computeForm.tasksCount, 1),
      };
      const data = await request("/api/economy/compute/request", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      setActiveJobId(data.jobId);
      setTaskForm((prev) => ({ ...prev, taskId: data.tasks?.[0]?.taskId || "" }));
      setMessage(
        `Job compute cree ${data.jobId}. Frais charges: ${data.feeChargedMamo} MAMO${data.subsidizedByCommunity ? " (chef subventionne)" : ""}.`
      );
      await loadDashboard();
    } catch (error) {
      setMessage(`Creation job compute refusee: ${String(error.message || error)}`);
    } finally {
      setLoading(false);
    }
  };

  const submitComputeTask = async () => {
    setLoading(true);
    try {
      const payload = {
        jobId: activeJobId,
        workerIdentityId: taskForm.workerIdentityId,
        taskId: taskForm.taskId,
        resultHash: taskForm.resultHash,
        signature: taskForm.signature,
      };
      const data = await request("/api/economy/compute/submit-task", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      setMessage(`Task soumise: ${data.taskId} sur job ${data.jobId}.`);
      await loadDashboard();
    } catch (error) {
      setMessage(`Soumission task refusee: ${String(error.message || error)}`);
    } finally {
      setLoading(false);
    }
  };

  const finalizeComputeJob = async () => {
    setLoading(true);
    try {
      const payload = {
        jobId: activeJobId,
        requesterIdentityId: identityId,
      };
      const data = await request("/api/economy/compute/finalize", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      setMessage(`Compute finalise (${data.jobId}). Payouts: ${(data.payouts || []).length}.`);
      await loadDashboard();
    } catch (error) {
      setMessage(`Finalisation compute refusee: ${String(error.message || error)}`);
    } finally {
      setLoading(false);
    }
  };

  const adminOverride = async (action) => {
    setLoading(true);
    try {
      const payload = {
        identityId,
        action,
        module: action === "inject_pool" ? null : adminForm.module,
        amount: action === "inject_pool" ? toNumber(adminForm.amount, 0) : null,
      };
      await request("/api/economy/admin/override", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      setMessage(`Override chef applique: ${action}.`);
      await loadDashboard();
    } catch (error) {
      setMessage(`Override refuse: ${String(error.message || error)}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="panel glass neon">
      <h2>Economie MAMO - Participation Active</h2>
      <p className="muted">
        Minage passif, routage recompense, compute distribue Nano Dreambox et regle chef ({chefId}).
      </p>

      <div className="grid two">
        <div className="card">
          <h3>Etat global</h3>
          <p>Identite: {identityId}</p>
          <p>Role: {isChefIdentity ? "Chef" : "User"}</p>
          <p>Pool communautaire: {dashboard?.communityPoolMamo ?? "-"} MAMO</p>
          <p>Modules: passive={String(dashboard?.modules?.passive_mining)} / routing={String(dashboard?.modules?.routing)} / compute={String(dashboard?.modules?.compute)}</p>
          <div className="row">
            <button onClick={loadDashboard} disabled={loading}>
              {loading ? "Sync..." : "Synchroniser"}
            </button>
          </div>
          <p className={hasAuthSession ? "ok" : "warn"}>
            Session backend: {hasAuthSession ? "active" : "absente"}
          </p>
          <p className={message.toLowerCase().includes("refuse") || message.toLowerCase().includes("echec") ? "warn" : "muted"}>{message}</p>
        </div>

        <div className="card">
          <h3>Compteurs economie</h3>
          <p>Passive distribue: {dashboard?.passiveMining?.distributedMamo ?? 0} MAMO</p>
          <p>Routing distribue: {dashboard?.routing?.distributedMamo ?? 0} MAMO</p>
          <p>Compute distribue: {dashboard?.compute?.distributedMamo ?? 0} MAMO</p>
          <p>Mes gains passifs: {dashboard?.myEconomy?.passiveMamo ?? 0} MAMO</p>
          <p>Mes gains routing: {dashboard?.myEconomy?.routingMamo ?? 0} MAMO</p>
          <p>Mes gains compute: {dashboard?.myEconomy?.computeMamo ?? 0} MAMO</p>
          <p>Total personnel: {dashboard?.myEconomy?.totalMamo ?? 0} MAMO</p>
          <p>Routes ouvertes: {dashboard?.routing?.openRoutes ?? 0}</p>
          <p>Jobs ouverts: {dashboard?.compute?.openJobs ?? 0}</p>
        </div>
      </div>

      <div className="grid two">
        <div className="card">
          <h3>1) Minage passif par noeud intrique</h3>
          <label>
            Node ID
            <input value={passiveForm.nodeId} onChange={(e) => setPassiveForm((p) => ({ ...p, nodeId: e.target.value }))} />
          </label>
          <label>
            Uptime (secondes)
            <input value={passiveForm.uptimeSeconds} onChange={(e) => setPassiveForm((p) => ({ ...p, uptimeSeconds: e.target.value }))} />
          </label>
          <label>
            Bandwidth partagee (MB)
            <input value={passiveForm.bandwidthMb} onChange={(e) => setPassiveForm((p) => ({ ...p, bandwidthMb: e.target.value }))} />
          </label>
          <label>
            Stockage partage (GB)
            <input value={passiveForm.storageGb} onChange={(e) => setPassiveForm((p) => ({ ...p, storageGb: e.target.value }))} />
          </label>
          <label style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <input
              type="checkbox"
              checked={passiveForm.signatureValid}
              onChange={(e) => setPassiveForm((p) => ({ ...p, signatureValid: e.target.checked }))}
              style={{ width: "auto" }}
            />
            Signature valide
          </label>
          <div className="row">
            <button onClick={computePassive} disabled={loading}>Compute reward</button>
            <button onClick={distributePassive} disabled={loading}>Distribuer</button>
          </div>
          <label>
            Distribution cible (nodeId optionnel)
            <input value={distributeNodeId} onChange={(e) => setDistributeNodeId(e.target.value)} placeholder="laisser vide = tous les noeuds" />
          </label>
        </div>

        <div className="card">
          <h3>2) Routage recompense (peage quantique)</h3>
          <label>
            Recipient wallet
            <input value={routeForm.recipientAddress} onChange={(e) => setRouteForm((p) => ({ ...p, recipientAddress: e.target.value }))} />
          </label>
          <label>
            Frais totaux (MAMO)
            <input value={routeForm.totalFeeMamo} onChange={(e) => setRouteForm((p) => ({ ...p, totalFeeMamo: e.target.value }))} />
          </label>
          <label>
            Fragments
            <input value={routeForm.fragmentCount} onChange={(e) => setRouteForm((p) => ({ ...p, fragmentCount: e.target.value }))} />
          </label>
          <div className="row">
            <button onClick={initiateRoute} disabled={loading}>Initier route</button>
            <input value={activeRouteId} onChange={(e) => setActiveRouteId(e.target.value)} placeholder="routeId" />
          </div>
          <label>
            Relay identity
            <input value={relayForm.relayIdentityId} onChange={(e) => setRelayForm((p) => ({ ...p, relayIdentityId: e.target.value }))} />
          </label>
          <label>
            Shares
            <input value={relayForm.shares} onChange={(e) => setRelayForm((p) => ({ ...p, shares: e.target.value }))} />
          </label>
          <div className="row">
            <button onClick={confirmRelay} disabled={loading || !activeRouteId}>Confirmer relay</button>
            <button onClick={finalizeRoute} disabled={loading || !activeRouteId}>Finaliser route</button>
          </div>
        </div>
      </div>

      <div className="grid two">
        <div className="card">
          <h3>3) Compute collectif Nano Dreambox</h3>
          <label>
            Requete
            <input value={computeForm.requestText} onChange={(e) => setComputeForm((p) => ({ ...p, requestText: e.target.value }))} />
          </label>
          <label>
            Modele
            <input value={computeForm.model} onChange={(e) => setComputeForm((p) => ({ ...p, model: e.target.value }))} />
          </label>
          <label>
            Budget (MAMO)
            <input value={computeForm.budgetMamo} onChange={(e) => setComputeForm((p) => ({ ...p, budgetMamo: e.target.value }))} />
          </label>
          <label>
            Nombre de taches
            <input value={computeForm.tasksCount} onChange={(e) => setComputeForm((p) => ({ ...p, tasksCount: e.target.value }))} />
          </label>
          <div className="row">
            <button onClick={createComputeJob} disabled={loading}>Creer job</button>
            <input value={activeJobId} onChange={(e) => setActiveJobId(e.target.value)} placeholder="jobId" />
          </div>

          <label>
            Worker identity
            <input value={taskForm.workerIdentityId} onChange={(e) => setTaskForm((p) => ({ ...p, workerIdentityId: e.target.value }))} />
          </label>
          <label>
            Task ID
            <input value={taskForm.taskId} onChange={(e) => setTaskForm((p) => ({ ...p, taskId: e.target.value }))} />
          </label>
          <label>
            Result hash
            <input value={taskForm.resultHash} onChange={(e) => setTaskForm((p) => ({ ...p, resultHash: e.target.value }))} />
          </label>
          <label>
            Signature
            <input value={taskForm.signature} onChange={(e) => setTaskForm((p) => ({ ...p, signature: e.target.value }))} />
          </label>

          <div className="row">
            <button onClick={submitComputeTask} disabled={loading || !activeJobId}>Soumettre task</button>
            <button onClick={finalizeComputeJob} disabled={loading || !activeJobId}>Finaliser compute</button>
          </div>
        </div>

        <div className="card">
          <h3>4) Regle d'or chef + journal Akashique</h3>
          <p className={isChefIdentity ? "ok" : "warn"}>
            {isChefIdentity
              ? "Vous etes chef: override autorise, frais routes/compute subventionnes."
              : "Vous etes user: actions admin bloquees."}
          </p>
          <label>
            Module cible
            <select value={adminForm.module} onChange={(e) => setAdminForm((p) => ({ ...p, module: e.target.value }))}>
              <option value="passive_mining">passive_mining</option>
              <option value="routing">routing</option>
              <option value="compute">compute</option>
            </select>
          </label>
          <label>
            Injection pool (MAMO)
            <input value={adminForm.amount} onChange={(e) => setAdminForm((p) => ({ ...p, amount: e.target.value }))} />
          </label>
          <div className="row">
            <button onClick={() => adminOverride("pause_module")} disabled={loading || !isChefIdentity}>Pause module</button>
            <button onClick={() => adminOverride("resume_module")} disabled={loading || !isChefIdentity}>Resume module</button>
            <button onClick={() => adminOverride("inject_pool")} disabled={loading || !isChefIdentity}>Inject pool</button>
          </div>

          <h3 style={{ marginTop: 14 }}>Akashic (recent)</h3>
          <div className="table-wrap" style={{ maxHeight: 230 }}>
            <table className="bloomberg">
              <thead>
                <tr>
                  <th>Type</th>
                  <th>Auteur</th>
                  <th>Priorite</th>
                  <th>Horodatage</th>
                </tr>
              </thead>
              <tbody>
                {recentEvents.map((event) => (
                  <tr key={event.recordId}>
                    <td>{event.recordType}</td>
                    <td>{String(event.authorCoreId || "-").slice(0, 20)}</td>
                    <td>{event.priority}</td>
                    <td>{new Date(event.timestamp).toLocaleTimeString()}</td>
                  </tr>
                ))}
                {!recentEvents.length && (
                  <tr>
                    <td colSpan={4}>Aucun evenement pour le moment.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </section>
  );
}
