<script>
      const loginForm = document.getElementById("loginForm");
      const musicForm = document.getElementById("musicForm");
      const memoryForm = document.getElementById("memoryForm");
      const loginArea = document.getElementById("loginArea");
      const adminArea = document.getElementById("adminArea");
      const logoutBtn = document.getElementById("logoutBtn");
      const listaMusicas = document.getElementById("listaMusicas");
      const listaMemories = document.getElementById("listaMemories");
      const audioFile = document.getElementById("audioFile");
      const uploadBtn = document.getElementById("uploadBtn");
      const audioUrlInput = document.getElementById("audioUrl");
      const previewBtn = document.getElementById("previewBtn");
      const poemForm = document.getElementById("poemForm");
      const listaPoems = document.getElementById("listaPoems");

      loginForm.onsubmit = async (e) => {
        e.preventDefault();
        const fd = new FormData(loginForm);
        const body = {
          username: fd.get("username"),
          password: fd.get("password"),
        };
        const res = await fetch("/api/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        if (res.ok) {
          loginArea.style.display = "none";
          adminArea.style.display = "block";
          logoutBtn.style.display = "inline-block";
          carregarLista();
          carregarMemories();
          carregarLogs();
          carregarPoemas(); 
        } else {
          const json = await res.json();
          alert(json?.error || "Erro no login");
        }
      };

      logoutBtn.onclick = async () => {
        await fetch("/api/logout", { method: "POST" });
        loginArea.style.display = "block";
        adminArea.style.display = "none";
        logoutBtn.style.display = "none";
      };

     
      uploadBtn.onclick = async () => {
        if (!audioFile.files.length)
          return alert("Selecione um arquivo primeiro");
        const fd = new FormData();
        fd.append("audio", audioFile.files[0]);
        uploadBtn.disabled = true;
        uploadBtn.textContent = "Enviando...";
        try {
          const res = await fetch("/api/upload", { method: "POST", body: fd });
          const json = await res.json();
          if (res.ok) {
            audioUrlInput.value = json.url;
            alert("Upload feito! URL preenchida no campo de áudio.");
          } else {
            alert(json?.error || "Erro no upload");
          }
        } catch (e) {
          alert("Erro no upload");
          console.error(e);
        } finally {
          uploadBtn.disabled = false;
          uploadBtn.textContent = "Fazer upload";
        }
      };

      
      musicForm.onsubmit = async (e) => {
        e.preventDefault();
        const fd = new FormData(musicForm);
        const json = Object.fromEntries(fd.entries());
        if (!json.posicao) delete json.posicao;
        const res = await fetch("/api/musicas", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(json),
        });
        if (res.ok) {
          alert("Música salva!");
          musicForm.reset();
          carregarLista();
        } else {
          const j = await res.json();
          alert(j?.error || "Erro ao salvar");
        }
      };

      previewBtn.onclick = () => {
        const url = audioUrlInput.value.trim();
        if (!url) return alert("Preencha a URL do áudio primeiro");
        window.open(url, "_blank");
      };

      async function carregarLista() {
        const res = await fetch("/api/admin/musicas");
        if (!res.ok) return;
        const rows = await res.json();
        listaMusicas.innerHTML = rows
          .map(
            (r) => `
        <div class="list-item">
          <strong>${r.data} — Pos ${r.posicao || "-"}</strong>
          <div>${r.titulo || "(sem título)"}</div>
          <div style="font-size:12px;color:#666">${r.audio || ""}</div>
          <div style="margin-top:6px">
            <button onclick="editarMusica(${r.id})">Editar</button>
            <button onclick="deletarMusica(${
              r.id
            })" class="danger">Deletar</button>
          </div>
        </div>
      `
          )
          .join("");
      }

      window.editarMusica = async (id) => {
        const res = await fetch("/api/admin/musicas");
        if (!res.ok) return alert("Erro");
        const rows = await res.json();
        const m = rows.find((x) => x.id === id);
        if (!m) return alert("Não encontrado");
        musicForm.data.value = m.data;
        musicForm.posicao.value = m.posicao;
        musicForm.titulo.value = m.titulo || "";
        musicForm.audio.value = m.audio || "";
        musicForm.capa.value = m.capa || "";
        musicForm.letra.value = m.letra || "";
        window.scrollTo({ top: 0, behavior: "smooth" });
      };

      window.deletarMusica = async (id) => {
        if (!confirm("Deseja deletar esta música?")) return;
        const res = await fetch(`/api/musicas/${id}`, { method: "DELETE" });
        if (res.ok) {
          alert("Deletado");
          carregarLista();
        } else alert("Erro ao deletar");
      };

    
      memoryForm.onsubmit = async (e) => {
        e.preventDefault();
        const fd = new FormData(memoryForm);
        const json = Object.fromEntries(fd.entries());
        if (!json.posicao) delete json.posicao;
        const res = await fetch("/api/memories", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(json),
        });
        if (res.ok) {
          alert("Lembrança salva!");
          memoryForm.reset();
          carregarMemories();
        } else {
          const j = await res.json();
          alert(j?.error || "Erro ao salvar");
        }
      };

      async function carregarMemories() {
        const res = await fetch("/api/admin/memories");
        if (!res.ok) return;
        const rows = await res.json();
        listaMemories.innerHTML = rows
          .map(
            (r) => `
        <div class="list-item">
          <img src="${
            r.image
          }" style="width:60px;height:60px;border-radius:8px;margin-right:8px;vertical-align:middle"/>
          <strong>${r.message}</strong> (Pos ${r.posicao || "-"})
          <div style="margin-top:6px">
            <button onclick="editarMemory(${r.id})">Editar</button>
            <button onclick="deletarMemory(${
              r.id
            })" class="danger">Deletar</button>
          </div>
        </div>
      `
          )
          .join("");
      }

      window.editarMemory = async (id) => {
        const res = await fetch("/api/admin/memories");
        if (!res.ok) return alert("Erro");
        const rows = await res.json();
        const m = rows.find((x) => x.id === id);
        if (!m) return alert("Não encontrado");
        memoryForm.message.value = m.message;
        memoryForm.image.value = m.image;
        memoryForm.posicao.value = m.posicao || "";
        window.scrollTo({ top: 0, behavior: "smooth" });
      };

      window.deletarMemory = async (id) => {
        if (!confirm("Deseja deletar esta lembrança?")) return;
        const res = await fetch(`/api/memories/${id}`, { method: "DELETE" });
        if (res.ok) {
          alert("Deletado");
          carregarMemories();
        } else alert("Erro ao deletar");
      };

   
      async function carregarLogs() {
        const res = await fetch("/api/admin/logs");
        if (!res.ok) return;
        const rows = await res.json();
        function formatarDataHora(dt) {
          const d = new Date(dt);
          return d.toLocaleString("pt-BR", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
          });
        }
        listaLogs.innerHTML = rows
          .map(
            (log) => `
        <div class="list-item">
          <strong>${formatarDataHora(log.accessed_at)}</strong><br/>
          <div class="log-ip" title="Endereço IP">${log.ip}</div>
          <div><strong>UA:</strong> ${log.user_agent}</div>
        </div>
      `
          )
          .join("");
      }

      poemForm.onsubmit = async (e) => {
        e.preventDefault();
        const fd = new FormData(poemForm);
        const json = Object.fromEntries(fd.entries());

        const res = await fetch("/api/admin/poem", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(json),
        });

        if (res.ok) {
          alert("Poema salvo!");
          poemForm.reset();
          carregarPoemas();
        } else {
          const j = await res.json();
          alert(j?.error || "Erro ao salvar poema");
        }
      };


     
      async function carregarPoemas() {
  const res = await fetch("/api/admin/poems");
  if (!res.ok) return;
  const rows = await res.json();

  listaPoems.innerHTML = rows
    .map(
      (p) => `
      <div class="list-item">
        <strong>${p.date}</strong>
        <div>${p.content}</div>
        <div style="margin-top:6px">
          <button onclick="editarPoema(${p.id})">Editar</button>
          <button onclick="deletarPoema(${p.id})" class="danger">Deletar</button>
        </div>
      </div>
    `
    )
    .join("");
}

