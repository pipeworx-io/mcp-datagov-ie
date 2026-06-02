interface McpToolDefinition {
  name: string;
  description: string;
  inputSchema: {
    type: 'object';
    properties: Record<string, unknown>;
    required?: string[];
  };
}

interface McpToolExport {
  tools: McpToolDefinition[];
  callTool: (name: string, args: Record<string, unknown>) => Promise<unknown>;
  meter?: { credits: number };
  cost?: Record<string, unknown>;
  provider?: string;
}

/**
 * data.gov.ie MCP — Ireland's national open-data portal (CKAN API).
 *
 * Auth: none (keyless). Docs: https://docs.ckan.org/en/latest/api/
 *
 * What's here: datasets published by Irish government departments, state
 * agencies, and local authorities (county/city councils) — e.g. council
 * budgets, election/referendum results, charities register, transport,
 * health, planning. Metadata and values are in English.
 *
 * Notes for callers:
 * - Many resources are documents (PDF/XLSX) linked by a download `url`;
 *   surface that url to the user.
 * - Resources with `datastore_active: true` expose row-level table data —
 *   read those rows with `datastore_query`, passing the resource `id`
 *   (resource_id) found in `dataset_details`.
 */


const BASE = 'https://data.gov.ie/api/3/action';
const UA = 'pipeworx-mcp-datagov-ie/1.0 (+https://pipeworx.io)';

const tools: McpToolExport['tools'] = [
  {
    name: 'search_datasets',
    description:
      "Search Ireland's national open-data catalogue (data.gov.ie, CKAN package_search). Returns matching datasets from government departments, state agencies, and local councils, with titles/descriptions and their resources (English).",
    inputSchema: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'Search terms in English. e.g. "budget", "referendum", "housing", "transport".' },
        fq: { type: 'string', description: 'Solr filter query, e.g. "organization:kildarecoco-ckan" or "res_format:CSV".' },
        rows: { type: 'number', description: 'Max results, 1-1000 (default 25).' },
        start: { type: 'number', description: '0-based offset for paging.' },
        sort: { type: 'string', description: 'Sort spec, e.g. "metadata_modified desc".' },
      },
      required: ['query'],
    },
  },
  {
    name: 'dataset_details',
    description:
      'Full dataset record by id or slug (CKAN package_show), including its resources. Each resource has a download "url" (often PDF/CSV/XLSX) and a "datastore_active" flag; resources with datastore_active=true can be read row-by-row via datastore_query using the resource "id".',
    inputSchema: {
      type: 'object',
      properties: { id: { type: 'string', description: 'Dataset id or slug, e.g. "budget" or "1968fourthamendmentcsv".' } },
      required: ['id'],
    },
  },
  {
    name: 'datastore_query',
    description:
      'Read actual table rows from a resource via CKAN datastore_search. Works only for resources with datastore_active=true (get the resource_id from dataset_details).',
    inputSchema: {
      type: 'object',
      properties: {
        resource_id: { type: 'string', description: 'Resource UUID from dataset_details, e.g. "a51e4cf1-733d-4ed6-9ab5-01251a4348f7".' },
        q: { type: 'string', description: 'Full-text filter across the table.' },
        filters: { type: 'object', description: 'Exact-match column filters, e.g. {"Constituency":"Cork"}.' },
        limit: { type: 'number', description: 'Max rows, 1-32000 (default 100).' },
        offset: { type: 'number', description: '0-based row offset for paging.' },
      },
      required: ['resource_id'],
    },
  },
  {
    name: 'list_organizations',
    description:
      'List publishing organizations (government departments, state agencies, county/city councils) on data.gov.ie (CKAN organization_list).',
    inputSchema: {
      type: 'object',
      properties: { limit: { type: 'number', description: 'Max orgs, 1-1000 (default 100).' } },
    },
  },
  {
    name: 'list_groups',
    description: 'List thematic groups/categories on data.gov.ie (CKAN group_list).',
    inputSchema: {
      type: 'object',
      properties: { limit: { type: 'number', description: 'Max groups, 1-1000 (default 100).' } },
    },
  },
];

async function callTool(name: string, args: Record<string, unknown>): Promise<unknown> {
  switch (name) {
    case 'search_datasets': {
      const params = new URLSearchParams({
        q: reqStr(args, 'query', '"budget" or "referendum"'),
        rows: String(clamp(args.rows, 25, 1, 1000)),
        start: String(Math.max(0, (args.start as number) ?? 0)),
      });
      if (args.fq) params.set('fq', String(args.fq));
      if (args.sort) params.set('sort', String(args.sort));
      return ckanGet(`/package_search?${params}`);
    }
    case 'dataset_details':
      return ckanGet(`/package_show?id=${encodeURIComponent(reqStr(args, 'id', '"budget"'))}`);
    case 'datastore_query': {
      const params = new URLSearchParams({
        resource_id: reqStr(args, 'resource_id', '"a51e4cf1-733d-4ed6-9ab5-01251a4348f7"'),
        limit: String(clamp(args.limit, 100, 1, 32000)),
        offset: String(Math.max(0, (args.offset as number) ?? 0)),
      });
      if (args.q) params.set('q', String(args.q));
      if (args.filters && typeof args.filters === 'object') params.set('filters', JSON.stringify(args.filters));
      return ckanGet(`/datastore_search?${params}`);
    }
    case 'list_organizations': {
      const params = new URLSearchParams({ all_fields: 'true', limit: String(clamp(args.limit, 100, 1, 1000)) });
      return ckanGet(`/organization_list?${params}`);
    }
    case 'list_groups': {
      const params = new URLSearchParams({ all_fields: 'true', limit: String(clamp(args.limit, 100, 1, 1000)) });
      return ckanGet(`/group_list?${params}`);
    }
    default:
      throw new Error(`Unknown tool: ${name}`);
  }
}

async function ckanGet(path: string): Promise<unknown> {
  const res = await fetch(`${BASE}${path}`, { headers: { Accept: 'application/json', 'User-Agent': UA } });
  if (!res.ok) throw new Error(`data.gov.ie: ${res.status} ${await res.text().then((t) => t.slice(0, 200))}`);
  const json = (await res.json()) as { success?: boolean; error?: { message?: string }; result?: unknown };
  if (json.success === false) throw new Error(`data.gov.ie: ${json.error?.message ?? 'request failed'}`);
  return json.result ?? json;
}

function clamp(v: unknown, dflt: number, lo: number, hi: number): number {
  const n = typeof v === 'number' ? v : dflt;
  return Math.min(hi, Math.max(lo, n));
}

function reqStr(args: Record<string, unknown>, key: string, example: string): string {
  const v = args[key];
  if (typeof v !== 'string' || !v.trim()) {
    throw new Error(`Required argument "${key}" is missing. Pass a string like ${example}.`);
  }
  return v;
}

export default { tools, callTool, meter: { credits: 1 } } satisfies McpToolExport;
