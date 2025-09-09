document.addEventListener("DOMContentLoaded", () => {

  // -------------------- Variáveis iniciais --------------------
  const date = new Date();
  let currYear = date.getFullYear();
  let currMonth = date.getMonth();

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
   const opcoesDia = document.querySelectorAll('.avaliacao-dia .opcao');
   let dataSelecionada = new Date().toISOString().slice(0,10); 


  

  backBtn?.addEventListener("click", () => {
    registrarClique("Botão de Voltar do Calendário");
    window.location.href = "../index.html";
  });

  let songs = {};
  let musicaAtualIndex = 0;

  const months = [
    "Janeiro","Fevereiro","Março","Abril","Maio","Junho",
    "Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"
  ];


function showNotification(message, type = "info", duration = 2500) {
  const notif = document.createElement("div");
  notif.className = `custom-notification ${type}`;
  notif.textContent = message;

  notif.style.position = "fixed";
notif.style.top = "20px";
notif.style.padding = "12px 20px";
notif.style.borderRadius = "8px";
notif.style.color = "#fff";
notif.style.fontSize = "14px";
notif.style.fontWeight = "600";
notif.style.zIndex = "9999";
notif.style.boxShadow = "0 4px 12px rgba(0,0,0,0.3)";
notif.style.opacity = "0";
notif.style.transition = "opacity 0.3s, transform 0.3s";
notif.style.transform = "translateY(-20px)";
notif.style.maxWidth = "90%"; 
notif.style.width = "auto"; 

if (window.innerWidth <= 480) { 
    notif.style.right = "10px";
} else { 
    notif.style.right = "40px";
}
notif.style.left = "auto";


  switch(type){
    case "success": notif.style.background = "#4caf50"; break;
    case "error": notif.style.background = "#f44336"; break;
    case "warning": notif.style.background = "#ff9800"; break;
    default: notif.style.background = "#2196f3";
  }

  document.body.appendChild(notif);

  // Mostrar
  requestAnimationFrame(() => {
    notif.style.opacity = "1";
    notif.style.transform = "translateY(0)";
  });

  // Remover depois de um tempo
  setTimeout(() => {
    notif.style.opacity = "0";
    notif.style.transform = "translateY(-20px)";
    notif.addEventListener("transitionend", () => notif.remove());
  }, duration);
}


  // Marcar avaliação visualmente
  function marcarOpcao(avaliacao) {
    opcoesDia.forEach(o => {
      o.classList.remove('selecionado');
      if (o.dataset.avaliacao === avaliacao) {
        o.classList.add('selecionado');
      }
    });
  }




  function registrarClique(descricao) {
    try {
      fetch("/api/button-click", {
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
    registrarClique("Play música");
  });

  pauseBtn?.addEventListener("click", () => {
    audioPlay?.pause();
    pauseBtn.style.display = "none";
    playBtn.style.display = "inline-block";
    registrarClique("Pause música");
  });

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

  const barra = document.querySelector(".barra");
  barra?.addEventListener("click", (e) => {
    if (!audioPlay?.duration) return;
    const rect = barra.getBoundingClientRect();
    const novoTempo = ((e.clientX - rect.left) / rect.width) * audioPlay.duration;
    audioPlay.currentTime = novoTempo;
    atualizarProgresso();
    registrarClique("Clique na barra de progresso");
  });

  progressBar?.addEventListener("input", () => {
    if (audioPlay && !isNaN(audioPlay.duration)) {
      audioPlay.currentTime = (progressBar.value / 100) * audioPlay.duration;
      registrarClique("Input na barra de progresso");
    }
  });

  function atualizarProgresso() {
    if (!audioPlay || !progressBar || !coracao) return;
    const duracao = audioPlay.duration || 0;
    const tempoAtual = audioPlay.currentTime || 0;
    const porcentagem = duracao ? (tempoAtual / duracao) * 100 : 0;
    progressBar.value = porcentagem;
    coracao.style.left = `${Math.min(Math.max(porcentagem, 0), 100)}%`;
    currentTime.textContent = formatTime(tempoAtual);
  }

  function formatTime(sec) {
    if (!sec || isNaN(sec)) return "00:00";
    const minutes = Math.floor(sec / 60);
    const seconds = Math.floor(sec % 60).toString().padStart(2, "0");
    return `${minutes}:${seconds}`;
  }

  // -------------------- Calendário --------------------
  async function carregarMusicas() {
    try {
      const res = await fetch("/api/musicas");
      if (!res.ok) throw new Error("Falha ao buscar músicas");
      songs = await res.json();
      renderCalendar();
    } catch (err) {
      console.error(err);
      songs = {};
      renderCalendar();
    }
  }

  function renderCalendar() {
    const firstDay = new Date(currYear, currMonth, 1).getDay();
    const lastDate = new Date(currYear, currMonth + 1, 0).getDate();
    const lastDay = new Date(currYear, currMonth, lastDate).getDay();
    const prevLastDate = new Date(currYear, currMonth, 0).getDate();
    let days = "";

    for (let i = firstDay; i > 0; i--)
      days += `<div class="day prev-date">${prevLastDate - i + 1}</div>`;

    for (let i = 1; i <= lastDate; i++) {
      const fullDate = `${currYear}-${String(currMonth + 1).padStart(2,"0")}-${String(i).padStart(2,"0")}`;
      const hasEvent = songs[fullDate] ? "event" : "";
      const todayCheck = (i === date.getDate() && currMonth === date.getMonth() && currYear === date.getFullYear()) ? "today" : "";
      days += `<div class="day ${hasEvent} ${todayCheck}" data-date="${fullDate}">${i}</div>`;
    }

    for (let i = lastDay; i < 6; i++)
      days += `<div class="day next-date">${i - lastDay + 1}</div>`;

    daysContainer.innerHTML = days;
    monthElement.textContent = `${months[currMonth]} ${currYear}`;

    const todayStr = `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,"0")}-${String(date.getDate()).padStart(2,"0")}`;
    const todayEl = document.querySelector(`.day[data-date="${todayStr}"]`);
    if (todayEl) {
      todayEl.classList.add("selected");

      carregarAvaliacao(todayStr);

      musicaAtualIndex = 0;
      loadSong(todayStr);
    }
  }

  daysContainer?.addEventListener("click", (e) => {
    const day = e.target.closest(".day");
    if (!day?.dataset.date) return;
    dataSelecionada = day.dataset.date; // Atualiza a data selecionada

    registrarClique(`Dia selecionado: ${day.dataset.date}`);
    carregarAvaliacao(dataSelecionada);

    daysContainer.querySelectorAll(".day.selected").forEach(d => d.classList.remove("selected"));
    day.classList.add("selected");
    musicaAtualIndex = 0;
    updateTabsForDate(day.dataset.date);
    loadSong(day.dataset.date);
  });

  function updateTabsForDate(dateStr) {
    tabsContainer.innerHTML = "";
    const arr = songs[dateStr] || [];
    if (!arr.length) {
      const btn = document.createElement("button");
      btn.textContent = "Sem músicas";
      btn.disabled = true;
      btn.classList.add("music-tab-btn");
      tabsContainer.appendChild(btn);
      return;
    }
    arr.forEach((m, idx) => {
      const btn = document.createElement("button");
      btn.textContent = idx === 0 ? "Música de Bom Dia" : (arr.length === 2 ? "Dedicação Especial" : `Dedicação Especial ${idx+1}`);
      btn.dataset.index = idx;
      btn.classList.add("music-tab-btn");
      if (idx === musicaAtualIndex) btn.classList.add("active");
      btn.onclick = () => {
        musicaAtualIndex = idx;
        updateTabStyles();
        const sel = document.querySelector(".day.selected");
        if (sel?.dataset.date) loadSong(sel.dataset.date);
  const tipoMusica = idx === 0 ? "Música de Bom Dia" : "Dedicação Especial";
  registrarClique(`Dia: ${sel?.dataset.date || 'desconhecido'} - ${tipoMusica} (índice ${idx})`);
      };
      tabsContainer.appendChild(btn);
    });
    updateTabStyles();
  }

  function updateTabStyles() {
    [...tabsContainer.children].forEach((btn, idx) => {
      btn.style.opacity = idx === musicaAtualIndex ? "1" : "0.6";
    });
  }

  function loadSong(dateStr) {
    const musicasDoDia = songs[dateStr] || [];
    const song = musicasDoDia[musicaAtualIndex];

    const [year, month, day] = dateStr.split("-");
    if (eventDay) eventDay.textContent = String(parseInt(day,10));
    if (eventDate) eventDate.textContent = `${day.padStart(2,"0")}/${month.padStart(2,"0")}/${year}`;

    updateTabsForDate(dateStr);

    if (song?.audio) {
      songTitle.textContent = song.titulo || "Título desconhecido";
      lyrics.textContent = song.letra || "Letra indisponível.";
      audioPlay.src = song.audio;
      audioPlay.load();
      eventTitle.textContent = `Tocando: ${song.titulo || "—"}`;
      eventTime.textContent = "00:00";
      playBtn.style.display = "inline-block";
      pauseBtn.style.display = "none";
    } else {
      songTitle.textContent = "Sem música para esta data/posição.";
      lyrics.textContent = "Sem letra.";
      audioPlay.src = "";
      audioPlay.load();
      eventTitle.textContent = "Nenhuma música selecionada";
      eventTime.textContent = "00:00";
      if (progressBar) progressBar.value = 0;
      if (currentTime) currentTime.textContent = "00:00";
      if (totalTime) totalTime.textContent = "00:00";
    }
  }

  // -------------------- Navegação de mês --------------------
  prevBtn?.addEventListener("click", () => { 
    currMonth--; if(currMonth<0){currMonth=11; currYear--;} renderCalendar(); 
    registrarClique("Botão mês anterior clicado");
  });

  nextBtn?.addEventListener("click", () => { 
    currMonth++; if(currMonth>11){currMonth=0; currYear++;} renderCalendar(); 
    registrarClique("Botão próximo mês clicado");
  });

  todayBtn?.addEventListener("click", () => { 
    currYear=date.getFullYear(); currMonth=date.getMonth(); renderCalendar(); 
    registrarClique("Botão Hoje clicado");
  });

  gotoBtn?.addEventListener("click", () => {
    const val = dateInput?.value.trim();
const [m,y] = val.split("/").map(Number);
if(!val || isNaN(m) || isNaN(y) || m<1 || m>12 || y<=0){
  showNotification("⚠️ Data inválida! Use o formato mm/aaaa.", "warning");
  return;
}

    if(!isNaN(m) && !isNaN(y) && m>=1 && m<=12 && y>0){ 
      currMonth=m-1; currYear=y; renderCalendar(); 
      registrarClique(`Ir para mm/aaaa: ${val}`);
    } else alert("Data inválida! Use o formato mm/aaaa.");
  });

  

  

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
    } finally { sendingAlert = false; }
  }

  // -------------------- Rastreamento global de botões --------------------
  document.querySelectorAll('button[data-descricao]').forEach(btn => {
    btn.addEventListener('click', () => {
      const descricao = btn.getAttribute('data-descricao');
      registrarClique(descricao);
    });

  });


 // notas

async function carregarAvaliacao(data) {
  try {
    const res = await fetch(`/api/avaliacao-dia/${data}`);
    const json = await res.json();
    if (json.avaliacao) {
      marcarOpcao(json.avaliacao);
    } else {
      // limpa seleção caso não tenha avaliação nesse dia
      opcoesDia.forEach(o => o.classList.remove('selecionado'));
    }
  } catch (err) {
    console.error("Erro ao carregar avaliação:", err);
  }
}


 opcoesDia.forEach(opcao => {
  opcao.addEventListener('click', async () => {
    opcoesDia.forEach(o => o.classList.remove('selecionado'));
    opcao.classList.add('selecionado');

    const avaliacao = opcao.dataset.avaliacao;

    registrarClique(`Avaliação selecionada: ${avaliacao} na data ${dataSelecionada}`);

    try {
      const res = await fetch('/api/avaliacao-dia', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data: dataSelecionada, avaliacao })
      });
      const result = await res.json();
      if (result.success) {
        marcarOpcao(avaliacao);
        showNotification(`✅ Avaliação "${avaliacao}" registrada!`, "success");
      } else {
        showNotification(`❌ Erro ao salvar avaliação: ${result.error || "desconhecido"}`, "error");
      }
    } catch (err) {
      console.error("Erro na requisição:", err);
      showNotification("❌ Falha na conexão ao salvar avaliação.", "error");
    }
  });
});


