# Guidelines do projeto

Use este arquivo como referência para decisões de UI, arquitetura e escrita de código no projeto Bio Certifica.

## Contexto do app

* O app é mobile-first e roda como web app e app Capacitor.
* A stack principal é React + Vite no frontend, com API Node/Express e PostgreSQL no backend.
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

* Prefira TypeScript tipado de forma explícita quando isso melhorar clareza e segurança.
* Separe regras de negócio, acesso à API e apresentação sempre que a tela crescer.
* Evite componentes com responsabilidade demais; divida quando a leitura começar a ficar difícil.
* Não introduza dependências novas sem motivo claro.
* Se alterar uma tela, revise o fluxo adjacente para evitar inconsistências de navegação ou dados.

## Dados e backend

* Valide dados de entrada no frontend e no backend quando possível.
* Não confie apenas no cliente para garantir integridade de dados.
* Use nomes de campos consistentes entre API, banco e frontend.
* Em migrações SQL, prefira mudanças pequenas e reversíveis.

## Formato de texto e conteúdo

* Datas e números devem seguir o padrão local do Brasil quando exibidos ao usuário.
* Mensagens de erro devem explicar o problema e, quando possível, indicar a ação correta.
* Textos novos devem ser curtos, diretos e compatíveis com usuários não técnicos.

## Se houver dúvida

* Siga a implementação existente mais próxima.
* Se houver conflito entre clareza e decoração, escolha clareza.
* Se uma alteração puder ser menor, faça menor.
