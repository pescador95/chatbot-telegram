const {
  formatDate,
  formatDateReverse,
  formatCPF,
  formatCelular,
} = require("../../../utils/formatters");

const { validaCpf, isValidBirthDay } = require("../../../utils/validators");
const {
  getPessoaByIdent,
  createPessoaByBot,
  getPessoaByTelegram,
  updatePessoaByBot,
  removeTelegramIdPessoaByBot,
} = require("../../webhooks/pessoa/pessoaWebhooks");

async function getPessoaByTelegramId(msg) {
  try {
    let telegramId = msg?.from?.id.toString();

    let response = await getPessoaByTelegram(telegramId);
    return response.data;
  } catch (error) {
    console.log(error);
    return null;
  }
}

async function getPessoa(
  parameter,
  msg,
  bot,
  listaOpcoesComandos,
  reincidente
) {
  return new Promise(async (resolve, reject) => {
    try {
      parameter = parameter.replace(/\D/g, "");
      let ident = parameter;
      let pessoa;

      let response = await getPessoaByIdent(ident);

      if (response && response.data.length > 0 && response.data[0]?.nome) {
        pessoa = response.data[0];
      }

      let pessoaTelegram = await getPessoaByTelegramId(msg);

      if (pessoa?.nome && pessoa?.id) {
        if (!pessoa.telegramId && !pessoaTelegram?.telegramId) {
          await updatePessoaWithTelegramId(msg, bot, pessoa);
        }
        listaOpcoesComandos(msg, bot, listaOpcoesComandos, pessoa);
      } else {
        makePessoaByBot(parameter, msg, bot, listaOpcoesComandos, reincidente);
      }
    } catch (error) {
      reject(error);
    }
  });
}

async function makePessoaByBot(
  parameter,
  msg,
  bot,
  listaOpcoesComandos,
  reincidente
) {
  let nome = await makeNomePessoa(msg, bot, reincidente);
  let dataNascimento = await makeDataNascimentoPessoa(msg, bot);
  dataNascimento = formatDateReverse(dataNascimento);
  let cpf;
  let celular;

  if (reincidente) {
    celular = await makeCelularPessoa(msg, bot);
    cpf = await makeCpfPessoa(msg, bot);
  } else {
    if (validaCpf(parameter)) {
      cpf = parameter;
      celular = await makeCelularPessoa(msg, bot);
    } else {
      cpf = await makeCpfPessoa(msg, bot);
      celular = parameter;
    }
  }

  const pessoa = {
    nome: nome,
    dataNascimento: dataNascimento,
    celular: celular,
    cpf: cpf,
  };

  let pessoaTelegram = await getPessoaByTelegramId(msg);

  if (pessoa?.nome && pessoa?.id) {
    if (!pessoa.telegramId && !pessoaTelegram?.telegramId) {
      let vincularTelegram = await updatePessoaWithTelegramId(msg, bot, pessoa);
      if (vincularTelegram) {
        pessoa.telegramId = msg?.from?.id;
      }
    }
  }

  let confirmarPessoaCadastro = await confirmarPessoa(
    msg,
    bot,
    listaOpcoesComandos,
    pessoa,
    parameter
  );

  if (confirmarPessoaCadastro) {
    try {
      let response = await createPessoa(
        parameter,
        msg,
        bot,
        listaOpcoesComandos,
        reincidente,
        pessoa
      );
      let newPessoa = response.data;
      await bot.sendMessage(msg.chat.id, response.messages[0]);
      listaOpcoesComandos(msg, bot, listaOpcoesComandos, newPessoa);
    } catch (error) {
      console.log(error);
    }
  }
}

async function makeNomePessoa(msg, bot, reincidente) {
  bot.removeTextListener(/^(.*)$/);
  let message = "";

  if (!reincidente) {
    message +=
      "Não foi possível localizar o cadastro da pessoa em nossos sistemas.\n";
  }

  message += "Por favor, digite o nome da pessoa que deseja atendimento.";

  await bot.sendMessage(msg.chat.id, message);

  let nomeRegex = /^[a-zA-Z\u00C0-\u00FF ]+$/;

  let listener = /^(.*)$/;

  return new Promise((resolve) => {
    bot.onText(listener, async (msg, match) => {
      const userInput = match[1].replace(/\d/g, "");
      if (userInput && nomeRegex.test(userInput) && userInput.length >= 3) {
        bot.removeTextListener(listener);
        resolve(userInput);
      } else {
        let errorMessage =
          "O nome deve ter pelo menos 3 caracteres. Por favor, digite novamente.";
        await bot.sendMessage(msg.chat.id, errorMessage);
        makeNomePessoa(msg, bot, true).then(resolve);
      }
    });
  });
}

