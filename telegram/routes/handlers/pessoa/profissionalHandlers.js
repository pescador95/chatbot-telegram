const listarProfissionaisByAgendamentoBot = require("../../webhooks/pessoa/profissionalWebhooks");

async function montarProfissionaisByAgendamento(
  msg,
  bot,
  organizacao,
  dataAgendamento,
  tipoAgendamento,
  comPreferencia,
  listaOpcoesComandos,
  pessoa
) {
  try {
    const profissionais = await listarProfissionaisByAgendamentoBot(
      organizacao,
      dataAgendamento,
      tipoAgendamento,
      0,
      comPreferencia
    );

    if (profissionais.data.length === 0) {
      bot.sendMessage(
        msg.chat.id,
        "Não há profissionais disponíveis para o dia e horário selecionados."
      );
      return null;
    }
    bot.removeTextListener(/^(.*)$/);
    let message = `Aqui estão os nossos profissionais disponíveis.\n Selecione qual você deseja agendar o seu atendimento:\n\n`;

    const opcoes = profissionais.data.map((profissional) => {
      return {
        id: profissional.id,
        profissional: profissional.nomeProfissional,
      };
    });

    const keyboard = opcoes.map((opcao) => [opcao.profissional]);

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
          (opcao) => opcao.profissional === selectedOptionLabel
        );

        if (selectedOption) {
          resolve(selectedOption);
        } else {
          resolve(null);
        }
      });
    });
  } catch (error) {
    console.error(
      "Erro ao verificar a disponibilidade do profissional:",
      error
    );
  }
}

async function montarPreferenciaProfissional(msg, bot) {
  const opcoes = [
    { id: 1, nome: "Sim" },
    { id: 2, nome: "Não" },
  ];
  bot.removeTextListener(/^(.*)$/);
  let message = ` Você tem preferência por um profissional específico?\n\n`;

  const keyboard = opcoes.map((opcao) => [opcao.nome]);

  const replyMarkup = {
    keyboard,
    one_time_keyboard: true,
    resize_keyboard: true,
  };

  const opcoesMarkup = {
    reply_markup: JSON.stringify(replyMarkup),
  };

  bot.sendMessage(msg.chat.id, message, opcoesMarkup);

  bot.removeTextListener(/^(.*)$/);

  return new Promise((resolve) => {
    bot.onText(/^(.*)$/, async (msg, match) => {
      const selectedOptionLabel = match[1];

      switch (selectedOptionLabel) {
        case "Sim":
          resolve(true);
        case "Não":
          resolve(false);
        default:
          break;
      }
    });
  });
}

module.exports = {
  montarProfissionaisByAgendamento,
  montarPreferenciaProfissional,
};
