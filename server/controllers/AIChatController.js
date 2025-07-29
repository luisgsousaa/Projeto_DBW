

const LM_STUDIO_URL = "http://89.109.76.139:1234/v1/chat/completions";
const axios = require("axios");

const { Profile } = require("../models/users");

/**
 * Query que vai buscar o user a base de dados
 * @param {*} req pedido request
 * @param {*} res  resposta
 * @returns 
 */

const getAIChat = async function (req, res) {
  if (!req.isAuthenticated()) {
    return res.redirect("/login?warning=nao_autenticado");
  }

  try {
    const profile = await Profile.findOne({ user: req.user._id });
    if (!profile) {
      return res.redirect("/login?warning=perfil_nao_encontrado");
    }

    res.render("ai-chat", { user: req.user, username: profile.username });
  } catch (err) {
    console.error(err);
    res.status(500).send("Erro interno do servidor");
  }
};

/**
 * Função que ira enviar o pedido em json para aquele URL, e retorna a resposta que e enviado para o frontend
 * @param {*} req pedido request
 * @param {*} res resposta
 * @returns 
 */

const handleChatCompletion = async (req, res) => {
  try {
    const { prompt } = req.body; // Extrai o prompt da requisição

    if (!prompt) {
      return res.status(400).json({ success: false, message: "Prompt é obrigatório." });
    }

    // requestData  que será enviado para o LM Studio
    const requestData  = {
      messages: [
        {
          role: "user", // O papel do remetente (no caso, o usuário)
          content: prompt, // O conteúdo enviado pelo usuário
        },
      ],
      model: "llama-3.2-1b-claude-3.7-sonnet-reasoning-distilled",
      temperature: 0.7,
      stream: false,
    };
    // Faz a requisição para o LM Studio
    const lmResponse = await axios.post(LM_STUDIO_URL, requestData );

    console.log("Resposta do LM Studio:", lmResponse.data);

    // Retorna a resposta para o frontend
    res.json({ success: true, response: lmResponse.data });
  } catch (error) {
    console.error("Erro ao processar a requisição:", error.message);
    
  }
};





module.exports = { getAIChat,handleChatCompletion };


 
