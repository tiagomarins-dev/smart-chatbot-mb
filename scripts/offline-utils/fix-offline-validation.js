#!/usr/bin/env node

/**
 * Script para corrigir a validação de modo offline em todos os controladores
 * Este script modifica os arquivos TypeScript para remover a verificação de NODE_TLS_REJECT_UNAUTHORIZED
 */

const fs = require('fs');
const path = require('path');

// Diretório base
const baseDir = '/Users/tiagomarins/Projetos/claudeai/smart-chatbot-mb';

// Diretórios a serem percorridos
const dirs = [
  path.join(baseDir, 'backend/src/controllers'),
  path.join(baseDir, 'backend/src/middleware')
];

// Padrão a ser encontrado (usando expressão regular para flexibilidade)
const pattern = /const\s+OFFLINE_MODE\s*=\s*process\.env\.SUPABASE_OFFLINE_MODE\s*===\s*['"]true['"]\s*\|\|\s*process\.env\.NODE_TLS_REJECT_UNAUTHORIZED\s*===\s*['"]0['"]\s*;/g;

// Substituição
const replacement = `const OFFLINE_MODE = process.env.SUPABASE_OFFLINE_MODE === 'true';
    // Log para debug
    console.log('SUPABASE_OFFLINE_MODE =', process.env.SUPABASE_OFFLINE_MODE);
    console.log('Modo offline está:', OFFLINE_MODE ? 'ATIVADO' : 'DESATIVADO');`;

// Função para processar um arquivo
function processFile(filePath) {
  console.log(`Processando: ${filePath}`);
  
  try {
    // Lê o conteúdo do arquivo
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Verifica se o padrão existe no arquivo
    if (pattern.test(content)) {
      // Conta quantas vezes o padrão aparece
      const matches = content.match(pattern);
      console.log(`  Encontrou ${matches ? matches.length : 0} ocorrências do padrão`);
      
      // Substitui todas as ocorrências
      const newContent = content.replace(pattern, replacement);
      
      // Escreve o conteúdo modificado de volta ao arquivo
      fs.writeFileSync(filePath, newContent, 'utf8');
      console.log(`  Arquivo atualizado com sucesso!`);
    } else {
      console.log(`  Nenhuma ocorrência encontrada.`);
    }
  } catch (error) {
    console.error(`  Erro ao processar arquivo: ${error.message}`);
  }
}

// Função para percorrer diretórios recursivamente
function processDirectory(dir) {
  const files = fs.readdirSync(dir);
  
  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      // Recursivamente processa subdiretórios
      processDirectory(filePath);
    } else if (file.endsWith('.ts')) {
      // Processa apenas arquivos TypeScript
      processFile(filePath);
    }
  }
}

// Processa todos os diretórios especificados
console.log('Iniciando correção da validação de modo offline...');
dirs.forEach(dir => {
  console.log(`\nProcessando diretório: ${dir}`);
  if (fs.existsSync(dir)) {
    processDirectory(dir);
  } else {
    console.error(`Diretório não encontrado: ${dir}`);
  }
});

console.log('\nProcessamento concluído!');
console.log('Agora reconstrua o backend para aplicar as alterações:');
console.log('./rebuild-backend.sh');