const { api } = require("../../../config/axios/apiService");
const endpoints = require("../../endpoints/endpoints");

async function listarOrganizacoesByAgendamentoBot() {
  try{
    return await api.get(endpoints.organizacao.listaOrganizacoes);
  } catch (error) {
  console.log(error);
  }
}

module.exports = listarOrganizacoesByAgendamentoBot;
