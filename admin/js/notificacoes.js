function initNotificacoes() {
  const form = document.getElementById("notifForm");
  const lista = document.getElementById("listaNotificacoes");
  const rapidasDiv = document.getElementById("notificacoes-rapidas");

  if (!form || !lista) return; 

  const notificacoesRapidas = [
    { titulo: "Bom dia! ☀️", mensagem: "Tenha um excelente dia!" },
    { titulo: "Lembrete!", mensagem: "Não esqueça de beber água 💧" },
    { titulo: "🎨 Novo desenho!", mensagem: "Tem um novo desenho disponível agora!" },
    { titulo: "📜 Novo poema!", mensagem: "O poema do dia acabou de ser atualizado!" },
    { titulo: "📢 Aviso novo!", mensagem: "Um novo aviso importante foi publicado." },
    { titulo: "📝 Palavra adicionada!", mensagem: "O quadro de palavras recebeu um novo item!" },
    { titulo: "📊 Nova votação!", mensagem: "Uma nova votação está disponível para participação!" },
    { titulo: "⏳ Contadores atualizados!", mensagem: "As datas especiais foram atualizadas agora!" },
    { titulo: "🚀 Atualização no sistema!", mensagem: "Novas melhorias foram aplicadas no site!" },
    { titulo: "🎵 Nova música adicionada", mensagem: "Uma nova música foi adicionada!" }
  ];

  if (rapidasDiv) {
    rapidasDiv.innerHTML = notificacoesRapidas.map((n, i) => `
      <button onclick="enviarNotificacaoRapida(${i})" class="btn-notif-rapida">
        ${n.titulo}
      </button>
    `).join("");
  }

  window.enviarNotificacaoRapida = async (i) => {
    const n = notificacoesRapidas[i];
    await enviarNotificacao(n);
  };

  form.onsubmit = async (e) => {
    e.preventDefault();
    const body = Object.fromEntries(new FormData(form).entries());
    await enviarNotificacao(body);
    form.reset();
  };

  async function enviarNotificacao(body) {
    try {
      const res = await fetch("/api/notificacoes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      });

      if (!res.ok) throw new Error("Erro ao enviar notificação");

      alert("Notificação enviada!");
      carregar();

    } catch (e) {
      alert("Erro ao enviar notificação.");
      console.error(e);
    }
  }

  async function carregar() {
    try {
      const res = await fetch("/api/notificacoes");
      if (!res.ok) return;

      const rows = await res.json();

      if (rows.length === 0) {
        lista.innerHTML = `<p style="opacity:0.6;">Nenhuma notificação ainda.</p>`;
        return;
      }

      lista.innerHTML = rows.map(n => `
  <div class="list-item">
    <strong>${n.titulo}</strong><br>
    ${n.mensagem}<br>
    <small>
      ${new Date(n.criado_em).toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" })}
    </small>
    <div>
      <button onclick="deletarNotificacao(${n.id})" class="danger">Remover</button>
    </div>
  </div>
`).join("");


    } catch (err) {
      console.error("Erro ao carregar notificações:", err);
    }
  }

  window.deletarNotificacao = async (id) => {
    if (!confirm("Deseja remover esta notificação?")) return;

    try {
      const res = await fetch(`/api/notificacoes/${id}`, { method: "DELETE" });
      if (res.ok) carregar();
    } catch (err) {
      console.error(err);
    }
  };

  carregar();
}
