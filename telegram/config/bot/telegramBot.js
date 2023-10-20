const TelegramBot = require("node-telegram-bot-api");

const termosCommand = require("../../commands/termos");
const {getPessoaByTelegramId} = require("../../routes/handlers/pessoa/pessoaHandlers");
const {iniciarAtendimento} = require("../../commands/opcoes");

let token = process.env.TELEGRAM_TOKEN || `${$TELEGRAM_TOKEN}`;

const bot = new TelegramBot(token, { polling: true });

const saudacoesRegExp = /^(oi|ola|iniciar|start|comecar|\/start|olá|oi\s+bot|oi\s+amigo|hey|oi\s+ai|bom\s+dia|boa\s+tarde|boa\s+noite)$/i;

bot.onText(saudacoesRegExp, async (msg) => {
  bot.removeTextListener(/^(.*)$/, termosCommand);
  let pessoa = await getPessoaByTelegramId(msg);
  if (pessoa?.nome && pessoa?.id) {
    iniciarAtendimento(msg, bot, pessoa);
  } else {
    termosCommand(msg, bot);
  }
});

async function enviarMensagem(id, mensagem) {
  await bot.sendMessage(id, mensagem);
}

module.exports = {bot, enviarMensagem};
