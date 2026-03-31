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
        'estudos_futuros': 'estudos_futuros.json',
    };

    // Função assíncrona para carregar todos os dados de todos os arquivos JSON.
    async function loadData() {
        try {
            displaySkeletonLoader(5); // Exibe 5 cards de esqueleto.
            categoryFiltersContainer.innerHTML = ''; // Limpa os filtros de categoria antigos.
            
            // Cria um array de promessas para carregar todos os assuntos simultaneamente.
            const fetchPromises = Object.entries(subjectFiles).map(async ([key, fileName]) => {
                const response = await fetch(fileName + '?t=' + new Date().getTime());
                if (!response.ok) throw new Error(`Erro ao carregar ${fileName}`);
                const data = await response.json();
                // Adiciona a propriedade 'subject' em cada item para sabermos de onde ele veio.
                return data.map(item => ({ ...item, subject: key }));
            });

            // Aguarda a conclusão de todas as requisições.
            const results = await Promise.all(fetchPromises);
            // Achata o array de arrays em um único array global.
            allTechniques = results.flat();

            setupCategoryFilters(); // Configura os botões de filtro de categoria.
            applyFilters(); // Aplica os filtros iniciais.
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
            resultsContainer.innerHTML = '<p style="text-align: center; grid-column: 1/-1; padding: 3rem; color: var(--text-muted);">Nenhuma técnica encontrada no momento.</p>';
            return;
        }

        // Função auxiliar para destacar o termo de busca no texto.
        const highlightText = (text, term) => {
            if (!term.trim()) return text; // Se não houver termo de busca, retorna o texto original.
            const regex = new RegExp(`(${term})`, 'gi');
            return text.replace(regex, '<mark>$1</mark>');
        };

        // Para cada técnica, cria um elemento <article> e o preenche com os dados.
        techniques.forEach((tech, index) => {
            const article = document.createElement('article');
            // Animação escalonada sofisticada
            article.style.animationDelay = `${index * 0.08}s`;

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
                <div class="quando-usar">
                    <strong>📍 Quando usar:</strong> ${tech.quando_usar}
                </div>
                <div class="card-footer">
                    <span>📂 ${subjectSelect.querySelector(`option[value="${tech.subject}"]`).textContent}</span>
                    <span>Saiba mais →</span>
                </div>
            `;

            // Adiciona evento ao botão de favorito
            const favBtn = article.querySelector('.btn-favorito');
            favBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                toggleFavorite(tech.nome, favBtn);
            });

            // Usa o subject do item para o link, não o selecionado no dropdown global
            const detailUrl = `detalhe.html?subject=${tech.subject}&name=${encodeURIComponent(tech.nome)}`;
            article.addEventListener('click', () => {
                window.open(detailUrl, '_blank');
            });

            resultsContainer.appendChild(article);
        });
    }

    // Função para configurar e criar os botões de filtro de categoria.
    function setupCategoryFilters() {
        const searchTerm = searchInput.value.trim();
        
        // Determina o pool de itens para calcular as categorias:
        // Se houver busca, considera todos. Se não, apenas o assunto selecionado.
        const pool = searchTerm !== '' 
            ? allTechniques 
            : allTechniques.filter(tech => tech.subject === subjectSelect.value);

        const categoryCounts = pool.reduce((acc, tech) => {
            (tech.categorias || []).forEach(category => {
                acc[category] = (acc[category] || 0) + 1;
            });
            return acc;
        }, {});

        const categories = ['Todos', ...new Set(pool.flatMap(tech => tech.categorias || []))];

        categoryFiltersContainer.innerHTML = '';

        categories.forEach(category => {
            const button = document.createElement('button');
            button.className = 'filtro-btn';
            const count = category === 'Todos' ? pool.length : (categoryCounts[category] || 0);
            button.textContent = `${category} (${count})`;

            if (category === activeCategory) {
                button.classList.add('active');
            }

            button.addEventListener('click', () => {
                activeCategory = category;
                document.querySelectorAll('.filtro-btn').forEach(btn => btn.classList.remove('active'));
                button.classList.add('active');
                applyFilters();
            });
            categoryFiltersContainer.appendChild(button);
        });
    }

    // Função principal que aplica tanto o filtro de categoria quanto o de busca.
    function applyFilters() {
        const searchTerm = searchInput.value.toLowerCase().trim();
        const selectedSubject = subjectSelect.value;
        
        let filtered;
        
        // Se houver termo de busca, pesquisa em TODOS os itens (Global Search)
        if (searchTerm !== '') {
            filtered = allTechniques.filter(tech =>
                tech.nome.toLowerCase().includes(searchTerm) ||
                tech.descricao.toLowerCase().includes(searchTerm)
            );
            // Se houver busca global, também filtramos pela categoria se não for "Todos"
            if (activeCategory !== 'Todos') {
                filtered = filtered.filter(tech => tech.categorias?.includes(activeCategory));
            }
        } 
        // Se NÃO houver busca, filtra pelo Assunto selecionado
        else {
            filtered = allTechniques.filter(tech => tech.subject === selectedSubject);
            if (activeCategory !== 'Todos') {
                filtered = filtered.filter(tech => tech.categorias?.includes(activeCategory));
            }
        }

        displayTechniques(filtered, searchTerm);
    }

    // Listeners
    searchInput.addEventListener('input', () => {
        activeCategory = 'Todos'; // Reseta categoria ao começar nova busca
        setupCategoryFilters();
        applyFilters();
    });

    subjectSelect.addEventListener('change', () => {
        activeCategory = 'Todos'; // Reseta categoria ao mudar assunto
        setupCategoryFilters();
        applyFilters();
    });

    // Inicialização
    loadData();
});