/**
 * Rastreia scroll contínuo de um elemento e envia alerta periodicamente
 * @param {HTMLElement} element - O elemento com scroll
 * @param {string} message - Mensagem que será enviada ao servidor
 * @param {number} interval - Intervalo mínimo entre alertas em ms (default 2000ms)
 */
function trackContinuousScroll(element, message, interval = 250) {
  let lastSent = 0;

  element.addEventListener("scroll", () => {
    const now = Date.now();
    if (now - lastSent < interval) return; // ignora scrolls muito próximos
    lastSent = now;

    // Aqui você envia a requisição
    fetch("/api/send-telegram-alert", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message })
    })
    .then(res => res.json())
    .then(data => {
      if (!data.success) console.error("Erro ao enviar scroll:", data.error);
    })
    .catch(err => console.error("Erro de conexão:", err));
  });
}

// Rastreia scroll da página inteira com intervalo curto
function trackPageScroll(message, interval = 250) {
  let lastSent = 0;

  window.addEventListener("scroll", () => {
    const now = Date.now();
    if (now - lastSent < interval) return; // ignora scrolls muito próximos
    lastSent = now;

    fetch("/api/send-telegram-alert", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message }),
    })
      .then(res => res.json())
      .then(data => {
        if (!data.success) console.error("Erro ao enviar scroll:", data.error);
      })
      .catch(err => console.error("Erro de conexão:", err));
  });
}

trackPageScroll("📅 Usuário rolou a página do calendário!");


trackContinuousScroll(lyrics, "🎵 Usuário rolou a música!");



  // -------------------- Inicialização --------------------
  carregarMusicas();
  carregarAvaliacao(dataSelecionada);

});

