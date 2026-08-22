import { AuthorizationError, TrustBoundaryViolation } from "./errors";
import { assertNoTrustBearingFields } from "./forbiddenFields";

/**
 * Authority plane. The only way to obtain a SecurityContext is to authenticate a
 * credential against the registry; there is no constructor that takes a role
 * name. This is the structural answer to "caller-controlled security context":
 * a request may *ask* for less authority than it holds, never for more.
 */

const AUTHENTICATED: unique symbol = Symbol("malachii.authenticated");

export type Scope = string;

export interface AuthenticatedPrincipal {
  readonly [AUTHENTICATED]: true;
  readonly principalId: string;
  readonly role: PrincipalRole;
  readonly grantedScopes: readonly Scope[];
  /** True only for the Super-User (T2). Never derivable from a request. */
  readonly isRoot: boolean;
  /** Whether this principal may ever read scope "global". */
  readonly mayReadGlobal: boolean;
}

export type PrincipalRole = "root" | "operator" | "agent" | "untrusted";

export interface PrincipalRegistration {
  readonly principalId: string;
  readonly role: PrincipalRole;
  readonly credential: string;
  readonly grantedScopes: readonly Scope[];
  readonly mayReadGlobal?: boolean;
}

export class PrincipalRegistry {
  readonly #byCredential = new Map<string, AuthenticatedPrincipal>();

  register(registration: PrincipalRegistration): void {
    if (registration.credential.length < 8) {
      throw new TrustBoundaryViolation("credential too short to be meaningful");
    }
    const principal: AuthenticatedPrincipal = {
      [AUTHENTICATED]: true,
      principalId: registration.principalId,
      role: registration.role,
      grantedScopes: Object.freeze([...registration.grantedScopes]),
      isRoot: registration.role === "root",
      mayReadGlobal: registration.mayReadGlobal ?? registration.role === "root",
    };
    this.#byCredential.set(registration.credential, principal);
  }

  /** The single entry point that turns bytes from the wire into authority. */
  authenticate(credential: string): AuthenticatedPrincipal {
    const principal = this.#byCredential.get(credential);
    if (!principal) throw new AuthorizationError("unknown or invalid credential");
    return principal;
  }
}

export interface SecurityContext {
  readonly principal: AuthenticatedPrincipal;
  readonly effectiveScopes: readonly Scope[];
  readonly isRoot: boolean;
  readonly mayReadGlobal: boolean;
}

export interface ContextRequest {
  /** Optional narrowing. Any scope here that the principal lacks is a violation. */
  readonly requestedScopes?: readonly Scope[];
}

export function deriveSecurityContext(
  principal: AuthenticatedPrincipal,
  request: ContextRequest = {},
): SecurityContext {
  // A request body may not smuggle role/tier hints alongside its narrowing.
  assertNoTrustBearingFields(request, "context request");

  const granted = new Set(principal.grantedScopes);
  let effective: Scope[];

  if (request.requestedScopes === undefined) {
    effective = [...principal.grantedScopes];
  } else {
    const widened = request.requestedScopes.filter((s) => !granted.has(s));
    if (widened.length > 0) {
      throw new AuthorizationError(
        `requested scopes exceed granted authority: ${widened.join(", ")}`,
      );
    }
    effective = [...request.requestedScopes];
  }

  return {
    principal,
    effectiveScopes: Object.freeze(effective),
    isRoot: principal.isRoot,
    mayReadGlobal: principal.mayReadGlobal,
  };
}

export function requireScope(context: SecurityContext, scope: Scope): void {
  if (!context.effectiveScopes.includes(scope)) {
    throw new AuthorizationError(`principal lacks scope: ${scope}`);
  }
}
