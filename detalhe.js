document.addEventListener('DOMContentLoaded', async () => {
    const mainContainer = document.getElementById('detalhe-main');
    const langBtns = document.querySelectorAll('.lang-btn');

    let currentLang = localStorage.getItem('preferredLang') || 'pt-br';
    let translations = {};

    // Mapeia os valores do select para os nomes dos arquivos JSON.
    const subjectFiles = {
        'techniques': 'techniques',
        'gestao_pessoas': 'gestao_pessoas',
        'gestao_times': 'gestao_times',
        'ferramentas_ia': 'ferramentas_ia',
        'metodologias_ageis': 'metodologias_ageis',
        'design_produto': 'design_produto',
        'metricas_indicadores': 'metricas_indicadores',
        'gestao_sistemas': 'gestao_sistemas',
        'estudos_futuros': 'estudos_futuros',
    };

    // Pega os parâmetros da URL.
    const params = new URLSearchParams(window.location.search);
    const subjectKey = params.get('subject'); // Ex: 'techniques'
    const itemName = params.get('name'); // Legado: busca por nome
    const itemSlug = params.get('slug'); // Novo padrão: busca por slug 

    // --- Lógica de Tradução ---
    async function loadTranslations() {
        try {
            const response = await fetch('translations.json');
            translations = await response.json();
            applyTranslations();
        } catch (error) {
            console.error("Erro ao carregar traduções:", error);
        }
    }

    function applyTranslations() {
        const langData = translations[currentLang];
        if (!langData) return;

        document.querySelectorAll('[data-i18n]').forEach(el => {
            const key = el.getAttribute('data-i18n');
            const keys = key.split('.');
            let val = langData;
            keys.forEach(k => val = val?.[k]);
            if (val) el.textContent = val;
        });

        langBtns.forEach(btn => {
            btn.classList.toggle('active', btn.getAttribute('data-lang') === currentLang);
        });
    }

    function changeLanguage(lang) {
        if (lang === currentLang) return;
        currentLang = lang;
        localStorage.setItem('preferredLang', lang);
        // Ao mudar idioma na tela de detalhes, voltamos para a home no novo idioma
        // pois os nomes dos itens (usados na URL) mudam entre idiomas.
        window.location.href = `index.html`;
    }

    langBtns.forEach(btn => {
        btn.addEventListener('click', () => changeLanguage(btn.getAttribute('data-lang')));
    });

    const subjectBase = subjectFiles[subjectKey];

    if (!subjectBase || (!itemName && !itemSlug)) {
        mainContainer.innerHTML = '<p>Informações não encontradas. Por favor, volte para a página inicial.</p>';
        return;
    }

    // Função para carregar os dados e encontrar o item específico com suporte a fallback.
    async function loadItemDetails() {
        try {
            // Primeiro, carregamos a base em PT-BR para garantir que temos o item caso a tradução falte.
            const ptResponse = await fetch(`${subjectBase}.json?t=` + new Date().getTime());
            if (!ptResponse.ok) throw new Error(`Erro ao carregar base ${subjectBase}`);
            const ptItems = await ptResponse.json();

            let item = null;
            let isFallback = false;

            if (currentLang === 'pt-br') {
                // No idioma original, buscamos por slug ou nome (legado)
                item = ptItems.find(i => i.slug === itemSlug || i.nome === itemName);
            } else {
                // Em outro idioma, tentamos o arquivo traduzido
                const fileName = `${subjectBase}_${currentLang}.json`;
                try {
                    const response = await fetch(fileName + '?t=' + new Date().getTime());
                    if (response.ok) {
                        const langItems = await response.json();
                        item = langItems.find(i => i.slug === itemSlug || i.nome === itemName);
                    }
                } catch (e) {
                    console.warn(`Erro ao carregar tradução ${fileName}:`, e);
                }

                // Se não encontrou na tradução, usa o PT-BR como fallback
                if (!item) {
                    item = ptItems.find(i => i.slug === itemSlug || i.nome === itemName);
                    if (item) isFallback = true;
                }
            }

            if (item) {
                displayItemDetails(item, isFallback);
            } else {
                mainContainer.innerHTML = '<p>Item não encontrado.</p>';
            }

        } catch (error) {
            console.error("Erro ao carregar detalhes do item:", error);
            mainContainer.innerHTML = "<p>Erro ao carregar os dados. Tente novamente mais tarde.</p>";
        }
    }

    // Função para exibir os detalhes na página.
    function displayItemDetails(item, isFallback = false) {
        document.title = item.nome; // Atualiza o título da aba do navegador.

        const fallbackNotice = isFallback ? `
            <div class="fallback-notice">
                <span>🇧🇷</span> Esta página ainda não foi traduzida para o idioma selecionado. Exibindo versão original em Português.
            </div>
        ` : '';

        const imageHtml = item.imagem ? `
            <div style="text-align: center;"> <!-- Centraliza a imagem -->
                <a href="${item.imagem}?t=${new Date().getTime()}" target="_blank" title="Clique para ver a imagem original">
                    <img src="${item.imagem}?t=${new Date().getTime()}" alt="Imagem de ${item.nome}" style="max-width: 50%; border-radius: 0.5rem; margin-bottom: 1rem; cursor: pointer; transition: transform 0.2s;">
                </a>
            </div>` : '';

        // Gera HTML para Áudio
        const audioHtml = item.audio ? `
            <div class="media-container">
                <h3>🎧 Áudio Resumo (NotebookLM)</h3>
                <audio controls>
                    <source src="${item.audio}" type="audio/mpeg">
                    Seu navegador não suporta o elemento de áudio.
                </audio>
            </div>` : '';

        // Gera HTML para Vídeo
        // Gera HTML para Vídeo (Suporta YouTube e Local)
        let videoHtml = '';
        if (item.video) {
            if (item.video.includes('youtube.com') || item.video.includes('youtu.be')) {
                // Extrai o ID do vídeo do YouTube
                let videoId = '';
                if (item.video.includes('youtube.com/watch?v=')) {
                    videoId = item.video.split('v=')[1].split('&')[0];
                } else if (item.video.includes('youtu.be/')) {
                    videoId = item.video.split('youtu.be/')[1];
                }

                if (videoId) {
                    videoHtml = `
                        <div class="media-container">
                            <h3>▶️ Vídeo Explicativo</h3>
                            <div style="position: relative; padding-bottom: 56.25%; height: 0; overflow: hidden; max-width: 100%; border-radius: 0.5rem;">
                                <iframe src="https://www.youtube.com/embed/${videoId}" 
                                    style="position: absolute; top: 0; left: 0; width: 100%; height: 100%;" 
                                    frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                                    allowfullscreen>
                                </iframe>
                            </div>
                        </div>`;
                }
            } else {
                // Vídeo Local
                videoHtml = `
                    <div class="media-container">
                        <h3>▶️ Vídeo Explicativo</h3>
                        <video controls style="width: 100%; border-radius: 0.5rem;">
                            <source src="${item.video}" type="video/mp4">
                            Seu navegador não suporta o elemento de vídeo.
                        </video>
                    </div>`;
            }
        }

        // Constrói o conteúdo em Markdown.
        const markdownContent = item.detalhes_markdown || `
# ${item.nome}

## Descrição
${item.descricao}

## Quando usar
${item.quando_usar}

---

### Exemplo Prático (Ilustrativo)

Imagine que você está iniciando um novo projeto. Usando **${item.nome}**, você poderia:

*   **Passo 1:** [Detalhe do passo 1 para ${item.nome}]
*   **Passo 2:** [Detalhe do passo 2 para ${item.nome}]
*   **Passo 3:** [Detalhe do passo 3 para ${item.nome}]

Este é um exemplo genérico. Para um uso real, consulte a documentação oficial.
`;

        // Converte o Markdown para HTML usando marked.js
        const htmlContent = marked.parse(markdownContent);

        mainContainer.innerHTML = `
            <div class="detalhe-wrapper">
                ${fallbackNotice}
                <div class="detalhe-container">
                    ${imageHtml}
                    ${audioHtml}
                    ${htmlContent}
                    ${videoHtml}
                    <p style="margin-top: 2rem; border-top: 1px solid #3c4043; padding-top: 1rem;">Para mais informações, acesse o <a href="${item.link}" target="_blank">link original</a>.</p>
                </div>
            </div>
        `;
    }

    loadTranslations();
    loadItemDetails();
});