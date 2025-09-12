// HTTP Request Flow D3 Data Generators

// Page 1: Before Hitting Rails - Returns array of 6 flows for progressive reveal
export function generateBeforeRailsFlowsD3Data() {
  const flows = [
    // Flow 1: Browser Cache
    {
      id: 'browser-cache',
      title: 'Browser Cache',
      description: 'Request served from browser\'s local cache',
      nodes: [
        { id: 'bc-browser', name: 'Browser', type: 'client', group: 'client', description: 'User browser with caching' },
        { id: 'bc-check', name: 'Check Cache', type: 'process', group: 'cache', description: 'Verify cache validity' },
        { id: 'bc-cache', name: 'Browser Cache', type: 'storage', group: 'cache', description: 'Local storage' },
        { id: 'bc-response', name: 'Cached Response', type: 'response', group: 'response', description: '0ms latency' },
        { id: 'bc-user', name: 'User', type: 'client', group: 'client', description: 'Content displayed' }
      ],
      links: [
        { source: 'bc-browser', target: 'bc-check', type: 'request', label: 'GET /page' },
        { source: 'bc-check', target: 'bc-cache', type: 'lookup', label: 'Cache Hit' },
        { source: 'bc-cache', target: 'bc-response', type: 'serve', label: 'Serve from Cache' },
        { source: 'bc-response', target: 'bc-user', type: 'display', label: 'Display' }
      ],
      metrics: { latency: '0-1ms', load: 'None', benefit: 'Instant response' }
    },
    
    // Flow 2: CDN Cache
    {
      id: 'cdn-cache',
      title: 'CDN Cache',
      description: 'Content served from CDN edge server',
      nodes: [
        { id: 'cdn-browser', name: 'Browser', type: 'client', group: 'client', description: 'Makes request' },
        { id: 'cdn-edge', name: 'CDN Edge Server', type: 'network', group: 'cdn', description: 'Geographically close' },
        { id: 'cdn-cache', name: 'CDN Cache', type: 'storage', group: 'cache', description: 'Edge cache storage' },
        { id: 'cdn-response', name: 'Cached Response', type: 'response', group: 'response', description: 'Fast delivery' },
        { id: 'cdn-origin', name: 'Rails App', type: 'server', group: 'rails', description: 'Origin (not hit)', faded: true }
      ],
      links: [
        { source: 'cdn-browser', target: 'cdn-edge', type: 'request', label: 'HTTPS Request' },
        { source: 'cdn-edge', target: 'cdn-cache', type: 'lookup', label: 'Cache Hit' },
        { source: 'cdn-cache', target: 'cdn-response', type: 'serve', label: 'Serve Content' },
        { source: 'cdn-response', target: 'cdn-browser', type: 'response', label: 'Return to Browser', curved: true }
      ],
      metrics: { latency: '10-50ms', load: 'None on origin', benefit: 'Global distribution' }
    },
    
    // Flow 3: Web Server Static Files
    {
      id: 'static-files',
      title: 'Web Server Static Files',
      description: 'Nginx/Apache serves static assets directly',
      nodes: [
        { id: 'sf-browser', name: 'Browser', type: 'client', group: 'client', description: 'Requests asset' },
        { id: 'sf-nginx', name: 'Nginx/Apache', type: 'server', group: 'webserver', description: 'Web server' },
        { id: 'sf-filesystem', name: 'File System', type: 'storage', group: 'storage', description: 'public/ directory' },
        { id: 'sf-file', name: 'Static File', type: 'response', group: 'response', description: 'CSS/JS/Images' },
        { id: 'sf-rails', name: 'Rails App', type: 'server', group: 'rails', description: 'Not invoked', faded: true }
      ],
      links: [
        { source: 'sf-browser', target: 'sf-nginx', type: 'request', label: 'GET /assets/app.css' },
        { source: 'sf-nginx', target: 'sf-filesystem', type: 'read', label: 'Read File' },
        { source: 'sf-filesystem', target: 'sf-file', type: 'retrieve', label: 'Load Content' },
        { source: 'sf-file', target: 'sf-browser', type: 'response', label: 'Return File', curved: true }
      ],
      metrics: { latency: '5-20ms', load: 'File I/O only', benefit: 'No app overhead' }
    },
    
    // Flow 4: Load Balancer Health Check
    {
      id: 'health-check',
      title: 'Load Balancer Health Check',
      description: 'Minimal health endpoint response',
      nodes: [
        { id: 'hc-lb', name: 'Load Balancer', type: 'network', group: 'network', description: 'HAProxy/ELB' },
        { id: 'hc-endpoint', name: 'Health Endpoint', type: 'server', group: 'webserver', description: 'Rack middleware' },
        { id: 'hc-response', name: '200 OK', type: 'response', group: 'response', description: 'Simple response' },
        { id: 'hc-rails', name: 'Rails App', type: 'server', group: 'rails', description: 'Minimal involvement', faded: true }
      ],
      links: [
        { source: 'hc-lb', target: 'hc-endpoint', type: 'request', label: 'GET /health' },
        { source: 'hc-endpoint', target: 'hc-response', type: 'generate', label: 'Quick Check' },
        { source: 'hc-response', target: 'hc-lb', type: 'response', label: 'Return Status', curved: true }
      ],
      metrics: { latency: '1-5ms', load: 'Minimal', benefit: 'Service monitoring' }
    },
    
    // Flow 5: Rate Limiting
    {
      id: 'rate-limiting',
      title: 'Rate Limiting',
      description: 'Request blocked by rate limiter',
      nodes: [
        { id: 'rl-browser', name: 'Browser', type: 'client', group: 'client', description: 'Too many requests' },
        { id: 'rl-limiter', name: 'Rate Limiter', type: 'security', group: 'security', description: 'Rack::Attack' },
        { id: 'rl-store', name: 'Redis/Memory', type: 'storage', group: 'cache', description: 'Request counter' },
        { id: 'rl-response', name: '429 Too Many', type: 'response', group: 'error', description: 'Rate limit error' },
        { id: 'rl-rails', name: 'Rails App', type: 'server', group: 'rails', description: 'Protected', faded: true }
      ],
      links: [
        { source: 'rl-browser', target: 'rl-limiter', type: 'request', label: 'Excessive Requests' },
        { source: 'rl-limiter', target: 'rl-store', type: 'check', label: 'Check Limit' },
        { source: 'rl-store', target: 'rl-response', type: 'exceed', label: 'Limit Exceeded' },
        { source: 'rl-response', target: 'rl-browser', type: 'error', label: '429 Response', curved: true, error: true }
      ],
      metrics: { latency: '1-10ms', load: 'Minimal', benefit: 'Prevents overload' }
    },
    
    // Flow 6: WAF/Security Block
    {
      id: 'waf-block',
      title: 'WAF/Security Block',
      description: 'Malicious request blocked by firewall',
      nodes: [
        { id: 'waf-browser', name: 'Browser', type: 'client', group: 'client', description: 'Malicious request' },
        { id: 'waf-firewall', name: 'Web Application Firewall', type: 'security', group: 'security', description: 'Cloudflare/AWS WAF' },
        { id: 'waf-rules', name: 'Security Rules', type: 'process', group: 'security', description: 'Threat detection' },
        { id: 'waf-response', name: '403 Forbidden', type: 'response', group: 'error', description: 'Blocked' },
        { id: 'waf-rails', name: 'Rails App', type: 'server', group: 'rails', description: 'Protected', faded: true }
      ],
      links: [
        { source: 'waf-browser', target: 'waf-firewall', type: 'request', label: 'SQL Injection Attempt' },
        { source: 'waf-firewall', target: 'waf-rules', type: 'analyze', label: 'Check Patterns' },
        { source: 'waf-rules', target: 'waf-response', type: 'block', label: 'Threat Detected' },
        { source: 'waf-response', target: 'waf-browser', type: 'error', label: '403 Response', curved: true, error: true }
      ],
      metrics: { latency: '5-20ms', load: 'None on Rails', benefit: 'Security protection' }
    }
  ];
  
  return flows;
}

