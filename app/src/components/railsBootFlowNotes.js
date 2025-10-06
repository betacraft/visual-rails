// Rails Boot Process Flow Notes

export const railsBootFlowNotes = {
  'initial-boot': {
    title: 'Initial Boot & Bundler Setup',
    overview: 'The Rails boot process begins when you run `rails server`. The binstub executes config/boot.rb which sets up Bundler to activate all gems from the Gemfile.',
    keyPoints: [
      '**Binstub Execution**: bin/rails is a wrapper script that sets up the environment',
      '**Gemfile Location**: ENV[\'BUNDLE_GEMFILE\'] points to the Gemfile',
      '**Bundler.setup**: Activates gems and configures $LOAD_PATH',
      '**Load Path Ready**: All gem lib/ directories added to $LOAD_PATH',
      '**No Rails Yet**: At this point, Rails isn\'t loaded, just ready to be required'
    ],
    codeReferences: [
      {
        file: 'config/boot.rb',
        lines: '1-4',
        description: 'Bundler setup and Gemfile location'
      },
      {
        file: 'bin/rails',
        lines: '1-8',
        description: 'Rails binstub entry point'
      }
    ],
    timing: '~50-100ms',
    nextStep: 'Application class definition in config/application.rb'
  },

  'app-definition': {
    title: 'Application Class Definition',
    overview: 'config/application.rb requires Rails framework components and defines the application class. This triggers registration with Rails and runs before_configuration hooks.',
    keyPoints: [
      '**require \'rails/all\'**: Loads all Rails framework components (or individual requires)',
      '**Bundler.require**: Requires gems based on Rails.groups (e.g., :default, :development)',
      '**Class Definition**: MyApp::Application < Rails::Application triggers inheritance hooks',
      '**Rails.app_class**: Application is registered globally',
      '**Load Hooks**: :before_configuration hooks run immediately',
      '**Configuration**: config.load_defaults sets Rails version defaults'
    ],
    codeReferences: [
      {
        file: 'config/application.rb',
        lines: '1-20',
        description: 'Application class definition'
      },
      {
        file: 'railties/lib/rails/application.rb',
        lines: '71-78',
        description: 'Application.inherited hook registers app'
      }
    ],
    timing: '~100-200ms',
    nextStep: 'Railties register themselves with the framework'
  },

  'railtie-registration': {
    title: 'Railtie Registration',
    overview: 'When Rails components are required, each registers as a Railtie. Railties define initializers that will run during the initialize! phase.',
    keyPoints: [
      '**Rails::Railtie.subclasses**: Tracks all registered Railties',
      '**Each Component is a Railtie**: ActiveRecord, ActionController, ActionView, etc.',
      '**Initializers Defined**: Each Railtie defines initializer blocks',
      '**Not Yet Executed**: Initializers are defined but not run until initialize!',
      '**Dependency Order**: Initializers can specify :before and :after dependencies'
    ],
    codeReferences: [
      {
        file: 'railties/lib/rails/railtie.rb',
        lines: '9-30',
        description: 'Railtie system documentation'
      },
      {
        file: 'activerecord/lib/active_record/railtie.rb',
        lines: '1-50',
        description: 'Example: ActiveRecord::Railtie'
      }
    ],
    timing: '~50-100ms',
    nextStep: 'Rails.application.initialize! is called'
  },

  'initialize': {
    title: 'Initialize! - Main Initialization',
    overview: 'Rails.application.initialize! is the main entry point that orchestrates the entire initialization process. It collects all initializers, sorts them by dependencies, and executes them in order.',
    keyPoints: [
      '**Called from config/environment.rb**: Rails.application.initialize!',
      '**run_initializers**: Core method from Rails::Initializable',
      '**Collect Initializers**: Gathers from Bootstrap, all Railties, and Finisher',
      '**TSort Algorithm**: Topologically sorts by :before/:after dependencies',
      '**Execute in Order**: Each initializer runs sequentially',
      '**@initialized = true**: Marks application as fully initialized'
    ],
    codeReferences: [
      {
        file: 'config/environment.rb',
        lines: '1-5',
        description: 'Initialize! call'
      },
      {
        file: 'railties/lib/rails/initializable.rb',
        lines: '58-64',
        description: 'run_initializers implementation'
      },
      {
        file: 'railties/lib/rails/initializable.rb',
        lines: '45-56',
        description: 'TSort dependency ordering'
      }
    ],
    timing: '~500-1000ms total',
    nextStep: 'Bootstrap initializers run first'
  },

  'bootstrap': {
    title: 'Bootstrap Initializers',
    overview: 'Bootstrap initializers set up basic infrastructure needed by all other initializers: environment config, logger, cache, and reloading hooks.',
    keyPoints: [
      '**load_environment_hook**: Loads config/environments/#{Rails.env}.rb',
      '**initialize_logger**: Sets up Rails.logger (stdout or log file)',
      '**initialize_cache**: Configures Rails.cache (memory, Redis, etc.)',
      '**set_routes_reloader**: Sets up routes file watching (development)',
      '**set_clear_dependencies_hook**: Configures code reloading (development)',
      '**First to Run**: These run before all framework initializers'
    ],
    codeReferences: [
      {
        file: 'railties/lib/rails/application/bootstrap.rb',
        lines: '1-100',
        description: 'All bootstrap initializers'
      }
    ],
    timing: '~100-200ms',
    nextStep: 'Framework initializers run next'
  },

  'framework': {
    title: 'Framework Initializers',
    overview: 'Each Rails framework component (ActiveSupport, ActiveRecord, etc.) runs its initializers in dependency order. This configures the core framework.',
    keyPoints: [
      '**ActiveSupport First**: Core extensions, I18n, time zones',
      '**ActiveModel Next**: Validations, callbacks, serialization',
      '**ActiveRecord**: Database connection, migrations, query cache',
      '**ActionDispatch**: Request/Response, routing, middleware',
      '**ActionController**: Controller configuration, parameter filtering',
      '**ActionView**: Template lookup, helpers, rendering',
      '**Other Frameworks**: Mailer, Job, Cable, Storage, Mailbox, Text'
    ],
    codeReferences: [
      {
        file: 'activerecord/lib/active_record/railtie.rb',
        lines: '40-120',
        description: 'ActiveRecord initializers'
      },
      {
        file: 'actionpack/lib/action_controller/railtie.rb',
        lines: '1-100',
        description: 'ActionController initializers'
      }
    ],
    timing: '~200-400ms',
    nextStep: 'Application initializers from config/initializers/'
  },

  'app-initializers': {
    title: 'Application Initializers',
    overview: 'Custom initializers from config/initializers/ directory run after framework initializers. These are application-specific configurations.',
    keyPoints: [
      '**Alphabetical Order**: Files loaded alphabetically by name',
      '**config/initializers/*.rb**: All .rb files in this directory',
      '**Full Rails Available**: Framework is fully configured at this point',
      '**Common Initializers**: CORS, session store, assets, custom gems',
      '**Application Context**: Code runs in application context'
    ],
    codeReferences: [
      {
        file: 'config/initializers/',
        lines: 'various',
        description: 'Application-specific initializers'
      }
    ],
    timing: '~50-200ms (depends on app)',
    nextStep: 'Middleware stack construction'
  },

  'middleware': {
    title: 'Middleware Stack Construction',
    overview: 'The Rack middleware stack is built from default, framework, and application middleware. This creates the request processing pipeline.',
    keyPoints: [
      '**Collect from Multiple Sources**: Default + Railtie + Application middleware',
      '**Build in Order**: Top to bottom execution order',
      '**~25 Middleware**: Typical Rails app has ~20-30 middleware',
      '**Router at Bottom**: ActionDispatch::Routing::RouteSet is last',
      '**Wrapping Pattern**: Each middleware wraps the next',
      '**Customizable**: Can insert, delete, or replace middleware'
    ],
    codeReferences: [
      {
        file: 'railties/lib/rails/application/default_middleware_stack.rb',
        lines: '1-200',
        description: 'Default middleware stack'
      },
      {
        file: 'railties/lib/rails/application/finisher.rb',
        lines: '60-80',
        description: 'build_middleware_stack initializer'
      }
    ],
    timing: '~20-50ms',
    nextStep: 'Eager loading in production'
  },

  'eager-loading': {
    title: 'Eager Loading (Production)',
    overview: 'In production, config.eager_load = true causes all application code to be loaded into memory. This eliminates autoloading overhead during requests.',
    keyPoints: [
      '**Production Only**: config.eager_load = true in production.rb',
      '**Skip in Development**: Allows code reloading',
      '**Zeitwerk.eager_load_all**: Uses Zeitwerk to load all constants',
      '**All Paths Loaded**: app/models, app/controllers, app/jobs, etc.',
      '**Memory Increase**: ~200-500MB for typical app',
      '**Performance Gain**: No I/O during requests, thread-safe'
    ],
    codeReferences: [
      {
        file: 'config/environments/production.rb',
        lines: '10-15',
        description: 'eager_load = true'
      },
      {
        file: 'railties/lib/rails/engine.rb',
        lines: '500-520',
        description: 'eager_load! implementation'
      }
    ],
    timing: '~200-500ms (production only)',
    nextStep: 'Finalization and route loading'
  },

  'finalization': {
    title: 'Finalization & Routes',
    overview: 'Final initializers run, including to_prepare callbacks and route loading. The application is marked as initialized and ready to accept requests.',
    keyPoints: [
      '**to_prepare Callbacks**: Run before each request (dev) or once (prod)',
      '**after_initialize Callbacks**: Final setup hooks',
      '**Route Loading**: config/routes.rb evaluated',
      '**Journey::Router**: Routes compiled into matcher',
      '**Route Helpers**: Generated (users_path, new_user_path, etc.)',
      '**@initialized = true**: Application fully ready'
    ],
    codeReferences: [
      {
        file: 'railties/lib/rails/application/finisher.rb',
        lines: '1-150',
        description: 'Finisher initializers'
      },
      {
        file: 'config/routes.rb',
        lines: '1-50',
        description: 'Application routes'
      }
    ],
    timing: '~100-200ms',
    nextStep: 'Server starts and accepts requests'
  },

  'server-start': {
    title: 'Server Start & First Request',
    overview: 'Web server (Puma, Unicorn) starts, listens on port, and handles the first HTTP request through the middleware stack to a controller action.',
    keyPoints: [
      '**Web Server Starts**: Puma, Unicorn, or Passenger',
      '**Listen on Port**: Default :3000, configurable',
      '**Server Ready**: Logs "Listening on http://..."',
      '**First Request**: Enters through Rack interface',
      '**Middleware Stack**: Processes request top to bottom',
      '**Router Dispatch**: Matches route and calls controller',
      '**Response**: Returns Rack triplet [status, headers, body]'
    ],
    codeReferences: [
      {
        file: 'config/puma.rb',
        lines: '1-50',
        description: 'Puma server configuration'
      }
    ],
    timing: '~50-100ms server start + request time',
    nextStep: 'Application handles requests (see HTTP Request Flow)'
  },

  'boot-timeline': {
    title: 'Complete Boot Timeline',
    overview: 'The complete Rails boot process from command to server ready. Total time is ~2-3 seconds in development, ~3-5 seconds in production (due to eager loading).',
    keyPoints: [
      '**1. Boot & Bundler**: ~100ms - Gem activation',
      '**2. App Definition**: ~200ms - Application class creation',
      '**3. Railtie Registration**: ~100ms - Framework components register',
      '**4. Initialize!**: ~100ms - Start initialization',
      '**5. Bootstrap**: ~200ms - Infrastructure setup',
      '**6. Framework Init**: ~400ms - Framework configuration',
      '**7. App Init**: ~200ms - Custom initializers',
      '**8. Middleware**: ~50ms - Stack construction',
      '**9. Eager Load**: ~500ms (prod) - Load all code',
      '**10. Finalization**: ~200ms - Routes and cleanup',
      '**11. Server Start**: ~100ms - Web server ready',
      '**Total**: ~2-3s dev, ~3-5s production'
    ],
    codeReferences: [
      {
        file: 'railties/lib/rails/application.rb',
        lines: '45-61',
        description: 'Boot process documentation'
      }
    ],
    timing: '~2-3 seconds total',
    nextStep: 'Ready to handle HTTP requests'
  }
};

