# IR control

Crie um sistema web completo (SaaS) para gestão de declarações de Imposto de Renda Pessoa Física (IRPF), voltado para escritórios de contabilidade.

🎯 Objetivo do sistema

Permitir o controle total das declarações de IRPF, desde a entrada de clientes até a entrega, acompanhamento, financeiro e comunicação com o cliente.

🧩 Módulos principais

👤 1. Gestão de Clientes

 Cadastro completo com:

 Nome completo

 CPF

 Data de nascimento

 Telefone (WhatsApp)

 E-mail

 Endereço

 Profissão

 Campo para observações internas

 Histórico de declarações por ano

📄 2. Gestão de Declarações IRPF

 Criar declaração vinculada ao cliente

 Selecionar ano-base (ex: 2025 → exercício 2026)

 Status da declaração:

 Aguardando documentos

 Em andamento

 Em revisão

 Finalizada

 Enviada

 Em processamento

 Processada

 Tipo:

 Completa

 Simplificada

📎 3. Upload de Documentos

Permitir anexar arquivos por cliente/declaração:

 PDF e imagens (JPG, PNG)

 Categorias:

 Comprovantes de rendimentos

 Despesas médicas

 Educação

 Informes bancários

 Notas fiscais

 Outros

Extras:

 Visualização dos arquivos dentro do sistema

 Organização automática por categoria

 Possibilidade de marcar documentos como “revisados”

📊 4. Controle de Situação da Declaração

Campos importantes:

 Resultado:

 A restituir

 A pagar

 Sem imposto

 Valor da restituição ou imposto

 Quantidade de parcelas (se imposto a pagar)

 Data de envio

 Data de processamento

 Lote de restituição (se aplicável)

💰 5. Financeiro

 Valor cobrado pela declaração

 Forma de pagamento:

 Pix

 Cartão

 Dinheiro

 Transferência

 Status:

 Pendente

 Pago

 Parcial

 Controle de parcelas

 Data de vencimento

 Relatório financeiro:

 Total recebido

 Total a receber

 Lucro por período

👨‍💻 6. Painel Interno (Dashboard)

 Quantidade de declarações:

 Pendentes

 Em andamento

 Finalizadas

 Total faturado

 Clientes ativos

 Alertas:

 Declarações sem documentos

 Clientes sem retorno

 Pendências financeiras

👤 7. Área do Cliente (Portal do Cliente)

Criar um acesso exclusivo para o cliente com login e senha:

Funcionalidades:

 Acompanhar status da declaração em tempo real

 Upload de documentos

 Visualizar pendências (ex: “falta informe bancário”)

 Visualizar resumo:

 Se terá restituição ou imposto a pagar

 Download da declaração final e recibo

 Histórico de anos anteriores

🔔 8. Notificações e Comunicação

 Notificações automáticas via:

 WhatsApp

 E-mail

 Exemplos:

 Solicitação de documentos

 Atualização de status

 Declaração finalizada

 Cobrança pendente

📋 9. Gestão de Tarefas Internas

 Checklist por declaração:

 Receber documentos

 Conferir dados

 Lançar informações

 Revisar

 Enviar

 Responsável por tarefa (usuários do sistema)

 Prazos

🔐 10. Controle de Usuários

 Níveis de acesso:

 Administrador

 Funcionário

 Controle de permissões

⚙️ Funcionalidades Extras (Diferenciais)

 Importação de dados de anos anteriores

 Geração automática de checklist de documentos por perfil do cliente

 Filtros avançados (ex: clientes com restituição acima de X)

 Campo de risco fiscal (baixo, médio, alto)

 Registro de malha fina

 Integração futura com sistemas da Receita

 Relatórios exportáveis (PDF e Excel)

🎨 Interface e Experiência

 Interface simples, moderna e intuitiva

 Design responsivo (funciona no celular)

 Painel visual com cores para status:

 Verde (finalizado)

 Amarelo (em andamento)

 Vermelho (pendente)

🧠 Regras de Negócio Importantes

 Uma declaração por cliente por ano

 Não permitir envio sem documentos obrigatórios

 Alertar clientes com pendências

 Permitir edição até o envio

🔥 Objetivo Final

Criar um sistema que:

 Reduza erros e esquecimentos

 Aumente a produtividade do escritório

 Melhore a experiência do cliente

 Passe profissionalismo e organização

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://declara-pro.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/88785dc0-ab88-4d2d-b9df-c3d09ee38c95).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
