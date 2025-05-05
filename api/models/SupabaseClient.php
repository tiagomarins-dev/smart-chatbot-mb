<?php
/**
 * Cliente HTTP para a API REST do Supabase
 * 
 * Esta classe fornece métodos para interagir com a API REST do Supabase
 * sem depender do SDK oficial ou de conexão direta ao banco de dados.
 * 
 * Versão 2.0 - Melhorada com tratamento de erros, logs detalhados e opções de retry
 */

class SupabaseClient {
    /**
     * URL base do Supabase
     * 
     * @var string
     */
    private $url;
    
    /**
     * Chave de API do Supabase
     * 
     * @var string
     */
    private $key;
    
    /**
     * Tabela atual em uso
     * 
     * @var string
     */
    private $table;
    
    /**
     * Campos a serem selecionados
     * 
     * @var string
     */
    private $select = '*';
    
    /**
     * Filtros para a consulta
     * 
     * @var array
     */
    private $filters = [];
    
    /**
     * Ordenação para a consulta
     * 
     * @var array
     */
    private $orders = [];
    
    /**
     * Limite de resultados
     * 
     * @var int
     */
    private $limit = null;
    
    /**
     * Opções de configuração
     * 
     * @var array
     */
    private $options = [
        'debug' => false,
        'timeout' => 30,
        'retry_attempts' => 2,
        'retry_delay' => 1,
    ];
    
    /**
     * Construtor
     * 
     * @param array|string $url URL base do Supabase ou array de configuração
     * @param string|null $key Chave de API do Supabase (opcional se URL for array)
     * @param array $options Opções adicionais (opcional)
     */
    public function __construct($url, $key = null, array $options = []) {
        if (is_array($url)) {
            $this->url = $url['url'];
            $this->key = $url['key'];
            
            // Opções de configuração personalizadas
            if (isset($url['options']) && is_array($url['options'])) {
                $this->options = array_merge($this->options, $url['options']);
            }
        } else {
            $this->url = $url;
            $this->key = $key;
        }
        
        // Mesclar opções fornecidas
        if (!empty($options)) {
            $this->options = array_merge($this->options, $options);
        }
        
        // Validar configuração
        if (empty($this->url)) {
            throw new Exception('URL do Supabase não definida');
        }
        
        if (empty($this->key)) {
            throw new Exception('Chave de API do Supabase não definida');
        }
        
        // Log de inicialização
        if ($this->options['debug']) {
            error_log('SupabaseClient: Inicializado com URL ' . $this->url . ' e chave válida');
        }
    }
    
    /**
     * Obtém uma instância do cliente Supabase
     * 
     * @param string $keyType Tipo de chave a ser usada: 'anon' ou 'service_role'
     * @param array $options Opções adicionais
     * @return SupabaseClient
     */
    public static function getInstance($keyType = 'service_role', array $options = []) {
        // Carregar configuração
        $supabaseConfig = require __DIR__ . '/../config/supabase.php';
        
        error_log('SupabaseClient: Criando instância com keyType: ' . $keyType);
        
        if ($keyType === 'service_role') {
            $key = $supabaseConfig['service_role_key'];
            
            // Verificar chave
            if (empty($key)) {
                error_log('ERRO CRÍTICO: SUPABASE_SERVICE_ROLE_KEY não está definida no arquivo de configuração');
                error_log('Valores disponíveis: URL=' . (empty($supabaseConfig['url']) ? 'VAZIA' : 'DEFINIDA'));
                error_log('Valores disponíveis: ANON_KEY=' . (empty($supabaseConfig['key']) ? 'VAZIA' : 'DEFINIDA'));
                error_log('Valores disponíveis: JWT_SECRET=' . (empty($supabaseConfig['jwt_secret']) ? 'VAZIA' : 'DEFINIDA'));
                
                // Tentar ler diretamente do ambiente
                $envKey = getenv('SUPABASE_SERVICE_ROLE_KEY');
                if (!empty($envKey)) {
                    error_log('Recuperando SUPABASE_SERVICE_ROLE_KEY diretamente do ambiente: ' . substr($envKey, 0, 10) . '...');
                    $key = $envKey;
                } else {
                    throw new Exception('Chave de serviço do Supabase não definida');
                }
            } else {
                error_log('SupabaseClient: Service Role Key obtida da configuração: ' . substr($key, 0, 10) . '...');
            }
        } else {
            $key = $supabaseConfig['key']; // Chave anônima
            
            // Verificar chave
            if (empty($key)) {
                error_log('ERRO: SUPABASE_ANON_KEY não está definida no arquivo de configuração');
                throw new Exception('Chave anônima do Supabase não definida');
            } else {
                error_log('SupabaseClient: Anon Key obtida da configuração: ' . substr($key, 0, 10) . '...');
            }
        }
        
        // Criar configuração completa
        $config = [
            'url' => $supabaseConfig['url'],
            'key' => $key,
            'options' => $options
        ];
        
        error_log('SupabaseClient: Configuração criada - URL: ' . substr($config['url'], 0, 15) . '..., Key: ' . substr($config['key'], 0, 10) . '...');
        
        return new self($config);
    }
    
