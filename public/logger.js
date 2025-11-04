window.Logger = (() => {
  const BATCH_INTERVAL = 10000; 
  const MAX_BACKOFF = 30000;
  const STORAGE_KEY = "pendingLogs";
  let queue = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
  let sending = false;
  let backoff = 1000;

  function persistQueue() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(queue));
  }

  function enqueue(action, description = "") {
    const entry = {
      timestamp: new Date().toISOString(),
      user: document.querySelector("#username")?.textContent || "guest",
      ip: window.userip || "Desconhecido",
      target: navigator.userAgent,
      size: `${window.innerWidth}x${window.innerHeight}`,
      action,
      description,
    };
    queue.push(entry);
    persistQueue();
  }

  async function sendBatch() {
    if (sending || queue.length === 0) return;
    sending = true;

    const toSend = [...queue];
    queue = [];
    persistQueue();

    try {
      const grouped = groupLogs(toSend);
      const chunks = chunkMessage(grouped, 4000);

      for (const c of chunks) {
        await fetch("/api/send-telegram-alert", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message: `🪵 *Batch de Logs*\n\n${c}`, type: "interacoes" }),
        });
        await delay(800);
      }

      backoff = 1000;
    } catch (err) {
      console.error("Erro no envio de logs:", err);
      queue.unshift(...toSend);
      persistQueue();
      backoff = Math.min(backoff * 2, MAX_BACKOFF);
    } finally {
      sending = false;
      setTimeout(sendBatch, backoff);
    }
  }

  function groupLogs(logs) {
    const grouped = logs.reduce((acc, log) => {
      const key = `${log.user}-${log.ip}`;
      if (!acc[key]) acc[key] = [];
      acc[key].push(log);
      return acc;
    }, {});

    return Object.entries(grouped)
      .map(([key, entries]) =>
        `👤 ${entries[0].user} (${entries[0].ip})\n${entries.map(e => {
          const time = new Date(e.timestamp).toLocaleTimeString("pt-BR");
          return `🕒 ${time} — ${e.action} (${e.description})`;
        }).join("\n")}`)
      .join("\n\n---\n\n");
  }

  function chunkMessage(msg, size) {
    const parts = [];
    for (let i = 0; i < msg.length; i += size) parts.push(msg.slice(i, i + size));
    return parts;
  }

  function delay(ms) {
    return new Promise(r => setTimeout(r, ms));
  }

  // Envio periódico e persistência antes de sair
  setInterval(sendBatch, BATCH_INTERVAL);
  window.addEventListener("beforeunload", persistQueue);

  return { enqueue, sendBatch };
})();
