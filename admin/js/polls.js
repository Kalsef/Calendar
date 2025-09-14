function initPolls() {
  const pollForm = document.getElementById("pollForm");
  const listaPolls = document.getElementById("listaPolls");
  if (!pollForm || !listaPolls) return;

  pollForm.onsubmit = async (e) => {
    e.preventDefault();
    const fd = new FormData(pollForm);
    const body = {
      pergunta: fd.get("pergunta"),
      opcoes: fd.get("opcoes").split(",").map(o => o.trim())
    };
    try {
      const res = await fetch("/api/polls", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      });
      if (res.ok) {
        alert("Votação criada!");
        pollForm.reset();
        carregarPolls();
      } else alert("Erro ao criar votação");
    } catch (err) {
      console.error(err);
      alert("Erro de rede ao criar votação");
    }
  };

  async function carregarPolls() {
    const adminArea = document.getElementById("adminArea");
    if (!adminArea || adminArea.style.display !== "block") return;

    try {
      const res = await fetch("/api/polls");
      if (!res.ok) return;
      const polls = await res.json();

      listaPolls.innerHTML = "";

      for (const p of polls) {
        const pollDiv = document.createElement("div");
        pollDiv.classList.add("list-item");

        const title = document.createElement("strong");
        title.textContent = p.pergunta;

        const optionsDiv = document.createElement("div");
        optionsDiv.textContent = "Opções: " + p.opcoes.join(", ");

        const votesDiv = document.createElement("div");
        votesDiv.textContent = "Carregando votos...";

        const actionsDiv = document.createElement("div");
        actionsDiv.style.marginTop = "6px";
        const delBtn = document.createElement("button");
        delBtn.textContent = "Deletar Poll";
        delBtn.className = "danger";
        delBtn.onclick = async () => {
          if (!confirm("Deseja realmente deletar esta votação?")) return;
          const resDel = await fetch(`/api/polls/${p.id}`, { method: "DELETE" });
          if (resDel.ok) carregarPolls();
        };
        actionsDiv.appendChild(delBtn);

        pollDiv.appendChild(title);
        pollDiv.appendChild(optionsDiv);
        pollDiv.appendChild(votesDiv);
        pollDiv.appendChild(actionsDiv);
        listaPolls.appendChild(pollDiv);

        try {
  const votesRes = await fetch(`/api/polls/${p.id}/results`);
  const votes = await votesRes.json();
  votesDiv.textContent =
    votes.length === 0
      ? "Sem votos ainda"
      : "Votos: " + votes.map(v => `${v.opcao}: ${v.votos}`).join(", ");
} catch (err) {
  votesDiv.textContent = "Erro ao carregar votos";
}

      }
    } catch (err) {
      console.error("Erro ao carregar polls:", err);
    }
  }
  setInterval(carregarPolls, 10000);
  carregarPolls();
  window.carregarPolls = carregarPolls;
}