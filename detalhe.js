document.addEventListener('DOMContentLoaded', () => {
    const mainContainer = document.getElementById('detalhe-main');

    // Mapeia os valores do select para os nomes dos arquivos JSON.
    const subjectFiles = {
        'techniques': 'techniques.json',
        'gestao_pessoas': 'gestao_pessoas.json',
        'gestao_times': 'gestao_times.json',
        'ferramentas_ia': 'ferramentas_ia.json',
        'metodologias_ageis': 'metodologias_ageis.json',
        'design_produto': 'design_produto.json',
        'metricas_indicadores': 'metricas_indicadores.json',
        'gestao_sistemas': 'gestao_sistemas.json',
    };

    // Pega os parâmetros da URL.
    const params = new URLSearchParams(window.location.search);
    const subjectKey = params.get('subject'); // Ex: 'techniques'
    const itemName = params.get('name'); // Ex: 'Análise SWOT'

    const subjectFile = subjectFiles[subjectKey];

    if (!subjectFile || !itemName) {
        mainContainer.innerHTML = '<p>Informações não encontradas. Por favor, volte para a página inicial.</p>';
        return;
    }

    // Função para carregar os dados e encontrar o item específico.
    async function loadItemDetails() {
        try {
            const response = await fetch(subjectFile);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const items = await response.json();

            // Encontra o item pelo nome.
            const item = items.find(i => i.nome === itemName);

            if (item) {
                displayItemDetails(item);
            } else {
                mainContainer.innerHTML = '<p>Item não encontrado.</p>';
            }

        } catch (error) {
            console.error("Erro ao carregar detalhes do item:", error);
            mainContainer.innerHTML = "<p>Erro ao carregar os dados. Tente novamente mais tarde.</p>";
        }
    }

    // Função para exibir os detalhes na página.
    function displayItemDetails(item) {
        document.title = item.nome; // Atualiza o título da aba do navegador.

        const imageHtml = item.imagem ? `<img src="${item.imagem}" alt="Imagem de ${item.nome}" style="max-width: 100%; border-radius: 0.5rem; margin-bottom: 1rem;">` : '';

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
        const videoHtml = item.video ? `
            <div class="media-container">
                <h3>▶️ Vídeo Explicativo</h3>
                <video controls>
                    <source src="${item.video}" type="video/mp4">
                    Seu navegador não suporta o elemento de vídeo.
                </video>
            </div>` : '';

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
                <div class="detalhe-container">
                    ${imageHtml}
                    ${audioHtml}
                    ${videoHtml}
                    ${htmlContent}
                    <p style="margin-top: 2rem; border-top: 1px solid #3c4043; padding-top: 1rem;">Para mais informações, acesse o <a href="${item.link}" target="_blank">link original</a>.</p>
                </div>
            </div>
        `;
    }

    loadItemDetails();
});