const {
  listarAgendamentosByBot,
  marcarAgendamentosByBot,
  remarcarAgendamentosByBot,
  listarPessoaAgendamentosByBot,
} = require("../../webhooks/agendamento/agendamentoWebhooks");
const montarTiposAgendamentoByOrganizacao = require("../agendamento/tipoAgendamentoHandlers");
const montarOrganizacoesByAgendamento = require("../organizacao/organizacaoHandlers");
const {
  montarProfissionaisByAgendamento,
  montarPreferenciaProfissional,
} = require("../pessoa/profissionalHandlers");

const {
  formatCelular,
  formatDate,
  formatTime,
  formatDateReverse,
} = require("../../../utils/formatters");
const {
  montarDataAgendamento,
  montarHorarioAgendamento,
} = require("./dataAgendamentoHandlers");
require("moment-business-days");
require("moment/locale/pt-br");

async function listarAgendamentoByPessoa(
  msg,
  bot,
  pessoa,
  listaOpcoesComandos,
  reagendar
) {
  const response = await listarPessoaAgendamentosByBot(pessoa, reagendar);

  if (response.data?.length === 0) {
    let message = `Você não possui agendamentos.`;
    await bot.sendMessage(msg.chat.id, message);
    return listaOpcoesComandos(msg, bot, listaOpcoesComandos, pessoa);
  }
  let message = `Aqui estão os agendamentos de ${pessoa.nome}:\n\n`;

  const agendamentos = response.data.map((agendamento) => {
    let {
      tipoAgendamento,
      profissionalAgendamento,
      organizacaoAgendamento,
      endereco,
      dataAgendamento,
      horarioAgendamento,
      statusAgendamento,
    } = agendamento;

    celularOrganizacao = formatCelular(organizacaoAgendamento.celular);
    dataAgendamento = formatDate(dataAgendamento);
    horarioAgendamento = formatTime(horarioAgendamento);

    return (
      `Tipo de Agendamento: ${tipoAgendamento.tipoAgendamento}\n` +
      `Profissional: ${profissionalAgendamento.nome}\n` +
      `Organização: ${organizacaoAgendamento.nome}\n` +
      `Endereço: ${endereco}\n` +
      `Celular da Organização: ${celularOrganizacao}\n` +
      `Data do Agendamento: ${dataAgendamento}\n` +
      `Horário do Agendamento: ${horarioAgendamento}\n` +
      `Status: ${statusAgendamento.status}\n\n`
    );
  });

  message += agendamentos.join("");

  bot.sendMessage(msg.chat.id, message);
  return listaOpcoesComandos(msg, bot, listaOpcoesComandos, pessoa);
}

async function listarAgendamento(pAgendamento) {
  const response = await listarAgendamentosByBot(pAgendamento);
  return response;
}

async function marcarAgendamento(pAgendamento, bot, msg) {
  const response = await marcarAgendamentosByBot(
    pAgendamento.newAgendamento,
    bot,
    msg
  );
  return response;
}

async function remarcarAgendamento(pOldAgendamento, pNewAgendamento, bot, msg) {
  let agendamentos = [pOldAgendamento, pNewAgendamento];

  const response = await remarcarAgendamentosByBot(agendamentos, bot, msg);
  return response;
}

