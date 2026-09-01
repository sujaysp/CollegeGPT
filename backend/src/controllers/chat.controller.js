const jwt = require("jsonwebtoken");
const Groq = require("groq-sdk");

const Conversation = require("../models/conversation.model");
const Document = require("../models/document.model");

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

/* =========================================================
   SYSTEM PROMPT
========================================================= */

const SYSTEM_PROMPT = `
You are CollegeGPT, an intelligent academic and campus assistant.

Your purpose is to help college students with:

- Academic concepts
- Exam preparation
- Assignments
- Programming and technical questions
- Study planning
- Career and learning guidance
- Campus-related questions
- Questions about uploaded documents and PDFs

Communication style:

- Clear
- Friendly
- Student-friendly
- Accurate
- Structured
- Explain difficult concepts in simple language
- Use examples when helpful
- Use headings and bullet points when appropriate

When answering technical questions:

- Explain the concept first
- Give a simple example
- Use code when useful
- Explain the code clearly

When helping with assignments:

- Teach the student
- Explain the reasoning
- Help them understand the solution

IMPORTANT PDF / DOCUMENT RULES:

When document context is provided:

- Use the document context as the primary source for document-related questions.
- Do not invent facts that are not supported by the document.
- If the answer is not available in the uploaded document, clearly say that it is not available in the uploaded document.
- You may use general knowledge when the user asks a general question unrelated to the document.
- If multiple documents are provided, use the relevant document context.
- Mention the document name when it helps the student understand where the answer came from.

Remember previous messages in the conversation and use them when answering follow-up questions.

Do not pretend to know private college information that has not been provided.

If you do not know something, say so clearly.
`;

/* =========================================================
   AUTHENTICATION
========================================================= */

const getUserFromToken = (req) => {
  const authHeader = req.headers.authorization;

  if (
    !authHeader ||
    !authHeader.startsWith("Bearer ")
  ) {
    return null;
  }

  const token = authHeader.split(" ")[1];

  try {
    return jwt.verify(
      token,
      process.env.JWT_SECRET
    );
  } catch (error) {
    return null;
  }
};

/* =========================================================
   CONVERSATION TITLE
========================================================= */

const createConversationTitle = (message) => {
  const cleanedMessage = message
    .trim()
    .replace(/\s+/g, " ");

  if (cleanedMessage.length <= 55) {
    return cleanedMessage;
  }

  return `${cleanedMessage
    .slice(0, 52)
    .trim()}...`;
};

/* =========================================================
   TOKENIZE TEXT
========================================================= */

const tokenize = (text) => {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9+#.\s]/g, " ")
    .split(/\s+/)
    .filter(
      (word) =>
        word.length >= 3
    );
};

/* =========================================================
   STOP WORDS
========================================================= */

const STOP_WORDS = new Set([
  "the",
  "and",
  "for",
  "are",
  "was",
  "were",
  "this",
  "that",
  "with",
  "from",
  "what",
  "when",
  "where",
  "which",
  "who",
  "how",
  "why",
  "does",
  "did",
  "has",
  "have",
  "had",
  "can",
  "could",
  "would",
  "should",
  "about",
  "into",
  "their",
  "there",
  "they",
  "them",
  "then",
  "than",
  "also",
  "please",
  "tell",
  "give",
  "explain",
  "help",
  "me",
  "you",
  "your",
  "our",
  "its",
  "not",
  "use",
  "using",
  "what",
  "pdf",
]);

/* =========================================================
   CREATE DOCUMENT CHUNKS
========================================================= */

