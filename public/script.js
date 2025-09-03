document.addEventListener("DOMContentLoaded", () => {

  // -------------------- Variáveis iniciais --------------------
  const date = new Date();
  let currYear = date.getFullYear();
  let currMonth = date.getMonth();

  const deleteBtn = document.getElementById("Delete");
  const modal = document.getElementById("confirmModal");
  const modalContent = document.querySelector(".modal-content");
  const daysContainer = document.querySelector(".days");
  const monthElement = document.querySelector(".date");
  const prevBtn = document.querySelector(".prev");
  const nextBtn = document.querySelector(".next");
  const todayBtn = document.querySelector(".today-btn");
  const gotoBtn = document.querySelector(".goto-btn");
  const dateInput = document.querySelector(".date-input");
  const eventDay = document.querySelector(".event-day");
  const eventDate = document.querySelector(".event-date");
  const audioPlay = document.getElementById("audioPlayer");
  const songTitle = document.getElementById("songTitle");
  const lyrics = document.getElementById("lyrics");
  const progressBar = document.getElementById("progressBar");
  const currentTime = document.getElementById("currentTime");
  const totalTime = document.getElementById("totalTime");
  const playBtn = document.getElementById("playBtn");
  const pauseBtn = document.getElementById("pauseBtn");
  const eventTitle = document.querySelector(".event-title");
  const eventTime = document.querySelector(".event-time");
  const coracao = document.getElementById("coracao");
  const tabsContainer = document.getElementById("tabs");
  const backBtn = document.getElementById("backBtn");

  let songs = {};
  let musicaAtualIndex = 0;

  const months = [
    "Janeiro","Fevereiro","Março","Abril","Maio","Junho",
    "Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"
  ];

  // -------------------- Funções auxiliares --------------------
  function identificarBotao(botao) {
    if (botao.id) return `Botão [${botao.id}]`;
    if (botao.innerText.trim()) return `Botão "${botao.innerText.trim()}"`;
    return "Botão sem identificação";
  }

  async function registrarClique(descricao) {
    try {
      await fetch("/api/button-click", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ descricao })
      });
    } catch (err) {
      console.error("Erro ao registrar clique:", err);
    }
  }

  // -------------------- Player --------------------
  playBtn?.addEventListener("click", () => {
    audioPlay?.play();
    playBtn.style.display = "none";
    pauseBtn.style.display = "inline-block";
  });

  pauseBtn?.addEventListener("click", () => {
    audioPlay?.pause();
    pauseBtn.style.display = "none";
    playBtn.style.display = "inline-block";
  });

  function formatTime(sec) {
    if (!sec || isNaN(sec)) return "00:00";
    const minutes = Math.floor(sec / 60);
    const seconds = Math.floor(sec % 60).toString().padStart(2, "0");
    return `${minutes}:${seconds}`;
  }

  function atualizarProgresso() {
    if (!audioPlay || !progressBar || !coracao) return;
    const duracao = audioPlay.duration || 0;
    const tempoAtual = audioPlay.currentTime || 0;
    const porcentagem = duracao ? (tempoAtual / duracao) * 100 : 0;
    progressBar.value = porcentagem;
    coracao.style.left = `${Math.min(Math.max(porcentagem, 0), 100)}%`;
    currentTime.textContent = formatTime(tempoAtual);
  }

  audioPlay?.addEventListener("loadedmetadata", () => {
    totalTime.textContent = formatTime(audioPlay.duration || 0);
    eventTime.textContent = formatTime(audioPlay.duration || 0);
  });

  audioPlay?.addEventListener("timeupdate", atualizarProgresso);

  audioPlay?.addEventListener("ended", () => {
    playBtn.style.display = "inline-block";
    pauseBtn.style.display = "none";
    progressBar.value = 0;
    currentTime.textContent = "00:00";
    eventTime.textContent = formatTime(audioPlay.duration || 0);
  });

  // -------------------- Navegação de calendário --------------------
  backBtn?.addEventListener("click", () => {
    window.location.href = "../index.html";
  });

  prevBtn?.addEventListener("click", () => { currMonth--; if(currMonth<0){currMonth=11; currYear--;} renderCalendar(); });
  nextBtn?.addEventListener("click", () => { currMonth++; if(currMonth>11){currMonth=0; currYear++;} renderCalendar(); });
  todayBtn?.addEventListener("click", () => { currYear=date.getFullYear(); currMonth=date.getMonth(); renderCalendar(); });
  gotoBtn?.addEventListener("click", () => {
    const val = dateInput?.value.trim();
    if(!val) return alert("Data inválida! Use o formato mm/aaaa.");
    const [m,y] = val.split("/").map(Number);
    if(!isNaN(m) && !isNaN(y) && m>=1 && m<=12 && y>0){ currMonth=m-1; currYear=y; renderCalendar(); }
    else alert("Data inválida! Use o formato mm/aaaa.");
  });

  // -------------------- Modal Delete --------------------
  let sendingAlert = false;

  async function sendTelegramMessage(message) {
    if (sendingAlert) return;
    sendingAlert = true;

    try {
      const res = await fetch("/api/send-telegram-alert", { 
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message })
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || "Desconhecido");
    } finally {
      sendingAlert = false;
    }
  }

  function addFirstStepEvents() {
    const yesBtn = document.getElementById('yesBtn');
    const noBtn = document.getElementById('noBtn');

    yesBtn?.addEventListener('click', () => {
      modalContent.innerHTML = `
        <h2>Confirme novamente sua escolha para acabar com tudo!</h2>
        <p>Se sim, após 12h ele deixará de existir.</p>
        <div class="buttons">
          <button id="yesFinalBtn">Sim</button>
          <button id="noFinalBtn">Não</button>
        </div>
      `;
      addSecondStepEvents();
    });

    noBtn?.addEventListener('click', async () => {
      await sendTelegramMessage("✅ Usuário cancelou a ação na primeira etapa.");
      modal.classList.remove('show');
    });
  }

  function addSecondStepEvents() {
    const yesFinalBtn = document.getElementById('yesFinalBtn');
    const noFinalBtn = document.getElementById('noFinalBtn');

    yesFinalBtn?.addEventListener('click', async () => {
      await sendTelegramMessage("⚠️ Alerta: site será deletado!");
      alert("⚠️Ação confirmada, site será deletado em até 12h!⚠️");
      modal.classList.remove('show');
    });

    noFinalBtn?.addEventListener('click', async () => {
      await sendTelegramMessage("✅ Usuário desistiu de apagar o site.");
      alert("Você desistiu de deletar o site, qbom!");
      modal.classList.remove('show');
    });
  }

  deleteBtn?.addEventListener('click', () => {
    modal.classList.add('show');
    modalContent.innerHTML = `
      <h2>Você deseja apagar este site?</h2>
      <p>Isso fará tudo ser apagado permanentemente.</p>
      <div class="buttons">
        <button id="yesBtn">Sim</button>
        <button id="noBtn">Não</button>
      </div>
    `;
    addFirstStepEvents();
  });

  // -------------------- Registrar cliques manualmente --------------------
  const botoesFixos = [backBtn, playBtn, pauseBtn, prevBtn, nextBtn, todayBtn, gotoBtn, deleteBtn];
  botoesFixos.forEach(btn => {
    if (!btn) return;
    btn.addEventListener("click", () => {
      const descricao = identificarBotao(btn);
      registrarClique(descricao);
    });
  });

  // -------------------- Inicialização --------------------
  carregarMusicas();

});
