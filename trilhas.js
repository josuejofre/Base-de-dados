document.addEventListener('DOMContentLoaded', async () => {
    const cardsContainer = document.getElementById('cards-container');
    const listaTrilhasDiv = document.getElementById('lista-trilhas');
    const detalheTrilhaDiv = document.getElementById('detalhe-trilha');
    const timelineSteps = document.getElementById('timeline-steps');
    const btnVoltar = document.getElementById('btn-voltar-trilhas');

    const tituloTrilha = document.getElementById('titulo-trilha-ativa');
    const descTrilha = document.getElementById('desc-trilha-ativa');

    let trilhasData = [];

    // Carregar dados das trilhas
    try {
        const response = await fetch('trilhas.json?t=' + new Date().getTime());
        if (!response.ok) throw new Error('Erro ao carregar trilhas.json');
        trilhasData = await response.json();
        renderTrilhasList();
    } catch (error) {
        console.error(error);
        cardsContainer.innerHTML = '<p>Erro ao carregar as trilhas.</p>';
    }

    // Renderizar a lista de cards
    function renderTrilhasList() {
        cardsContainer.innerHTML = '';
        trilhasData.forEach(trilha => {
            const card = document.createElement('div');
            card.className = 'card-trilha';
            card.innerHTML = `
                <h3>${trilha.titulo}</h3>
                <p style="color: #a0a0a0; font-size: 0.9rem;">${trilha.descricao}</p>
                <div style="margin-top: 1rem; color: var(--primary-color); font-size: 0.8rem; font-weight: 500;">
                    ${trilha.passos.length} Passos
                </div>
            `;
            card.addEventListener('click', () => showTrilhaDetalhes(trilha));
            cardsContainer.appendChild(card);
        });
    }

    // Exibir detalhes de uma trilha (Timeline)
    function showTrilhaDetalhes(trilha) {
        // Atualiza cabeçalho
        tituloTrilha.textContent = trilha.titulo;
        descTrilha.textContent = trilha.descricao;

        // Limpa e popula timeline
        timelineSteps.innerHTML = '';
        trilha.passos.sort((a, b) => a.ordem - b.ordem).forEach(passo => {
            const stepDiv = document.createElement('div');
            stepDiv.className = 'timeline-item';

            stepDiv.innerHTML = `
                <div class="timeline-marker">${passo.ordem}</div>
                <div class="timeline-content">
                    <h4>${passo.titulo}</h4>
                    <p style="color: #ccc; margin-bottom: 0.5rem;">${passo.descricao}</p>
                    <a href="detalhe.html?subject=${passo.item_arquivo}&name=${encodeURIComponent(passo.item_nome)}" target="_blank" class="btn-acessar-item">
                        Acessar Conteúdo: ${passo.item_nome}
                    </a>
                </div>
            `;
            timelineSteps.appendChild(stepDiv);
        });

        // Troca a visualização com animação simples
        listaTrilhasDiv.style.display = 'none';
        detalheTrilhaDiv.classList.add('active');
    }

    // Botão Voltar
    btnVoltar.addEventListener('click', () => {
        detalheTrilhaDiv.classList.remove('active');
        listaTrilhasDiv.style.display = 'block';
    });
});
