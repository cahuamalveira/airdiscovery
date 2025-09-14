# Sumário

1. [Introdução](#1-introdução)
2. [Requisitos Funcionais (RF)](#2-requisitos-funcionais-rf)
    - 2.1. [Módulo de Acesso e Autenticação de Usuário](#21-módulo-de-acesso-e-autenticação-de-usuário)
    - 2.2. [Módulo de Interação com a Inteligência Artificial (Chatbot de Perfil)](#22-módulo-de-interação-com-a-inteligência-artificial-chatbot-de-perfil)
    - 2.3. [Módulo de Recomendação de Destinos e Roteiros](#23-módulo-de-recomendação-de-destinos-e-roteiros)
    - 2.4. [Módulo de Venda de Passagens Aéreas](#24-módulo-de-venda-de-passagens-aéreas)
    - 2.5. [Módulo de Lista de Desejos (Wishlist)](#25-módulo-de-lista-de-desejos-wishlist)
3. [Requisitos Não-Funcionais (RNF)](#3-requisitos-não-funcionais-rnf)
4. [Casos de Uso (UC)](#4-casos-de-uso-uc)
    - 4.1. [UC-01: Obter Recomendação de Viagem Personalizada](#41-uc-01-obter-recomendação-de-viagem-personalizada)
    - 4.2. [UC-02: Adicionar Plano de Viagem à Lista de Desejos](#42-uc-02-adicionar-plano-de-viagem-à-lista-de-desejos)
    - 4.3. [UC-03: Excluir Automaticamente Item Expirado da Lista de Desejos](#43-uc-03-excluir-automaticamente-item-expirado-da-lista-de-desejos)

---

## 1. Introdução

Este documento especifica os requisitos para o projeto de conclusão de curso **"AIR Discovery"**. O sistema consiste em uma plataforma web para venda de passagens aéreas que utiliza uma Inteligência Artificial (IA) para criar roteiros de viagem personalizados. A IA interage com o usuário para identificar seu perfil e interesses, recomendando destinos e atividades sob medida.

---

## 2. Requisitos Funcionais (RF)

### 2.1. Módulo de Acesso e Autenticação de Usuário

- **RF001**: O sistema deve permitir que qualquer visitante acesse a página inicial (Home) sem a necessidade de realizar login.
- **RF002**: O sistema deve requerer autenticação (login) para o acesso a qualquer funcionalidade interna, incluindo "Busca de Passagem" e "Destinos Recomendados".
- **RF003**: O sistema deve redirecionar automaticamente um usuário não autenticado para a página de login ao tentar acessar uma área restrita.

### 2.2. Módulo de Interação com a Inteligência Artificial (Chatbot de Perfil)

- **RF004**: O sistema deve apresentar uma interface de chat ao usuário quando o botão "Começar Agora" for acionado.
- **RF005**: A IA deve conduzir uma entrevista com o usuário para identificar seus interesses e perfil de viajante.
- **RF006**: A entrevista da IA deve incluir, no mínimo, perguntas que abordem os seguintes tópicos:
  - a) Preferências de atividades em férias.
  - b) Orçamento de viagem.
  - c) Propósito da viagem (lazer, trabalho, rotina).
  - d) Hobbies e atividades de tempo livre.
- **RF007**: A IA deve ser capaz de formular perguntas adicionais pertinentes com base nas respostas fornecidas pelo usuário para refinar o perfil.

### 2.3. Módulo de Recomendação de Destinos e Roteiros

- **RF008**: O sistema deve, com base no perfil de viajante e nas respostas do usuário, processar e retornar até 3 (três) indicações de destinos compatíveis, apresentadas em ordem de relevância.
- **RF009**: O sistema deve permitir que o usuário selecione um dos destinos recomendados para visualizar o roteiro de viagem detalhado correspondente.
- **RF010**: Para o destino selecionado, o sistema deve gerar um roteiro de viagem detalhado, incluindo as datas de início e fim da viagem.
- **RF011**: O roteiro gerado deve conter a sugestão de, no mínimo, uma atividade principal para cada dia da viagem.
- **RF012**: No resultado das indicações do ChatBot, deve se apresentar os cards dos destinos indicados. Os Cards devem ser clicados e direcionar o usuário para a tela de pesquisa de passagens, o campo "Para" da seleção de passagem, deve vir bloqueado para seleção, visto que o usuário já definiu o destino dentro do chatbot.
- **RF013**: Não salvar o preço das passagens, somente o destino, datas e roteiros indicados.

### 2.4. Módulo de Venda de Passagens Aéreas

- **RF014**: Ao ser direcionado do módulo de recomendação, a tela de busca de passagens já deve vir preenchida com o destino e as datas do roteiro selecionado.
- **RF015**: O sistema deve permitir que o usuário altere as informações de busca (origem, destino, datas).
- **RF016**: O sistema deve consultar um serviço externo (API de companhia aérea ou GDS) para obter informações de voos em tempo real.
- **RF017**: O sistema deve exibir uma lista de voos disponíveis, detalhando, no mínimo: companhia aérea, horários de partida e chegada, duração e preço.
- **RF018**: O usuário deve poder selecionar os voos desejados (ida e volta) para adicioná-los ao seu plano de viagem.

### 2.5. Módulo de Lista de Desejos (Wishlist)

- **RF019**: O sistema deve permitir que o usuário salve o conjunto completo (roteiro personalizado + seleção de passagens) em uma "Lista de Desejos" vinculada à sua conta.
- **RF020**: Cada item salvo na lista de desejos deve conter todas as informações relevantes: destino, datas, detalhes dos voos selecionados e todas as atividades recomendadas.
- **RF021**: O usuário deve ter uma área em seu perfil onde possa visualizar, gerenciar ou excluir os itens de sua lista de desejos.
- **RF022**: O sistema deve possuir uma rotina automatizada que verifique diariamente a lista de desejos de todos os usuários.
- **RF023**: A rotina automatizada deve excluir permanentemente qualquer item da lista de desejos cuja data de início da viagem seja anterior à data atual, caso o item não tenha sido convertido em uma reserva efetiva.

---

## 3. Requisitos Não-Funcionais (RNF)

- **RNF001** *(Segurança)*: As senhas dos usuários devem ser armazenadas no banco de dados utilizando um algoritmo de hash com salt (ex: bcrypt).
- **RNF002** *(Usabilidade)*: O processo de login e cadastro deve ser simples e intuitivo.
- **RNF003** *(Desempenho)*: O tempo de resposta da IA no chat não deve exceder 2 segundos por interação.
- **RNF004** *(Usabilidade)*: A interface do chat deve ser clara e de fácil interação.
- **RNF005** *(Desempenho)*: O tempo para processar as respostas e exibir as recomendações de destino não deve exceder 10 segundos.
- **RNF006** *(Usabilidade)*: O roteiro de viagem deve ser apresentado de forma clara, organizada e visualmente agradável.
- **RNF007** *(Confiabilidade)*: A base de dados de atividades e pontos turísticos deve ser precisa e periodicamente atualizada.
- **RNF008** *(Integração)*: O sistema deve ser capaz de se conectar de forma segura e estável com APIs de terceiros para a consulta de voos.
- **RNF009** *(Segurança)*: Toda a comunicação que envolva dados de pagamento deve ser criptografada utilizando o protocolo TLS 1.2 ou superior.
- **RNF010** *(Persistência)*: Os dados da lista de desejos devem ser armazenados de forma persistente no banco de dados.
- **RNF011** *(Eficiência)*: A rotina de exclusão de itens expirados da lista de desejos deve ser executada em horários de baixa utilização do sistema.

---

## 4. Casos de Uso (UC)

### 4.1. UC-01: Obter Recomendação de Viagem Personalizada

**Ator**: Usuário Viajante.

**Pré-condição**: O usuário deve estar autenticado no sistema.

**Fluxo Principal**:
1. O usuário clica no botão "Começar Agora" na página inicial.
2. O sistema inicia a interface de chat com a IA (RF004).
3. A IA realiza a entrevista com o usuário para coletar suas preferências (RF005, RF006, RF007).
4. Ao final da entrevista, o usuário confirma o envio das respostas.
5. O sistema processa as informações e exibe uma tela com até 3 destinos recomendados, ordenados por relevância (RF008).
6. O usuário seleciona um dos destinos para ver mais detalhes (RF009).
7. O sistema exibe o roteiro de viagem personalizado para o destino escolhido, com atividades diurnas e noturnas e as datas da viagem (RF010, RF011, RF012).

**Fluxo Alternativo** *(Nenhum destino compatível encontrado)*:
- No passo 5, se o sistema não encontrar nenhum destino compatível com as respostas, ele deve exibir uma mensagem informando o usuário e sugerindo que ele refaça a entrevista com respostas diferentes.

**Pós-condição**: O usuário visualiza um roteiro de viagem personalizado para um destino de seu interesse.

### 4.2. UC-02: Adicionar Plano de Viagem à Lista de Desejos

**Ator**: Usuário Viajante.

**Pré-condição**: O usuário concluiu o UC-01 e está visualizando um roteiro de viagem.

**Fluxo Principal**:
1. O usuário clica no botão "Comprar Passagens" (RF013).
2. O sistema o redireciona para a tela de busca de voos, com os dados pré-preenchidos (RF014).
3. O sistema exibe a lista de voos disponíveis (RF017).
4. O usuário seleciona os voos de ida e volta desejados (RF018).
5. O sistema exibe um botão "Adicionar à Lista de Desejos".
6. O usuário clica no botão.
7. O sistema salva o roteiro completo e os voos selecionados na área pessoal do usuário (RF019).
8. O sistema exibe uma mensagem de confirmação.

**Pós-condição**: O plano de viagem (roteiro + voos) está salvo na Lista de Desejos do usuário (RF020).

### 4.3. UC-03: Excluir Automaticamente Item Expirado da Lista de Desejos

**Ator**: Sistema (Agendador de Tarefas).

**Pré-condição**: Existem itens na Lista de Desejos de um ou mais usuários.

**Fluxo Principal**:
1. O sistema ativa uma rotina agendada (job), uma vez ao dia, em horário de baixa utilização (RNF011, RF022).
2. A rotina verifica todos os itens em todas as Listas de Desejos.
3. Para cada item, a rotina compara a data de início da viagem com a data atual.
4. Se a data de início da viagem for anterior à data atual e o item não possuir status de "reservado" ou "comprado", o sistema o remove permanentemente do banco de dados (RF023).

**Pós-condição**: A base de dados da Lista de Desejos contém apenas itens com datas de viagem futuras ou que já foram convertidos em reserva.
