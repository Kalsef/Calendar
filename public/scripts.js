document.addEventListener("DOMContentLoaded", () => {
      const counters = document.getElementById("counters");
document.getElementById("back-board-btn").addEventListener("click", backToMenuFromBoard);
document.getElementById("counter-btn").addEventListener("click", showCounters);
document.getElementById("back-btn").addEventListener("click", backToMenu);
document.getElementById("calendar-btn").addEventListener("click", () => {
  window.location.href = "calendar.html";
});
document.getElementById("menuSobre").addEventListener("click", abrirSobre);
document.getElementById("menuSugestao").addEventListener("click", abrirSuggestionModal);

function showSection(section) {
  menu.style.display = "none";
  menuleft.style.display = "none";
  Newboard.style.display = "none";
  section.style.display = "flex";
}

const btnAbrirQuadro = document.getElementById("btnAbrirQuadro");
const backBoardBtn = document.getElementById("back-board-btn");
const openTodayBtn = document.getElementById("open-today");
const backFromTodayBtn = document.getElementById("back-from-today");
const menu = document.getElementById("menu");
const menuleft = document.getElementById("menuleft");
const Newboard = document.getElementById("Newboard");

btnAbrirQuadro.addEventListener("click", () => showSection(Newboard));
backBoardBtn.addEventListener("click", () => showSection(menu));


      function backToMenu() {
        counters.style.display = "none";
        menu.style.display = "flex";
        menuleft.style.display = "flex";
        enviarCliqueBotao("Voltar ao Menu Principal contador");

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

      const CounterManager = (() => {
        let intervalId = null;

        const start = () => {
          if (intervalId) clearInterval(intervalId);
          intervalId = setInterval(updateCounters, 1000);
        };

        const stop = () => {
          if (intervalId) {
            clearInterval(intervalId);
            intervalId = null;
          }
        };

        return { start, stop };
      })();

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

        const loadingEl = document.getElementById("counter-loading");
        loadingEl.style.display = "block"; 

        counterElems.forEach((el) => (el.style.display = "none"));

        try {
          const imagePromises = countersData.map((data) =>
            loadImage(data.image)
          );

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

      async function enviarCliqueBotao(descricao) {
        try {
          const response = await fetch("/api/button-click", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ descricao }),
          });
          const data = await response.json();
          if (!data.success)
            console.error("Erro ao enviar clique:", data.error);
        } catch (err) {
          console.error("Erro ao enviar clique:", err);
        }
      }

      document.querySelectorAll("button[data-descricao]").forEach((btn) => {
        btn.addEventListener("click", () => {
          const descricao = btn.getAttribute("data-descricao");
          enviarCliqueBotao(descricao);
        });
      });

      const poemBtn = document.getElementById("poem-btn");
      const poemModal = document.getElementById("poem-modal");
      const poemText = document.getElementById("poem-text");
      const closeModal = document.getElementById("close-modal");

      poemBtn.addEventListener("click", async () => {
        menu.style.display = "none";
        menuleft.style.display = "none";
        poemText.textContent = "⌛ Carregando poema...";
        poemModal.style.display = "flex";
        try {
          const response = await fetch("/api/poem");
          const data = await response.json();
          let poem = data.poem || "💖 Nenhum poema disponível 💖";

          poemText.textContent = poem;
          poemModal.style.display = "flex";
        } catch (err) {
          console.error("Erro ao carregar poema:", err);
          poemText.textContent = "Erro ao carregar poema 😢";
          poemModal.style.display = "flex";
        }
      });

      closeModal.addEventListener("click", () => {
        poemModal.style.display = "none";
        menu.style.display = "flex";
        menuleft.style.display = "flex"; 
        enviarCliqueBotao("Poema do Dia botão Fechar Clicado");
      });

      window.addEventListener("click", (e) => {
        if (e.target == poemModal) {
          poemModal.style.display = "none";
          menu.style.display = "flex"; 
          menuleft.style.display = "flex"; 
        }
      });

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
        overlay.classList.toggle("active");
      });
      overlay.addEventListener("click", fecharTudo);
      modalClose.addEventListener("click", fecharModal);

      function fecharTudo() {
        sidebar.classList.remove("open");
        overlay.classList.remove("active");
        btn.setAttribute("data-open", "false");
        btn.setAttribute("aria-expanded", "false");
        fecharModal();
      }

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

        enviarCliqueBotao("Menu: Sobre este site botão Fechar Clicado");
      }

      const sobreModal = document.getElementById("sobre-modal");
      const sobreClose = document.getElementById("sobre-close");

      function abrirSobre() {
        enviarCliqueBotao("Menu: Sobre este site clicado");
        sidebar.classList.remove("open");
        overlay.classList.remove("active");
        btn.setAttribute("data-open", "false");
        btn.setAttribute("aria-expanded", "false");
        sobreModal.style.display = "flex";
      }
      sobreClose.addEventListener("click", () => {
        sobreModal.style.display = "none";
        menu.style.display = "flex";
        menuleft.style.display = "flex";
        enviarCliqueBotao("Menu: Sobre este site botão Fechar Clicado");
      });

      window.addEventListener("click", (e) => {
        if (e.target == sobreModal) {
          sobreModal.style.display = "none";
          menu.style.display = "flex";
          menuleft.style.display = "flex";
        }
      });


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
        enviarCliqueBotao("Botão Delete (menu lateral) clicado");
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
          enviarCliqueBotao("Modal Delete: primeira confirmação 'Sim'");
        });

        document.getElementById("noBtn").addEventListener("click", async () => {
          try {
            await sendTelegramMessage(
              "✅ Usuário cancelou a ação na primeira etapa."
            );
          } catch (err) {
            console.error("Erro:", err);
          } finally {
            confirmModal.classList.remove("show");
          }
          enviarCliqueBotao("Modal Delete: primeira confirmação 'Não'");
        });
      }

      function addSecondStepEvents() {
        document
          .getElementById("yesFinalBtn")
          .addEventListener("click", async () => {
            try {
              await sendTelegramMessage("⚠️ Alerta: site será deletado!");
              alert("⚠️ Ação confirmada, site será deletado em até 12h! ⚠️");
            } catch (err) {
              console.error(err);
              alert("Erro ao enviar notificação: " + err.message);
            } finally {
              confirmModal.classList.remove("show");
            }
            enviarCliqueBotao("Modal Delete: segunda confirmação 'Sim'");
          });

        document
          .getElementById("noFinalBtn")
          .addEventListener("click", async () => {
            try {
              await sendTelegramMessage(
                "✅ Usuário desistiu de apagar o site."
              );
              alert("Você desistiu de deletar o site, qbom!");
            } catch (err) {
              console.error(err);
              alert("Erro ao enviar notificação: " + err.message);
            } finally {
              confirmModal.classList.remove("show");
            }
            enviarCliqueBotao("Modal Delete: segunda confirmação 'Não'");
          });
      }

      async function sendTelegramMessage(message) {
        if (sendingAlert) return;
        sendingAlert = true;
        try {
          const res = await fetch("/api/send-telegram-alert", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ message }),
          });
          const data = await res.json();
          if (!data.success) throw new Error(data.error || "Erro desconhecido");
        } finally {
          sendingAlert = false;
        }
      }

      function abrirSuggestionModal() {
        enviarCliqueBotao("Menu: Sugestões ou Reclamações clicado");

        sidebar.classList.remove("open");
        overlay.classList.remove("active");
        btn.setAttribute("data-open", "false");
        btn.setAttribute("aria-expanded", "false");

        document.getElementById("suggestionModal").classList.add("show");
      }

      document
        .getElementById("closeSuggestion")
        .addEventListener("click", () => {
          enviarCliqueBotao(
            "Menu: Sugestões ou Reclamações Botão Fechar Clicado"
          );
          document.getElementById("suggestionModal").classList.remove("show");
        });

      document
        .getElementById("sendSuggestion")
        .addEventListener("click", async () => {
          const text = document.getElementById("suggestionText").value.trim();
          if (!text) {
            alert("Por favor, escreva sua sugestão antes de enviar!");
            return;
          }

          try {
            const res = await fetch("/api/send-telegram-alert", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                message: "💡 Nova sugestão/reclamação:\n\n" + text,
              }),
            });

            const data = await res.json();
            if (data.success) {
              alert("✅ Sua sugestão foi enviada com sucesso!");
              document.getElementById("suggestionText").value = "";
              document
                .getElementById("suggestionModal")
                .classList.remove("show");
            } else {
              alert("❌ Erro ao enviar: " + (data.error || "desconhecido"));
            }
          } catch (err) {
            alert("❌ Erro de conexão: " + err.message);
          }
        });

      /**
       * @param {HTMLElement} element 
       * @param {string} message 
       */
      function trackScroll(element, message) {
        let sent = false; 
        element.addEventListener("scroll", () => {
          const scrollTop = element.scrollTop;
          const scrollHeight = element.scrollHeight;
          const clientHeight = element.clientHeight;

          if (!sent && scrollTop + clientHeight >= scrollHeight - 5) {
            sent = true; 
            console.log(`Scroll completo detectado em: ${element.id}`);

            
            fetch("/api/send-telegram-alert", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ message }),
            })
              .then((res) => res.json())
              .then((data) => {
                if (!data.success)
                  console.error("Erro ao enviar scroll:", data.error);
              })
              .catch((err) => console.error("Erro de conexão:", err));
          }
        });
      }

      trackScroll(
        document.getElementById("poem-body"),
        "📜 Usuário leu o poema até o final!"
      );
      trackScroll(
        document.getElementById("sobre-body"),
        "ℹ️ Usuário leu todo o conteúdo do Sobre!"
      );
      trackScroll(
        document.getElementById("suggestionText"),
        "✏️ Usuário rolou a textarea de sugestão até o fim!"
      );
       
      

