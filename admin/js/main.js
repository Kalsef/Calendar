const loginForm = document.getElementById("loginForm");
const loginArea = document.getElementById("loginArea");
const adminArea = document.getElementById("adminArea");
const logoutBtn = document.getElementById("logoutBtn");

loginForm.onsubmit = async (e) => {
  e.preventDefault();
  const fd = new FormData(loginForm);
  const body = { username: fd.get("username"), password: fd.get("password") };

  try {
    const res = await fetch("/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });

    if (res.ok) {
      loginArea.style.display = "none";
      adminArea.style.display = "block";
      logoutBtn.style.display = "inline-block";
      initAdminPanel(); 
    } else {
      const j = await res.json();
      alert(j?.error || "Erro no login");
    }
  } catch (err) {
    console.error(err);
    alert("Erro de rede ou servidor");
  }
};

logoutBtn.onclick = async () => {
  await fetch("/api/logout", { method: "POST" });
  adminArea.style.display = "none";
  loginArea.style.display = "block";
  logoutBtn.style.display = "none";
};

function abrirSecao(secaoId) {
  const secoes = document.querySelectorAll(".secao");
  secoes.forEach(s => s.style.display = "none");
  const secao = document.getElementById(secaoId);
  if (secao) secao.style.display = "block";
}

function initAdminPanel() {
  if (typeof initMusic === "function") initMusic();
  if (typeof initMemories === "function") initMemories();
  if (typeof initPoems === "function") initPoems();
  if (typeof initAvisos === "function") initAvisos();
  if (typeof initPolls === "function") initPolls();
  if (typeof initQuadro === "function") initQuadro();
  if (typeof initDesenho === "function") initDesenho();
}

function initAdminPanel() {
  initMusic();
  initMemories();
  initPoems();
  initAvisos();
  initPolls();
  initQuadro();
  initDesenho();
}


