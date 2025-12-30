"use client";

import {
  CircuitryIcon,
  CodeIcon,
  MagnifyingGlassIcon,
} from "@phosphor-icons/react";
import { HammerIcon } from "lucide-react";
import { motion } from "motion/react";
import { memo } from "react";
import { Button } from "@/components/ui/button";
import { TRANSITION_SUGGESTIONS } from "@/lib/motion";
import { PERSONAS } from "@/lib/prompt_config";
import { cn } from "@/lib/utils";

const PERSONA_ICONS: Record<string, React.ElementType> = {
  programmer: CodeIcon,
  designer: HammerIcon,
  scouter: MagnifyingGlassIcon,
  electronics: CircuitryIcon,
};

type ButtonPersonaProps = {
  id: string;
  label: string;
  onSelectSystemPrompt: (personaId: string) => void;
  selectedPersonaId?: string;
  icon: React.ElementType;
};

const ButtonPersona = memo(function ButtonPersonaComponent({
  id,
  label,
  onSelectSystemPrompt,
  selectedPersonaId,
  icon,
}: ButtonPersonaProps) {
  const isActive = selectedPersonaId === id;
  const Icon = icon;

  return (
    <Button
      className={cn(
        isActive
          ? "rounded-full bg-primary text-primary-foreground transition-none hover:bg-primary/90 hover:text-primary-foreground"
          : "frosted-suggestion rounded-full capitalize"
      )}
      key={label}
      onClick={() =>
        isActive ? onSelectSystemPrompt("") : onSelectSystemPrompt(id)
      }
      size="lg"
      type="button"
      variant="ghost"
    >
      <Icon className="size-4" />
      {label}
    </Button>
  );
});

type PersonasProps = {
  onSelectSystemPrompt: (personaId: string) => void;
  selectedPersonaId?: string;
};

export const Personas = memo(function PersonasComponent({
  onSelectSystemPrompt,
  selectedPersonaId,
}: PersonasProps) {
  return (
    <motion.div
      animate="animate"
      className="flex w-full max-w-full flex-nowrap justify-center gap-2 overflow-x-auto px-2 md:mx-auto md:max-w-2xl md:flex-wrap md:justify-center md:pl-0"
      exit="exit"
      initial="initial"
      style={{
        scrollbarWidth: "none",
      }}
      transition={TRANSITION_SUGGESTIONS}
      variants={{
        initial: { opacity: 0, y: 10, filter: "blur(4px)" },
        animate: { opacity: 1, y: 0, filter: "blur(0px)" },
        exit: { opacity: 0, y: -10, filter: "blur(4px)" },
      }}
    >
      {PERSONAS.map((persona: (typeof PERSONAS)[0], index: number) => (
        <motion.div
          animate={{ opacity: 1, scale: 1 }}
          initial={{ opacity: 0, scale: 0.8 }}
          key={persona.label}
          transition={{
            ...TRANSITION_SUGGESTIONS,
            delay: index * 0.02,
          }}
        >
          <ButtonPersona
            icon={PERSONA_ICONS[persona.id] ?? CodeIcon}
            id={persona.id}
            key={persona.label}
            label={persona.label}
            onSelectSystemPrompt={onSelectSystemPrompt}
            selectedPersonaId={selectedPersonaId}
          />
        </motion.div>
      ))}
    </motion.div>
  );
});
