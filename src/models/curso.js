// Model para tabela CURSOS, compatível com Clever Cloud.
class Curso {
    constructor({
        ID_CURSO,
        ID_CATEGORIA,
        ID_USUARIO,
        PRECO,
        DESCRICAO,
        TITULO,
        DATA_CRIACAO,
        DURACAO_TOTAL,
        OBJETIVOS
    }) {
        this.ID_CURSO = ID_CURSO;
        this.ID_CATEGORIA = ID_CATEGORIA;
        this.ID_USUARIO = ID_USUARIO;
        this.PRECO = PRECO;
        this.DESCRICAO = DESCRICAO;
        this.TITULO = TITULO;
        this.DATA_CRIACAO = DATA_CRIACAO;
        this.DURACAO_TOTAL = DURACAO_TOTAL;
        this.OBJETIVOS = OBJETIVOS;
    }
}

module.exports = Curso;