# Documentação Técnica — Sistema de Faturamento de Academia

### Descrição Resumida

Sistema automatizado de processamento e envio de notas fiscais de serviço (NFS) para academias, desenvolvido em Python com automação RPA via Playwright. O sistema realiza login nas plataformas EVO/W12, aplica filtros de data e tributação, valida cadastros de clientes, corrige automaticamente inconsistências detectadas (endereços, CPF, responsáveis de menores), efetua o envio das notas fiscais diretamente pela plataforma e envia relatórios por e-mail via Gmail API. Todo o processo é executado de forma completamente autônoma, sem qualquer intervenção humana, através de um agendamento automático (cron) que dispara o robô todos os dias às 8h da manhã.

---

### Como o Robô Funciona — Passo a Passo Completo

Esta seção descreve, de forma clara e acessível, tudo o que o robô faz do início ao fim, todos os dias, de forma completamente automática.

**1. Disparo automático às 8h da manhã**

Todos os dias, às 8h00, um agendador automático (cron job) instalado no servidor Linux aciona o robô sem nenhuma intervenção humana. O robô acorda, inicializa o ambiente e começa a executar o processo completo do zero.

**2. Login na plataforma EVO**

O robô abre um navegador web em segundo plano (invisível para o usuário) e acessa o sistema EVO. Ele digita automaticamente as credenciais de acesso (usuário e senha) armazenadas de forma segura no servidor. Caso o sistema demore ou apresente algum comportamento inesperado, o robô aguarda e tenta novamente antes de reportar erro.

**3. Seleção da primeira academia (tenant Bodytech)**

Após o login, o robô navega até a seleção de unidades. Ele processa, em sequência, todas as 7 unidades da Bodytech:

- BT TIJUC — Shopping Tijuca
- BT VELHA — Shop. Praia da Costa
- BT MALVA — Shopping Mestre Álvaro
- BT MOXUA — Shopping Moxuara
- BT SLUIS — Shopping da Ilha
- BT VITOR — Shopping Vitória
- BT TERES — Shopping Rio Poty

Para cada unidade, o robô executa os passos 4 a 9 descritos abaixo.

**4. Acesso à área de Notas Fiscais de Serviço**

Dentro de cada unidade, o robô navega automaticamente pelo menu financeiro até chegar à tela de Notas Fiscais de Serviço (NFS).

**5. Aplicação dos filtros de data e tributação**

O robô aplica os filtros necessários para processar apenas as notas do dia anterior, seleciona a ordenação por data de vencimento e marca todas as opções de tributação disponíveis (excluindo automaticamente qualquer opção marcada como "Não usar").

**6. Validação dos cadastros dos clientes**

Antes de enviar as notas, o robô verifica todos os cadastros dos clientes que aparecem na lista. Ele identifica automaticamente os seguintes tipos de inconsistências:

- **Endereço com número inválido** — campo em branco ou preenchido com letras em vez de números
- **CPF ausente em cadastros brasileiros** — indica menor de idade sem responsável cadastrado
- **Responsável de menor não configurado** — falta do vínculo de responsabilidade no sistema

**7. Correção automática dos cadastros**

Para cada inconsistência encontrada, o robô tenta corrigi-la automaticamente:

- Abre o perfil do cliente dentro do sistema EVO
- Preenche o número do endereço com "0" quando o campo está vazio ou inválido
- Remove caracteres indevidos de campos numéricos
- Acessa a aba "Responsáveis" e marca os checkboxes necessários para clientes menores de idade
- Salva as alterações e retorna à lista principal

Caso o problema **não possa** ser corrigido automaticamente (ex: CPF inválido, dados complexos de endereço), o cadastro é registrado na lista de inválidos que será enviada por e-mail ao final.

**8. Envio das Notas Fiscais**

Após a validação e as correções, o robô seleciona todos os registros válidos e inicia o processo de envio das notas fiscais diretamente pela plataforma EVO. Ele:

- Clica em "Selecionar todos"
- Aciona o botão de envio
- Preenche a data de referência no modal de envio (utilizando a mesma data do filtro aplicado anteriormente)
- Confirma o envio e aguarda a plataforma processar e fechar o modal

**9. Próxima unidade**

Concluído o processo em uma unidade, o robô repete os passos 4 a 8 para a próxima unidade da lista, até processar todas as 7.

**10. Envio do e-mail de validação**

Ao finalizar todas as unidades, o robô envia automaticamente um e-mail de notificação para a equipe responsável. O conteúdo do e-mail varia conforme o resultado:

- **Processo concluído sem pendências:** e-mail informando que o processamento do dia foi concluído com sucesso, sem cadastros inválidos.
- **Processo concluído com pendências:** e-mail listando todos os cadastros que não puderam ser corrigidos automaticamente, com os dados do cliente, CPF, situação e unidade — para que a equipe possa resolver manualmente.

O e-mail é enviado automaticamente para: Lourenço Sodré, Gabrieli Dias, Kátia Canal e o time InovaiLab.

**11. Encerramento**

O robô fecha o navegador, registra nos logs que a execução foi concluída com sucesso e aguarda o próximo dia para reiniciar o ciclo.

---

### Problema/Oportunidade

Academias com múltiplas unidades enfrentam processos manuais e repetitivos de emissão de notas fiscais de serviço, que exigem validação de cadastros de clientes, aplicação de filtros complexos de tributação e correção de inconsistências cadastrais. O processo manual é suscetível a erros humanos, consome tempo significativo da equipe administrativa e dificulta a rastreabilidade de problemas. A oportunidade identificada é automatizar completamente este fluxo, reduzindo o tempo de processamento de horas para minutos, garantindo consistência nos dados cadastrais, eliminando erros de digitação e permitindo auditoria completa através de logs estruturados e monitoramento em tempo real.