const createChunks = (
  text,
  chunkSize = 1800,
  overlap = 250
) => {
  if (!text || !text.trim()) {
    return [];
  }

  const cleanedText = text
    .replace(/\r/g, "")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

  const chunks = [];

  let start = 0;

  while (
    start < cleanedText.length
  ) {
    let end =
      Math.min(
        start + chunkSize,
        cleanedText.length
      );

    /*
     * Try to end a chunk at a natural
     * sentence or paragraph boundary.
     */
    if (
      end <
      cleanedText.length
    ) {
      const paragraphBreak =
        cleanedText.lastIndexOf(
          "\n\n",
          end
        );

      const sentenceBreak =
        cleanedText.lastIndexOf(
          ". ",
          end
        );

      const boundary =
        Math.max(
          paragraphBreak,
          sentenceBreak
        );

      if (
        boundary >
        start + chunkSize * 0.55
      ) {
        end =
          boundary + 1;
      }
    }

    const content =
      cleanedText
        .slice(start, end)
        .trim();

    if (content) {
      chunks.push(content);
    }

    if (
      end >=
      cleanedText.length
    ) {
      break;
    }

    start = Math.max(
      end - overlap,
      start + 1
    );
  }

  return chunks;
};

/* =========================================================
   SCORE DOCUMENT CHUNK
========================================================= */

const scoreChunk = (
  chunk,
  queryTokens,
  originalQuery
) => {
  const lowerChunk =
    chunk.toLowerCase();

  let score = 0;

  for (const token of queryTokens) {
    const occurrences =
      lowerChunk
        .split(token)
        .length - 1;

    if (occurrences > 0) {
      score +=
        Math.min(
          occurrences,
          5
        ) * 2;
    }
  }

  /*
   * Give a stronger score when the
   * complete query phrase appears.
   */
  const normalizedQuery =
    originalQuery
      .toLowerCase()
      .replace(/\s+/g, " ")
      .trim();

  if (
    normalizedQuery.length >= 8 &&
    lowerChunk.includes(
      normalizedQuery
    )
  ) {
    score += 15;
  }

  /*
   * Reward chunks containing multiple
   * different query terms.
   */
  const uniqueMatches =
    queryTokens.filter(
      (token) =>
        lowerChunk.includes(token)
    ).length;

  score +=
    uniqueMatches * 3;

  return score;
};

/* =========================================================
   RETRIEVE RELEVANT PDF CONTEXT
========================================================= */

const retrieveDocumentContext =
  async (
    userId,
    query
  ) => {
    try {
      const documents =
        await Document.find({
          user: userId,
          extractedText: {
            $exists: true,
            $ne: "",
          },
        })
          .select(
            "originalName fileName extractedText"
          )
          .lean();

      if (
        !documents ||
        documents.length === 0
      ) {
        return {
          context: "",
          sources: [],
        };
      }

      const queryTokens =
        tokenize(query).filter(
          (token) =>
            !STOP_WORDS.has(token)
        );

      /*
       * If the query contains no useful
       * keywords, don't inject arbitrary
       * PDF text into the model.
       */
      if (
        queryTokens.length === 0
      ) {
        return {
          context: "",
          sources: [],
        };
      }

      const rankedChunks = [];

      for (const document of documents) {
        const chunks =
          createChunks(
            document.extractedText
          );

        for (
          let index = 0;
          index < chunks.length;
          index++
        ) {
          const chunk =
            chunks[index];

          const score =
            scoreChunk(
              chunk,
              queryTokens,
              query
            );

          if (score > 0) {
            rankedChunks.push({
              score,
              documentId:
                document._id,
              documentName:
                document.originalName ||
                document.fileName ||
                "Uploaded PDF",
              chunkIndex: index,
              content: chunk,
            });
          }
        }
      }

      rankedChunks.sort(
        (a, b) =>
          b.score - a.score
      );

      /*
       * Keep the context reasonably small
       * so the model has enough room to answer.
       */
      const topChunks =
        rankedChunks.slice(
          0,
          4
        );

      if (
        topChunks.length === 0
      ) {
        return {
          context: "",
          sources: [],
        };
      }

      const sources = [
        ...new Set(
          topChunks.map(
            (item) =>
              item.documentName
          )
        ),
      ];

      const contextParts =
        topChunks.map(
          (item, index) => {
            return `
[Document ${index + 1}]
File: ${item.documentName}

${item.content}
`;
          }
        );

      return {
        context:
          contextParts.join(
            "\n"
          ),
        sources,
      };
    } catch (error) {
      console.error(
        "Document retrieval error:",
        error
      );

      /*
       * Do not make a PDF retrieval
       * problem crash normal AI chat.
       */
      return {
        context: "",
        sources: [],
      };
    }
  };

