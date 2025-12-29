import { marked } from "marked";
import "katex/dist/katex.css";
import { Children, memo, useId, useMemo } from "react";
import type { Components } from "react-markdown";
import rehypeKatex from "rehype-katex";
import remarkBreaks from "remark-breaks";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import { Streamdown } from "streamdown";
import { cn } from "@/lib/utils";
import { ButtonCopy } from "../common/button-copy";
import { ButtonDownload } from "../common/button-download";
import { CodeBlock, CodeBlockCode, CodeBlockGroup } from "./code-block";
import { Source, SourceContent, SourceTrigger } from "./source";

// Move plugin arrays to module level to prevent recreation on every render
const REMARK_PLUGINS = [remarkBreaks, remarkGfm, remarkMath];
const REHYPE_PLUGINS = [rehypeKatex];

export type MarkdownProps = {
  children: string;
  id?: string;
  className?: string;
  components?: Partial<Components>;
};

function parseMarkdownIntoBlocks(markdown: string): string[] {
  const tokens = marked.lexer(markdown);
  return tokens.map((token) => token.raw);
}

const LANGUAGE_REGEX = /language-(\w+)/;
const HTTP_REGEX = /^https?:\/\//i;
const TRAILING_NEWLINE_REGEX = /\n$/;

function extractLanguage(className?: string): string {
  if (!className) {
    return "plaintext";
  }
  const match = className.match(LANGUAGE_REGEX);
  return match ? match[1] : "plaintext";
}

const MemoizedCodeBlock = memo(
  ({
    className,
    children,
    language,
  }: {
    className?: string;
    children: React.ReactNode;
    language: string;
  }) => {
    const codeString = children as string;
    const lineCount = useMemo(() => {
      const trimmed = codeString.replace(TRAILING_NEWLINE_REGEX, "");
      return trimmed ? trimmed.split("\n").length : 0;
    }, [codeString]);

    return (
      <CodeBlock className={className}>
        <CodeBlockGroup className="flex h-9 items-center justify-between border-border border-b px-4">
          <div className="py-1 pr-2 font-mono text-muted-foreground text-xs">
            {language}{" "}
            <span className="text-muted-foreground/50">
              {lineCount} {lineCount === 1 ? "line" : "lines"}
            </span>
          </div>
        </CodeBlockGroup>
        <div className="sticky top-16 lg:top-0">
          <div className="absolute right-0 bottom-0 flex h-9 items-center gap-1 pr-1.5">
            <ButtonDownload code={codeString} language={language} />
            <ButtonCopy code={codeString} />
          </div>
        </div>
        <CodeBlockCode code={codeString} language={language} />
      </CodeBlock>
    );
  }
);

const INITIAL_COMPONENTS: Partial<Components> = {
  img({ src, alt, ...props }) {
    // Render images as simple <img> elements without wrappers
    // This ensures proper rendering inside table cells
    if (!src) {
      return null;
    }
    return (
      <img
        alt={alt || ""}
        className="max-w-full rounded"
        loading="lazy"
        src={src}
        {...props}
      />
    );
  },
  code({ className, children, ...props }) {
    const isInline =
      !props.node?.position?.start.line ||
      props.node?.position?.start.line === props.node?.position?.end.line;

    if (isInline) {
      return (
        <span
          className={cn(
            "rounded-sm bg-primary-foreground px-1 font-mono text-sm",
            className
          )}
          {...props}
        >
          {children}
        </span>
      );
    }

    const language = extractLanguage(className);

    return (
      <MemoizedCodeBlock className={className} language={language}>
        {children as string}
      </MemoizedCodeBlock>
    );
  },
  pre({ children }) {
    return <>{children}</>;
  },
  a({ href, children, ...props }) {
    // Convert React children to plain text to detect citation-style labels like [[1]]
    const text = Children.toArray(children)
      .map((c) => (typeof c === "string" ? c : ""))
      .join("")
      .trim();

    // Render [title](url) as a Source pill with domain label and hover details
    if (href && text) {
      const urlStr = String(href);
      const isHttp = HTTP_REGEX.test(urlStr);
      if (isHttp) {
        return (
          <Source href={urlStr}>
            {/* Pill label is the domain (handled by SourceTrigger default) with favicon */}
            <SourceTrigger showFavicon />
            {/* Hover title is brandified host; description is the link text from AI */}
            <SourceContent description={""} title={text} />
          </Source>
        );
      }
    }

    // Fallback: render a normal external link
    return (
      <a href={href} rel="noopener noreferrer" target="_blank" {...props}>
        {children}
      </a>
    );
  },
};

const MemoizedMarkdownBlock = memo(
  function MarkdownBlock({
    content,
    components = INITIAL_COMPONENTS,
  }: {
    content: string;
    components?: Partial<Components>;
  }) {
    // Check if content contains Mermaid diagrams
    const hasMermaid =
      content.includes("```mermaid") || content.includes("language-mermaid");

    // Memoize components to prevent recreation on every render
    const componentsToUse = useMemo(() => {
      if (hasMermaid) {
        return {
          pre({ children }: { children?: React.ReactNode }) {
            return <>{children}</>;
          },
          a: components.a, // Keep the link component
        } as Partial<Components>;
      }
      return components;
    }, [hasMermaid, components]);

    return (
      <Streamdown
        components={componentsToUse}
        parseIncompleteMarkdown={true}
        rehypePlugins={REHYPE_PLUGINS}
        remarkPlugins={REMARK_PLUGINS}
      >
        {content}
      </Streamdown>
    );
  },
  function propsAreEqual(prevProps, nextProps) {
    return prevProps.content === nextProps.content;
  }
);

MemoizedMarkdownBlock.displayName = "MemoizedMarkdownBlock";

function MarkdownComponent({
  children,
  id,
  className,
  components,
}: MarkdownProps) {
  const generatedId = useId();
  const blockId = id ?? generatedId;
  const blocks = useMemo(() => parseMarkdownIntoBlocks(children), [children]);

  // Merge caller-provided components with the defaults so overrides are additive.
  const mergedComponents = useMemo(
    () => ({ ...INITIAL_COMPONENTS, ...(components ?? {}) }),
    [components]
  );

  return (
    <div
      className={cn(
        "markdown-body [&>*:first-child>*:first-child]:mt-0 [&>*:last-child>*:last-child]:mb-0",
        className
      )}
    >
      {blocks.map((block, index) => (
        <MemoizedMarkdownBlock
          components={mergedComponents}
          content={block}
          key={`${blockId}-block-${
            // biome-ignore lint/suspicious/noArrayIndexKey: <check prompt kit docs>
            index
          }`}
        />
      ))}
    </div>
  );
}

const Markdown = memo(MarkdownComponent);
Markdown.displayName = "Markdown";

export { Markdown };
