<?php
/**
 * Adaptador para o Supabase
 * 
 * Esta classe fornece métodos compatíveis com o SDK Supabase para
 * facilitar a transição entre o SDK e a conexão direta com o banco de dados.
 */
require_once __DIR__ . '/Database.php';

class SupabaseAdapter {
    /**
     * Configuração do Supabase
     * 
     * @var array
     */
    private $config;
    
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
    private $order = [];
    
    /**
     * Construtor
     * 
     * @param array $config Configuração do Supabase
     */
    public function __construct($config) {
        $this->config = $config;
    }
    
    /**
     * Obtém uma instância do adaptador Supabase
     * 
     * @return SupabaseAdapter
     */
    public static function getInstance() {
        $config = Database::getSupabaseClient();
        return new self($config);
    }
    
    /**
     * Seleciona a tabela a ser usada
     * 
     * @param string $table Nome da tabela
     * @return SupabaseAdapter
     */
    public function from($table) {
        // Log para debug
        error_log("SupabaseAdapter::from - Definindo tabela: {$table}");
        
        // Salvar o estado dos dados de atualização, se existirem
        $updateData = isset($this->updateData) ? $this->updateData : null;
        $insertData = isset($this->insertData) ? $this->insertData : null;
        
        $this->table = $table;
        $this->filters = [];
        $this->select = '*';
        $this->order = [];
        
        // Restaurar os dados de atualização, se existiam antes
        if ($updateData !== null) {
            $this->updateData = $updateData;
            error_log('SupabaseAdapter::from - Preservando updateData existente');
        }
        
        if ($insertData !== null) {
            $this->insertData = $insertData;
            error_log('SupabaseAdapter::from - Preservando insertData existente');
        }
        
        return $this;
    }
    
    /**
     * Define os campos a serem selecionados
     * 
     * @param string $select Campos a serem selecionados
     * @return SupabaseAdapter
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
     * @return SupabaseAdapter
     */
    public function filter($column, $operator, $value) {
        // Log para debug
        error_log("SupabaseAdapter::filter - Adicionando filtro: {$column} {$operator} {$value}");
        
        $this->filters[] = [
            'column' => $column,
            'operator' => $operator,
            'value' => $value
        ];
        
        // Verificar se updateData está definido para debug
        if (isset($this->updateData)) {
            error_log('SupabaseAdapter::filter - updateData ainda está definido após adicionar filtro');
        }
        
        return $this;
    }
    
    /**
     * Define a ordenação da consulta
     * 
     * @param string $column Coluna para ordenar
     * @param array $options Opções de ordenação (ascending => true/false)
     * @return SupabaseAdapter
     */
    public function order($column, $options = []) {
        $direction = isset($options['ascending']) && $options['ascending'] ? 'ASC' : 'DESC';
        $this->order[$column] = $direction;
        return $this;
    }
    
    /**
     * Insere dados na tabela
     * 
     * @param array $data Dados a serem inseridos
     * @return SupabaseAdapter
     */
    public function insert($data) {
        $this->insertData = $data;
        return $this;
    }
    
    /**
     * Atualiza dados na tabela
     * 
     * @param array $data Dados a serem atualizados
     * @return SupabaseAdapter
     */
    public function update($data) {
        // Certifica-se de que updateData é definido como propriedade
        $this->updateData = $data;
        
        // Log para debug
        error_log('SupabaseAdapter::update - Definindo updateData: ' . json_encode($data));
        
        return $this;
    }
    
