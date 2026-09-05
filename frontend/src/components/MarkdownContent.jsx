import "highlight.js/styles/github-dark.css";
import "katex/dist/katex.min.css";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeHighlight from "rehype-highlight";
import rehypeKatex from "rehype-katex";

function MarkdownContent({ content }) {
  return (
    <article className="prose prose-lg max-w-none prose-invert">
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkMath]}
        rehypePlugins={[rehypeHighlight, rehypeKatex]}
      >
        {content || ""}
      </ReactMarkdown>
    </article>
  );
}

export default MarkdownContent;
