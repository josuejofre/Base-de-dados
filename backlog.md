# 📝 Backlog de Evolução: Projeto Base de Conhecimento

Este documento centraliza as ideias e melhorias para levar este projeto a um nível profissional de portfólio (Recruiter-Ready).

## 🚀 Funcionalidades de Alto Impacto

### 1. 🧠 Mentor de IA Local (On-Device AI)
**Objetivo:** Permitir que o usuário tire dúvidas sobre as técnicas usando uma IA que entenda o conteúdo da base.
*   **Abordagem Sugerida:** Usar **Transformers.js** ou **WebLLM** para rodar modelos pequenos (ex: Phi-3, Gemma 2B) diretamente no navegador do usuário.
*   **Vantagem:** Custo ZERO de servidor, privacidade total (os dados não saem do PC do usuário) e funciona offline.
*   **Recrutador vê:** Domínio de Edge AI, otimização de custos e inovação técnica.

### 2. 🕸️ Grafo de Conexões Sistêmicas
**Objetivo:** Evoluir o grafo simples para um mapa que mostre como as ferramentas se conectam.
*   **Detalhe:** Se o usuário clicar em "SWOT", o grafo destaca outras ferramentas de estratégia ou análise.
*   **Recrutador vê:** Capacidade de visualização de dados e pensamento sistêmico.

### 3. 🎨 Design System Premium (Visual "Wow")
**Objetivo:** Aplicar uma estética moderna e polida.
*   **Melhorias:** Glassmorphism (efeito de vidro fosco), tipografia refinada (Inter ou Outfit), suporte nativo a Dark/Light Mode e micro-animações (Framer Motion ou GSAP).
*   **Recrutador vê:** Cuidado com UX/UI e atenção aos detalhes de interface.

### 4. 📊 Diagramas Interativos (Mermaid.js)
**Objetivo:** Renderizar fluxogramas e roteiros dinamicamente a partir do texto no JSON.
*   **Detalhe:** Em vez de imagens estáticas, usar código Mermaid para gerar diagramas que o usuário pode interagir ou baixar.
*   **Recrutador vê:** Integração de bibliotecas de terceiros e utilidade prática da ferramenta.

---

## 🛠️ Melhorias Técnicas (Under the Hood)

- [ ] **PWA (Progressive Web App):** Transformar em um app instalável que funciona 100% offline.
- [ ] **Busca Semântica:** Usar embeddings (via Transformers.js) para que a busca funcione por "significado" e não apenas por palavras exatas.
- [ ] **Testes Automatizados:** Adicionar testes de unidade e E2E (Cypress ou Playwright) para garantir que a carga dos JSONs nunca quebre.
- [ ] **CI/CD:** Configurar GitHub Actions para deploy automático e verificação de linting.

---

## 💡 Notas sobre IA Local e Custos

> [!TIP]
> Atualmente, é totalmente possível rodar IA "pesada" direto no Chrome usando a nova API `window.ai` (Gemini Nano) ou bibliotecas como Transformers.js. 
> 
> **Vantagens de IA embarcada (Offline):**
> 1. **Custo:** $0. Não há consumo de tokens em nuvem.
> 2. **Performance:** Resposta instantânea após o carregamento do modelo.
> 3. **Privacidade:** Essencial para bases de conhecimento corporativas.
