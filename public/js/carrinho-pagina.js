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
                // Desabilitar o botão e mostrar loading
                this.disabled = true;
                this.innerHTML = 'Processando...';
                
                // Primeiro, criar o pagamento no Mercado Pago
                const response = await fetch('/aluno/api/carrinho/criar-pagamento', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-Requested-With': 'XMLHttpRequest'
                    }
                });

                const data = await response.json();

                if (!response.ok) {
                    if (response.status === 401) {
                        // Se não estiver autenticado, redirecionar para o login
                        window.location.href = '/auth/cl-login';
                        return;
                    }
                    throw new Error(data.message || 'Erro ao criar pagamento');
                }

                if (data.init_point) {
                    // Redirecionar para a página de pagamento do Mercado Pago
                    window.location.href = data.init_point;
                } else {
                    throw new Error('Link de pagamento não encontrado');
                }
            } catch (erro) {
                console.error('Erro ao criar pagamento:', erro);
                alert(erro.message || 'Erro ao criar pagamento');
                // Restaurar o botão
                this.disabled = false;
                this.innerHTML = 'Finalizar Compra';
            }
        });
    }
}); 