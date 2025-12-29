"use client";

import type { KeyboardEvent } from "react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useUser } from "@/app/providers/user-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/components/ui/toast";

export default function CustomizationPage() {
  const { user, updateUser } = useUser();
  const [hasInitialized, setHasInitialized] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const [preferredName, setPreferredName] = useState("");
  const [occupation, setOccupation] = useState("");
  const [traitInput, setTraitInput] = useState("");
  const [traits, setTraits] = useState<string[]>([]);
  const [about, setAbout] = useState("");

  const parsedTraits = useMemo(() => {
    const raw = user?.traits ?? "";
    if (!raw) {
      return [] as string[];
    }
    return raw
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);
  }, [user?.traits]);

  useEffect(() => {
    if (!user || hasInitialized) {
      return;
    }
    setPreferredName(user.preferredName ?? "");
    setOccupation(user.occupation ?? "");
    setTraits(parsedTraits);
    setAbout(user.about ?? "");
    setHasInitialized(true);
  }, [user, hasInitialized, parsedTraits]);

  const addTrait = useCallback((value: string) => {
    const normalized = value.trim();
    if (!normalized) {
      return;
    }
    setTraits((prev) => {
      if (prev.includes(normalized)) {
        return prev;
      }
      return [...prev, normalized];
    });
  }, []);

  const removeTrait = useCallback((value: string) => {
    setTraits((prev) => prev.filter((t) => t !== value));
  }, []);

  const handleTraitKeyDown = useCallback(
    (event: KeyboardEvent<HTMLInputElement>) => {
      if (event.key !== "Enter" && event.key !== "Tab") {
        return;
      }
      const next = traitInput.trim();
      if (!next) {
        return;
      }
      event.preventDefault();
      addTrait(next);
      setTraitInput("");
    },
    [addTrait, traitInput]
  );

  const suggestedTraits = useMemo(
    () => [
      "friendly",
      "witty",
      "concise",
      "curious",
      "empathetic",
      "creative",
      "patient",
    ],
    []
  );

  const handleSave = useCallback(async () => {
    setIsSaving(true);
    try {
      await updateUser({
        preferredName: preferredName.trim(),
        occupation: occupation.trim(),
        traits: traits.join(", ").trim(),
        about: about.trim(),
      });
      toast({ title: "Preferences saved", status: "success" });
    } catch {
      toast({ title: "Failed to save preferences", status: "error" });
    } finally {
      setIsSaving(false);
    }
  }, [about, occupation, preferredName, traits, updateUser]);

  if (!user) {
    return null;
  }

  return (
    <div className="w-full">
      <div className="space-y-10">
        <div className="space-y-2">
          <h1 className="font-bold text-3xl">Customization</h1>
        </div>

        <section className="space-y-3">
          <div className="flex items-center justify-between gap-4">
            <Label htmlFor="preferredName">What should FRC RAG call you?</Label>
            <span className="text-muted-foreground text-xs">
              {preferredName.length}/50
            </span>
          </div>
          <Input
            id="preferredName"
            maxLength={50}
            onChange={(e) => setPreferredName(e.target.value)}
            placeholder="Enter your name"
            value={preferredName}
          />
        </section>

        <section className="space-y-3">
          <div className="flex items-center justify-between gap-4">
            <Label htmlFor="occupation">What do you do?</Label>
            <span className="text-muted-foreground text-xs">
              {occupation.length}/100
            </span>
          </div>
          <Input
            id="occupation"
            maxLength={100}
            onChange={(e) => setOccupation(e.target.value)}
            placeholder="Engineer, student, etc."
            value={occupation}
          />
        </section>

        <section className="space-y-3">
          <div className="flex items-center justify-between gap-4">
            <Label htmlFor="traits">What traits should FRC RAG have?</Label>
            <span className="text-muted-foreground text-xs">
              {traitInput.length}/100
            </span>
          </div>
          {traits.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {traits.map((trait) => (
                <button
                  className="inline-flex items-center rounded-md bg-muted px-2.5 py-1 text-muted-foreground text-xs hover:bg-muted/80"
                  key={trait}
                  onClick={() => removeTrait(trait)}
                  type="button"
                >
                  <span className="mr-2">{trait}</span>
                  <span aria-hidden={true}>×</span>
                  <span className="sr-only">Remove trait</span>
                </button>
              ))}
            </div>
          ) : null}

          <Input
            id="traits"
            maxLength={100}
            onChange={(e) => setTraitInput(e.target.value)}
            onKeyDown={handleTraitKeyDown}
            placeholder="Type a trait and press Enter or Tab…"
            value={traitInput}
          />

          <div className="flex flex-wrap gap-2">
            {suggestedTraits
              .filter((t) => !traits.includes(t))
              .map((trait) => (
                <button
                  className="inline-flex items-center gap-2 rounded-md bg-muted px-3 py-1 text-muted-foreground text-xs hover:bg-muted/80"
                  key={trait}
                  onClick={() => addTrait(trait)}
                  type="button"
                >
                  <span>{trait}</span>
                  <span aria-hidden={true}>+</span>
                </button>
              ))}
          </div>
        </section>

        <section className="space-y-3">
          <div className="flex items-center justify-between gap-4">
            <Label htmlFor="about">
              Anything else FRC RAG should know about you?
            </Label>
            <span className="text-muted-foreground text-xs">
              {about.length}/3000
            </span>
          </div>
          <Textarea
            id="about"
            maxLength={3000}
            onChange={(e) => setAbout(e.target.value)}
            placeholder="Interests, values, or preferences to keep in mind"
            rows={6}
            value={about}
          />
        </section>

        <div className="flex justify-end pt-2">
          <Button disabled={isSaving} onClick={handleSave} type="button">
            Save Preferences
          </Button>
        </div>
      </div>
    </div>
  );
}