export const railsBootProcessComponents = {
  'Rails::Railtie': {
    location: 'railties/lib/rails/railtie.rb',
    description: 'Core of Rails extension framework',
    purpose: 'Provides hooks for framework initialization',
    keyMethods: ['initializer', 'config', 'rake_tasks', 'generators'],
    documentation: 'Lines 10-30 explain the Railtie system'
  },

  'Rails::Engine': {
    location: 'railties/lib/rails/engine.rb',
    description: 'Railtie with namespace isolation',
    purpose: 'Provides routes, middleware, and autoload paths',
    keyMethods: ['routes', 'middleware', 'eager_load!'],
    documentation: 'Base class for Rails::Application'
  },

  'Rails::Application': {
    location: 'railties/lib/rails/application.rb:62',
    description: 'Main application coordinator',
    purpose: 'Orchestrates entire boot process',
    keyMethods: ['initialize!', 'run_initializers', 'eager_load!'],
    documentation: 'Lines 45-61 describe boot sequence'
  },

  'Rails::Initializable': {
    location: 'railties/lib/rails/initializable.rb',
    description: 'Initializer ordering system',
    purpose: 'Manages initializer dependencies with TSort',
    keyMethods: ['run_initializers', 'initializers_chain', 'tsort'],
    documentation: 'Lines 45-56 show TSort implementation'
  },

  'Rails::Application::Bootstrap': {
    location: 'railties/lib/rails/application/bootstrap.rb',
    description: 'Early infrastructure initializers',
    purpose: 'Sets up logger, cache, environment',
    keyMethods: ['load_environment_hook', 'initialize_logger', 'initialize_cache'],
    documentation: 'First initializers to run'
  },

  'Rails::Application::Finisher': {
    location: 'railties/lib/rails/application/finisher.rb',
    description: 'Final initialization steps',
    purpose: 'Middleware, routes, eager loading',
    keyMethods: ['build_middleware_stack', 'add_builtin_route', 'finisher_hook'],
    documentation: 'Last initializers to run'
  },

  'Zeitwerk': {
    location: 'railties/lib/rails/autoloaders.rb',
    description: 'Modern autoloader for Rails 8',
    purpose: 'Thread-safe code loading and reloading',
    keyMethods: ['eager_load_all', 'setup', 'reload'],
    documentation: 'Replaces classic autoloader'
  },

  'Rack': {
    location: 'External gem',
    description: 'Web server interface',
    purpose: 'Standard interface for Ruby web apps',
    keyMethods: ['call(env)'],
    documentation: 'Returns [status, headers, body]'
  }
};
