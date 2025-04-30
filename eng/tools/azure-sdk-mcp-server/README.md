# Azure SDK MCP Server

The Azure SDK MCP Server is a tool designed to facilitate communication and interaction with the Model Context Protocol (MCP). It provides a server implementation that supports various tools and schemas for efficient data exchange.

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org) (version 16 or later is recommended)
- [npm](https://www.npmjs.com/) or [yarn](https://yarnpkg.com/)

### Installation

Clone the repository and navigate to the `azure-sdk-mcp-server` directory:

```bash
# Clone the repository
git clone https://github.com/Azure/azure-sdk-for-js.git

# Navigate to the package directory
cd eng/tools/azure-sdk-mcp-server

# Install dependencies
npm install
```

### Build and Run

To build the project:

```bash
npm run build
```

To start the server:

```bash
npm start
```

For development mode using the [MCP Inspector](https://github.com/modelcontextprotocol/inspector)

```bash
npm run dev
```

## Key Concepts

- **MCP Server**: The core server implementation that handles communication using the Model Context Protocol.
- **Tools**: Extendable functionalities registered with the server, such as the `hello_world` tool.
- **Schemas**: Validation schemas for tool inputs, defined using [Zod](https://zod.dev/).

## Examples

### Hello World Tool

The `hello_world` tool demonstrates a simple implementation:

```typescript
import { helloWorldSchema, helloWorld } from "./tools/helloWorld.js";

server.tool(
  "hello_world",
  "Prints hello world",
  helloWorldSchema.shape,
  async (args) => await helloWorld(args),
);
```

## Troubleshooting

If you encounter issues:

1. Ensure all dependencies are installed: `npm install`
2. Verify the Node.js version: `node -v`
3. Check for build errors: `npm run build`

## Next Steps

- Explore the [Model Context Protocol SDK](https://github.com/modelcontextprotocol/sdk) for more tools and features.
- Extend the server by adding custom tools and schemas.

## Contributing

This project welcomes contributions and suggestions. For details, see the [contributing guide](https://github.com/Azure/azure-sdk-for-js/blob/main/CONTRIBUTING.md).

## Related Projects

- [Azure SDK for JavaScript](https://github.com/Azure/azure-sdk-for-js)
- [Model Context Protocol SDK](https://github.com/modelcontextprotocol/sdk)
