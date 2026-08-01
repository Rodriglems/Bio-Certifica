# Guidelines do projeto

Use este arquivo como referência para decisões de UI, arquitetura e escrita de código no projeto Bio Certifica.

## Contexto do app

* O app é mobile-first e roda como aplicação web e aplicativo Capacitor.
* A stack principal é React + Vite no frontend, com API em Node.js/Express e PostgreSQL no backend.
* A interface deve ser clara, rápida de usar e adequada para pessoas no campo, com poucos passos por tarefa.
* O idioma padrão da interface e dos textos novos é português do Brasil.

## Diretrizes gerais

* Priorize simplicidade e robustez antes de sofisticação visual.
* Prefira componentes pequenos e bem nomeados em vez de arquivos grandes e genéricos.
* Mantenha o código alinhado com o estilo existente no projeto.
* Evite lógica duplicada; extraia funções e componentes reutilizáveis quando fizer sentido.
* Use layouts responsivos com flexbox ou grid; evite posicionamento absoluto quando não for essencial.

## Interface e experiência

* Pense primeiro em telas de celular e toque com o polegar.
* Dê preferência a fluxos curtos, com instruções objetivas e rótulos descritivos.
* Use botões e mensagens de ação em português claro, sem jargões técnicos.
* Confirme ações destrutivas ou irreversíveis antes de executá-las.
* Mostre estados de carregamento, vazio e erro de forma explícita.
* Não esconda informação importante atrás de interações desnecessárias.

## Design system e componentes

* Reaproveite os componentes existentes em src/components/ui sempre que possível.
* Mantenha consistência visual entre telas, especialmente em formulários, modais e navegação.
* Use variações de componente com moderação; não crie novos padrões visuais sem necessidade.
* Preserve acessibilidade: contraste legível, foco visível, labels claros e áreas de toque adequadas.

## Código e manutenção

* Use TypeScript estrito e prefira tipos explícitos quando isso melhorar clareza e segurança.
* Separe regras de negócio, acesso à API e apresentação sempre que a tela crescer.
* Evite componentes com responsabilidade demais; divida quando a leitura começar a ficar difícil.
* Não introduza dependências novas sem motivo claro.
* Se alterar uma tela, revise o fluxo adjacente para evitar inconsistências de navegação ou dados.
* Não edite arquivos gerados em `build`, `server/dist` ou `android/app/build`; altere o código-fonte e gere-os novamente pelos scripts do projeto.

## Segurança e privacidade

* Nunca inclua senhas, tokens, chaves ou valores de `.env` no código, em logs ou em mensagens de erro.
* Faça a autorização no backend em toda rota que acessar dados de usuários; a validação no frontend serve apenas para melhorar a experiência.
* Use consultas SQL parametrizadas para qualquer valor fornecido pelo usuário.
* Exiba mensagens de erro úteis ao usuário, mas mantenha detalhes internos e dados sensíveis apenas nos logs do servidor.

## Dados e backend

* Valide dados de entrada no frontend e no backend quando possível.
* Não confie apenas no cliente para garantir integridade de dados.
* Use nomes de campos consistentes entre API, banco e frontend.
* Em migrações SQL, faça mudanças pequenas, incrementais e transacionais quando possível.
* Nunca altere uma migração já aplicada; crie uma nova migração para corrigir ou evoluir o esquema.
* Antes de uma mudança destrutiva, documente uma estratégia de reversão ou recuperação dos dados.

## Verificação antes de concluir

* Execute `npm run build` após alterações no frontend para verificar tipos e geração do bundle.
* Execute as verificações mais específicas disponíveis quando alterar API, banco ou integração mobile.
* Não considere uma alteração concluída se ela introduzir erros de build, importações quebradas ou variáveis de ambiente não documentadas.

## Formato de texto e conteúdo

* Datas e números devem seguir o padrão local do Brasil quando exibidos ao usuário.
* Mensagens de erro devem explicar o problema e, quando possível, indicar a ação correta.
* Textos novos devem ser curtos, diretos e compatíveis com usuários não técnicos.

## Se houver dúvida

* Siga a implementação existente mais próxima.
* Se houver conflito entre clareza e decoração, escolha clareza.
* Se uma alteração puder ser menor, faça menor.
