import { useState, useRef, useEffect } from "react";
import { useForm } from "react-hook-form";
import { useSelector, useDispatch } from "react-redux";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeHighlight from "rehype-highlight";
import rehypeKatex from "rehype-katex";
import "highlight.js/styles/github-dark.css";
import "katex/dist/katex.min.css";

import axiosClient from "../utils/axiosClient";
import { setMessages } from "../chatSlice.js";

const QUICK_PROMPTS = [
  "Give me a subtle hint without spoiling the answer",
  "What is the expected time & space complexity?",
  "Help me identify common edge cases to watch for",
  "Explain the core intuition behind this problem",
];

function ChatAI({ problem, onUsageUpdate }) {
  const dispatch = useDispatch();

  const messages = useSelector(
    (state) => state.chat.messagesByProblem[problem._id] || [],
  );

  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm();

  const messagesContainerRef = useRef(null);

  useEffect(() => {
    if ((messages.length > 0 || loading) && messagesContainerRef.current) {
      messagesContainerRef.current.scrollTo({
        top: messagesContainerRef.current.scrollHeight,
        behavior: "smooth",
      });
    }
  }, [messages, loading]);

  const handleSendMessage = async (rawMessage) => {
    const message = rawMessage?.trim();
    if (!message || loading) return;

    const userMessage = {
      role: "user",
      parts: [{ text: message }],
    };

    const updatedMessages = [...messages, userMessage];

    dispatch(
      setMessages({
        problemId: problem._id,
        messages: updatedMessages,
      }),
    );

    reset();
    setLoading(true);

    try {
      const response = await axiosClient.post("/chat/ai", {
        messages: updatedMessages,
        title: problem.title,
        description: problem.description,
        testCases: problem.visibleTestCases,
        startCode: problem.startCode,
      });

      if (response.data.usage && onUsageUpdate) {
        onUsageUpdate(response.data.usage);
      }

      const aiMessage = {
        role: "model",
        parts: [
          {
            text: response.data.message || "I could not generate a response.",
          },
        ],
      };

      dispatch(
        setMessages({
          problemId: problem._id,
          messages: [...updatedMessages, aiMessage],
        }),
      );
    } catch (error) {
      console.error("API Error:", error);

      const errorText =
        error.response?.status === 429
          ? error.response?.data?.message ||
            "Daily Gemini request limit reached. Please check back tomorrow."
          : "Sorry, something went wrong while processing your request. Please try again.";

      if (error.response?.data?.usage && onUsageUpdate) {
        onUsageUpdate(error.response.data.usage);
      }

      const errorMessage = {
        role: "model",
        parts: [{ text: errorText }],
        isError: true,
      };

      dispatch(
        setMessages({
          problemId: problem._id,
          messages: [...updatedMessages, errorMessage],
        }),
      );
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = (data) => {
    handleSendMessage(data.message);
  };

  const handleQuickPromptClick = (prompt) => {
    setValue("message", prompt);
    handleSendMessage(prompt);
  };

  const clearChat = () => {
    dispatch(
      setMessages({
        problemId: problem._id,
        messages: [],
      }),
    );
  };

  return (
    <div className="flex flex-col h-full bg-base-100 text-base-content border border-base-300 rounded-xl overflow-hidden">
      {/* Header Bar */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-base-300 bg-base-200/50 shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-primary/12 text-primary flex items-center justify-center font-mono font-semibold text-xs">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" />
            </svg>
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h3 className="text-[13px] font-semibold tracking-tight text-base-content">
                NeatCode AI
              </h3>
              <span className="inline-flex items-center px-1.5 py-0.2 rounded-full text-[10px] font-semibold bg-success/15 text-success">
                Online
              </span>
            </div>
            <p className="text-[11px] text-base-content/60 leading-none mt-0.5">
              Context-aware problem solving assistant
            </p>
          </div>
        </div>

        {messages.length > 0 && (
          <button
            type="button"
            onClick={clearChat}
            disabled={loading}
            className="btn btn-ghost btn-xs text-base-content/60 hover:text-error gap-1 transition-colors"
            title="Reset conversation"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-3.5 w-3.5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
              />
            </svg>
            <span className="hidden sm:inline text-[11px]">Clear</span>
          </button>
        )}
      </div>

      {/* Messages Stream Area */}
      <div ref={messagesContainerRef} className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col justify-center items-center text-center max-w-sm mx-auto px-2 py-8">
            <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shadow-xs mb-3">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                />
              </svg>
            </div>
            <h4 className="text-sm font-bold text-base-content">
              How can I help you?
            </h4>
            <p className="text-xs text-base-content/60 mt-1 leading-relaxed">
              Ask about algorithms, edge cases, request progressive hints, or
              debug your solution for{" "}
              <strong className="text-base-content font-semibold">
                {problem?.title}
              </strong>
              .
            </p>

            {/* Quick Starter Prompts */}
            <div className="w-full mt-6 space-y-1.5 text-left">
              <span className="text-[11px] font-semibold text-base-content/50 uppercase tracking-wider block px-1">
                Suggested Prompts
              </span>
              {QUICK_PROMPTS.map((prompt, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleQuickPromptClick(prompt)}
                  className="w-full text-left text-[13px] p-2.5 rounded-lg border border-base-300 bg-base-100 hover:bg-base-200 hover:border-primary/35 text-base-content/75 hover:text-base-content transition-colors"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((msg, index) => {
            const isUser = msg.role === "user";

            return (
              <div
                key={index}
                className={`flex gap-2.5 items-start ${
                  isUser ? "flex-row-reverse" : "flex-row"
                }`}
              >
                {/* Avatar Badge */}
                <div
                  className={`w-7 h-7 rounded-lg flex items-center justify-center font-mono text-xs font-bold shrink-0 shadow-2xs ${
                    isUser
                      ? "bg-primary text-primary-content"
                      : msg.isError
                        ? "bg-error text-error-content"
                        : "bg-base-300 text-base-content"
                  }`}
                >
                  {isUser ? (
                    "U"
                  ) : (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-3.5 w-3.5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M13 10V3L4 14h7v7l9-11h-7z"
                      />
                    </svg>
                  )}
                </div>

                {/* Message Bubble */}
                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-xs shadow-xs leading-relaxed overflow-hidden ${
                    isUser
                      ? "bg-primary text-primary-content rounded-tr-xs"
                      : msg.isError
                        ? "bg-error/10 border border-error/30 text-error rounded-tl-xs"
                        : "bg-base-200/60 border border-base-300/80 text-base-content rounded-tl-xs"
                  }`}
                >
                  {isUser ? (
                    <p className="whitespace-pre-wrap break-words">
                      {msg.parts?.[0]?.text}
                    </p>
                  ) : (
                    <div className="prose prose-xs max-w-none text-base-content prose-p:my-1.5 prose-pre:my-2 prose-pre:bg-base-300/80 prose-pre:border prose-pre:border-base-300 prose-pre:p-3 prose-pre:rounded-xl prose-code:text-primary prose-code:font-mono prose-headings:text-base-content prose-headings:font-bold prose-a:text-primary">
                      <ReactMarkdown
                        remarkPlugins={[remarkGfm, remarkMath]}
                        rehypePlugins={[rehypeHighlight, rehypeKatex]}
                      >
                        {msg.parts?.[0]?.text || ""}
                      </ReactMarkdown>
                    </div>
                  )}

                  {msg.isError && (
                    <div className="mt-2 pt-2 border-t border-error/20 flex items-center gap-1 text-[11px] font-semibold text-error">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-3.5 w-3.5 shrink-0"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path
                          fillRule="evenodd"
                          d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                          clipRule="evenodd"
                        />
                      </svg>
                      <span>Failed to respond</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}

        {/* Loading Spinner Bubble */}
        {loading && (
          <div className="flex gap-2.5 items-start">
            <div className="w-7 h-7 rounded-lg bg-base-300 text-base-content flex items-center justify-center font-mono text-xs font-bold shrink-0 shadow-2xs">
              <span className="loading loading-spinner loading-xs" />
            </div>
            <div className="bg-base-200/60 border border-base-300/80 rounded-2xl rounded-tl-xs px-4 py-3 shadow-xs">
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce [animation-delay:-0.3s]" />
                <span className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce [animation-delay:-0.15s]" />
                <span className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce" />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Input Composition Box */}
      <div className="p-3 border-t border-base-300 bg-base-100 shrink-0">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-1.5">
          <div className="relative flex items-center">
            <input
              type="text"
              placeholder={`Ask a question about ${problem?.title || "this problem"}...`}
              autoComplete="off"
              disabled={loading}
              {...register("message", {
                required: "Please enter a message.",
                minLength: {
                  value: 2,
                  message: "Please enter at least 2 characters.",
                },
              })}
              className={`input input-bordered w-full pr-12 text-[13px] rounded-lg transition-colors focus:outline-2 focus:outline-primary ${
                errors.message ? "input-error" : ""
              }`}
            />

            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary btn-xs sm:btn-sm btn-circle absolute right-1.5"
              aria-label="Send message"
            >
              {loading ? (
                <span className="loading loading-spinner loading-xs" />
              ) : (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-3.5 w-3.5 rotate-90"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
                </svg>
              )}
            </button>
          </div>

          {errors.message && (
            <p className="text-[11px] text-error flex items-center gap-1 font-medium pl-1">
              {errors.message.message}
            </p>
          )}
        </form>
      </div>
    </div>
  );
}

export default ChatAI;
