import type { ActionCode, DomainCode, RoleCode, ScopeType } from "@prisma/client";

export type PermissionScope = {
  type: ScopeType;
  id?: string | null;
  divisionId?: string | null;
  projectId?: string | null;
};

export type EffectiveGrant = {
  role: RoleCode;
  action: ActionCode;
  domain: DomainCode;
  scope: PermissionScope;
  source: "role" | "temporary";
  endsAt?: Date | null;
};

export type FieldRestrictionView = {
  domain: DomainCode;
  field: string;
  scope: PermissionScope;
};

export type AuthPrincipal = {
  userId: string;
  entityId: string;
  email: string;
  nameHe: string;
  isActive: boolean;
  grants: EffectiveGrant[];
  restrictions: FieldRestrictionView[];
};

export type AccessCheck = {
  action: ActionCode;
  domain: DomainCode;
  record?: {
    id?: string;
    divisionId?: string | null;
    projectId?: string | null;
    assigneeId?: string | null;
    contactId?: string | null;
    ownerUserId?: string | null;
  };
  field?: string;
};

export type AccessDecision = {
  allowed: boolean;
  reason: string;
  matchedGrant?: EffectiveGrant;
  restriction?: FieldRestrictionView;
};