/* =========================================================
   BUILD AI MESSAGES
========================================================= */

const buildAIMessages = (
  conversation,
  documentContext = ""
) => {
  const messages = [
    {
      role: "system",
      content: SYSTEM_PROMPT,
    },
  ];

  /*
   * PDF context is placed before the
   * conversation history so the model
   * knows what document information is
   * available.
   */
  if (documentContext) {
    messages.push({
      role: "system",
      content: `
RELEVANT UPLOADED PDF CONTEXT:

${documentContext}

END OF UPLOADED PDF CONTEXT.

Use this context when the user's question is related to the uploaded document.
`,
    });
  }

  messages.push(
    ...conversation.messages.map(
      (item) => ({
        role: item.role,
        content: item.content,
      })
    )
  );

  return messages;
};

/* =========================================================
   CREATE SSE EVENT
========================================================= */

const sendSSE = (
  res,
  event,
  data
) => {
  res.write(
    `event: ${event}\n`
  );

  res.write(
    `data: ${JSON.stringify(
      data
    )}\n\n`
  );
};

/* =========================================================
   GENERATE STREAMING AI RESPONSE
========================================================= */

const generateAIResponseStream =
  async (
    conversation,
    documentContext,
    res
  ) => {
    if (
      !process.env.GROQ_API_KEY
    ) {
      throw new Error(
        "GROQ_API_KEY is not configured"
      );
    }

    const aiMessages =
      buildAIMessages(
        conversation,
        documentContext
      );

    const stream =
      await groq.chat.completions.create(
        {
          model:
            "openai/gpt-oss-20b",

          messages:
            aiMessages,

          temperature: 0.7,

          max_tokens: 1200,

          stream: true,
        }
      );

    let fullReply = "";

    for await (
      const chunk of stream
    ) {
      const content =
        chunk.choices?.[0]
          ?.delta?.content || "";

      if (!content) {
        continue;
      }

      fullReply += content;

      sendSSE(
        res,
        "token",
        {
          content,
        }
      );
    }

    if (
      !fullReply.trim()
    ) {
      throw new Error(
        "The AI returned an empty response"
      );
    }

    return fullReply.trim();
  };

/* =========================================================
   SEND MESSAGE
   POST /api/chat/message
========================================================= */

