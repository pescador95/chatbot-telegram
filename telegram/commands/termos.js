require("node-telegram-bot-api");
const greetingsCommand = require("../commands/greetings");

async function termosCommands(msg, bot) {
  const opcoes = [
    { id: 1, nome: "ACEITAR" },
    { id: 2, nome: "RECUSAR" },
  ];

  let message = ` Olá! Meu nome é Beatriz, sou sua assistente virtual da Clínica.\nNós estamos ansiosos para atender você!\n\nPara iniciar o seu atendimento e respeitando a Lei Geral de Proteção de Dados (LGPD), informamos que podemos coletar dados pessoais, e para dar continuidade ao seu atendimento precisamos que aceite nossa política de privacidade:\n https://exemplo.com.br\n\nVocê aceita nossa política de privacidade?\n\n`;

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
      case "ACEITAR":
        greetingsCommand(msg, bot, false);
        return;
      case "RECUSAR":
        bot.sendMessage(
          msg.chat.id,
          "A Clinica agradece ao contato e a preferência!"
        );
        return;
      default:
        break;
    }
  });
}

module.exports = termosCommands;
