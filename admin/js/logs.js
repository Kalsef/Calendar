function initLogs() {
  const listaLogs = document.getElementById("listaLogs");
  const adminArea = document.getElementById("adminArea");
  const searchInput = document.getElementById("logSearch"); // novo input de busca
  if (!listaLogs || !adminArea) return;

  let todosLogs = [];

  async function carregarLogs() {
    if (adminArea.style.display !== "block") return;

    try {
      const res = await fetch("/api/admin/logs");
      if (!res.ok) return;
      const rows = await res.json();
      todosLogs = rows;

      renderLogs(todosLogs);
    } catch (err) {
      console.error("Erro ao carregar logs:", err);
    }
  }

  function formatarDataHora(dt) {
    const d = new Date(dt);
    return d.toLocaleString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit"
    });
  }

  function renderLogs(logs) {
    listaLogs.innerHTML = logs
      .map(log => `
        <div class="list-item">
          <strong>${formatarDataHora(log.accessed_at)}</strong><br/>
          <div class="log-ip" title="Endereço IP">${log.ip}</div>
          <div><strong>UA:</strong> ${log.user_agent}</div>
        </div>
      `).join("");
  }

  if (searchInput) {
    searchInput.addEventListener("input", () => {
      const q = searchInput.value.toLowerCase();
      const filtrados = todosLogs.filter(log =>
        (log.ip && log.ip.toLowerCase().includes(q)) ||
        (log.user_agent && log.user_agent.toLowerCase().includes(q)) ||
        (log.accessed_at && formatarDataHora(log.accessed_at).toLowerCase().includes(q))
      );
      renderLogs(filtrados);
    });
  }
  carregarLogs();
  window.carregarLogs = carregarLogs;
}
