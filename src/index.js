const express = require('express');
const { McpServer } = require('@modelcontextprotocol/sdk/server/mcp.js');
const { SSEServerTransport } = require('@modelcontextprotocol/sdk/server/sse.js');
const { z } = require('zod');
const yapiService = require('./yapiService');

const server = new McpServer({
  name: "example-server",
  version: "1.0.0"
});

const KEEP_ALIVE_INTERVAL_MS = 25000;
// ... set up server resources, tools, and prompts ...

const app = express();

// to support multiple simultaneous connections we have a lookup object from
// sessionId to transport
const transports= {};
const sseConnections = new Map();

// Define the interface details resource
server.resource(
  "interface",
  "yapi://interface/{id}",
  async (uri, params) => {
    const details = await yapiService.getInterfaceDetails(params.id);
    return {
      contents: [{
        uri: uri.href,
        text: JSON.stringify(details, null, 2)
      }]
    };
  }
);

// Define the interface by path resource
server.resource(
  "interfaceByPath",
  "yapi://interface/path/{path}",
  async (uri, params) => {
    const details = await yapiService.getInterfaceByPath(params.path);
    return {
      contents: [{
        uri: uri.href,
        text: JSON.stringify(details, null, 2)
      }]
    };
  }
);

// Define the interface list tool
server.tool(
  "listInterfaces",
  {},
  async () => {
    const interfaces = await yapiService.listInterfaces();
    return {
      content: [{
        type: "text",
        text: JSON.stringify(interfaces, null, 2)
      }]
    };
  }
);

// Define the get interface tool
server.tool(
  "getInterface",
  { id: z.string() },
  async ({ id }) => {
    const details = await yapiService.getInterfaceDetails(id);
    return {
      content: [{
        type: "text",
        text: JSON.stringify(details, null, 2)
      }]
    };
  }
);

// Define the get interface by path tool
server.tool(
  "getInterfaceByPath",
  { path: z.string() },
  async ({ path }) => {
    const details = await yapiService.getInterfaceByPath(path);
    return {
      content: [{
        type: "text",
        text: JSON.stringify(details, null, 2)
      }]
    };
  }
);

// Define the get interface by name tool
server.tool(
  "getInterfaceByName",
  { name: z.string() },
  async ({ name }) => {
    const details = await yapiService.getInterfaceByName(name);
    return {
      content: [{
        type: "text",
        text: JSON.stringify(details, null, 2)
      }]
    };
  }
);

app.get("/health", (_, res) => {
  res.status(200).json({ status: 'healthy' });
});

app.get("/sse", async (_, res) => {
  const transport = new SSEServerTransport('/messages', res);
  const sessionId = transport.sessionId; // Get session ID from transport
  transports[sessionId] = transport;

    // Start keep-alive ping
    const intervalId = setInterval(() => {
      if (sseConnections.has(sessionId) && !res.writableEnded) {
        res.write(': keepalive\n\n');
        console.log('keepalive:'+sessionId)
      } else {
        // Should not happen if close handler is working, but clear just in case
        clearInterval(intervalId);
        sseConnections.delete(sessionId);
      }
    }, KEEP_ALIVE_INTERVAL_MS);

      // Store connection details
  sseConnections.set(sessionId, { res, intervalId });
  console.log(`[SSE Connection] Client connected: ${sessionId}, starting keep-alive.`);

  res.on("close", () => {
    delete transports[transport.sessionId];
        // Clean up keep-alive interval
        const connection = sseConnections.get(sessionId);
        if (connection) {
          clearInterval(connection.intervalId);
          sseConnections.delete(sessionId);
        }
  });
    // Connect server to transport *after* setting up handlers
    try {
      await server.connect(transport)
    } catch (error) {
      console.error(`[SSE Connection] Error connecting server to transport for ${sessionId}:`, error);
      // Ensure cleanup happens even if connect fails
      clearInterval(intervalId);
      sseConnections.delete(sessionId);
      delete transports[sessionId];
      if (!res.writableEnded) {
        res.status(500).end('Failed to connect MCP server to transport');
      }
    }
  //await server.connect(transport);
});

app.post("/messages", async (req, res) => {
  const sessionId = req.query.sessionId;
  const transport = transports[sessionId];
  if (transport) {
    await transport.handlePostMessage(req, res);
  } else {
    res.status(400).send('No transport found for sessionId');
  }
});

app.listen(process.env.PORT || 3001, () => {
    console.log(`Server is running on port ${process.env.PORT || 3001}`);
  });