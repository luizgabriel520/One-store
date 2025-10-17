const storeName = "One Store";
const storeWhatsAppNumber = "67999252257"; // Substitua pelo seu número real (código país + ddd + número)

let shoppingCart = [];

// =========================================================
// 1. FUNÇÕES DO CARRINHO (Adicionar, Remover, Exibir)
// =========================================================

function updateCartCounts() {
    const totalItems = shoppingCart.reduce((acc, item) => acc + item.quantity, 0);
    const cartCountElements = document.querySelectorAll('.cart-count');
    const floatingCartCount = document.getElementById('floatingCartCount');
    
    cartCountElements.forEach(el => el.textContent = totalItems);
    
    // Atualiza o resumo flutuante
    if (floatingCartCount) {
        floatingCartCount.textContent = `${totalItems} item(s)`;
    }
    
    updateFloatingCartTotal();
    toggleFloatingCart(totalItems > 0);
}

function updateFloatingCartTotal() {
    const floatingCartTotal = document.getElementById('floatingCartTotal');
    if (!floatingCartTotal) return;

    const total = shoppingCart.reduce((acc, item) => acc + (item.price * item.quantity), 0);
    floatingCartTotal.textContent = `R$ ${total.toFixed(2).replace('.', ',')}`;
}

function toggleFloatingCart(isVisible) {
    const summary = document.getElementById('floatingCartSummary');
    if (summary) {
        summary.classList.toggle('visible', isVisible);
    }
}

function addToCart(productId) {
    const card = document.querySelector(`.card .btn-buy[data-id="${productId}"]`).closest('.card');
    
    const productName = card.querySelector('[data-name]').getAttribute('data-name');
    const priceElement = card.querySelector('.price');
    const price = parseFloat(priceElement.getAttribute('data-price'));
    
    // Pega o tamanho selecionado (do select)
    const sizeSelect = card.querySelector('.product-size');
    const size = sizeSelect ? sizeSelect.value : 'Único'; 

    // Pega o caminho da imagem
    let imageSrc;
    const mainImageDiv = card.querySelector('.product-image');
    if (mainImageDiv) {
        // Para cards com a nova estrutura de slider/thumbnails
        imageSrc = mainImageDiv.getAttribute('data-main-image');
    } else {
        // Para cards com a estrutura de <img> simples
        imageSrc = card.querySelector('img') ? card.querySelector('img').src : 'imagem-padrao.jpg';
    }

    // Normaliza o caminho para ser apenas o nome do arquivo/pasta (ex: 'camisetas/Img1.jpg')
    // Remove o prefixo do URL se houver (ex: http://127.0.0.1:5500/camisetas/Img1.jpg -> camisetas/Img1.jpg)
    if (imageSrc) {
        const url = new URL(imageSrc, window.location.href);
        // Pega o path após o último segmento do domínio (que normalmente é o nome do arquivo/pasta)
        // Isso é importante para que o link no WhatsApp seja um path limpo
        imageSrc = url.pathname.substring(url.pathname.lastIndexOf('/') + 1);
        if (url.pathname.lastIndexOf('/') > 0) {
             const pathSegments = url.pathname.split('/');
             imageSrc = pathSegments.slice(pathSegments.length - 2).join('/'); // Pega os últimos 2 segmentos (ex: camisetas/Img1.jpg)
        }
    }


    const existingItemIndex = shoppingCart.findIndex(item => item.id === productId && item.size === size);

    if (existingItemIndex > -1) {
        shoppingCart[existingItemIndex].quantity += 1;
    } else {
        shoppingCart.push({
            id: productId,
            name: productName,
            price: price,
            quantity: 1,
            size: size,
            imageSrc: imageSrc 
        });
    }

    updateCartCounts();
    showCustomModal('Item Adicionado', `${productName} (Tam: ${size}) adicionado ao carrinho!`, 'OK, Entendi');
}

function removeItem(index) {
    shoppingCart.splice(index, 1);
    updateCartCounts();
    displayCartInModal(); 
}

function updateQuantity(index, newQty) {
    newQty = parseInt(newQty);
    if (newQty <= 0) {
        removeItem(index);
    } else {
        shoppingCart[index].quantity = newQty;
        updateCartCounts();
        displayCartInModal(); 
    }
}

// =========================================================
// 2. MODAL E EXIBIÇÃO DO CARRINHO
// =========================================================

function showCustomModal(title, body, actionText) {
    const modal = document.getElementById('customModal');
    const modalTitle = document.getElementById('modalTitle');
    const modalBody = document.getElementById('modalBody');
    const modalActionBtn = document.getElementById('modalActionBtn');
    const modalCartItems = document.getElementById('modalCartItems');

    // Limpa o conteúdo do carrinho se for um modal de confirmação simples
    modalCartItems.innerHTML = '';
    
    modalTitle.textContent = title;
    modalBody.innerHTML = body;
    modalActionBtn.textContent = actionText;
    
    // O botão de checkout/visualizar carrinho tem uma ação especial
    if (title === "Seu Carrinho") {
        modalActionBtn.dataset.action = 'checkout';
    } else {
        modalActionBtn.dataset.action = 'close';
    }

    modal.style.display = 'block';
}

