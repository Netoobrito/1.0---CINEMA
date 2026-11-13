/* Acesso à conta e estado do menu principal. */
function abrirConta() {
      window.location.href = localStorage.getItem("cineLocalUsuarioLogado")
        ? "meus-ingressos.html"
        : "conta.html";
    }
    const usuarioMenu = JSON.parse(localStorage.getItem("cineLocalUsuarioLogado") || "null");
    const botaoConta = document.getElementById("btn-conta");
    if (usuarioMenu && botaoConta) botaoConta.textContent = "Minha conta";
