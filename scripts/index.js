const {
    GOOGLE_SHEET_ID,
    RANGE_SHEET_INFO,
    GOOGLE_CLOUD_API_KEY,
    RANGE_SHEET_PRODUCTS,
} = CONFIG;

const sheetInfoUrl = `https://sheets.googleapis.com/v4/spreadsheets/${GOOGLE_SHEET_ID}/values/${RANGE_SHEET_INFO}?key=${GOOGLE_CLOUD_API_KEY}`;
const sheetProductsUrl = `https://sheets.googleapis.com/v4/spreadsheets/${GOOGLE_SHEET_ID}/values/${RANGE_SHEET_PRODUCTS}?key=${GOOGLE_CLOUD_API_KEY}`;

// Configurações de paginação
let currentPage = 1;
let allProducts = [];
const ITEMS_PER_PAGE = 12;
let filteredProducts = [];

/**
 * Lista de palavras comuns para ignorar na busca
 */
const IGNORE_WORDS = ['de', 'da', 'do', 'das', 'dos', 'para', 'com', 'sem', 'em', 'no', 'na', 'nos', 'nas'];

/**
 * Botão Flutuante do WhatsApp
 */
document.addEventListener('DOMContentLoaded', () => {
    const button = document.getElementById('whatsapp-button');

    // Mostra o botão após 3 segundos
    setTimeout(() => {
        button.style.display = 'block';

        // A cada 2 segundos, aplica a animação
        setInterval(() => {
            button.style.animation = 'jump 0.8s ease';

            // Remove a animação após a execução para permitir reinício
            setTimeout(() => {
                button.style.animation = 'none';
            }, 500);
        }, 5000);
    }, 3000);

    // Inicializa o modal
    const modal = document.getElementById('imageModal');
    const modalClose = document.querySelector('.modal-close');
    const modalImage = document.getElementById('modalImage');

    // Fecha o modal ao clicar no X
    modalClose.addEventListener('click', () => {
        modal.classList.remove('active');
        modalImage.src = '';
    });

    // Fecha o modal ao clicar fora da imagem
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.classList.remove('active');
            modalImage.src = '';
        }
    });

    // Fecha o modal ao pressionar ESC
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && modal.classList.contains('active')) {
            modal.classList.remove('active');
            modalImage.src = '';
        }
    });

    // Inicializa os event listeners para busca e filtros
    initializeEventListeners();
});

/**
 * Inicializa todos os event listeners
 */
function initializeEventListeners() {
    // Event listener para busca
    const searchBox = document.getElementById('searchBox');
    const clearButton = document.getElementById('clearSearch');

    searchBox.addEventListener('input', handleSearch);

    // Event listener para o botão de limpar
    clearButton.addEventListener('click', () => {
        searchBox.value = '';
        filteredProducts = [...allProducts];
        currentPage = 1;
        renderProducts();
        renderPagination();
    });

    // Event listener para modal
    const modal = document.getElementById('imageModal');
    const modalClose = document.querySelector('.modal-close');
    modalClose.addEventListener('click', () => {
        modal.classList.remove('active');
    });

    // Fecha modal ao clicar fora
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.classList.remove('active');
        }
    });
}

/**
 * Busca as configurações da empresa
 *  - Logomarca
 *  - Número Whatsapp
 *  - Opção de preços habilitados/desabilitados
 */
let ENABLE_PRICE_PRODUCTS = false;
async function fetchCompanyConfig() {
    try {
        showLoading();
        const response = await fetch(sheetInfoUrl);
        const dataJson = await response.json();
        const companyData = dataJson.values || [];

        /**
         * Irá trabalhar em cima de cada dado da empresa
         */
        companyData.forEach(([name, content]) => {
            switch (name) {
                case 'Logo':
                    const imageLogo = document.getElementById('image-logo');
                    imageLogo.src = content; // Link da imagem
                    break;

                case 'Whatsapp':
                    if (!!content) {
                        const whatsappButton = document.getElementById('whatsapp-button');
                        whatsappButton.href = `https://wa.me/55${content}`; // Número do WhatsApp
                    }
                    break;

                case 'Habilitar Preços':
                    console.log(`Antes: ENABLE_PRICE_PRODUCTS ${ENABLE_PRICE_PRODUCTS} // content ${content}`);
                    ENABLE_PRICE_PRODUCTS = !!content && content.toString().toLowerCase() === 'sim';
                    console.log(`Depois: ENABLE_PRICE_PRODUCTS ${ENABLE_PRICE_PRODUCTS}`);
                    break;
            }

        });

        await fetchProdutos();
        hideLoading();
    } catch (error) {
        console.error(error);
        hideLoading();
    }
}
fetchCompanyConfig();



/**
 * Busca os produtos para o catálogo
 */
async function fetchProdutos() {
    try {
        showLoading();
        const response = await fetch(sheetProductsUrl);
        const data = await response.json();
        allProducts = data.values || [];

        // Aplica filtros iniciais
        filteredProducts = [...allProducts];
        renderProducts();
        renderPagination();
        hideLoading();
    } catch (error) {
        document.getElementById('product-grid').innerText = 'Erro ao carregar produtos';
        console.error(error);
        hideLoading();
    }
}

