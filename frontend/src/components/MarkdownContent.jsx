import "highlight.js/styles/github-dark.css";
import "katex/dist/katex.min.css";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeHighlight from "rehype-highlight";
import rehypeKatex from "rehype-katex";
import rehypeRaw from "rehype-raw";

// Convert special Markdown embed links into HTML
function transformEmbeds(markdown) {
  if (!markdown) return "";

  return markdown.replace(
    /\[(pdf-embed|image-embed|video-embed)\]\(([^)\s]+)\)/gi,
    (_, type, url) => {
      const embedType = type.toLowerCase();

      // PDF
      if (embedType === "pdf-embed") {
        return `
<iframe
  src="${url}"
  width="100%"
  height="700"
  allow="autoplay"
  style="border:none; border-radius:8px; display:block; margin:1.5rem 0;"
  title="Embedded PDF Document">
</iframe>
`;
      }

      // Image
      if (embedType === "image-embed") {
        return `
<img
  src="${url}"
  alt="Embedded image"
  style="max-width:100%; height:auto; display:block; margin:1.5rem auto; border-radius:8px;"
/>
`;
      }

      // Video
      if (embedType === "video-embed") {
        return `
<video
  src="${url}"
  controls
  preload="metadata"
  style="width:100%; height:auto; display:block; margin:1.5rem 0; border-radius:8px;">
  Your browser does not support the video tag.
</video>
`;
      }

      return _;
    }
  );
}

function MarkdownContent({ content }) {
  const processedContent = transformEmbeds(content || "");

  return (
    <article className="prose prose-lg max-w-none prose-invert">
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkMath]}
        rehypePlugins={[
          rehypeRaw,
          rehypeHighlight,
          rehypeKatex,
        ]}
      >
        {processedContent}
      </ReactMarkdown>
    </article>
  );
}

export default MarkdownContent;