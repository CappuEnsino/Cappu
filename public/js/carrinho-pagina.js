document.addEventListener('DOMContentLoaded', function() {
    const botoesRemover = document.querySelectorAll('.remover-curso');
    const contadorCarrinho = document.getElementById('carrinhoContador');
    const walletContainer = document.getElementById('wallet_container');

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
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ cursoId })
            });

            const data = await response.json();
            if (data.success) {
                window.location.reload();
            } else {
                alert(data.message || 'Erro ao remover item do carrinho');
            }
        } catch (erro) {
            console.error('Erro ao remover do carrinho:', erro);
            alert('Erro ao remover item do carrinho');
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

    // Inicializar o Checkout Pro se houver itens no carrinho
    if (walletContainer && botoesRemover.length > 0) {
        async function inicializarCheckoutPro() {
            try {
                // Mostrar loading
                walletContainer.innerHTML = `
                    <button class="btn-checkout" style="
                        width: 100%;
                        padding: 12px;
                        background-color: #009ee3;
                        color: white;
                        border: none;
                        border-radius: 4px;
                        font-size: 16px;
                        cursor: pointer;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        gap: 8px;
                    " disabled>
                        <span class="loading-spinner" style="
                            width: 20px;
                            height: 20px;
                            border: 2px solid #ffffff;
                            border-radius: 50%;
                            border-top-color: transparent;
                            animation: spin 1s linear infinite;
                        "></span>
                        Processando...
                    </button>
                    <style>
                        @keyframes spin {
                            to { transform: rotate(360deg); }
                        }
                    </style>
                `;

                const response = await fetch('/aluno/api/carrinho/criar-pagamento', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    }
                });

                const data = await response.json();

                if (!response.ok) {
                    if (response.status === 401) {
                        window.location.href = '/auth/cl-login';
                        return;
                    }
                    throw new Error(data.message || 'Erro ao criar pagamento');
                }

                if (data.preference_id) {
                    // Criar botão de checkout
                    walletContainer.innerHTML = `
                        <button class="btn-checkout" onclick="window.location.href='${data.sandbox_init_point}'" style="
                            width: 100%;
                            padding: 12px;
                            background-color: #009ee3;
                            color: white;
                            border: none;
                            border-radius: 4px;
                            font-size: 16px;
                            cursor: pointer;
                            display: flex;
                            align-items: center;
                            justify-content: center;
                            gap: 8px;
                            transition: background-color 0.2s;
                        ">
                            <img src="https://http2.mlstatic.com/frontend-assets/mp-branding/assets/img/logo-mp.svg" 
                                 alt="Mercado Pago" 
                                 style="height: 24px;">
                            Pagar com Mercado Pago
                        </button>
                        <style>
                            .btn-checkout:hover {
                                background-color: #007eb5;
                            }
                        </style>
                    `;
                } else {
                    throw new Error('ID da preferência não encontrado');
                }
            } catch (erro) {
                console.error('Erro ao inicializar checkout:', erro);
                let mensagemErro = 'Erro ao carregar o checkout. ';
                
                if (erro.message) {
                    if (erro.message.includes('auto_return')) {
                        mensagemErro += 'Erro de configuração do Mercado Pago. Por favor, contate o suporte.';
                    } else if (erro.message.includes('401')) {
                        mensagemErro += 'Sua sessão expirou. Por favor, faça login novamente.';
                        setTimeout(() => window.location.href = '/auth/cl-login', 2000);
                    } else if (erro.message.includes('carrinho está vazio')) {
                        mensagemErro = 'Seu carrinho está vazio. Adicione cursos para continuar.';
                    } else if (erro.message.includes('valor total')) {
                        mensagemErro = 'Erro ao calcular o valor da compra. Por favor, tente novamente.';
                    } else {
                        mensagemErro += erro.message;
                    }
                }
                
                walletContainer.innerHTML = `
                    <section class="erro-checkout" style="
                        color: #dc3545;
                        padding: 15px;
                        text-align: center;
                        border: 1px solid #dc3545;
                        border-radius: 4px;
                        margin: 10px 0;
                        background-color: #fff;
                        box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                    ">
                        <p style="margin: 0 0 10px 0;">${mensagemErro}</p>
                        <button onclick="window.location.reload()" style="
                            background-color: #dc3545;
                            color: white;
                            border: none;
                            padding: 8px 16px;
                            border-radius: 4px;
                            cursor: pointer;
                        ">
                            Tentar Novamente
                        </button>
                    </section>
                `;
            }
        }

        inicializarCheckoutPro();
    }
}); 