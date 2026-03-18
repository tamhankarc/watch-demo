export function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function canManageCustomers(role: string) {
  return ['ADMIN', 'MANAGER', 'SALES_EXECUTIVE'].includes(role);
}
