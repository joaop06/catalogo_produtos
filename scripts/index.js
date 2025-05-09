const {
    GOOGLE_SHEET_ID,
    RANGE_SHEET_INFO,
    GOOGLE_CLOUD_API_KEY,
    RANGE_SHEET_PRODUCTS,
} = CONFIG;

const sheetInfoUrl = `https://sheets.googleapis.com/v4/spreadsheets/${GOOGLE_SHEET_ID}/values/${RANGE_SHEET_INFO}?key=${GOOGLE_CLOUD_API_KEY}`;
const sheetProductsUrl = `https://sheets.googleapis.com/v4/spreadsheets/${GOOGLE_SHEET_ID}/values/${RANGE_SHEET_PRODUCTS}?key=${GOOGLE_CLOUD_API_KEY}`;

// Configurações de paginação
const ITEMS_PER_PAGE = 12;
let currentPage = 1;
let allProducts = [];
let filteredProducts = [];

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
});


/**
 * Inicializa todos os event listeners
 */
function initializeEventListeners() {
    // Event listener para busca
    const searchBox = document.getElementById('searchBox');
    searchBox.addEventListener('input', handleSearch);

    // Event listeners para filtros
    const filterButtons = document.querySelectorAll('.filter-button');
    filterButtons.forEach(button => {
        button.addEventListener('click', handleFilter);
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

    // Botão anterior
    if (currentPage > 1) {
        const prevButton = document.createElement('button');
        prevButton.className = 'pagination-button';
        prevButton.innerHTML = '&laquo;';
        prevButton.addEventListener('click', () => {
            currentPage--;
            renderProducts();
            renderPagination();
            scrollToTop();
        });
        pagination.appendChild(prevButton);
    }

    // Números das páginas
    for (let i = 1; i <= totalPages; i++) {
        const pageButton = document.createElement('button');
        pageButton.className = `pagination-button ${i === currentPage ? 'active' : ''}`;
        pageButton.textContent = i;
        pageButton.addEventListener('click', () => {
            currentPage = i;
            renderProducts();
            renderPagination();
            scrollToTop();
        });
        pagination.appendChild(pageButton);
    }

    // Botão próximo
    if (currentPage < totalPages) {
        const nextButton = document.createElement('button');
        nextButton.className = 'pagination-button';
        nextButton.innerHTML = '&raquo;';
        nextButton.addEventListener('click', () => {
            currentPage++;
            renderProducts();
            renderPagination();
            scrollToTop();
        });
        pagination.appendChild(nextButton);
    }
}

/**
 * Manipula a busca de produtos
 */
function handleSearch(e) {
    const searchTerm = e.target.value.toLowerCase();
    filteredProducts = allProducts.filter(([ref, name, price]) => {
        return name.toLowerCase().includes(searchTerm) ||
            ref.toString().toLowerCase().includes(searchTerm);
    });
    currentPage = 1;
    renderProducts();
    renderPagination();
}

/**
 * Manipula os filtros de produtos
 */
function handleFilter(e) {
    const filter = e.target.dataset.filter;

    // Atualiza botões ativos
    document.querySelectorAll('.filter-button').forEach(btn => {
        btn.classList.remove('active');
    });
    e.target.classList.add('active');

    // Aplica filtro
    switch (filter) {
        case 'price':
            filteredProducts = allProducts.filter(([, , price]) => !!price);
            break;
        case 'no-price':
            filteredProducts = allProducts.filter(([, , price]) => !price);
            break;
        default:
            filteredProducts = [...allProducts];
    }

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