window.editarPoema = async (id) => {
  const res = await fetch("/api/admin/poems");
  if (!res.ok) return alert("Erro");
  const rows = await res.json();
  const p = rows.find((x) => x.id === id);
  if (!p) return alert("Não encontrado");
  poemForm.date.value = p.date;
  poemForm.content.value = p.content;
  window.scrollTo({ top: 0, behavior: "smooth" });
};

window.deletarPoema = async (id) => {
  if (!confirm("Deseja deletar este poema?")) return;
  const res = await fetch(`/api/admin/poems/${id}`, { method: "DELETE" });
  if (res.ok) {
    alert("Poema deletado!");
    carregarPoemas();
  } else alert("Erro ao deletar");
};


poemForm.onsubmit = async (e) => {
  e.preventDefault();
  const fd = new FormData(poemForm);
  const json = Object.fromEntries(fd.entries());

  try {
    const res = await fetch("/api/admin/poem", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(json),
    });

    if (res.ok) {
      alert("Poema salvo!");
      poemForm.reset();
      await carregarPoemas();
    } else {
      const j = await res.json();
      console.error("Erro ao salvar:", j);
      alert(j?.error || "Erro ao salvar poema");
    }
  } catch (err) {
    console.error("Erro de rede ou backend:", err);
    alert("Erro de rede ou backend");
  }
};


async function loadAdminWords() {
  const res = await fetch("/api/quadro-palavras"); 
  const words = await res.json();
  const tableBody = document.getElementById("words-table-body");
  tableBody.innerHTML = "";

  words.forEach(w => {
    const tr = document.createElement("tr");

    const tdWord = document.createElement("td");
    tdWord.textContent = w.palavra;

    const tdActions = document.createElement("td");
    const delBtn = document.createElement("button");
    delBtn.textContent = "Deletar";
    delBtn.onclick = async () => {
      if (confirm(`Deseja realmente deletar a palavra "${w.palavra}"?`)) {
        await fetch(`/api/admin/quadro-palavras/${w.id}`, { method: "DELETE" });
        loadAdminWords(); 
      }
    };

    tdActions.appendChild(delBtn);
    tr.appendChild(tdWord);
    tr.appendChild(tdActions);
    tableBody.appendChild(tr);
  });
}


loadAdminWords();


async function salvar(payload) {
      const res = await fetch("/api/admin/today-drawing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      alert(data.success ? "✅ Desenho salvo!" : "❌ " + (data.error || "Erro"));
    }

    document.getElementById("formText").addEventListener("submit", e => {
      e.preventDefault();
      salvar({
        date: document.getElementById("dateText").value,
        type: "text",
        content: document.getElementById("contentText").value
      });
    });

    document.getElementById("formImage").addEventListener("submit", e => {
      e.preventDefault();
      salvar({
        date: document.getElementById("dateImage").value,
        type: "image",
        url: document.getElementById("urlImage").value
      });
    });


    fetch("/api/drive-files")
  .then(res => res.json())
  .then(data => console.log(data));


   





    </script>
