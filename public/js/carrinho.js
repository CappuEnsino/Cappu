document.addEventListener('DOMContentLoaded', function() {
    const botoesCarrinho = document.querySelectorAll('.adicionar-carrinho');
    const contadorCarrinho = document.getElementById('carrinhoContador');

    // Função para atualizar o contador do carrinho
    async function atualizarContadorCarrinho() {
        try {
            const response = await fetch('/aluno/api/carrinho/contador');
            const data = await response.json();
            
            if (response.ok) {
                contadorCarrinho.textContent = data.quantidade;
            }
        } catch (erro) {
            console.error('Erro ao atualizar contador do carrinho:', erro);
        }
    }

    // Atualizar contador ao carregar a página
    atualizarContadorCarrinho();

    botoesCarrinho.forEach(botao => {
        botao.addEventListener('click', async function() {
            const cursoId = this.getAttribute('data-curso-id');
            const botaoOriginal = this.innerHTML;
            
            if (!cursoId) {
                console.error('ID do curso não encontrado no botão');
                alert('Erro: ID do curso não encontrado');
                return;
            }

            // Desabilitar o botão e mostrar loading
            this.disabled = true;
            this.innerHTML = 'Adicionando...';
            
            try {
                console.log('Enviando requisição para adicionar ao carrinho:', { cursoId });
                
                const response = await fetch('/aluno/api/carrinho/adicionar', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ cursoId: cursoId })
                });

                const data = await response.json();
                console.log('Resposta do servidor:', data);

                if (response.ok) {
                    alert('Curso adicionado ao carrinho com sucesso!');
                    // Atualizar o contador do carrinho
                    await atualizarContadorCarrinho();
                    // Atualizar o botão
                    this.innerHTML = 'No Carrinho';
                    this.classList.add('no-carrinho');
                } else {
                    throw new Error(data.message || 'Erro ao adicionar curso ao carrinho');
                }
            } catch (erro) {
                console.error('Erro ao adicionar ao carrinho:', erro);
                alert(erro.message || 'Erro ao adicionar curso ao carrinho');
                // Restaurar o botão
                this.disabled = false;
                this.innerHTML = botaoOriginal;
            }
        });
    });
}); 