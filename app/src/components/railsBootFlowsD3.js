// Rails Boot Process D3 Data Generators

export function generateBootFlowsD3Data() {
  const flows = [
    // Flow 1: Initial Boot & Bundler Setup
    {
      id: 'initial-boot',
      title: 'Initial Boot & Bundler Setup',
      description: 'Load paths configuration and gem activation',
      nodes: [
        { id: 'rb-command', name: 'rails server', type: 'entry', group: 'command', description: 'Shell command' },
        { id: 'rb-binstub', name: 'bin/rails', type: 'process', group: 'boot', description: 'Rails binstub' },
        { id: 'rb-boot', name: 'config/boot.rb', type: 'process', group: 'boot', description: 'Bundler setup' },
        { id: 'rb-gemfile', name: 'Gemfile', type: 'storage', group: 'config', description: 'Gem dependencies' },
        { id: 'rb-bundler', name: 'Bundler.setup', type: 'process', group: 'boot', description: 'Activate gems' },
        { id: 'rb-loadpath', name: '$LOAD_PATH', type: 'storage', group: 'system', description: 'Gem paths configured' },
        { id: 'rb-ready', name: 'Ready to require Rails', type: 'result', group: 'ready', description: 'Gems available' }
      ],
      links: [
        { source: 'rb-command', target: 'rb-binstub', type: 'execute', label: 'Run binstub' },
        { source: 'rb-binstub', target: 'rb-boot', type: 'require', label: "require 'config/boot'" },
        { source: 'rb-boot', target: 'rb-gemfile', type: 'locate', label: 'Find Gemfile' },
        { source: 'rb-gemfile', target: 'rb-bundler', type: 'setup', label: 'Bundler.setup' },
        { source: 'rb-bundler', target: 'rb-loadpath', type: 'configure', label: 'Set load paths' },
        { source: 'rb-loadpath', target: 'rb-ready', type: 'complete', label: 'Boot ready' }
      ],
      metrics: { phase: 'Boot', time: '~50-100ms', purpose: 'Gem loading' }
    },

    // Flow 2: Application Class Definition
    {
      id: 'app-definition',
      title: 'Application Class Definition',
      description: 'Rails application class creation and registration',
      nodes: [
        { id: 'ad-application', name: 'config/application.rb', type: 'entry', group: 'config', description: 'App configuration' },
        { id: 'ad-rails-all', name: "require 'rails/all'", type: 'process', group: 'loading', description: 'Load framework' },
        { id: 'ad-railties', name: 'Load Railties', type: 'process', group: 'loading', description: 'AR, AC, AV, etc.' },
        { id: 'ad-bundler-req', name: 'Bundler.require', type: 'process', group: 'loading', description: 'Load app gems' },
        { id: 'ad-class-def', name: 'MyApp::Application', type: 'process', group: 'definition', description: 'Inherits Rails::Application' },
        { id: 'ad-register', name: 'Rails.app_class', type: 'storage', group: 'system', description: 'Application registered' },
        { id: 'ad-hooks', name: ':before_configuration', type: 'process', group: 'hooks', description: 'Load hooks run' },
        { id: 'ad-complete', name: 'Application Defined', type: 'result', group: 'ready', description: 'Class ready' }
      ],
      links: [
        { source: 'ad-application', target: 'ad-rails-all', type: 'require', label: "require 'rails/all'" },
        { source: 'ad-rails-all', target: 'ad-railties', type: 'load', label: 'Load framework components' },
        { source: 'ad-railties', target: 'ad-bundler-req', type: 'next', label: 'Bundler.require' },
        { source: 'ad-bundler-req', target: 'ad-class-def', type: 'define', label: 'class Application < Rails::Application' },
        { source: 'ad-class-def', target: 'ad-register', type: 'register', label: 'Set Rails.app_class' },
        { source: 'ad-register', target: 'ad-hooks', type: 'trigger', label: 'Run load hooks' },
        { source: 'ad-hooks', target: 'ad-complete', type: 'complete', label: 'Application defined' }
      ],
      metrics: { phase: 'Definition', time: '~100-200ms', purpose: 'App registration' }
    },

    // Flow 3: Railtie Registration
    {
      id: 'railtie-registration',
      title: 'Railtie Registration',
      description: 'Framework components register as Railties',
      nodes: [
        { id: 'rr-require', name: "require 'rails/all'", type: 'entry', group: 'loading', description: 'Framework load' },
        { id: 'rr-as-railtie', name: 'ActiveSupport::Railtie', type: 'railtie', group: 'railties', description: 'Core extensions' },
        { id: 'rr-ar-railtie', name: 'ActiveRecord::Railtie', type: 'railtie', group: 'railties', description: 'ORM layer' },
        { id: 'rr-ac-railtie', name: 'ActionController::Railtie', type: 'railtie', group: 'railties', description: 'Controller layer' },
        { id: 'rr-av-railtie', name: 'ActionView::Railtie', type: 'railtie', group: 'railties', description: 'View layer' },
        { id: 'rr-am-railtie', name: 'ActionMailer::Railtie', type: 'railtie', group: 'railties', description: 'Email' },
        { id: 'rr-aj-railtie', name: 'ActiveJob::Railtie', type: 'railtie', group: 'railties', description: 'Background jobs' },
        { id: 'rr-subclasses', name: 'Rails::Railtie.subclasses', type: 'storage', group: 'system', description: 'Tracked railties' },
        { id: 'rr-initializers', name: 'Initializers Defined', type: 'result', group: 'ready', description: 'Ready to initialize' }
      ],
      links: [
        { source: 'rr-require', target: 'rr-as-railtie', type: 'load', label: 'Load ActiveSupport' },
        { source: 'rr-require', target: 'rr-ar-railtie', type: 'load', label: 'Load ActiveRecord' },
        { source: 'rr-require', target: 'rr-ac-railtie', type: 'load', label: 'Load ActionController' },
        { source: 'rr-require', target: 'rr-av-railtie', type: 'load', label: 'Load ActionView' },
        { source: 'rr-require', target: 'rr-am-railtie', type: 'load', label: 'Load ActionMailer' },
        { source: 'rr-require', target: 'rr-aj-railtie', type: 'load', label: 'Load ActiveJob' },
        { source: 'rr-as-railtie', target: 'rr-subclasses', type: 'register', label: 'Track railtie' },
        { source: 'rr-ar-railtie', target: 'rr-subclasses', type: 'register', label: 'Track railtie' },
        { source: 'rr-ac-railtie', target: 'rr-subclasses', type: 'register', label: 'Track railtie' },
        { source: 'rr-av-railtie', target: 'rr-subclasses', type: 'register', label: 'Track railtie' },
        { source: 'rr-am-railtie', target: 'rr-subclasses', type: 'register', label: 'Track railtie' },
        { source: 'rr-aj-railtie', target: 'rr-subclasses', type: 'register', label: 'Track railtie' },
        { source: 'rr-subclasses', target: 'rr-initializers', type: 'ready', label: 'Initializers defined' }
      ],
      metrics: { phase: 'Registration', time: '~50-100ms', purpose: 'Component registration' }
    },

    // Flow 4: Initialize! - Main Initialization
    {
      id: 'initialize',
      title: 'Initialize! - Main Initialization',
      description: 'Rails.application.initialize! orchestrates boot',
      nodes: [
        { id: 'in-env', name: 'config/environment.rb', type: 'entry', group: 'config', description: 'Environment file' },
        { id: 'in-req-app', name: "require 'application'", type: 'process', group: 'loading', description: 'Load application' },
        { id: 'in-initialize', name: 'Rails.application.initialize!', type: 'process', group: 'init', description: 'Main initialization' },
        { id: 'in-run-inits', name: 'run_initializers', type: 'process', group: 'init', description: 'Execute initializers' },
        { id: 'in-collect', name: 'Collect Initializers', type: 'process', group: 'init', description: 'From all railties' },
        { id: 'in-tsort', name: 'TSort (Dependency Order)', type: 'process', group: 'sorting', description: 'Order by dependencies' },
        { id: 'in-execute', name: 'Execute Each Initializer', type: 'process', group: 'execution', description: 'Run in order' },
        { id: 'in-initialized', name: '@initialized = true', type: 'result', group: 'ready', description: 'Boot complete' }
      ],
      links: [
        { source: 'in-env', target: 'in-req-app', type: 'require', label: "require_relative 'application'" },
        { source: 'in-req-app', target: 'in-initialize', type: 'call', label: 'Rails.application.initialize!' },
        { source: 'in-initialize', target: 'in-run-inits', type: 'invoke', label: 'run_initializers' },
        { source: 'in-run-inits', target: 'in-collect', type: 'collect', label: 'initializers_chain' },
        { source: 'in-collect', target: 'in-tsort', type: 'sort', label: 'TSort by dependencies' },
        { source: 'in-tsort', target: 'in-execute', type: 'execute', label: 'Run each' },
        { source: 'in-execute', target: 'in-initialized', type: 'complete', label: 'Mark initialized' }
      ],
      metrics: { phase: 'Initialization', time: '~500-1000ms', purpose: 'Core setup' }
    },

    // Flow 5: Bootstrap Initializers
    {
      id: 'bootstrap',
      title: 'Bootstrap Initializers',
      description: 'Early infrastructure setup',
      nodes: [
        { id: 'bs-start', name: 'Bootstrap Phase', type: 'entry', group: 'phase', description: 'First initializers' },
        { id: 'bs-load-env', name: 'load_environment_hook', type: 'init', group: 'bootstrap', description: 'Load environment config' },
        { id: 'bs-env-file', name: 'config/environments/ENV.rb', type: 'config', group: 'config', description: 'Environment-specific config' },
        { id: 'bs-logger', name: 'initialize_logger', type: 'init', group: 'bootstrap', description: 'Set up Rails.logger' },
        { id: 'bs-cache', name: 'initialize_cache', type: 'init', group: 'bootstrap', description: 'Set up Rails.cache' },
        { id: 'bs-routes', name: 'set_routes_reloader', type: 'init', group: 'bootstrap', description: 'Routes reloading' },
        { id: 'bs-deps', name: 'set_clear_dependencies', type: 'init', group: 'bootstrap', description: 'Code reloading (dev)' },
        { id: 'bs-ready', name: 'Infrastructure Ready', type: 'result', group: 'ready', description: 'Ready for framework' }
      ],
      links: [
        { source: 'bs-start', target: 'bs-load-env', type: 'run', label: 'First initializer' },
        { source: 'bs-load-env', target: 'bs-env-file', type: 'load', label: 'Require environment' },
        { source: 'bs-env-file', target: 'bs-logger', type: 'next', label: 'Initialize logger' },
        { source: 'bs-logger', target: 'bs-cache', type: 'next', label: 'Initialize cache' },
        { source: 'bs-cache', target: 'bs-routes', type: 'next', label: 'Set up routes' },
        { source: 'bs-routes', target: 'bs-deps', type: 'next', label: 'Set up reloading' },
        { source: 'bs-deps', target: 'bs-ready', type: 'complete', label: 'Bootstrap complete' }
      ],
      metrics: { phase: 'Bootstrap', time: '~100-200ms', purpose: 'Infrastructure' }
    },

    // Flow 6: Framework Initializers
    {
      id: 'framework',
      title: 'Framework Initializers',
      description: 'Railtie initializers in dependency order',
      nodes: [
        { id: 'fw-start', name: 'Framework Phase', type: 'entry', group: 'phase', description: 'Framework setup' },
        { id: 'fw-as', name: 'ActiveSupport Initializers', type: 'init', group: 'framework', description: 'Core extensions, I18n' },
        { id: 'fw-am', name: 'ActiveModel Initializers', type: 'init', group: 'framework', description: 'Validations, callbacks' },
        { id: 'fw-ar', name: 'ActiveRecord Initializers', type: 'init', group: 'framework', description: 'Database connection' },
        { id: 'fw-ad', name: 'ActionDispatch Initializers', type: 'init', group: 'framework', description: 'Request/Response' },
        { id: 'fw-ac', name: 'ActionController Initializers', type: 'init', group: 'framework', description: 'Controller config' },
        { id: 'fw-av', name: 'ActionView Initializers', type: 'init', group: 'framework', description: 'Template paths' },
        { id: 'fw-others', name: 'Other Framework Initializers', type: 'init', group: 'framework', description: 'Mailer, Job, Cable' },
        { id: 'fw-ready', name: 'Framework Ready', type: 'result', group: 'ready', description: 'Framework configured' }
      ],
      links: [
        { source: 'fw-start', target: 'fw-as', type: 'run', label: 'ActiveSupport first' },
        { source: 'fw-as', target: 'fw-am', type: 'next', label: 'Then ActiveModel' },
        { source: 'fw-am', target: 'fw-ar', type: 'next', label: 'Then ActiveRecord' },
        { source: 'fw-ar', target: 'fw-ad', type: 'next', label: 'Then ActionDispatch' },
        { source: 'fw-ad', target: 'fw-ac', type: 'next', label: 'Then ActionController' },
        { source: 'fw-ac', target: 'fw-av', type: 'next', label: 'Then ActionView' },
        { source: 'fw-av', target: 'fw-others', type: 'next', label: 'Other frameworks' },
        { source: 'fw-others', target: 'fw-ready', type: 'complete', label: 'Framework ready' }
      ],
      metrics: { phase: 'Framework', time: '~200-400ms', purpose: 'Framework setup' }
    },

    // Flow 7: Application Initializers
    {
      id: 'app-initializers',
      title: 'Application Initializers',
      description: 'Custom initializers from config/initializers/',
      nodes: [
        { id: 'ai-start', name: 'Application Phase', type: 'entry', group: 'phase', description: 'Custom setup' },
        { id: 'ai-dir', name: 'config/initializers/', type: 'storage', group: 'config', description: 'Initializer directory' },
        { id: 'ai-assets', name: 'assets.rb', type: 'init', group: 'app', description: 'Asset config' },
        { id: 'ai-cors', name: 'cors.rb', type: 'init', group: 'app', description: 'CORS config' },
        { id: 'ai-filter', name: 'filter_parameter_logging.rb', type: 'init', group: 'app', description: 'Parameter filtering' },
        { id: 'ai-session', name: 'session_store.rb', type: 'init', group: 'app', description: 'Session config' },
        { id: 'ai-custom', name: 'custom_*.rb', type: 'init', group: 'app', description: 'App-specific setup' },
        { id: 'ai-ready', name: 'Application Configured', type: 'result', group: 'ready', description: 'App setup complete' }
      ],
      links: [
        { source: 'ai-start', target: 'ai-dir', type: 'scan', label: 'Load from directory' },
        { source: 'ai-dir', target: 'ai-assets', type: 'load', label: 'Alphabetically' },
        { source: 'ai-assets', target: 'ai-cors', type: 'next', label: 'Next file' },
        { source: 'ai-cors', target: 'ai-filter', type: 'next', label: 'Next file' },
        { source: 'ai-filter', target: 'ai-session', type: 'next', label: 'Next file' },
        { source: 'ai-session', target: 'ai-custom', type: 'next', label: 'Custom initializers' },
        { source: 'ai-custom', target: 'ai-ready', type: 'complete', label: 'All loaded' }
      ],
      metrics: { phase: 'Application', time: '~50-200ms', purpose: 'App configuration' }
    },

    // Flow 8: Middleware Stack Construction
    {
      id: 'middleware',
      title: 'Middleware Stack Construction',
      description: 'Build Rack middleware stack',
      nodes: [
        { id: 'mw-start', name: 'build_middleware_stack', type: 'entry', group: 'phase', description: 'Finisher initializer' },
        { id: 'mw-collect', name: 'Collect Middleware', type: 'process', group: 'building', description: 'From all sources' },
        { id: 'mw-default', name: 'Default Middleware', type: 'storage', group: 'middleware', description: 'Rails defaults' },
        { id: 'mw-railtie', name: 'Railtie Middleware', type: 'storage', group: 'middleware', description: 'Framework middleware' },
        { id: 'mw-app', name: 'Application Middleware', type: 'storage', group: 'middleware', description: 'Custom middleware' },
        { id: 'mw-build', name: 'Build Stack', type: 'process', group: 'building', description: 'Create chain' },
        { id: 'mw-stack', name: 'Middleware Stack', type: 'result', group: 'ready', description: '~25 middleware' },
        { id: 'mw-router', name: 'Router (bottom)', type: 'result', group: 'ready', description: 'Route dispatcher' }
      ],
      links: [
        { source: 'mw-start', target: 'mw-collect', type: 'begin', label: 'Collect all middleware' },
        { source: 'mw-collect', target: 'mw-default', type: 'from', label: 'Rails defaults' },
        { source: 'mw-collect', target: 'mw-railtie', type: 'from', label: 'Railtie middleware' },
        { source: 'mw-collect', target: 'mw-app', type: 'from', label: 'App middleware' },
        { source: 'mw-default', target: 'mw-build', type: 'add', label: 'Add to stack' },
        { source: 'mw-railtie', target: 'mw-build', type: 'add', label: 'Add to stack' },
        { source: 'mw-app', target: 'mw-build', type: 'add', label: 'Add to stack' },
        { source: 'mw-build', target: 'mw-stack', type: 'create', label: 'Build chain' },
        { source: 'mw-stack', target: 'mw-router', type: 'bottom', label: 'Router at bottom' }
      ],
      metrics: { phase: 'Middleware', time: '~20-50ms', purpose: 'Request pipeline' }
    },

    // Flow 9: Eager Loading (Production)
    {
      id: 'eager-loading',
      title: 'Eager Loading (Production)',
      description: 'Load all application code into memory',
      nodes: [
        { id: 'el-check', name: 'config.eager_load?', type: 'entry', group: 'check', description: 'Check if enabled' },
        { id: 'el-before', name: 'before_eager_load callbacks', type: 'process', group: 'hooks', description: 'Pre-load hooks' },
        { id: 'el-paths', name: 'eager_load_paths', type: 'storage', group: 'config', description: 'app/* directories' },
        { id: 'el-zeitwerk', name: 'Zeitwerk.eager_load_all', type: 'process', group: 'loading', description: 'Load all constants' },
        { id: 'el-models', name: 'Load Models', type: 'process', group: 'loading', description: 'User, Post, etc.' },
        { id: 'el-controllers', name: 'Load Controllers', type: 'process', group: 'loading', description: 'ApplicationController, etc.' },
        { id: 'el-jobs', name: 'Load Jobs, Mailers, etc.', type: 'process', group: 'loading', description: 'All app code' },
        { id: 'el-complete', name: 'All Code Loaded', type: 'result', group: 'ready', description: '~200-500MB memory' }
      ],
      links: [
        { source: 'el-check', target: 'el-before', type: 'true', label: 'If production' },
        { source: 'el-before', target: 'el-paths', type: 'next', label: 'Get paths' },
        { source: 'el-paths', target: 'el-zeitwerk', type: 'load', label: 'Zeitwerk eager load' },
        { source: 'el-zeitwerk', target: 'el-models', type: 'load', label: 'app/models' },
        { source: 'el-zeitwerk', target: 'el-controllers', type: 'load', label: 'app/controllers' },
        { source: 'el-zeitwerk', target: 'el-jobs', type: 'load', label: 'app/jobs, etc.' },
        { source: 'el-models', target: 'el-complete', type: 'combine', label: 'All loaded' },
        { source: 'el-controllers', target: 'el-complete', type: 'combine', label: 'All loaded' },
        { source: 'el-jobs', target: 'el-complete', type: 'combine', label: 'All loaded' }
      ],
      metrics: { phase: 'Eager Load', time: '~200-500ms', purpose: 'Production optimization' }
    },

    // Flow 10: Finalization & Routes
    {
      id: 'finalization',
      title: 'Finalization & Routes',
      description: 'Final steps and route loading',
      nodes: [
        { id: 'fi-finisher', name: 'Finisher Initializers', type: 'entry', group: 'phase', description: 'Final setup' },
        { id: 'fi-to-prepare', name: 'to_prepare callbacks', type: 'process', group: 'hooks', description: 'Request hooks' },
        { id: 'fi-after-init', name: 'after_initialize callbacks', type: 'process', group: 'hooks', description: 'Final hooks' },
        { id: 'fi-routes', name: 'Load Routes', type: 'process', group: 'routing', description: 'config/routes.rb' },
        { id: 'fi-route-set', name: 'ActionDispatch::Routing::RouteSet', type: 'process', group: 'routing', description: 'Build route set' },
        { id: 'fi-journey', name: 'Journey::Router', type: 'process', group: 'routing', description: 'Route matching' },
        { id: 'fi-helpers', name: 'Route Helpers', type: 'result', group: 'ready', description: 'users_path, etc.' },
        { id: 'fi-ready', name: 'Application @initialized = true', type: 'result', group: 'ready', description: 'Boot complete!' }
      ],
      links: [
        { source: 'fi-finisher', target: 'fi-to-prepare', type: 'run', label: 'to_prepare blocks' },
        { source: 'fi-to-prepare', target: 'fi-after-init', type: 'next', label: 'after_initialize' },
        { source: 'fi-after-init', target: 'fi-routes', type: 'load', label: 'Load routes' },
        { source: 'fi-routes', target: 'fi-route-set', type: 'build', label: 'Create RouteSet' },
        { source: 'fi-route-set', target: 'fi-journey', type: 'compile', label: 'Journey router' },
        { source: 'fi-journey', target: 'fi-helpers', type: 'generate', label: 'Create helpers' },
        { source: 'fi-helpers', target: 'fi-ready', type: 'complete', label: 'Boot complete!' }
      ],
      metrics: { phase: 'Finalization', time: '~100-200ms', purpose: 'Routing & cleanup' }
    },

    // Flow 11: Server Start & First Request
    {
      id: 'server-start',
      title: 'Server Start & First Request',
      description: 'Web server starts and handles first request',
      nodes: [
        { id: 'ss-init-done', name: 'Initialize! Complete', type: 'entry', group: 'ready', description: 'Boot finished' },
        { id: 'ss-server', name: 'Puma/Unicorn Starts', type: 'process', group: 'server', description: 'Web server' },
        { id: 'ss-listen', name: 'Listen on :3000', type: 'process', group: 'server', description: 'TCP socket' },
        { id: 'ss-ready-log', name: 'Server Ready Log', type: 'result', group: 'ready', description: 'Listening on...' },
        { id: 'ss-request', name: 'First HTTP Request', type: 'entry', group: 'request', description: 'GET /users' },
        { id: 'ss-rack', name: 'Rack env Hash', type: 'process', group: 'request', description: 'REQUEST_METHOD, PATH_INFO' },
        { id: 'ss-app', name: 'Rails.application.call(env)', type: 'process', group: 'request', description: 'Enter app' },
        { id: 'ss-middleware', name: 'Middleware Stack', type: 'process', group: 'request', description: 'Process request' },
        { id: 'ss-router', name: 'Router Dispatch', type: 'process', group: 'request', description: 'Match route' },
        { id: 'ss-controller', name: 'UsersController#index', type: 'process', group: 'request', description: 'Controller action' },
        { id: 'ss-response', name: '[200, {}, [html]]', type: 'result', group: 'response', description: 'Rack response' },
        { id: 'ss-browser', name: 'Browser', type: 'result', group: 'response', description: 'Page rendered' }
      ],
      links: [
        { source: 'ss-init-done', target: 'ss-server', type: 'start', label: 'Start web server' },
        { source: 'ss-server', target: 'ss-listen', type: 'listen', label: 'Bind to port' },
        { source: 'ss-listen', target: 'ss-ready-log', type: 'log', label: 'Server ready' },
        { source: 'ss-ready-log', target: 'ss-request', type: 'receive', label: 'HTTP request' },
        { source: 'ss-request', target: 'ss-rack', type: 'convert', label: 'Create env' },
        { source: 'ss-rack', target: 'ss-app', type: 'call', label: 'app.call(env)' },
        { source: 'ss-app', target: 'ss-middleware', type: 'enter', label: 'Middleware stack' },
        { source: 'ss-middleware', target: 'ss-router', type: 'dispatch', label: 'Route to controller' },
        { source: 'ss-router', target: 'ss-controller', type: 'invoke', label: 'Call action' },
        { source: 'ss-controller', target: 'ss-response', type: 'return', label: 'Rack triplet' },
        { source: 'ss-response', target: 'ss-browser', type: 'send', label: 'HTTP response' }
      ],
      metrics: { phase: 'Server Start', time: '~50-100ms', purpose: 'First request' }
    },

    // Flow 12: Complete Boot Timeline
    {
      id: 'boot-timeline',
      title: 'Complete Boot Timeline',
      description: 'End-to-end boot process overview',
      nodes: [
        { id: 'bt-command', name: 'rails server', type: 'entry', group: 'start', description: 'Start command' },
        { id: 'bt-boot', name: '1. Boot & Bundler', type: 'phase', group: 'timeline', description: '~100ms' },
        { id: 'bt-app-def', name: '2. App Definition', type: 'phase', group: 'timeline', description: '~200ms' },
        { id: 'bt-railtie', name: '3. Railtie Registration', type: 'phase', group: 'timeline', description: '~100ms' },
        { id: 'bt-init', name: '4. Initialize!', type: 'phase', group: 'timeline', description: '~100ms' },
        { id: 'bt-bootstrap', name: '5. Bootstrap', type: 'phase', group: 'timeline', description: '~200ms' },
        { id: 'bt-framework', name: '6. Framework Init', type: 'phase', group: 'timeline', description: '~400ms' },
        { id: 'bt-app-init', name: '7. App Init', type: 'phase', group: 'timeline', description: '~200ms' },
        { id: 'bt-middleware', name: '8. Middleware', type: 'phase', group: 'timeline', description: '~50ms' },
        { id: 'bt-eager', name: '9. Eager Load', type: 'phase', group: 'timeline', description: '~500ms (prod)' },
        { id: 'bt-finalize', name: '10. Finalization', type: 'phase', group: 'timeline', description: '~200ms' },
        { id: 'bt-server', name: '11. Server Start', type: 'phase', group: 'timeline', description: '~100ms' },
        { id: 'bt-ready', name: 'Ready to Accept Requests', type: 'result', group: 'ready', description: 'Total: ~2-3s' }
      ],
      links: [
        { source: 'bt-command', target: 'bt-boot', type: 'begin', label: 'Start boot' },
        { source: 'bt-boot', target: 'bt-app-def', type: 'next', label: 'Next phase' },
        { source: 'bt-app-def', target: 'bt-railtie', type: 'next', label: 'Next phase' },
        { source: 'bt-railtie', target: 'bt-init', type: 'next', label: 'Next phase' },
        { source: 'bt-init', target: 'bt-bootstrap', type: 'next', label: 'Next phase' },
        { source: 'bt-bootstrap', target: 'bt-framework', type: 'next', label: 'Next phase' },
        { source: 'bt-framework', target: 'bt-app-init', type: 'next', label: 'Next phase' },
        { source: 'bt-app-init', target: 'bt-middleware', type: 'next', label: 'Next phase' },
        { source: 'bt-middleware', target: 'bt-eager', type: 'next', label: 'Next phase' },
        { source: 'bt-eager', target: 'bt-finalize', type: 'next', label: 'Next phase' },
        { source: 'bt-finalize', target: 'bt-server', type: 'next', label: 'Next phase' },
        { source: 'bt-server', target: 'bt-ready', type: 'complete', label: 'Boot complete!' }
      ],
      metrics: { phase: 'Complete Boot', time: '~2-3 seconds', purpose: 'Full boot process' }
    }
  ];

  return flows;
}

