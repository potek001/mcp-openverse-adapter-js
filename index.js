import FastMCP from 'fastmcp';
import fetch from 'node-fetch';

const OPENVERSE_API_BASE = 'https://api.openverse.engineering/v1';

const server = new FastMCP({
  name: 'mcp-openverse-adapter-js',
  version: '0.1.0'
});

// Search tool
server.addTool({
  name: 'search',
  description: 'Search for openly-licensed images on Openverse',
  parameters: {
    query: { type: 'string', description: 'Search terms (required)' },
    page: { type: 'number', description: 'Page number (default: 1)', optional: true },
    page_size: { type: 'number', description: 'Results per page (default: 20, max: 500)', optional: true },
    license_type: { type: 'string', description: 'License type (commercial or modification)', optional: true },
    license: { type: 'string', description: 'License filter (e.g., by, by-sa, cc0)', optional: true },
    source: { type: 'string', description: 'Filter by source (e.g., flickr, wikimedia)', optional: true },
    creator: { type: 'string', description: 'Filter by creator name', optional: true },
    extension: { type: 'string', description: 'File type (jpg, png, gif, svg)', optional: true },
    aspect_ratio: { type: 'string', description: 'Image shape (tall, wide, square)', optional: true },
    size: { type: 'string', description: 'Image size (small, medium, large)', optional: true },
    mature: { type: 'boolean', description: 'Include mature content (default: false)', optional: true }
  },
  async execute(args) {
    const params = {
      q: args.query,
      page: String(args.page || 1),
      page_size: String(Math.min(args.page_size || 20, 500)),
      mature: String(args.mature || false)
    };
    if (args.license_type) params.license_type = args.license_type;
    if (args.license) params.license = args.license;
    if (args.creator) params.creator = args.creator;
    if (args.source) params.source = args.source;
    if (args.extension) params.extension = args.extension;
    if (args.aspect_ratio) params.aspect_ratio = args.aspect_ratio;
    if (args.size) params.size = args.size;
    const searchParams = new URLSearchParams(params);
    const res = await fetch(`${OPENVERSE_API_BASE}/images?${searchParams.toString()}`);
    if (!res.ok) {
      throw new Error(`API request failed: ${res.status} ${res.statusText}`);
    }
    const data = await res.json();
    return data.results.map(img => ({
      id: img.id,
      title: img.title ?? img.creator ?? img.id,
      url: img.url,
      thumbnail: img.thumbnail,
      width: img.width,
      height: img.height
    }));
  }
});

// Fetch tool
server.addTool({
  name: 'fetch',
  description: 'Get detailed information about a specific image',
  parameters: {
    id: { type: 'string', description: 'Openverse image ID (UUID format)' }
  },
  async execute(args) {
    const res = await fetch(`${OPENVERSE_API_BASE}/images/${args.id}/`);
    if (!res.ok) {
      throw new Error(`API request failed: ${res.status} ${res.statusText}`);
    }
    const data = await res.json();
    return data;
  }
});

server.start().catch(err => {
  console.error(err);
});