// Page 2: Route Direct Response
export function generateRouteDirectResponseD3Data() {
  const nodes = [
    { id: 'request', name: 'HTTP Request', type: 'entry', group: 'request', description: 'GET /health' },
    { id: 'rack', name: 'Rack Interface', type: 'middleware', group: 'rack', description: 'Rack environment' },
    { id: 'router', name: 'Journey Router', type: 'routing', group: 'rails', description: 'ActionDispatch::Routing' },
    { id: 'routeset', name: 'RouteSet', type: 'routing', group: 'rails', description: 'Route collection' },
    { id: 'endpoint', name: 'Route Endpoint', type: 'routing', group: 'rails', description: 'Lambda/Proc endpoint' },
    { id: 'lambda', name: 'Lambda Execution', type: 'process', group: 'rails', description: 'proc { [200, {}, ["OK"]] }' },
    { id: 'rack-response', name: 'Rack Triplet', type: 'response', group: 'response', description: '[status, headers, body]' },
    { id: 'client', name: 'Client', type: 'result', group: 'client', description: 'Receives response' }
  ];
  
  const links = [
    { source: 'request', target: 'rack', type: 'enters', label: 'HTTP → Rack' },
    { source: 'rack', target: 'router', type: 'routes', label: 'Find Route' },
    { source: 'router', target: 'routeset', type: 'searches', label: 'Pattern Match' },
    { source: 'routeset', target: 'endpoint', type: 'matches', label: 'Route Found' },
    { source: 'endpoint', target: 'lambda', type: 'executes', label: 'Call Lambda' },
    { source: 'lambda', target: 'rack-response', type: 'returns', label: 'Generate Response' },
    { source: 'rack-response', target: 'client', type: 'sends', label: 'Send to Client' }
  ];
  
  return { nodes, links };
}

