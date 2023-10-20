const moment = require("moment");
const { serverInfo } = require("./serverInfo");
const { enviarMensagem } = require("../bot/telegramBot");
const endpoints = require("../../routes/endpoints/endpoints");
let data = moment().format("DD/MM/YYYY HH:mm:ss");


const bodyParser = require("express");
const express = require("express");

const app = express();
const port = process.env.TELEGRAM_PORT || 5000;

app.use(bodyParser.json());
app.use(express.urlencoded({ extended: true }));
function start() {


  serverInfo();

  app.listen(port, () => {
    console.log(
      `Servidor API Bot Telegram utilizando Express iniciado na porta ${port}` +
        ". Serviço iniciado em: " +
        data
    );
  });
}

app.post(endpoints.pessoa.sendNotification, async (req, res) => {
  const { id } = req?.params;
  const {mensagem} = req.body;
  newMessage = mensagem.replace(/\\n/g, '\n');

  if (!newMessage) {
    return res.status(400).json({
      error: "A mensagem é obrigatório no Body da solicitação.",
    });
  }
  try {
    await enviarMensagem(id, newMessage);

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error("Erro ao enviar mensagem:", error);
    return res.status(500).json({ error: "Erro ao enviar mensagem." });
  }
});

module.exports = { app, start };
