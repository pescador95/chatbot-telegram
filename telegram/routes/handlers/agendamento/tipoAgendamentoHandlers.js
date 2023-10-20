const listarTiposAgendamentoByOrganizacaoBot = require("../../webhooks/agendamento/tipoAgendamentoWebhooks");

async function montarTiposAgendamentoByOrganizacao(
  msg,
  bot,
  organizacao,
  listaOpcoesComandos,
  pessoa
) {
  try {
    const tiposAgendamentos = await listarTiposAgendamentoByOrganizacaoBot(
      organizacao?.id
    );

    if (tiposAgendamentos.data.length === 0) {
      let message = `Não há nenhum tipo de agendamento na organização solicitada disponível para atendimento.`;
      bot.sendMessage(msg.chat.id, message).then(() => {
        return null;
      });
    } else {
      bot.removeTextListener(/^(.*)$/);
      let message = `Aqui estão os nossos tipos de agendamentos disponíveis.\n Selecione qual você deseja agendar o seu atendimento:\n\n`;

      const opcoes = tiposAgendamentos.data.map((tipoAgendamento) => {
        return {
          id: tipoAgendamento.id,
          tipoAgendamento: tipoAgendamento.tipoAgendamento,
        };
      });

      const keyboard = opcoes.map((opcao) => [opcao.tipoAgendamento]);

      const replyMarkup = {
        keyboard,
        one_time_keyboard: true,
        resize_keyboard: true,
      };

      const opcoesMarkup = {
        reply_markup: JSON.stringify(replyMarkup),
      };

      bot.sendMessage(msg.chat.id, message, opcoesMarkup);

      return new Promise((resolve) => {
        bot.onText(/^(.*)$/, async (msg, match) => {
          const selectedOptionLabel = match[1];

          const selectedOption = opcoes.find(
            (opcao) => opcao.tipoAgendamento === selectedOptionLabel
          );

          if (selectedOption) {
            resolve(selectedOption);
          } else {
            resolve(null);
          }
        });
      });
    }
  } catch (error) {
    console.error(
      "Erro ao verificar a disponibilidade do tipo de agendamento:",
      error
    );
  }
}
module.exports = montarTiposAgendamentoByOrganizacao;
