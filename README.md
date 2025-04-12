# YAPI MCP Server

This is a Model Context Protocol (MCP) server that provides access to YAPI interface details.

## Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- YAPI instance
- YAPI project ID and token

## Installation

1. Clone this repository
2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the root directory with the following variables:
```
YAPI_BASE_URL=http://your-yapi-instance.com
YAPI_TOKEN=your-token-here
YAPI_PROJECT_ID=your-project-id
```

## Usage

Start the server:
```bash
npm start
```
The server can be configured in your Claude Desktop config file:

```json
{
  "mcpServers": {
    "yapi": {
      "type": "SSE",
      "url": "http://localhost:${your .env PORT}/sse"
    }
  }
}
```