// Page 3: Middleware Response
export function generateMiddlewareResponseD3Data() {
  const nodes = [
    { id: 'request', name: 'HTTP Request', type: 'entry', group: 'request', description: 'API request' },
    { id: 'rack', name: 'Rack', type: 'middleware', group: 'rack', description: 'Entry point' },
    { id: 'host-auth', name: 'HostAuthorization', type: 'middleware', group: 'middleware', description: 'Check allowed hosts' },
    { id: 'ssl', name: 'SSL Middleware', type: 'middleware', group: 'middleware', description: 'Force HTTPS' },
    { id: 'static', name: 'Static Middleware', type: 'middleware', group: 'middleware', description: 'Check static files' },
    { id: 'custom', name: 'Custom Middleware', type: 'middleware', group: 'middleware', description: 'ApiThrottle' },
    { id: 'cache-check', name: 'Cache Store', type: 'storage', group: 'cache', description: 'Redis/Memory' },
    { id: 'early-return', name: 'Early Response', type: 'response', group: 'response', description: '429 Rate Limited' },
    { id: 'router', name: 'Rails Router', type: 'routing', group: 'rails', description: 'Not reached', faded: true },
    { id: 'controller', name: 'Controller', type: 'controller', group: 'rails', description: 'Not reached', faded: true },
    { id: 'client', name: 'Client', type: 'result', group: 'client', description: 'Receives 429' }
  ];
  
  const links = [
    { source: 'request', target: 'rack', type: 'enters', label: 'Enter Rails' },
    { source: 'rack', target: 'host-auth', type: 'processes', label: 'Check Host' },
    { source: 'host-auth', target: 'ssl', type: 'continues', label: 'Valid Host' },
    { source: 'ssl', target: 'static', type: 'continues', label: 'HTTPS OK' },
    { source: 'static', target: 'custom', type: 'continues', label: 'Not Static' },
    { source: 'custom', target: 'cache-check', type: 'checks', label: 'Check Rate' },
    { source: 'cache-check', target: 'early-return', type: 'exceeds', label: 'Limit Hit' },
    { source: 'early-return', target: 'client', type: 'returns', label: 'Send 429' }
  ];
  
  return { nodes, links };
}

