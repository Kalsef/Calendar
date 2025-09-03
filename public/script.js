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

backBtn?.addEventListener("click", () => {
  window.location.href = "../index.html";
});

let songs = {};
let musicaAtualIndex = 0;

const months = [
  "Janeiro","Fevereiro","Março","Abril","Maio","Junho",
  "Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"
];

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
});

progressBar?.addEventListener("input", () => {
  if (audioPlay && !isNaN(audioPlay.duration)) {
    audioPlay.currentTime = (progressBar.value / 100) * audioPlay.duration;
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
    musicaAtualIndex = 0;
    loadSong(todayStr);
  }
}

daysContainer?.addEventListener("click", (e) => {
  const day = e.target.closest(".day");
  if (!day?.dataset.date) return;
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
//// Abrir modal ao clicar em Delete
//// Abrir modal ao clicar em Delete
deleteBtn.addEventListener('click', () => {
  modal.classList.add('show');
  modalContent.innerHTML = `
    <h2>Você deseja apagar este site?</h2>
    <p>Isso fará tudo ser apagado permanentemente.</p>
    <div class="buttons">
      <button id="yesBtn">Sim</button>
      <button id="noBtn">Não</button>
    </div>
  `;
  modalContent.classList.add('fade-in');
  addFirstStepEvents();
});

// Primeira etapa
function addFirstStepEvents() {
  document.getElementById('yesBtn').addEventListener('click', () => {
    modalContent.innerHTML = `
      <h2>Confirme novamente sua escolha para acabar com tudo!</h2>
      <p>Se sim, após 12h ele deixará de existir.</p>
      <div class="buttons">
        <button id="yesFinalBtn">Sim</button>
        <button id="noFinalBtn">Não</button>
      </div>
    `;
    modalContent.classList.add('fade-in');
    addSecondStepEvents();
  });

  document.getElementById('noBtn').addEventListener('click', () => {
    modal.classList.remove('show');
  });
}

// Segunda etapa com Telegram
let sendingAlert = false; // trava para não enviar várias requisições

function addSecondStepEvents() {
  document.getElementById('yesFinalBtn').addEventListener('click', async () => {
    if (sendingAlert) return; // evita múltiplos cliques
    sendingAlert = true;

    try {
      // Substitua pelo seu chat_id e token do bot
      const chat_id = "SEU_CHAT_ID";
      const token = "SEU_BOT_TOKEN";
      const message = "⚠️ Alerta: site será deletado em 12h!";

      const telegramRes = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chat_id, text: message }),
      });

      const data = await telegramRes.json();

      if (data.ok) {
        alert("Ação confirmada e notificação enviada no Telegram!");
      } else {
        alert("Erro ao enviar notificação: " + (data.description || "Desconhecido"));
      }
    } catch (err) {
      console.error("Erro ao enviar notificação:", err);
      alert("Erro ao enviar notificação: " + err.message);
    } finally {
      sendingAlert = false; // libera o envio
      modal.classList.remove('show'); // fecha modal
    }
  });

  document.getElementById('noFinalBtn').addEventListener('click', () => {
    modal.classList.remove('show');
  });
}
await fetch("/api/send-telegram-alert", { method: "POST" });

// -------------------- Inicialização --------------------
carregarMusicas();
