document.addEventListener("DOMContentLoaded", function () {
    // Elementos do modal
    const modal = document.getElementById("aulaModal");
    const closeButton = modal.querySelector(".close-button");
    
    // Função para abrir o modal
    window.openModal = function() {
        if (modal) {
            modal.style.display = "block";
        }
    };

    // Função para fechar o modal
    window.closeModal = function() {
        if (modal) {
            modal.style.display = "none";
            // Limpar formulário
            document.getElementById("aulaForm").reset();
        }
    };

    // Evento de clique no botão de fechar
    if (closeButton) {
        closeButton.addEventListener("click", closeModal);
    }

    // Fechar modal quando clicar fora dele
    window.addEventListener("click", function(event) {
        if (event.target === modal) {
            closeModal();
        }
    });

    // Inicializar campos de vídeo
    window.toggleVideoFields = function() {
        const tipoConteudo = document.getElementById("tipo_conteudo");
        const videoUrlGroup = document.getElementById("videoUrlGroup");
        
        if (tipoConteudo && videoUrlGroup) {
            videoUrlGroup.style.display = tipoConteudo.value === "video" ? "block" : "none";
        }
    };

    // Inicializar estado dos campos de vídeo
    toggleVideoFields();
});
