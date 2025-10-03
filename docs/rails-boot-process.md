# Rails Boot Process Documentation

## Overview
This document describes the complete Rails 8.0 boot sequence, from running `rails server` to the application being ready to handle requests. Understanding this process is crucial for debugging startup issues, optimizing boot time, and creating custom initializers.

## The Boot Journey

The Rails boot process is orchestrated by **Railties**, the core engine that coordinates all framework components. When you start a Rails application, a carefully choreographed sequence of events ensures all components are loaded, configured, and initialized in the correct order.

```
rails server
  ↓
config/boot.rb → Bundler setup
  ↓
config/application.rb → Rails application class
  ↓
config/environment.rb → Initialize!
  ↓
Initializers run (ordered)
  ↓
Middleware stack built
  ↓
Application ready → Accept requests
```

## Core Components

### 1. Rails::Railtie
**Location:** `railties/lib/rails/railtie.rb`

The foundation of Rails' extension system. Every major Rails component (ActiveRecord, ActionPack, etc.) is a Railtie.

**Purpose:**
- Provides hooks for framework initialization
- Allows components to register initializers
- Enables configuration of Rails framework
- Makes Rails modular and extensible

**Key Methods:**
- `initializer` - Register initialization code
- `config` - Access configuration object
- `rake_tasks` - Register Rake tasks
- `generators` - Register generators

**Example:**
```ruby
module ActiveRecord
  class Railtie < Rails::Railtie
    initializer "active_record.initialize_database" do
      ActiveRecord::Base.establish_connection
    end

    config.app_generators.orm :active_record
  end
end
```

---

### 2. Rails::Engine
**Location:** `railties/lib/rails/engine.rb`

A Railtie with isolated namespace for routes, middleware, and code.

**Purpose:**
- Provides namespace isolation
- Manages routes and middleware
- Handles autoloading paths
- Base class for Rails::Application

**Key Features:**
- Isolated routes: `MyEngine::Engine.routes.draw { ... }`
- Own middleware stack
- Separate autoload paths
- Can be mounted in applications

---

### 3. Rails::Application
**Location:** `railties/lib/rails/application.rb:62`

The main application class that inherits from Rails::Engine and coordinates the entire boot process.

**Purpose:**
- Orchestrates all Railtie initializers
- Executes bootstrap initializers
- Manages the middleware stack
- Controls the reload/executor system
- Holds the application configuration

**Boot Sequence (from Rails::Application docs, lines 45-61):**
```
1. require "config/boot.rb" to set up load paths
2. require railties and engines
3. Define Rails.application as class MyApp::Application < Rails::Application
4. Run config.before_configuration callbacks
5. Load config/environments/ENV.rb
6. Run config.before_initialize callbacks
7. Run Railtie#initializer defined by railties, engines, and application
8. Custom Railtie#initializers added by railties, engines, and applications
9. Build the middleware stack and run to_prepare callbacks
10. Run config.before_eager_load and eager_load! if eager_load is true
11. Run config.after_initialize callbacks
```

**Key Instance Variables:**
- `@initialized` - Boot completion flag
- `@executor` - ActiveSupport::Executor for request wrapping
- `@reloader` - ActiveSupport::Reloader for code reloading
- `@autoloaders` - Zeitwerk autoloaders
- `@ordered_railties` - Sorted list of all railties

---

### 4. Rails::Initializable
**Location:** `railties/lib/rails/initializable.rb`

The system that manages initializer ordering using topological sort (TSort).

**Purpose:**
- Orders initializers based on dependencies
- Supports :before and :after options
- Ensures correct initialization sequence
- Prevents circular dependencies

**How It Works:**
```ruby
# Initializers form a dependency graph
initializer "load_config", before: "build_middleware" do
  # Configuration loading
end

initializer "build_middleware", after: "load_config" do
  # Middleware stack construction
end

# TSort algorithm determines execution order
```

**Collection Class (lines 45-56):**
```ruby
class Collection < Array
  include TSort

  def tsort_each_child(initializer, &block)
    select { |i|
      i.before == initializer.name ||
      i.name == initializer.after
    }.each(&block)
  end
end
```

---

### 5. Rails::Application::Bootstrap
**Location:** `railties/lib/rails/application/bootstrap.rb`

Contains early-stage initializers that run before framework initializers.

**Key Bootstrap Initializers:**
- `load_environment_hook` - Load environment configuration
- `load_active_support` - Initialize ActiveSupport
- `initialize_logger` - Set up Rails logger
- `initialize_cache` - Set up Rails.cache
- `set_routes_reloader` - Configure routes reloading