    /**
     * Define se o modo de debug está ativado
     * 
     * @param bool $debug Ativar ou desativar debug
     * @return SupabaseClient
     */
    public function debug($debug = true) {
        $this->options['debug'] = (bool)$debug;
        return $this;
    }
    
    /**
     * Define o timeout das requisições
     * 
     * @param int $seconds Segundos para timeout
     * @return SupabaseClient
     */
    public function timeout($seconds) {
        $this->options['timeout'] = max(1, (int)$seconds);
        return $this;
    }
    
    /**
     * Define a política de retry
     * 
     * @param int $attempts Número de tentativas
     * @param int $delay Atraso entre tentativas em segundos
     * @return SupabaseClient
     */
    public function retry($attempts, $delay = 1) {
        $this->options['retry_attempts'] = max(0, (int)$attempts);
        $this->options['retry_delay'] = max(1, (int)$delay);
        return $this;
    }
    
    /**
     * Seleciona a tabela a ser usada
     * 
     * @param string $table Nome da tabela
     * @return SupabaseClient
     */
    public function from($table) {
        $this->table = $table;
        $this->filters = [];
        $this->orders = [];
        $this->select = '*';
        $this->limit = null;
        return $this;
    }
    
    /**
     * Define os campos a serem selecionados
     * 
     * @param string $select Campos a serem selecionados
     * @return SupabaseClient
     */
    public function select($select) {
        $this->select = $select;
        return $this;
    }
    
    /**
     * Adiciona um filtro à consulta
     * 
     * @param string $column Coluna para filtrar
     * @param string $operator Operador de comparação
     * @param mixed $value Valor para comparar
     * @return SupabaseClient
     */
    public function filter($column, $operator, $value) {
        $this->filters[] = [
            'column' => $column,
            'operator' => $operator,
            'value' => $value
        ];
        return $this;
    }
    
    /**
     * Adiciona ordenação à consulta
     * 
     * @param string $column Coluna para ordenar
     * @param array $options Opções (ascending: true/false)
     * @return SupabaseClient
     */
    public function order($column, array $options = []) {
        $ascending = isset($options['ascending']) ? (bool)$options['ascending'] : true;
        
        $this->orders[] = [
            'column' => $column,
            'ascending' => $ascending
        ];
        
        return $this;
    }
    
    /**
     * Define limite de resultados
     * 
     * @param int $limit Número máximo de resultados
     * @return SupabaseClient
     */
    public function limit($limit) {
        $this->limit = max(1, (int)$limit);
        return $this;
    }
    
    /**
     * Executa uma consulta e retorna os resultados
     * 
     * @return object Resposta da API
     */
    public function execute() {
        // Verificar se tabela foi definida
        if (empty($this->table)) {
            throw new Exception('Tabela não definida. Use o método from() primeiro.');
        }
        
        // Construir a URL base
        $endpoint = $this->url . '/rest/v1/' . $this->table;
        
        // Adicionar parâmetros de seleção
        $params = [];
        if ($this->select !== '*') {
            $params['select'] = $this->select;
        }
        
        // Adicionar filtros
        if (!empty($this->filters)) {
            foreach ($this->filters as $filter) {
                $column = $filter['column'];
                $operator = $this->mapOperator($filter['operator']);
                $value = $filter['value'];
                
                // Construir parâmetro de filtro
                if ($operator === 'eq') {
                    $params[$column] = 'eq.' . $value;
                } else {
                    $params[$column] = $operator . '.' . $value;
                }
            }
        }
        
        // Adicionar ordenação
        if (!empty($this->orders)) {
            $orderClauses = [];
            
            foreach ($this->orders as $order) {
                $direction = $order['ascending'] ? 'asc' : 'desc';
                $orderClauses[] = $order['column'] . '.' . $direction;
            }
            
            if (!empty($orderClauses)) {
                $params['order'] = implode(',', $orderClauses);
            }
        }
        
        // Adicionar limite
        if ($this->limit !== null) {
            $params['limit'] = $this->limit;
        }
        
        // Montar URL completa com parâmetros
        if (!empty($params)) {
            $endpoint .= '?' . http_build_query($params);
        }
        
        // Log de debug
        if ($this->options['debug']) {
            error_log('SupabaseClient: Executando consulta GET para: ' . $endpoint);
        }
        
        // Executar requisição GET
        return $this->request('GET', $endpoint);
    }
    