function displayCartInModal() {
    const modalCartItems = document.getElementById('modalCartItems');
    modalCartItems.innerHTML = ''; // Limpa o conteúdo anterior
    
    let cartContent = '';
    let total = 0;

    if (shoppingCart.length === 0) {
        showCustomModal("Seu Carrinho", "<p>Seu carrinho está vazio. Adicione alguns produtos!</p>", "Continuar Comprando");
        return;
    }

    shoppingCart.forEach((item, index) => {
        const itemTotal = item.price * item.quantity;
        total += itemTotal;
        
        // Estrutura para cada item no modal
        cartContent += `
            <div class="modal-cart-item">
                <img src="${item.imageSrc}" alt="${item.name}" onerror="this.src='imagem-padrao.jpg'">
                <div class="item-details">
                    <p class="item-name">${item.name}</p>
                    <p>Tam: ${item.size}</p>
                    <p class="item-qty-price">R$ ${(item.price * item.quantity).toFixed(2).replace('.', ',')} (${item.price.toFixed(2).replace('.', ',')}/un)</p>
                </div>
                <input type="number" min="1" value="${item.quantity}" class="qty-input" data-index="${index}" style="width: 50px; text-align: center;">
                <button class="remove-item-btn" data-index="${index}">Remover</button>
            </div>
        `;
    });

    modalCartItems.innerHTML = cartContent;
    
    // Adiciona o total
    modalCartItems.innerHTML += `<div class="total-summary">Total: R$ ${total.toFixed(2).replace('.', ',')}</div>`;
    
    // Reabilita o modal de carrinho
    showCustomModal("Seu Carrinho", "", "Finalizar Pedido via WhatsApp");

    // Adiciona listeners para botões de remoção e inputs de quantidade
    modalCartItems.querySelectorAll('.remove-item-btn').forEach(button => {
        button.addEventListener('click', (e) => {
            const index = parseInt(e.target.getAttribute('data-index'));
            removeItem(index);
        });
    });
    
    modalCartItems.querySelectorAll('.qty-input').forEach(input => {
        input.addEventListener('change', (e) => {
            const index = parseInt(e.target.getAttribute('data-index'));
            const newQty = parseInt(e.target.value);
            updateQuantity(index, newQty);
        });
    });
}


// =========================================================
// 3. WHATSAPP E NOTA FISCAL (ATUALIZADO AQUI)
// =========================================================

function generateInvoiceMessage() {
    let total = 0;
    let message = `*🛒 Pedido ${storeName}*\n\n`;
    message += "--- *ITENS DO PEDIDO* ---\n";

    shoppingCart.forEach((item, index) => {
        const itemTotal = item.price * item.quantity;
        total += itemTotal;
        
        // 1. Descrição e Preço do Item
        message += `${index + 1}. (${item.quantity}x) ${item.name} (Tam: ${item.size}) - R$ ${itemTotal.toFixed(2).replace('.', ',')}\n`;
        
        // 2. INCLUSÃO DO LINK DA IMAGEM
        // O cliente pode clicar neste link no WhatsApp para ver a imagem completa.
        // Como o cliente está navegando na loja, o link deve ser absoluto para funcionar fora da página.
        const imageLink = new URL(item.imageSrc, window.location.href).href;
        message += `_🖼️ Imagem: ${imageLink}_\n`; 
        
        // Adiciona uma linha em branco para separar os itens
        message += "\n";
    });

    message += "--------------------------\n";
    message += `*VALOR TOTAL: R$ ${total.toFixed(2).replace('.', ',')}*\n\n`;
    message += `Olá! Gostaria de *confirmar e finalizar* a compra deste pedido. Por favor, me envie as opções de pagamento e frete.`;

    return encodeURIComponent(message);
}


function sendWhatsAppMessage() {
    if (shoppingCart.length === 0) {
        showCustomModal("Atenção", "Seu carrinho está vazio. Adicione itens antes de finalizar a compra.", "OK, Entendi");
        return;
    }

    const encodedMessage = generateInvoiceMessage();
    const whatsappUrl = `https://wa.me/${storeWhatsAppNumber}?text=${encodedMessage}`;
    
    window.open(whatsappUrl, '_blank');
    
    // Opcional: Limpar o carrinho após o envio da mensagem
    // shoppingCart = [];
    // updateCartCounts();
    // document.getElementById('customModal').style.display = 'none';
}

// =========================================================
// 4. EVENT LISTENERS E INICIALIZAÇÃO
// =========================================================