---

### 6. Rails::Application::Finisher
**Location:** `railties/lib/rails/application/finisher.rb`

Contains finalizer initializers that run after all other initializers.

**Key Finisher Initializers:**
- `add_generator_templates` - Register generator templates
- `ensure_autoload_once_paths_as_subset` - Validate autoload paths
- `add_builtin_route` - Add Rails info routes in development
- `build_middleware_stack` - Construct Rack middleware
- `eager_load!` - Load all application code (production)
- `finisher_hook` - Run after_initialize callbacks

---

### 7. Rack
**Location:** Rack gem

The Ruby web server interface that Rails builds upon.

**Purpose:**
- Provides standard interface between web servers and applications
- Middleware system for request/response processing
- Simple contract: `call(env)` returns `[status, headers, body]`

**Rails Integration:**
```ruby
# Rails application implements Rack interface
class MyApp::Application < Rails::Application
  def call(env)
    # Middleware stack processes request
    # Router dispatches to controller
    # Controller returns response
    [status, headers, body]
  end
end
```

---

### 8. Zeitwerk (Autoloader)
**Location:** `railties/lib/rails/autoloaders.rb`

Rails 8.0 uses Zeitwerk for autoloading, replacing the classic autoloader.

**Purpose:**
- Thread-safe code loading
- Eager loading for production
- Reloading in development
- Follows naming conventions

**Configuration:**
```ruby
# config/application.rb
config.autoload_paths += %W(#{config.root}/app/services)
config.eager_load_paths += %W(#{config.root}/app/validators)

# Rails::Autoloaders manages main and once loaders
Rails.autoloaders.main  # Reloadable code
Rails.autoloaders.once  # Non-reloadable code
```

---

## Boot Process Flows

### Flow 1: Initial Boot & Bundler Setup

**Command:** `rails server` or `bin/rails server`

**Flow:**
```
Shell Command
  ↓
bin/rails (binstub)
  ↓
require 'config/boot.rb'
  ↓
ENV['BUNDLE_GEMFILE'] = File.expand_path('../Gemfile', __dir__)
  ↓
require 'bundler/setup'
  ↓
Bundler.setup(:default, Rails.env)
  ↓
$LOAD_PATH configured with all gem paths
  ↓
Ready to require Rails
```

**File: config/boot.rb**
```ruby
# Set Gemfile location
ENV['BUNDLE_GEMFILE'] ||= File.expand_path('../Gemfile', __dir__)

# Set up gems listed in the Gemfile
require 'bundler/setup' if File.exist?(ENV['BUNDLE_GEMFILE'])
```

**What Happens:**
1. **Binstub Execution**: `bin/rails` sets up the environment
2. **Gemfile Location**: Environment variable points to Gemfile
3. **Bundler Setup**: Activates all gems from Gemfile
4. **Load Path**: $LOAD_PATH includes all gem lib directories
5. **Gem Availability**: All gems ready to be required

**Key Files Referenced:**
- `bin/rails` - Binstub that starts the process
- `config/boot.rb` - Bundler initialization
- `Gemfile` - Gem dependencies
- `Gemfile.lock` - Locked gem versions

---

### Flow 2: Application Class Definition

**File: config/application.rb**

**Flow:**
```
config/application.rb
  ↓
require_relative 'boot'
  ↓
require 'rails/all'  # or individual requires
  ↓
Bundler.require(*Rails.groups)
  ↓
module MyApp
  class Application < Rails::Application
    # Application is defined
  end
end
  ↓
Rails.app_class = MyApp::Application
  ↓
ActiveSupport.run_load_hooks(:before_configuration, MyApp::Application)
```

**Code Analysis:**
```ruby
# config/application.rb
require_relative 'boot'

# Load all Rails components or specific ones
require 'rails/all'
# Equivalent to:
# require 'active_record/railtie'
# require 'action_controller/railtie'
# require 'action_view/railtie'
# require 'action_mailer/railtie'
# ... etc

# Require gems for current environment
Bundler.require(*Rails.groups)
# Rails.groups returns [:default, :development] in dev
# This requires all gems in those groups from Gemfile

module MyApp
  class Application < Rails::Application
    # Inheriting from Rails::Application triggers:
    # 1. Rails.app_class = MyApp::Application (railtie.rb:62)
    # 2. Add lib/ to load path (application.rb:76)
    # 3. Run :before_configuration hooks (application.rb:77)

    config.load_defaults 8.0
    # ... more configuration
  end
end
```