    /**
     * Insere dados na tabela
     * 
     * @param array $data Dados a serem inseridos
     * @return object Resposta da API
     */
    public function insert($data) {
        // Verificar se tabela foi definida
        if (empty($this->table)) {
            throw new Exception('Tabela não definida. Use o método from() primeiro.');
        }
        
        // Adicionar timestamps padrão, se não fornecidos
        if (!isset($data['created_at'])) {
            $data['created_at'] = date('c');
        }
        if (!isset($data['updated_at'])) {
            $data['updated_at'] = date('c');
        }
        
        // Construir a URL
        $endpoint = $this->url . '/rest/v1/' . $this->table;
        
        // Adicionar opções para retornar a linha inserida
        $endpoint .= '?select=*';
        
        // Log de debug
        if ($this->options['debug']) {
            error_log('SupabaseClient: Executando INSERT para: ' . $endpoint);
            error_log('SupabaseClient: Dados: ' . json_encode($data));
        }
        
        // Executar requisição POST
        return $this->request('POST', $endpoint, $data);
    }
    
    /**
     * Atualiza dados na tabela
     * 
     * @param array $data Dados a serem atualizados
     * @return object Resposta da API
     */
    public function update($data) {
        // Verificar se tabela foi definida
        if (empty($this->table)) {
            throw new Exception('Tabela não definida. Use o método from() primeiro.');
        }
        
        // Adicionar timestamp de atualização, se não fornecido
        if (!isset($data['updated_at'])) {
            $data['updated_at'] = date('c');
        }
        
        // Construir a URL base
        $endpoint = $this->url . '/rest/v1/' . $this->table;
        
        // Adicionar opções para retornar as linhas atualizadas
        $queryParams = ['select' => '*'];
        
        // Adicionar filtros
        if (empty($this->filters)) {
            throw new Exception('Nenhum filtro fornecido para atualização. Use o método filter() primeiro.');
        }
        
        foreach ($this->filters as $filter) {
            $column = $filter['column'];
            $operator = $this->mapOperator($filter['operator']);
            $value = $filter['value'];
            
            // Construir parâmetro de filtro
            if ($operator === 'eq') {
                $queryParams[$column] = 'eq.' . $value;
            } else {
                $queryParams[$column] = $operator . '.' . $value;
            }
        }
        
        // Montar URL completa com parâmetros
        $endpoint .= '?' . http_build_query($queryParams);
        
        // Log de debug
        if ($this->options['debug']) {
            error_log('SupabaseClient: Executando UPDATE para: ' . $endpoint);
            error_log('SupabaseClient: Dados: ' . json_encode($data));
        }
        
        // Executar requisição PATCH
        return $this->request('PATCH', $endpoint, $data);
    }
    
    /**
     * Exclui registros da tabela
     * 
     * @return object Resposta da API
     */
    public function delete() {
        // Verificar se tabela foi definida
        if (empty($this->table)) {
            throw new Exception('Tabela não definida. Use o método from() primeiro.');
        }
        
        // Verificar se há filtros
        if (empty($this->filters)) {
            throw new Exception('Nenhum filtro fornecido para exclusão. Use o método filter() primeiro.');
        }
        
        // Construir a URL base
        $endpoint = $this->url . '/rest/v1/' . $this->table;
        
        // Adicionar opções para retornar as linhas excluídas
        $queryParams = ['select' => '*'];
        
        // Adicionar filtros
        foreach ($this->filters as $filter) {
            $column = $filter['column'];
            $operator = $this->mapOperator($filter['operator']);
            $value = $filter['value'];
            
            // Construir parâmetro de filtro
            if ($operator === 'eq') {
                $queryParams[$column] = 'eq.' . $value;
            } else {
                $queryParams[$column] = $operator . '.' . $value;
            }
        }
        
        // Montar URL completa com parâmetros
        $endpoint .= '?' . http_build_query($queryParams);
        
        // Log de debug
        if ($this->options['debug']) {
            error_log('SupabaseClient: Executando DELETE para: ' . $endpoint);
        }
        
        // Executar requisição DELETE
        return $this->request('DELETE', $endpoint);
    }
    
    /**
     * Mapeia operadores lógicos para o formato da API do Supabase
     * 
     * @param string $operator Operador lógico
     * @return string Operador formatado para a API
     */
    private function mapOperator($operator) {
        $map = [
            'eq' => 'eq',
            'neq' => 'neq',
            'gt' => 'gt',
            'gte' => 'gte',
            'lt' => 'lt',
            'lte' => 'lte',
            'like' => 'like',
            'ilike' => 'ilike',
            'is' => 'is',
            'in' => 'in',
            '=' => 'eq',
            '!=' => 'neq',
            '>' => 'gt',
            '>=' => 'gte',
            '<' => 'lt',
            '<=' => 'lte'
        ];
        
        return isset($map[$operator]) ? $map[$operator] : $operator;
    }
    
