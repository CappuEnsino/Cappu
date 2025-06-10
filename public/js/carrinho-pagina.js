document.addEventListener('DOMContentLoaded', function() {
    const botoesRemover = document.querySelectorAll('.remover-curso');
    const botaoFinalizar = document.getElementById('finalizarCompra');
    const contadorCarrinho = document.getElementById('carrinhoContador');

    // Função para atualizar o contador do carrinho
    async function atualizarContadorCarrinho() {
        try {
            const response = await fetch('/aluno/api/carrinho/contador');
            const data = await response.json();
            
            if (response.ok && contadorCarrinho) {
                contadorCarrinho.textContent = data.quantidade;
            }
        } catch (erro) {
            console.error('Erro ao atualizar contador do carrinho:', erro);
        }
    }

    // Função para remover curso do carrinho
    async function removerDoCarrinho(cursoId) {
        try {
            const response = await fetch('/aluno/api/carrinho/remover', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ cursoId })
            });

            const data = await response.json();

            if (response.ok) {
                // Remover o elemento do DOM
                const cursoItem = document.querySelector(`[data-curso-id="${cursoId}"]`).closest('.curso-item');
                cursoItem.remove();

                // Atualizar o contador
                await atualizarContadorCarrinho();

                // Se não houver mais itens, recarregar a página para mostrar o carrinho vazio
                const itensRestantes = document.querySelectorAll('.curso-item');
                if (itensRestantes.length === 0) {
                    window.location.reload();
                }

                // Atualizar o subtotal
                atualizarSubtotal();
            } else {
                throw new Error(data.message || 'Erro ao remover curso do carrinho');
            }
        } catch (erro) {
            console.error('Erro ao remover do carrinho:', erro);
            alert(erro.message || 'Erro ao remover curso do carrinho');
        }
    }

    // Função para atualizar o subtotal
    function atualizarSubtotal() {
        const precos = document.querySelectorAll('.preco');
        let total = 0;

        precos.forEach(preco => {
            const valor = parseFloat(preco.textContent.replace('R$ ', ''));
            total += valor;
        });

        const subtotalElement = document.querySelector('.subtotal span:last-child');
        if (subtotalElement) {
            subtotalElement.textContent = `R$ ${total.toFixed(2)}`;
        }
    }

    // Adicionar eventos aos botões de remover
    botoesRemover.forEach(botao => {
        botao.addEventListener('click', function() {
            const cursoId = this.getAttribute('data-curso-id');
            if (confirm('Tem certeza que deseja remover este curso do carrinho?')) {
                removerDoCarrinho(cursoId);
            }
        });
    });

    // Adicionar evento ao botão de finalizar compra
    if (botaoFinalizar) {
        botaoFinalizar.addEventListener('click', async function() {
            try {
                const response = await fetch('/aluno/api/carrinho/finalizar', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    }
                });

                const data = await response.json();

                if (response.ok) {
                    alert('Compra finalizada com sucesso!');
                    window.location.href = '/aluno/a-meuscursos';
                } else {
                    throw new Error(data.message || 'Erro ao finalizar compra');
                }
            } catch (erro) {
                console.error('Erro ao finalizar compra:', erro);
                alert(erro.message || 'Erro ao finalizar compra');
            }
        });
    }
}); 