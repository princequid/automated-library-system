// backend/src/modules/circulation/eligibility.service.ts
// Circulation consumes the SAME eligibility rules defined once in the Users module,
// re-exported here so this module's imports read naturally. There is exactly one
// definition of "eligible" in the system.
export { checkEligibility } from '../users/eligibility';
export type { EligibilityResult } from '../users/eligibility';
