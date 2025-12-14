# Base de Conhecimento: Gestão de Pessoas, Produtos e Sistemas

Este projeto é uma **Base de Conhecimento Interativa** desenvolvida para centralizar e facilitar o acesso a informações sobre técnicas de análise de negócios, gestão de pessoas, métricas, ferramentas de IA e muito mais. Ele funciona como uma aplicação web simples, onde os usuários podem buscar, filtrar e explorar conteúdos detalhados.

## 🎯 Para que serve este projeto?

O objetivo é fornecer uma interface amigável para:
*   **Consultar Técnicas e Ferramentas:** Cards informativos com descrições rápidas.
*   **Aprofundar Conhecimentos:** Páginas de detalhes com explicações completas, imagens, e links externos.
*   **Organização:** Conteúdo categorizado por assuntos (ex: Gestão de Pessoas, Métricas, IA).
*   **Interatividade:** Busca em tempo real, filtros por categoria e sistema de favoritos.

---

## 🚀 Como Instalar e Rodar Localmente

Este projeto é construído com **HTML, CSS e JavaScript puro (Vanilla)**, o que o torna muito leve e fácil de rodar. Você não precisa de instalações complexas como Node.js ou bancos de dados.

### Pré-requisitos
*   Um navegador web moderno (Chrome, Edge, Firefox).
*   **Python** instalado (para rodar um servidor local simples), OU uma extensão como "Live Server" no VS Code.

### Passo a Passo

1.  **Baixe ou Clone o repositório** para seu computador.
2.  Abra o terminal (Prompt de Comando ou PowerShell) na pasta do projeto:
    ```bash
    cd "caminho/para/a/pasta/do/projeto"
    ```
3.  **Inicie um servidor local** usando Python:
    ```bash
    python -m http.server
    ```
4.  Abra seu navegador e acesse:
    ```
    http://localhost:8000
    ```

> **Nota:** Rodar diretamente clicando no `index.html` pode bloquear o carregamento dos arquivos JSON devido a políticas de segurança do navegador (CORS). Por isso, usar um servidor local é recomendado.

---

## 🛠️ Como Fazer Alterações

O projeto é orientado a dados (Data-Driven). A maior parte do conteúdo é carregada dinamicamente de arquivos JSON.

### 1. Adicionar Novas Técnicas ou Ferramentas

Para adicionar um novo item a um assunto existente (ex: uma nova métrica):

1.  Abra a pasta do projeto.
2.  Identifique o arquivo JSON correspondente ao assunto (ex: `metricas_indicadores.json`).
3.  Adicione um novo objeto ao array, seguindo o padrão:

```json
{
    "nome": "Nome da Nova Técnica",
    "descricao": "Uma descrição curta para o card.",
    "quando_usar": "Explicação rápida de quando aplicar.",
    "link": "https://link-externo-de-referencia.com",
    "categorias": ["Categoria 1", "Categoria 2"],
    "imagem": "URL da imagem (pode ser externa ou local em assets/)",
    "audio": "assets/audio/nome_do_audio.mp3",  // Opcional
    "video": "assets/video/nome_do_video.mp4",  // Opcional
    "ultima_atualizacao": "AAAA-MM-DD",
    "nivel": "Iniciante/Intermediário/Avançado",
    "tempo_aplicar": "Ex: Horas/Dias",
    "detalhes_markdown": "# Título\n\nTexto completo em Markdown..."
}
```

### 2. Adicionar Novos Assuntos (Categorias Principais)

Para criar uma nova aba no menu "Assunto" (ex: "Marketing Digital"):

1.  **Crie o JSON**: Crie um novo arquivo (ex: `marketing.json`) na raiz, seguindo a estrutura dos outros.
2.  **Atualize o HTML**: No `index.html`, adicione uma opção no `<select id="assunto-select">`:
    ```html
    <option value="marketing">Marketing Digital</option>
    ```
3.  **Atualize o Script**: No `script.js`, adicione o mapeamento no objeto `subjectFiles`:
    ```javascript
    const subjectFiles = {
        // ... outros assuntos
        'marketing': 'marketing.json',
    };
    ```
    *Faça o mesmo no arquivo `detalhe.js` para garantir que a página de detalhes funcione.*

### 3. Filtros

Os botões de filtro na página inicial são gerados **automaticamente** com base no campo `"categorias"` de cada item no JSON.
*   Basta adicionar uma nova categoria no JSON (ex: `"categorias": ["Minha Nova Categoria"]`), e o botão aparecerá automaticamente quando aquele assunto for selecionado.

### 4. Adicionar Áudios e Vídeos

*   **Arquivos**: Coloque seus arquivos de áudio (.mp3), vídeo (.mp4) ou imagens na pasta `assets` (nas subpastas `assets/audio`, `assets/video`, `assets/images`).
*   **Vínculo**: No JSON do item, adicione as propriedades `"audio"`, `"video"` ou `"imagem"` com o caminho relativo:
    ```json
    "audio": "assets/audio/meu_audio.mp3",
    "video": "assets/video/meu_video.mp4",
    "imagem": "assets/images/minha_imagem.png"
    ```
*   O player ou a imagem aparecerá automaticamente na página de detalhes do item.

---

## 📂 Estrutura de Arquivos

*   `index.html`: Página principal (Cards e Filtros).
*   `detalhe.html`: Página de detalhes (Conteúdo completo).
*   `script.js`: Lógica da página principal (Carga de JSON, Filtros, Busca).
*   `detalhe.js`: Lógica da página de detalhes (Renderização do Markdown, Áudio/Vídeo).
*   `style.css`: Estilização global.
*   `*.json`: Arquivos de dados (Conteúdo).
*   `assets/`: Imagens, áudios e outros arquivos de mídia.
