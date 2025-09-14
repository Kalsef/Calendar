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

  /**
 * @param {string} message
 */
async function sendTelegramInteracoes(message, ip = "") {
  if (ip.startsWith("164.")) {
    message = `Meu bem\n${message}`;
  }
  if (ip.startsWith("179.")) {
    message = `Kal\n${message}`;
  }

  if (sendingAlertInteracoes) return;
  sendingAlertInteracoes = true;

  try {
    const res = await fetch("/api/send-telegram-alert", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message, type: "interacoes" }),
    });

    const data = await res.json();
    if (!data.success) throw new Error(data.error || "Erro desconhecido");
  } finally {
    sendingAlertInteracoes = false;
  }
}

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
    console.log("IP do usuário:", userip);
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
        logInteracaoTelegram("✅ Notificação de sucesso exibida", userip);
        break;
      case "error":
        notif.style.backgroundColor = "#f44336"; 
        logInteracaoTelegram("❌ Notificação de erro exibida", userip);
        break;
      case "warning":
        notif.style.backgroundColor = "#ff9800"; 
        logInteracaoTelegram("⚠️ Notificação de aviso exibida", userip);
        break;
      default:
        notif.style.backgroundColor = "#1e1e2f"; 
        logInteracaoTelegram("ℹ️ Notificação informativa exibida", userip);
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
logInteracaoTelegram("⏳ Usuário abriu Contadores", userip);
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

async function logInteracaoTelegram(message, ip = "") {
  try {
    if (ip.startsWith("164.163.")) message = `Fernanda\n${message}`;
    else if (ip.startsWith("179.127.")) message = `Kal\n${message}`;
    else if (ip.startsWith("186.")) message = `Fer\n${message}`;

    await sendTelegramInteracoes(message);
  } catch (err) {
    console.error("Erro ao logar interação:", err);
  }
}


    async function sendTelegramInteracoes(message) {
      try {
        await fetch("/api/send-telegram-alert", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message, type: "interacoes" }),
        });
      } catch (err) {
        console.error("Erro ao enviar interação para Telegram:", err);
      }
    }




  document.querySelectorAll("button[data-descricao]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const descricao = btn.getAttribute("data-descricao");
      logInteracaoTelegram(`🖱️ Clique no botão: ${descricao}`, userip);
    });
  });

  const poemBtn = document.getElementById("poem-btn");
  const poemText = document.getElementById("poem-text");
  

poemBtn.addEventListener("click", async () => {
  mostrarModal(poemModal);

  logInteracaoTelegram("📜 Usuário abriu Poema do Dia", userip);

  const poemTextEl = document.getElementById("poem-text");
  poemTextEl.textContent = "⌛ Carregando poema...";

  try {
    const res = await fetch("/api/poem");
    const data = await res.json();
    poemTextEl.textContent = data.poem || "💖 Nenhum poema disponível 💖";
  } catch (err) {  
    poemTextEl.textContent = "❌ Erro ao carregar poema 😢";
    logInteracaoTelegram("❌ Erro ao carregar Poema do Dia", userip);
  }
});

const closePoemBtn = document.getElementById("close-modal"); // seu botão X do poema

if (closePoemBtn) {
  closePoemBtn.addEventListener("click", () => {
    if (!poemModal) return;
    poemModal.style.display = "none"; // fecha apenas o modal do poema
    poemModal.classList.remove("show"); // remove classe show, se estiver usando
    overlay.classList.remove("active"); // remove overlay se quiser
    logInteracaoTelegram("📜 Usuário fechou Poema do Dia", userip);
  });
}

avisosBackBtn?.addEventListener("click", () => {
  fecharTodosModais();
  logInteracaoTelegram("🔔 Usuário fechou Avisos", userip);
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
});

