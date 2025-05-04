import supabase from './supabase.js';
import authService from './auth.js';

// Classe para gerenciar integrações (chaves API e webhooks)
class IntegrationsService {
  // Carregar todas as chaves API do usuário
  async getApiKeys() {
    try {
      const { data, error } = await supabase
        .from('api_keys')
        .select(`
          id,
          name,
          key_value,
          rate_limit,
          is_active,
          created_at,
          api_key_scopes (
            scope_id,
            api_scopes:scope_id (
              name
            )
          )
        `)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      // Formatar os dados para facilitar o uso
      return data.map(key => {
        // Extrair os nomes dos escopos de permissões
        const scopes = key.api_key_scopes.map(scope => scope.api_scopes.name);
        
        return {
          id: key.id,
          name: key.name,
          key: key.key_value,
          scopes: scopes,
          rate_limit: key.rate_limit,
          is_active: key.is_active,
          created_at: key.created_at
        };
      });
    } catch (error) {
      console.error('Erro ao buscar chaves API:', error);
      throw error;
    }
  }
  
  // Criar uma nova chave API
  async createApiKey(name, scopes, rateLimit) {
    try {
      // Primeiro, verificar se o usuário está autenticado
      const user = await authService.getCurrentUser();
      if (!user) throw new Error('Usuário não autenticado');
      
      // Gerar a chave e o segredo
      const keyValue = 'key_' + this._generateRandomString(24);
      const secretValue = 'secret_' + this._generateRandomString(32);
      
      // Hash do segredo (para armazenamento) - Simplificação para o exemplo
      // Em produção, usaríamos uma função de hash segura
      const secretHash = secretValue;
      
      // Iniciar uma transação para garantir consistência
      const { data: apiKey, error: keyError } = await supabase
        .from('api_keys')
        .insert({
          user_id: user.id,
          name: name,
          key_value: keyValue,
          secret_hash: secretHash,
          rate_limit: rateLimit,
          is_active: true
        })
        .select()
        .single();
      
      if (keyError) throw keyError;
      
      // Obter os ids dos escopos solicitados
      const { data: scopeData, error: scopeError } = await supabase
        .from('api_scopes')
        .select('id, name')
        .in('name', scopes);
      
      if (scopeError) throw scopeError;
      
      // Relacionar os escopos com a chave API
      const scopeInserts = scopeData.map(scope => ({
        api_key_id: apiKey.id,
        scope_id: scope.id
      }));
      
      const { error: scopesInsertError } = await supabase
        .from('api_key_scopes')
        .insert(scopeInserts);
      
      if (scopesInsertError) throw scopesInsertError;
      
      // Retornar os dados da nova chave, incluindo o segredo
      return {
        id: apiKey.id,
        name: apiKey.name,
        key: keyValue,
        secret: secretValue, // IMPORTANTE: Isto só é retornado UMA vez, na criação
        scopes: scopes,
        rate_limit: apiKey.rate_limit,
        is_active: apiKey.is_active,
        created_at: apiKey.created_at
      };
    } catch (error) {
      console.error('Erro ao criar chave API:', error);
      throw error;
    }
  }
  
  // Revogar/excluir uma chave API
  async deleteApiKey(keyId) {
    try {
      // Primeiro excluir os registros de escopo relacionados (devido à restrição de chave estrangeira)
      const { error: scopeDeleteError } = await supabase
        .from('api_key_scopes')
        .delete()
        .eq('api_key_id', keyId);
      
      if (scopeDeleteError) throw scopeDeleteError;
      
      // Depois excluir a chave em si
      const { error: keyDeleteError } = await supabase
        .from('api_keys')
        .delete()
        .eq('id', keyId);
      
      if (keyDeleteError) throw keyDeleteError;
      
      return true;
    } catch (error) {
      console.error('Erro ao excluir chave API:', error);
      throw error;
    }
  }
  
  // Carregar todos os webhooks do usuário
  async getWebhooks() {
    try {
      const { data, error } = await supabase
        .from('webhooks')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Erro ao buscar webhooks:', error);
      throw error;
    }
  }
  
  // Criar um novo webhook
  async createWebhook(name, url, events, generateSecret = true) {
    try {
      // Verificar se o usuário está autenticado
      const user = await authService.getCurrentUser();
      if (!user) throw new Error('Usuário não autenticado');
      
      // Gerar token secreto se solicitado
      let secretToken = null;
      if (generateSecret) {
        secretToken = 'whsec_' + this._generateRandomString(32);
      }
      
      // Inserir o webhook
      const { data, error } = await supabase
        .from('webhooks')
        .insert({
          user_id: user.id,
          name: name,
          url: url,
          events: events,
          is_active: true,
          secret_token: secretToken
        })
        .select()
        .single();
      
      if (error) throw error;
      
      return {
        ...data,
        // Só retorna o token secreto na criação
        secret_token: secretToken
      };
    } catch (error) {
      console.error('Erro ao criar webhook:', error);
      throw error;
    }
  }
  
  // Excluir um webhook
  async deleteWebhook(webhookId) {
    try {
      const { error } = await supabase
        .from('webhooks')
        .delete()
        .eq('id', webhookId);
      
      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Erro ao excluir webhook:', error);
      throw error;
    }
  }
  
  // Utilitário para gerar strings aleatórias
  _generateRandomString(length) {
    const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    const randomValues = new Uint8Array(length);
    window.crypto.getRandomValues(randomValues);
    for (let i = 0; i < length; i++) {
      result += chars[randomValues[i] % chars.length];
    }
    return result;
  }
}

// Exportar uma instância do serviço de integrações
const integrationsService = new IntegrationsService();
export default integrationsService;