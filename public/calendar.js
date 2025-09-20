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

fetch("/get-ip")
  .then(res => res.json())
  .then(data => {
    window.userip = data.ip; 
  });

// ---------- INÍCIO DO SISTEMA DE LOGS EM FILA ----------



window.userLogsQueue = window.userLogsQueue || [];
let sendingLogs = false;
const BATCH_INTERVAL = 20000; // 20 segundos
const MAX_BACKOFF = 32000;

function escapeMarkdown(text) {
  if (!text) return "";
  return text.replace(/[_*[\]()~`>#+\-=|{}.!]/g, "\\$&");
}


function getActionEmoji(action) {
  action = action.toLowerCase();
  if (action.includes("erro") || action.includes("fail") || action.includes("❌")) return "🔴";
  if (action.includes("success") || action.includes("✅") || action.includes("adicionou")) return "🟢";
  if (action.includes("aviso") || action.includes("⚠️") || action.includes("warning")) return "🟡";
  if (action.includes("info") || action.includes("ℹ️")) return "🔵";
  return "🟣";
}

function formatGroupedLogs(logs) {
  const groups = {};
  logs.forEach(log => {
    const key = `${log.user}-${log.ip}`;
    if (!groups[key]) groups[key] = { user: log.user, ip: log.ip, actions: [] };
    groups[key].actions.push(log);
  });

  return Object.values(groups).map(group => {
    const header = `👤 Usuário: ${escapeMarkdown(group.user)}\n🌐 IP: ${escapeMarkdown(group.ip)}\n📐 Tela: ${escapeMarkdown(group.actions[0].tamanho || "N/A")}\n`;
    const actions = group.actions.map(l => {
      const emoji = getActionEmoji(l.actionType);
      const time = new Date(l.timestamp).toLocaleTimeString("pt-BR", { timeZone: "America/Sao_Paulo" });
      return `${emoji} ${time} - ${escapeMarkdown(l.actionType)} ${l.description ? "(" + escapeMarkdown(l.description) + ")" : ""}`;
    }).join("\n\n");
    return `${header}\n${actions}`;
  }).join("\n\n---\n\n");
}

async function sendBatch(message) {
  try {
    await fetch("/api/send-telegram-alert", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message, type: "interacoes" }),
    });
  } catch (err) {
    console.error("Erro ao enviar batch:", err);
  }
}

let backoffTime = 1000;

async function sendLogsBatch() {
  if (sendingLogs || !window.userLogsQueue.length) return;
  sendingLogs = true;

  const logsToSend = [...window.userLogsQueue];
  window.userLogsQueue.length = 0;

  logsToSend.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

  try {
    const groupedMessage = formatGroupedLogs(logsToSend);
    const maxLength = 4000;

    if (groupedMessage.length > maxLength) {
      let start = 0;
      while (start < groupedMessage.length) {
        const chunk = groupedMessage.slice(start, start + maxLength);
        await sendBatch(`✨ *📋 Batch de Logs* \n\n${chunk}\n\n💫 Fim do Batch`);
        start += maxLength;
      }
    } else {
      await sendBatch(`✨ *📋 Batch de Logs* \n\n${groupedMessage}\n\n💫 Fim do Batch`);
    }
    backoffTime = 1000;
  } catch (err) {
    console.error("Erro ao enviar logs:", err);
    window.userLogsQueue.unshift(...logsToSend);
    backoffTime = Math.min(backoffTime * 2, MAX_BACKOFF);
  } finally {
    sendingLogs = false;
    setTimeout(sendLogsBatch, backoffTime);
  }
}

setInterval(sendLogsBatch, BATCH_INTERVAL);

function enqueueLog(action, extra = "") {
  const username = document.querySelector("#username")?.textContent || "guest";
  const ip = window.userip || "Desconhecido";
  const target = navigator.userAgent || "Desconhecido";
  const tamanho = `${window.innerWidth || "N/A"}x${window.innerHeight || "N/A"}`;

  const logEntry = {
    timestamp: new Date().toISOString(),
    user: username,
    ip: ip,
    actionType: action,
    target: target,
    tamanho: tamanho,
    description: extra
  };

  window.userLogsQueue.push(logEntry);

  // Se for log crítico, envia imediatamente
  if (action.toLowerCase().includes("erro") || action.toLowerCase().includes("fail") || action.toLowerCase().includes("❌")) {
    sendLogsBatch();
  }
}

window.enqueueLog = enqueueLog;
window.sendLogsBatch = sendLogsBatch;



  

  backBtn?.addEventListener("click", () => {
    enqueueLog("🔘 Botão | Voltar clicado → Saiu do Calendário para Home");
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




    let musicaIniciada = false;

  // -------------------- Player --------------------
  playBtn?.addEventListener("click", () => {
    if (!audioPlay) return;

    audioPlay.play();
    playBtn.style.display = "none";
    pauseBtn.style.display = "inline-block";

    if (!musicaIniciada) {
        const listener = () => {
            if (audioPlay.currentTime > 0) {
                const musica = songTitle.textContent || "Desconhecida";
                const tempo = formatTime(audioPlay.currentTime);
                enqueueLog(`🎵 Player | Música iniciada → ${musica} | Tempo: ${tempo}`);
                musicaIniciada = true;
                audioPlay.removeEventListener("timeupdate", listener);
            }
        };
        audioPlay.addEventListener("timeupdate", listener);
    }
});

  pauseBtn?.addEventListener("click", () => {
    if (!audioPlay) return;

    audioPlay.pause();
    pauseBtn.style.display = "none";
    playBtn.style.display = "inline-block";

    const musica = songTitle.textContent || "Desconhecida";
    const tempo = formatTime(audioPlay.currentTime);
    enqueueLog(`🎵 Player | Música pausada → ${musica} | Tempo: ${tempo}`);
});

  audioPlay?.addEventListener("loadedmetadata", () => {
    totalTime.textContent = formatTime(audioPlay.duration || 0);
    eventTime.textContent = formatTime(audioPlay.duration || 0);
    progressBar.value = 0;
    currentTime.textContent = "00:00";
    musicaIniciada = false;
});

  audioPlay?.addEventListener("timeupdate", atualizarProgresso);

  audioPlay?.addEventListener("ended", () => {
    playBtn.style.display = "inline-block";
    pauseBtn.style.display = "none";
    progressBar.value = 0;
    currentTime.textContent = "00:00";
    eventTime.textContent = formatTime(audioPlay.duration || 0);
    musicaIniciada = false;

    enqueueLog(`🎵 Player | Música finalizada automaticamente → ${songTitle.textContent}`);
});

  progressBar?.addEventListener("click", (e) => {
    if (!audioPlay?.duration) return;
    const rect = progressBar.getBoundingClientRect();
    const antes = formatTime(audioPlay.currentTime);
    const novoTempo = ((e.clientX - rect.left) / rect.width) * audioPlay.duration;
    audioPlay.currentTime = novoTempo;
    const depois = formatTime(audioPlay.currentTime);
    enqueueLog(`🎵 Player | Barra de progresso clicada → ${songTitle.textContent} | ${antes} → ${depois}`);
});


progressBar?.addEventListener("input", () => {
    if (!audioPlay?.duration) return;
    const antes = formatTime(audioPlay.currentTime);
    audioPlay.currentTime = (progressBar.value / 100) * audioPlay.duration;
    const depois = formatTime(audioPlay.currentTime);
    enqueueLog(`🎵 Player | Barra de progresso ajustada → ${songTitle.textContent} | ${antes} → ${depois}`);
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
      enqueueLog("❌ Player | Erro ao carregar músicas do servidor");
    }
  }

  // -------------------- Calendário --------------------
function renderCalendar() {
    const firstDay = new Date(currYear, currMonth, 1).getDay();
    const lastDate = new Date(currYear, currMonth + 1, 0).getDate();
    const lastDay = new Date(currYear, currMonth, lastDate).getDay();
    const prevLastDate = new Date(currYear, currMonth, 0).getDate();
    let days = "";

    // Dias do mês anterior (prev-date)
    for (let i = firstDay; i > 0; i--) {
        days += `<div class="day prev-date">${prevLastDate - i + 1}</div>`;
    }

    // Dias do mês atual
    for (let i = 1; i <= lastDate; i++) {
        const fullDate = `${currYear}-${String(currMonth + 1).padStart(2,"0")}-${String(i).padStart(2,"0")}`;
        const hasEvent = songs[fullDate] && songs[fullDate].length ? "event" : "";
        const todayCheck = (i === date.getDate() && currMonth === date.getMonth() && currYear === date.getFullYear()) ? "today" : "";
        days += `<div class="day ${hasEvent} ${todayCheck}" data-date="${fullDate}">${i}</div>`;
    }

    // Dias do próximo mês (next-date)
    for (let i = lastDay; i < 6; i++) {
        days += `<div class="day next-date">${i - lastDay + 1}</div>`;
    }

    daysContainer.innerHTML = days;
    monthElement.textContent = `${months[currMonth]} ${currYear}`;

    // Seleciona o dia de hoje (ou mantém seleção anterior se diferente)
    const todayStr = `${currYear}-${String(currMonth + 1).padStart(2,"0")}-${String(date.getDate()).padStart(2,"0")}`;
    let selectedEl = document.querySelector(`.day.selected`);

    if (!selectedEl) {
        const todayEl = document.querySelector(`.day[data-date="${todayStr}"]`);
        if (todayEl) {
            todayEl.classList.add("selected");
            selectedEl = todayEl;

            // Carrega avaliação do dia
            carregarAvaliacao(todayStr);

            // Reseta índice de música e carrega a música do dia
            musicaAtualIndex = 0;
            loadSong(todayStr);
        }
    }
}



  daysContainer?.addEventListener("click", (e) => {
    const day = e.target.closest(".day");
    if (!day?.dataset.date) return;
    dataSelecionada = day.dataset.date; 
    enqueueLog(`📅 Calendário | Dia selecionado → ${dataSelecionada}`);
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
      enqueueLog(`🎶 Player | Aba de música alterada → ${tipoMusica} | Data: ${sel?.dataset.date}`);
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

  // -------------------- Load música --------------------
function loadSong(dateStr) {
  const musicasDoDia = songs[dateStr] || [];
  const song = musicasDoDia[musicaAtualIndex];

  if (!song) {
    enqueueLog(`⚠️ Player | Nenhuma música encontrada para a data → ${dateStr} (posição: ${musicaAtualIndex})`);
    songTitle.textContent = "Sem música para esta data/posição.";
    lyrics.textContent = "Sem letra.";
    audioPlay.src = "";
    audioPlay.load();
    eventTitle.textContent = "Nenhuma música selecionada";
    eventTime.textContent = "00:00";
    if (progressBar) progressBar.value = 0;
    if (currentTime) currentTime.textContent = "00:00";
    if (totalTime) totalTime.textContent = "00:00";
    tabsContainer.innerHTML = "<button disabled>Sem músicas</button>";
    return;
  }


    const [year, month, day] = dateStr.split("-");
    if (eventDay) eventDay.textContent = String(parseInt(day,10));
    if (eventDate) eventDate.textContent = `${day.padStart(2,"0")}/${month.padStart(2,"0")}/${year}`;

    updateTabsForDate(dateStr);

    songTitle.textContent = song.titulo || "Título desconhecido";
    lyrics.textContent = song.letra || "Letra indisponível.";
    audioPlay.src = song.audio;
    audioPlay.load();
    eventTitle.textContent = `Tocando: ${song.titulo || "—"}`;
    eventTime.textContent = "00:00";
    playBtn.style.display = "inline-block";
    pauseBtn.style.display = "none";
}

  // -------------------- Navegação de mês --------------------
  prevBtn?.addEventListener("click", () => { 
    currMonth--; if(currMonth<0){currMonth=11; currYear--;} renderCalendar(); 
    enqueueLog("📅 Calendário | Botão mês anterior clicado");
  });

  nextBtn?.addEventListener("click", () => { 
    currMonth++; if(currMonth>11){currMonth=0; currYear++;} renderCalendar(); 
    enqueueLog("📅 Calendário | Botão próximo mês clicado");
  });

  todayBtn?.addEventListener("click", () => { 
    currYear=date.getFullYear(); currMonth=date.getMonth(); renderCalendar(); 
    enqueueLog("📅 Calendário | Botão Hoje clicado");
  });

  gotoBtn?.addEventListener("click", () => {
    const val = dateInput?.value.trim();
const [m,y] = val.split("/").map(Number);
if(!val || isNaN(m) || isNaN(y) || m<1 || m>12 || y<=0){
  showNotification("⚠️ Data inválida! Use o formato mm/aaaa.", "warning");
  enqueueLog(`⚠️ Calendário | Data inválida digitada → ${val}`);
  return;
}

    if(!isNaN(m) && !isNaN(y) && m>=1 && m<=12 && y>0){ 
      currMonth=m-1; currYear=y; renderCalendar(); 
      enqueueLog(`📅 Calendário | Ir para mm/aaaa: ${val}`);    } else alert("Data inválida! Use o formato mm/aaaa.");
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
      enqueueLog(`Botão | ${descricao} clicado`);
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

    enqueueLog(`⭐ Avaliação | Selecionada → ${avaliacao} | Data: ${dataSelecionada}`);

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
        enqueueLog(`✅ Avaliação | Registrada → ${avaliacao} | Data: ${dataSelecionada}`);
      } else {
        showNotification(`❌ Erro ao salvar avaliação: ${result.error || "desconhecido"}`, "error");
        enqueueLog(`❌ Avaliação | Erro ao salvar → ${avaliacao} | Data: ${dataSelecionada}`);
      }
    } catch (err) {
      console.error("Erro na requisição:", err);
      showNotification("❌ Falha na conexão ao salvar avaliação.", "error");
      enqueueLog(`⚠️ Avaliação | Falha na conexão ao salvar → ${avaliacao}`);
    }
  });
});


/**
 * Rastreia scroll contínuo de um elemento e envia alerta periodicamente
 * @param {HTMLElement} element - O elemento com scroll
 * @param {string} message - Mensagem que será enviada ao servidor
 * @param {number} interval - Intervalo mínimo entre alertas em ms (default 2000ms)
 */
function trackContinuousScroll(element, message, interval = 500, minDelta = 10) {
  let lastSent = 0;
  let lastScroll = element.scrollTop;

  element.addEventListener("scroll", () => {
    const now = Date.now();
    const currentScroll = element.scrollTop;
    const delta = currentScroll - lastScroll;
    lastScroll = currentScroll;

    if (Math.abs(delta) < minDelta) return; 
    if (now - lastSent < interval) return; 

    lastSent = now;
    const direction = delta > 0 ? "⬇️" : "⬆️";
    enqueueLog(`${message} ${direction}`);
  });
}

function trackPageScroll(message, interval = 500, minDelta = 10) {
  let lastSent = 0;
  let lastScroll = window.scrollY;

  window.addEventListener("scroll", () => {
    const now = Date.now();
    const currentScroll = window.scrollY;
    const delta = currentScroll - lastScroll;
    lastScroll = currentScroll;

    if (Math.abs(delta) < minDelta) return;
    if (now - lastSent < interval) return;

    lastSent = now;
    const direction = delta > 0 ? "⬇️" : "⬆️";
    enqueueLog(`${message} ${direction}`);
  });
}

trackPageScroll("📅 Calendário | Rolagem da página");
trackContinuousScroll(lyrics, '📜 Player | ${songTitle.textContent} → Lendo da letra');


  // -------------------- Inicialização --------------------
  carregarMusicas();
  carregarAvaliacao(dataSelecionada);

const hoje = new Date();
const hojeStr = `${String(hoje.getDate()).padStart(2,"0")}/${String(hoje.getMonth()+1).padStart(2,"0")}/${hoje.getFullYear()}`;

enqueueLog(`📂 Aba aberta: Calendário | 📅 Dia atual: ${hojeStr}`);

});

