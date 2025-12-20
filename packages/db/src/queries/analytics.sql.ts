export const RUNS_STATUS_COUNTS_SQL = `
select
  status,
  count(*)::int as count
from "Run"
group by status
`;
