require("node-telegram-bot-api");
const {
  listarAgendamentoByPessoa,
  marcarAgendamento,
  montarAgendamento,
  confirmarAgendamento,
  confirmarReagendamento,
  remarcarAgendamento,
} = require("../routes/handlers/agendamento/agendamentoHandlers");
const {
  selecionarAgendamentoRemarcacao,
} = require("../routes/handlers/agendamento/agendamentoHandlers");
const {
  getPessoa,
  updatePessoaRemoveTelegramId,
} = require("../routes/handlers/pessoa/pessoaHandlers");

async function iniciarAtendimento(msg, bot, pessoa) {
  let message = `\nBem-vindo ao Chat Bot, ${pessoa?.nome}!\n\n`;

  await bot.sendMessage(msg.chat.id, message).then(() => {
    pessoaAtendimento(msg, bot, pessoa);
  });
}

async function listaOpcoesComandos(msg, bot, listaOpcoesComandos, pessoa) {
  bot.removeTextListener(/^(.*)$/);
  const opcoesComandos = [
    { id: 1, nome: "AGENDAR" },
    { id: 2, nome: "REAGENDAR" },
    { id: 3, nome: "LISTAR MEUS AGENDAMENTOS" },
    { id: 4, nome: "ATENDIMENTO PARA OUTRA PESSOA" },
    { id: 5, nome: "REMOVER VINCULO TELEGRAM" },
    { id: 6, nome: "FINALIZAR ATENDIMENTO" },
  ];

  if (pessoa.nome && !pessoa.telegramId) {
    const indexToRemove = opcoesComandos.findIndex((opcao) => opcao.id === 5);
    if (indexToRemove !== -1) {
      opcoesComandos.splice(indexToRemove, 1);
    }
  }

  bot.removeTextListener(/^(.*)$/);

  let message =
    "Estou à disposição para ajudar, " +
    pessoa.nome +
    ".\nComo posso ser útil?\n\n";

  let agendamento;
  let oldAgendamento;
  let newAgendamento;
  let confirmar;

  const keyboard = opcoesComandos.map((opcao) => [opcao.nome]);

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

  bot.onText(/^(.*)$/, async (msg, match) => {
    const selectedOptionLabel = match[1];

    switch (selectedOptionLabel) {
      case "AGENDAR":
        agendamento = await montarAgendamento(
          msg,
          bot,
          pessoa,
          listaOpcoesComandos,
          false
        );

        if (agendamento) {
          confirmar = await confirmarAgendamento(
            msg,
            bot,
            listaOpcoesComandos,
            agendamento,
            pessoa
          );
        }

        if (confirmar) {
          bot.removeTextListener(/^(.*)$/);
          newAgendamento = await marcarAgendamento(agendamento, bot, msg);
          listaOpcoesComandos(msg, bot, listaOpcoesComandos, pessoa);
        }
        break;
      case "REAGENDAR":
        oldAgendamento = await selecionarAgendamentoRemarcacao(
          msg,
          bot,
          pessoa,
          listaOpcoesComandos,
          true
        );

        if (!oldAgendamento) {
          return listaOpcoesComandos(msg, bot, listaOpcoesComandos, pessoa);
        }

        newAgendamento = await montarAgendamento(
          msg,
          bot,
          pessoa,
          listaOpcoesComandos,
          true
        );

        if (oldAgendamento && newAgendamento) {
          confirmar = await confirmarReagendamento(
            msg,
            bot,
            listaOpcoesComandos,
            oldAgendamento,
            newAgendamento,
            pessoa
          );
        }

        if (confirmar) {
          bot.removeTextListener(/^(.*)$/);
          const agendamentoRemarcado = await remarcarAgendamento(
            oldAgendamento,
            newAgendamento,
            bot,
            msg
          );
          listaOpcoesComandos(msg, bot, listaOpcoesComandos, pessoa);
        }

        break;
      case "LISTAR MEUS AGENDAMENTOS":
        listarAgendamentoByPessoa(msg, bot, pessoa, listaOpcoesComandos, false);
        return;
      case "REMOVER VINCULO TELEGRAM":
        bot.removeTextListener(/^(.*)$/);
        updatePessoaRemoveTelegramId(msg, bot, pessoa, listaOpcoesComandos);
        return;
      case "FINALIZAR ATENDIMENTO":
        bot.sendMessage(
          msg.chat.id,
          "A Clinica agradece ao contato e a preferência!"
        );
        return;
      case "ATENDIMENTO PARA OUTRA PESSOA":
        getPessoaAtendimento(msg, bot, false, listaOpcoesComandos);
        return;
      default:
        break;
    }
  });
}

async function pessoaAtendimento(msg, bot, pessoa) {
  const opcoes = [
    { id: 1, nome: "ATENDIMENTO PARA MIM" },
    { id: 2, nome: "ATENDIMENTO PARA OUTRA PESSOA" },
  ];

  let message = ` Para quem você deseja o atendimento?\n\n`;

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

  bot.onText(/^(.*)$/, async (msg, match) => {
    const selectedOptionLabel = match[1];

    switch (selectedOptionLabel) {
      case "ATENDIMENTO PARA MIM":
        listaOpcoesComandos(msg, bot, listaOpcoesComandos, pessoa);
        return;
      case "ATENDIMENTO PARA OUTRA PESSOA":
        getPessoaAtendimento(msg, bot, false, listaOpcoesComandos);
        return;
      default:
        break;
    }
  });
}

async function getPessoaAtendimento(
  msg,
  bot,
  reincidencia,
  listaOpcoesComandos
) {
  bot.removeTextListener(/^(.*)$/);
  const listener = /^(.*)$/;
  const greetingsPhone = /^\d{11}$/;
  let message =
    "Por favor, digite o número do CPF ou telefone da pessoa que desejar atendimento.\n Para telefone, o formato DDD + número.\nExemplo: 45991234567\n para CPF, o seguinte formato: 01234567899";
  let telefone = 0;

  telefone = msg.from.contact?.phone_number;

  if (!telefone) {
    bot.removeTextListener(/^(.*)$/);
    bot.sendMessage(msg.chat.id, message);
  }

  bot.onText(listener, async (matchMsg, match) => {
    bot.removeTextListener(listener);
    try {
      bot.removeTextListener(greetingsPhone);

      if (match && greetingsPhone.test(match[0])) {
        let ident = match[0];
        await getPessoa(ident, msg, bot, listaOpcoesComandos, reincidencia);
      } else {
        await bot.sendMessage(
          msg.chat.id,
          "Desculpe, mas o número informado não possui exatamente 11 dígitos numéricos."
        );
        getPessoaAtendimento(msg, bot, reincidencia, listaOpcoesComandos);
      }
    } catch (error) {
      console.error("Erro ao fazer a solicitação GET:", error.message);
    }
  });
}

module.exports = { listaOpcoesComandos, iniciarAtendimento };