// Generate the full boot process graph showing all major components
export function generateBootProcessOverview() {
  const nodes = [
    // Command & Boot
    { id: 'cmd', name: 'rails server', type: 'command', group: 'entry', description: 'Shell command' },
    { id: 'bundler', name: 'Bundler', type: 'system', group: 'boot', description: 'Gem management' },
    { id: 'load-path', name: '$LOAD_PATH', type: 'system', group: 'boot', description: 'Load paths' },

    // Core Classes
    { id: 'railtie', name: 'Rails::Railtie', type: 'core', group: 'core', description: 'Extension framework' },
    { id: 'engine', name: 'Rails::Engine', type: 'core', group: 'core', description: 'Namespace isolation' },
    { id: 'application', name: 'Rails::Application', type: 'core', group: 'core', description: 'Main coordinator' },
    { id: 'initializable', name: 'Rails::Initializable', type: 'core', group: 'core', description: 'Initializer system' },

    // Railties
    { id: 'as-railtie', name: 'ActiveSupport::Railtie', type: 'railtie', group: 'railties', description: 'Core extensions' },
    { id: 'ar-railtie', name: 'ActiveRecord::Railtie', type: 'railtie', group: 'railties', description: 'ORM' },
    { id: 'ac-railtie', name: 'ActionController::Railtie', type: 'railtie', group: 'railties', description: 'Controllers' },
    { id: 'av-railtie', name: 'ActionView::Railtie', type: 'railtie', group: 'railties', description: 'Views' },

    // Phases
    { id: 'bootstrap', name: 'Bootstrap', type: 'phase', group: 'phases', description: 'Infrastructure setup' },
    { id: 'framework-init', name: 'Framework Init', type: 'phase', group: 'phases', description: 'Railtie initializers' },
    { id: 'app-init', name: 'App Init', type: 'phase', group: 'phases', description: 'Custom initializers' },
    { id: 'finisher', name: 'Finisher', type: 'phase', group: 'phases', description: 'Final setup' },

    // Output
    { id: 'middleware', name: 'Middleware Stack', type: 'output', group: 'output', description: 'Rack middleware' },
    { id: 'router', name: 'Router', type: 'output', group: 'output', description: 'Route dispatcher' },
    { id: 'autoloader', name: 'Zeitwerk', type: 'output', group: 'output', description: 'Autoloader' },
    { id: 'ready', name: 'App Ready', type: 'result', group: 'output', description: 'Accept requests' }
  ];

  const links = [
    // Boot flow
    { source: 'cmd', target: 'bundler', type: 'boot' },
    { source: 'bundler', target: 'load-path', type: 'configure' },
    { source: 'load-path', target: 'railtie', type: 'enables' },

    // Hierarchy
    { source: 'railtie', target: 'engine', type: 'extends' },
    { source: 'engine', target: 'application', type: 'extends' },
    { source: 'application', target: 'initializable', type: 'includes' },

    // Railtie registration
    { source: 'as-railtie', target: 'railtie', type: 'inherits' },
    { source: 'ar-railtie', target: 'railtie', type: 'inherits' },
    { source: 'ac-railtie', target: 'railtie', type: 'inherits' },
    { source: 'av-railtie', target: 'railtie', type: 'inherits' },

    // Initialization phases
    { source: 'application', target: 'bootstrap', type: 'runs' },
    { source: 'bootstrap', target: 'framework-init', type: 'then' },
    { source: 'framework-init', target: 'app-init', type: 'then' },
    { source: 'app-init', target: 'finisher', type: 'then' },

    // Output
    { source: 'finisher', target: 'middleware', type: 'builds' },
    { source: 'finisher', target: 'router', type: 'builds' },
    { source: 'finisher', target: 'autoloader', type: 'configures' },
    { source: 'middleware', target: 'ready', type: 'enables' },
    { source: 'router', target: 'ready', type: 'enables' },
    { source: 'autoloader', target: 'ready', type: 'enables' }
  ];

  return { nodes, links };
}