// Page 4: Controller Text Response
export function generateControllerTextResponseD3Data() {
  const nodes = [
    { id: 'request', name: 'HTTP Request', type: 'entry', group: 'request', description: 'GET /status' },
    { id: 'rack', name: 'Rack', type: 'middleware', group: 'rack', description: 'Process request' },
    { id: 'middleware', name: 'Middleware Stack', type: 'middleware', group: 'middleware', description: 'All middleware' },
    { id: 'router', name: 'ActionDispatch::Router', type: 'routing', group: 'rails', description: 'Route matching' },
    { id: 'route-match', name: 'Route Match', type: 'routing', group: 'rails', description: 'status#show' },
    { id: 'dispatcher', name: 'Dispatcher', type: 'controller', group: 'controller', description: 'Controller dispatch' },
    { id: 'controller-new', name: 'StatusController.new', type: 'controller', group: 'controller', description: 'Instantiate' },
    { id: 'callbacks', name: 'Callbacks', type: 'controller', group: 'controller', description: 'before_action' },
    { id: 'action', name: 'Action Method', type: 'controller', group: 'controller', description: '#show' },
    { id: 'render-plain', name: 'render plain:', type: 'response', group: 'response', description: 'Text rendering' },
    { id: 'response', name: 'ActionDispatch::Response', type: 'response', group: 'response', description: 'Response object' },
    { id: 'client', name: 'Client', type: 'result', group: 'client', description: 'Plain text' }
  ];
  
  const links = [
    { source: 'request', target: 'rack', type: 'enters', label: 'Enter' },
    { source: 'rack', target: 'middleware', type: 'processes', label: 'Stack' },
    { source: 'middleware', target: 'router', type: 'continues', label: 'Route' },
    { source: 'router', target: 'route-match', type: 'matches', label: 'Find' },
    { source: 'route-match', target: 'dispatcher', type: 'dispatches', label: 'Dispatch' },
    { source: 'dispatcher', target: 'controller-new', type: 'instantiates', label: 'Create' },
    { source: 'controller-new', target: 'callbacks', type: 'runs', label: 'Hooks' },
    { source: 'callbacks', target: 'action', type: 'calls', label: 'Execute' },
    { source: 'action', target: 'render-plain', type: 'renders', label: 'Render' },
    { source: 'render-plain', target: 'response', type: 'generates', label: 'Build' },
    { source: 'response', target: 'client', type: 'sends', label: 'Send' }
  ];
  
  return { nodes, links };
}