async function montarAgendamento(
  msg,
  bot,
  pessoa,
  listaOpcoesComandos,
  reagendar
) {
  let agendamento = {};

  const organizacao = await montarOrganizacoesByAgendamento(
    msg,
    bot,
    pessoa,
    listaOpcoesComandos
  );

  if (!organizacao) {
    return await listaOpcoesComandos(msg, bot, listaOpcoesComandos, pessoa);
  }

  const tipoAgendamento = await montarTiposAgendamentoByOrganizacao(
    msg,
    bot,
    organizacao,
    listaOpcoesComandos,
    pessoa
  );

  if (organizacao && !tipoAgendamento) {
    return await listaOpcoesComandos(msg, bot, listaOpcoesComandos, pessoa);
  }

  const dataAgendamento = await montarDataAgendamento(
    msg,
    bot,
    organizacao,
    listaOpcoesComandos,
    pessoa,
    tipoAgendamento
  );

  if (tipoAgendamento && !dataAgendamento) {
    return listaOpcoesComandos(msg, bot, listaOpcoesComandos, pessoa);
  }

  const comPreferencia = await montarPreferenciaProfissional(
    msg,
    bot,
    listaOpcoesComandos
  );

  let profissional = {};

  let horarioAgendamento = {};

  if (comPreferencia) {
    profissional = await montarProfissionaisByAgendamento(
      msg,
      bot,
      organizacao,
      dataAgendamento,
      tipoAgendamento,
      comPreferencia,
      listaOpcoesComandos,
      pessoa
    );
  }

  horarioAgendamento = await montarHorarioAgendamento(
    msg,
    bot,
    organizacao,
    dataAgendamento,
    tipoAgendamento,
    comPreferencia,
    listaOpcoesComandos,
    pessoa,
    profissional,
    reagendar
  );

  if ((!profissional && horarioAgendamento) || !horarioAgendamento) {
    return listaOpcoesComandos(msg, bot, listaOpcoesComandos, pessoa);
  }

  agendamento = {
    pessoaAgendamento: pessoa,
    organizacaoAgendamento: organizacao,
    tipoAgendamento: tipoAgendamento,
    dataAgendamento: dataAgendamento,
    horarioAgendamento: horarioAgendamento?.horarioAgendamento,
    profissionalAgendamento: horarioAgendamento.profissionalAgendamento,
    comPreferencia: comPreferencia,
    statusAgendamento: {
      id: 1,
    },
  };

  let labelAgendamento = {
    organizacaoNome: organizacao.nome,
    dataAgendamento: dataAgendamento,
    tipoAgendamento: tipoAgendamento.tipoAgendamento,
    pessoaNome: pessoa.nome,
    profissionalNome: horarioAgendamento.profissionalAgendamento.nome,
    horarioAgendamento: horarioAgendamento.horarioAgendamento,
    celularOrganizacao: organizacao.celular,
    endereco: horarioAgendamento.endereco,
  };

  return (returnAgendamento = {
    newAgendamento: agendamento,
    labelAgendamento: labelAgendamento,
  });
}

async function selecionarAgendamentoRemarcacao(
  msg,
  bot,
  pessoa,
  listaOpcoesComandos,
  reagendar
) {
  const agendamentos = await listarPessoaAgendamentosByBot(pessoa, reagendar);

  if (agendamentos.data.length === 0) {
    let message = `Você não possui agendamentos para realizar a remarcação.`;
    await bot.sendMessage(msg.chat.id, message);

    return null;
  } else {
    bot.removeTextListener(/^(.*)$/);
    let message = `Aqui estão os seus agendamentos disponíveis.\n Selecione qual você deseja reagendar:\n\n`;

    const opcoes = agendamentos.data.map((agendamento) => {
      let dataFormatada = formatDate(agendamento.dataAgendamento);
      return {
        id: agendamento.id,
        tipoAgendamento: agendamento.tipoAgendamento,
        profissional: agendamento.profissionalAgendamento,
        organizacao: agendamento.organizacaoAgendamento,
        endereco: agendamento.endereco,
        celularOrganizacao: agendamento.organizacaoAgendamento.celular,
        dataAgendamento: agendamento.dataAgendamento,
        horarioAgendamento: agendamento.horarioAgendamento,
        status: agendamento.statusAgendamento.status,
        label: `${agendamento.organizacaoAgendamento.nome} - ${agendamento.profissionalAgendamento.nome} - ${dataFormatada} às ${agendamento.horarioAgendamento}`,
      };
    });

    const keyboard = opcoes.map((opcao) => [opcao.label]);

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
          (opcao) => opcao.label === selectedOptionLabel
        );

        if (selectedOption) {
          resolve(selectedOption);
        } else {
          resolve(null);
        }
      });
    });
  }
}

