import { pipeline, env } from 'https://cdn.jsdelivr.net/npm/@xenova/transformers';

// Configuração para permitir execução no browser
env.allowLocalModels = false;
env.useBrowserCache = true;

let embeddingPipeline = null;
let techniqueEmbeddings = [];

/**
 * Carrega o modelo de IA e atualiza o progresso na UI
 * @param {Function} onProgress - Callback para atualizar progresso (0-100)
 */
export async function loadAIModel(onProgress) {
    if (embeddingPipeline) return;

    try {
        embeddingPipeline = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2', {
            progress_callback: (data) => {
                if (data.status === 'progress') {
                    onProgress(data.progress);
                }
            }
        });
        return true;
    } catch (error) {
        console.error('Erro ao carregar o modelo de IA:', error);
        throw error;
    }
}

/**
 * Gera embeddings para toda a base de dados
 * @param {Array} techniques - Array de objetos de técnicas do KB
 */
export async function generateAllEmbeddings(techniques) {
    if (!embeddingPipeline) throw new Error('Modelo de IA não carregado');

    console.log('Gerando embeddings para', techniques.length, 'itens...');
    
    // Processamos em lotes (batches) ou sequencialmente para não travar o browser
    const embeddings = [];
    for (const tech of techniques) {
        // Criamos um texto rico combinando nome, descrição e quando usar
        const textContent = `Nome: ${tech.nome}. Descrição: ${tech.descricao}. Quando usar: ${tech.quando_usar}`;
        
        const output = await embeddingPipeline(textContent, {
            pooling: 'mean',
            normalize: true
        });
        
        embeddings.push({
            nome: tech.nome,
            embedding: output.data
        });
    }

    techniqueEmbeddings = embeddings;
    console.log('Embeddings gerados com sucesso!');
}

/**
 * Realiza a busca semântica calculando a similaridade de cosseno
 * @param {string} query - O termo de busca do usuário
 * @param {number} threshold - Limite de similaridade (0-1)
 */
export async function semanticSearch(query, threshold = 0.2) {
    if (!embeddingPipeline || techniqueEmbeddings.length === 0) return [];

    // Gerar embedding para a query do usuário
    const queryOutput = await embeddingPipeline(query, {
        pooling: 'mean',
        normalize: true
    });
    const queryVector = queryOutput.data;

    // Calcular similaridade com todos os itens
    const results = techniqueEmbeddings.map(item => {
        const similarity = cosineSimilarity(queryVector, item.embedding);
        return {
            nome: item.nome,
            score: similarity
        };
    });

    // Ordenar por score e filtrar pelo threshold
    return results
        .filter(res => res.score >= threshold)
        .sort((a, b) => b.score - a.score);
}

/**
 * Calcula a Similaridade de Cosseno entre dois vetores
 */
function cosineSimilarity(vecA, vecB) {
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;
    for (let i = 0; i < vecA.length; i++) {
        dotProduct += vecA[i] * vecB[i];
        normA += vecA[i] * vecA[i];
        normB += vecB[i] * vecB[i];
    }
    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}
