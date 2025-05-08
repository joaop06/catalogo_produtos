const {
    GOOGLE_SHEET_ID,
    RANGE_SHEET_INFO,
    GOOGLE_CLOUD_API_KEY,
    RANGE_SHEET_PRODUCTS,
} = CONFIG;

const sheetInfoUrl = `https://sheets.googleapis.com/v4/spreadsheets/${GOOGLE_SHEET_ID}/values/${RANGE_SHEET_INFO}?key=${GOOGLE_CLOUD_API_KEY}`;
const sheetProductsUrl = `https://sheets.googleapis.com/v4/spreadsheets/${GOOGLE_SHEET_ID}/values/${RANGE_SHEET_PRODUCTS}?key=${GOOGLE_CLOUD_API_KEY}`;



/**
 * Botão Flutuante do WhatsApp
 */
document.addEventListener("DOMContentLoaded", function () {
    var whatsappButton = document.getElementById("whatsapp-button");

    setTimeout(function () {
        whatsappButton.style.display = "block";
        whatsappButton.classList.add("fade-in");

        setInterval(function () {
            whatsappButton.classList.toggle("jump");
        }, 2000);

    }, 3000);
});



/**
 * Busca as configurações da empresa
 *  - Logomarca
 *  - Número Whatsapp
 *  - Opção de preços habilitados/desabilitados
 */
let ENABLE_PRICE_PRODUCTS = false;
async function fetchCompanyConfig() {
    try {
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

                        const whatsappNumber = document.getElementById('whatsapp-number');
                        whatsappNumber.href = `https://wa.me/55${content}`; // Número do WhatsApp

                        whatsappNumber.classList.remove('disabled');
                        whatsappButton.classList.remove('disabled');
                        whatsappButton.classList.add('whatsapp-button');
                    }
                    break;

                case 'Habilitar Preços':
                    console.log(`Antes: ENABLE_PRICE_PRODUCTS ${ENABLE_PRICE_PRODUCTS} // content ${content}`);
                    ENABLE_PRICE_PRODUCTS = !!content && content.toString().toLowerCase() === 'sim';
                    console.log(`Depois: ENABLE_PRICE_PRODUCTS ${ENABLE_PRICE_PRODUCTS}`);
                    break;
            }

        });

        fetchProdutos();

    } catch (error) {
        console.error(error);
    }
}
fetchCompanyConfig();



/**
 * Busca os produtos para o catálogo
 */
async function fetchProdutos() {
    try {
        const response = await fetch(sheetProductsUrl);
        const data = await response.json();
        const products = data.values || [];

        /**
         * Para cada produto retornado da API:
         *  - Cria uma div com a classe `product-card`
         *  - Insere a imagem do produto
         *  - Adiciona as informações do produto
        */
        const container = document.getElementById('product-grid');
        container.innerHTML = '';
        products.forEach(([ref, name, price, image_link]) => {
            const card = document.createElement('div');
            card.className = 'product-card';
            console.log(ENABLE_PRICE_PRODUCTS, price)
            card.innerHTML = `
                <img src="${image_link}" alt="${name}" />
                <div class="product-info">
                    <div class="product-name">${name}</div>
                    <div class="product-ref">REF.${ref?.toString()?.trim()?.padStart(4, 0)}</div>
                    <div class="product-price">${!!ENABLE_PRICE_PRODUCTS ? !!price ? price : 'Em breve' : ''}
                    </div>
                </div>
            `;
            container.appendChild(card);
        });

    } catch (error) {
        document.getElementById('product-grid').innerText = 'Erro ao carregar produtos';
        console.error(error);
    }
}
