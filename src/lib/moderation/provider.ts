/**
 * Moderation provider abstraction.
 *
 * The platform requirement is that an AI must detect prohibited terminology
 * and insinuation and block/flag accordingly. The synchronous keyword engine
 * in `moderate.ts` works out-of-the-box with zero external dependencies, but
 * the platform is designed to escalate to a real classifier (e.g. an LLM or a
 * managed content-safety API such as Azure AI Content Safety / OpenAI
 * Moderations) without touching call sites.
 *
 * To enable an AI backend, implement ModerationProvider and return it from
 * `getModerationProvider()`. The domain helpers in `moderate.ts`
 * (moderateRegistration / moderateBusiness / moderateEvent) already delegate
 * to this provider when one is configured.
 */
import { ModerationResult } from './moderate';

export interface ModerationProvider {
  /** Stable identifier, e.g. "local-keyword" | "azure-content-safety". */
  readonly name: string;
  /** Scan a single free-text field. */
  scan(text: string | null | undefined): Promise<ModerationResult> | ModerationResult;
}

import { moderateText as localModerateText } from './moderate';

/**
 * Default provider: the bundled, dependency-free keyword engine. Swap this out
 * for an AI-backed implementation in production.
 */
export class LocalKeywordModerationProvider implements ModerationProvider {
  readonly name = 'local-keyword';
  scan(text: string | null | undefined): ModerationResult {
    return localModerateText(text);
  }
}

let activeProvider: ModerationProvider | null = null;

export function setModerationProvider(provider: ModerationProvider | null): void {
  activeProvider = provider;
}

export function getModerationProvider(): ModerationProvider {
  return activeProvider ?? new LocalKeywordModerationProvider();
}