**What Happens:**
1. **Boot Required**: Ensures Bundler is set up
2. **Rails Loaded**: All framework components loaded as Railties
3. **Gems Required**: Application gems loaded by group
4. **Application Defined**: Application class created
5. **Hooks Run**: Before configuration callbacks executed

**Load Hooks Triggered:**
- `:before_configuration` - Run before any configuration

---

### Flow 3: Railtie Registration

**How Railties Register:**

**Flow:**
```
require 'rails/all'
  ↓
require 'active_record/railtie'
  ↓
module ActiveRecord
  class Railtie < Rails::Railtie
    # Class loaded
  end
end
  ↓
Rails::Railtie.subclasses tracks all Railties
  ↓
Each Railtie defines initializers
  ↓
Initializers stored in @initializers array
```

**Example: ActiveRecord::Railtie**
```ruby
# activerecord/lib/active_record/railtie.rb
module ActiveRecord
  class Railtie < Rails::Railtie

    # Configuration
    config.app_generators.orm :active_record,
      migration: true,
      timestamps: true

    # Early initializer
    initializer "active_record.initialize_timezone" do
      ActiveRecord.default_timezone = :utc
    end

    # Database connection initializer
    initializer "active_record.initialize_database" do
      ActiveSupport.on_load(:active_record) do
        establish_connection
      end
    end

    # Logger setup
    initializer "active_record.logger" do
      ActiveSupport.on_load(:active_record) do
        self.logger ||= Rails.logger
      end
    end

    # Migration paths
    initializer "active_record.set_configs" do |app|
      ActiveSupport.on_load(:active_record) do
        app.config.paths.add "db/migrate",
          with: app.config.paths["db/migrate"].to_a
      end
    end
  end
end
```

**All Rails Railties:**
1. `ActiveSupport::Railtie` - Core extensions
2. `ActiveModel::Railtie` - Model abstractions
3. `ActiveRecord::Railtie` - ORM
4. `ActionDispatch::Railtie` - HTTP abstractions
5. `ActionController::Railtie` - Controller layer
6. `ActionView::Railtie` - View rendering
7. `ActionMailer::Railtie` - Email delivery
8. `ActiveJob::Railtie` - Background jobs
9. `ActionCable::Railtie` - WebSockets
10. `ActiveStorage::Railtie` - File uploads
11. `ActionMailbox::Railtie` - Inbound email
12. `ActionText::Railtie` - Rich text

---

### Flow 4: Initialize! - The Main Event

**File: config/environment.rb**

**Flow:**
```
config/environment.rb
  ↓
require_relative 'application'
  ↓
Rails.application.initialize!
  ↓
run_initializers (from Rails::Initializable)
  ↓
Collect all initializers from:
  - Bootstrap initializers
  - Railtie initializers (all gems)
  - Application initializers
  - Finisher initializers
  ↓
Sort with TSort (dependency order)
  ↓
Execute each initializer
  ↓
Application @initialized = true
```

**Code:**
```ruby
# config/environment.rb
require_relative 'application'

# Initialize the Rails application
Rails.application.initialize!
```

**Rails::Application#initialize! (simplified):**
```ruby
# railties/lib/rails/application.rb
def initialize!(group = :default)
  raise "Already initialized" if @initialized

  # Run all initializers in dependency order
  run_initializers(group)

  @initialized = true
  self
end
```

**Initializer Collection (from Rails::Initializable):**
```ruby
def initializers_chain
  initializers = Collection.new

  # Collect from all ancestors
  ancestors.reverse_each do |klass|
    next unless klass.respond_to?(:initializers)
    initializers = initializers + klass.initializers
  end

  initializers
end

# Result: Merged list from:
# - Rails::Application::Bootstrap
# - Rails::Application (custom initializers)
# - ActiveRecord::Railtie
# - ActionController::Railtie
# - ... all other Railties
# - Rails::Application::Finisher
```

---

### Flow 5: Bootstrap Initializers

**First initializers to run, set up basic infrastructure.**

**Flow:**
```
initialize!
  ↓
Bootstrap Initializers (in order):
  ↓
1. load_environment_hook
   └─> Load config/environments/#{Rails.env}.rb
  ↓
2. load_active_support
   └─> Require and configure ActiveSupport
  ↓
3. initialize_logger
   └─> Set up Rails.logger (stdout or log file)
  ↓
4. initialize_cache
   └─> Set up Rails.cache
  ↓
5. set_routes_reloader_hook
   └─> Configure routes reloading
  ↓
6. set_clear_dependencies_hook
   └─> Set up code reloading (development)
  ↓
Ready for framework initializers
```

