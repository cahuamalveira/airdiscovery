# AIR Discovery - React + Vite

Este projeto foi migrado do Create React App para [Vite](https://vitejs.dev/) para melhor performance e experiência de desenvolvimento.

## Scripts Disponíveis

No diretório do projeto, você pode executar:

### `npm run dev`

Executa o app em modo de desenvolvimento.\
Abra [http://localhost:3000](http://localhost:3000) para visualizá-lo no seu navegador.

A página recarregará automaticamente quando você fizer mudanças.\
Você também verá erros de lint no console.

### `npm test`

Executa os testes usando Vitest.\
Veja a seção sobre [running tests](https://vitest.dev/) para mais informações.

### `npm run build`

Compila o app para produção na pasta `build`.\
Ele corretamente empacota o React em modo de produção e otimiza a build para melhor performance.

A build é minificada e os nomes dos arquivos incluem hashes.\
Seu app está pronto para ser deployado!

### `npm run preview`

Visualiza a build de produção localmente.

### `npm run lint`

Executa o ESLint para verificar problemas no código.

## Migração para Vite

Este projeto foi migrado do Create React App para Vite. As principais mudanças incluem:

- Scripts atualizados (`npm run dev` ao invés de `npm start`)
- Configuração do Vite (`vite.config.js`)
- Vitest para testes ao invés de Jest
- ESLint configurado para módulos ES
- Variáveis de ambiente devem usar prefixo `VITE_`

## Variáveis de Ambiente

Para usar variáveis de ambiente, crie um arquivo `.env` baseado no `.env.example` e use o prefixo `VITE_` para as variáveis que devem ser acessíveis no frontend.

## Learn More

You can learn more in the [Create React App documentation](https://facebook.github.io/create-react-app/docs/getting-started).

To learn React, check out the [React documentation](https://reactjs.org/).

### Code Splitting

This section has moved here: [https://facebook.github.io/create-react-app/docs/code-splitting](https://facebook.github.io/create-react-app/docs/code-splitting)

### Analyzing the Bundle Size

This section has moved here: [https://facebook.github.io/create-react-app/docs/analyzing-the-bundle-size](https://facebook.github.io/create-react-app/docs/analyzing-the-bundle-size)

### Making a Progressive Web App

This section has moved here: [https://facebook.github.io/create-react-app/docs/making-a-progressive-web-app](https://facebook.github.io/create-react-app/docs/making-a-progressive-web-app)

### Advanced Configuration

This section has moved here: [https://facebook.github.io/create-react-app/docs/advanced-configuration](https://facebook.github.io/create-react-app/docs/advanced-configuration)

### Deployment

This section has moved here: [https://facebook.github.io/create-react-app/docs/deployment](https://facebook.github.io/create-react-app/docs/deployment)

### `npm run build` fails to minify

This section has moved here: [https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify](https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify)
