# WhatsApp Web Manager

Sistema completo para gerenciamento de WhatsApp Web com interface amigável para envio e recebimento de mensagens.

## Funcionalidades

- Conexão com WhatsApp via QR Code
- Visualização em tempo real de mensagens recebidas e enviadas
- Interface de chat organizada por contatos
- Envio de mensagens direto da interface web
- Captura de mensagens enviadas de outros dispositivos
- Identificação visual de diferentes tipos de mensagens
- Carregamento automático do histórico de conversas

## Tecnologias

- **Backend**: Node.js, Express, WhatsApp Web.js
- **Frontend**: HTML, CSS, JavaScript, Bootstrap 5
- **Contêineres**: Docker, Docker Compose
- **Servidor Web**: Apache com PHP

## Estrutura do Projeto

```
📁 src/
  📁 node/            # Servidor Node.js com WhatsApp Web API
    📄 server.js      # Servidor principal com API REST
  📁 php/             # Servidor web
    📁 html/          # Interface web
      📄 index.php    # Interface principal de usuário
📄 docker-compose.yml # Configuração dos containers
📄 Dockerfile.node    # Configuração do container Node.js
📄 Dockerfile.apache  # Configuração do container Apache+PHP
```

## Como usar

### Requisitos

- Docker
- Docker Compose

### Instalação e execução

1. Clone o repositório:
```bash
git clone https://github.com/seu-usuario/smart-chatbot-mb.git
cd smart-chatbot-mb
```

2. Inicie os contêineres:
```bash
docker-compose up -d
```

3. Acesse a interface web:
```
http://localhost:9030
```

4. Escaneie o QR Code com seu WhatsApp para conectar.

### Uso

- A página inicial exibirá um QR code para escanear com o aplicativo WhatsApp
- Após conectado, você verá uma lista de contatos com quem você conversou
- Clique em um contato para abrir o histórico de mensagens
- Use o campo de texto no modal para enviar novas mensagens
- O painel será atualizado automaticamente quando novas mensagens forem recebidas

## API

- `GET /api/status` - Verifica o status da conexão
- `GET /api/qrcode` - Obtém o QR code para conexão
- `POST /api/connect` - Inicia o processo de conexão
- `POST /api/disconnect` - Desconecta o WhatsApp
- `POST /api/send` - Envia uma mensagem
- `GET /api/messages` - Obtém todas as mensagens
- `GET /api/messages/:number` - Obtém mensagens de um número específico
- `DELETE /api/messages` - Limpa todas as mensagens armazenadas

## Licença

Este projeto está licenciado sob a licença MIT - veja o arquivo LICENSE para detalhes.

## Autor

Seu Nome