function initPoems() {
  const poemForm = document.getElementById("poemForm");
  const listaPoems = document.getElementById("listaPoems");
  if (!poemForm || !listaPoems) return;

  poemForm.onsubmit = async (e) => {
    e.preventDefault();
    const fd = new FormData(poemForm);
    const json = Object.fromEntries(fd.entries());

    try {
      const res = await fetch("/api/admin/poem", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(json)
      });
      if (res.ok) {
        alert("Poema salvo!");
        poemForm.reset();
        carregarPoemas();
      } else {
        const j = await res.json();
        alert(j?.error || "Erro ao salvar poema");
      }
    } catch (err) {
      console.error(err);
      alert("Erro de rede ou servidor");
    }
  };

  async function carregarPoemas() {
    try {
      const res = await fetch("/api/admin/poems");
      if (!res.ok) return;
      const rows = await res.json();

      listaPoems.innerHTML = rows
        .map(p => `
          <div class="list-item">
            <strong>${p.date}</strong>
            <div>${p.content}</div>
            <div style="margin-top:6px">
              <button onclick="editarPoema(${p.id})">Editar</button>
              <button onclick="deletarPoema(${p.id})" class="danger">Deletar</button>
            </div>
          </div>
        `).join("");
    } catch (err) {
      console.error("Erro ao carregar poemas:", err);
    }
  }

  window.editarPoema = async (id) => {
    try {
      const res = await fetch("/api/admin/poems");
      if (!res.ok) return alert("Erro ao carregar poemas");
      const rows = await res.json();
      const p = rows.find(x => x.id === id);
      if (!p) return alert("Poema não encontrado");

      poemForm.date.value = p.date;
      poemForm.content.value = p.content;
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) {
      console.error(err);
      alert("Erro ao editar poema");
    }
  };

  window.deletarPoema = async (id) => {
    if (!confirm("Deseja deletar este poema?")) return;
    try {
      const res = await fetch(`/api/admin/poems/${id}`, { method: "DELETE" });
      if (res.ok) {
        alert("Poema deletado!");
        carregarPoemas();
      } else alert("Erro ao deletar poema");
    } catch (err) {
      console.error(err);
      alert("Erro de rede ao deletar poema");
    }
  };

  carregarPoemas();
  window.carregarPoemas = carregarPoemas;
}