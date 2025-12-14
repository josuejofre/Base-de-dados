// Aguarda o conteúdo do DOM ser totalmente carregado antes de executar o script.
document.addEventListener('DOMContentLoaded', () => {
    // Seleciona os elementos do DOM com os quais vamos interagir.
    const searchInput = document.getElementById('caixa-busca');
    const resultsContainer = document.getElementById('resultados');
    const categoryFiltersContainer = document.getElementById('filtros-categoria');
    const subjectSelect = document.getElementById('assunto-select');

    // Variável para armazenar todos os dados das técnicas carregadas do JSON.
    let allTechniques = [];
    // Variável para rastrear a categoria atualmente selecionada.
    let activeCategory = 'Todos';

    // Mapeia os valores do select para os nomes dos arquivos JSON.
    const subjectFiles = {
        'techniques': 'techniques.json',
        'gestao_pessoas': 'gestao_pessoas.json',
        'gestao_times': 'gestao_times.json',
        'ferramentas_ia': 'ferramentas_ia.json',
        'gestao_sistemas': 'gestao_sistemas.json',
        'metodologias_ageis': 'metodologias_ageis.json',
        'design_produto': 'design_produto.json',
        'metricas_indicadores': 'metricas_indicadores.json',
    };

    // Função assíncrona para carregar os dados do arquivo JSON.
    async function loadData(subjectFile) {
        try {
            displaySkeletonLoader(5); // Exibe 5 cards de esqueleto.
            categoryFiltersContainer.innerHTML = ''; // Limpa os filtros de categoria antigos.
            const response = await fetch(subjectFile); // Faz a requisição para o arquivo do assunto selecionado.
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            allTechniques = await response.json(); // Converte a resposta para JSON e armazena.
            setupCategoryFilters(); // Configura os botões de filtro de categoria.
            applyFilters(); // Aplica os filtros (inicialmente, mostra todos).
        } catch (error) {
            console.error("Não foi possível carregar as técnicas:", error);
            resultsContainer.innerHTML = "<p>Erro ao carregar os dados. Tente novamente mais tarde.</p>";
        }
    }

    // Função para exibir o efeito de carregamento (skeleton screen).
    function displaySkeletonLoader(count) {
        resultsContainer.innerHTML = ''; // Limpa a área de resultados.
        for (let i = 0; i < count; i++) {
            const article = document.createElement('article');
            article.className = 'skeleton';
            article.innerHTML = `
                <div class="conteudo-texto">
                    <div class="skeleton-line skeleton-title"></div>
                    <div class="skeleton-line skeleton-text"></div>
                    <div class="skeleton-line skeleton-text" style="width: 80%;"></div>
                    <div class="skeleton-line skeleton-text" style="width: 90%;"></div>
                </div>
                <div class="conteudo-imagem">
                    <div class="skeleton-line"></div>
                </div>
            `;
            resultsContainer.appendChild(article);
        }
    }

    // Variável para armazenar os IDs dos favoritos (usando o nome da técnica como ID único por enquanto).
    let favorites = JSON.parse(localStorage.getItem('favorites')) || [];

    // Função para salvar favoritos no localStorage
    function saveFavorites() {
        localStorage.setItem('favorites', JSON.stringify(favorites));
    }

    // Função para alternar o estado de favorito
    function toggleFavorite(techName, btnElement) {
        const index = favorites.indexOf(techName);
        if (index === -1) {
            favorites.push(techName);
            btnElement.classList.add('active');
        } else {
            favorites.splice(index, 1);
            btnElement.classList.remove('active');
        }
        saveFavorites();
    }

    // Função para renderizar e exibir as técnicas na página.
    function displayTechniques(techniques, searchTerm = '') {
        resultsContainer.innerHTML = ''; // Limpa os resultados anteriores.

        if (techniques.length === 0) {
            resultsContainer.innerHTML = '<p>Nenhuma técnica encontrada.</p>';
            return;
        }

        // Função auxiliar para destacar o termo de busca no texto.
        const highlightText = (text, term) => {
            if (!term.trim()) return text; // Se não houver termo de busca, retorna o texto original.
            // Cria uma expressão regular para encontrar o termo de forma global (g) e insensível a maiúsculas/minúsculas (i).
            const regex = new RegExp(`(${term})`, 'gi');
            // Substitui o termo encontrado pela tag <mark>, que destaca o texto, preservando a capitalização original.
            return text.replace(regex, '<mark>$1</mark>');
        };

        // Para cada técnica, cria um elemento <article> e o preenche com os dados.
        techniques.forEach((tech, index) => {
            const article = document.createElement('article');
            // Adiciona um delay escalonado para a animação de entrada
            article.style.animationDelay = `${index * 0.05}s`;

            const highlightedName = highlightText(tech.nome, searchTerm);
            const highlightedDesc = highlightText(tech.descricao, searchTerm);
            const isFavorite = favorites.includes(tech.nome);

            article.innerHTML = `
                <button class="btn-favorito ${isFavorite ? 'active' : ''}" title="Favoritar">
                    ★
                </button>
                <div class="card-header">
                    <h2>${highlightedName}</h2>
                </div>
                <p>${highlightedDesc}</p>
                <p><strong>Quando usar:</strong> ${tech.quando_usar}</p>
            `;

            // Adiciona evento ao botão de favorito
            const favBtn = article.querySelector('.btn-favorito');
            favBtn.addEventListener('click', (e) => {
                e.stopPropagation(); // Impede que o clique abra o detalhe do card
                toggleFavorite(tech.nome, favBtn);
            });

            // Adiciona um evento de clique ao card inteiro para abrir a página de detalhes.
            const detailUrl = `detalhe.html?subject=${subjectSelect.value}&name=${encodeURIComponent(tech.nome)}`;
            article.addEventListener('click', () => {
                window.open(detailUrl, '_blank');
            });

            resultsContainer.appendChild(article); // Adiciona o artigo ao contêiner de resultados.
        });
    }

    // Função para configurar e criar os botões de filtro de categoria.
    function setupCategoryFilters() {
        // 1. Calcula a contagem de itens para cada categoria.
        const categoryCounts = allTechniques.reduce((acc, tech) => {
            (tech.categorias || []).forEach(category => {
                acc[category] = (acc[category] || 0) + 1;
            });
            return acc;
        }, {});

        // Extrai todas as categorias únicas do array de técnicas.
        const categories = ['Todos', ...new Set(allTechniques.flatMap(tech => tech.categorias || []))];

        categoryFiltersContainer.innerHTML = ''; // Limpa filtros existentes.

        // 2. Cria os botões, adicionando a contagem ao texto.
        categories.forEach(category => {
            const button = document.createElement('button');
            button.className = 'filtro-btn';
            const count = category === 'Todos' ? allTechniques.length : (categoryCounts[category] || 0);
            button.textContent = `${category} (${count})`; // Ex: "Desenvolvimento (8)"

            if (category === activeCategory) {
                button.classList.add('active'); // Marca o botão "Todos" como ativo inicialmente.
            }

            // Adiciona um evento de clique para cada botão de categoria.
            button.addEventListener('click', () => {
                activeCategory = category; // Atualiza a categoria ativa.

                // Atualiza a classe 'active' para o botão clicado.
                document.querySelectorAll('.filtro-btn').forEach(btn => btn.classList.remove('active'));
                button.classList.add('active');

                applyFilters(); // Reaplica os filtros.
            });
            categoryFiltersContainer.appendChild(button);
        });
    }

    // Função principal que aplica tanto o filtro de categoria quanto o de busca.
    function applyFilters() {
        // 1. Filtra por categoria
        let filteredByCategory;
        if (activeCategory === 'Todos') {
            filteredByCategory = allTechniques; // Se "Todos", usa a lista completa.
        } else {
            // Filtra as técnicas que incluem a categoria ativa.
            filteredByCategory = allTechniques.filter(tech => tech.categorias?.includes(activeCategory));
        }

        // 2. Filtra pelo termo de busca dentro do resultado da categoria
        const searchTerm = searchInput.value.toLowerCase(); // Pega o valor do input e converte para minúsculas.
        const finalFiltered = filteredByCategory.filter(tech =>
            tech.nome.toLowerCase().includes(searchTerm) ||
            tech.descricao.toLowerCase().includes(searchTerm)
        );

        displayTechniques(finalFiltered, searchTerm); // Exibe o resultado final, passando o termo de busca.
    }

    // Adiciona um 'escutador' de eventos ao campo de busca para filtrar em tempo real.
    searchInput.addEventListener('input', applyFilters);

    // Adiciona um 'escutador' de eventos ao seletor de assunto.
    subjectSelect.addEventListener('change', (event) => {
        const selectedSubject = event.target.value;
        const fileName = subjectFiles[selectedSubject];
        loadData(fileName); // Carrega os dados do novo assunto.
    });

    // Carrega os dados assim que a página é aberta.
    loadData(subjectFiles[subjectSelect.value]);
});