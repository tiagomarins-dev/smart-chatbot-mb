# IMPORTANT NOTES

## WhatsApp API Service

**CRITICAL**: The WhatsApp API is NOT part of this project. It is a separate, external service that runs locally.

### Key Points:
- The WhatsApp API runs as an independent service outside this repository
- It should NOT be installed via Docker Compose in this project
- It should NOT be included in the project's docker-compose.yml
- The backend communicates with it as an external API endpoint
- Treat it like any other third-party service (similar to OpenAI API)

### Configuration:
- The backend connects to the WhatsApp API via HTTP requests
- Connection details should be configured via environment variables
- No WhatsApp-specific code or dependencies should be added to this project

### What NOT to do:
- Do NOT add whatsapp-web.js or similar dependencies to package.json
- Do NOT create Docker containers for WhatsApp in this project
- Do NOT attempt to integrate WhatsApp code directly into the backend

This separation ensures clean architecture and prevents licensing/deployment issues.