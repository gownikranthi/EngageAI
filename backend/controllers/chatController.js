const ragService = require('../services/ragService');

exports.handleRagChat = async (req, res) => {
  const { question } = req.body;

  if (!question) {
    return res.status(400).json({ message: 'A question is required.' });
  }

  try {
    const answer = await ragService.ask(question);
    res.status(200).json({ response: answer });
  } catch (error) {
    console.error('RAG Chat error:', error);
    res.status(500).json({ message: 'Error processing your question.' });
  }
}; 