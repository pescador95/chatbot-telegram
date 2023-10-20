const { api } = require("../../../config/axios/apiService");
const endpoints = require("../../endpoints/endpoints");

async function getPessoaByPhone(telefone) {
  try{
    return await api.get(endpoints.pessoa.getByPhone(telefone));
} catch (error) {
  console.log(error);
}
}

async function getPessoaByCPF(cpf) {
  try{
    return await api.get(endpoints.pessoa.getByCPF(cpf));
  } catch (error) {
    console.log(error);
  }

}

async function getPessoaByIdent(ident) {
  try{
    return await api.get(endpoints.pessoa.getByIdent(ident));
  } catch (error) {
    console.log(error);
  }

}

async function getPessoaByTelegram(telegramId) {
  try{
    let response = await api.get(endpoints.pessoa.getByTelegram(telegramId));
    return response;
  } catch (error) {
    console.log(error);
  }

}

module.exports = {
    getPessoaByPhone,
    getPessoaByCPF,
    getPessoaByIdent,
    getPessoaByTelegram
}