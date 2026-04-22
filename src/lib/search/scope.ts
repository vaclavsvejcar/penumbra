import { findScopeByCode, SCOPES } from './registry'
import type { ScopeDef } from './types'

export type ParsedPrompt = {
  scope: ScopeDef | null
  query: string
  // True when the user has typed a partial `/xxx` without a trailing space yet.
  // The palette uses this to show scope suggestions under the input.
  pendingScopeFragment: string | null
}

/**
 * Parse the raw prompt string into a scope and a query.
 *
 * - If `currentScope` is set, the full raw is the query.
 * - If `slashMode` is true, raw is a scope-code fragment (no query yet). The
 *   decorative `/` in the UI acts as the slash the user has "already typed".
 * - Otherwise, raw is a plain global query. The legacy `/code query` paste
 *   path is still handled here for robustness.
 */
export function parsePrompt(
  raw: string,
  currentScope: ScopeDef | null,
  slashMode: boolean,
): ParsedPrompt {
  if (currentScope) {
    return { scope: currentScope, query: raw, pendingScopeFragment: null }
  }

  if (slashMode) {
    return {
      scope: null,
      query: '',
      pendingScopeFragment: raw.toLowerCase(),
    }
  }

  // Paste-path: `/code query` → materialise scope.
  const match = raw.match(/^\/(\w+)\s(.*)$/)
  if (match) {
    const code = match[1]
    const scope = findScopeByCode(code)
    if (scope) {
      return { scope, query: match[2], pendingScopeFragment: null }
    }
  }

  return { scope: null, query: raw, pendingScopeFragment: null }
}

export function suggestScopes(fragment: string): ReadonlyArray<ScopeDef> {
  if (!fragment) return SCOPES
  return SCOPES.filter((s) => s.code.startsWith(fragment))
}
