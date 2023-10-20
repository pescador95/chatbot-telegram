const { api } = require("../../../config/axios/apiService");
const endpoints = require("../../endpoints/endpoints");

async function listarTiposAgendamentoByOrganizacaoBot(organizacoes) {
  try{
    return await api.get(
        endpoints.tipoAgendamentos.listarTipoAgendamentos(organizacoes)
    );
  } catch (error){
    console.error(error);
  }

}

module.exports = listarTiposAgendamentoByOrganizacaoBot;