const sendMessage =
  async (req, res) => {
    try {
      /*
       * -----------------------------------------------------
       * 1. Authenticate user
       * -----------------------------------------------------
       */

      const decoded =
        getUserFromToken(req);

      if (!decoded) {
        return res.status(401).json({
          message:
            "Authentication required",
        });
      }

      /*
       * -----------------------------------------------------
       * 2. Validate request
       * -----------------------------------------------------
       */

      const {
        message,
        conversationId,
      } = req.body;

      if (
        !message ||
        !message.trim()
      ) {
        return res.status(400).json({
          message:
            "Message is required",
        });
      }

      const cleanMessage =
        message.trim();

      /*
       * -----------------------------------------------------
       * 3. Find or create conversation
       * -----------------------------------------------------
       */

      let conversation;

      if (conversationId) {
        conversation =
          await Conversation.findOne(
            {
              _id:
                conversationId,

              user:
                decoded.userId,
            }
          );

        if (!conversation) {
          return res.status(404).json({
            message:
              "Conversation not found",
          });
        }
      } else {
        conversation =
          await Conversation.create(
            {
              user:
                decoded.userId,

              title:
                createConversationTitle(
                  cleanMessage
                ),

              messages: [],
            }
          );
      }

      /*
       * -----------------------------------------------------
       * 4. Save user's message
       * -----------------------------------------------------
       */

      conversation.messages.push({
        role: "user",
        content: cleanMessage,
      });

      await conversation.save();

      console.log(
        "================================="
      );

      console.log(
        "AI REQUEST"
      );

      console.log(
        "User:",
        decoded.userId
      );

      console.log(
        "Conversation:",
        conversation._id.toString()
      );

      console.log(
        "Message:",
        cleanMessage
      );

      /*
       * -----------------------------------------------------
       * 5. Retrieve relevant PDF content
       * -----------------------------------------------------
       */

      const documentResult =
        await retrieveDocumentContext(
          decoded.userId,
          cleanMessage
        );

      console.log(
        "Documents used:",
        documentResult.sources
      );

      /*
       * -----------------------------------------------------
       * 6. Prepare SSE response
       * -----------------------------------------------------
       */

      res.status(200);

      res.setHeader(
        "Content-Type",
        "text/event-stream"
      );

      res.setHeader(
        "Cache-Control",
        "no-cache, no-transform"
      );

      res.setHeader(
        "Connection",
        "keep-alive"
      );

      res.setHeader(
        "X-Accel-Buffering",
        "no"
      );

      if (
        typeof res.flushHeaders ===
        "function"
      ) {
        res.flushHeaders();
      }

      /*
       * Send conversation information
       * immediately so the frontend can
       * store the new conversation ID.
       */
      sendSSE(
        res,
        "conversation",
        {
          conversationId:
            conversation._id.toString(),

          title:
            conversation.title,
        }
      );

      /*
       * -----------------------------------------------------
       * 7. Generate streaming response
       * -----------------------------------------------------
       */

      const reply =
        await generateAIResponseStream(
          conversation,
          documentResult.context,
          res
        );

      /*
       * -----------------------------------------------------
       * 8. Save AI response
       * -----------------------------------------------------
       */

      conversation.messages.push({
        role: "assistant",
        content: reply,
      });

      await conversation.save();

      console.log(
        "AI response generated successfully"
      );

      /*
       * -----------------------------------------------------
       * 9. Tell frontend generation is complete
       * -----------------------------------------------------
       */

      sendSSE(
        res,
        "done",
        {
          conversationId:
            conversation._id.toString(),

          title:
            conversation.title,

          sources:
            documentResult.sources,
        }
      );

      res.end();
    } catch (error) {
      console.error(
        "================================="
      );

      console.error(
        "AI CHAT ERROR"
      );

      console.error(error);

      console.error(
        "================================="
      );

      /*
       * If headers have not been sent,
       * return normal JSON.
       */
      if (!res.headersSent) {
        return res.status(500).json({
          message:
            error.message ||
            "Something went wrong while generating the AI response",
        });
      }

      /*
       * If SSE has already started,
       * send an SSE error event.
       */
      try {
        sendSSE(
          res,
          "error",
          {
            message:
              error.message ||
              "Something went wrong while generating the AI response",
          }
        );

        res.end();
      } catch {
        res.end();
      }
    }
  };

/* =========================================================
   REGENERATE AI RESPONSE
   POST /api/chat/regenerate
========================================================= */