// Page 5: Controller with View
export function generateControllerViewD3Data() {
  const nodes = [
    { id: 'request', name: 'HTTP Request', type: 'entry', group: 'request', description: 'GET /about' },
    { id: 'router', name: 'Router', type: 'routing', group: 'rails', description: 'Route to controller' },
    { id: 'controller', name: 'PagesController', type: 'controller', group: 'controller', description: '#about action' },
    { id: 'instance-vars', name: '@company_name', type: 'controller', group: 'controller', description: 'Instance variables' },
    { id: 'action-view', name: 'ActionView::Base', type: 'view', group: 'view', description: 'View context' },
    { id: 'lookup', name: 'LookupContext', type: 'view', group: 'view', description: 'Template lookup' },
    { id: 'template', name: 'about.html.erb', type: 'view', group: 'view', description: 'ERB template' },
    { id: 'compile', name: 'Template Compile', type: 'view', group: 'view', description: 'ERB → Ruby' },
    { id: 'render', name: 'Render Content', type: 'view', group: 'view', description: 'Execute template' },
    { id: 'helpers', name: 'View Helpers', type: 'view', group: 'view', description: 'link_to, etc.' },
    { id: 'layout', name: 'application.html.erb', type: 'view', group: 'view', description: 'Layout wrapper' },
    { id: 'html', name: 'Complete HTML', type: 'response', group: 'response', description: 'Final HTML' },
    { id: 'client', name: 'Client', type: 'result', group: 'client', description: 'Rendered page' }
  ];
  
  const links = [
    { source: 'request', target: 'router', type: 'enters', label: 'Route' },
    { source: 'router', target: 'controller', type: 'routes', label: 'Dispatch' },
    { source: 'controller', target: 'instance-vars', type: 'sets', label: 'Set Data' },
    { source: 'instance-vars', target: 'action-view', type: 'passes', label: 'To View' },
    { source: 'action-view', target: 'lookup', type: 'performs', label: 'Find Template' },
    { source: 'lookup', target: 'template', type: 'finds', label: 'Locate' },
    { source: 'template', target: 'compile', type: 'compiles', label: 'Compile' },
    { source: 'compile', target: 'render', type: 'executes', label: 'Run' },
    { source: 'render', target: 'helpers', type: 'uses', label: 'Helpers' },
    { source: 'helpers', target: 'layout', type: 'wraps', label: 'Layout' },
    { source: 'layout', target: 'html', type: 'generates', label: 'HTML' },
    { source: 'html', target: 'client', type: 'sends', label: 'Response' }
  ];
  
  return { nodes, links };
}

// Page 6: Controller with Model and View
export function generateControllerModelViewD3Data() {
  const nodes = [
    { id: 'request', name: 'HTTP Request', type: 'entry', group: 'request', description: 'GET /products/1' },
    { id: 'router', name: 'Router', type: 'routing', group: 'rails', description: 'Match route' },
    { id: 'controller', name: 'ProductsController', type: 'controller', group: 'controller', description: '#show' },
    { id: 'params', name: 'Parameters', type: 'controller', group: 'controller', description: 'params[:id]' },
    { id: 'strong-params', name: 'Strong Parameters', type: 'controller', group: 'controller', description: 'Filtering' },
    { id: 'model', name: 'Product Model', type: 'model', group: 'model', description: 'ActiveRecord' },
    { id: 'query', name: 'SQL Query', type: 'model', group: 'database', description: 'SELECT * FROM...' },
    { id: 'connection', name: 'Connection Pool', type: 'model', group: 'database', description: 'DB connection' },
    { id: 'database', name: 'PostgreSQL', type: 'storage', group: 'database', description: 'Database' },
    { id: 'result', name: 'Query Result', type: 'model', group: 'database', description: 'Raw data' },
    { id: 'instance', name: '@product', type: 'model', group: 'model', description: 'Model instance' },
    { id: 'cache', name: 'Query Cache', type: 'storage', group: 'cache', description: 'SQL cache' },
    { id: 'view', name: 'show.html.erb', type: 'view', group: 'view', description: 'Template' },
    { id: 'fragment-cache', name: 'Fragment Cache', type: 'storage', group: 'cache', description: 'View cache' },
    { id: 'html', name: 'HTML Response', type: 'response', group: 'response', description: 'Complete page' },
    { id: 'client', name: 'Client', type: 'result', group: 'client', description: 'Product page' }
  ];
  
  const links = [
    { source: 'request', target: 'router', type: 'enters', label: 'Route' },
    { source: 'router', target: 'controller', type: 'routes', label: 'Dispatch' },
    { source: 'controller', target: 'params', type: 'extracts', label: 'Get ID' },
    { source: 'params', target: 'strong-params', type: 'filters', label: 'Filter' },
    { source: 'strong-params', target: 'model', type: 'passes', label: 'Query' },
    { source: 'model', target: 'query', type: 'builds', label: 'Build SQL' },
    { source: 'query', target: 'cache', type: 'checks', label: 'Cache?' },
    { source: 'cache', target: 'connection', type: 'misses', label: 'Not Cached' },
    { source: 'connection', target: 'database', type: 'executes', label: 'Execute' },
    { source: 'database', target: 'result', type: 'returns', label: 'Data' },
    { source: 'result', target: 'instance', type: 'instantiates', label: 'Create' },
    { source: 'instance', target: 'view', type: 'passes', label: 'To View' },
    { source: 'view', target: 'fragment-cache', type: 'checks', label: 'Cached?' },
    { source: 'fragment-cache', target: 'html', type: 'renders', label: 'Render' },
    { source: 'html', target: 'client', type: 'sends', label: 'Response' }
  ];
  
  return { nodes, links };
}