    /**
     * Atualiza dados na tabela e executa imediatamente
     * (Método alternativo que não depende de updateData)
     * 
     * @param array $data Dados a serem atualizados
     * @return object Resultado da execução
     */
    public function directUpdate($data) {
        // Log para debug
        error_log('SupabaseAdapter::directUpdate - Atualizando diretamente com dados: ' . json_encode($data));
        
        if (empty($this->table)) {
            throw new Exception('Tabela não definida. Use o método from() primeiro.');
        }
        
        if (empty($this->filters)) {
            throw new Exception('Nenhum filtro fornecido para atualização. Use o método filter() primeiro.');
        }
        
        // Adicionar updated_at automaticamente se não estiver presente
        if (!isset($data['updated_at'])) {
            $data['updated_at'] = date('c');
        }
        
        // Construir condição WHERE
        $whereCondition = '';
        $whereParams = [];
        
        $sqlFilters = [];
        foreach ($this->filters as $filter) {
            // Mapear operadores para SQL
            $sqlOperator = $this->mapOperator($filter['operator']);
            $sqlFilters[] = sprintf('%s %s ?', $filter['column'], $sqlOperator);
            $whereParams[] = $filter['value'];
        }
        $whereCondition = implode(' AND ', $sqlFilters);
        
        // Log para debug
        error_log('SupabaseAdapter::directUpdate - WHERE: ' . $whereCondition);
        error_log('SupabaseAdapter::directUpdate - Parâmetros: ' . json_encode($whereParams));
        
        try {
            // Atualizar no banco de dados
            Database::update($this->table, $data, $whereCondition, $whereParams);
            
            // Obter os registros atualizados
            $sql = sprintf('SELECT * FROM %s WHERE %s', $this->table, $whereCondition);
            $updatedData = Database::query($sql, $whereParams);
            
            // Log para debug
            error_log('SupabaseAdapter::directUpdate - Sucesso, retornando ' . count($updatedData) . ' registros');
            
            // Retornar resultado encapsulado em objeto anônimo
            return new class($updatedData) {
                private $data;
                private $error;
                
                public function __construct($data) {
                    $this->data = $data;
                    $this->error = null;
                }
                
                public function getError() {
                    return $this->error;
                }
                
                public function getData() {
                    return $this->data;
                }
            };
        } catch (Exception $e) {
            error_log('SupabaseAdapter::directUpdate - ERRO: ' . $e->getMessage());
            throw $e;
        }
    }
    
    /**
     * Executa a consulta e retorna o resultado
     * 
     * @return object
     */
    public function execute() {
        try {
            // Log para debug
            if (isset($this->updateData)) {
                error_log('SupabaseAdapter::execute - updateData está definido: ' . json_encode($this->updateData));
            } else {
                error_log('SupabaseAdapter::execute - updateData NÃO está definido');
            }
            
            // Dependendo da operação, executar a consulta apropriada
            if (isset($this->insertData)) {
                return $this->executeInsert();
            } elseif (isset($this->updateData)) {
                return $this->executeUpdate();
            } else {
                return $this->executeSelect();
            }
        } catch (Exception $e) {
            error_log('SupabaseAdapter::execute - ERRO: ' . $e->getMessage());
            
            return new class($e) {
                private $error;
                
                public function __construct($error) {
                    $this->error = $error;
                }
                
                public function getError() {
                    return $this->error;
                }
                
                public function getData() {
                    return [];
                }
            };
        }
    }
    
    /**
     * Executa uma consulta SELECT
     * 
     * @return object
     */
    private function executeSelect() {
        // Construir a consulta SQL
        $sql = sprintf('SELECT %s FROM %s', $this->select, $this->table);
        
        // Adicionar filtros
        $params = [];
        if (!empty($this->filters)) {
            $sqlFilters = [];
            foreach ($this->filters as $index => $filter) {
                // Mapear operadores para SQL
                $sqlOperator = $this->mapOperator($filter['operator']);
                $sqlFilters[] = sprintf('%s %s ?', $filter['column'], $sqlOperator);
                $params[] = $filter['value'];
            }
            $sql .= ' WHERE ' . implode(' AND ', $sqlFilters);
        }
        
        // Adicionar ordenação
        if (!empty($this->order)) {
            $sqlOrder = [];
            foreach ($this->order as $column => $direction) {
                $sqlOrder[] = sprintf('%s %s', $column, $direction);
            }
            $sql .= ' ORDER BY ' . implode(', ', $sqlOrder);
        }
        
        // Executar a consulta
        $data = Database::query($sql, $params);
        
        // Retornar resultado
        return new class($data) {
            private $data;
            private $error;
            
            public function __construct($data) {
                $this->data = $data;
                $this->error = null;
            }
            
            public function getError() {
                return $this->error;
            }
            
            public function getData() {
                return $this->data;
            }
        };
    }
    
