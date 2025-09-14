function initMusic() {
  const musicForm = document.getElementById("musicForm");
  const listaMusicas = document.getElementById("listaMusicas");
  const audioFile = document.getElementById("audioFile");
  const uploadBtn = document.getElementById("uploadBtn");
  const audioUrlInput = document.getElementById("audioUrl");
  const previewBtn = document.getElementById("previewBtn");
  const searchInput = document.getElementById("musicSearch");

  if (!musicForm || !listaMusicas) return;

  let todasMusicas = [];

  const formatData = (data) => data || "Sem data";

  // ---------------- Upload ----------------
  if (uploadBtn && audioFile && audioUrlInput) {
    uploadBtn.onclick = async () => {
      if (!audioFile.files.length) return alert("Selecione um arquivo primeiro");
      const fd = new FormData();
      fd.append("audio", audioFile.files[0]);
      uploadBtn.disabled = true;
      uploadBtn.textContent = "Enviando...";
      try {
        const res = await fetch("/api/upload", { method: "POST", body: fd });
        const j = await res.json();
        if (res.ok) {
          audioUrlInput.value = j.url;
          alert("Upload feito! URL preenchida no campo de áudio.");
        } else alert(j?.error || "Erro no upload");
      } catch (err) {
        console.error(err);
        alert("Erro de upload");
      } finally {
        uploadBtn.disabled = false;
        uploadBtn.textContent = "Fazer upload";
      }
    };
  }

  // ---------------- Preview ----------------
  if (previewBtn && audioUrlInput) {
    previewBtn.onclick = () => {
      const url = audioUrlInput.value.trim();
      if (!url) return alert("Preencha a URL do áudio primeiro");
      window.open(url, "_blank");
    };
  }

  // ---------------- Salvar música ----------------
  musicForm.onsubmit = async (e) => {
    e.preventDefault();
    const json = Object.fromEntries(new FormData(musicForm).entries());
    if (!json.posicao) delete json.posicao;

    try {
      const res = await fetch("/api/musicas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(json)
      });
      if (res.ok) {
        alert("Música salva!");
        musicForm.reset();
        carregarMusicas();
      } else {
        const j = await res.json();
        alert(j?.error || "Erro ao salvar");
      }
    } catch (err) {
      console.error(err);
      alert("Erro de rede ou servidor");
    }
  };

  // ---------------- Carregar músicas ----------------
  async function carregarMusicas() {
    const adminArea = document.getElementById("adminArea");
    if (!adminArea || adminArea.style.display !== "block") return;

    try {
      const res = await fetch("/api/musicas");
      if (!res.ok) return;
      const data = await res.json();

      // transforma objeto em array
      todasMusicas = Array.isArray(data) ? data : Object.values(data).flat();
      renderMusicas(todasMusicas);
    } catch (err) {
      console.error("Erro ao carregar músicas:", err);
    }
  }

  // ---------------- Renderizar músicas ----------------
  function renderMusicas(musicas) {
    const grouped = new Map();

    musicas.filter(Boolean).forEach(m => {
      const d = formatData(m.data);
      if (!grouped.has(d)) grouped.set(d, []);
      grouped.get(d).push(m);
    });

    listaMusicas.innerHTML = [...grouped.entries()]
      .map(([data, musicas]) => `
        <div class="musicas-grupo">
          <h4 style="margin:12px 0; color:#c7c7c7">${data}</h4>
          ${musicas.map(m => `
            <div class="list-item">
              <strong>${m.titulo}</strong>
              <div style="font-size:12px;color:#fff">${m.audio || ""}</div>
              <div style="margin-top:6px">
                <button onclick="editarMusica(${m.id})">Editar</button>
                <button onclick="deletarMusica(${m.id})" class="danger">Deletar</button>
              </div>
            </div>
          `).join("")}
        </div>
      `).join("");
  }

  // ---------------- Editar música ----------------
  window.editarMusica = async (id) => {
    try {
      const res = await fetch("/api/admin/musicas");
      if (!res.ok) return alert("Erro ao carregar músicas");
      const m = (await res.json()).find(x => x.id === id);
      if (!m) return alert("Música não encontrada");

      ["data","posicao","titulo","audio","capa","letra"].forEach(k => {
        musicForm[k].value = m[k] || "";
      });

      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) {
      console.error(err);
      alert("Erro ao editar música");
    }
  };

  // ---------------- Deletar música ----------------
  window.deletarMusica = async (id) => {
    if (!confirm("Deseja deletar esta música?")) return;
    try {
      const res = await fetch(`/api/musicas/${id}`, { method: "DELETE" });
      if (res.ok) {
        alert("Deletado");
        carregarMusicas();
      } else alert("Erro ao deletar música");
    } catch (err) {
      console.error(err);
      alert("Erro de rede ao deletar música");
    }
  };

  // ---------------- Busca de músicas ----------------
  if (searchInput) {
    searchInput.oninput = () => {
      const q = searchInput.value.toLowerCase();
      renderMusicas(
        todasMusicas.filter(m =>
          m && (
            (m.titulo && m.titulo.toLowerCase().includes(q)) ||
            (m.data && m.data.toLowerCase().includes(q))
          )
        )
      );
    };
  }

  carregarMusicas();
  window.carregarMusicas = carregarMusicas;
}
