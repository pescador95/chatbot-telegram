const endpoints = require("../../endpoints/endpoints");

async function login(api, login, password) {
  try {
    return await api.post(endpoints.login.auth, {
      login,
      password,
    });
  } catch (error) {
    console.error("Erro ao autenticar:", error.message);
  }
}

async function refresh(api, refreshToken) {
  try {
    return await api.post(endpoints.login.refresh, {
      refreshToken: refreshToken,
    });
  } catch (error) {
    console.error("Erro ao autenticar:", error.message);
  }
}

module.exports = { login, refresh };
