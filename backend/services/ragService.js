const { FaissStore } = require("@langchain/community/vectorstores/faiss");
const { GoogleGenerativeAIEmbeddings, ChatGoogleGenerativeAI } = require("@langchain/google-genai");
const { RecursiveCharacterTextSplitter } = require("langchain/text_splitter");
const { createStuffDocumentsChain } = require("langchain/chains/combine_documents");
const { ChatPromptTemplate } = require("@langchain/core/prompts");
const { createRetrievalChain } = require("langchain/chains/retrieval");
const Event = require('../models/Event'); // Your Mongoose Event model

// In-memory cache for our vector store to avoid rebuilding it on every request
let vectorStore;

/**
 * Initializes the FAISS vector store with event data from MongoDB.
 * This function should be called when the server starts.
 */
async function initializeVectorStore() {
  console.log("Initializing RAG vector store...");
  try {
    // 1. Load all non-deleted events from the database
    const events = await Event.find({ isDeleted: false }).lean();
    if (events.length === 0) {
      console.log("No events found to build the knowledge base.");
      return;
    }

    // 2. Format the event data into plain text documents
    const documents = events.map(event => (
      `Event Name: ${event.name}\n` +
      `Description: ${event.description}\n` +
      `Starts At: ${new Date(event.startTime).toLocaleString('en-IN')}\n` +
      `Ends At: ${new Date(event.endTime).toLocaleString('en-IN')}`
    ));

    // 3. Split the documents into smaller, manageable chunks
    const textSplitter = new RecursiveCharacterTextSplitter({ chunkSize: 1000 });
    const splitDocs = await textSplitter.createDocuments(documents);

    // 4. Create embeddings using Google's model
    const embeddings = new GoogleGenerativeAIEmbeddings({
      apiKey: process.env.GEMINI_API_KEY,
    });

    // 5. Create a FAISS vector store from the documents and embeddings
    vectorStore = await FaissStore.fromDocuments(splitDocs, embeddings);
    console.log("RAG vector store initialized successfully.");

  } catch (error) {
    console.error("Failed to initialize vector store:", error);
  }
}

/**
 * Gets a response from the RAG chain.
 * @param {string} question - The user's question.
 * @returns {Promise<string>} The AI's answer.
 */
async function ask(question) {
  if (!vectorStore) {
    return "I'm sorry, my knowledge base is not available at the moment. Please try again later.";
  }
  if (!process.env.GEMINI_API_KEY) {
    console.error("GEMINI_API_KEY is not set. Please add it to your environment variables.");
    return "AI assistant is not available: missing API key. Please contact the administrator.";
  }
  try {
    // Define the model and the prompt template
    const llm = new ChatGoogleGenerativeAI({ apiKey: process.env.GEMINI_API_KEY });
    const prompt = ChatPromptTemplate.fromTemplate(`
      You are EngageAI Helper, a friendly assistant for event attendees. Answer the user's question based only on the following context about our events.
      If the context doesn't contain the answer, say that you don't have that information.

      Context:
      {context}

      Question: {input}

      Answer:
    `);

    // Create the document chain and the retrieval chain
    const documentChain = await createStuffDocumentsChain({ llm, prompt });
    const retriever = vectorStore.asRetriever();
    const retrievalChain = await createRetrievalChain({
      combineDocsChain: documentChain,
      retriever,
    });

    // Invoke the chain with the user's question
    const result = await retrievalChain.invoke({ input: question });
    return result.answer;
  } catch (error) {
    console.error('RAG Chatbot error:', error);
    return "Sorry, I had trouble connecting to the AI service. Please try again later or contact support.";
  }
}

module.exports = { initializeVectorStore, ask }; 