const wordBoard = document.getElementById("word-board");
const newWordInput = document.getElementById("new-word");
const addWordBtn = document.getElementById("add-word");

 btnAbrirQuadro.addEventListener("click", () => {
    menu.style.display = "none";
    menuleft.style.display = "none";
    counters.style.display = "none";
    Newboard.style.display = "block";

    enviarCliqueBotao("Quadro botão abrir clicado");
  });



function backToMenuFromBoard() {
  Newboard.style.display = "none";
  menu.style.display = "flex";
  menuleft.style.display = "flex";

  enviarCliqueBotao("Voltar ao Menu Principal do Quadro de Palavras");
}


newWordInput.addEventListener("keypress", (e) => {
  if (e.key === "Enter") addWordBtn.click();
});

async function loadWords() {
  const res = await fetch("/api/quadro-palavras");
  const data = await res.json();
  console.log(data);
  wordBoard.innerHTML = "";
  data.forEach(addWordToBoard);
  wordBoard.style.display = "flex";
}

async function addWord(word) {
  const res = await fetch("/api/quadro-palavras", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ palavra: word })
  });
  const result = await res.json();
  if (result.success) loadWords();
}








function addWordToBoard(wordObj) {
  const span = document.createElement("span");
  span.textContent = wordObj.palavra;
  span.style.padding = "6px 12px";
  span.style.borderRadius = "8px";
  span.style.background = "transparent";
  span.style.color = "#fff";
  span.style.fontFamily = "'Playfair Display', serif";
  span.style.fontSize = "14px";
  span.style.fontWeight = "600";
  span.style.cursor = "default";
  span.style.display = "inline-flex";
  span.style.alignItems = "center";
  span.style.margin = "4px";
  wordBoard.appendChild(span);
}