/**
 * Renderiza os produtos na grid
 */
function renderProducts() {
    const container = document.getElementById('product-grid');
    container.innerHTML = '';

    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    const productsToShow = filteredProducts.slice(startIndex, endIndex);

    productsToShow.forEach(([ref, name, price, image_link]) => {
        if (!name || !image_link) return;

        /**
         * Dados do Produto
         */
        const reference = ref?.toString()?.trim()?.padStart(4, 0);
        const referenceDiv = !!ref ? `REF.${reference}` : '';

        const productPriceDiv = !!ENABLE_PRICE_PRODUCTS ? !!price ? price : 'Em breve' : '';


        /**
         * Montagem do Card do Produto
         */
        const card = document.createElement('div');
        card.className = 'product-card';
        card.innerHTML = `
            <img src="${image_link}" alt="${name}" loading="lazy" />
            <div class="product-info">
                <div class="product-name">${name}</div>
                <div class="product-ref">${referenceDiv}</div>
                <div class="product-price">${productPriceDiv}</div>
            </div>
        `;

        // Adiciona evento de clique para abrir modal
        const img = card.querySelector('img');
        img.addEventListener('click', () => openImageModal(image_link, name));

        container.appendChild(card);
    });
}

/**
 * Função para scroll suave até o topo
 */
function scrollToTop() {
    window.scrollTo({
        top: 0,
        behavior: 'smooth'
    });
}

/**
 * Renderiza a paginação
 */
function renderPagination() {
    const totalPages = Math.ceil(filteredProducts.length / ITEMS_PER_PAGE);
    const pagination = document.getElementById('pagination');
    pagination.innerHTML = '';

    if (totalPages <= 1) return;

    const createButton = (text, page, disabled = false, isActive = false) => {
        const btn = document.createElement('button');
        btn.textContent = text;
        btn.className = 'pagination-button';
        if (isActive) btn.classList.add('active');
        if (disabled) {
            btn.classList.add('disabled');
        } else {
            btn.addEventListener('click', () => {
                currentPage = page;
                renderProducts();
                renderPagination();
                scrollToTop();
            });
        }
        return btn;
    };

    // Botão anterior
    pagination.appendChild(createButton('«', currentPage - 1, currentPage === 1));

    const pages = [];

    if (totalPages <= 5) {
        for (let i = 1; i <= totalPages; i++) {
            pages.push(i);
        }
    } else {
        pages.push(1);

        if (currentPage > 3) {
            pages.push('...');
        }

        const middlePages = [
            currentPage - 1,
            currentPage,
            currentPage + 1
        ].filter(p => p > 1 && p < totalPages);

        pages.push(...middlePages);

        if (currentPage < totalPages - 2) {
            pages.push('...');
        }

        pages.push(totalPages);
    }

    pages.forEach(p => {
        if (p === '...') {
            const span = document.createElement('span');
            span.textContent = '...';
            span.className = 'pagination-ellipsis';
            pagination.appendChild(span);
        } else {
            pagination.appendChild(createButton(p, p, false, p === currentPage));
        }
    });

    // Botão próximo
    pagination.appendChild(createButton('»', currentPage + 1, currentPage === totalPages));
}

/**
 * Manipula a busca de produtos
 */
function handleSearch(e) {
    const searchTerm = e.target.value.toLowerCase().trim();

    // Se a busca estiver vazia, mostra todos os produtos
    if (!searchTerm) {
        filteredProducts = [...allProducts];
        currentPage = 1;
        renderProducts();
        renderPagination();
        return;
    }

    // Divide os termos de busca em palavras individuais e remove palavras ignoradas
    const searchWords = searchTerm
        .split(/\s+/)
        .filter(word => !IGNORE_WORDS.includes(word));

    filteredProducts = allProducts.filter(([ref, name, price]) => {
        if (!name) return false;

        // Divide o nome do produto em palavras e remove palavras ignoradas
        const productWords = name
            .toLowerCase()
            .split(/\s+/)
            .filter(word => !IGNORE_WORDS.includes(word));

        // Verifica se todas as palavras da busca estão presentes no nome do produto
        return searchWords.every(searchWord =>
            productWords.some(productWord => productWord.includes(searchWord))
        );
    });

    currentPage = 1;
    renderProducts();
    renderPagination();
}

/**
 * Abre o modal com a imagem do produto
 */
function openImageModal(imageUrl, productName) {
    const modal = document.getElementById('imageModal');
    const modalImage = document.getElementById('modalImage');

    modalImage.src = imageUrl;
    modalImage.alt = productName;
    modal.classList.add('active');
}

/**
 * Mostra o loading spinner
 */
function showLoading() {
    document.getElementById('loadingSpinner').style.display = 'block';
}

/**
 * Esconde o loading spinner
 */
function hideLoading() {
    document.getElementById('loadingSpinner').style.display = 'none';
}