**Key Bootstrap Initializers:**

**1. load_environment_hook**
```ruby
# railties/lib/rails/application/bootstrap.rb
initializer :load_environment_hook, group: :all do
  ActiveSupport.run_load_hooks(:load_environment, self)
end

# Then loads:
# config/environments/development.rb
# config/environments/test.rb
# config/environments/production.rb (depending on Rails.env)
```

**2. initialize_logger**
```ruby
initializer :initialize_logger, group: :all do
  Rails.logger ||= ActiveSupport::Logger.new(STDOUT)
  Rails.logger.level = config.log_level

  # In production, might be:
  # Rails.logger = ActiveSupport::Logger.new("log/production.log")
end
```

**3. initialize_cache**
```ruby
initializer :initialize_cache, group: :all do
  unless Rails.cache
    Rails.cache = ActiveSupport::Cache.lookup_store(config.cache_store)
    # Examples:
    # :memory_store - In-process memory cache
    # :redis_cache_store - Redis backing
    # :mem_cache_store - Memcached
  end
end
```

**4. set_routes_reloader**
```ruby
initializer :set_routes_reloader, group: :all do
  reloader = routes_reloader

  # Watch for route file changes (development)
  reloader.before_class_unload do
    # Clear routes
  end

  reloader.after_class_unload do
    # Reload routes
  end

  @routes_reloader = reloader
end
```

---

### Flow 6: Framework Initializers

**Each Railtie runs its initializers in dependency order.**

**Flow:**
```
Bootstrap complete
  ↓
Framework Initializers (dependency ordered):
  ↓
ActiveSupport Initializers
  └─> Core extensions loaded
  └─> Time zones configured
  └─> I18n setup
  ↓
ActiveModel Initializers
  └─> Validations available
  └─> Callbacks system ready
  ↓
ActiveRecord Initializers
  └─> Database connection established
  └─> Migration paths set
  └─> Query cache configured
  ↓
ActionDispatch Initializers
  └─> Request/Response setup
  └─> Routing system ready
  ↓
ActionController Initializers
  └─> Controller base configured
  └─> Parameter filtering set up
  ↓
ActionView Initializers
  └─> Template lookup paths
  └─> Helpers loaded
  ↓
... other framework initializers
  ↓
Ready for application initializers
```

**Example Execution Order:**
```ruby
# Simplified initializer dependency chain

# 1. Early ActiveSupport
"active_support.initialize_time_zone"
  ↓
"active_support.initialize_beginning_of_week"
  ↓
"active_support.set_configs"

# 2. ActiveRecord depends on ActiveSupport
"active_record.initialize_timezone"
  ↓
"active_record.logger"
  ↓
"active_record.set_configs"
  ↓
"active_record.initialize_database"

# 3. ActionPack components
"action_dispatch.configure"
  ↓
"action_controller.set_configs"
  ↓
"action_controller.compile_config_methods"

# 4. View layer
"action_view.set_configs"
  ↓
"action_view.setup_template_handler"
```

**Detailed Example: ActiveRecord Database Initializer**
```ruby
# activerecord/lib/active_record/railtie.rb
initializer "active_record.initialize_database" do
  ActiveSupport.on_load(:active_record) do
    # Establish database connection
    establish_connection

    # Configure connection pool
    # Based on config/database.yml
    #
    # development:
    #   adapter: postgresql
    #   pool: 5
    #   timeout: 5000
  end
end
```

---

### Flow 7: Application Initializers