addWordBtn.addEventListener("click", () => {
  const word = newWordInput.value.trim();
  if (!word) return alert("Digite uma palavra antes de adicionar!");
  addWord(word);
  newWordInput.value = "";
       enviarCliqueBotao("Adicionou uma nova palavra");
});

loadWords();

});

const openTodayBtn = document.getElementById("open-today");
const todayModal = document.getElementById("today-modal");
const closeToday = document.getElementById("closeToday");
const backFromTodayBtn = document.getElementById("back-from-today");

openTodayBtn.addEventListener("click", () => {
  menu.style.display = "none";
  menuleft.style.display = "none";
  todayModal.classList.add("show");
 enviarCliqueBotao("Abriu página desenho");
});

backFromTodayBtn.addEventListener("click", () => {
  todayModal.classList.remove("show");
  menu.style.display = "flex";
  menuleft.style.display = "flex";
});



async function loadTodayDrawing() {
  const container = document.getElementById("today-drawing");
  container.textContent = "⌛ Carregando desenho...";

  try {
    const res = await fetch("/api/today-drawing");
    const data = await res.json();

    if (data.success) {
      if (data.type === "image") {
        container.innerHTML = `<img src="${data.url}" alt="Desenho do dia" style="max-width:100%; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.5);">`;
      } else if (data.type === "text") {
        container.innerHTML = `<p style="font-style:italic; color:#c0d6ff;">${data.content}</p>`;
      } else {
        container.textContent = "💖 Desenho recebido, mas formato desconhecido!";
      }
    } else {
      container.textContent = "❌ Não foi possível carregar o desenho de hoje!";
    }
  } catch (err) {
    console.error("Erro ao carregar desenho:", err);
    container.textContent = "⚠️ Erro de conexão ao buscar o desenho.";
  }
}

openTodayBtn.addEventListener("click", () => {
  menu.style.display = "none";
  menuleft.style.display = "none";
  todayModal.classList.add("show");
  loadTodayDrawing();
});
