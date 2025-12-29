import { Code, GithubLogo } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";

export function AppInfoContent() {
  return (
    <div className="flex w-full flex-col items-center p-4">
      <p className="mt-4 text-center font-medium text-foreground text-sm">
        FRC RAG
      </p>
      <p className="mb-4 text-center text-muted-foreground text-sm">
        AI assistant tuned for FRC workflows
      </p>
      <div className="flex w-full flex-col gap-2">
        <Button
          asChild
          className="w-full rounded-lg"
          size="sm"
          variant="outline"
        >
          <a
            className="flex w-full items-center justify-center"
            href="https://github.com/AadiJo/frc-rag-backend"
            rel="noopener noreferrer"
            target="_blank"
          >
            <GithubLogo className="mr-2 size-4" />
            Repository
          </a>
        </Button>
        <a
          aria-label="Open Source"
          className="mx-auto mt-2 inline-flex cursor-default items-center justify-center text-muted-foreground hover:text-muted-foreground focus:outline-none focus:ring-0 focus-visible:outline-none"
          href="/open-source"
          rel="noopener"
          target="_blank"
        >
          <Code className="size-5" />
          <span className="sr-only">Open Source</span>
        </a>
      </div>
    </div>
  );
}