---

### Objetivos

Automatizar o ciclo completo de processamento e envio de notas fiscais de serviço para múltiplas unidades de academias, incluindo autenticação em sistemas multi-tenant, aplicação de filtros de data e tributação, validação e correção automática de cadastros de clientes (endereços inválidos, CPF ausente, responsáveis de menores), envio efetivo das notas fiscais pela plataforma EVO, geração de relatórios de inconsistências não corrigíveis e monitoramento distribuído em tempo real. O sistema opera de forma completamente autônoma, 24/7, sem necessidade de qualquer intervenção humana, via agendamento de cron job diário às 8h da manhã.

---

### Alinhamento Estratégico

A arquitetura do sistema foi projetada para escalabilidade horizontal e vertical. O uso de Flask permite deploy rápido em ambientes cloud (Render, Heroku) ou on-premise, com suporte a PostgreSQL para produção e SQLite para desenvolvimento. A automação via Playwright garante compatibilidade cross-platform (Windows/Linux) e permite execução headless em servidores sem interface gráfica. A integração com RPA Monitor Client possibilita gestão centralizada de múltiplas instâncias do RPA, com monitoramento de status, logs e screenshots em tempo real. O sistema de correção automática de cadastros reduz a dependência de intervenção manual, permitindo que a equipe foque em exceções realmente críticas. A execução diária às 8h via cron job garante que o processo sempre ocorra no início do expediente, com o relatório de resultados já disponível na caixa de e-mail da equipe antes que qualquer atendimento precise ocorrer. A arquitetura modular facilita a adição de novas unidades, tenants e regras de validação sem impacto no código existente.

---

### Escopo do Projeto

O sistema implementa os seguintes módulos e funcionalidades: (1) Backend Flask com autenticação de usuários (login/logout), gestão de sessões e API REST para controle de processos RPA; (2) Banco de dados SQLAlchemy com suporte a PostgreSQL e SQLite, incluindo modelos para usuários e logs; (3) Automação RPA com Playwright para navegação em sistemas EVO/W12, incluindo login multi-tenant, seleção de unidades, aplicação de filtros de data e tributação, validação de cadastros, correção automática de inconsistências e envio das notas fiscais; (4) Sistema de validação de cadastros com detecção de CPF inválido, endereços incompletos (campo "Número" vazio ou com letras), identificação de menores de idade sem responsável e usuários estrangeiros; (5) Correção automática de cadastros com preenchimento de campo "Número" com valor padrão "0", limpeza de caracteres não numéricos em endereços e marcação de checkboxes de responsáveis para menores; (6) Envio efetivo das notas fiscais diretamente pela plataforma EVO, mediante seleção de todos os registros e confirmação no modal de envio com data de referência; (7) Integração com Gmail API para envio de relatório consolidado ao final de cada execução, informando sucesso ou listando cadastros inválidos não corrigíveis; (8) Agendamento automático via cron job (diário às 8h00) que executa todo o processo de forma autônoma, sem intervenção humana; (9) Interface web responsiva com dashboard para iniciar processos manualmente, visualização de status em tempo real e página de relatórios; (10) Sistema de monitoramento distribuído com RPA Monitor Client, incluindo envio de logs, eventos e screenshots via WebSocket; (11) Suporte a múltiplos tenants (bodytech, formula) com processamento sequencial de unidades específicas (Shopping Tijuca, Praia da Costa, Shopping da Ilha, Shopping Vitória, Shopping Rio Poty, Shopping Mestre Álvaro, Shopping Moxuara); (12) Sistema de paginação e scroll infinito para coleta completa de registros em tabelas sem limite de páginas; (13) Ordenação automática por coluna "Cadastro" para priorização de registros inválidos; (14) Geração de relatórios JSON com metadados de execução, timestamps e estatísticas de processamento.

---

### Premissas

O sistema adota as seguintes premissas técnicas: (1) Stack Python 3.10+ com Flask 3.0+, SQLAlchemy 2.0+, Playwright 1.40+ e PyAutoGUI para automação; (2) Banco de dados PostgreSQL em produção com fallback automático para SQLite em caso de indisponibilidade; (3) Autenticação básica com hash de senhas via Werkzeug (bcrypt); (4) Credenciais de acesso aos sistemas EVO/W12 armazenadas em variáveis de ambiente (.env); (5) Execução assíncrona de processos RPA via threading para não bloquear a interface web; (6) Comunicação entre frontend e backend via polling HTTP (endpoints /wait_finish e /api/report); (7) Logs estruturados com RPA Monitor Client enviados via WebSocket para servidor centralizado; (8) Screenshots de erro salvos localmente em ~/Downloads/faturamento_academia; (9) Relatórios JSON salvos em last_report.json na raiz do projeto; (10) Timeout padrão de 6 segundos para operações de UI, com timeouts reduzidos (1.5s-3s) para operações rápidas; (11) Retry automático com force=True em caso de falha de clique; (12) Normalização de texto (remoção de acentos, lowercase) para comparações robustas; (13) Detecção de país via campo "País" no cadastro para filtrar usuários estrangeiros; (14) Detecção de menores via ausência de CPF em cadastros brasileiros; (15) Ordenação por coluna "Cadastro" para priorizar registros inválidos no topo da tabela; (16) Limite de 400 passos de scroll para evitar loops infinitos em tabelas muito grandes; (17) Envio único de e-mail consolidado ao final do processo com todos os cadastros inválidos não corrigíveis; (18) Cron job configurado no servidor Linux com execução diária às 08:00 (horário de Brasília), disparando o script run_click.sh que aciona run_rpa_direto.py em modo headless, sem necessidade de sessão de usuário ativa ou qualquer interação manual.
