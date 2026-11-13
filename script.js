/* =========================================================
   SITE PRINCIPAL — CINE LOCAL
   Catálogo, detalhes dos filmes, sessões e seleção de assentos.
   ========================================================= */

let filmes = [
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

// Programação fixa da única sala: um filme em cada horário, todos os dias.
let horariosPorFilme = { 3: "14:00", 1: "17:00", 2: "20:00" };

// Permite que o painel administrativo atualize catálogo e horários no mesmo navegador.
try {
  const filmesSalvos = CineLocal.ler(CineLocal.CHAVES.filmes, null);
  const horariosSalvos = CineLocal.ler(CineLocal.CHAVES.horarios, null);
  if (Array.isArray(filmesSalvos)) filmes = filmesSalvos;
  if (horariosSalvos && typeof horariosSalvos === "object") horariosPorFilme = { ...horariosPorFilme, ...horariosSalvos };
} catch (erro) { console.warn("Não foi possível carregar os dados administrativos.", erro); }
const valorIngresso = 15;
const lista = document.getElementById("lista-filmes");

let filmeAtual = null;
let sessaoAtual = null;
let cadeirasSelecionadas = [];
let dataSessaoAtual = CineLocal.dataISO(new Date());
const letrasFileiras = ["A", "B", "C", "D", "E"];

const dataLocalISO = CineLocal.dataISO;
const formatarData = CineLocal.formatarData;
const sessaoJaPassou = (dataISO, horario) => CineLocal.sessaoEncerrada(dataISO, horario);

function atualizarDisponibilidadeDaSessao() {
  const campo = document.getElementById("data-sessao");
  const botao = document.getElementById("btn-escolher-sessao");
  const aviso = document.getElementById("aviso-data-sessao");
  if (!campo || !botao || !filmeAtual) return;
  dataSessaoAtual = campo.value;
  const horario = horariosPorFilme[filmeAtual.id];
  const valida = Boolean(dataSessaoAtual) && dataSessaoAtual >= dataLocalISO(new Date());
  const passou = valida && sessaoJaPassou(dataSessaoAtual, horario);
  botao.disabled = !valida || passou;
  botao.textContent = passou ? `Sessão das ${horario} encerrada` : `Ver assentos — ${horario}`;
  aviso.textContent = !valida ? "Escolha uma data válida." : passou ? "Esse horário já passou. Escolha outra data." : `Programação para ${formatarData(dataSessaoAtual)}.`;
}

function carregarFilmes() {
  if (!lista) return;
  lista.innerHTML = "";
  // Ordena filmes pela sessão, inclusive os cadastrados no painel administrativo.
  [...filmes].filter(filme => horariosPorFilme[filme.id]).sort((a, b) => CineLocal.horarioEmMinutos(horariosPorFilme[a.id]) - CineLocal.horarioEmMinutos(horariosPorFilme[b.id])).forEach(filme => {
    const card = document.createElement("article");
    card.className = "filme-card";
    card.innerHTML = `
      <div class="filme-poster">
        <img src="${CineLocal.escaparHTML(filme.poster)}" alt="Pôster de ${CineLocal.escaparHTML(filme.nome)}" loading="lazy"
          onerror="this.parentElement.classList.add('poster-erro'); this.remove();">
      </div>
      <div class="filme-info">
        <h3>${CineLocal.escaparHTML(filme.nome)}</h3>
        <p>${CineLocal.escaparHTML(filme.genero)} · ${CineLocal.escaparHTML(filme.classificacao)}</p>
        <button class="btn-detalhes" onclick="abrirDetalhes(${filme.id})">Ver detalhes</button>
      </div>`;
    lista.appendChild(card);
  });
}

function esconderTodasAsSecoes() {
  ["inicio", "filmes", "detalhes", "assentos"].forEach(id => {
    const elemento = document.getElementById(id);
    if (elemento) elemento.classList.add("hidden");
  });
}

// A página inicial mantém o catálogo visível logo abaixo da apresentação.
function inicio() {
  document.getElementById("inicio").classList.remove("hidden");
  document.getElementById("filmes").classList.remove("hidden");
  document.getElementById("detalhes").classList.add("hidden");
  document.getElementById("assentos").classList.add("hidden");
  window.scrollTo({ top: 0, behavior: "smooth" });
}

// "Filmes" e "Conhecer filmes" são apenas atalhos de rolagem para o catálogo.
// Ao voltar da tela de detalhes, restaura a página principal antes de rolar.
function mostrarFilmes() {
  document.getElementById("inicio").classList.remove("hidden");
  document.getElementById("filmes").classList.remove("hidden");
  document.getElementById("detalhes").classList.add("hidden");
  document.getElementById("assentos").classList.add("hidden");
  document.getElementById("filmes").scrollIntoView({ behavior: "smooth", block: "start" });
}

function abrirDetalhes(id) {
  const filme = filmes.find(item => item.id === id);
  if (!filme) return;
  filmeAtual = filme;
  sessaoAtual = null;
  cadeirasSelecionadas = [];
  dataSessaoAtual = dataLocalISO(new Date());
  const horario = horariosPorFilme[filme.id];
  esconderTodasAsSecoes();
  document.getElementById("detalhes").classList.remove("hidden");
  document.getElementById("conteudo-detalhes").innerHTML = `
    <div class="detalhes-conteudo">
      <span class="tag">FILME EM CARTAZ</span>
      <h2>${CineLocal.escaparHTML(filme.nome)}</h2>
      <p><strong>Gênero:</strong> ${CineLocal.escaparHTML(filme.genero)}</p>
      <p><strong>Classificação:</strong> ${CineLocal.escaparHTML(filme.classificacao)}</p>
      <h3>Sinopse</h3><p>${CineLocal.escaparHTML(filme.sinopse)}</p>
      <a class="btn-trailer" href="${CineLocal.escaparHTML(filme.trailer)}" target="_blank" rel="noopener noreferrer">▶ Assistir trailer</a>
      <div class="programacao-filme">
        <h3>Escolha o dia em que deseja assistir</h3>
        <p>Este filme é exibido todos os dias às <strong>${horario}</strong>.</p>
        <label for="data-sessao">Data da sessão</label>
        <input type="date" id="data-sessao" min="${dataLocalISO(new Date())}" value="${dataSessaoAtual}">
        <p id="aviso-data-sessao" class="aviso-data-sessao" aria-live="polite"></p>
        <button id="btn-escolher-sessao" class="btn-sessao" type="button" onclick="abrirAssentos('${horario}')">Ver assentos — ${horario}</button>
      </div>
      <p style="margin-top:25px"><strong>Valor do ingresso:</strong> R$ 15,00</p>
    </div>`;
  document.getElementById("data-sessao").addEventListener("change", atualizarDisponibilidadeDaSessao);
  atualizarDisponibilidadeDaSessao();
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function voltarDetalhes() {
  if (!filmeAtual) return mostrarFilmes();
  const dataAnterior = dataSessaoAtual;
  abrirDetalhes(filmeAtual.id);
  const campo = document.getElementById("data-sessao");
  if (campo) campo.value = dataAnterior;
  atualizarDisponibilidadeDaSessao();
}

function chaveOcupacao() {
  return `${dataSessaoAtual}_${sessaoAtual.replace(":", "h")}`;
}

function buscarCadeirasOcupadas() {
  const ocupacao = CineLocal.ler(CineLocal.CHAVES.assentos, {});
  return ocupacao[chaveOcupacao()] || [];
}

function abrirAssentos(horario) {
  if (!filmeAtual) return;
  const campo = document.getElementById("data-sessao");
  dataSessaoAtual = campo ? campo.value : dataSessaoAtual;
  if (!dataSessaoAtual || dataSessaoAtual < dataLocalISO(new Date())) {
    alert("Escolha uma data válida para a sessão."); return;
  }
  if (sessaoJaPassou(dataSessaoAtual, horario)) {
    alert("Esse horário já passou. Escolha outra data."); return;
  }
  sessaoAtual = horario;
  cadeirasSelecionadas = [];
  esconderTodasAsSecoes();
  document.getElementById("assentos").classList.remove("hidden");
  document.getElementById("informacao-sessao").textContent = `${filmeAtual.nome} | ${formatarData(dataSessaoAtual)} | Sessão das ${sessaoAtual}`;
  document.getElementById("resumo-filme").textContent = filmeAtual.nome;
  document.getElementById("resumo-horario").textContent = `${formatarData(dataSessaoAtual)} — ${sessaoAtual}`;
  criarMapaAssentos();
  atualizarResumo();
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function criarMapaAssentos() {
  const mapa = document.getElementById("mapa-assentos");
  mapa.innerHTML = "";
  const ocupadas = buscarCadeirasOcupadas();
  letrasFileiras.forEach(letra => {
    for (let numero = 1; numero <= 10; numero++) {
      const nomeCadeira = `${letra}${numero}`;
      const cadeira = document.createElement("button");
      cadeira.className = "assento";
      cadeira.textContent = nomeCadeira;
      cadeira.type = "button";
      cadeira.setAttribute("aria-pressed", "false");
      cadeira.setAttribute("aria-label", `Cadeira ${nomeCadeira}`);
      if (ocupadas.includes(nomeCadeira)) {
        cadeira.classList.add("ocupado");
        cadeira.disabled = true;
        cadeira.title = "Cadeira ocupada";
      } else {
        cadeira.title = `Selecionar cadeira ${nomeCadeira}`;
        cadeira.onclick = () => selecionarCadeira(nomeCadeira);
      }
      mapa.appendChild(cadeira);
    }
  });
}

function selecionarCadeira(nomeCadeira) {
  if (cadeirasSelecionadas.includes(nomeCadeira)) {
    cadeirasSelecionadas = cadeirasSelecionadas.filter(c => c !== nomeCadeira);
  } else {
    cadeirasSelecionadas.push(nomeCadeira);
  }
  atualizarMapa();
  atualizarResumo();
}

function atualizarMapa() {
  document.querySelectorAll(".assento").forEach(cadeira => {
    const selecionada = cadeirasSelecionadas.includes(cadeira.textContent);
    cadeira.classList.toggle("selecionado", selecionada);
    cadeira.setAttribute("aria-pressed", String(selecionada));
  });
}

function atualizarResumo() {
  const quantidade = cadeirasSelecionadas.length;
  const total = quantidade * valorIngresso;
  document.getElementById("resumo-quantidade").textContent = quantidade;
  document.getElementById("resumo-cadeiras").textContent = quantidade ? cadeirasSelecionadas.join(", ") : "Nenhuma selecionada";
  document.getElementById("resumo-total").textContent = total.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  document.getElementById("btn-continuar").disabled = quantidade === 0;
}

function continuarCompra() {
  if (!filmeAtual || !sessaoAtual || !dataSessaoAtual || cadeirasSelecionadas.length === 0 || sessaoJaPassou(dataSessaoAtual, sessaoAtual)) {
    alert("Selecione pelo menos uma cadeira antes de continuar.");
    return;
  }

  const compra = {
    filme: { id: filmeAtual.id, nome: filmeAtual.nome, genero: filmeAtual.genero },
    dataSessao: dataSessaoAtual,
    sessao: sessaoAtual,
    cadeiras: [...cadeirasSelecionadas],
    quantidade: cadeirasSelecionadas.length,
    valorUnitario: valorIngresso,
    total: cadeirasSelecionadas.length * valorIngresso,
    chaveOcupacao: chaveOcupacao(),
    criadaEm: new Date().toISOString()
  };

  CineLocal.salvar(CineLocal.CHAVES.compra, compra);

  const usuarioLogado = JSON.parse(localStorage.getItem("cineLocalUsuarioLogado") || "null");
  if (usuarioLogado) {
    window.location.href = "checkout.html";
  } else {
    window.location.href = "conta.html?redirect=checkout";
  }
}

carregarFilmes();

// Recupera a seleção quando o cliente retorna do checkout para alterar as cadeiras.
function restaurarSelecaoDoCheckout() {
  const parametros = new URLSearchParams(window.location.search);
  if (parametros.get("voltar") !== "assentos") return;

  const compraSalva = JSON.parse(
    localStorage.getItem("cineLocalCompraPendente") || "null"
  );

  if (!compraSalva || !compraSalva.filme || !Array.isArray(compraSalva.cadeiras)) {
    mostrarFilmes();
    return;
  }

  filmeAtual = filmes.find(filme => filme.id === compraSalva.filme.id);
  if (!filmeAtual) {
    mostrarFilmes();
    return;
  }

  // Recupera também a data escolhida antes de voltar do checkout.
  dataSessaoAtual = compraSalva.dataSessao || dataLocalISO(new Date());
  abrirDetalhes(filmeAtual.id);
  document.getElementById("data-sessao").value = dataSessaoAtual;
  atualizarDisponibilidadeDaSessao();
  abrirAssentos(compraSalva.sessao);
  cadeirasSelecionadas = compraSalva.cadeiras.filter(c => !buscarCadeirasOcupadas().includes(c));
  atualizarMapa();
  atualizarResumo();

  // Evita repetir a restauração se a página for atualizada.
  window.history.replaceState({}, document.title, window.location.pathname);
}

restaurarSelecaoDoCheckout();
