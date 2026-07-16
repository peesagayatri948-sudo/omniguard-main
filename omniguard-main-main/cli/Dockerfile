FROM node:18-alpine

WORKDIR /app

# Copy the MCP server file
COPY mcp-server.js /app/mcp-server.js

# Give execution permissions
RUN chmod +x /app/mcp-server.js

# Entry point for the Model Context Protocol stdio server
ENTRYPOINT ["node", "/app/mcp-server.js"]