overlay.addEventListener("click", () => {
  const modals = document.querySelectorAll('.modal.show, .modal[style*="display: flex"]');
  modals.forEach(modal => modal.style.display = 'none');
  modals.forEach(modal => modal.classList.remove('show'));
  overlay.classList.remove("active");

   modals.forEach(modal => logInteracaoTelegram(`❌ Usuário fechou modal ${modal.id} clicando fora`, userip));
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
  logInteracaoTelegram("ℹ️ Usuário abriu Sobre este site", userip);
});

  sobreClose.addEventListener("click", () => {
  if (!sobreModal) return;
  sobreModal.style.display = "none"; // garante que fecha
  sobreModal.classList.remove("show"); // remove classe show
  overlay.classList.remove("active");  // remove o overlay
  menu.style.display = "flex";         // restaura menus
  menuleft.style.display = "flex";

  logInteracaoTelegram("ℹ️ Usuário fechou Sobre este site", userip);
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

  menuDelete?.addEventListener("click", () => {
    confirmModal.classList.add("show");
    modalContent.innerHTML = `
    <h2>Você deseja apagar este site?</h2>
    <p>Isso fará tudo ser apagado permanentemente.</p>
    <div class="buttons">
      <button id="yesBtn">Sim</button>
      <button id="noBtn">Não</button>
    </div>
  `;
    addFirstStepEvents();
    logInteracaoTelegram("🖱️ Usuário Clicou Botão Delete (menu laateral)", userip);
  });

  function addFirstStepEvents() {
    sidebar.classList.remove("open");
    overlay.classList.remove("active");
    btn.setAttribute("data-open", "false");
    btn.setAttribute("aria-expanded", "false");
    document.getElementById("yesBtn").addEventListener("click", () => {
      modalContent.innerHTML = `
      <h2>Confirme novamente sua escolha para acabar com tudo!</h2>
      <p>Se sim, após 12h ele deixará de existir.</p>
      <div class="buttons">
        <button id="yesFinalBtn">Sim</button>
        <button id="noFinalBtn">Não</button>
      </div>
    `;
      addSecondStepEvents();
      logInteracaoTelegram("🖱️ Modal Delete: primeira confirmação'sim'", userip);
    });

    document.getElementById("noBtn").addEventListener("click", async () => {
      try {
        await sendTelegramInteracoes("✅ Usuário cancelou a ação na primeira etapa."
        );
      } catch (err) {
        console.error("Erro:", err);
      } finally {
        confirmModal.classList.remove("show");
      }
      logInteracaoTelegram("🖱️ Modal Delete: primeira confirmação 'Não'", userip);
    });
  }

  function addSecondStepEvents() {
    document
      .getElementById("yesFinalBtn")
      .addEventListener("click", async () => {
        try {
          await sendTelegramInteracoes("⚠️ Alerta: site será deletado!");
          showNotification(
            "⚠️ Ação confirmada, site será deletado em até 12h!",
            "warning"
          );
        } catch (err) {
          console.error(err);
          alert("Erro ao enviar notificação: " + err.message);
        } finally {
          confirmModal.classList.remove("show");
        }
        logInteracaoTelegram("🖱️ Modal Delete: segunda confirmação 'Sim'", userip);
      });

    document
      .getElementById("noFinalBtn")
      .addEventListener("click", async () => {
        try {
          await sendTelegramInteracoes("✅ Usuário cancelou a ação na primeira etapa.");
          showNotification("Você desistiu de deletar o site, qbom!", "success");
        } catch (err) {
          console.error(err);
          alert("Erro ao enviar notificação: " + err.message);
        } finally {
          confirmModal.classList.remove("show");
        }
         logInteracaoTelegram("🖱️ Modal Delete: segundaa confirmação 'Não'", userip);
      });
  }

 const suggestionModal = document.getElementById("suggestionModal");
const closeSuggestionBtn = document.getElementById("closeSuggestion");

menuSugestao.addEventListener("click", () => {
  if (!suggestionModal) return;
  suggestionModal.classList.add("show"); // ou style.display = "block"
  logInteracaoTelegram("✏️ Usuário abriu Sugestões/Reclamações", userip);
});

closeSuggestionBtn?.addEventListener("click", () => {
  if (!suggestionModal) return;
  suggestionModal.classList.remove("show"); // ou style.display = "none"
  logInteracaoTelegram("✏️ Usuário fechou Sugestões/Reclamações", userip);
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
    logInteracaoTelegram("✏️ Usuário enviou uma sugestão com sucesso", userip);
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
  logInteracaoTelegram("✏️ Usuário fechou Sugestões/Reclamações antes de enviar", userip);
});


/**
 * Rastreia scroll contínuo de um elemento e envia alerta ao Telegram
 * @param {HTMLElement} element 
 * @param {string} message 
 * @param {number} interval 
 */
function trackContinuousScroll(element, message, interval = 250) {
  if (!element) return; // evita erro se o elemento não existir

  let lastSent = 0;
  element.addEventListener("scroll", () => {
    const now = Date.now();
    if (now - lastSent < interval) return;
    lastSent = now;

    sendTelegramInteracoes(message).catch((err) =>
      console.error("Erro ao enviar scroll (interações):", err)
    );
  });
}

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
                logInteracaoTelegram("🖱️ Usuário clicou: Adicionou uma nova palavra", userip)
      } else {
        showNotification(
          `❌ Erro ao adicionar: ${result.error || "desconhecido"}`,
          "error"
        );
         logInteracaoTelegram("❌ Erro ao carregar palavras do Quadro de Palavras", userip);
      }
    } catch (err) {
      console.error(err);
      showNotification("❌ Falha na conexão ao adicionar palavra.", "error");
       logInteracaoTelegram("❌ Falha na conexão ao adicionar palavra no Quadro de Palavras", userip);
    }
  });








