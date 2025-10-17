document.addEventListener('DOMContentLoaded', () => {
    
    // --- Variáveis Globais e Inicialização ---
    
    // Armazenamento do carrinho (Lê do LocalStorage ou inicia vazio)
    let cart = JSON.parse(localStorage.getItem('oneStoreCart')) || [];

    // Elementos do Modal e Carrinho Flutuante
    const cartModal = document.getElementById('cartModal');
    const closeCartModal = document.getElementById('closeCartModal');
    const viewCartBtn = document.getElementById('viewCartBtn');
    const cartIcon = document.getElementById('cartIcon');
    const cartItemsList = document.getElementById('cartItemsList');
    const modalCartCount = document.getElementById('modalCartCount');
    const modalCartTotal = document.getElementById('modalCartTotal');
    const floatingCartSummary = document.getElementById('floatingCartSummary');
    const floatingCartCount = document.getElementById('floatingCartCount');
    const floatingCartTotal = document.getElementById('floatingCartTotal');
    
    // --- Funções Auxiliares ---

    /**
     * Função de formatação para Real Brasileiro (BRL).
     */
    const formatCurrency = (value) => {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL',
        }).format(value);
    };

    /**
     * Salva o estado atual do carrinho no LocalStorage.
     */
    const saveCart = () => {
        localStorage.setItem('oneStoreCart', JSON.stringify(cart));
    };

    /**
     * Abre o modal do carrinho.
     */
    const openCartModal = () => {
        updateCartUI(); // Garante que a lista está atualizada
        cartModal.classList.add('open');
        document.body.style.overflow = 'hidden'; // Evita rolagem do fundo
    };

    /**
     * Fecha o modal do carrinho.
     */
    const closeCart = () => {
        cartModal.classList.remove('open');
        document.body.style.overflow = ''; 
    };
    
    // --- Funções de Lógica do Carrinho ---

    /**
     * Atualiza o estado visual do carrinho (ícone, flutuante e modal).
     */
    const updateCartUI = () => {
        const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
        const totalPrice = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        
        // 1. Atualiza o contador do ícone (header)
        document.getElementById('cartCount').textContent = totalItems;

        // 2. Atualiza o resumo flutuante
        floatingCartCount.textContent = `${totalItems} item(s)`;
        floatingCartTotal.textContent = formatCurrency(totalPrice);
        
        // Mostra/Esconde o resumo flutuante
        if (totalItems > 0) {
            floatingCartSummary.classList.add('visible');
        } else {
            floatingCartSummary.classList.remove('visible');
        }

        // 3. Atualiza o Modal
        modalCartCount.textContent = totalItems;
        modalCartTotal.textContent = formatCurrency(totalPrice);
        renderCartItems(); 
        saveCart();
    };

    /**
     * Renderiza os itens do carrinho dentro do Modal. (Sem alterações)
     */
    const renderCartItems = () => {
        cartItemsList.innerHTML = ''; // Limpa a lista atual

        if (cart.length === 0) {
            cartItemsList.innerHTML = '<p class="empty-cart-message">Seu carrinho está vazio.</p>';
            return;
        }

        cart.forEach(item => {
            const itemTotal = item.price * item.quantity;
            const cartItemDiv = document.createElement('div');
            cartItemDiv.classList.add('cart-item');
            
            cartItemDiv.dataset.id = item.id;
            cartItemDiv.dataset.size = item.size;

            cartItemDiv.innerHTML = `
                <div class="cart-item-details">
                    <h4>${item.name}</h4>
                    <p>Tamanho: ${item.size}</p>
                    <p>${formatCurrency(item.price)} cada</p>
                </div>
                <div class="cart-item-controls">
                    <span class="item-price">${formatCurrency(itemTotal)}</span>
                    <div class="quantity-control">
                        <button class="qty-minus" data-id="${item.id}" data-size="${item.size}">-</button>
                        <span class="qty-amount">${item.quantity}</span>
                        <button class="qty-plus" data-id="${item.id}" data-size="${item.size}">+</button>
                    </div>
                    <button class="remove-btn" data-id="${item.id}" data-size="${item.size}" title="Remover item">&times;</button>
                </div>
            `;
            cartItemsList.appendChild(cartItemDiv);
        });
    };

    /**
     * Adiciona, remove ou ajusta a quantidade de um produto no carrinho.
     * (Atualizada para buscar a URL da imagem)
     */
    const updateCartItem = (productId, productSize, delta) => {
        const existingItemIndex = cart.findIndex(
            item => item.id === productId && item.size === productSize
        );

        if (existingItemIndex > -1) {
            // Item já existe: ajusta a quantidade
            cart[existingItemIndex].quantity += delta;
            
            // Remove o item se a quantidade for 0 ou se delta for -Infinity
            if (cart[existingItemIndex].quantity <= 0 || delta === -Infinity) {
                cart.splice(existingItemIndex, 1);
            }
        } else if (delta > 0) {
            // Item novo: precisa ser adicionado
            
            // Busca os dados do produto no DOM
            const cardElement = document.querySelector(`button[data-id="${productId}"]`).closest('.card');
            const productName = cardElement.querySelector('[data-name]').dataset.name;
            const productPrice = parseFloat(cardElement.querySelector('.price').dataset.price);
            
            // NOVIDADE: Pega a URL da imagem do atributo data-img-url do card
            const imageUrl = cardElement.dataset.imgUrl || 'Link indisponível'; 

            cart.push({
                id: productId,
                name: productName,
                price: productPrice,
                size: productSize,
                quantity: 1,
                imageUrl: imageUrl // SALVA A URL NO CARRINHO
            });
        }

        updateCartUI();
    };

    /**
     * Gera o link do WhatsApp com os detalhes do pedido formatados.
     * (Atualizada para incluir o link da imagem)
     */
    const generateWhatsAppLink = () => {
        let orderDetails = "Olá! Gostaria de fazer o seguinte pedido na One Store:\n\n";
        let totalValue = 0;

        cart.forEach((item, index) => {
            const itemTotal = item.price * item.quantity;
            totalValue += itemTotal;
            
            orderDetails += `*${index + 1}.* ${item.name} (${item.size})\n`;
            orderDetails += `   - Quantidade: ${item.quantity}\n`;
            orderDetails += `   - Preço Unitário: ${formatCurrency(item.price)}\n`;
            orderDetails += `   - Subtotal: ${formatCurrency(itemTotal)}\n`;
            
            // NOVIDADE: Adiciona o link da imagem se estiver disponível
            if (item.imageUrl && item.imageUrl !== 'Link indisponível') {
                 orderDetails += `   - Imagem: ${item.imageUrl}\n\n`;
            } else {
                 orderDetails += `   - Imagem: Não disponível\n\n`;
            }
        });

        orderDetails += "--------------------------------------\n";
        orderDetails += `*TOTAL DO PEDIDO:* ${formatCurrency(totalValue)}\n`;
        orderDetails += "--------------------------------------\n\n";
        orderDetails += "Por favor, me envie as opções de pagamento. Obrigado!";

        // IMPORTANTE: SUBSTITUA ESTE NÚMERO PELO SEU NÚMERO DE WHATSAPP REAL (55 + DD + Número)
        const phoneNumber = "67999252257"; 

        // Codifica a mensagem para URL
        const encodedMessage = encodeURIComponent(orderDetails);

        return `https://api.whatsapp.com/send?phone=${phoneNumber}&text=${encodedMessage}`;
    };

    /**
     * Lida com a finalização da compra (Checkout). (Sem alterações na lógica)
     */
    const handleCheckout = () => {
         if (cart.length > 0) {
            
            const whatsappLink = generateWhatsAppLink();

            // 1. Abre a URL do WhatsApp em uma nova aba
            window.open(whatsappLink, '_blank');
            
            // 2. Limpa o carrinho após a abertura do link
            setTimeout(() => {
                alert("Redirecionando para o WhatsApp. Envie a mensagem para finalizar seu pedido!");
                
                // Limpa o carrinho e atualiza a UI
                cart = [];
                updateCartUI(); 
                closeCart(); 
            }, 500); 

         } else {
             alert("Adicione itens ao carrinho antes de finalizar a compra.");
             openCartModal();
         }
    };
    
    // --- Escutas de Eventos (Listeners) ---

    // Inicializa a UI com o carrinho do LocalStorage ao carregar
    updateCartUI();

    // 1. Menu Toggle (Responsivo)
    const menuToggle = document.getElementById('menuToggle');
    const navMenu = document.getElementById('navMenu');

    menuToggle.addEventListener('click', () => {
        navMenu.classList.toggle('open');
    });

    // 2. Adicionar ao Carrinho (Botões de Compra)
    document.querySelectorAll('.btn-buy').forEach(button => {
        button.addEventListener('click', (event) => {
            const productId = event.target.dataset.id;
            const card = event.target.closest('.card');
            
            // Pega o tamanho selecionado ou assume 'ÚNICO'
            const sizeSelect = card.querySelector('.product-size');
            const productSize = sizeSelect ? sizeSelect.value : 'ÚNICO'; 

            updateCartItem(productId, productSize, 1); // Adiciona 1 unidade
        });
    });
    
    // 3. Abrir e Fechar Modal do Carrinho
    viewCartBtn.addEventListener('click', openCartModal); 
    cartIcon.addEventListener('click', openCartModal);
    floatingCartSummary.addEventListener('click', openCartModal);
    
    closeCartModal.addEventListener('click', closeCart);
    
    // Fechar ao clicar fora do modal
    window.addEventListener('click', (event) => {
        if (event.target === cartModal) {
            closeCart();
        }
    });

    // 4. Ações de Quantidade e Remoção dentro do Modal (Event Delegation)
    cartItemsList.addEventListener('click', (event) => {
        const target = event.target;
        const productId = target.dataset.id;
        const productSize = target.dataset.size;
        
        if (target.classList.contains('qty-plus')) {
            updateCartItem(productId, productSize, 1);
        } else if (target.classList.contains('qty-minus')) {
            updateCartItem(productId, productSize, -1);
        } else if (target.classList.contains('remove-btn')) {
            updateCartItem(productId, productSize, -Infinity); 
        }
    });

    // 5. Finalizar Pedido (Checkout)
    document.getElementById('floatingCartCheckout').addEventListener('click', (e) => {
        e.stopPropagation(); 
        handleCheckout();
    });
    
    document.getElementById('modalCheckoutBtn').addEventListener('click', handleCheckout);
    
    // 6. Funcionalidade de Filtro
    const filterControls = document.getElementById('camisetasFilter');
    const gridCamisetas = document.querySelector('#camisetas .grid');

    if (filterControls && gridCamisetas) {
        filterControls.addEventListener('click', (event) => {
            if (event.target.classList.contains('filter-btn')) {
                const filterValue = event.target.dataset.filter;
                
                // Atualiza o estado ativo dos botões
                filterControls.querySelectorAll('.filter-btn').forEach(btn => btn.classList.remove('active'));
                event.target.classList.add('active');

                // Filtra os cards
                gridCamisetas.querySelectorAll('.card').forEach(card => {
                    const cardFilters = card.dataset.filter || ''; 
                    
                    if (filterValue === 'all' || cardFilters.includes(filterValue)) {
                        card.style.display = 'block'; 
                    } else {
                        card.style.display = 'none';
                    }
                });
            }
        });
    }
});
