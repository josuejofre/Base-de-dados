document.addEventListener('DOMContentLoaded', async () => {
    const container = document.getElementById('grafo-container');
    const loadingMsg = document.getElementById('loading-msg');
    const langBtns = document.querySelectorAll('.lang-btn');

    let currentLang = localStorage.getItem('preferredLang') || 'pt-br';
    let translations = {};

    // Mapeamento dos arquivos
    const subjectFiles = {
        'techniques': 'techniques',
        'gestao_pessoas': 'gestao_pessoas',
        'gestao_times': 'gestao_times',
        'ferramentas_ia': 'ferramentas_ia',
        'metodologias_ageis': 'metodologias_ageis',
        'design_produto': 'design_produto',
        'metricas_indicadores': 'metricas_indicadores',
        'gestao_sistemas': 'gestao_sistemas',
        'estudos_futuros': 'estudos_futuros'
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
        applyTranslations();
        initGrafo(); // Recria o grafo no novo idioma
    }

    langBtns.forEach(btn => {
        btn.addEventListener('click', () => changeLanguage(btn.getAttribute('data-lang')));
    });

    // Estrutura de dados para o grafo
    let nodes = [];
    let edges = [];
    let nodeIdCounter = 1;
    let network = null;

    async function initGrafo() {
        nodes = [];
        edges = [];
        nodeIdCounter = 1;
        if (network) network.destroy();

        loadingMsg.style.display = 'block';
        container.innerHTML = '';

        // Adiciona nó central
        const centralNodeId = 0;
        const mainLabel = translations[currentLang]?.title || 'Base de\nConhecimento';
        nodes.push({ id: centralNodeId, label: mainLabel, color: '#ff5252', size: 40, font: { size: 20, color: '#ffffff' } });

        try {
            // Carrega TODOS os arquivos JSON em paralelo
            const promises = Object.entries(subjectFiles).map(async ([key, baseName]) => {
                const label = translations[currentLang]?.subjects?.[key] || key;
                try {
                    const fileName = currentLang === 'pt-br' ? `${key}.json` : `${key}_${currentLang}.json`;
                    const response = await fetch(`${fileName}?t=${new Date().getTime()}`);
                    if (!response.ok) {
                        // Fallback para PT-BR se tradução não existir
                        const fallbackResponse = await fetch(`${key}.json?t=${new Date().getTime()}`);
                        if (!fallbackResponse.ok) return null;
                        const data = await fallbackResponse.json();
                        return { key, label, data };
                    }
                    const data = await response.json();
                    return { key, label, data };
                } catch (e) {
                    console.warn(`Erro ao carregar ${key}`, e);
                    return null;
                }
            });

            const results = await Promise.all(promises);

        results.forEach(result => {
            if (!result) return;

            // Cria nó da Categoria (Ex: Gestão de Pessoas)
            const categoryNodeId = nodeIdCounter++;
            nodes.push({
                id: categoryNodeId,
                label: result.label,
                color: '#4285f4', // Azul do Google 
                size: 30
            });

            // Conecta Categoria ao Centro
            edges.push({ from: centralNodeId, to: categoryNodeId });

            // Cria nós dos Itens (Ex: SWOT)
            result.data.forEach(item => {
                const itemNodeId = nodeIdCounter++;
                nodes.push({
                    id: itemNodeId,
                    label: item.nome,
                    color: '#34a853', // Verde
                    shape: 'dot',
                    size: 15,
                    // Guarda metadados para abrir o detalhe depois
                    data_link: `detalhe.html?subject=${result.key}&name=${encodeURIComponent(item.nome)}`
                });

                // Conecta Item à Categoria
                edges.push({ from: categoryNodeId, to: itemNodeId });
            });
        });

        // Configuração do vis.js
        const data = {
            nodes: new vis.DataSet(nodes),
            edges: new vis.DataSet(edges)
        };

        const options = {
            nodes: {
                borderWidth: 0,
                shadow: true,
                font: { color: '#e8eaed' }
            },
            edges: {
                width: 1,
                color: { inherit: 'from', opacity: 0.6 },
                smooth: {
                    type: 'continuous'
                }
            },
            physics: {
                stabilization: false,
                barnesHut: {
                    gravitationalConstant: -8000,
                    springConstant: 0.04,
                    springLength: 95
                }
            },
            interaction: {
                hover: true,
                tooltipDelay: 200
            }
        };

            // Inicializa o grafo
            loadingMsg.style.display = 'none';
            network = new vis.Network(container, data, options);

        // Evento de duplo clique para abrir detalhes
        network.on("doubleClick", function (params) {
            if (params.nodes.length > 0) {
                const nodeId = params.nodes[0];
                const clickedNode = nodes.find(n => n.id === nodeId);

                if (clickedNode && clickedNode.data_link) {
                    window.location.href = clickedNode.data_link;
                }
            }
        });

        } catch (error) {
            console.error("Erro geral no grafo:", error);
            loadingMsg.innerHTML = "Erro ao carregar o grafo. Verifique o console.";
        }
    }

    // Inicialização
    loadTranslations();
    initGrafo();
});
