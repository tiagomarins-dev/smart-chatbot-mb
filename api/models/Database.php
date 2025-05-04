<?php
/**
 * Classe para conexão com o banco de dados
 */
class Database {
    /**
     * Instância do PDO
     * 
     * @var PDO
     */
    private static $instance = null;
    
    /**
     * Obtém instância de conexão com o banco
     * 
     * @return PDO
     */
    public static function getInstance() {
        if (self::$instance === null) {
            $config = require __DIR__ . '/../config/database.php';
            
            try {
                $dsn = sprintf(
                    '%s:host=%s;port=%s;dbname=%s;',
                    $config['driver'],
                    $config['host'],
                    $config['port'],
                    $config['database']
                );
                
                self::$instance = new PDO(
                    $dsn,
                    $config['username'],
                    $config['password'],
                    $config['options']
                );
                
                // Definir o esquema padrão
                if (isset($config['schema'])) {
                    self::$instance->exec('SET search_path TO ' . $config['schema']);
                }
            } catch (PDOException $e) {
                error_log('Erro de conexão com o banco de dados: ' . $e->getMessage());
                throw new Exception('Erro de conexão com o banco de dados');
            }
        }
        
        return self::$instance;
    }
    
    /**
     * Executa uma consulta e retorna o resultado
     * 
     * @param string $sql Consulta SQL
     * @param array $params Parâmetros para a consulta
     * @return array Resultado da consulta
     */
    public static function query($sql, $params = []) {
        try {
            $stmt = self::getInstance()->prepare($sql);
            $stmt->execute($params);
            return $stmt->fetchAll();
        } catch (PDOException $e) {
            error_log('Erro na consulta SQL: ' . $e->getMessage());
            throw new Exception('Erro ao executar consulta');
        }
    }
    
    /**
     * Executa uma consulta e retorna a primeira linha do resultado
     * 
     * @param string $sql Consulta SQL
     * @param array $params Parâmetros para a consulta
     * @return array|null Primeira linha do resultado ou null
     */
    public static function queryOne($sql, $params = []) {
        try {
            $stmt = self::getInstance()->prepare($sql);
            $stmt->execute($params);
            return $stmt->fetch();
        } catch (PDOException $e) {
            error_log('Erro na consulta SQL: ' . $e->getMessage());
            throw new Exception('Erro ao executar consulta');
        }
    }
    
    /**
     * Executa uma consulta e retorna a primeira coluna da primeira linha
     * 
     * @param string $sql Consulta SQL
     * @param array $params Parâmetros para a consulta
     * @return mixed Valor da primeira coluna ou null
     */
    public static function queryValue($sql, $params = []) {
        try {
            $stmt = self::getInstance()->prepare($sql);
            $stmt->execute($params);
            return $stmt->fetchColumn();
        } catch (PDOException $e) {
            error_log('Erro na consulta SQL: ' . $e->getMessage());
            throw new Exception('Erro ao executar consulta');
        }
    }
    
    /**
     * Executa uma instrução SQL (INSERT, UPDATE, DELETE)
     * 
     * @param string $sql Instrução SQL
     * @param array $params Parâmetros para a instrução
     * @return int Número de linhas afetadas
     */
    public static function execute($sql, $params = []) {
        try {
            $stmt = self::getInstance()->prepare($sql);
            $stmt->execute($params);
            return $stmt->rowCount();
        } catch (PDOException $e) {
            error_log('Erro na execução SQL: ' . $e->getMessage());
            throw new Exception('Erro ao executar instrução');
        }
    }
    
    /**
     * Insere dados em uma tabela
     * 
     * @param string $table Nome da tabela
     * @param array $data Dados a serem inseridos
     * @return string|int ID da linha inserida ou número de linhas afetadas
     */
    public static function insert($table, $data) {
        $columns = array_keys($data);
        $placeholders = array_fill(0, count($columns), '?');
        
        $sql = sprintf(
            'INSERT INTO %s (%s) VALUES (%s) RETURNING id',
            $table,
            implode(', ', $columns),
            implode(', ', $placeholders)
        );
        
        try {
            $stmt = self::getInstance()->prepare($sql);
            $stmt->execute(array_values($data));
            
            // Tentar retornar o ID da linha inserida
            $id = $stmt->fetchColumn();
            if ($id) {
                return $id;
            }
            
            return $stmt->rowCount();
        } catch (PDOException $e) {
            error_log('Erro na inserção: ' . $e->getMessage());
            throw new Exception('Erro ao inserir dados');
        }
    }
    
