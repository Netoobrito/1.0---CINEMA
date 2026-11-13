/* =========================================================
   MEUS INGRESSOS — HISTÓRICO DO CLIENTE
   Exibe somente os pedidos associados à conta autenticada.
   ========================================================= */

const usuario = CineLocal.ler(CineLocal.CHAVES.usuario, null);
const areaIngressos = document.getElementById("lista-ingressos");

function escaparHTML(valor) {
  return String(valor ?? "").replace(/[&<>"']/g, caractere => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;"
  })[caractere]);
}

function formatarData(dataISO) {
  if (!dataISO) return "Data não informada";
  const [ano, mes, dia] = dataISO.split("-").map(Number);
  return new Date(ano, mes - 1, dia).toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "long", year: "numeric" });
}

function moeda(valor) {
  return Number(valor).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

if (!usuario) {
  window.location.href = "conta.html?redirect=meus-ingressos";
} else {
  document.getElementById("boas-vindas").textContent = `Olá, ${usuario.nome}! Aqui estão os ingressos da conta ${usuario.email}.`;

  const pedidos = CineLocal.ler(CineLocal.CHAVES.pedidos, []);
  const meusPedidos = pedidos
    .filter(pedido => String(pedido.cliente?.email || "").toLowerCase() === usuario.email.toLowerCase())
    .sort((a, b) => new Date(b.data) - new Date(a.data));

  if (meusPedidos.length === 0) {
    areaIngressos.innerHTML = `
      <div class="checkout-card tickets-empty">
        <h2>Você ainda não tem ingressos.</h2>
        <p>Quando finalizar uma compra, seu ingresso aparecerá aqui.</p>
        <a class="btn-primary" href="index.html">Escolher um filme</a>
      </div>`;
  } else {
    areaIngressos.innerHTML = meusPedidos.map(pedido => `
      <article class="checkout-card ticket-history-card">
        <div class="ticket-history-top">
          <div><span class="tag">INGRESSO CONFIRMADO</span><h2>${escaparHTML(pedido.filme)}</h2></div>
          <span class="ticket-status">CONFIRMADO</span>
        </div>
        <div class="ticket-history-details">
          <div><small>CÓDIGO</small><strong>${escaparHTML(pedido.codigo)}</strong></div>
          <div><small>DATA DA SESSÃO</small><strong>${escaparHTML(formatarData(pedido.dataSessao))}</strong></div>
          <div><small>SESSÃO</small><strong>${escaparHTML(pedido.sessao)}</strong></div>
          <div><small>CADEIRAS</small><strong>${escaparHTML((pedido.cadeiras || []).join(", "))}</strong></div>
          <div><small>QUANTIDADE</small><strong>${escaparHTML(pedido.quantidade)}</strong></div>
          <div><small>PAGAMENTO</small><strong>${escaparHTML(pedido.pagamento)}</strong></div>
          <div><small>TOTAL</small><strong>${moeda(pedido.total)}</strong></div>
        </div>
        <p class="ticket-history-date">Compra realizada em ${new Date(pedido.data).toLocaleString("pt-BR")}</p>
        <p class="demo-warning">Ingresso demonstrativo: não representa uma compra real nem garante entrada no cinema.</p>
      </article>
    `).join("");
  }
}

document.getElementById("btn-sair").addEventListener("click", () => {
  localStorage.removeItem("cineLocalUsuarioLogado");
  window.location.href = "index.html";
});