async function makeDataNascimentoPessoa(msg, bot) {
  bot.removeTextListener(/^(.*)$/);
  let message =
    "Por favor, digite a data de nascimento da pessoa que desejar atendimento, seguindo o seguinte formato: DD/MM/AAAA.\nExemplo: 01/01/2000\n\n";

  await bot.sendMessage(msg.chat.id, message);

  const listener = /^(.*)$/;
  let dataRegex = /^\d{2}\/\d{2}\/\d{4}$/;

  return new Promise((resolve) => {
    bot.onText(listener, async (msg, match) => {
      bot.removeTextListener(listener);
      bot.removeTextListener(dataRegex);
      if (isValidBirthDay(match[0])) {
        const dataNascimento = match[0];
        resolve(dataNascimento);
      } else {
        await bot.sendMessage(
          msg.chat.id,
          "A data digitada não é válida. Por favor, digite a data no formato dd/mm/aaaa e que seja menor ou igual a data de hoje!"
        );
        resolve(makeDataNascimentoPessoa(msg, bot));
      }
    });
  });
}

async function makeCpfPessoa(msg, bot) {
  bot.removeTextListener(/^(.*)$/);

  let message =
    "Por favor, digite o número do CPF da pessoa que será atendida.\n" +
    "CPF Exemplo: 012.456.789-00 ou 01234567899";

  bot.sendMessage(msg.chat.id, message);

  const listener = /^(.*)$/;
  const cpfPattern = /^(?:\d{11}|[0-9]{3}\.[0-9]{3}\.[0-9]{3}-[0-9]{2})$/;

  return new Promise((resolve) => {
    bot.onText(listener, async (msg, match) => {
      bot.removeTextListener(listener);
      bot.removeTextListener(cpfPattern);
      if (match && cpfPattern.test(match[0])) {
        let cpf = match[0].replace(/\D/g, "");
        resolve(cpf);
      } else {
        let message = "O CPF digitado não é válido.";
        await bot.sendMessage(msg.chat.id, message);
        const cpf = await makeCpfPessoa(msg, bot);
        resolve(cpf);
      }
    });
  });
}

async function makeCelularPessoa(msg, bot) {
  bot.removeTextListener(/^(.*)$/);
  const listener = /^(.*)$/;
  const celularPattern = /(\d{11})/;
  let message =
    "Por favor, digite o celular da pessoa que desejar atendimento.\n Celular exemplo: (45) 9 9123-4567.\n Insira-o no formato DDD + número: \n45991234567\n";

  bot.removeTextListener(/^(.*)$/);
  bot.sendMessage(msg.chat.id, message);
  return new Promise((resolve) => {
    bot.onText(listener, async (msg, match) => {
      bot.removeTextListener(listener);
      bot.removeTextListener(celularPattern);
      if (match && match[0]) {
        let celular = match[0].replace(/\D/g, "");
        resolve(celular);
      } else {
        let message = "O celular digitado não é válido.";
        await bot.sendMessage(msg.chat.id, message);
        resolve(makeCelularPessoa(msg, bot));
      }
    });
  });
}

