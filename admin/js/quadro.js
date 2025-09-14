function initQuadro() {
async function loadAdminWords() {
  const res = await fetch("/api/quadro-palavras");
  const words = await res.json();
  const tableBody = document.getElementById("words-table-body");
  tableBody.innerHTML = "";

  words.forEach(w => {
    const tr = document.createElement("tr");

    const tdWord = document.createElement("td");
    tdWord.textContent = w.palavra;

    const tdActions = document.createElement("td");
    const delBtn = document.createElement("button");
    delBtn.textContent = "Deletar";
    delBtn.onclick = async () => {
      if (confirm(`Deseja realmente deletar a palavra "${w.palavra}"?`)) {
        await fetch(`/api/admin/quadro-palavras/${w.id}`, { method: "DELETE" });
        loadAdminWords();
      }
    };

    tdActions.appendChild(delBtn);
    tr.appendChild(tdWord);
    tr.appendChild(tdActions);
    tableBody.appendChild(tr);
  });
}

loadAdminWords();
}