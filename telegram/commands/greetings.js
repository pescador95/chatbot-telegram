const { listaOpcoesComandos, iniciarAtendimento} = require("./opcoes");
const {getPessoa, getPessoaByTelegramId} = require("../routes/handlers/pessoa/pessoaHandlers");

async function greetingsCommand(msg, bot, reincidencia) {
  bot.removeTextListener(/^(.*)$/);
  const listener = /^(.*)$/;
  const greetingsPhone = /(\d{11})/;
  let message = "";
  message =
      "Por favor, digite o número do CPF ou telefone da pessoa que desejar atendimento.\n Para telefone, o formato DDD + número.\nExemplo: 45991234567\n para CPF, o seguinte formato: 01234567899";
  let telefone = 0;

  telefone = msg.from.contact?.phone_number;

  let pessoa = await getPessoaByTelegramId(msg);
  if (pessoa?.nome && pessoa?.id) {
    iniciarAtendimento(msg, bot, pessoa);
  } else {

  if (!telefone) {
    bot.removeTextListener(/^(.*)$/);
    bot.sendMessage(msg.chat.id, message);
  }

  bot.onText(listener, async (matchMsg, match) => {
    bot.removeTextListener(listener);
    try {
      bot.removeTextListener(greetingsPhone);
      if (match && greetingsPhone.test(match[0])) {
        let ident = match[0].replace(/\D/g, "");
        await getPessoa(ident, msg, bot, listaOpcoesComandos, reincidencia);
      } else {
        let message = "Desculpe, mas o número informado não possui exatamente 11 dígitos numéricos.";
        await bot.sendMessage(msg.chat.id, message);
        await greetingsCommand(msg, bot, reincidencia);
      }
    } catch (error) {
      console.error("Erro ao fazer a solicitação GET:", error.message);
    }
  });
}
}

module.exports = greetingsCommand;
