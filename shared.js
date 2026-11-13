/** Utilitários compartilhados do Cine Local (aplicação acadêmica local). */
window.CineLocal = Object.freeze({
  CHAVES: Object.freeze({
    filmes: "cineLocalFilmes", horarios: "cineLocalHorarios",
    assentos: "cineLocalAssentos", pedidos: "cineLocalPedidos",
    compra: "cineLocalCompraPendente", usuario: "cineLocalUsuarioLogado"
  }),
  ler(chave, padrao) {
    try { return JSON.parse(localStorage.getItem(chave)) ?? padrao; }
    catch (erro) { console.warn(`Dados inválidos em ${chave}:`, erro); return padrao; }
  },
  salvar(chave, valor) { localStorage.setItem(chave, JSON.stringify(valor)); },
  escaparHTML(valor) {
    return String(valor ?? "").replace(/[&<>"']/g, caractere => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
    })[caractere]);
  },
  moeda(valor) {
    return Number(valor || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  },
  dataISO(data = new Date()) {
    const ano = data.getFullYear();
    const mes = String(data.getMonth() + 1).padStart(2, "0");
    const dia = String(data.getDate()).padStart(2, "0");
    return `${ano}-${mes}-${dia}`;
  },
  formatarData(valor, extenso = true) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(String(valor))) return "Data não informada";
    const [ano, mes, dia] = valor.split("-").map(Number);
    const data = new Date(ano, mes - 1, dia);
    if (data.getFullYear() !== ano || data.getMonth() !== mes - 1 || data.getDate() !== dia) return "Data inválida";
    return data.toLocaleDateString("pt-BR", extenso ? { weekday: "long", day: "2-digit", month: "long", year: "numeric" } : undefined);
  },
  horarioEmMinutos(horario) {
    if (!/^(?:[01]\d|2[0-3]):[0-5]\d$/.test(String(horario))) return Infinity;
    const [hora, minuto] = horario.split(":").map(Number);
    return hora * 60 + minuto;
  },
  sessaoEncerrada(dataISO, horario) {
    const hoje = this.dataISO();
    if (!dataISO || dataISO < hoje) return true;
    if (dataISO > hoje) return false;
    const agora = new Date();
    return this.horarioEmMinutos(horario) <= agora.getHours() * 60 + agora.getMinutes();
  }
});
