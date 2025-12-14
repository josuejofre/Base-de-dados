document.addEventListener('DOMContentLoaded', async () => {
    const container = document.getElementById('grafo-container');
    const loadingMsg = document.getElementById('loading-msg');

    // Mapeamento dos arquivos (Mesmo do script.js, idealmente seria centralizado)
    const subjectFiles = {
        'techniques': 'Análise de Negócios',
        'gestao_pessoas': 'Gestão de Pessoas',
        'gestao_times': 'Gestão de Times',
        'ferramentas_ia': 'Ferramentas de IA',
        'metodologias_ageis': 'Metodologias Ágeis',
        'design_produto': 'Design de Produto',
        'metricas_indicadores': 'Métricas',
        'gestao_sistemas': 'Gestão de Sistemas'
    };

    // Estrutura de dados para o grafo
    let nodes = [];
    let edges = [];
    let nodeIdCounter = 1;

    // Adiciona nó central
    const centralNodeId = 0;
    nodes.push({ id: centralNodeId, label: 'Base de\nConhecimento', color: '#ff5252', size: 40, font: { size: 20, color: '#ffffff' } });

    try {
        // Carrega TODOS os arquivos JSON em paralelo
        const promises = Object.entries(subjectFiles).map(async ([key, label]) => {
            try {
                const response = await fetch(`${key}.json?t=${new Date().getTime()}`);
                if (!response.ok) return null;
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
        const network = new vis.Network(container, data, options);

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
});
