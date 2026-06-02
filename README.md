# mcp-datagov-ie

data.gov.ie MCP — Ireland's national open-data portal (CKAN API).

Part of [Pipeworx](https://pipeworx.io) — an MCP gateway connecting AI agents to 705+ live data sources.

## Tools

| Tool | Description |
|------|-------------|
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

Or connect to the full Pipeworx gateway for access to all 705+ data sources:

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

- [All tools and guides](https://github.com/pipeworx-io/examples)
- [pipeworx.io](https://pipeworx.io)

## License

MIT
