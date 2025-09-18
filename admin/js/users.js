document.addEventListener("DOMContentLoaded", () => {
  const toggleRegistration = document.getElementById("toggleRegistration");
  const regStatus = document.getElementById("regStatus");

  // ======== Status de registro ========
  async function loadRegistrationStatus() {
    try {
      const res = await fetch("/api/admin/registration", { credentials: "include" });
      if (!res.ok) {
        console.error("Erro ao buscar status de registro:", res.status);
        return;
      }

      const data = await res.json();
      if (data.allow_registration) {
        toggleRegistration.checked = true;
        regStatus.textContent = "✅ Registros habilitados";
        regStatus.style.color = "green";
      } else {
        toggleRegistration.checked = false;
        regStatus.textContent = "❌ Registros desabilitados";
        regStatus.style.color = "red";
      }
    } catch (err) {
      console.error("Erro ao carregar status:", err);
    }
  }

  toggleRegistration.addEventListener("change", async () => {
    const allow = toggleRegistration.checked;
    try {
      const res = await fetch("/api/admin/registration", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ allow })
      });

      if (!res.ok) {
        alert("Erro ao atualizar configuração (" + res.status + ")");
        return;
      }

      const data = await res.json();
      if (data.success) {
        regStatus.textContent = allow ? "✅ Registros habilitados" : "❌ Registros desabilitados";
        regStatus.style.color = allow ? "green" : "red";
      } else {
        alert("Erro ao atualizar configuração.");
      }
    } catch (err) {
      console.error("Erro ao salvar configuração:", err);
    }
  });

  loadRegistrationStatus();

  // ======== Listagem de usuários ========
  async function fetchUsers() {
    try {
      const res = await fetch("/api/admin/users", { credentials: "include" });
      if (!res.ok) {
        alert("Erro ao buscar usuários (" + res.status + ")");
        return;
      }

      const data = await res.json();
      const tbody = document.getElementById("users-table-body");
      tbody.innerHTML = "";

      data.forEach((user) => {
        const tr = document.createElement("tr");
        tr.innerHTML = `
          <td>${user.id}</td>
          <td>${user.username}</td>
          <td>
            <select onchange="changeUserRole(${user.id}, this.value)">
              <option value="user" ${user.role === "user" ? "selected" : ""}>User</option>
              <option value="admin" ${user.role === "admin" ? "selected" : ""}>Admin</option>
            </select>
          </td>
          <td>
            <button onclick="deleteUser(${user.id})">Deletar</button>
          </td>
        `;
        tbody.appendChild(tr);
      });
    } catch (err) {
      console.error("Erro ao carregar usuários:", err);
    }
  }

  // ======== Alterar papel ========
  window.changeUserRole = async function (id, role) {
    try {
      const res = await fetch(`/api/admin/users/${id}/role`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ role })
      });

      if (!res.ok) {
        alert("Erro ao alterar papel (" + res.status + ")");
        return;
      }

      const data = await res.json();
      if (data.success) alert("Papel alterado!");
      else alert(data.error || "Erro ao alterar papel");
    } catch (err) {
      console.error("Erro ao alterar papel:", err);
    }
  };

  // ======== Deletar usuário ========
  window.deleteUser = async function (id) {
    if (!confirm("Tem certeza que deseja deletar este usuário?")) return;

    try {
      const res = await fetch(`/api/admin/users/${id}`, {
        method: "DELETE",
        credentials: "include"
      });

      if (!res.ok) {
        alert("Erro ao deletar usuário (" + res.status + ")");
        return;
      }

      const data = await res.json();
      if (data.success) {
        alert("Usuário deletado!");
        fetchUsers();
      } else {
        alert(data.error || "Erro ao deletar usuário");
      }
    } catch (err) {
      console.error("Erro ao deletar usuário:", err);
    }
  };

  // ======== Abrir seção principal ========
  window.abrirSecao = function (secao) {
    document.querySelectorAll(".secao").forEach((s) => (s.style.display = "none"));
    document.getElementById(secao).style.display = "block";
    if (secao === "usuarios") fetchUsers();
  };
});
