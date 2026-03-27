export const DEFAULT_STORY_NAME = '若曦';

export function resolveStoryName(input) {
  return (input ?? '').trim().replace(/\s+/g, ' ').slice(0, 16) || DEFAULT_STORY_NAME;
}
