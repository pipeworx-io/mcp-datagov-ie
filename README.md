# mcp-datagov-ie

data.gov.ie MCP — Ireland's national open-data portal (CKAN API).

Part of [Pipeworx](https://pipeworx.io) — an MCP gateway connecting AI agents to 1394+ live data sources.

## Tools

| Tool | Description |
|------|-------------|
| `search_datasets` | Search Ireland's national open-data catalogue (data.gov.ie, CKAN package_search). Returns matching datasets from government departments, state agencies, and local councils, with titles/descriptions and their resources (English). |
| `dataset_details` | Full dataset record by id or slug (CKAN package_show), including its resources. Each resource has a download "url" (often PDF/CSV/XLSX) and a "datastore_active" flag; resources with datastore_active=true can be read row-by-row via datastore_query using the resource "id". |
| `datastore_query` | Read actual table rows from a resource via CKAN datastore_search. Works only for resources with datastore_active=true (get the resource_id from dataset_details). |
| `list_organizations` | List publishing organizations (government departments, state agencies, county/city councils) on data.gov.ie (CKAN organization_list). |
| `list_groups` | List thematic groups/categories on data.gov.ie (CKAN group_list). |

## Quick Start

Add to your MCP client (Claude Desktop, Cursor, Windsurf, etc.):

```json
{
  "mcpServers": {
    "datagov-ie": {
      "url": "https://gateway.pipeworx.io/datagov-ie/mcp"
    }
  }
}
```

Or connect to the full Pipeworx gateway for access to all 1394+ data sources:

```json
{
  "mcpServers": {
    "pipeworx": {
      "url": "https://gateway.pipeworx.io/mcp"
    }
  }
}
```

## Using with ask_pipeworx

Instead of calling tools directly, you can ask questions in plain English:

```
ask_pipeworx({ question: "your question about Datagov Ie data" })
```

The gateway picks the right tool and fills the arguments automatically.

## More

- [Docs and guides](https://pipeworx.io/docs)
- [pipeworx.io](https://pipeworx.io)

## License

MIT
