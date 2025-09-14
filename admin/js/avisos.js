function initAvisos() {
  const avisoForm = document.getElementById("avisoForm");
  const listaAvisos = document.getElementById("listaAvisos");
  if (!avisoForm || !listaAvisos) return;

  // Adicionar novo aviso
  avisoForm.onsubmit = async (e) => {
    e.preventDefault();
    const fd = new FormData(avisoForm);
    const body = { mensagem: fd.get("mensagem") };

    try {
      const res = await fetch("/api/avisos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      });
      if (res.ok) {
        alert("Aviso adicionado!");
        avisoForm.reset();
        carregarAvisos();
      } else {
        alert("Erro ao adicionar aviso");
      }
    } catch (err) {
      console.error(err);
      alert("Erro de rede ao adicionar aviso");
    }
  };

  // Carregar avisos do servidor
  async function carregarAvisos() {
    try {
      const res = await fetch("/api/avisos");
      if (!res.ok) return;
      const rows = await res.json();

      listaAvisos.innerHTML = rows
        .map(a => `
          <div class="list-item">
            <strong>${a.mensagem}</strong>
            <br>
            <small style="color: #ebebebff;">${new Date(a.criado_em).toLocaleString()}</small>
            <div>
              <button onclick="deletarAviso(${a.id})" class="danger">Remover</button>
            </div>
          </div>
        `).join("");
    } catch (err) {
      console.error("Erro ao carregar avisos:", err);
    }
  }

  // Deletar aviso
  window.deletarAviso = async (id) => {
    if (!confirm("Deseja remover este aviso?")) return;
    try {
      const res = await fetch(`/api/avisos/${id}`, { method: "DELETE" });
      if (res.ok) {
        alert("Aviso removido!");
        carregarAvisos();
      } else alert("Erro ao remover aviso");
    } catch (err) {
      console.error(err);
      alert("Erro de rede ao remover aviso");
    }
  };

  carregarAvisos();
  window.carregarAvisos = carregarAvisos;
}