async function confirmarAgendamento(
  msg,
  bot,
  listaOpcoesComandos,
  agendamento,
  pessoa
) {
  if (agendamento?.labelAgendamento) {
    const opcoes = [
      { id: 1, nome: "CONFIRMAR" },
      { id: 2, nome: "VOLTAR AO MENU" },
      { id: 3, nome: "CANCELAR" },
    ];

    let message = ` Por favor, verifique as seguintes informações antes de confirmar o agendamento:\n\n`;

    let dataFormatada = formatDate(
      agendamento.labelAgendamento.dataAgendamento
    );

    message +=
      `Cliente: ${agendamento.labelAgendamento.pessoaNome}\n` +
      `Tipo de Agendamento: ${agendamento.labelAgendamento.tipoAgendamento}\n` +
      `Profissional: ${agendamento.labelAgendamento.profissionalNome}\n` +
      `Organização:  ${agendamento.labelAgendamento.organizacaoNome}\n` +
      `Endereço: ${agendamento.labelAgendamento.endereco}\n` +
      `Celular da Organização: ${formatCelular(
        agendamento.labelAgendamento.celularOrganizacao
      )}\n` +
      `Data do Agendamento: ${dataFormatada}\n` +
      `Horário do Agendamento: ${agendamento.labelAgendamento.horarioAgendamento}\n`;

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
          case "VOLTAR AO MENU":
            bot.removeTextListener(/^(.*)$/);
            return listaOpcoesComandos(msg, bot, listaOpcoesComandos, pessoa);
          case "CANCELAR":
            bot.sendMessage(
              msg.chat.id,
              "A Clinica agradece ao contato e a preferência!"
            );
            return;
          default:
            break;
        }
      });
    });
  }
}

async function confirmarReagendamento(
  msg,
  bot,
  listaOpcoesComandos,
  oldAgendamento,
  newAgendamento,
  pessoa
) {
  if (oldAgendamento) {
    const opcoes = [
      { id: 1, nome: "CONFIRMAR" },
      { id: 2, nome: "VOLTAR AO MENU" },
      { id: 3, nome: "CANCELAR" },
    ];

    let message = ` Por favor, verifique as seguintes informações antes de confirmar o reagendamento:\n\n`;

    let newDataFormatada = formatDate(
      newAgendamento.newAgendamento.dataAgendamento
    );
    let oldDataFormatada = formatDate(oldAgendamento.dataAgendamento);

    message +=
      `Agendamento Anterior:\n\n` +
      `Cliente: ${pessoa.nome}\n` +
      `Tipo de Agendamento: ${oldAgendamento.tipoAgendamento.tipoAgendamento}\n` +
      `Profissional: ${oldAgendamento.profissional.nome}\n` +
      `Organização:  ${oldAgendamento.organizacao.nome}\n` +
      `Endereço: ${oldAgendamento.endereco}\n` +
      `Celular da Organização: ${formatCelular(
        oldAgendamento.organizacao.celular
      )}\n` +
      `Data do Agendamento: ${oldDataFormatada}\n` +
      `Horário do Agendamento: ${oldAgendamento.horarioAgendamento}\n\n\n`;

    message +=
      `Agendamento a remarcar:\n\n` +
      `Cliente: ${newAgendamento.labelAgendamento.pessoaNome}\n` +
      `Tipo de Agendamento: ${newAgendamento.labelAgendamento.tipoAgendamento}\n` +
      `Profissional: ${newAgendamento.labelAgendamento.profissionalNome}\n` +
      `Organização:  ${newAgendamento.labelAgendamento.organizacaoNome}\n` +
      `Endereço: ${newAgendamento.labelAgendamento.endereco}\n` +
      `Celular da Organização: ${formatCelular(
        newAgendamento.labelAgendamento.celularOrganizacao
      )}\n` +
      `Data do Agendamento: ${newDataFormatada}\n` +
      `Horário do Agendamento: ${newAgendamento.labelAgendamento.horarioAgendamento}\n`;

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
          case "VOLTAR AO MENU":
            bot.removeTextListener(/^(.*)$/);
            return listaOpcoesComandos(msg, bot, listaOpcoesComandos, pessoa);
          case "CANCELAR":
            bot.sendMessage(
              msg.chat.id,
              "A Clinica agradece ao contato e a preferência!"
            );
            return;
          default:
            break;
        }
      });
    });
  }
}

module.exports = {
  listarAgendamento,
  marcarAgendamento,
  remarcarAgendamento,
  listarAgendamentoByPessoa,
  montarAgendamento,
  selecionarAgendamentoRemarcacao,
  confirmarAgendamento,
  confirmarReagendamento,
};
