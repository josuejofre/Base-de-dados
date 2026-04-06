import { loadAIModel, generateAllEmbeddings, semanticSearch } from './ai_search.js';

// Aguarda o conteúdo do DOM ser totalmente carregado antes de executar o script.
document.addEventListener('DOMContentLoaded', async () => {
    // Seleciona os elementos do DOM com os quais vamos interagir.
    const searchInput = document.getElementById('caixa-busca');
    const resultsContainer = document.getElementById('resultados');
    const categoryFiltersContainer = document.getElementById('filtros-categoria');
    const subjectSelect = document.getElementById('assunto-select');

    const filtersWrapper = document.querySelector('.filtros-wrapper');
    const btnToggleFiltros = document.getElementById('btn-toggle-filtros');
    const langBtns = document.querySelectorAll('.lang-btn');

    let currentLang = localStorage.getItem('preferredLang') || 'pt-br';
    let translations = {};

    // --- Lógica de Expandir/Retrair Filtros ---
    if (btnToggleFiltros) {
        btnToggleFiltros.addEventListener('click', () => {
            const isCollapsed = categoryFiltersContainer.classList.contains('collapsed');
            
            if (isCollapsed) {
                categoryFiltersContainer.classList.remove('collapsed');
                categoryFiltersContainer.classList.add('expanded');
                btnToggleFiltros.textContent = 'Ver menos filtros ▴';
            } else {
                categoryFiltersContainer.classList.remove('expanded');
                categoryFiltersContainer.classList.add('collapsed');
                btnToggleFiltros.textContent = 'Ver todos os filtros ▾';
            }
        });
    }

    // Elementos de Controle de IA
    const btnActivateAI = document.getElementById('btn-activate-ai');
    const aiLoadingContainer = document.getElementById('ai-loading-container');
    const aiProgressBar = document.getElementById('ai-progress-bar');
    const aiStatusText = document.getElementById('ai-status');

    let allTechniques = []; // Todas as técnicas carregadas de todos os JSONs.
    // Variável para rastrear a categoria atualmente selecionada.
    let activeCategory = 'Todos';
    let isAIActive = false;
    let isAILoading = false;

    // Mapeia os valores do select para os nomes dos arquivos JSON.
    const subjectFiles = {
        'techniques': 'techniques',
        'gestao_pessoas': 'gestao_pessoas',
        'gestao_times': 'gestao_times',
        'ferramentas_ia': 'ferramentas_ia',
        'gestao_sistemas': 'gestao_sistemas',
        'metodologias_ageis': 'metodologias_ageis',
        'design_produto': 'design_produto',
        'metricas_indicadores': 'metricas_indicadores',
        'estudos_futuros': 'estudos_futuros',
    };

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

        // Traduz textos simples
        document.querySelectorAll('[data-i18n]').forEach(el => {
            const key = el.getAttribute('data-i18n');
            const keys = key.split('.');
            let val = langData;
            keys.forEach(k => val = val?.[k]);
            if (val) el.textContent = val;
        });

        // Traduz placeholders
        document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
            const key = el.getAttribute('data-i18n-placeholder');
            if (langData[key]) el.placeholder = langData[key];
        });

        // Atualiza botões de idioma
        langBtns.forEach(btn => {
            btn.classList.toggle('active', btn.getAttribute('data-lang') === currentLang);
        });
    }

    function changeLanguage(lang) {
        if (lang === currentLang) return;
        currentLang = lang;
        localStorage.setItem('preferredLang', lang);
        applyTranslations();
        loadData(); // Recarrega os dados no novo idioma
    }

    langBtns.forEach(btn => {
        btn.addEventListener('click', () => changeLanguage(btn.getAttribute('data-lang')));
    });

    // Função assíncrona para carregar todos os dados de todos os arquivos JSON.
    async function loadData() {
        try {
            displaySkeletonLoader(5); // Exibe 5 cards de esqueleto.
            categoryFiltersContainer.innerHTML = ''; // Limpa os filtros de categoria antigos.
            
            // Cria um array de promessas para carregar todos os assuntos simultaneamente.
            const fetchPromises = Object.entries(subjectFiles).map(async ([key, baseName]) => {
                // Sempre carrega a base em PT-BR primeiro como referência
                const ptResponse = await fetch(`${baseName}.json?t=${new Date().getTime()}`);
                if (!ptResponse.ok) throw new Error(`Erro ao carregar base ${baseName}`);
                const ptData = await ptResponse.json();
                
                // Mapeia os itens base, marcando-os como fallback inicialmente se o idioma não for PT
                const baseItemsArray = ptData.map(item => ({ 
                    ...item, 
                    subject: key, 
                    isFallback: currentLang !== 'pt-br' 
                }));

                if (currentLang === 'pt-br') {
                    return baseItemsArray;
                }

                // Tenta carregar a tradução correspondente
                const fileName = `${baseName}_${currentLang}.json`;
                try {
                    const response = await fetch(fileName + '?t=' + new Date().getTime());
                    if (!response.ok) {
                        console.warn(`Arquivo de tradução não encontrado: ${fileName}`);
                        return baseItemsArray;
                    }
                    const langData = await response.json();
                    
                    // Realiza o merge: substitui itens da base pelos traduzidos onde o slug coincide
                    return baseItemsArray.map(ptItem => {
                        const translated = langData.find(t => t.slug === ptItem.slug);
                        if (translated) {
                            return { ...translated, subject: key, isFallback: false };
                        }
                        return ptItem;
                    });
                } catch (e) {
                    console.warn(`Erro ao processar tradução ${fileName}:`, e);
                    return baseItemsArray;
                }
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

    // --- Lógica de Ativação da IA ---
    if (btnActivateAI) {
        btnActivateAI.addEventListener('click', async () => {
            if (isAILoading || isAIActive) return;

            isAILoading = true;
            btnActivateAI.classList.add('loading');
            if (aiLoadingContainer) aiLoadingContainer.style.display = 'flex';

            try {
                // 1. Carrega o Modelo
                await loadAIModel((progress) => {
                    if (aiProgressBar) aiProgressBar.style.width = `${progress}%`;
                    if (aiStatusText) aiStatusText.textContent = `Baixando IA: ${Math.round(progress)}%`;
                });

                if (aiStatusText) aiStatusText.textContent = 'Indexando Base de Conhecimento...';
                // 2. Gera Embeddings
                await generateAllEmbeddings(allTechniques);

                isAIActive = true;
                if (aiLoadingContainer) aiLoadingContainer.innerHTML = '<span style="color: #4ade80; font-size: 0.8rem; font-weight: 600;">✨ IA Ativa</span>';
                
                // Re-aplica filtros para mostrar poder da IA imediatamente se houver busca
                applyFilters();
            } catch (error) {
                if (aiStatusText) {
                    aiStatusText.textContent = 'Erro ao carregar IA.';
                    aiStatusText.style.color = '#ef4444';
                }
                btnActivateAI.classList.remove('loading');
            } finally {
                isAILoading = false;
            }
        });
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
                ${tech.aiScore ? `<div class="ai-badge">✨ IA Score: ${Math.round(tech.aiScore * 100)}%</div>` : ''}
                ${tech.isFallback ? `<div class="fallback-badge" title="Original em Português">🇧🇷 PT-BR</div>` : ''}
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
                    <span>📂 ${translations[currentLang]?.subjects?.[tech.subject] || tech.subject}</span>
                    <span>${translations[currentLang]?.saiba_mais || 'Saiba mais →'}</span>
                </div>
            `;

            // Adiciona evento ao botão de favorito
            const favBtn = article.querySelector('.btn-favorito');
            favBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                toggleFavorite(tech.nome, favBtn);
            });

            // Usa o slug para o link, garantindo persistência entre idiomas
            const detailUrl = `detalhe.html?subject=${tech.subject}&slug=${tech.slug}`;
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
    async function applyFilters() {
        const searchTerm = searchInput.value.toLowerCase().trim();
        const selectedSubject = subjectSelect.value;
        
        let filtered = [];
        
        // Se houver termo de busca, pesquisa em TODOS os itens (Global Search)
        if (searchTerm !== '') {
            filtered = allTechniques.filter(tech =>
                tech.nome.toLowerCase().includes(searchTerm) ||
                tech.descricao.toLowerCase().includes(searchTerm) ||
                (tech.categorias && tech.categorias.some(cat => cat.toLowerCase().includes(searchTerm)))
            );

            // --- MELHORIA COM IA ---
            if (isAIActive && filtered.length < 5) {
                const semanticResults = await semanticSearch(searchTerm);
                
                // Mesclar resultados da IA que ainda não estão no filtro de texto
                semanticResults.forEach(aiRes => {
                    const alreadyFound = filtered.find(f => f.nome === aiRes.nome);
                    if (!alreadyFound) {
                        const originalTech = allTechniques.find(t => t.nome === aiRes.nome);
                        if (originalTech) {
                            filtered.push({ ...originalTech, aiScore: aiRes.score });
                        }
                    }
                });
            }

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
    loadTranslations();
    loadData();
});