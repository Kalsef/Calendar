function initDesenho() {
  const form = document.getElementById("formImage");
  const dateInput = document.getElementById("dateImage");
  const urlInput = document.getElementById("urlImage");
  const previewBtn = document.getElementById("previewImageBtn");

  if (!form || !dateInput || !urlInput) return;

  async function salvarDesenho(payload) {
    if (!payload.date || !payload.url) {
      return alert("❌ Preencha a data e a URL da imagem!");
    }

    try {
      const res = await fetch("/api/admin/today-drawing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (res.ok) {
        alert("✅ Desenho salvo com sucesso!");
        urlInput.value = "";
        dateInput.value = "";
      } else {
        alert("❌ Erro: " + (data.error || "Não foi possível salvar"));
      }
    } catch (err) {
      console.error(err);
      alert("❌ Erro de rede ou servidor");
    }
  }

  form.addEventListener("submit", e => {
    e.preventDefault();
    salvarDesenho({
      date: dateInput.value,
      type: "image",
      url: urlInput.value
    });
  });

  if (previewBtn) {
    previewBtn.addEventListener("click", () => {
      const url = urlInput.value.trim();
      if (!url) return alert("Preencha a URL da imagem primeiro");
      window.open(url, "_blank");
    });
  }
}
