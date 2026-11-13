/* =========================================================
   CHECKOUT — FINALIZAÇÃO SIMULADA DA COMPRA
   Registra o pedido e marca os assentos como ocupados.
   ========================================================= */

const STORAGE_COMPRA = "cineLocalCompraPendente";
const STORAGE_ASSENTOS = "cineLocalAssentos";
const STORAGE_PEDIDOS = "cineLocalPedidos";

const compra = JSON.parse(localStorage.getItem(STORAGE_COMPRA) || "null");
const usuarioLogado = JSON.parse(localStorage.getItem("cineLocalUsuarioLogado") || "null");

if (!usuarioLogado) {
  window.location.href = "conta.html?redirect=checkout";
}
const form = document.getElementById("form-checkout");
const checkoutConteudo = document.getElementById("checkout-conteudo");
const compraSucesso = document.getElementById("compra-sucesso");

function formatarData(dataISO) {
  if (!dataISO) return "Data não informada";
  const [ano, mes, dia] = dataISO.split("-").map(Number);
  return new Date(ano, mes - 1, dia).toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "long", year: "numeric" });
}

function moeda(valor) {
  return Number(valor).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}


function mostrarSemCompra() {
  checkoutConteudo.innerHTML = `
    <div class="checkout-card empty-checkout">
      <span class="tag">NENHUM PEDIDO ENCONTRADO</span>
      <h1>Vamos escolher seu <span>filme?</span></h1>
      <p>Não encontramos uma seleção de ingressos para finalizar. Volte ao catálogo e escolha um filme e seus assentos.</p>
      <a class="btn-primary" href="index.html">Voltar ao cinema</a>
    </div>`;
}

function carregarResumo() {
  if (usuarioLogado) {
    document.getElementById("nome").value = usuarioLogado.nome || "";
    document.getElementById("cpf").value = usuarioLogado.cpf || "";
    document.getElementById("email").value = usuarioLogado.email || "";
    document.getElementById("nome").readOnly = true;
    document.getElementById("cpf").readOnly = true;
    document.getElementById("email").readOnly = true;
  }

  if (!compra || !compra.filme || !Array.isArray(compra.cadeiras) || compra.cadeiras.length === 0) {
    mostrarSemCompra();
    return false;
  }
  document.getElementById("pedido-filme").textContent = compra.filme.nome;
  document.getElementById("pedido-sessao").textContent = `${formatarData(compra.dataSessao)} · Sessão das ${compra.sessao}`;
  document.getElementById("pedido-cadeiras").textContent = compra.cadeiras.join(", ");
  document.getElementById("pedido-quantidade").textContent = compra.quantidade;
  document.getElementById("pedido-unitario").textContent = moeda(compra.valorUnitario);
  document.getElementById("pedido-total").textContent = moeda(compra.total);
  return true;
}

function aplicarMascaraCPF(valor) {
  return valor.replace(/\D/g, "").slice(0, 11)
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
}

const campoCPF = document.getElementById("cpf");
if (campoCPF) {
  campoCPF.addEventListener("input", evento => {
    evento.target.value = aplicarMascaraCPF(evento.target.value);
  });
}

function gerarCodigo() {
  const parteAleatoria = Math.floor(100000 + Math.random() * 900000);
  return `CL-${parteAleatoria}`;
}

function finalizarCompra(evento) {
  evento.preventDefault();
  if (!form.reportValidity()) return;
  if (!compra) return;

  const ocupacao = JSON.parse(localStorage.getItem(STORAGE_ASSENTOS) || "{}");
  const cadeirasOcupadas = ocupacao[compra.chaveOcupacao] || [];
  const conflito = compra.cadeiras.filter(cadeira => cadeirasOcupadas.includes(cadeira));

  if (conflito.length) {
    alert(`Atenção! Estas cadeiras já foram ocupadas: ${conflito.join(", ")}. Volte e escolha outros lugares.`);
    return;
  }

  const dados = new FormData(form);
  const pedido = {
    codigo: gerarCodigo(),
    filme: compra.filme.nome,
    filmeId: compra.filme.id,
    dataSessao: compra.dataSessao,
    sessao: compra.sessao,
    cadeiras: compra.cadeiras,
    quantidade: compra.quantidade,
    total: compra.total,
    cliente: {
      nome: usuarioLogado.nome,
      cpf: usuarioLogado.cpf,
      email: usuarioLogado.email
    },
    pagamento: dados.get("pagamento"),
    status: "Confirmado",
    data: new Date().toISOString()
  };

  // Nesta versão acadêmica, a confirmação é simulada: não há cobrança real.
  ocupacao[compra.chaveOcupacao] = [...new Set([...cadeirasOcupadas, ...compra.cadeiras])];
  localStorage.setItem(STORAGE_ASSENTOS, JSON.stringify(ocupacao));

  const pedidos = JSON.parse(localStorage.getItem(STORAGE_PEDIDOS) || "[]");
  pedidos.push(pedido);
  localStorage.setItem(STORAGE_PEDIDOS, JSON.stringify(pedidos));
  localStorage.setItem("cineLocalUltimoPedido", JSON.stringify(pedido));
  localStorage.removeItem(STORAGE_COMPRA);

  mostrarIngresso(pedido);
}

function mostrarIngresso(pedido) {
  checkoutConteudo.classList.add("hidden");
  compraSucesso.classList.remove("hidden");
  document.getElementById("ticket-filme").textContent = pedido.filme;
  document.getElementById("ticket-sessao").textContent = `${formatarData(pedido.dataSessao)} · Sessão: ${pedido.sessao}`;
  document.getElementById("ticket-cliente").textContent = pedido.cliente.nome;
  document.getElementById("ticket-cadeiras").textContent = pedido.cadeiras.join(", ");
  document.getElementById("ticket-pagamento").textContent = pedido.pagamento;
  document.getElementById("ticket-total").textContent = moeda(pedido.total);
  document.getElementById("ticket-code").textContent = pedido.codigo;
  window.scrollTo({ top: 0, behavior: "smooth" });
}

if (usuarioLogado && carregarResumo()) {
  form.addEventListener("submit", finalizarCompra);
}
