# Script PowerShell para obter credenciais do Redis
# get-redis-credentials.ps1

Write-Host "🔧 Obtendo informações do Redis..." -ForegroundColor Cyan

try {
    # Obter endpoint do Redis
    Write-Host "📡 Buscando endpoint..." -ForegroundColor Yellow
    $endpoint = aws cloudformation describe-stacks `
        --stack-name AirDiscoveryCacheStack `
        --query 'Stacks[0].Outputs[?OutputKey==`RedisEndpoint`].OutputValue' `
        --output text

    if (-not $endpoint) {
        Write-Host "❌ Erro: Stack não encontrada ou endpoint não disponível" -ForegroundColor Red
        Write-Host "💡 Certifique-se de que o stack AirDiscoveryCacheStack foi deployado" -ForegroundColor Yellow
        exit 1
    }

    # Obter senha do Redis
    Write-Host "🔑 Buscando senha..." -ForegroundColor Yellow
    $secretJson = aws secretsmanager get-secret-value `
        --secret-id air-discovery-redis-auth-token `
        --query 'SecretString' `
        --output text

    if (-not $secretJson) {
        Write-Host "❌ Erro: Não foi possível obter a senha do Redis" -ForegroundColor Red
        exit 1
    }

    $secretObj = $secretJson | ConvertFrom-Json
    $password = $secretObj.'auth-token'

    # Exibir informações
    Write-Host "`n🎉 Informações do Redis:" -ForegroundColor Green
    Write-Host "─────────────────────────────────────" -ForegroundColor Gray
    Write-Host "🔗 Endpoint: $endpoint" -ForegroundColor White
    Write-Host "🔢 Porta: 6379" -ForegroundColor White
    Write-Host "🔑 Senha: $password" -ForegroundColor White
    Write-Host "─────────────────────────────────────" -ForegroundColor Gray

    # Comando redis-cli
    Write-Host "`n📋 Comando redis-cli:" -ForegroundColor Green
    Write-Host "redis-cli -h $endpoint -p 6379 -a `"$password`"" -ForegroundColor Cyan

    # Configuração Node.js
    Write-Host "`n🔧 Configuração Node.js:" -ForegroundColor Green
    Write-Host @"
const redis = new Redis({
  host: '$endpoint',
  port: 6379,
  password: '$password'
});
"@ -ForegroundColor Cyan

    # Salvar em arquivo para facilitar uso
    $configFile = "redis-config.json"
    $config = @{
        endpoint = $endpoint
        port = 6379
        password = $password
        connectionString = "redis://:$password@$endpoint:6379"
    } | ConvertTo-Json -Depth 2

    $config | Out-File -FilePath $configFile -Encoding UTF8
    Write-Host "`n💾 Configurações salvas em: $configFile" -ForegroundColor Green

    # Testar conectividade (opcional)
    Write-Host "`n🧪 Deseja testar a conectividade? (y/N): " -ForegroundColor Yellow -NoNewline
    $test = Read-Host
    
    if ($test -eq 'y' -or $test -eq 'Y') {
        Write-Host "🔍 Testando conexão..." -ForegroundColor Yellow
        
        # Verificar se redis-cli está disponível
        $redisCli = Get-Command redis-cli -ErrorAction SilentlyContinue
        
        if ($redisCli) {
            Write-Host "⏳ Executando PING no Redis..." -ForegroundColor Yellow
            $pingResult = & redis-cli -h $endpoint -p 6379 -a $password PING 2>&1
            
            if ($pingResult -eq "PONG") {
                Write-Host "✅ Conexão bem-sucedida! Redis respondeu com PONG" -ForegroundColor Green
            } else {
                Write-Host "❌ Falha na conexão: $pingResult" -ForegroundColor Red
            }
        } else {
            Write-Host "⚠️ redis-cli não encontrado. Instale o Redis CLI para testar a conexão." -ForegroundColor Yellow
            Write-Host "💡 Download: https://redis.io/download" -ForegroundColor Cyan
        }
    }

} catch {
    Write-Host "❌ Erro ao obter credenciais: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "💡 Verifique se:" -ForegroundColor Yellow
    Write-Host "   - AWS CLI está configurado" -ForegroundColor Yellow
    Write-Host "   - Você tem permissões para acessar CloudFormation e Secrets Manager" -ForegroundColor Yellow
    Write-Host "   - O stack AirDiscoveryCacheStack foi deployado" -ForegroundColor Yellow
    exit 1
}

Write-Host "`n🚀 Pronto para usar!" -ForegroundColor Green
