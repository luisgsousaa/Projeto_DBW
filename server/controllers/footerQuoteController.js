
const getQuote = async (req, res) => {
  try {
    const response = await fetch("https://api.api-ninjas.com/v1/quotes", {
      headers: {
        "X-Api-Key": process.env.API_NINJAS_KEY // chave guardada no .env
      }
    });

    if (!response.ok) {
      return res.status(response.status).json({ error: 'Erro ao obter quote' });
    }

    const data = await response.json();

    const quote = {
      text: data[0].quote,
      author: data[0].author
    };

    res.json(quote);

  } catch (error) {
    console.error('Erro ao obter quote:', error);
    res.status(500).json({ error: 'Erro do servidor' });
  }
};

module.exports = { getQuote };