// Page 7: Complex Multi-Model Request
export function generateComplexMultiModelD3Data() {
  const nodes = [
    { id: 'request', name: 'HTTP Request', type: 'entry', group: 'request', description: 'GET /dashboard' },
    { id: 'router', name: 'Router', type: 'routing', group: 'rails', description: 'Route match' },
    { id: 'controller', name: 'DashboardController', type: 'controller', group: 'controller', description: '#index' },
    { id: 'auth', name: 'authenticate_user!', type: 'middleware', group: 'auth', description: 'Authentication' },
    { id: 'current-user', name: 'current_user', type: 'model', group: 'auth', description: 'User session' },
    { id: 'service', name: 'DashboardService', type: 'process', group: 'business', description: 'Service object' },
    { id: 'user-model', name: 'User Model', type: 'model', group: 'models', description: 'User queries' },
    { id: 'orders-model', name: 'Orders Model', type: 'model', group: 'models', description: 'Order queries' },
    { id: 'products-model', name: 'Products Model', type: 'model', group: 'models', description: 'Product queries' },
    { id: 'includes', name: 'Eager Loading', type: 'optimization', group: 'database', description: '.includes()' },
    { id: 'parallel', name: 'Parallel Queries', type: 'optimization', group: 'database', description: 'Thread pool' },
    { id: 'database', name: 'Database', type: 'storage', group: 'database', description: 'Multiple queries' },
    { id: 'cache', name: 'Rails.cache', type: 'storage', group: 'cache', description: 'Fragment cache' },
    { id: 'statistics', name: 'Calculate Stats', type: 'process', group: 'business', description: 'Aggregations' },
    { id: 'view', name: 'dashboard/index', type: 'view', group: 'view', description: 'Complex view' },
    { id: 'partials', name: 'Multiple Partials', type: 'view', group: 'view', description: 'Nested views' },
    { id: 'russian-doll', name: 'Russian Doll Cache', type: 'storage', group: 'cache', description: 'Nested caching' },
    { id: 'turbo', name: 'Turbo Frames', type: 'view', group: 'view', description: 'Lazy loading' },
    { id: 'html', name: 'Complex HTML', type: 'response', group: 'response', description: 'Dashboard page' },
    { id: 'client', name: 'Client', type: 'result', group: 'client', description: 'Dashboard' }
  ];
  
  const links = [
    { source: 'request', target: 'router', type: 'enters', label: 'Route' },
    { source: 'router', target: 'controller', type: 'routes', label: 'Dispatch' },
    { source: 'controller', target: 'auth', type: 'checks', label: 'Auth' },
    { source: 'auth', target: 'current-user', type: 'validates', label: 'User' },
    { source: 'current-user', target: 'service', type: 'passes', label: 'Service' },
    { source: 'service', target: 'parallel', type: 'uses', label: 'Parallel' },
    { source: 'parallel', target: 'user-model', type: 'queries', label: 'Users' },
    { source: 'parallel', target: 'orders-model', type: 'queries', label: 'Orders' },
    { source: 'parallel', target: 'products-model', type: 'queries', label: 'Products' },
    { source: 'orders-model', target: 'includes', type: 'uses', label: 'Preload' },
    { source: 'includes', target: 'database', type: 'queries', label: 'Execute' },
    { source: 'database', target: 'statistics', type: 'returns', label: 'Data' },
    { source: 'statistics', target: 'cache', type: 'stores', label: 'Cache' },
    { source: 'cache', target: 'view', type: 'passes', label: 'To View' },
    { source: 'view', target: 'russian-doll', type: 'uses', label: 'Cache' },
    { source: 'russian-doll', target: 'partials', type: 'renders', label: 'Partials' },
    { source: 'partials', target: 'turbo', type: 'includes', label: 'Turbo' },
    { source: 'turbo', target: 'html', type: 'assembles', label: 'Build' },
    { source: 'html', target: 'client', type: 'sends', label: 'Response' }
  ];
  
  return { nodes, links };
}

