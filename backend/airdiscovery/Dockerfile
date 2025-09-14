FROM node:22-alpine AS builder

LABEL maintainer="airdiscovery-team"
LABEL stage="builder"

# Instalar dumb-init para gerenciamento seguro de processos
RUN apk add --no-cache dumb-init=1.2.5-r3

# Criar usuário não-root para o build
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nestjs -u 1001

# Definir diretório de trabalho
WORKDIR /usr/src/app

# Copiar arquivos de dependências primeiro (para cache layer)
COPY --chown=nestjs:nodejs package*.json ./
COPY --chown=nestjs:nodejs tsconfig*.json ./
COPY --chown=nestjs:nodejs nest-cli.json ./

# Mudar para usuário não-root
USER nestjs

# Instalar dependências
RUN npm ci --only=production && npm cache clean --force

# Copiar código fonte
COPY --chown=nestjs:nodejs src/ ./src/

# Build da aplicação
RUN npm run build

# ================================
# Estágio 2: Runtime (Produção)
# ================================
FROM node:20-alpine AS runtime

# Metadados
LABEL maintainer="airdiscovery-team"
LABEL stage="runtime"
LABEL version="1.0.0"

# Instalar apenas o necessário e dumb-init
RUN apk add --no-cache \
    dumb-init=1.2.5-r3 \
    && rm -rf /var/cache/apk/*

# Criar usuário não-root para produção
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nestjs -u 1001

# Definir diretório de trabalho
WORKDIR /home/nestjs/app

# Copiar dependências de produção do estágio anterior
COPY --from=builder --chown=nestjs:nodejs /usr/src/app/node_modules ./node_modules

# Copiar aplicação buildada
COPY --from=builder --chown=nestjs:nodejs /usr/src/app/dist ./dist
COPY --from=builder --chown=nestjs:nodejs /usr/src/app/package*.json ./

# Criar diretórios necessários com permissões adequadas
RUN mkdir -p /home/nestjs/app/logs && \
    chown -R nestjs:nodejs /home/nestjs/app

# Mudar para usuário não-root
USER nestjs

# Variáveis de ambiente para segurança
ENV NODE_ENV=production
ENV NPM_CONFIG_UPDATE_NOTIFIER=false
ENV NPM_CONFIG_FUND=false
ENV NPM_CONFIG_AUDIT_LEVEL=high

# Expor porta (não privilegiada)
EXPOSE 3000

# Usar dumb-init como processo init e rodar como usuário não-root
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "dist/main"]