    /**
     * Executa uma requisição HTTP para a API do Supabase
     * 
     * @param string $method Método HTTP (GET, POST, PATCH, DELETE)
     * @param string $url URL da requisição
     * @param array $data Dados a serem enviados (opcional)
     * @return object Resposta da API
     */
    private function request($method, $url, $data = null) {
        // Configurar contexto da requisição
        // Configurar contexto da requisição HTTP
        $options = [
            'http' => [
                'method' => $method,
                // Cabeçalhos para autenticação na API REST do Supabase
                'header' => [
                    'Content-Type: application/json',
                    'apikey: ' . $this->key,
                    'Authorization: Bearer ' . $this->key
                ],
                'ignore_errors' => true,
                'timeout' => $this->options['timeout']
            ]
        ];
        
        // Adicionar dados no corpo da requisição, se fornecidos
        if ($data !== null) {
            $options['http']['content'] = json_encode($data);
        }
        
        // Criar contexto da requisição
        $context = stream_context_create($options);
        
        // Inicializar variáveis para retry
        $attempts = 0;
        $maxAttempts = $this->options['retry_attempts'] + 1; // +1 para a tentativa inicial
        $delay = $this->options['retry_delay'];
        $lastError = null;
        
        // Tentar requisição com retry
        while ($attempts < $maxAttempts) {
            $attempts++;
            
            try {
                // Log de tentativa
                if ($this->options['debug'] && $attempts > 1) {
                    error_log("SupabaseClient: Tentativa $attempts/$maxAttempts para $url");
                }
                
                // Executar requisição com medição de tempo
                $startTime = microtime(true);
                $result = @file_get_contents($url, false, $context);
                $requestTime = microtime(true) - $startTime;
                
                // Log de tempo
                if ($this->options['debug']) {
                    error_log(sprintf('SupabaseClient: Requisição completada em %.2fs', $requestTime));
                }
                
                // Obter código de resposta HTTP
                $responseHeaders = $http_response_header ?? [];
                $statusLine = $responseHeaders[0] ?? '';
                preg_match('{HTTP/\S*\s(\d{3})}', $statusLine, $match);
                $statusCode = $match[1] ?? 0;
                
                // Decodificar resposta JSON
                $responseData = json_decode($result);
                
                // Se for erro 5xx, tentar novamente
                if ($statusCode >= 500 && $attempts < $maxAttempts) {
                    $lastError = "Erro HTTP $statusCode";
                    
                    if ($this->options['debug']) {
                        error_log("SupabaseClient: $lastError, tentando novamente em {$delay}s");
                    }
                    
                    // Aguardar antes de tentar novamente
                    sleep($delay);
                    continue;
                }
                
                // Para depuração, registra propriedades importantes da resposta
                if ($this->options['debug']) {
                    error_log('SupabaseClient: Resposta recebida - código HTTP: ' . $statusCode);
                    error_log('SupabaseClient: Resposta JSON válida: ' . (json_last_error() === JSON_ERROR_NONE ? 'Sim' : 'Não'));
                    if (is_object($responseData) && isset($responseData->message)) {
                        error_log('SupabaseClient: Mensagem de resposta: ' . $responseData->message);
                    }
                }
                
                // Criar objeto de resposta
                $responseObject = new stdClass();
                $responseObject->data = $responseData;
                $responseObject->statusCode = $statusCode;
                $responseObject->requestTime = $requestTime;
                $responseObject->headers = $responseHeaders;
                $responseObject->error = null;
                
                // Verificar se houve erro
                if ($statusCode >= 400) {
                    $errorMsg = is_object($responseData) && isset($responseData->message) 
                        ? $responseData->message 
                        : "Erro HTTP $statusCode";
                    
                    $responseObject->error = new Exception($errorMsg, $statusCode);
                    
                    if ($this->options['debug']) {
                        error_log('SupabaseClient: Erro encontrado na resposta: ' . $errorMsg);
                    }
                }
                
                // Não precisamos adicionar métodos como funções anônimas no PHP
                
                return $responseObject;
            } catch (Exception $e) {
                $lastError = $e->getMessage();
                
                if ($this->options['debug']) {
                    error_log("SupabaseClient: Erro na tentativa $attempts: $lastError");
                }
                
                // Se não for a última tentativa, tentar novamente
                if ($attempts < $maxAttempts) {
                    if ($this->options['debug']) {
                        error_log("SupabaseClient: Tentando novamente em {$delay}s");
                    }
                    
                    // Aguardar antes de tentar novamente
                    sleep($delay);
                }
            }
        }
        
        // Se chegou aqui, todas as tentativas falharam
        throw new Exception("Todas as tentativas falharam: $lastError", 500);
    }
}