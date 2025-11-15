#!/bin/sh
# ================================
# Script de verificação de segurança do container
# ================================

echo "🔍 Verificando configurações de segurança..."

# Verificar se não está rodando como root
if [ "$(id -u)" = "0" ]; then
    echo "❌ ERRO: Container está rodando como root!"
    exit 1
else
    echo "✅ Container rodando como usuário não-root ($(whoami))"
fi

# Verificar se o Node.js está em modo de produção
if [ "$NODE_ENV" != "production" ]; then
    echo "⚠️  AVISO: NODE_ENV não está definido como 'production'"
else
    echo "✅ NODE_ENV configurado como production"
fi

# Verificar permissões do diretório
if [ -w "/home/nestjs/app" ]; then
    echo "✅ Permissões de escrita adequadas"
else
    echo "❌ ERRO: Sem permissões de escrita necessárias"
    exit 1
fi

echo "🎉 Verificações de segurança concluídas com sucesso!"
