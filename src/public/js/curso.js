// JS dinâmico para gerenciar módulos e aulas
const CursoManager = {
  modulos: [],

  init() {
    console.log("Inicializando CursoManager...");
    console.log("DEBUG - Dados recebidos do backend:", window.cursoModulos);

    try {
      if (window.cursoModulos && Array.isArray(window.cursoModulos)) {
        this.modulos = window.cursoModulos;
        console.log("Módulos carregados:", this.modulos);
      } else {
        console.warn("Nenhum módulo encontrado ou formato inválido");
        this.modulos = [];
      }

      // Cria o modal
      this.createModal();

      // Configura o evento de submit do formulário de aula
      const aulaForm = document.getElementById("aulaForm");
      if (aulaForm) {
        aulaForm.onsubmit = (e) => {
          e.preventDefault();
          this.saveAula();
        };
      }

      // Configura o botão de adicionar módulo
      const addModuloBtn = document.getElementById("addModuloBtn");
      if (addModuloBtn) {
        addModuloBtn.onclick = () => {
          // Implementar lógica de adicionar módulo
          console.log("Clique no botão de adicionar módulo");
        };
      }

      console.log("CursoManager inicializado com sucesso");
    } catch (error) {
      console.error("Erro ao inicializar CursoManager:", error);
    }
  },

  // Cria o modal dinamicamente
  createModal() {
    console.log('Criando modal...');

    // Remove modal existente se houver
    const existingModal = document.getElementById("aulaModal");
    if (existingModal) {
      console.log('Modal existente encontrado, removendo...');
      existingModal.remove();
    }

    // Cria o modal
    const modal = document.createElement("section");
    modal.id = "aulaModal";
    modal.className = "modal";

    // Conteúdo do modal
    modal.innerHTML = `
      <section class="modal-content">
        <button type="button" class="close-button" aria-label="Fechar">&times;</button>
        
        <h2 id="modalTitle" style="margin-bottom: 20px;">Adicionar Aula</h2>
        
        <form id="aulaForm">
          <input type="hidden" id="moduloId" name="modulo_id">
          <input type="hidden" id="aulaId" name="aula_id">
          
          <section class="form-group">
            <label for="titulo">Título da Aula *</label>
            <input type="text" id="titulo" name="titulo" required>
          </section>
          
          <section class="form-group">
            <label for="descricao">Descrição *</label>
            <textarea id="descricao" name="descricao" required></textarea>
          </section>
          
          <section class="form-group">
            <label for="tipo_conteudo">Tipo de Conteúdo</label>
            <select id="tipo_conteudo" name="tipo_conteudo" onchange="CursoManager.toggleVideoFields()">
              <option value="video">Vídeo</option>
              <option value="texto">Texto</option>
            </select>
          </section>
          
          <section id="videoFields" class="form-group">
            <label for="video_url">URL do Vídeo</label>
            <input type="url" id="video_url" name="video_url">
            
            <label for="video_arquivo" style="margin-top: 10px;">Ou envie um arquivo</label>
            <input type="file" id="video_arquivo" name="video_arquivo" accept="video/*">
          </section>
          
          <section class="form-group">
            <label for="duracao">Duração</label>
            <input type="time" id="duracao" name="duracao" value="00:10:00">
          </section>
          
          <section class="form-group">
            <label for="ordem">Ordem</label>
            <input type="number" id="ordem" name="ordem" min="1" value="1">
          </section>
          
          <section class="form-actions">
            <button type="button" onclick="CursoManager.closeModal()">Cancelar</button>
            <button type="submit">Salvar</button>
          </section>
        </form>
      </section>
    `;

    // Adiciona o modal ao body
    document.body.appendChild(modal);
    console.log('Modal criado e adicionado ao DOM');

    // Configura o evento de fechar
    const closeButton = modal.querySelector(".close-button");
    closeButton.onclick = () => this.closeModal();

    // Configura o evento de fechar ao clicar fora do modal
    modal.onclick = (e) => {
      if (e.target === modal) {
        this.closeModal();
      }
    };

    console.log('Eventos do modal configurados');
  },

  // Abre o modal para adicionar/editar aula
  adicionarAula(moduloId, aulaId = null) {
    console.log('Iniciando adicionarAula:', { moduloId, aulaId });

    const modal = document.getElementById("aulaModal");
    const form = document.getElementById("aulaForm");
    const title = document.getElementById("modalTitle");

    if (!modal || !form || !title) {
      console.error('Elementos do modal não encontrados:', { modal, form, title });
      return;
    }

    console.log('Elementos do modal encontrados');

    // Limpa o formulário
    form.reset();
    console.log('Formulário resetado');

    // Define o ID do módulo
    const moduloIdInput = document.getElementById("moduloId");
    if (!moduloIdInput) {
      console.error('Input moduloId não encontrado');
      return;
    }
    moduloIdInput.value = moduloId;
    console.log('ID do módulo definido:', moduloId);

    if (aulaId) {
      // Modo edição
      title.textContent = "Editar Aula";
      document.getElementById("aulaId").value = aulaId;
      console.log('Modo edição - buscando dados da aula:', aulaId);

      // Busca os dados da aula
      fetch(`/dashboard/professor/aula/${aulaId}`)
        .then((response) => response.json())
        .then((aula) => {
          if (aula.success) {
            const data = aula.data;
            console.log('Dados da aula recebidos:', data);
            form.titulo.value = data.TITULO || data.titulo || "";
            form.descricao.value = data.DESCRICAO || data.descricao || "";
            form.tipo_conteudo.value = data.TIPO_CONTEUDO || data.tipo_conteudo || "video";
            form.video_url.value = data.VIDEO_URL || data.video_url || "";
            form.duracao.value = data.DURACAO || data.duracao || "00:10:00";
            form.ordem.value = data.ORDEM || data.ordem || 1;
            this.toggleVideoFields();
          } else {
            console.error('Erro ao carregar dados da aula:', aula);
            this.showNotify("error", "Erro ao carregar dados da aula");
          }
        })
        .catch((error) => {
          console.error("Erro ao carregar dados da aula:", error);
          this.showNotify("error", "Erro ao carregar dados da aula");
        });
    } else {
      // Modo criação
      console.log('Modo criação - configurando valores padrão');
      title.textContent = "Adicionar Aula";
      document.getElementById("aulaId").value = "";

      // Define valores padrão
      form.tipo_conteudo.value = "video";
      form.duracao.value = "00:10:00";

      // Busca a próxima ordem disponível para o módulo
      const modulo = this.modulos.find(m => m.ID_MODULO === parseInt(moduloId));
      console.log('Módulo encontrado:', modulo);
      const aulas = modulo ? modulo.aulas || [] : [];
      const proximaOrdem = aulas.length > 0 ? Math.max(...aulas.map(a => a.ORDEM || a.ordem)) + 1 : 1;
      form.ordem.value = proximaOrdem;
      console.log('Próxima ordem definida:', proximaOrdem);
    }

    // Mostra o modal
    modal.style.display = "block";
    console.log('Modal exibido');

    // Configura o evento de submit do formulário
    form.onsubmit = (e) => {
      e.preventDefault();
      console.log('Submit do formulário interceptado');
      this.saveAula();
    };
  },

  // Fecha o modal
  closeModal() {
    const modal = document.getElementById("aulaModal");
    if (modal) modal.style.display = "none";
  },

  // Alterna a visibilidade dos campos de vídeo
  toggleVideoFields() {
    const tipoConteudo = document.getElementById("tipo_conteudo");
    const videoFields = document.getElementById("videoFields");
    if (tipoConteudo && videoFields) {
      videoFields.style.display =
        tipoConteudo.value === "video" ? "block" : "none";
    }
  },

  // Salva a aula (criar/editar)
  saveAula() {
    const form = document.getElementById("aulaForm");
    const formData = new FormData(form);
    const aulaId = formData.get("aula_id");
    const moduloId = formData.get("modulo_id");

    console.log('Salvando aula:', {
      aulaId,
      moduloId,
      titulo: formData.get("titulo"),
      descricao: formData.get("descricao"),
      tipo_conteudo: formData.get("tipo_conteudo"),
      duracao: formData.get("duracao"),
      ordem: formData.get("ordem")
    });

    // Validação básica
    if (!formData.get("titulo") || !formData.get("descricao")) {
      this.showNotify("error", "Preencha todos os campos obrigatórios");
      return;
    }

    // Determina a URL e método baseado se é criação ou edição
    const url = aulaId
      ? `/dashboard/professor/aula/${aulaId}`
      : "/dashboard/professor/aula";
    const method = aulaId ? "PUT" : "POST";

    console.log('Enviando requisição:', { url, method });

    // Envia a requisição
    fetch(url, {
      method: method,
      body: formData,
    })
      .then((response) => {
        console.log('Status da resposta:', response.status);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
      })
      .then((data) => {
        console.log('Resposta do servidor:', data);

        if (data.success) {
          this.showNotify(
            "success",
            aulaId ? "Aula atualizada com sucesso!" : "Aula criada com sucesso!"
          );

          // Atualiza a lista de aulas do módulo
          const moduloContainer = document.querySelector(`[data-modulo-id="${moduloId}"]`);
          console.log('Container do módulo:', moduloContainer);

          if (moduloContainer) {
            const aulasContainer = moduloContainer.querySelector(".modulo-aulas");
            console.log('Container de aulas:', aulasContainer);
            
            if (aulaId) {
              // Se for edição, atualiza a aula existente
              const aulaElement = aulasContainer.querySelector(`[data-aula-id="${aulaId}"]`);
              if (aulaElement) {
                const novaAula = this.criarHtmlAula(data.data);
                aulaElement.replaceWith(novaAula);
              }
            } else {
              // Se for criação, adiciona a nova aula
              // Remove a mensagem "Nenhuma aula neste módulo" se existir
              const noAulasMsg = aulasContainer.querySelector("p");
              if (noAulasMsg && noAulasMsg.textContent === "Nenhuma aula neste módulo") {
                noAulasMsg.remove();
              }

              // Cria e adiciona o elemento da nova aula
              const novaAula = this.criarHtmlAula(data.data);
              console.log('Nova aula HTML:', novaAula);

              // Adiciona a nova aula antes do botão de adicionar
              const addButton = aulasContainer.querySelector(".add-aula-btn");
              console.log('Botão de adicionar:', addButton);

              if (addButton) {
                console.log('Botão de adicionar encontrado, inserindo antes dele');
                aulasContainer.insertBefore(novaAula, addButton);
              } else {
                console.log('Botão de adicionar não encontrado, adicionando ao final');
                aulasContainer.appendChild(novaAula);
              }

              // Atualiza o array de módulos local
              const moduloIndex = this.modulos.findIndex(m => m.ID_MODULO === parseInt(moduloId));
              if (moduloIndex !== -1) {
                if (!this.modulos[moduloIndex].aulas) {
                  this.modulos[moduloIndex].aulas = [];
                }
                this.modulos[moduloIndex].aulas.push(data.data);
                console.log('Módulos atualizados:', this.modulos);
              }
            }

            // Fecha o modal após atualizar a interface
            this.closeModal();
          } else {
            console.error('Módulo container não encontrado para ID:', moduloId);
            // Recarrega a página como fallback
            window.location.reload();
          }
        } else {
          this.showNotify("error", data.message || "Erro ao salvar aula");
        }
      })
      .catch((error) => {
        console.error("Erro ao salvar aula:", error);
        this.showNotify("error", "Erro ao salvar aula: " + error.message);
      });
  },

  // Função para editar uma aula existente
  editarAula(aulaId) {
    // Busca o ID do módulo da aula
    fetch(`/dashboard/professor/aula/${aulaId}/modulo`)
      .then((response) => response.json())
      .then((data) => {
        if (data.success) {
          this.adicionarAula(data.moduloId, aulaId);
        } else {
          this.showNotify("error", "Erro ao carregar dados da aula");
        }
      })
      .catch((error) => {
        console.error("Erro:", error);
        this.showNotify("error", "Erro ao carregar dados da aula");
      });
  },

  // Função para excluir uma aula
  excluirAula(aulaId) {
    if (confirm("Tem certeza que deseja excluir esta aula?")) {
      fetch(`/dashboard/professor/aula/${aulaId}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
      })
        .then((response) => response.json())
        .then((data) => {
          if (data.success) {
            this.showNotify("success", "Aula excluída com sucesso!");
            // Recarrega a página para atualizar a lista
            window.location.reload();
          } else {
            this.showNotify("error", data.message || "Erro ao excluir aula");
          }
        })
        .catch((error) => {
          console.error("Erro:", error);
          this.showNotify("error", "Erro ao excluir aula");
        });
    }
  },

  // Função para editar um módulo
  editarModulo(moduloId) {
    // Implementar edição de módulo em modal similar
    // Por enquanto mantém o redirecionamento
    window.location.href = `/dashboard/professor/p-modulo?id=${moduloId}`;
  },

  // Função para excluir um módulo
  excluirModulo(moduloId) {
    if (
      confirm(
        "Tem certeza que deseja excluir este módulo? Todas as aulas serão excluídas."
      )
    ) {
      fetch(`/dashboard/professor/modulo/${moduloId}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
      })
        .then((response) => response.json())
        .then((data) => {
          if (data.success) {
            this.showNotify("success", "Módulo excluído com sucesso!");
            // Recarrega a página para atualizar a lista
            window.location.reload();
          } else {
            this.showNotify("error", data.message || "Erro ao excluir módulo");
          }
        })
        .catch((error) => {
          console.error("Erro:", error);
          this.showNotify("error", "Erro ao excluir módulo");
        });
    }
  },

  // Função para mostrar notificações
  showNotify(status, text) {
    const notification = document.createElement("section");
    notification.className = `notification ${status}`;
    notification.textContent = text;
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      padding: 15px 25px;
      border-radius: 4px;
      color: white;
      z-index: 1000;
      animation: slideIn 0.5s ease-out;
    `;

    if (status === "success") {
      notification.style.backgroundColor = "#28a745";
    } else if (status === "error") {
      notification.style.backgroundColor = "#dc3545";
    }

    document.body.appendChild(notification);

    // Remove a notificação após 3 segundos
    setTimeout(() => {
      notification.style.animation = "slideOut 0.5s ease-out";
      setTimeout(() => notification.remove(), 500);
    }, 3000);
  },

  // Cria o HTML para uma aula
  criarHtmlAula(aula) {
    console.log('Criando HTML para aula:', aula);

    const section = document.createElement("section");
    section.className = "aula-item";
    section.setAttribute("data-aula-id", aula.ID_AULA || aula.id_aula);

    const titulo = aula.TITULO || aula.titulo;
    const descricao = aula.DESCRICAO || aula.descricao;
    const duracao = aula.DURACAO || aula.duracao;
    const tipoConteudo = aula.TIPO_CONTEUDO || aula.tipo_conteudo;
    const idAula = aula.ID_AULA || aula.id_aula;

    section.innerHTML = `
      <section class="aula-header">
        <section class="aula-title">${titulo}</section>
        <section class="aula-actions">
          <button type="button" class="btn" onclick="CursoManager.editarAula(${idAula})">Editar</button>
          <button type="button" class="btn btn-danger" onclick="CursoManager.excluirAula(${idAula})">Excluir</button>
        </section>
      </section>
      <section class="aula-info">
        <section class="aula-desc">${descricao}</section>
        <section class="aula-details">
          <span class="aula-duracao">${duracao}</span>
          <span class="aula-tipo">${tipoConteudo === 'video' ? 'Vídeo' : 'Texto'}</span>
        </section>
      </section>
    `;

    console.log('HTML gerado:', section.outerHTML);
    return section;
  },
};

// Adiciona os estilos CSS para as animações
const style = document.createElement("style");
style.textContent = `
  @keyframes slideIn {
    from { transform: translateX(100%); opacity: 0; }
    to { transform: translateX(0); opacity: 1; }
  }
  @keyframes slideOut {
    from { transform: translateX(0); opacity: 1; }
    to { transform: translateX(100%); opacity: 0; }
  }
`;
document.head.appendChild(style);

// Inicializa o CursoManager quando o documento estiver pronto
document.addEventListener("DOMContentLoaded", () => {
  CursoManager.init();
});
