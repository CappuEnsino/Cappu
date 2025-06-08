// JS dinâmico para gerenciar módulos e aulas
const CursoManager = {
  modulos: [],

  init() {
    console.log("DEBUG - Dados recebidos do backend:", window.cursoModulos);
    if (window.cursoModulos && Array.isArray(window.cursoModulos)) {
      this.modulos = window.cursoModulos;
    }
    this.createModal();
  },

  // Cria o modal dinamicamente
  createModal() {
    // Remove modal existente se houver
    const existingModal = document.getElementById("aulaModal");
    if (existingModal) existingModal.remove();

    // Cria o modal
    const modal = document.createElement("div");
    modal.id = "aulaModal";
    modal.className = "modal";
    modal.style.cssText = `
      display: none;
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background-color: rgba(0,0,0,0.5);
      z-index: 1000;
    `;

    // Conteúdo do modal
    modal.innerHTML = `
      <div class="modal-content" style="
        background-color: #fff;
        margin: 10% auto;
        padding: 20px;
        width: 80%;
        max-width: 600px;
        border-radius: 8px;
        position: relative;
      ">
        <span class="close-button" style="
          position: absolute;
          right: 10px;
          top: 10px;
          font-size: 24px;
          cursor: pointer;
          color: #666;
        ">&times;</span>
        
        <h2 id="modalTitle" style="margin-bottom: 20px;">Adicionar Aula</h2>
        
        <form id="aulaForm" style="display: flex; flex-direction: column; gap: 15px;">
          <input type="hidden" id="moduloId" name="modulo_id">
          <input type="hidden" id="aulaId" name="aula_id">
          
          <div class="form-group">
            <label for="titulo">Título da Aula *</label>
            <input type="text" id="titulo" name="titulo" required style="
              width: 100%;
              padding: 8px;
              border: 1px solid #ddd;
              border-radius: 4px;
            ">
          </div>
          
          <div class="form-group">
            <label for="descricao">Descrição *</label>
            <textarea id="descricao" name="descricao" required style="
              width: 100%;
              padding: 8px;
              border: 1px solid #ddd;
              border-radius: 4px;
              min-height: 100px;
            "></textarea>
          </div>
          
          <div class="form-group">
            <label for="tipo_conteudo">Tipo de Conteúdo</label>
            <select id="tipo_conteudo" name="tipo_conteudo" onchange="CursoManager.toggleVideoFields()" style="
              width: 100%;
              padding: 8px;
              border: 1px solid #ddd;
              border-radius: 4px;
            ">
              <option value="video">Vídeo</option>
              <option value="texto">Texto</option>
            </select>
          </div>
          
          <div id="videoFields" class="form-group">
            <label for="video_url">URL do Vídeo</label>
            <input type="url" id="video_url" name="video_url" style="
              width: 100%;
              padding: 8px;
              border: 1px solid #ddd;
              border-radius: 4px;
            ">
            
            <label for="video_arquivo" style="margin-top: 10px;">Ou envie um arquivo</label>
            <input type="file" id="video_arquivo" name="video_arquivo" accept="video/*" style="
              width: 100%;
              padding: 8px;
              border: 1px solid #ddd;
              border-radius: 4px;
            ">
          </div>
          
          <div class="form-group">
            <label for="duracao">Duração</label>
            <input type="time" id="duracao" name="duracao" value="00:10:00" style="
              width: 100%;
              padding: 8px;
              border: 1px solid #ddd;
              border-radius: 4px;
            ">
          </div>
          
          <div class="form-group">
            <label for="ordem">Ordem</label>
            <input type="number" id="ordem" name="ordem" min="1" value="1" style="
              width: 100%;
              padding: 8px;
              border: 1px solid #ddd;
              border-radius: 4px;
            ">
          </div>
          
          <div class="form-actions" style="
            display: flex;
            justify-content: flex-end;
            gap: 10px;
            margin-top: 20px;
          ">
            <button type="button" onclick="CursoManager.closeModal()" style="
              padding: 8px 16px;
              border: 1px solid #ddd;
              border-radius: 4px;
              background: #f8f9fa;
              cursor: pointer;
            ">Cancelar</button>
            <button type="submit" style="
              padding: 8px 16px;
              border: none;
              border-radius: 4px;
              background: #007bff;
              color: white;
              cursor: pointer;
            ">Salvar</button>
          </div>
        </form>
      </div>
    `;

    // Adiciona o modal ao body
    document.body.appendChild(modal);

    // Adiciona eventos
    const closeBtn = modal.querySelector(".close-button");
    closeBtn.onclick = () => this.closeModal();

    const form = modal.querySelector("#aulaForm");
    form.onsubmit = (e) => {
      e.preventDefault();
      this.saveAula();
    };

    // Fecha o modal ao clicar fora
    modal.onclick = (e) => {
      if (e.target === modal) this.closeModal();
    };
  },

  // Abre o modal para adicionar/editar aula
  adicionarAula(moduloId, aulaId = null) {
    const modal = document.getElementById("aulaModal");
    const form = document.getElementById("aulaForm");
    const title = document.getElementById("modalTitle");

    // Limpa o formulário
    form.reset();

    // Define o ID do módulo
    document.getElementById("moduloId").value = moduloId;

    if (aulaId) {
      // Modo edição
      title.textContent = "Editar Aula";
      document.getElementById("aulaId").value = aulaId;

      // Busca os dados da aula
      fetch(`/dashboard/professor/aula/${aulaId}`)
        .then((response) => response.json())
        .then((aula) => {
          if (aula.success) {
            const data = aula.data;
            form.titulo.value = data.TITULO || data.titulo || "";
            form.descricao.value = data.DESCRICAO || data.descricao || "";
            form.tipo_conteudo.value =
              data.TIPO_CONTEUDO || data.tipo_conteudo || "video";
            form.video_url.value = data.VIDEO_URL || data.video_url || "";
            form.duracao.value = data.DURACAO || data.duracao || "00:10:00";
            form.ordem.value = data.ORDEM || data.ordem || 1;
            this.toggleVideoFields();
          } else {
            this.showNotify("error", "Erro ao carregar dados da aula");
          }
        })
        .catch((error) => {
          console.error("Erro:", error);
          this.showNotify("error", "Erro ao carregar dados da aula");
        });
    } else {
      // Modo criação
      title.textContent = "Adicionar Aula";
      document.getElementById("aulaId").value = "";

      // Define valores padrão
      form.tipo_conteudo.value = "video";
      form.duracao.value = "00:10:00";

      // Busca a próxima ordem disponível
      fetch(`/dashboard/professor/modulo/${moduloId}/proxima-ordem`)
        .then((response) => response.json())
        .then((data) => {
          if (data.success) {
            form.ordem.value = data.ordem;
          }
        })
        .catch((error) => console.error("Erro ao buscar ordem:", error));
    }

    // Mostra o modal
    modal.style.display = "block";
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

    // Envia a requisição
    fetch(url, {
      method: method,
      body: formData,
    })
      .then((response) => response.json())
      .then((data) => {
        if (data.success) {
          this.showNotify(
            "success",
            aulaId ? "Aula atualizada com sucesso!" : "Aula criada com sucesso!"
          );
          this.closeModal();
          // Recarrega a página para atualizar a lista
          window.location.reload();
        } else {
          this.showNotify("error", data.message || "Erro ao salvar aula");
        }
      })
      .catch((error) => {
        console.error("Erro:", error);
        this.showNotify("error", "Erro ao salvar aula");
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
    const notification = document.createElement("div");
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