// Page 8: API JSON Response
export function generateAPIJsonResponseD3Data() {
  const nodes = [
    { id: 'request', name: 'API Request', type: 'entry', group: 'request', description: 'POST /api/v1/products' },
    { id: 'cors', name: 'CORS Headers', type: 'middleware', group: 'middleware', description: 'Cross-origin' },
    { id: 'router', name: 'API Router', type: 'routing', group: 'rails', description: 'API namespace' },
    { id: 'api-controller', name: 'API::ProductsController', type: 'controller', group: 'controller', description: 'ActionController::API' },
    { id: 'auth', name: 'Token Authentication', type: 'middleware', group: 'auth', description: 'Bearer token' },
    { id: 'rate-limit', name: 'Rate Limiting', type: 'middleware', group: 'middleware', description: '100/hour' },
    { id: 'params', name: 'JSON Parameters', type: 'controller', group: 'controller', description: 'JSON body' },
    { id: 'model', name: 'Product Model', type: 'model', group: 'model', description: 'Create product' },
    { id: 'validation', name: 'Validations', type: 'model', group: 'model', description: 'Model validations' },
    { id: 'database', name: 'Database', type: 'storage', group: 'database', description: 'INSERT' },
    { id: 'after-commit', name: 'After Commit', type: 'model', group: 'model', description: 'Callbacks' },
    { id: 'background-job', name: 'Background Job', type: 'process', group: 'background', description: 'SearchIndexer' },
    { id: 'serializer', name: 'ProductSerializer', type: 'serialization', group: 'api', description: 'ActiveModel::Serializer' },
    { id: 'json-build', name: 'JSON Builder', type: 'serialization', group: 'api', description: 'Generate JSON' },
    { id: 'etag', name: 'ETag Generation', type: 'response', group: 'response', description: 'Cache headers' },
    { id: 'json-response', name: 'JSON Response', type: 'response', group: 'response', description: '201 Created' },
    { id: 'client', name: 'API Client', type: 'result', group: 'client', description: 'JSON data' }
  ];
  
  const links = [
    { source: 'request', target: 'cors', type: 'enters', label: 'CORS' },
    { source: 'cors', target: 'router', type: 'continues', label: 'Route' },
    { source: 'router', target: 'api-controller', type: 'routes', label: 'API' },
    { source: 'api-controller', target: 'auth', type: 'validates', label: 'Auth' },
    { source: 'auth', target: 'rate-limit', type: 'checks', label: 'Rate' },
    { source: 'rate-limit', target: 'params', type: 'continues', label: 'Parse' },
    { source: 'params', target: 'model', type: 'passes', label: 'Create' },
    { source: 'model', target: 'validation', type: 'validates', label: 'Valid?' },
    { source: 'validation', target: 'database', type: 'saves', label: 'Save' },
    { source: 'database', target: 'after-commit', type: 'triggers', label: 'Commit' },
    { source: 'after-commit', target: 'background-job', type: 'enqueues', label: 'Job' },
    { source: 'model', target: 'serializer', type: 'passes', label: 'Serialize' },
    { source: 'serializer', target: 'json-build', type: 'formats', label: 'Build' },
    { source: 'json-build', target: 'etag', type: 'generates', label: 'ETag' },
    { source: 'etag', target: 'json-response', type: 'creates', label: 'Response' },
    { source: 'json-response', target: 'client', type: 'sends', label: 'JSON' }
  ];
  
  return { nodes, links };
}