const regenerateMessage =
  async (req, res) => {
    try {
      /*
       * -----------------------------------------------------
       * 1. Authenticate user
       * -----------------------------------------------------
       */

      const decoded =
        getUserFromToken(req);

      if (!decoded) {
        return res.status(401).json({
          message:
            "Authentication required",
        });
      }

      /*
       * -----------------------------------------------------
       * 2. Validate conversation ID
       * -----------------------------------------------------
       */

      const {
        conversationId,
      } = req.body;

      if (!conversationId) {
        return res.status(400).json({
          message:
            "Conversation ID is required",
        });
      }

      /*
       * -----------------------------------------------------
       * 3. Find conversation
       * -----------------------------------------------------
       */

      const conversation =
        await Conversation.findOne(
          {
            _id:
              conversationId,

            user:
              decoded.userId,
          }
        );

      if (!conversation) {
        return res.status(404).json({
          message:
            "Conversation not found",
        });
      }

      /*
       * -----------------------------------------------------
       * 4. Find latest assistant response
       * -----------------------------------------------------
       */

      let lastAssistantIndex =
        -1;

      for (
        let i =
          conversation.messages
            .length - 1;
        i >= 0;
        i--
      ) {
        if (
          conversation.messages[i]
            .role ===
          "assistant"
        ) {
          lastAssistantIndex =
            i;

          break;
        }
      }

      if (
        lastAssistantIndex ===
        -1
      ) {
        return res.status(400).json({
          message:
            "There is no AI response to regenerate",
        });
      }

      /*
       * -----------------------------------------------------
       * 5. Remove previous AI response
       * -----------------------------------------------------
       */

      conversation.messages.splice(
        lastAssistantIndex,
        1
      );

      /*
       * -----------------------------------------------------
       * 6. Identify latest user message
       * -----------------------------------------------------
       */

      let latestUserMessage =
        "";

      for (
        let i =
          conversation.messages
            .length - 1;
        i >= 0;
        i--
      ) {
        if (
          conversation.messages[i]
            .role ===
          "user"
        ) {
          latestUserMessage =
            conversation.messages[i]
              .content || "";

          break;
        }
      }

      /*
       * -----------------------------------------------------
       * 7. Retrieve relevant PDF context
       * -----------------------------------------------------
       */

      const documentResult =
        await retrieveDocumentContext(
          decoded.userId,
          latestUserMessage
        );

      console.log(
        "================================="
      );

      console.log(
        "REGENERATING AI RESPONSE"
      );

      console.log(
        "Conversation:",
        conversation._id.toString()
      );

      console.log(
        "Documents used:",
        documentResult.sources
      );

      console.log(
        "================================="
      );

      /*
       * -----------------------------------------------------
       * 8. Generate replacement response
       * -----------------------------------------------------
       */

      const aiMessages =
        buildAIMessages(
          conversation,
          documentResult.context
        );

      if (
        !process.env.GROQ_API_KEY
      ) {
        throw new Error(
          "GROQ_API_KEY is not configured"
        );
      }

      const completion =
        await groq.chat.completions.create(
          {
            model:
              "openai/gpt-oss-20b",

            messages:
              aiMessages,

            temperature: 0.7,

            max_tokens: 1200,
          }
        );

      const reply =
        completion
          .choices?.[0]
          ?.message?.content;

      if (
        !reply ||
        !reply.trim()
      ) {
        throw new Error(
          "The AI returned an empty response"
        );
      }

      /*
       * -----------------------------------------------------
       * 9. Save regenerated response
       * -----------------------------------------------------
       */

      conversation.messages.push({
        role: "assistant",
        content:
          reply.trim(),
      });

      await conversation.save();

      console.log(
        "AI response regenerated successfully"
      );

      /*
       * -----------------------------------------------------
       * 10. Return updated conversation
       * -----------------------------------------------------
       */

      return res.status(200).json({
        message:
          "AI response regenerated successfully",

        conversationId:
          conversation._id.toString(),

        title:
          conversation.title,

        reply:
          reply.trim(),

        messages:
          conversation.messages,

        sources:
          documentResult.sources,
      });
    } catch (error) {
      console.error(
        "================================="
      );

      console.error(
        "REGENERATE ERROR"
      );

      console.error(error);

      console.error(
        "================================="
      );

      return res.status(500).json({
        message:
          error.message ||
          "Something went wrong while regenerating the AI response",
      });
    }
  };

/* =========================================================
   EXPORTS
========================================================= */

module.exports = {
  sendMessage,
  regenerateMessage,
};