**Custom initializers from config/initializers/**

**Flow:**
```
Framework initializers complete
  ↓
Load application initializers:
  ↓
config/initializers/ (alphabetical order)
  ├─> assets.rb
  ├─> cors.rb
  ├─> filter_parameter_logging.rb
  ├─> inflections.rb
  ├─> session_store.rb
  └─> [custom initializers]
  ↓
Each file executed in application context
  ↓
Ready for finisher initializers
```

**Example Application Initializers:**

**config/initializers/cors.rb**
```ruby
# CORS configuration initializer
Rails.application.config.middleware.insert_before 0, Rack::Cors do
  allow do
    origins '*'
    resource '*',
      headers: :any,
      methods: [:get, :post, :put, :patch, :delete]
  end
end
```

**config/initializers/custom_logger.rb**
```ruby
# Custom logging setup
Rails.application.configure do
  config.logger = ActiveSupport::Logger.new(STDOUT)
  config.logger.formatter = proc { |severity, datetime, progname, msg|
    "[#{datetime}] #{severity}: #{msg}\n"
  end
end
```

**config/initializers/sidekiq.rb**
```ruby
# Background job configuration
Sidekiq.configure_server do |config|
  config.redis = { url: ENV['REDIS_URL'] }
end

Sidekiq.configure_client do |config|
  config.redis = { url: ENV['REDIS_URL'] }
end
```

**Timing:**
- Loaded after framework initializers
- Before finisher initializers
- Loaded alphabetically by filename
- Can access fully configured Rails.application

---

### Flow 8: Middleware Stack Construction

**The Rack middleware stack is built and finalized.**

**Flow:**
```
Application initializers complete
  ↓
Build middleware stack:
  ↓
Finisher initializer "build_middleware_stack"
  ↓
Collect middleware from:
  - Default middleware (Rails::Application::DefaultMiddlewareStack)
  - Railtie middleware
  - Application middleware
  ↓
Build in order:
  [top]
  ActionDispatch::HostAuthorization
  Rack::Sendfile
  ActionDispatch::Static
  ActionDispatch::Executor
  ActionDispatch::ServerTiming
  ActiveSupport::Cache::Strategy::LocalCache::Middleware
  Rack::Runtime
  Rack::MethodOverride
  ActionDispatch::RequestId
  ActionDispatch::RemoteIp
  Rails::Rack::Logger
  ActionDispatch::ShowExceptions
  ActionDispatch::DebugExceptions
  ActionDispatch::ActionableExceptions
  ActionDispatch::Reloader
  ActionDispatch::Callbacks
  ActiveRecord::Migration::CheckPending
  ActionDispatch::Cookies
  ActionDispatch::Session::CookieStore
  ActionDispatch::Flash
  ActionDispatch::ContentSecurityPolicy::Middleware
  ActionDispatch::PermissionsPolicy::Middleware
  Rack::Head
  Rack::ConditionalGet
  Rack::ETag
  Rack::TempfileReaper
  [Application Router]
  [bottom]
  ↓
Stack ready to process requests
```

**Default Middleware Stack:**
```ruby
# railties/lib/rails/application/default_middleware_stack.rb
def build_stack
  ActionDispatch::MiddlewareStack.new do |middleware|
    # Security
    middleware.use config.session_store, config.session_options
    middleware.use ActionDispatch::ContentSecurityPolicy::Middleware

    # Request processing
    middleware.use ActionDispatch::Executor, executor
    middleware.use ActionDispatch::ServerTiming
    middleware.use Rack::Runtime

    # Development helpers
    if Rails.env.development?
      middleware.use ActionDispatch::ActionableExceptions
    end

    # Caching
    middleware.use ActiveSupport::Cache::Strategy::LocalCache::Middleware

    # Static files
    if config.public_file_server.enabled
      middleware.use ActionDispatch::Static,
        paths["public"].first,
        config.public_file_server.to_h
    end

    # ... more middleware
  end
end
```

**Custom Middleware:**
```ruby
# config/application.rb
class Application < Rails::Application
  # Add custom middleware
  config.middleware.use MyCustomMiddleware

  # Insert before specific middleware
  config.middleware.insert_before ActionDispatch::Static, MyEarlyMiddleware

  # Insert after
  config.middleware.insert_after Rails::Rack::Logger, MyLoggerMiddleware

  # Remove middleware
  config.middleware.delete Rack::ETag
end
```

**Middleware Execution:**
```ruby
# Each middleware wraps the next
def call(env)
  # Before processing
  setup_stuff

  # Call next middleware
  status, headers, body = @app.call(env)

  # After processing
  cleanup_stuff

  [status, headers, body]
end
```

---

### Flow 9: to_prepare Callbacks

**Callbacks that run before each request in development, once in production.**

**Flow:**
```
Middleware stack built
  ↓
Execute to_prepare callbacks:
  ↓
config.to_prepare blocks run
  ↓
Used for:
  - Reloader setup
  - Per-request initialization
  - Development mode hooks
  ↓
Callbacks registered by:
  - Application (config/application.rb)
  - Engines
  - Railties
  ↓
Executed by ActionDispatch::Reloader middleware
```

**Usage:**
```ruby
# config/application.rb
config.to_prepare do
  # This runs:
  # - Once on boot in production/test
  # - Before each request in development

  # Common uses:
  # - Set up decorators
  # - Configure view helpers
  # - Initialize request-specific state
end
```

**Example: Application-wide setup**
```ruby
config.to_prepare do
  # Make helpers available everywhere
  ApplicationController.helper_method :current_user

  # Configure ActiveStorage
  ActiveStorage::Current.host = "https://example.com"

  # Set up decorators (Draper, etc.)
  Draper::ViewContext.current = ActionController::Base.new.view_context
end
```

**Development vs Production:**
```ruby
# In development: Before each request
# ActionDispatch::Reloader runs to_prepare blocks
# Allows code changes to be picked up

# In production: Once on boot
# Code doesn't reload
# to_prepare runs once during initialization
```

---

### Flow 10: Eager Loading (Production)

**In production, all application code is loaded into memory.**

**Flow:**
```
to_prepare callbacks complete
  ↓
Check config.eager_load (true in production)
  ↓
Run config.before_eager_load callbacks
  ↓
Rails::Engine.eager_load!
  ↓
For each eager_load_path:
  app/assets
  app/channels
  app/controllers
  app/helpers
  app/jobs
  app/mailers
  app/models
  app/policies
  app/services
  app/validators
  ↓
Zeitwerk.eager_load_all
  ↓
All constants loaded
  ↓
No autoloading needed during requests
```

**Configuration:**
```ruby
# config/environments/production.rb
config.eager_load = true  # Load all code on boot

# config/environments/development.rb
config.eager_load = false  # Autoload on demand

# config/environments/test.rb
config.eager_load = false  # Load only what's needed
```

**Eager Load Process:**
```ruby
# railties/lib/rails/engine.rb
def eager_load!
  # For each eager_load_path
  config.eager_load_paths.each do |path|
    # Use Zeitwerk to load all files
    Rails.autoloaders.main.eager_load_dir(path)
  end

  # This loads ALL constants
  # User, Post, ApplicationController, etc.
  # All loaded into memory
end
```

**Benefits in Production:**
- **No Autoload Delays**: All code pre-loaded
- **Thread Safety**: No concurrent autoloading
- **Memory Efficiency**: Code shared across processes
- **Performance**: No I/O for code loading during requests

**Memory Usage:**
```ruby
# Before eager load: ~50-100 MB
# After eager load: ~200-500 MB (depends on app size)
# But: Code shared across all worker processes (via fork)
```

---

### Flow 11: Finisher Initializers & After Initialize

**Final initialization steps and application callbacks.**

**Flow:**
```
Eager loading complete (if enabled)
  ↓
Finisher Initializers:
  ↓
1. add_generator_templates
   └─> Register custom generators
  ↓
2. ensure_autoload_once_paths_as_subset
   └─> Validate autoload configuration
  ↓
3. add_builtin_route (development only)
   └─> Add /rails/info routes
  ↓
4. build_middleware_stack
   └─> Finalize middleware (already covered)
  ↓
5. define_main_app_helper
   └─> Set up main_app route helper
  ↓
6. add_to_prepare_blocks
   └─> Register to_prepare callbacks
  ↓
7. run_prepare_callbacks
   └─> Execute to_prepare blocks
  ↓
Run config.after_initialize callbacks
  ↓
Application @initialized = true
  ↓
Ready to accept requests!
```

**config.after_initialize Usage:**
```ruby
# config/application.rb
config.after_initialize do
  # Runs after ALL initialization complete
  # Application fully configured and ready

  # Common uses:
  # - Connect to external services
  # - Start background workers
  # - Final configuration
  # - Sanity checks
end
```

**Example After Initialize:**
```ruby
# config/application.rb
config.after_initialize do
  # Connect to Redis
  $redis = Redis.new(url: ENV['REDIS_URL'])

  # Start Sidekiq (if not in rake task)
  unless defined?(Rake)
    Sidekiq.configure_server do |config|
      config.redis = { url: ENV['REDIS_URL'] }
    end
  end

  # Warm up caches
  Rails.cache.write('app_boot_time', Time.current)

  # Log boot completion
  Rails.logger.info "Application initialized in #{Rails.env} mode"
end
```

**Finisher: add_builtin_route (Development)**
```ruby
# railties/lib/rails/application/finisher.rb
initializer :add_builtin_route do |app|
  if Rails.env.development?
    app.routes.prepend do
      get '/rails/info/properties', to: "rails/info#properties"
      get '/rails/info/routes', to: "rails/info#routes"
      get '/rails/info', to: "rails/info#index"
    end
  end
end

# Available routes:
# http://localhost:3000/rails/info
# http://localhost:3000/rails/info/routes
```

---

### Flow 12: Routes Loading

**Routes are loaded and compiled for request dispatching.**

**Flow:**
```
Application initialization complete
  ↓
Routes loading (during first request or boot):
  ↓
config/routes.rb evaluation
  ↓
Rails.application.routes.draw do
  # Route definitions
end
  ↓
ActionDispatch::Routing::RouteSet builds:
  ↓
Journey::Router (route matching)
  ↓
Route definitions parsed:
  - GET /users → UsersController#index
  - POST /users → UsersController#create
  - etc.
  ↓
Compiled into:
  - Path patterns (Journey::Path::Pattern)
  - Constraints
  - Defaults
  - Controller/Action mapping
  ↓
Route helpers generated:
  - users_path
  - new_user_path
  - edit_user_path(@user)
  ↓
Routes ready for dispatch
```

**Routes File:**
```ruby
# config/routes.rb
Rails.application.routes.draw do
  # Root route
  root 'home#index'

  # RESTful resources
  resources :users do
    resources :posts
    member do
      post :follow
    end
  end

  # Custom routes
  get '/dashboard', to: 'dashboard#show'
  post '/api/webhooks', to: 'webhooks#create'

  # Namespace
  namespace :admin do
    resources :users
    resources :reports
  end

  # Constraints
  constraints subdomain: 'api' do
    namespace :api, path: '/' do
      resources :posts
    end
  end
end
```

**Route Compilation:**
```ruby
# Internal Journey route structure
route = Journey::Route.new(
  path: Journey::Path::Pattern.new("/users/:id"),
  verb: "GET",
  defaults: { controller: "users", action: "show" },
  constraints: { id: /\d+/ }
)

# Generates helper:
def user_path(user)
  "/users/#{user.to_param}"
end
```

**Route Reloading (Development):**
```ruby
# ActionDispatch::Reloader watches config/routes.rb
# On file change:
# 1. Clear existing routes
# 2. Reload config/routes.rb
# 3. Rebuild route helpers
# 4. No server restart needed
```

---

### Flow 13: Server Start & Request Handling

**Final step: Server ready to accept HTTP requests.**

**Flow:**
```
Routes loaded
  ↓
Start web server:
  ↓
Puma/Unicorn/Passenger starts
  ↓
Listen on port (default 3000)
  ↓
Application ready!
  ↓
First request arrives:
  ↓
TCP connection → Web Server
  ↓
Web Server → Rack Application
  ↓
env = {
  "REQUEST_METHOD" => "GET",
  "PATH_INFO" => "/users",
  ...
}
  ↓
Rails.application.call(env)
  ↓
Middleware Stack (top to bottom):
  ActionDispatch::HostAuthorization
  ↓
  ActionDispatch::Static
  ↓
  ActionDispatch::Executor (wraps request)
  ↓
  Rails::Rack::Logger (log request)
  ↓
  ActionDispatch::ShowExceptions (error handling)
  ↓
  ActionDispatch::Reloader (code reload in dev)
  ↓
  ActionDispatch::Callbacks (before/after)
  ↓
  ActionDispatch::Cookies
  ↓
  ActionDispatch::Session::CookieStore
  ↓
  ActionDispatch::Flash
  ↓
  Rack::Head (handle HEAD requests)
  ↓
  Rack::ConditionalGet (304 responses)
  ↓
  ActionDispatch::Routing::RouteSet (router)
  ↓
Match route → Dispatch to controller
  ↓
UsersController#index
  ↓
Render view
  ↓
[200, { "Content-Type" => "text/html" }, [html]]
  ↓
Response goes back through middleware (bottom to top)
  ↓
Web Server → TCP socket
  ↓
Browser receives response
```

**Server Configuration:**
```ruby
# config/puma.rb
max_threads_count = ENV.fetch("RAILS_MAX_THREADS") { 5 }
min_threads_count = ENV.fetch("RAILS_MIN_THREADS") { max_threads_count }
threads min_threads_count, max_threads_count

worker_timeout 3600 if ENV.fetch("RAILS_ENV", "development") == "development"

port ENV.fetch("PORT") { 3000 }
environment ENV.fetch("RAILS_ENV") { "development" }

# Production: Multiple worker processes
workers ENV.fetch("WEB_CONCURRENCY") { 2 }

# Preload application for copy-on-write memory savings
preload_app!

on_worker_boot do
  # Reconnect to database
  ActiveRecord::Base.establish_connection
end
```

**Application Ready Indicators:**
```ruby
# Server logs show:
#
# * Puma version: 6.0.0 (ruby 3.2.0) ("Sunflower")
# * Min threads: 5, max threads: 5
# * Environment: development
# * Listening on http://127.0.0.1:3000
# * Use Ctrl-C to stop
#
# Application ready to accept requests!
```

---

## Boot Time Optimization

### Measuring Boot Time
```ruby
# See detailed timing
rails runner 'puts Benchmark.measure { Rails.application.initialize! }'

# Or use bootsnap gem (included by default)
# Caches expensive computations
```

### Common Optimizations

**1. Use Bootsnap (Default in Rails 8)**
```ruby
# config/boot.rb
require 'bootsnap/setup'  # Already included

# Caches:
# - YAML parsing
# - Ruby bytecode compilation
# - Autoload path resolution
```

**2. Reduce Eager Load Paths**
```ruby
# config/application.rb
config.eager_load_paths.delete("#{config.root}/app/assets")
config.eager_load_paths.delete("#{config.root}/app/views")
```

**3. Minimize Initializers**
```ruby
# Move slow initializers to after_initialize
# Or make them conditional on environment
config.after_initialize do
  next unless Rails.env.production?
  # Slow production-only setup
end
```

**4. Profile Boot**
```bash
# Use the bumbler gem
gem install bumbler
bumbler

# Shows which gems slow boot time
```

---

## Debugging Boot Issues

### Common Problems

**1. Initializer Order Issues**
```ruby
# Problem: Accessing something not yet initialized
initializer "my_initializer" do
  User.first  # ActiveRecord not ready!
end

# Solution: Use after or load hooks
initializer "my_initializer", after: "active_record.initialize_database" do
  User.first  # Now safe
end

# Or use load hooks
ActiveSupport.on_load(:active_record) do
  User.first  # Runs when ActiveRecord ready
end
```

**2. Circular Dependencies**
```ruby
# Problem: Initializers depend on each other
initializer "a", before: "b" do
  # ...
end

initializer "b", before: "a" do
  # ...
end

# Error: TSort detects circular dependency
# Solution: Remove circular :before/:after constraints
```

**3. Database Connection Errors**
```ruby
# Problem: Database not available
# Error: PG::ConnectionBad

# Check:
# 1. Database server running?
# 2. config/database.yml correct?
# 3. Database exists?
rails db:create  # Create database
rails db:migrate  # Run migrations
```

### Debug Tools

**1. See Initializer Order**
```ruby
# rails console
Rails.application.initializers.tsort.each do |init|
  puts init.name
end
```

**2. Trace Initialization**
```ruby
# Add to config/application.rb
config.after_initialize do
  Rails.logger.info "=== Initialization Complete ==="
  Rails.logger.info "Loaded: #{Rails.application.config.eager_load}"
  Rails.logger.info "Middleware: #{Rails.application.middleware.map(&:name)}"
end
```

**3. Check Load Hooks**
```ruby
# See what's registered for load hooks
ActiveSupport::LazyLoadHooks.hooks.keys
# => [:active_record, :action_controller, :action_view, ...]
```

---

## Connection to Request Flow

Once boot is complete, the application handles requests:

```
Boot Complete (this document)
  ↓
Server Listening
  ↓
Request Arrives
  ↓
[HTTP Request Flow begins]
(See http-request-flow.md)
  ↓
Middleware Stack
  ↓
Router
  ↓
Controller
  ↓
Model (See active-record-query-flow.md)
  ↓
View
  ↓
Response
```

The boot process creates the foundation that all requests build upon:
- **Middleware Stack**: Processes every request
- **Router**: Dispatches to controllers
- **Autoloader**: Loads code on demand (development)
- **Connection Pool**: Manages database connections
- **Logger**: Records request activity

---

## Key Takeaways

1. **Railties Orchestrate Everything**: The railtie system coordinates all framework components

2. **Ordered Initialization**: TSort ensures initializers run in correct dependency order

3. **Load Hooks Enable Lazy Loading**: Components can wait for dependencies using `on_load`

4. **Middleware Stack is Built Dynamically**: Each component can add middleware

5. **Environment Affects Boot**: Development vs production boot differently (reloading, eager loading)

6. **Configuration is Hierarchical**: Application → Environment → Initializers

7. **Boot Time Matters**: Optimize for developer experience (dev) and memory efficiency (production)

## Further Reading

- Rails Initialization Guide: https://guides.rubyonrails.org/initialization.html
- Railties Source: https://github.com/rails/rails/tree/main/railties
- Zeitwerk Autoloader: https://github.com/fxn/zeitwerk
- Rack Interface: https://github.com/rack/rack

---

*This document maps to Rails 8.0 source code. File references point to actual implementation in the Rails codebase.*
