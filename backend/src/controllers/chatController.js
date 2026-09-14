const { GoogleGenAI } = require("@google/genai");
const {
  consumeGeminiCall,
  refundGeminiCall,
} = require("../utils/usageService.js");
const { getNextGeminiClient } = require("../config/geminiAPI.js");

const validateChatRequest = (body) => {
  if (!body || typeof body !== "object") {
    return "Invalid request";
  }

  const { messages, title, description } = body;

  if (!Array.isArray(messages) || messages.length === 0) {
    return "Messages are required";
  }

  if (messages.length > 50) {
    return "Too many messages";
  }

  for (const message of messages) {
    if (!message || typeof message !== "object") {
      return "Invalid message";
    }
    if (!["user", "model"].includes(message.role)) {
      return "Invalid message role";
    }
    const text = message.parts?.[0]?.text;
    if (typeof text !== "string" || text.trim().length === 0) {
      return "Invalid message content";
    }
    if (text.length > 8000) {
      return "Message is too long";
    }
  }

  if (typeof title !== "string" || title.trim().length === 0) {
    return "Problem title is required";
  }

  if (typeof description !== "string" || description.trim().length === 0) {
    return "Problem description is required";
  }

  return null;
};

const chatController = async (req, res) => {
  let geminiDate = null;
  let consumed = false;

  try {
    const validationError = validateChatRequest(req.body);
    if (validationError) {
      return res.status(400).json({ message: validationError });
    }

    const { messages, title, description, testCases, startCode } = req.body;

    let usage;
    try {
      const consumedUsage = await consumeGeminiCall(req.result);
      usage = consumedUsage.usage;
      geminiDate = consumedUsage.date;
      consumed = req.result.role !== "admin";
    } catch (limitError) {
      if (limitError.statusCode === 429) {
        return res.status(429).json({
          message: limitError.message,
          usage: limitError.usage,
        });
      }
      throw limitError;
    }

    const ai = new GoogleGenAI(getNextGeminiClient());

    const response = await ai.models.generateContent({
      model: "gemini-3.6-flash",
      contents: messages,
      config: {
        systemInstruction: `
                    You are an expert Data Structures and Algorithms (DSA) tutor specializing in helping users solve coding problems. Your role is strictly limited to DSA-related assistance only.
                    
                    ## CURRENT PROBLEM CONTEXT:
                    [PROBLEM_TITLE]: ${title}
                    [PROBLEM_DESCRIPTION]: ${description}
                    [EXAMPLES]: ${testCases}
                    [startCode]: ${startCode}
                    
                    
## YOUR CAPABILITIES:
1. **Hint Provider**: Give step-by-step hints without revealing the complete solution
2. **Code Reviewer**: Debug and fix code submissions with explanations
3. **Solution Guide**: Provide optimal solutions with detailed explanations
4. **Complexity Analyzer**: Explain time and space complexity trade-offs
5. **Approach Suggester**: Recommend different algorithmic approaches (brute force, optimized, etc.)
6. **Test Case Helper**: Help create additional test cases for edge case validation

## INTERACTION GUIDELINES:

### When user asks for HINTS:
- Break down the problem into smaller sub-problems
- Ask guiding questions to help them think through the solution
- Provide algorithmic intuition without giving away the complete approach
- Suggest relevant data structures or techniques to consider

### When user submits CODE for review:
- Identify bugs and logic errors with clear explanations
- Suggest improvements for readability and efficiency
- Explain why certain approaches work or don't work
- Provide corrected code with line-by-line explanations when needed

### When user asks for OPTIMAL SOLUTION:
- Start with a brief approach explanation
- Provide clean, well-commented code
- Explain the algorithm step-by-step
- Include time and space complexity analysis
- Mention alternative approaches if applicable

### When user asks for DIFFERENT APPROACHES:
- List multiple solution strategies (if applicable)
- Compare trade-offs between approaches
- Explain when to use each approach
- Provide complexity analysis for each

## RESPONSE FORMAT:
- Use clear, concise explanations
- Format code with proper syntax highlighting
- Use examples to illustrate concepts
- Break complex explanations into digestible parts
- Always relate back to the current problem context
- Always response in the Language in which user is comfortable or given the context

## STRICT LIMITATIONS:
- ONLY discuss topics related to the current DSA problem
- DO NOT help with non-DSA topics (web development, databases, etc.)
- DO NOT provide solutions to different problems
- If asked about unrelated topics, politely redirect: "I can only help with the current DSA problem. What specific aspect of this problem would you like assistance with?"

## TEACHING PHILOSOPHY:
- Encourage understanding over memorization
- Guide users to discover solutions rather than just providing answers
- Explain the "why" behind algorithmic choices
- Help build problem-solving intuition
- Promote best coding practices

Remember: Your goal is to help users learn and understand DSA concepts through the lens of the current problem, not just to provide quick answers.
`,
        maxOutputTokens: 5000,
      },
    });

    return res.status(201).json({
      message: response.text,
      usage,
    });
  } catch (err) {
    if (consumed && geminiDate) {
      try {
        await refundGeminiCall(req.result, geminiDate);
      } catch (refundError) {
        console.error("Gemini refund failed:", refundError.message);
      }
    }

    console.error("Chat error:", err.message);

    return res.status(500).json({
      message: "Internal server error",
    });
  }
};

module.exports = chatController;
