import { describe, expect, it } from "vitest";
import { StoryProgress } from "./storyProgress";

describe("StoryProgress", () => {
  const memory = () => {
    const values = new Map<string, string>();
    return { getItem: (key: string) => values.get(key) ?? null, setItem: (key: string, value: string) => void values.set(key, value) };
  };

  it("remembers each story per player", () => {
    const story = new StoryProgress(memory());
    expect(story.hasSeen("aaaa", "intro")).toBe(false);
    story.markSeen("aaaa", "intro");
    expect(story.hasSeen("aaaa", "intro")).toBe(true);
    expect(story.hasSeen("aaaa", "conjuntos")).toBe(false);
    expect(story.hasSeen("bbbb", "intro")).toBe(false);
  });

  it("shows the story again when storage is blocked", () => {
    const blocked = { getItem: () => { throw new Error("blocked"); }, setItem: () => { throw new Error("blocked"); } };
    const story = new StoryProgress(blocked);
    story.markSeen("aaaa", "intro");
    expect(story.hasSeen("aaaa", "intro")).toBe(false);
  });
});
