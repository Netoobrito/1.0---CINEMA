/* =========================================================
   PAINEL ADMINISTRATIVO — CINE LOCAL
   Gerencia filmes, horários, reservas e relatórios locais.
   ========================================================= */

// Chaves utilizadas para salvar os dados no navegador.
const STORAGE = {
  filmes: "cineLocalFilmes",
  horarios: "cineLocalHorarios",
  pedidos: "cineLocalPedidos",
  login: "cineLocalAdminLogado"
};

// Catálogo e programação utilizados quando ainda não há dados salvos.
const filmesPadrao = [
  {
    id: 1,
    nome: "Cara de Barro",
    genero: "Terror / Suspense",
    classificacao: "A definir",
    poster: "https://www.impawards.com/2026/posters/clayface_xlg.jpg",
    sinopse: "Matt Hagen é um ator que sofre uma transformação devastadora após recorrer a um tratamento experimental. Seu corpo passa a assumir a forma de argila.",
    trailer: "https://www.youtube.com/results?search_query=Cara+de+Barro+trailer+oficial+2026"
  },
  {
    id: 2,
    nome: "Homem-Aranha: Um Novo Dia",
    genero: "Ação / Aventura",
    classificacao: "A definir",
    poster: "https://www.sonypictures.com.br/sites/brazil/files/2026-09/SMBND_BRA_1400%20X%202100%20%28Vertical%29.jpg",
    sinopse: "Peter Parker agora vive sozinho em Nova York, enquanto dedica sua vida a combater o crime como Homem-Aranha.",
    trailer: "https://www.youtube.com/results?search_query=Homem+Aranha+Um+Novo+Dia+trailer"
  },
  {
    id: 3,
    nome: "Toy Story 5",
    genero: "Animação / Aventura",
    classificacao: "A definir",
    poster: "https://lumiere-a.akamaihd.net/v1/images/g_movies_toystory5_payoff_poster_bb9dcbe9.jpeg?region=0%2C0%2C1300%2C730",
    sinopse: "Woody, Buzz, Jessie e toda a turma estão de volta! Desta vez, os brinquedos enfrentam uma nova ameaça tecnológica.",
    trailer: "https://www.youtube.com/results?search_query=Toy+Story+5+trailer+oficial"
  }
];

const horariosPadrao = { 3: "14:00", 1: "17:00", 2: "20:00" };
const buscarElemento = id => document.getElementById(id);

// Lê informações do localStorage sem interromper a página caso haja JSON inválido.
function lerArmazenamento(chave, valorPadrao) {
  try {
    return JSON.parse(localStorage.getItem(chave)) ?? valorPadrao;
  } catch {
    return valorPadrao;
  }
}

// Salva qualquer informação no armazenamento local do navegador.
function salvarArmazenamento(chave, valor) {
  localStorage.setItem(chave, JSON.stringify(valor));
}

// Formata valores e textos antes de exibi-los na interface.
function formatarMoeda(valor) {
  return Number(valor || 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL"
  });
}

function formatarData(dataISO) {
  if (!dataISO) return "—";
  const [ano, mes, dia] = dataISO.split("-").map(Number);
  return new Date(ano, mes - 1, dia).toLocaleDateString("pt-BR");
}