// Page 9: Streaming Response
export function generateStreamingResponseD3Data() {
  const nodes = [
    { id: 'request', name: 'HTTP Request', type: 'entry', group: 'request', description: 'GET /live/events' },
    { id: 'router', name: 'Router', type: 'routing', group: 'rails', description: 'Route to Live' },
    { id: 'live-controller', name: 'ActionController::Live', type: 'controller', group: 'streaming', description: 'LiveController' },
    { id: 'thread', name: 'New Thread', type: 'streaming', group: 'streaming', description: 'Spawn thread' },
    { id: 'stream-init', name: 'response.stream', type: 'streaming', group: 'streaming', description: 'Initialize stream' },
    { id: 'headers', name: 'SSE Headers', type: 'streaming', group: 'streaming', description: 'text/event-stream' },
    { id: 'sse', name: 'SSE Object', type: 'streaming', group: 'streaming', description: 'ActionController::Live::SSE' },
    { id: 'redis', name: 'Redis PubSub', type: 'storage', group: 'data', description: 'Subscribe channel' },
    { id: 'data-source', name: 'Data Source', type: 'model', group: 'data', description: 'Real-time data' },
    { id: 'message-1', name: 'Message 1', type: 'streaming', group: 'chunks', description: 'data: {...}' },
    { id: 'write-1', name: 'sse.write', type: 'streaming', group: 'chunks', description: 'Send chunk' },
    { id: 'message-2', name: 'Message 2', type: 'streaming', group: 'chunks', description: 'data: {...}' },
    { id: 'write-2', name: 'sse.write', type: 'streaming', group: 'chunks', description: 'Send chunk' },
    { id: 'keepalive', name: 'Keep-Alive', type: 'streaming', group: 'streaming', description: 'Ping every 30s' },
    { id: 'cleanup', name: 'Cleanup', type: 'streaming', group: 'streaming', description: 'ensure block' },
    { id: 'close', name: 'Stream Close', type: 'streaming', group: 'streaming', description: 'sse.close' },
    { id: 'connection-release', name: 'Release Connection', type: 'streaming', group: 'streaming', description: 'Pool cleanup' },
    { id: 'client', name: 'EventSource Client', type: 'result', group: 'client', description: 'Receives events' }
  ];
  
  const links = [
    { source: 'request', target: 'router', type: 'enters', label: 'Route' },
    { source: 'router', target: 'live-controller', type: 'routes', label: 'Live' },
    { source: 'live-controller', target: 'thread', type: 'spawns', label: 'Thread' },
    { source: 'thread', target: 'stream-init', type: 'initializes', label: 'Stream' },
    { source: 'stream-init', target: 'headers', type: 'sets', label: 'Headers' },
    { source: 'headers', target: 'sse', type: 'creates', label: 'SSE' },
    { source: 'sse', target: 'redis', type: 'connects', label: 'Subscribe' },
    { source: 'redis', target: 'data-source', type: 'receives', label: 'Data' },
    { source: 'data-source', target: 'message-1', type: 'emits', label: 'Event' },
    { source: 'message-1', target: 'write-1', type: 'writes', label: 'Send' },
    { source: 'write-1', target: 'client', type: 'streams', label: 'Push', streaming: true },
    { source: 'data-source', target: 'message-2', type: 'emits', label: 'Event' },
    { source: 'message-2', target: 'write-2', type: 'writes', label: 'Send' },
    { source: 'write-2', target: 'client', type: 'streams', label: 'Push', streaming: true },
    { source: 'sse', target: 'keepalive', type: 'maintains', label: 'Ping' },
    { source: 'client', target: 'cleanup', type: 'disconnects', label: 'Close' },
    { source: 'cleanup', target: 'close', type: 'executes', label: 'Cleanup' },
    { source: 'close', target: 'connection-release', type: 'releases', label: 'Free' }
  ];
  
  return { nodes, links };
}