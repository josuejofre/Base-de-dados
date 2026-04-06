document.addEventListener('DOMContentLoaded', async () => {
    const cardsContainer = document.getElementById('cards-container');
    const listaTrilhasDiv = document.getElementById('lista-trilhas');
    const detalheTrilhaDiv = document.getElementById('detalhe-trilha');
    const timelineSteps = document.getElementById('timeline-steps');
    const btnVoltar = document.getElementById('btn-voltar-trilhas');

    const tituloTrilha = document.getElementById('titulo-trilha-ativa');
    const descTrilha = document.getElementById('desc-trilha-ativa');
    const langBtns = document.querySelectorAll('.lang-btn');

    let currentLang = localStorage.getItem('preferredLang') || 'pt-br';
    let translations = {};
    let trilhasData = [];

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
        loadTrilhas(); // Recarrega os dados no novo idioma
    }

    langBtns.forEach(btn => {
        btn.addEventListener('click', () => changeLanguage(btn.getAttribute('data-lang')));
    });

    // Carregar dados das trilhas
    async function loadTrilhas() {
        try {
            const fileName = currentLang === 'pt-br' ? 'trilhas.json' : `trilhas_${currentLang}.json`;
            const response = await fetch(fileName + '?t=' + new Date().getTime());
            if (!response.ok) {
                console.warn(`Arquivo não encontrado: ${fileName}, tentando padrão PT-BR`);
                const fallbackResponse = await fetch('trilhas.json?t=' + new Date().getTime());
                if (!fallbackResponse.ok) throw new Error('Erro ao carregar trilhas.json');
                trilhasData = await fallbackResponse.json();
            } else {
                trilhasData = await response.json();
            }
            renderTrilhasList();
        } catch (error) {
            console.error(error);
            cardsContainer.innerHTML = '<p>Erro ao carregar as trilhas.</p>';
        }
    }

    // Renderizar a lista de cards
    function renderTrilhasList() {
        cardsContainer.innerHTML = '';
        trilhasData.forEach((trilha, index) => {
            const card = document.createElement('div');
            card.className = 'card-trilha';
            // Animação escalonada
            card.style.animation = 'slide-up 0.7s ease-out forwards';
            card.style.animationDelay = `${index * 0.1}s`;
            card.style.opacity = '0';

            card.innerHTML = `
                <h3>${trilha.titulo}</h3>
                <p style="color: var(--text-secondary); font-size: 0.9rem;">${trilha.descricao}</p>
                <div style="margin-top: 1rem; color: var(--primary-accent); font-size: 0.8rem; font-weight: 600;">
                    ⚡ ${trilha.passos.length} ${translations[currentLang]?.total_itinerario || 'Etapas de Aprendizado'}
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
        trilha.passos.sort((a, b) => a.ordem - b.ordem).forEach((passo, index) => {
            const stepDiv = document.createElement('div');
            stepDiv.className = 'timeline-item';
            // Animação escalonada para os passos
            stepDiv.style.animation = 'slide-up 0.6s ease-out forwards';
            stepDiv.style.animationDelay = `${index * 0.1}s`;
            stepDiv.style.opacity = '0';

            stepDiv.innerHTML = `
                <div class="timeline-marker">${passo.ordem}</div>
                <div class="timeline-content">
                    <h4>${passo.titulo}</h4>
                    <p style="color: var(--text-secondary); margin-bottom: 0.8rem;">${passo.descricao}</p>
                    <a href="detalhe.html?subject=${passo.item_arquivo}&name=${encodeURIComponent(passo.item_nome)}" target="_blank" class="btn-acessar-item">
                        ${translations[currentLang]?.saiba_mais || 'Acessar Conteúdo'}: ${passo.item_nome}
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

    // Inicialização
    loadTranslations();
    loadTrilhas();
});
