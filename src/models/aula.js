// Model para tabela AULA, compatível com Clever Cloud.
class Aula {
  constructor({
    ID_AULA = null,
    ID_MODULO = null,
    TITULO = "",
    DURACAO = "00:00:00",
    ORDEM = 0,
    VIDEO_URL = "",
    DESCRICAO = "",
    TIPO_CONTEUDO = "video",
    ARQUIVO = null,
    TAMANHO_ARQUIVO = 0,
    TIPO_ARQUIVO = "",
  }) {
    this.ID_AULA = ID_AULA;
    this.ID_MODULO = ID_MODULO;
    this.TITULO = TITULO;
    this.DURACAO = DURACAO;
    this.ORDEM = ORDEM;
    this.VIDEO_URL = VIDEO_URL;
    this.DESCRICAO = DESCRICAO;
    this.TIPO_CONTEUDO = TIPO_CONTEUDO;
    this.ARQUIVO = ARQUIVO;
    this.TAMANHO_ARQUIVO = TAMANHO_ARQUIVO;
    this.TIPO_ARQUIVO = TIPO_ARQUIVO;
  }

  // Método para validar os dados da aula
  validar() {
    if (!this.TITULO || this.TITULO.trim() === "") {
      return { valido: false, mensagem: "O título da aula é obrigatório" };
    }
    if (!this.ID_MODULO) {
      return { valido: false, mensagem: "O ID do módulo é obrigatório" };
    }
    if (this.TIPO_CONTEUDO === "video" && !this.VIDEO_URL && !this.ARQUIVO) {
      return {
        valido: false,
        mensagem: "É necessário enviar um vídeo ou URL do vídeo",
      };
    }
    return { valido: true };
  }
}

module.exports = Aula;
