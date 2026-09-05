const getYouTubeEmbedUrl = (url) => {
  if (!url || typeof url !== "string") {
    return null;
  }

  const trimmed = url.trim();

  try {
    const parsed = new URL(trimmed);
    const host = parsed.hostname.replace(/^www\./, "");
    const pathParts = parsed.pathname.split("/").filter(Boolean);

    if (host === "youtu.be") {
      const videoId = pathParts[0];
      return videoId ? `https://www.youtube.com/embed/${videoId}` : null;
    }

    if (
      host === "youtube.com" ||
      host === "m.youtube.com" ||
      host === "youtube-nocookie.com"
    ) {
      if (pathParts[0] === "embed" && pathParts[1]) {
        return `https://www.youtube.com/embed/${pathParts[1]}`;
      }

      if (pathParts[0] === "shorts" && pathParts[1]) {
        return `https://www.youtube.com/embed/${pathParts[1]}`;
      }

      const videoId = parsed.searchParams.get("v");
      return videoId ? `https://www.youtube.com/embed/${videoId}` : null;
    }
  } catch {
    return null;
  }

  return null;
};

const Editorial = ({ videoUrl }) => {
  const embedUrl = getYouTubeEmbedUrl(videoUrl);

  if (!embedUrl) {
    return (
      <div className="flex flex-col items-center justify-center p-8 sm:p-12 text-center rounded-xl border border-dashed border-base-300 bg-base-200/30">
        <div className="w-12 h-12 rounded-2xl bg-base-200 text-base-content/40 flex items-center justify-center mb-3">
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
              d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
            />
          </svg>
        </div>
        <h4 className="text-sm font-semibold tracking-tight text-base-content">
          No editorial video found
        </h4>
        <p className="text-[13px] text-base-content/55 mt-1.5 max-w-xs leading-relaxed">
          An official video breakdown has not yet been linked for this specific
          challenge.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Video Container with 16:9 Aspect Ratio */}
      <div className="relative w-full rounded-xl overflow-hidden border border-base-300 bg-black shadow-sm aspect-video group">
        <iframe
          src={embedUrl}
          title="Problem editorial"
          className="absolute inset-0 w-full h-full border-0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
        />
      </div>

      {/* Editorial Meta Card */}
      <div className="p-4 rounded-xl border border-base-300 bg-base-200/40 flex items-start gap-3">
        <div className="w-8 h-8 rounded-lg bg-error/10 text-error flex items-center justify-center shrink-0 mt-0.5">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-4 w-4"
            viewBox="0 0 24 24"
            fill="currentColor"
          >
            <path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 3.993-8 4.007z" />
          </svg>
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h4 className="text-[13px] font-semibold tracking-tight text-base-content">
              Official Video Solution
            </h4>
            <span className="badge badge-xs badge-neutral font-semibold rounded-md">
              HD
            </span>
          </div>
          <p className="text-[12px] text-base-content/55 mt-1 leading-relaxed">
            Follow along with the detailed breakdown of the algorithm intuition,
            asymptotic analysis, and implementation pitfalls.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Editorial;
