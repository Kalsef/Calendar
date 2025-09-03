  // Código de rastreamento de botões
  async function enviarCliqueBotao(descricao) {
    try {
      const response = await fetch('/api/button-click', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ descricao })
      });
      const data = await response.json();
      if (!data.success) console.error('Erro ao enviar clique:', data.error);
    } catch (err) {
      console.error('Erro ao enviar clique:', err);
    }
  }

  document.querySelectorAll('button[data-descricao]').forEach(btn => {
    btn.addEventListener('click', () => {
      const descricao = btn.getAttribute('data-descricao');
      enviarCliqueBotao(descricao);
    });
  });

