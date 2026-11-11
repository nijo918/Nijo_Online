import ReactMarkdown from "react-markdown";
import rehypeSanitize from "rehype-sanitize";
export function Markdown({ children }: { children: string }) {
  return (
    <div className="prose">
      <ReactMarkdown
        rehypePlugins={[rehypeSanitize]}
        skipHtml
        components={{
          img: () => null,
          a: ({ href, children }) => (
            <a href={href} rel="noopener noreferrer">
              {children}
            </a>
          ),
        }}
      >
        {children}
      </ReactMarkdown>
    </div>
  );
}
