/* =========================================================
   CONTA DO CLIENTE — CADASTRO E LOGIN
   Os dados desta versão acadêmica ficam no localStorage.
   ========================================================= */

const CHAVE_USUARIOS = "cineLocalUsuarios";
const CHAVE_SESSAO = "cineLocalUsuarioLogado";

const formLogin = document.getElementById("form-login");
const formCadastro = document.getElementById("form-cadastro");
const tabLogin = document.getElementById("tab-login");
const tabCadastro = document.getElementById("tab-cadastro");
const mensagem = document.getElementById("mensagem-conta");

function usuariosSalvos() {
  return CineLocal.ler(CHAVE_USUARIOS, []);
}

function mostrarAba(aba) {
  const loginAtivo = aba === "login";
  formLogin.classList.toggle("hidden", !loginAtivo);
  formCadastro.classList.toggle("hidden", loginAtivo);
  tabLogin.classList.toggle("active", loginAtivo);
  tabCadastro.classList.toggle("active", !loginAtivo);
  mensagem.textContent = "";
}

tabLogin.addEventListener("click", () => mostrarAba("login"));
tabCadastro.addEventListener("click", () => mostrarAba("cadastro"));

function destinoAposLogin() {
  const params = new URLSearchParams(window.location.search);
  const destino = params.get("redirect");
  if (destino === "checkout" && localStorage.getItem("cineLocalCompraPendente")) {
    return "checkout.html";
  }
  if (destino === "meus-ingressos") return "meus-ingressos.html";
  return localStorage.getItem("cineLocalCompraPendente") ? "checkout.html" : "index.html";
}

function normalizarEmail(email) {
  return String(email).trim().toLowerCase();
}

function aplicarMascaraCPF(valor) {
  return valor.replace(/\D/g, "").slice(0, 11)
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
}

document.getElementById("cadastro-cpf").addEventListener("input", evento => {
  evento.target.value = aplicarMascaraCPF(evento.target.value);
});

formLogin.addEventListener("submit", evento => {
  evento.preventDefault();
  const email = normalizarEmail(formLogin.elements.email.value);
  const senha = formLogin.elements.senha.value;
  const usuario = usuariosSalvos().find(item => item.email === email && item.senha === senha);

  if (!usuario) {
    mensagem.textContent = "E-mail ou senha incorretos. Confira os dados ou crie uma conta.";
    mensagem.className = "account-message error";
    return;
  }

  CineLocal.salvar(CHAVE_SESSAO, {
    nome: usuario.nome, email: usuario.email, cpf: usuario.cpf
  });
  window.location.href = destinoAposLogin();
});

formCadastro.addEventListener("submit", evento => {
  evento.preventDefault();

  const nome = formCadastro.elements.nome.value.trim();
  const email = normalizarEmail(formCadastro.elements.email.value);
  const cpf = formCadastro.elements.cpf.value.trim();
  const senha = formCadastro.elements.senha.value;
  const confirmar = formCadastro.elements.confirmar.value;

  if (senha !== confirmar) {
    mensagem.textContent = "As senhas não conferem.";
    mensagem.className = "account-message error";
    return;
  }

  const usuarios = usuariosSalvos();
  if (usuarios.some(item => item.email === email)) {
    mensagem.textContent = "Já existe uma conta cadastrada com este e-mail. Faça login.";
    mensagem.className = "account-message error";
    mostrarAba("login");
    document.getElementById("login-email").value = email;
    return;
  }

  const usuario = { nome, email, cpf, senha };
  usuarios.push(usuario);
  CineLocal.salvar(CHAVE_USUARIOS, usuarios);
  CineLocal.salvar(CHAVE_SESSAO, { nome, email, cpf });

  mensagem.textContent = "Cadastro realizado! Redirecionando...";
  mensagem.className = "account-message success";
  window.location.href = destinoAposLogin();
});

// Se já estiver autenticado, segue para a etapa que motivou a abertura da página.
if (localStorage.getItem(CHAVE_SESSAO)) {
  window.location.href = destinoAposLogin();
}