    /**
     * Executa uma operação INSERT
     * 
     * @return object
     */
    private function executeInsert() {
        // Garantir que os dados foram fornecidos
        if (empty($this->insertData)) {
            throw new Exception('Nenhum dado fornecido para inserção');
        }
        
        // Se o dado não tiver created_at, adicionar
        if (!isset($this->insertData['created_at'])) {
            $this->insertData['created_at'] = date('c');
        }
        
        // Se o dado não tiver updated_at, adicionar
        if (!isset($this->insertData['updated_at'])) {
            $this->insertData['updated_at'] = date('c');
        }
        
        // Inserir no banco de dados
        $id = Database::insert($this->table, $this->insertData);
        
        // Obter o registro inserido
        $sql = sprintf('SELECT * FROM %s WHERE id = ?', $this->table);
        $data = Database::queryOne($sql, [$id]);
        
        // Limpar dados de inserção
        $this->insertData = null;
        
        // Retornar resultado
        return new class([$data]) {
            private $data;
            private $error;
            
            public function __construct($data) {
                $this->data = $data;
                $this->error = null;
            }
            
            public function getError() {
                return $this->error;
            }
            
            public function getData() {
                return $this->data;
            }
        };
    }
    
    /**
     * Executa uma operação UPDATE
     * 
     * @return object
     */
    private function executeUpdate() {
        // Log para debug início do método
        error_log('SupabaseAdapter::executeUpdate - Iniciando execução de update');
        
        // Garantir que os dados foram fornecidos
        if (empty($this->updateData)) {
            error_log('SupabaseAdapter::executeUpdate - ERRO: Nenhum dado fornecido para atualização');
            throw new Exception('Nenhum dado fornecido para atualização');
        }
        
        // Log para debug os dados de atualização recebidos
        error_log('SupabaseAdapter::executeUpdate - Dados de atualização: ' . json_encode($this->updateData));
        
        // Se o dado não tiver updated_at, adicionar
        if (!isset($this->updateData['updated_at'])) {
            $this->updateData['updated_at'] = date('c');
        }
        
        // Construir condição WHERE
        $whereCondition = '';
        $whereParams = [];
        if (!empty($this->filters)) {
            $sqlFilters = [];
            foreach ($this->filters as $filter) {
                // Mapear operadores para SQL
                $sqlOperator = $this->mapOperator($filter['operator']);
                $sqlFilters[] = sprintf('%s %s ?', $filter['column'], $sqlOperator);
                $whereParams[] = $filter['value'];
            }
            $whereCondition = implode(' AND ', $sqlFilters);
            
            // Log para debug
            error_log('SupabaseAdapter::executeUpdate - Condição WHERE: ' . $whereCondition);
            error_log('SupabaseAdapter::executeUpdate - Parâmetros WHERE: ' . json_encode($whereParams));
        } else {
            error_log('SupabaseAdapter::executeUpdate - ERRO: Nenhum filtro fornecido para atualização');
            throw new Exception('Nenhum filtro fornecido para atualização');
        }
        
        // Fazemos uma cópia da propriedade updateData antes de continuar
        $updateDataCopy = $this->updateData;
        
        try {
            // Atualizar no banco de dados
            $rowsAffected = Database::update($this->table, $updateDataCopy, $whereCondition, $whereParams);
            
            // Log para debug
            error_log('SupabaseAdapter::executeUpdate - Linhas afetadas: ' . $rowsAffected);
            
            // Obter os registros atualizados
            $sql = sprintf('SELECT * FROM %s WHERE %s', $this->table, $whereCondition);
            $data = Database::query($sql, $whereParams);
            
            // Log para debug
            error_log('SupabaseAdapter::executeUpdate - Registros retornados: ' . json_encode($data));
            
            // Limpar dados de atualização APÓS ter usado a cópia
            $this->updateData = null;
            
            // Retornar resultado
            return new class($data) {
                private $data;
                private $error;
                
                public function __construct($data) {
                    $this->data = $data;
                    $this->error = null;
                }
                
                public function getError() {
                    return $this->error;
                }
                
                public function getData() {
                    return $this->data;
                }
            };
        } catch (Exception $e) {
            // Log de erro
            error_log('SupabaseAdapter::executeUpdate - ERRO ao atualizar dados: ' . $e->getMessage());
            
            // Limpar dados de atualização
            $this->updateData = null;
            
            // Repassar a exceção
            throw $e;
        }
    }
    
    /**
     * Mapeia operadores Supabase para operadores SQL
     * 
     * @param string $operator Operador Supabase
     * @return string Operador SQL
     */
    private function mapOperator($operator) {
        $map = [
            'eq' => '=',
            'neq' => '!=',
            'gt' => '>',
            'gte' => '>=',
            'lt' => '<',
            'lte' => '<=',
            'in' => 'IN',
            'is' => 'IS',
            'like' => 'LIKE'
        ];
        
        return isset($map[$operator]) ? $map[$operator] : $operator;
    }
}