document.addEventListener('DOMContentLoaded', () => {
    // === 4.1 Event Listeners para Carrinho ===
    document.querySelectorAll('.btn-buy').forEach(button => {
        button.addEventListener('click', (e) => {
            addToCart(e.target.getAttribute('data-id'));
        });
    });

    // Botões que abrem o modal do carrinho
    document.getElementById('viewCartBtn').addEventListener('click', displayCartInModal);
    document.getElementById('cartIcon').addEventListener('click', displayCartInModal);
    
    // Botão de checkout do resumo flutuante
    document.getElementById('floatingCartCheckout').addEventListener('click', sendWhatsAppMessage);


    // === 4.2 Modal Listeners ===
    document.getElementById('closeModalBtn').addEventListener('click', () => {
        document.getElementById('customModal').style.display = 'none';
    });

    document.getElementById('modalActionBtn').addEventListener('click', (e) => {
        if (e.target.dataset.action === 'checkout') {
            sendWhatsAppMessage();
        }
        document.getElementById('customModal').style.display = 'none';
    });

    window.addEventListener('click', (event) => {
        if (event.target === document.getElementById('customModal')) {
            document.getElementById('customModal').style.display = 'none';
        }
    });
    
    // === 4.3 Menu Mobile Toggle ===
    const menuToggle = document.getElementById('menuToggle');
    const navMenu = document.getElementById('navMenu');

    menuToggle.addEventListener('click', () => {
        navMenu.classList.toggle('open');
    });
    
    navMenu.querySelectorAll('a').forEach(link => {
        link.addEventListener('click', () => {
            if (window.innerWidth < 768) {
                navMenu.classList.remove('open');
            }
        });
    });
    
    // === 4.4 Carrossel ===
    const carouselContainer = document.getElementById('carouselContainer');
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');
    const slides = document.querySelectorAll('.slide');
    let currentSlide = 0;
    
    function showSlide(index) {
        if (index >= slides.length) {
            currentSlide = 0;
        } else if (index < 0) {
            currentSlide = slides.length - 1;
        } else {
            currentSlide = index;
        }
        
        const offset = -currentSlide * 100;
        carouselContainer.style.transform = `translateX(${offset}%)`;
    }
    
    nextBtn.addEventListener('click', () => {
        showSlide(currentSlide + 1);
    });
    
    prevBtn.addEventListener('click', () => {
        showSlide(currentSlide - 1);
    });
    
    // Auto-play
    setInterval(() => {
        showSlide(currentSlide + 1);
    }, 5000); 

    // === 4.5 Back to Top Button ===
    const backToTopBtn = document.getElementById('backToTopBtn');

    window.onscroll = function() {
        if (document.body.scrollTop > 100 || document.documentElement.scrollTop > 100) {
            backToTopBtn.style.display = "block";
        } else {
            backToTopBtn.style.display = "none";
        }
    };

    backToTopBtn.addEventListener('click', () => {
        document.body.scrollTop = 0; // Para Safari
        document.documentElement.scrollTop = 0; // Para Chrome, Firefox, IE e Opera
    });

    // === 4.6 Filtragem e Mini-Sliders (Thumbnails) ===
    
    // Filtragem de Produtos
    function filterProducts(categorySelector, filterValue) {
        const categorySection = document.querySelector(categorySelector);
        const cards = categorySection.querySelectorAll('.card');

        cards.forEach(card => {
            const filters = card.getAttribute('data-filter').split(' ');
            if (filterValue === 'all' || filters.includes(filterValue)) {
                card.style.display = 'block';
            } else {
                card.style.display = 'none';
            }
        });
    }

    document.querySelectorAll('.filter-controls').forEach(controls => {
        const categoryId = controls.closest('section').id;
        controls.querySelectorAll('.filter-btn').forEach(button => {
            button.addEventListener('click', (e) => {
                // Remove 'active' de todos os botões e adiciona ao clicado
                controls.querySelectorAll('.filter-btn').forEach(btn => btn.classList.remove('active'));
                e.target.classList.add('active');
                
                // Aplica o filtro
                const filterValue = e.target.getAttribute('data-filter');
                filterProducts(`#${categoryId}`, filterValue);
            });
        });
    });

    // Mini-Sliders (Thumbnails)
    document.querySelectorAll('.card').forEach(card => {
        const mainImageDiv = card.querySelector('.product-image');
        const thumbnails = card.querySelectorAll('.image-thumbnails img');

        thumbnails.forEach(thumb => {
            thumb.addEventListener('click', (e) => {
                const newImageSrc = e.target.getAttribute('data-image');
                
                // 1. Troca a imagem principal
                if (mainImageDiv) {
                    mainImageDiv.style.backgroundImage = `url('${newImageSrc}')`;
                    mainImageDiv.setAttribute('data-main-image', newImageSrc);
                }
                
                // 2. Atualiza os ativos (UI)
                card.querySelectorAll('.image-thumbnails img').forEach(t => t.classList.remove('active-thumb'));
                e.target.classList.add('active-thumb');
            });
        });
    });

    // === 4.7 Inicialização ===
    updateCartCounts();
});
