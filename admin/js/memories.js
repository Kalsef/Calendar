function initMemories() {
  const memoryForm = document.getElementById("memoryForm");
  const listaMemories = document.getElementById("listaMemories");
  if (!memoryForm || !listaMemories) return;

  memoryForm.onsubmit = async (e) => {
    e.preventDefault();
    const fd = new FormData(memoryForm);
    const json = Object.fromEntries(fd.entries());
    if (!json.posicao) delete json.posicao;

    try {
      const res = await fetch("/api/memories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(json)
      });
      if (res.ok) {
        alert("Lembrança salva!");
        memoryForm.reset();
        carregarMemories();
      } else {
        const j = await res.json();
        alert(j?.error || "Erro ao salvar lembrança");
      }
    } catch (err) {
      console.error(err);
      alert("Erro de rede ou servidor");
    }
  };

  async function carregarMemories() {
    try {
      const res = await fetch("/api/admin/memories");
      if (!res.ok) return;
      const rows = await res.json();

      listaMemories.innerHTML = rows.map(r => `
        <div class="list-item">
          <img src="${r.image}" style="width:60px;height:60px;border-radius:8px;margin-right:8px;vertical-align:middle"/>
          <strong>${r.message}</strong> (Pos ${r.posicao || "-"})
          <div style="margin-top:6px">
            <button onclick="editarMemory(${r.id})">Editar</button>
            <button onclick="deletarMemory(${r.id})" class="danger">Deletar</button>
          </div>
        </div>
      `).join("");
    } catch (err) {
      console.error(err);
    }
  }

  window.editarMemory = async (id) => {
    try {
      const res = await fetch("/api/admin/memories");
      if (!res.ok) return alert("Erro ao carregar lembranças");
      const rows = await res.json();
      const m = rows.find(x => x.id === id);
      if (!m) return alert("Lembrança não encontrada");

      memoryForm.message.value = m.message;
      memoryForm.image.value = m.image;
      memoryForm.posicao.value = m.posicao || "";
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) {
      console.error(err);
      alert("Erro ao editar lembrança");
    }
  };

  window.deletarMemory = async (id) => {
    if (!confirm("Deseja deletar esta lembrança?")) return;
    try {
      const res = await fetch(`/api/memories/${id}`, { method: "DELETE" });
      if (res.ok) {
        alert("Deletado");
        carregarMemories();
      } else alert("Erro ao deletar lembrança");
    } catch (err) {
      console.error(err);
      alert("Erro de rede ao deletar lembrança");
    }
  };

  carregarMemories();
  window.carregarMemories = carregarMemories;
}