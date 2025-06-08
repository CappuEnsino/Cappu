// JS dinâmico para adicionar/remover módulos e aulas na criação de curso

// Usando um namespace para evitar conflitos
const CursoManager = {
  modulos: [],

  init() {
    console.log("DEBUG - Dados recebidos do backend:", window.cursoModulos);
    if (window.cursoModulos && Array.isArray(window.cursoModulos)) {
      this.modulos = window.cursoModulos;
    }
    this.renderModulos();
  },

  renderModulos() {
    const modulosContainer = document.getElementById("modulosContainer");
    if (!modulosContainer) return;

    modulosContainer.innerHTML = "";
    if (this.modulos.length > 0) {
      this.modulos.forEach((modulo, i) => {
        const moduloDiv = document.createElement("div");
        moduloDiv.className = "modulo-bloco";
        moduloDiv.innerHTML = `
          <div class="modulo-header">
            <h3>Módulo ${i + 1}: ${escapeHtml(
          modulo.TITULO || modulo.titulo || "Sem título"
        )}</h3>
            <div class="modulo-actions">
              <button type="button" class="btn btn-sm btn-outline-primary" 
                      onclick="event.stopPropagation(); CursoManager.addAula(${i}, event)">
                <i class="fas fa-plus"></i> Adicionar Aula
              </button>
              <button type="button" class="btn btn-sm btn-outline-danger" 
                      onclick="event.stopPropagation(); CursoManager.removeModulo(${i})">
                <i class="fas fa-trash"></i> Remover
              </button>
            </div>
          </div>
          <div class="modulo-body">
            <div class="form-group">
              <label for="modulo-titulo-${i}">Título do Módulo</label>
              <input id="modulo-titulo-${i}" type="text" class="form-control" 
                     placeholder="Título do módulo" 
                     value="${escapeHtml(
                       modulo.TITULO || modulo.titulo || ""
                     )}" 
                     onchange="CursoManager.updateModuloTitulo(${i}, this.value)" required />
            </div>
            <div class="form-group">
              <label for="modulo-desc-${i}">Descrição do Módulo</label>
              <textarea id="modulo-desc-${i}" class="form-control" 
                        placeholder="Descrição do módulo" 
                        onchange="CursoManager.updateModuloDescricao(${i}, this.value)" 
                        rows="3">${escapeHtml(
                          modulo.DESCRICAO || modulo.descricao || ""
                        )}</textarea>
            </div>
            
            <div class="aulas">
              <h5>Aulas</h5>
              ${
                (modulo.aulas || []).length > 0
                  ? `
                <div class="list-group">
                  ${(modulo.aulas || [])
                    .map(
                      (aula, j) => `
                    <div class="list-group-item" onclick="CursoManager.openAulaModal(${i}, ${j})">
                      <div class="d-flex w-100 justify-content-between">
                        <h6 class="mb-1">${escapeHtml(
                          aula.TITULO || aula.titulo || "Aula sem título"
                        )}</h6>
                        <small>${escapeHtml(
                          aula.DURACAO || aula.duracao || "00:10:00"
                        )}</small>
                      </div>
                      <p class="mb-1">${escapeHtml(
                        aula.DESCRICAO || aula.descricao || "Sem descrição"
                      )}</p>
                      <div class="d-flex justify-content-between align-items-center">
                        <small class="text-muted">
                          ${
                            aula.TIPO_CONTEUDO === "video"
                              ? aula.VIDEO_URL
                                ? '<i class="fas fa-link"></i> ' +
                                  escapeHtml(aula.VIDEO_URL)
                                : aula.ARQUIVO
                                ? '<i class="fas fa-file-video"></i> ' +
                                  escapeHtml(aula.ARQUIVO)
                                : '<i class="fas fa-video"></i> Sem mídia'
                              : '<i class="fas fa-file-alt"></i> Texto'
                          }
                        </small>
                        <button type="button" class="btn btn-sm btn-outline-danger" 
                                onclick="event.stopPropagation(); CursoManager.removeAula(${i}, ${j})">
                          <i class="fas fa-trash"></i>
                        </button>
                      </div>
                      </div>
                    </div>
                  `
                    )
                    .join("")}
                </div>
              `
                  : `
                <div class="alert alert-info">
                  Nenhuma aula adicionada a este módulo. Clique em "Adicionar Aula" para começar.
                </div>
              `
              }
            </div>
          </div>
        `;
        modulosContainer.appendChild(moduloDiv);
      });
    }

    // Garante que o botão de adicionar módulo existe e tem o evento configurado corretamente
    const addModuloBtn = document.getElementById("addModuloBtn");
    if (addModuloBtn) {
      addModuloBtn.onclick = () => this.addModulo();
    }
  },

  addModulo() {
    this.modulos.push({ titulo: "", descricao: "", aulas: [] });
    this.renderModulos();
    this.showNotify("success", "Módulo adicionado!");
  },

  removeModulo(index) {
    if (index >= 0 && index < this.modulos.length) {
      this.modulos.splice(index, 1);
      this.renderModulos();
      this.showNotify("success", "Módulo removido!");
    }
  },

  updateModuloTitulo(index, value) {
    if (this.modulos[index]) {
      this.modulos[index].titulo = value;
    }
  },

  updateModuloDescricao(index, value) {
    if (this.modulos[index]) {
      this.modulos[index].descricao = value;
    }
  },

  addAula(moduloIndex, event) {
    event.preventDefault();
    event.stopPropagation();
    this.openAulaModal(moduloIndex, null, event);
  },

  // Abre o modal de adicionar/editar aula
  openAulaModal(moduloIndex, aulaIndex = null, event = null) {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }

    const modalElement = document.getElementById("aulaModal");
    if (!modalElement) {
      console.error("Elemento do modal não encontrado");
      return;
    }

    const form = document.getElementById("aulaForm");
    if (!form) {
      console.error("Formulário não encontrado");
      return;
    }

    // Inicializa o modal do Bootstrap
    const modal = new bootstrap.Modal(modalElement);

    // Limpa o formulário
    form.reset();

    // Define o índice do módulo no formulário
    form.dataset.moduloIndex = moduloIndex;

    // Se for edição, preenche os campos
    if (aulaIndex !== null && this.modulos[moduloIndex]?.aulas?.[aulaIndex]) {
      const aula = this.modulos[moduloIndex].aulas[aulaIndex];
      form.dataset.aulaIndex = aulaIndex;

      // Preenche os campos do formulário (suporta tanto maiúsculas quanto minúsculas)
      form.querySelector('[name="titulo"]').value =
        aula.TITULO || aula.titulo || "";
      form.querySelector('[name="descricao"]').value =
        aula.DESCRICAO || aula.descricao || "";

      const tipoConteudo = aula.TIPO_CONTEUDO || aula.tipo_conteudo || "video";
      form.querySelector('[name="tipo_conteudo"]').value = tipoConteudo;

      form.querySelector('[name="video_url"]').value =
        aula.VIDEO_URL || aula.video_url || "";
      form.querySelector('[name="duracao"]').value =
        aula.DURACAO || aula.duracao || "00:10:00";

      // Define a ordem, garantindo que seja um número válido
      const ordem =
        aula.ORDEM ||
        aula.ordem ||
        (this.modulos[moduloIndex].aulas
          ? this.modulos[moduloIndex].aulas.length + 1
          : 1);
      form.querySelector('[name="ordem"]').value = ordem;

      // Atualiza a visibilidade dos campos de vídeo
      this.toggleVideoFields();
    } else {
      // Nova aula
      form.dataset.aulaIndex = "";

      // Define a ordem como próxima disponível
      const ordem = this.modulos[moduloIndex]?.aulas
        ? this.modulos[moduloIndex].aulas.length + 1
        : 1;
      form.querySelector('[name="ordem"]').value = ordem;

      // Define valores padrão para novas aulas
      form.querySelector('[name="tipo_conteudo"]').value = "video";
      form.querySelector('[name="duracao"]').value = "00:10:00";

      // Atualiza a visibilidade dos campos de vídeo
      this.toggleVideoFields();
    }

    // Exibe o modal
    modal.show();
  },

  // Salva os dados da aula do modal
  saveAulaFromModal(event) {
    event.preventDefault(); // Impede o envio padrão do formulário

    const form = document.getElementById("aulaForm");
    if (!form) {
      console.error("Formulário não encontrado");
      return false;
    }

    const moduloIndex = parseInt(form.dataset.moduloIndex);
    const aulaIndex =
      form.dataset.aulaIndex !== "" ? parseInt(form.dataset.aulaIndex) : null;
    const fileInput = document.getElementById("video_arquivo");

    if (isNaN(moduloIndex) || moduloIndex < 0) {
      this.showNotify("error", "Erro ao identificar o módulo da aula.");
      return false;
    }

    const formData = new FormData(form);
    const aulaData = {
      TITULO: formData.get("titulo") || "",
      DESCRICAO: formData.get("descricao") || "",
      TIPO_CONTEUDO: formData.get("tipo_conteudo") || "video",
      VIDEO_URL: formData.get("video_url") || "",
      DURACAO: formData.get("duracao") || "00:10:00",
      ORDEM: parseInt(formData.get("ordem")) || 1,
      ID_AULA: null,
    };

    console.log("DEBUG - Dados da aula enviados pelo formulário:", aulaData);

    // Validação básica
    if (!aulaData.TITULO) {
      this.showNotify("error", "O título da aula é obrigatório.");
      this.highlightInvalidField("#titulo");
      return false;
    }

    // Verifica se há um arquivo para upload
    if (fileInput && fileInput.files.length > 0) {
      const file = fileInput.files[0];
      if (file.size > 500 * 1024 * 1024) {
        // 500MB
        this.showNotify(
          "error",
          "O arquivo é muito grande. O tamanho máximo permitido é 500MB."
        );
        return false;
      }

      // Adiciona informações do arquivo
      aulaData.ARQUIVO = file.name;
      aulaData.TAMANHO_ARQUIVO = file.size;
      aulaData.TIPO_ARQUIVO = file.type;

      // Mostra mensagem de upload
      this.showNotify("info", "Fazendo upload do arquivo...");

      // Simulando upload (substitua por chamada real para o servidor)
      setTimeout(() => {
        this.finalizarSalvamentoAula(moduloIndex, aulaIndex, aulaData);
      }, 1000);

      return true;
    } else if (aulaData.TIPO_CONTEUDO === "video" && !aulaData.VIDEO_URL) {
      this.showNotify(
        "error",
        "Para conteúdo de vídeo, é necessário informar uma URL ou enviar um arquivo."
      );
      return false;
    } else {
      // Se não houver arquivo para upload, salva diretamente
      return this.finalizarSalvamentoAula(moduloIndex, aulaIndex, aulaData);
    }
  },

  // Finaliza o salvamento da aula após o upload do arquivo (se houver)
  finalizarSalvamentoAula(moduloIndex, aulaIndex, aulaData) {
    try {
      // Garante que o módulo existe
      if (!this.modulos[moduloIndex]) {
        console.error("Módulo não encontrado no índice:", moduloIndex);
        this.showNotify(
          "error",
          "Erro ao salvar a aula: módulo não encontrado."
        );
        return false;
      }

      // Inicializa o array de aulas se não existir
      if (!Array.isArray(this.modulos[moduloIndex].aulas)) {
        this.modulos[moduloIndex].aulas = [];
      }

      // Atualiza ou adiciona a aula
      if (
        aulaIndex !== null &&
        !isNaN(aulaIndex) &&
        this.modulos[moduloIndex].aulas[aulaIndex]
      ) {
        // Mantém o ID se estiver editando
        aulaData.ID_AULA = this.modulos[moduloIndex].aulas[aulaIndex].ID_AULA;
        this.modulos[moduloIndex].aulas[aulaIndex] = {
          ...this.modulos[moduloIndex].aulas[aulaIndex],
          ...aulaData,
        };
        this.showNotify("success", "Aula atualizada com sucesso!");
      } else {
        // Adiciona uma nova aula
        const newAula = {
          ...aulaData,
          ID_AULA: "aula-" + Date.now(), // ID temporário
        };
        this.modulos[moduloIndex].aulas.push(newAula);
        this.showNotify("success", "Aula adicionada com sucesso!");
      }

      // Ordena as aulas pela ordem
      this.modulos[moduloIndex].aulas.sort(
        (a, b) => (a.ORDEM || 0) - (b.ORDEM || 0)
      );

      // Atualiza a exibição dos módulos
      this.renderModulos();

      // Fecha o modal
      const modalElement = document.getElementById("aulaModal");
      if (modalElement) {
        const modal = bootstrap.Modal.getInstance(modalElement);
        if (modal) {
          modal.hide();
        }
      }

      return true;
    } catch (error) {
      console.error("Erro ao salvar aula:", error);
      this.showNotify(
        "error",
        "Ocorreu um erro ao salvar a aula. Por favor, tente novamente."
      );
      return false;
    }
  },

  // Alterna a visibilidade dos campos de vídeo
  toggleVideoFields() {
    const form = document.getElementById("aulaForm");
    if (!form) return;

    const tipoConteudo = form.querySelector('select[name="tipo_conteudo"]');
    const videoUrlGroup = form.querySelector("#videoUrlGroup");
    const videoArquivoGroup = form.querySelector("#videoArquivoGroup");

    if (tipoConteudo && videoUrlGroup && videoArquivoGroup) {
      if (tipoConteudo.value === "video") {
        videoUrlGroup.style.display = "block";
        videoArquivoGroup.style.display = "block";
      } else {
        videoUrlGroup.style.display = "none";
        videoArquivoGroup.style.display = "none";
      }
    }
  },

  removeAula(moduloIndex, aulaIndex) {
    if (this.modulos[moduloIndex] && this.modulos[moduloIndex].aulas) {
      this.modulos[moduloIndex].aulas.splice(aulaIndex, 1);
      this.renderModulos();
      this.showNotify("success", "Aula removida!");
    }
  },

  updateAulaTitulo(moduloIndex, aulaIndex, value) {
    if (
      this.modulos[moduloIndex] &&
      this.modulos[moduloIndex].aulas &&
      this.modulos[moduloIndex].aulas[aulaIndex]
    ) {
      this.modulos[moduloIndex].aulas[aulaIndex].titulo = value;
    }
  },

  updateAulaDescricao(moduloIndex, aulaIndex, value) {
    if (
      this.modulos[moduloIndex] &&
      this.modulos[moduloIndex].aulas &&
      this.modulos[moduloIndex].aulas[aulaIndex]
    ) {
      this.modulos[moduloIndex].aulas[aulaIndex].descricao = value;
    }
  },

  validateForm() {
    let valid = true;
    document
      .querySelectorAll(".campo-invalido")
      .forEach((el) => el.classList.remove("campo-invalido"));

    this.modulos.forEach((modulo, i) => {
      if (!modulo.titulo) {
        valid = false;
        this.highlightInvalidField(`#modulo-titulo-${i}`);
      }
      if (!modulo.descricao) {
        valid = false;
        this.highlightInvalidField(`#modulo-desc-${i}`);
      }

      (modulo.aulas || []).forEach((aula, j) => {
        if (!aula.titulo) {
          valid = false;
          this.highlightInvalidField(`#aula-titulo-${i}-${j}`);
        }
        if (!aula.descricao) {
          valid = false;
          this.highlightInvalidField(`#aula-desc-${i}-${j}`);
        }
      });
    });

    return valid;
  },

  highlightInvalidField(selector) {
    const el = document.querySelector(selector);
    if (el) el.classList.add("campo-invalido");
  },

  showNotify(status, text) {
    if (window.SimpleNotify) {
      new SimpleNotify({
        status: status,
        title: status === "success" ? "Sucesso" : "Erro",
        text: text,
        timeout: 3000,
      });
    } else if (window.Notify) {
      new Notify({
        status,
        title: status === "success" ? "Sucesso" : "Erro",
        text,
        position: "left top",
      });
    } else {
      alert(`${status.toUpperCase()}: ${text}`);
    }
  },

  initForm() {
    // Inicializa os tooltips do Bootstrap
    const tooltipTriggerList = [].slice.call(
      document.querySelectorAll('[data-bs-toggle="tooltip"]')
    );
    tooltipTriggerList.map(function (tooltipTriggerEl) {
      return new bootstrap.Tooltip(tooltipTriggerEl);
    });

    // Adiciona evento de submit ao formulário
    const form = document.getElementById("formEditarCurso");
    if (form) {
      form.onsubmit = (e) => {
        // Converte os módulos para JSON e define no campo oculto
        const modulosParaEnviar = this.modulos.map((modulo) => ({
          ...modulo,
          // Garante que as aulas tenham todos os campos necessários
          aulas: (modulo.aulas || []).map((aula) => ({
            ID_AULA: aula.ID_AULA || null,
            titulo: aula.titulo || "",
            descricao: aula.descricao || "",
            tipo_conteudo: aula.tipo_conteudo || "video",
            video_url: aula.video_url || "",
            duracao: aula.duracao || "00:10:00",
            ordem: aula.ordem || 1,
            ARQUIVO: aula.ARQUIVO || null,
            TAMANHO_ARQUIVO: aula.TAMANHO_ARQUIVO || null,
            TIPO_ARQUIVO: aula.TIPO_ARQUIVO || null,
          })),
        }));

        const modulosInputEl = document.getElementById("modulosInput");
        console.log("DEBUG - modulosInput:", modulosInputEl);
        modulosInputEl.value = JSON.stringify(modulosParaEnviar);
        debugger;
        alert("DEBUG: modulosInputEl.value = " + modulosInputEl.value);

        // Adiciona os IDs dos módulos e aulas excluídos
        document.getElementById("modulosExcluidos-json").value = JSON.stringify(
          window.modulosExcluidos || []
        );
        document.getElementById("aulasExcluidas-json").value = JSON.stringify(
          window.aulasExcluidas || []
        );

        // Validação do formulário
        if (!this.validateForm()) {
          e.preventDefault();
          return false;
        }

        return true;
      };
    }
  },
};

// Inicializa quando o DOM estiver pronto
document.addEventListener("DOMContentLoaded", () => {
  CursoManager.init();
  CursoManager.initForm();

  // Torna o gerenciador disponível globalmente
  window.CursoManager = CursoManager;
});

// Função utilitária para escapar HTML
function escapeHtml(text) {
  if (!text) return "";
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
