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
        $this->table = $table;
        $this->filters = [];
        $this->select = '*';
        $this->order = [];
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
        $this->filters[] = [
            'column' => $column,
            'operator' => $operator,
            'value' => $value
        ];
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
        $this->updateData = $data;
        return $this;
    }
    
    /**
     * Executa a consulta e retorna o resultado
     * 
     * @return object
     */
    public function execute() {
        try {
            // Dependendo da operação, executar a consulta apropriada
            if (isset($this->insertData)) {
                return $this->executeInsert();
            } elseif (isset($this->updateData)) {
                return $this->executeUpdate();
            } else {
                return $this->executeSelect();
            }
        } catch (Exception $e) {
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
        // Garantir que os dados foram fornecidos
        if (empty($this->updateData)) {
            throw new Exception('Nenhum dado fornecido para atualização');
        }
        
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
        } else {
            throw new Exception('Nenhum filtro fornecido para atualização');
        }
        
        // Atualizar no banco de dados
        Database::update($this->table, $this->updateData, $whereCondition, $whereParams);
        
        // Obter os registros atualizados
        $sql = sprintf('SELECT * FROM %s WHERE %s', $this->table, $whereCondition);
        $data = Database::query($sql, $whereParams);
        
        // Limpar dados de atualização
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