async function confirmarPessoa(
  msg,
  bot,
  listaOpcoesComandos,
  pessoa,
  parameter
) {
  if (pessoa?.nome) {
    const opcoes = [
      { id: 1, nome: "CONFIRMAR" },
      { id: 2, nome: "CORRIGIR AS INFORMAÇÕES" },
      { id: 3, nome: "CANCELAR" },
    ];

    let message = ` Por favor, verifique as seguintes informações antes de confirmar o cadastro da pessoa:\n\n`;

    message +=
      `Nome da pessoa: ${pessoa.nome}\n` +
      `Data de Nascimento: ${formatDate(pessoa.dataNascimento)}\n` +
      `Contato: ${formatCelular(pessoa.celular)}\n` +
      `CPF:  ${formatCPF(pessoa.cpf)}\n`;

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
          case "CONFIRMAR":
            bot.removeTextListener(/^(.*)$/);
            return resolve(true);
          case "CORRIGIR AS INFORMAÇÕES":
            bot.removeTextListener(/^(.*)$/);
            return getPessoa(parameter, msg, bot, listaOpcoesComandos, true);
          case "CANCELAR":
            bot.sendMessage(
              msg.chat.id,
              "A Clinica agradece ao contato e a preferência!"
            );
          default:
            break;
        }
      });
    });
  }
}

async function createPessoa(
  parameter,
  msg,
  bot,
  listaOpcoesComandos,
  reincidente,
  pPessoa
) {
  try {
    let response = await createPessoaByBot(pPessoa);
    if (response && response.data) {
      return response.data;
    }
  } catch (error) {
    await bot.sendMessage(msg.chat.id, error.response.data.messages[0]);
    makePessoaByBot(parameter, msg, bot, listaOpcoesComandos, true);
  }
}

async function updatePessoaWithTelegramId(msg, bot, pessoa) {
  const opcoes = [
    { id: 1, nome: "SIM" },
    { id: 2, nome: "NÃO" },
  ];

  let vincular;

  let message =
    "Deseja vincular essa conta do Telegram ao cadastro da pessoa: " +
    pessoa.nome +
    "?";

  const keyboard = opcoes.map((opcao) => [opcao.nome]);

  const replyMarkup = {
    keyboard,
    one_time_keyboard: true,
    resize_keyboard: true,
  };

  bot.sendMessage(msg.chat.id, message, {
    reply_markup: JSON.stringify(replyMarkup),
  });

  return new Promise(async (resolve) => {
    const callback = async (msg, match) => {
      const selectedOptionLabel = match[1];

      switch (selectedOptionLabel) {
        case "SIM":
          pessoa.telegramId = msg?.from?.id;
          let telegramId = msg?.from?.id.toString();
          let response = await updatePessoaByBot(pessoa, telegramId);
          vincular = true;
          await bot.sendMessage(msg.chat.id, response.data.messages[0]);
          break;
        case "NÃO":
          vincular = false;
          break;
        default:
          break;
      }
      bot.removeTextListener(callback);
      resolve(vincular);
    };

    bot.onText(/^(.*)$/, callback);
  });
}

async function updatePessoaRemoveTelegramId(
  msg,
  bot,
  pessoa,
  listaOpcoesComandos
) {
  const opcoes = [
    { id: 1, nome: "REMOVER" },
    { id: 2, nome: "CANCELAR" },
  ];

  let vincular;

  let message =
    "Deseja remover o vínculo dessa conta do Telegram ao cadastro da pessoa: " +
    pessoa.nome +
    "?";

  const keyboard = opcoes.map((opcao) => [opcao.nome]);

  const replyMarkup = {
    keyboard,
    one_time_keyboard: true,
    resize_keyboard: true,
  };

  bot.sendMessage(msg.chat.id, message, {
    reply_markup: JSON.stringify(replyMarkup),
  });

  return new Promise(async (resolve) => {
    const callback = async (msg, match) => {
      const selectedOptionLabel = match[1];

      switch (selectedOptionLabel) {
        case "REMOVER":
          pessoa.telegramId = msg?.from?.id;
          let telegramId = msg?.from?.id.toString();
          let response = await removeTelegramIdPessoaByBot(pessoa, telegramId);
          vincular = true;
          await bot.sendMessage(msg.chat.id, response.data.messages[0]);
          break;
        case "CANCELAR":
          vincular = false;
          break;
        default:
          break;
      }
      bot.removeTextListener(callback);
      resolve(listaOpcoesComandos(msg, bot, listaOpcoesComandos, pessoa));
    };

    bot.onText(/^(.*)$/, callback);
  });
}

module.exports = {
  getPessoa,
  getPessoaByTelegramId,
  updatePessoaRemoveTelegramId,
};