function escaparHTML(valor) {
  return String(valor ?? "").replace(/[&<>"']/g, caractere => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  })[caractere]);
}

// Estado atual do painel, carregado a partir do navegador.
let filmes = lerArmazenamento(STORAGE.filmes, filmesPadrao);
let horarios = {
  ...horariosPadrao,
  ...lerArmazenamento(STORAGE.horarios, {})
};
let pedidos = lerArmazenamento(STORAGE.pedidos, []);

// Mostra o painel após a autenticação demonstrativa.
function mostrarPainel() {
  buscarElemento("admin-login").classList.add("hidden");
  buscarElemento("admin-app").classList.remove("hidden");
  buscarElemento("sair-admin").hidden = false;
  renderizarTudo();
}

function verificarSessaoAdmin() {
  if (sessionStorage.getItem(STORAGE.login) === "1") {
    mostrarPainel();
  }
}

// Login demonstrativo: não deve ser utilizado como autenticação de um sistema real.
buscarElemento("form-admin-login").addEventListener("submit", evento => {
  evento.preventDefault();

  const usuario = buscarElemento("admin-usuario").value.trim();
  const senha = buscarElemento("admin-senha").value;
  const mensagem = buscarElemento("admin-login-msg");

  if (usuario === "admin" && senha === "cinelocal2026") {
    sessionStorage.setItem(STORAGE.login, "1");
    mensagem.textContent = "";
    mostrarPainel();
    return;
  }

  mensagem.textContent = "Usuário ou senha incorretos.";
  mensagem.className = "admin-message error";
});

// Encerra a sessão administrativa atual.
buscarElemento("sair-admin").addEventListener("click", () => {
  sessionStorage.removeItem(STORAGE.login);
  window.location.reload();
});

// Navegação entre as seções do painel.
document.querySelectorAll(".admin-tabs button").forEach(botao => {
  botao.addEventListener("click", () => abrirAba(botao.dataset.tab));
});

document.querySelectorAll("[data-go]").forEach(botao => {
  botao.addEventListener("click", () => abrirAba(botao.dataset.go));
});

function abrirAba(nome) {
  document.querySelectorAll(".admin-tabs button").forEach(botao => {
    botao.classList.toggle("active", botao.dataset.tab === nome);
  });

  document.querySelectorAll(".admin-tab-content").forEach(secao => {
    secao.classList.add("hidden");
  });

  const secaoSelecionada = buscarElemento(`tab-${nome}`);
  if (!secaoSelecionada) return;

  secaoSelecionada.classList.remove("hidden");

  if (nome === "reservas") renderizarReservas();
  if (nome === "relatorios") renderizarRelatorios();
}

// Atualiza todas as áreas quando o painel é aberto.
function renderizarTudo() {
  renderizarDashboard();
  renderizarFilmes();
  renderizarProgramacao();
  renderizarReservas();
  renderizarRelatorios();
}

// Indicadores principais e últimos pedidos registrados.
function renderizarDashboard() {
  pedidos = lerArmazenamento(STORAGE.pedidos, []);

  const faturamento = pedidos.reduce((total, pedido) => total + Number(pedido.total || 0), 0);
  const ingressos = pedidos.reduce((total, pedido) => total + Number(pedido.quantidade || 0), 0);
  const assentos = lerArmazenamento("cineLocalAssentos", {});
  const ocupados = Object.values(assentos).reduce(
    (total, lista) => total + (Array.isArray(lista) ? lista.length : 0),
    0
  );

  buscarElemento("admin-stats").innerHTML = `
    <article class="admin-stat">
      <span>Vendas confirmadas</span>
      <strong>${pedidos.length}</strong>
      <small>Pedidos registrados</small>
    </article>
    <article class="admin-stat">
      <span>Faturamento simulado</span>
      <strong>${formatarMoeda(faturamento)}</strong>
      <small>Valor total dos pedidos</small>
    </article>
    <article class="admin-stat">
      <span>Ingressos vendidos</span>
      <strong>${ingressos}</strong>
      <small>Unidades registradas</small>
    </article>
    <article class="admin-stat">
      <span>Assentos ocupados</span>
      <strong>${ocupados}</strong>
      <small>Somando datas e sessões</small>
    </article>
  `;

  const recentes = [...pedidos].reverse().slice(0, 5);
  buscarElemento("dashboard-recentes").innerHTML = recentes.length
    ? criarTabelaPedidos(recentes, false)
    : '<p class="admin-empty">Ainda não existem vendas registradas neste navegador.</p>';
}

// Lista os filmes cadastrados e disponibiliza as ações de edição e exclusão.
function renderizarFilmes() {
  buscarElemento("admin-lista-filmes").innerHTML = filmes.map(filme => `
    <article class="admin-movie-row">
      <div class="admin-poster">
        ${filme.poster
          ? `<img src="${escaparHTML(filme.poster)}" alt="" onerror="this.remove()">`
          : "🎬"}
      </div>
      <div class="admin-movie-info">
        <strong>${escaparHTML(filme.nome)}</strong>
        <small>${escaparHTML(filme.genero)} · ${escaparHTML(filme.classificacao || "A definir")}</small>
        <small>Sessão: ${escaparHTML(horarios[filme.id] || "Não definida")}</small>
      </div>
      <div class="admin-row-actions">
        <button class="admin-secondary" data-edit="${filme.id}">Editar</button>
        <button class="admin-danger" data-delete="${filme.id}">Excluir</button>
      </div>
    </article>
  `).join("") || '<p class="admin-empty">Nenhum filme cadastrado.</p>';

  document.querySelectorAll("[data-edit]").forEach(botao => {
    botao.addEventListener("click", () => editarFilme(Number(botao.dataset.edit)));
  });

  document.querySelectorAll("[data-delete]").forEach(botao => {
    botao.addEventListener("click", () => excluirFilme(Number(botao.dataset.delete)));
  });
}

// Abre o formulário preenchido quando o usuário deseja editar um filme.
function abrirFormularioFilme(filme = null) {
  buscarElemento("form-filme").classList.remove("hidden");
  buscarElemento("form-filme-titulo").textContent = filme ? "Editar filme" : "Novo filme";
  buscarElemento("filme-id").value = filme?.id || "";
  buscarElemento("filme-nome").value = filme?.nome || "";
  buscarElemento("filme-genero").value = filme?.genero || "";
  buscarElemento("filme-classificacao").value = filme?.classificacao || "A definir";
  buscarElemento("filme-poster").value = filme?.poster || "";
  buscarElemento("filme-sinopse").value = filme?.sinopse || "";
  buscarElemento("filme-trailer").value = filme?.trailer || "";
  buscarElemento("form-filme").scrollIntoView({ behavior: "smooth", block: "center" });
}

function editarFilme(id) {
  abrirFormularioFilme(filmes.find(filme => filme.id === id));
}

function excluirFilme(id) {
  const filme = filmes.find(item => item.id === id);
  if (!filme || !confirm(`Excluir “${filme.nome}” do catálogo?`)) return;

  filmes = filmes.filter(item => item.id !== id);
  salvarArmazenamento(STORAGE.filmes, filmes);
  renderizarFilmes();
  renderizarProgramacao();
}

buscarElemento("novo-filme").addEventListener("click", () => abrirFormularioFilme());
buscarElemento("cancelar-filme").addEventListener("click", () => {
  buscarElemento("form-filme").classList.add("hidden");
});

// Salva um novo filme ou atualiza os dados de um filme existente.
buscarElemento("form-filme").addEventListener("submit", evento => {
  evento.preventDefault();

  const id = buscarElemento("filme-id").value
    ? Number(buscarElemento("filme-id").value)
    : Date.now();

  const filmeAtualizado = {
    id,
    nome: buscarElemento("filme-nome").value.trim(),
    genero: buscarElemento("filme-genero").value.trim(),
    classificacao: buscarElemento("filme-classificacao").value.trim() || "A definir",
    poster: buscarElemento("filme-poster").value.trim(),
    sinopse: buscarElemento("filme-sinopse").value.trim(),
    trailer: buscarElemento("filme-trailer").value.trim()
  };

  const indice = filmes.findIndex(filme => filme.id === id);
  if (indice >= 0) {
    filmes[indice] = filmeAtualizado;
  } else {
    filmes.push(filmeAtualizado);
  }

  salvarArmazenamento(STORAGE.filmes, filmes);
  buscarElemento("form-filme").reset();
  buscarElemento("form-filme").classList.add("hidden");
  renderizarFilmes();
  renderizarProgramacao();
});

// Exibe os campos para configurar os horários da sala única.
function renderizarProgramacao() {
  buscarElemento("admin-horarios").innerHTML = filmes.map(filme => `
    <label class="admin-schedule-row">
      <span>
        <strong>${escaparHTML(filme.nome)}</strong>
        <small>Horário diário</small>
      </span>
      <input type="time" required data-horario="${filme.id}" value="${escaparHTML(horarios[filme.id] || "")}">
    </label>
  `).join("") || '<p class="admin-empty">Cadastre um filme para definir a programação.</p>';
}

// Valida e salva a programação, impedindo dois filmes no mesmo horário.
buscarElemento("form-programacao").addEventListener("submit", evento => {
  evento.preventDefault();

  const campos = [...document.querySelectorAll("[data-horario]")];
  const valores = campos.map(campo => campo.value);
  const mensagem = buscarElemento("programacao-msg");

  if (valores.some(valor => !valor)) {
    mensagem.textContent = "Preencha o horário de todos os filmes.";
    return;
  }

  if (new Set(valores).size !== valores.length) {
    mensagem.textContent = "Cada filme precisa ter um horário diferente, pois a sala é única.";
    return;
  }

  campos.forEach(campo => {
    horarios[campo.dataset.horario] = campo.value;
  });

  salvarArmazenamento(STORAGE.horarios, horarios);
  mensagem.textContent = "Programação salva neste navegador. Atualize a página do site para visualizar.";
  renderizarFilmes();
});

// Monta a tabela reutilizada no resumo e na listagem completa de reservas.
function criarTabelaPedidos(lista, exibirStatus = true) {
  return `
    <table class="admin-table">
      <thead>
        <tr>
          <th>Código</th>
          <th>Cliente</th>
          <th>Filme</th>
          <th>Sessão</th>
          <th>Assentos</th>
          <th>Total</th>
          ${exibirStatus ? "<th>Status</th>" : ""}
        </tr>
      </thead>
      <tbody>
        ${lista.map(pedido => `
          <tr>
            <td>${escaparHTML(pedido.codigo || "—")}</td>
            <td>${escaparHTML(pedido.cliente?.nome || "—")}</td>
            <td>${escaparHTML(pedido.filme || "—")}</td>
            <td>${formatarData(pedido.dataSessao)} · ${escaparHTML(pedido.sessao || "—")}</td>
            <td>${escaparHTML((pedido.cadeiras || []).join(", "))}</td>
            <td>${formatarMoeda(pedido.total)}</td>
            ${exibirStatus
              ? `<td><span class="admin-status">${escaparHTML(pedido.status || "Registrado")}</span></td>`
              : ""}
          </tr>
        `).join("")}
      </tbody>
    </table>
  `;
}

// Atualiza a listagem de reservas com os pedidos mais recentes primeiro.
function renderizarReservas() {
  pedidos = lerArmazenamento(STORAGE.pedidos, []);
  buscarElemento("admin-tabela-reservas").innerHTML = pedidos.length
    ? criarTabelaPedidos([...pedidos].reverse())
    : '<p class="admin-empty">Nenhuma reserva encontrada. Faça uma compra simulada na área do cliente para alimentar esta lista.</p>';
}

// Calcula os indicadores e a quantidade de ingressos vendidos por filme.
function renderizarRelatorios() {
  pedidos = lerArmazenamento(STORAGE.pedidos, []);

  const faturamento = pedidos.reduce((total, pedido) => total + Number(pedido.total || 0), 0);
  const ingressos = pedidos.reduce((total, pedido) => total + Number(pedido.quantidade || 0), 0);
  const ticketMedio = pedidos.length ? faturamento / pedidos.length : 0;

  buscarElemento("admin-relatorios").innerHTML = `
    <div class="admin-report-card"><span>Faturamento acumulado</span><strong>${formatarMoeda(faturamento)}</strong></div>
    <div class="admin-report-card"><span>Pedidos confirmados</span><strong>${pedidos.length}</strong></div>
    <div class="admin-report-card"><span>Ingressos vendidos</span><strong>${ingressos}</strong></div>
    <div class="admin-report-card"><span>Ticket médio</span><strong>${formatarMoeda(ticketMedio)}</strong></div>
  `;

  const vendasPorFilme = {};
  pedidos.forEach(pedido => {
    const nomeFilme = pedido.filme || "Não identificado";
    vendasPorFilme[nomeFilme] ??= { quantidade: 0, total: 0 };
    vendasPorFilme[nomeFilme].quantidade += Number(pedido.quantidade || 0);
    vendasPorFilme[nomeFilme].total += Number(pedido.total || 0);
  });

  const filmesOrdenados = Object.entries(vendasPorFilme)
    .sort((a, b) => b[1].quantidade - a[1].quantidade);

  buscarElemento("admin-vendas-filmes").innerHTML = filmesOrdenados.length
    ? `<div class="admin-report-bars">
        ${filmesOrdenados.map(([nome, dados]) => `
          <div class="admin-bar-row">
            <div>
              <strong>${escaparHTML(nome)}</strong>
              <span>${dados.quantidade} ingresso(s) · ${formatarMoeda(dados.total)}</span>
            </div>
            <div class="admin-bar-track">
              <i style="width: ${Math.max(4, dados.quantidade / Math.max(1, ingressos) * 100)}%"></i>
            </div>
          </div>
        `).join("")}
      </div>`
    : '<p class="admin-empty">Os dados por filme aparecerão após as primeiras compras.</p>';
}

// Restaura a sessão administrativa, caso ela ainda esteja ativa nesta aba.
verificarSessaoAdmin();
