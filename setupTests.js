// process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const dotenv = require('dotenv')

// Load environment variables from .env file
dotenv.config();

try {
  if (typeof fetch === 'undefined') {
    const { fetch, Response, Headers, Request } = require('undici');
    global.fetch = fetch;
    global.Response = Response;
    global.Headers = Headers;
    global.Request = Request;
  }
} catch (_) {
  // optional: ignore if undici isn't installed
}