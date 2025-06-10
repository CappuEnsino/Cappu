// Função para abrir o modal
function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.add('show');
        document.body.style.overflow = 'hidden'; // Previne rolagem do body
    }
}

// Função para fechar o modal
function closeModal(modalId) {
    const modal = document.getElementById(modalId || 'aulaModal');
    if (modal) {
        modal.classList.remove('show');
        document.body.style.overflow = ''; // Restaura rolagem do body
    }
}

// Fecha o modal ao clicar fora dele
document.addEventListener('click', function(event) {
    const modal = document.getElementById('aulaModal');
    if (modal && event.target === modal) {
        closeModal('aulaModal');
    }
});

// Fecha o modal ao pressionar ESC
document.addEventListener('keydown', function(event) {
    if (event.key === 'Escape') {
        closeModal('aulaModal');
    }
});

// Inicializa os botões de fechar do modal
document.addEventListener('DOMContentLoaded', function() {
    const closeButtons = document.querySelectorAll('.close-button');
    closeButtons.forEach(button => {
        button.addEventListener('click', function() {
            const modal = this.closest('.modal');
            if (modal) {
                closeModal(modal.id);
            }
        });
    });
}); 