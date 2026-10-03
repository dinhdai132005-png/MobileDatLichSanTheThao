// =====================================================================
// CHUYỂN ĐỔI SNAKE_CASE SANG CAMELCASE — Tham chiếu: Plant/AGENT.md mục 3
// =====================================================================

function snakeToCamelStr(str: string): string {
  return str.replace(/([-_][a-z0-9])/gi, ($1) =>
    $1.toUpperCase().replace('-', '').replace('_', '')
  );
}

export function toCamel<T = any>(obj: any): T {
  if (Array.isArray(obj)) {
    return obj.map((v) => toCamel(v)) as unknown as T;
  }
  if (obj !== null && obj !== undefined && typeof obj === 'object' && !(obj instanceof Date)) {
    return Object.keys(obj).reduce((result: any, key: string) => {
      const camelKey = snakeToCamelStr(key);
      result[camelKey] = toCamel(obj[key]);
      return result;
    }, {}) as T;
  }
  return obj;
}