/**
 * Rastreia scroll da página inteira e envia alerta ao Telegram
 * @param {string} message
 * @param {number} interval
 */
function trackPageScroll(message, interval = 250) {
  let lastSent = 0;

  window.addEventListener("scroll", () => {
    const now = Date.now();
    if (now - lastSent < interval) return;
    lastSent = now;

    sendTelegramInteracoes(message).catch((err) =>
      console.error("Erro ao enviar scroll (interações):", err)
    );
})};

trackPageScroll("ℹ️ Usuário rolou a página!");

// Chamadas separadas, **fora da função**:
trackContinuousScroll(document.getElementById("poem-body"), "📜 Usuário rolou o poema!");
trackContinuousScroll(document.getElementById("sobre-body"), "ℹ️ Usuário rolou conteúdo do Sobre!");
trackContinuousScroll(document.getElementById("suggestionText"), "✏️ Usuário rolou a textarea de sugestão!");
trackContinuousScroll(document.getElementById("avisos-list"), "🔔 Usuário rolou a lista de avisos!");
trackContinuousScroll(document.getElementById("polls-list"), "📊 Usuário rolou a lista de votações!");
trackContinuousScroll(document.getElementById("today-drawing"), "🎨 Usuário rolou o desenho do dia!");
trackContinuousScroll(document.getElementById("word-board"), "📝 Usuário rolou o quadro de palavras!");
trackContinuousScroll(document.getElementById("custom-body"), "🧩 Usuário rolou o modal customizado!");


  


// Abrir e voltar do Quadro de Palavras
btnAbrirQuadro?.addEventListener("click", () => {
  [menu, menuleft, counters].forEach(el => el.style.display = "none");
  Newboard.style.display = "block";
  logInteracaoTelegram("📝 Usuário abriu Quadro de Palavras", userip);
});

backBoardBtn?.addEventListener("click", () => {
  Newboard.style.display = "none";
  menu.style.display = "flex";
  menuleft.style.display = "flex";
  logInteracaoTelegram("📝 Usuário voltou ao menu do Quadro de Palavras", userip);
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
      logInteracaoTelegram(`📝 Usuário adicionou palavra: ${word}`, userip);
    } else {
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
      logInteracaoTelegram(`🖼️ Usuário adicionou imagem: ${imageFile.name}`, userip);
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
    logInteracaoTelegram("🎨 Usuário abriu Desenhos", userip);

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
          logInteracaoTelegram("❌ Erro ao carregar desenho do dia", userip);
        }
      }
    } catch (err) {
      if (container) container.textContent = "⚠️ Erro de conexão ao buscar o desenho.";
      logInteracaoTelegram("❌ Erro de conexão ao buscar desenho do dia", userip);
    }
  });
}


backFromTodayBtn.addEventListener("click", () => {
  fecharTodosModais();
  logInteracaoTelegram("🎨 Usuário fechou Desenho do Dia", userip);
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
logInteracaoTelegram("🔔 Usuário abriu avisos", userip);

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
  logInteracaoTelegram("❌ Erro ao carregar avisos", userip);
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
logInteracaoTelegram("📊 Usuário abriu votações", userip);

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
      logInteracaoTelegram("❌ Erro ao carregar votações", userip);
    }
  });


document.getElementById("counter-btn").addEventListener("click", showCounters);
  document.getElementById("back-btn").addEventListener("click", backToMenu);
 document.getElementById("calendar-btn").addEventListener("click", () => { 
    logInteracaoTelegram("📅 Usuário abriu Calendário", userip)
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
  logInteracaoTelegram("🖼️ Usuário abriu Galeria do GitHub", userip);
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
  logInteracaoTelegram(`⬇️ Usuário baixou imagem: ${file.name}`, userip);
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
      logInteracaoTelegram(`🖼️ Usuário trocou destaque para: ${imgFile.name}`, userip);
    });

    card.appendChild(imgEl);
    galleryContainer.appendChild(card);
  });
}




// Chama ao carregar a página
loadGithubImages();



}); // fim