    /**
     * Atualiza dados em uma tabela
     * 
     * @param string $table Nome da tabela
     * @param array $data Dados a serem atualizados
     * @param string $condition Condição WHERE
     * @param array $params Parâmetros para a condição
     * @return int Número de linhas afetadas
     */
    public static function update($table, $data, $condition, $params = []) {
        $setClauses = [];
        $updateParams = [];
        
        foreach ($data as $column => $value) {
            $setClauses[] = "$column = ?";
            $updateParams[] = $value;
        }
        
        $sql = sprintf(
            'UPDATE %s SET %s WHERE %s',
            $table,
            implode(', ', $setClauses),
            $condition
        );
        
        try {
            $stmt = self::getInstance()->prepare($sql);
            $stmt->execute(array_merge($updateParams, $params));
            return $stmt->rowCount();
        } catch (PDOException $e) {
            error_log('Erro na atualização: ' . $e->getMessage());
            throw new Exception('Erro ao atualizar dados');
        }
    }
    
    /**
     * Inicia uma transação
     * 
     * @return bool
     */
    public static function beginTransaction() {
        return self::getInstance()->beginTransaction();
    }
    
    /**
     * Confirma uma transação
     * 
     * @return bool
     */
    public static function commit() {
        return self::getInstance()->commit();
    }
    
    /**
     * Reverte uma transação
     * 
     * @return bool
     */
    public static function rollback() {
        return self::getInstance()->rollBack();
    }
    
    /**
     * Obtém um cliente de conexão com o Supabase
     * 
     * @param string $useKey Tipo de chave a ser usada: 'anon' ou 'service_role'
     * @return array|object Configuração ou cliente Supabase dependendo do ambiente
     */
    public static function getSupabaseClient($useKey = 'service_role') {
        $config = require __DIR__ . '/../config/supabase.php';
        
        // Verificar se as credenciais necessárias estão disponíveis
        if (empty($config['service_role_key'])) {
            error_log('ERRO: SUPABASE_SERVICE_ROLE_KEY não está definida no arquivo .env');
            throw new Exception('Configuração do Supabase incompleta: SUPABASE_SERVICE_ROLE_KEY não definida');
        }
        
        if (empty($config['jwt_secret'])) {
            error_log('ERRO: SUPABASE_JWT_SECRET não está definida no arquivo .env');
            throw new Exception('Configuração do Supabase incompleta: SUPABASE_JWT_SECRET não definida');
        }
        
        // Retornar configuração para uso com PDO
        $configArray = [
            'url' => $config['url'],
            'key' => $useKey === 'service_role' ? $config['service_role_key'] : $config['key'],
            'service_role_key' => $config['service_role_key'],
            'jwt_secret' => $config['jwt_secret'],
            'project_id' => $config['project_id'],
            'host' => parse_url($config['url'], PHP_URL_HOST),
            'port' => 5432,
            'database' => 'postgres',
            'username' => 'postgres',
            'password' => $config['service_role_key']
        ];
        
        // Verificar se a biblioteca Supabase PHP está instalada
        if (class_exists('\\Supabase\\Client')) {
            try {
                // Criar e retornar um cliente Supabase
                $key = $useKey === 'service_role' ? $config['service_role_key'] : $config['key'];
                $client = new \Supabase\Client($config['url'], $key);
                return $client;
            } catch (\Exception $e) {
                error_log('Erro ao criar cliente Supabase: ' . $e->getMessage());
                // Falhar silenciosamente e retornar configuração
            }
        }
        
        // Se a biblioteca não estiver disponível ou houve erro, retorna array de configuração
        return $configArray;
    }
}