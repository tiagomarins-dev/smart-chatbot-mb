import swaggerJSDoc from 'swagger-jsdoc';
import { version } from '../package.json';

const options: swaggerJSDoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Smart-ChatBox API',
      version,
      description: 'API para gerenciamento de empresas, projetos, leads e autenticação.',
      contact: {
        name: 'Tiago Marins',
        url: 'https://github.com/tiagomarins-dev/smart-chatbot-mb',
      },
    },
    servers: [
      {
        url: '/',
        description: 'Servidor atual',
      },
      {
        url: '/api',
        description: 'Servidor de produção',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Entre com seu token JWT',
        },
        apiKeyAuth: {
          type: 'apiKey',
          in: 'header',
          name: 'Authorization',
          description: 'Entre com sua chave API no formato: "Bearer api_xxxxxxxx"',
        },
        apiKeyQuery: {
          type: 'apiKey',
          in: 'query',
          name: 'api_key',
          description: 'Entre com sua chave API como parâmetro de consulta',
        },
      },
      schemas: {
        // Auth schemas
        AuthResponse: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: true,
            },
            data: {
              type: 'object',
              properties: {
                user: {
                  type: 'object',
                  properties: {
                    id: {
                      type: 'string',
                      format: 'uuid',
                      example: '123e4567-e89b-12d3-a456-426614174000',
                    },
                    email: {
                      type: 'string',
                      format: 'email',
                      example: 'usuario@exemplo.com',
                    },
                    role: {
                      type: 'string',
                      example: 'user',
                    },
                    name: {
                      type: 'string',
                      example: 'João Silva',
                    },
                  },
                },
                token: {
                  type: 'string',
                  example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
                },
                session: {
                  type: 'object',
                  example: {},
                },
              },
            },
            statusCode: {
              type: 'number',
              example: 200,
            },
          },
        },

        // Company schemas
        Company: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
              example: '123e4567-e89b-12d3-a456-426614174000',
            },
            user_id: {
              type: 'string',
              format: 'uuid',
              example: '123e4567-e89b-12d3-a456-426614174000',
            },
            name: {
              type: 'string',
              example: 'Milla Borges',
            },
            is_active: {
              type: 'boolean',
              example: true,
            },
            created_at: {
              type: 'string',
              format: 'date-time',
              example: '2025-05-04T12:00:00Z',
            },
            updated_at: {
              type: 'string',
              format: 'date-time',
              example: '2025-05-04T12:00:00Z',
            },
          },
        },

        // Project schemas
        Project: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
              example: '123e4567-e89b-12d3-a456-426614174000',
            },
            user_id: {
              type: 'string',
              format: 'uuid',
              example: '123e4567-e89b-12d3-a456-426614174000',
            },
            company_id: {
              type: 'string',
              format: 'uuid',
              example: '123e4567-e89b-12d3-a456-426614174000',
            },
            name: {
              type: 'string',
              example: 'Campanha de Verão',
            },
            description: {
              type: 'string',
              example: 'Campanha de marketing para o verão de 2025',
            },
            status: {
              type: 'string',
              enum: ['em_planejamento', 'em_andamento', 'pausado', 'concluido', 'cancelado'],
              example: 'em_andamento',
            },
            campaign_start_date: {
              type: 'string',
              format: 'date',
              example: '2025-06-01',
            },
            campaign_end_date: {
              type: 'string',
              format: 'date',
              example: '2025-08-31',
            },
            start_date: {
              type: 'string',
              format: 'date',
              description: 'Campo legado - use campaign_start_date',
              example: '2025-06-01',
            },
            end_date: {
              type: 'string',
              format: 'date',
              description: 'Campo legado - use campaign_end_date',
              example: '2025-08-31',
            },
            views_count: {
              type: 'integer',
              example: 42,
            },
            is_active: {
              type: 'boolean',
              example: true,
            },
            created_at: {
              type: 'string',
              format: 'date-time',
              example: '2025-05-04T12:00:00Z',
            },
            updated_at: {
              type: 'string',
              format: 'date-time',
              example: '2025-05-04T12:00:00Z',
            },
          },
        },

        // Lead schemas
        Lead: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
              example: '123e4567-e89b-12d3-a456-426614174000',
            },
            user_id: {
              type: 'string',
              format: 'uuid',
              example: '123e4567-e89b-12d3-a456-426614174000',
            },
            name: {
              type: 'string',
              example: 'João da Silva',
            },
            first_name: {
              type: 'string',
              example: 'João',
            },
            email: {
              type: 'string',
              format: 'email',
              example: 'joao@exemplo.com',
            },
            phone: {
              type: 'string',
              example: '5521999998877',
            },
            status: {
              type: 'string',
              enum: ['novo', 'qualificado', 'contatado', 'convertido', 'desistiu', 'inativo'],
              example: 'novo',
            },
            notes: {
              type: 'string',
              example: 'Lead interessado em serviço premium',
            },
            created_at: {
              type: 'string',
              format: 'date-time',
              example: '2025-05-04T12:00:00Z',
            },
            updated_at: {
              type: 'string',
              format: 'date-time',
              example: '2025-05-04T12:00:00Z',
            },
          },
        },

        // Contact schemas
        Contact: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
              example: '123e4567-e89b-12d3-a456-426614174000',
            },
            user_id: {
              type: 'string',
              format: 'uuid',
              example: '123e4567-e89b-12d3-a456-426614174000',
            },
            phone_number: {
              type: 'string',
              example: '5521999998877',
            },
            name: {
              type: 'string',
              example: 'João da Silva',
            },
            first_name: {
              type: 'string',
              example: 'João',
            },
            last_name: {
              type: 'string',
              example: 'Silva',
            },
            email: {
              type: 'string',
              format: 'email',
              example: 'joao@exemplo.com',
            },
            profile_image_url: {
              type: 'string',
              format: 'uri',
              example: 'https://example.com/profile.jpg',
            },
            is_blocked: {
              type: 'boolean',
              example: false,
            },
            tags: {
              type: 'array',
              items: {
                type: 'string',
              },
              example: ['cliente', 'vip'],
            },
            custom_fields: {
              type: 'object',
              example: {
                empresa: 'ACME Inc.',
                cargo: 'Gerente',
              },
            },
            last_message_at: {
              type: 'string',
              format: 'date-time',
              example: '2025-05-04T14:30:00Z',
            },
            created_at: {
              type: 'string',
              format: 'date-time',
              example: '2025-05-04T12:00:00Z',
            },
            updated_at: {
              type: 'string',
              format: 'date-time',
              example: '2025-05-04T12:00:00Z',
            },
          },
        },

        // API Key schemas
        ApiKey: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
              example: '123e4567-e89b-12d3-a456-426614174000',
            },
            user_id: {
              type: 'string',
              format: 'uuid',
              example: '123e4567-e89b-12d3-a456-426614174000',
            },
            name: {
              type: 'string',
              example: 'Integração Website',
            },
            key_value: {
              type: 'string',
              example: 'api_xxxxxxxxxxxxxxxx',
            },
            permissions: {
              type: 'array',
              items: {
                type: 'string',
              },
              example: ['read:projects', 'write:leads'],
            },
            rate_limit: {
              type: 'integer',
              example: 100,
            },
            is_active: {
              type: 'boolean',
              example: true,
            },
            created_at: {
              type: 'string',
              format: 'date-time',
              example: '2025-05-04T12:00:00Z',
            },
            updated_at: {
              type: 'string',
              format: 'date-time',
              example: '2025-05-04T12:00:00Z',
            },
            expires_at: {
              type: 'string',
              format: 'date-time',
              example: '2026-05-04T12:00:00Z',
            },
            last_used_at: {
              type: 'string',
              format: 'date-time',
              example: '2025-05-06T15:30:00Z',
            },
          },
        },
        
        ApiKeyInput: {
          type: 'object',
          required: ['name'],
          properties: {
            name: {
              type: 'string',
              example: 'Integração Website',
            },
            permissions: {
              type: 'array',
              items: {
                type: 'string',
              },
              example: ['read:projects', 'write:leads'],
            },
            rate_limit: {
              type: 'integer',
              example: 100,
            },
            expires_at: {
              type: 'string',
              format: 'date-time',
              example: '2026-05-04T12:00:00Z',
            },
          },
        },
        
        ApiKeyCreationResponse: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: true,
            },
            data: {
              type: 'object',
              properties: {
                api_key: {
                  $ref: '#/components/schemas/ApiKey',
                },
                secret: {
                  type: 'string',
                  description: 'Secret da API key (exibido apenas uma vez)',
                  example: 'secret_xxxxxxxxxxxxxxxxxxxxxxxx',
                },
                warning: {
                  type: 'string',
                  example: 'O segredo (secret) não será exibido novamente. Salve-o em um local seguro.',
                },
              },
            },
            statusCode: {
              type: 'number',
              example: 201,
            },
          },
        },
        
        ApiKeyUpdateInput: {
          type: 'object',
          properties: {
            name: {
              type: 'string',
              example: 'Integração Website Atualizada',
            },
            permissions: {
              type: 'array',
              items: {
                type: 'string',
              },
              example: ['read:projects', 'write:leads', 'read:companies'],
            },
            rate_limit: {
              type: 'integer',
              example: 200,
            },
            expires_at: {
              type: 'string',
              format: 'date-time',
              example: '2026-05-04T12:00:00Z',
            },
            is_active: {
              type: 'boolean',
              example: true,
            },
          },
        },

        // Common responses
        ErrorResponse: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: false,
            },
            error: {
              type: 'string',
              example: 'Mensagem de erro',
            },
            statusCode: {
              type: 'number',
              example: 400,
            },
          },
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
      {
        apiKeyAuth: [],
      },
      {
        apiKeyQuery: [],
      },
    ],
  },
  // Caminhos para os arquivos de API para escanear comentários JSDoc
  apis: [
    './src/routes/*.ts',
    './src/controllers/*.ts',
  ],
};

const swaggerSpec = swaggerJSDoc(options);

export default swaggerSpec;