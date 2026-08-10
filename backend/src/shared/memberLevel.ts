// backend/src/shared/memberLevel.ts
// Single source of truth for a user's borrowing-policy tier. Explicit
// user.member_level always wins; otherwise falls back to the year_of_study >= 5
// heuristic (undergraduate/postgraduate only - a lecturer can never be
// inferred from year_of_study, so that tier requires member_level to be set
// explicitly, e.g. via the admin Members page).
//
// Every settings lookup keyed by level (loan_limit_${level}, fine_rate_${level},
// loan_period_days_${level}, max_renewals_${level}) uses this function's
// return value directly as the interpolated segment.
import { User } from '@prisma/client';

export type MemberLevelKey = 'undergraduate' | 'postgraduate' | 'lecturer';

export function resolveMemberLevel(user: Pick<User, 'member_level' | 'year_of_study'>): MemberLevelKey {
  if (user.member_level === 'LECTURER') return 'lecturer';
  if (user.member_level === 'POSTGRADUATE') return 'postgraduate';
  if (user.member_level === 'UNDERGRADUATE') return 'undergraduate';
  return (user.year_of_study ?? 0) >= 5 ? 'postgraduate' : 'undergraduate';
}
