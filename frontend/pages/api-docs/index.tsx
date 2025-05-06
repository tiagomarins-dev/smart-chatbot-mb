import React from 'react';
import Layout from '../../src/components/layout/Layout';
import Link from 'next/link';

const ApiDocsPage: React.FC = () => {
  return (
    <Layout title="Documentação da API | Smart-ChatBox">
      <div className="container py-4">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <div>
            <h1 className="fw-bold" style={{ color: '#7e57c2' }}>Documentação da API</h1>
            <p className="text-muted">Guia para usar a API do Smart-ChatBox</p>
          </div>
          
          <Link href="/api-keys" className="btn btn-outline-primary">
            <i className="bi bi-key me-2"></i>
            Gerenciar API Keys
          </Link>
        </div>
        
        {/* Introdução */}
        <div className="card mb-4 border-0 shadow-sm">
          <div className="card-body">
            <h2 className="fs-4 mb-3">Introdução</h2>
            <p>
              A API do Smart-ChatBox permite que você integre suas aplicações com nossa plataforma.
              Você pode gerenciar empresas, projetos, leads e muito mais programaticamente.
            </p>
            <p>
              Todas as requisições devem ser autenticadas usando uma chave de API válida. 
              Caso ainda não tenha uma chave, acesse a página de <Link href="/api-keys">API Keys</Link> para gerar.
            </p>
          </div>
        </div>
        
        {/* Autenticação */}
        <div className="card mb-4 border-0 shadow-sm">
          <div className="card-body">
            <h2 className="fs-4 mb-3">Autenticação</h2>
            <p>
              A autenticação é realizada via token Bearer no cabeçalho HTTP Authorization. Você pode usar uma chave de API ou um token JWT para autenticação.
            </p>
            
            <h5 className="mt-4">Usando API Keys</h5>
            
            <div className="bg-light p-3 rounded mb-3">
              <pre className="mb-0"><code>
                {`Authorization: Bearer api_xxxxxxxxxxxxxxxx`}
              </code></pre>
            </div>
            
            <p>
              Alternativamente, você pode passar a chave como um parâmetro na query string:
            </p>
            
            <div className="bg-light p-3 rounded mb-3">
              <pre className="mb-0"><code>
                {`GET /api/v1/projects?api_key=api_xxxxxxxxxxxxxxxx`}
              </code></pre>
            </div>
            
            <h5 className="mt-4">Obtendo uma API Key</h5>
            
            <p>
              Para obter uma API Key, acesse a <Link href="/api-keys">página de gerenciamento de API Keys</Link> e clique em "Nova API Key". Guarde o segredo (secret) em um local seguro, pois ele não será exibido novamente.
            </p>
            
            <div className="alert alert-warning">
              <i className="bi bi-exclamation-triangle-fill me-2"></i>
              <strong>Importante:</strong> Nunca compartilhe suas chaves de API ou inclua-as em código-fonte público.
            </div>
          </div>
        </div>
        
        {/* Endpoints de Projetos */}
        <div className="card mb-4 border-0 shadow-sm">
          <div className="card-header bg-white">
            <h2 className="fs-4 mb-0">Projetos</h2>
          </div>
          <div className="card-body">
            <div className="mb-4">
              <div className="d-flex align-items-center mb-2">
                <span className="badge bg-success me-2">GET</span>
                <code>/api/v1/projects</code>
              </div>
              <p className="text-muted">Listar todos os projetos</p>
              
              <h6 className="mt-3">Parâmetros de Query:</h6>
              <table className="table table-sm">
                <thead>
                  <tr>
                    <th>Nome</th>
                    <th>Tipo</th>
                    <th>Descrição</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td><code>company_id</code></td>
                    <td>string</td>
                    <td>Filtrar projetos por empresa</td>
                  </tr>
                  <tr>
                    <td><code>is_active</code></td>
                    <td>boolean</td>
                    <td>Filtrar por status ativo/inativo</td>
                  </tr>
                </tbody>
              </table>
              
              <h6 className="mt-3">Exemplo de Resposta:</h6>
              <div className="bg-light p-3 rounded">
                <pre style={{maxHeight: "300px", overflow: "auto"}}><code>{`
{
  "success": true,
  "data": {
    "projects": [
      {
        "id": "123456",
        "user_id": "user123",
        "company_id": "comp123",
        "name": "Projeto Website",
        "description": "Novo site institucional",
        "status": "em_andamento",
        "campaign_start_date": "2023-10-01",
        "campaign_end_date": "2023-12-31",
        "views_count": 45,
        "is_active": true,
        "created_at": "2023-09-15T10:30:00Z",
        "updated_at": "2023-10-20T15:45:00Z"
      },
      // ...mais projetos
    ]
  }
}
                `}</code></pre>
              </div>
            </div>
            
            <hr className="my-4" />
            
            <div className="mb-4">
              <div className="d-flex align-items-center mb-2">
                <span className="badge bg-success me-2">GET</span>
                <code>/api/v1/projects/{'{id}'}</code>
              </div>
              <p className="text-muted">Obter um projeto específico por ID</p>
              
              <h6 className="mt-3">Parâmetros de URL:</h6>
              <table className="table table-sm">
                <thead>
                  <tr>
                    <th>Nome</th>
                    <th>Tipo</th>
                    <th>Descrição</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td><code>id</code></td>
                    <td>string</td>
                    <td>ID do projeto</td>
                  </tr>
                </tbody>
              </table>
              
              <h6 className="mt-3">Exemplo de Resposta:</h6>
              <div className="bg-light p-3 rounded">
                <pre style={{maxHeight: "300px", overflow: "auto"}}><code>{`
{
  "success": true,
  "data": {
    "project": {
      "id": "123456",
      "user_id": "user123",
      "company_id": "comp123",
      "name": "Projeto Website",
      "description": "Novo site institucional",
      "status": "em_andamento",
      "campaign_start_date": "2023-10-01",
      "campaign_end_date": "2023-12-31",
      "views_count": 45,
      "is_active": true,
      "created_at": "2023-09-15T10:30:00Z",
      "updated_at": "2023-10-20T15:45:00Z"
    }
  }
}
                `}</code></pre>
              </div>
            </div>
            
            <hr className="my-4" />
            
            <div className="mb-4">
              <div className="d-flex align-items-center mb-2">
                <span className="badge bg-primary me-2">POST</span>
                <code>/api/v1/projects</code>
              </div>
              <p className="text-muted">Criar um novo projeto</p>
              
              <h6 className="mt-3">Corpo da Requisição:</h6>
              <div className="bg-light p-3 rounded mb-3">
                <pre><code>{`
{
  "name": "Novo Projeto",
  "company_id": "comp123",
  "description": "Descrição do projeto",
  "status": "em_planejamento",
  "campaign_start_date": "2023-12-01",
  "campaign_end_date": "2024-03-31"
}
                `}</code></pre>
              </div>
              
              <h6>Exemplo de Resposta:</h6>
              <div className="bg-light p-3 rounded">
                <pre style={{maxHeight: "300px", overflow: "auto"}}><code>{`
{
  "success": true,
  "data": {
    "project": {
      "id": "789012",
      "user_id": "user123",
      "company_id": "comp123",
      "name": "Novo Projeto",
      "description": "Descrição do projeto",
      "status": "em_planejamento",
      "campaign_start_date": "2023-12-01",
      "campaign_end_date": "2024-03-31",
      "views_count": 0,
      "is_active": true,
      "created_at": "2023-11-10T14:22:33Z",
      "updated_at": "2023-11-10T14:22:33Z"
    }
  }
}
                `}</code></pre>
              </div>
            </div>
            
            <hr className="my-4" />
            
            <div className="mb-4">
              <div className="d-flex align-items-center mb-2">
                <span className="badge bg-warning text-dark me-2">PUT</span>
                <code>/api/v1/projects/{'{id}'}</code>
              </div>
              <p className="text-muted">Atualizar um projeto existente</p>
              
              <h6 className="mt-3">Parâmetros de URL:</h6>
              <table className="table table-sm">
                <thead>
                  <tr>
                    <th>Nome</th>
                    <th>Tipo</th>
                    <th>Descrição</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td><code>id</code></td>
                    <td>string</td>
                    <td>ID do projeto</td>
                  </tr>
                </tbody>
              </table>
              
              <h6 className="mt-3">Corpo da Requisição:</h6>
              <div className="bg-light p-3 rounded mb-3">
                <pre><code>{`
{
  "name": "Projeto Atualizado",
  "description": "Nova descrição do projeto",
  "status": "em_andamento",
  "campaign_start_date": "2023-12-01",
  "campaign_end_date": "2024-03-31",
  "is_active": true
}
                `}</code></pre>
              </div>
              
              <h6>Exemplo de Resposta:</h6>
              <div className="bg-light p-3 rounded">
                <pre style={{maxHeight: "300px", overflow: "auto"}}><code>{`
{
  "success": true,
  "data": {
    "project": {
      "id": "123456",
      "user_id": "user123",
      "company_id": "comp123",
      "name": "Projeto Atualizado",
      "description": "Nova descrição do projeto",
      "status": "em_andamento",
      "campaign_start_date": "2023-12-01",
      "campaign_end_date": "2024-03-31",
      "views_count": 45,
      "is_active": true,
      "created_at": "2023-09-15T10:30:00Z",
      "updated_at": "2023-11-10T16:45:12Z"
    }
  }
}
                `}</code></pre>
              </div>
            </div>
            
            <hr className="my-4" />
            
            <div>
              <div className="d-flex align-items-center mb-2">
                <span className="badge bg-danger me-2">DELETE</span>
                <code>/api/v1/projects/{'{id}'}</code>
              </div>
              <p className="text-muted">Desativar um projeto (soft delete)</p>
              
              <h6 className="mt-3">Parâmetros de URL:</h6>
              <table className="table table-sm">
                <thead>
                  <tr>
                    <th>Nome</th>
                    <th>Tipo</th>
                    <th>Descrição</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td><code>id</code></td>
                    <td>string</td>
                    <td>ID do projeto</td>
                  </tr>
                </tbody>
              </table>
              
              <h6 className="mt-3">Exemplo de Resposta:</h6>
              <div className="bg-light p-3 rounded">
                <pre style={{maxHeight: "300px", overflow: "auto"}}><code>{`
{
  "success": true,
  "message": "Projeto desativado com sucesso"
}
                `}</code></pre>
              </div>
            </div>
          </div>
        </div>
        
        {/* Exemplos de Código */}
        <div className="card mb-4 border-0 shadow-sm">
          <div className="card-header bg-white">
            <h2 className="fs-4 mb-0">Exemplos de Código</h2>
          </div>
          <div className="card-body">
            <h5 className="mb-3">Exemplo com cURL</h5>
            <div className="bg-light p-3 rounded mb-4">
              <pre><code>{`
# Listar todos os projetos
curl -X GET \\
  'https://api.exemplo.com/api/v1/projects' \\
  -H 'Authorization: Bearer api_xxxxxxxxxxxxxxxx'

# Obter um projeto específico
curl -X GET \\
  'https://api.exemplo.com/api/v1/projects/123456' \\
  -H 'Authorization: Bearer api_xxxxxxxxxxxxxxxx'

# Criar um novo projeto
curl -X POST \\
  'https://api.exemplo.com/api/v1/projects' \\
  -H 'Authorization: Bearer api_xxxxxxxxxxxxxxxx' \\
  -H 'Content-Type: application/json' \\
  -d '{
    "name": "Novo Projeto",
    "company_id": "comp123",
    "description": "Descrição do projeto",
    "status": "em_planejamento",
    "campaign_start_date": "2023-12-01",
    "campaign_end_date": "2024-03-31"
  }'

# Atualizar um projeto existente
curl -X PUT \\
  'https://api.exemplo.com/api/v1/projects/123456' \\
  -H 'Authorization: Bearer api_xxxxxxxxxxxxxxxx' \\
  -H 'Content-Type: application/json' \\
  -d '{
    "name": "Projeto Atualizado",
    "status": "em_andamento"
  }'

# Desativar um projeto
curl -X DELETE \\
  'https://api.exemplo.com/api/v1/projects/123456' \\
  -H 'Authorization: Bearer api_xxxxxxxxxxxxxxxx'
              `}</code></pre>
            </div>
            
            <h5 className="mb-3">Exemplo com JavaScript (Node.js)</h5>
            <div className="bg-light p-3 rounded mb-4">
              <pre><code>{`
const axios = require('axios');

const API_KEY = 'api_xxxxxxxxxxxxxxxx';
const API_URL = 'https://api.exemplo.com/api/v1';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Authorization': \`Bearer \${API_KEY}\`,
    'Content-Type': 'application/json'
  }
});

// Listar todos os projetos
async function getProjects() {
  try {
    const response = await api.get('/projects');
    return response.data;
  } catch (error) {
    console.error('Erro ao buscar projetos:', error);
    throw error;
  }
}

// Criar um novo projeto
async function createProject(projectData) {
  try {
    const response = await api.post('/projects', projectData);
    return response.data;
  } catch (error) {
    console.error('Erro ao criar projeto:', error);
    throw error;
  }
}

// Atualizar um projeto
async function updateProject(projectId, projectData) {
  try {
    const response = await api.put(\`/projects/\${projectId}\`, projectData);
    return response.data;
  } catch (error) {
    console.error('Erro ao atualizar projeto:', error);
    throw error;
  }
}
              `}</code></pre>
            </div>
            
            <h5 className="mb-3">Exemplo com Python</h5>
            <div className="bg-light p-3 rounded">
              <pre><code>{`
import requests

API_KEY = 'api_xxxxxxxxxxxxxxxx'
API_URL = 'https://api.exemplo.com/api/v1'

headers = {
    'Authorization': f'Bearer {API_KEY}',
    'Content-Type': 'application/json'
}

# Listar todos os projetos
def get_projects():
    try:
        response = requests.get(f'{API_URL}/projects', headers=headers)
        response.raise_for_status()
        return response.json()
    except requests.exceptions.RequestException as e:
        print(f'Erro ao buscar projetos: {e}')
        raise

# Criar um novo projeto
def create_project(project_data):
    try:
        response = requests.post(
            f'{API_URL}/projects', 
            headers=headers,
            json=project_data
        )
        response.raise_for_status()
        return response.json()
    except requests.exceptions.RequestException as e:
        print(f'Erro ao criar projeto: {e}')
        raise

# Atualizar um projeto
def update_project(project_id, project_data):
    try:
        response = requests.put(
            f'{API_URL}/projects/{project_id}', 
            headers=headers,
            json=project_data
        )
        response.raise_for_status()
        return response.json()
    except requests.exceptions.RequestException as e:
        print(f'Erro ao atualizar projeto: {e}')
        raise
              `}</code></pre>
            </div>
          </div>
        </div>
        
        {/* Erros e Códigos de Status */}
        <div className="card border-0 shadow-sm">
          <div className="card-header bg-white">
            <h2 className="fs-4 mb-0">Erros e Códigos de Status</h2>
          </div>
          <div className="card-body">
            <p>A API retorna códigos de status HTTP padrão:</p>
            
            <table className="table">
              <thead>
                <tr>
                  <th>Código</th>
                  <th>Descrição</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td><code>200 OK</code></td>
                  <td>A solicitação foi bem-sucedida.</td>
                </tr>
                <tr>
                  <td><code>201 Created</code></td>
                  <td>O recurso foi criado com sucesso.</td>
                </tr>
                <tr>
                  <td><code>400 Bad Request</code></td>
                  <td>A solicitação é inválida ou malformada.</td>
                </tr>
                <tr>
                  <td><code>401 Unauthorized</code></td>
                  <td>A autenticação falhou ou não foi fornecida.</td>
                </tr>
                <tr>
                  <td><code>403 Forbidden</code></td>
                  <td>O cliente não tem permissão para acessar o recurso.</td>
                </tr>
                <tr>
                  <td><code>404 Not Found</code></td>
                  <td>O recurso solicitado não foi encontrado.</td>
                </tr>
                <tr>
                  <td><code>500 Internal Server Error</code></td>
                  <td>Ocorreu um erro no servidor.</td>
                </tr>
              </tbody>
            </table>
            
            <h5 className="mt-4">Formato de Erro</h5>
            <p>Quando ocorre um erro, a API retorna uma resposta com a seguinte estrutura:</p>
            
            <div className="bg-light p-3 rounded">
              <pre><code>{`
{
  "success": false,
  "error": "Mensagem de erro descritiva",
  "statusCode": 400
}
              `}</code></pre>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default ApiDocsPage;