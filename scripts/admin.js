const {
    PASSWORD_ADMIN,
    CLOUDINARY_NAME,
    GOOGLE_SHEET_ID,
    RANGE_SHEET_INFO,
    GOOGLE_CLOUD_API_KEY,
    CLOUDINARY_UPLOAD_PRESET,
} = CONFIG;

const sheetInfoUrl = `https://sheets.googleapis.com/v4/spreadsheets/${GOOGLE_SHEET_ID}/values/${RANGE_SHEET_INFO}?key=${GOOGLE_CLOUD_API_KEY}`;

window.onload = function () {
    if (!!PASSWORD_ADMIN) {
        const password = prompt("Digite a senha para acessar:");
        if (password !== PASSWORD_ADMIN) {
            alert("Acesso negado.");
            window.location.href = "../index.html";
        }
    }
};

document.getElementById('uploadButton').addEventListener('click', async () => {
    const fileInput = document.getElementById('fileInput');
    const customNameInput = document.getElementById('customName');
    const uploadButton = document.getElementById('uploadButton');
    const messageEl = document.getElementById('message');
    const file = fileInput.files[0];
    const customName = customNameInput.value.trim();

    messageEl.textContent = '';
    uploadButton.disabled = true;
    uploadButton.textContent = 'Enviando...';

    if (!file) {
        messageEl.textContent = 'Selecione um arquivo.';
        uploadButton.disabled = false;
        uploadButton.textContent = 'Enviar Imagem';
        return;
    }

    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
    if (customName) {
        const extension = file.name.split('.').pop();
        formData.append('public_id', customName + "." + extension);
    }

    try {
        const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_NAME}/image/upload`, {
            method: 'POST',
            body: formData
        });

        const data = await res.json();

        if (data.error) {
            throw new Error(data.error.message);
        }

        const popup = document.getElementById('popup');
        const popupText = document.getElementById('popupText');
        const copyButton = document.getElementById('copyButton');

        popupText.textContent = `URL da imagem: ${data.secure_url}`;
        popup.style.display = 'block';

        copyButton.onclick = () => {
            navigator.clipboard.writeText(data.secure_url).then(() => {
                copyButton.innerHTML = 'Copiado! <span class="checkmark">✔️</span>';
                copyButton.classList.add('copied');
                setTimeout(() => {
                    popup.style.display = 'none';
                    copyButton.innerHTML = 'Copiar Link';
                    copyButton.classList.remove('copied');
                }, 1500);
            });
        };

    } catch (err) {
        messageEl.textContent = 'Erro ao enviar imagem: ' + err.message;
    } finally {
        uploadButton.disabled = false;
        uploadButton.textContent = 'Enviar Imagem';
    }
});

async function fetchLogo() {
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
                    break

                case 'Whatsapp':
                    if (!!content) {
                        const whatsappButton = document.getElementById('whatsapp-button');

                        const whatsappNumber = document.getElementById('whatsapp-number');
                        whatsappNumber.href = `https://wa.me/55${content}`; // Número do WhatsApp

                        whatsappNumber.classList.remove('disabled');
                        whatsappButton.classList.remove('disabled');
                        whatsappButton.classList.add('whatsapp-button');
                    }
                    break
            }

        });

    } catch (error) {
        console.error(error);
    }
}
fetchLogo();