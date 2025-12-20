export const MODULES_RECENT_SQL = `
select
  id,
  name,
  version,
  created_at as "createdAt",
  updated_at as "updatedAt"
from "Module"
order by created_at desc
limit $1
`;
