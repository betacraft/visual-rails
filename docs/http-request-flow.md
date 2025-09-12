# HTTP Request Flow Documentation

## Overview
This document describes the complete journey of HTTP requests, from the browser to the response. It covers scenarios both before and after requests reach the Rails application.

## Part 1: Before Hitting Rails
These scenarios show how requests can be handled without reaching the Rails application internals.

### 1. Browser Cache
**Overview:** The browser serves the response from its local cache without making any network request.

**Flow:**
```
Browser → Check Cache → Cache Hit → Serve from Cache → User
```

**Components:**
- **Browser**: User's web browser with caching capabilities
- **Browser Cache**: Local storage for previously fetched resources
- **User**: End user receiving the cached response

**Use Case:** Static assets, previously visited pages with cache headers

**Performance:** 
- Latency: ~0-1ms
- Server Load: None
- Best for: Static content, assets

**Configuration:**
- Cache-Control headers
- ETags
- Expires headers

---

### 2. CDN Cache
**Overview:** Content Delivery Network edge server returns cached response without contacting origin server.

**Flow:**
```
Browser → CDN Edge Server → Cache Hit → Cached Response → Browser
```

**Components:**
- **Browser**: Initiates request
- **CDN Edge Server**: Geographically distributed cache server
- **CDN Cache**: Edge server's cache storage
- **Origin Server**: Rails app (not contacted)

**Use Case:** Static assets, API responses, full page caching

**Performance:**
- Latency: ~10-50ms (depends on geography)
- Server Load: None on origin
- Best for: Global content distribution

**Configuration:**
- CDN cache rules
- TTL settings
- Cache invalidation strategies

---

### 3. Web Server Static Files
**Overview:** Web server (Nginx/Apache) serves static files directly without invoking Rails.

**Flow:**
```
Browser → Web Server → File System → Static File → Browser
```

**Components:**
- **Browser**: Makes HTTP request
- **Web Server**: Nginx, Apache, or similar
- **File System**: Server's disk storage
- **Rails App**: Not invoked

**Use Case:** Images, CSS, JavaScript, fonts in public/ directory

**Performance:**
- Latency: ~5-20ms
- Server Load: Minimal (file I/O only)
- Best for: Static assets

**Configuration:**
- Web server static file rules
- public/ directory setup
- Asset pipeline configuration

---

### 4. Load Balancer Health Check
**Overview:** Load balancer health check endpoint responds without full Rails processing.

**Flow:**
```
Load Balancer → Health Check Endpoint → Quick Response → Load Balancer
```

**Components:**
- **Load Balancer**: HAProxy, AWS ELB, etc.
- **Health Endpoint**: Minimal endpoint (often Rack middleware)
- **Rails App**: Minimal or no involvement

**Use Case:** Service health monitoring, uptime checks

**Performance:**
- Latency: ~1-5ms
- Server Load: Minimal
- Frequency: Every 5-30 seconds typically

**Configuration:**
- Health check path
- Response requirements
- Timeout settings

---

### 5. Rate Limiting
**Overview:** Request blocked by rate limiter before reaching Rails application.

**Flow:**
```
Browser → Rate Limiter → Limit Exceeded → 429 Response → Browser
```

**Components:**
- **Browser**: Makes request
- **Rate Limiter**: Nginx, Rack::Attack, Cloudflare
- **Rails App**: Not reached

**Use Case:** API throttling, DDoS protection, abuse prevention

**Performance:**
- Latency: ~1-10ms
- Server Load: Minimal
- Protection: Prevents overload

**Configuration:**
- Rate limit rules
- Time windows
- Client identification

---

### 6. WAF/Security Block
**Overview:** Web Application Firewall blocks malicious requests before Rails.

**Flow:**
```
Browser → WAF → Threat Detected → 403 Blocked → Browser
```

**Components:**
- **Browser**: Potentially malicious request
- **WAF**: Cloudflare, AWS WAF, ModSecurity
- **Rails App**: Protected, not reached

**Use Case:** SQL injection, XSS attempts, bot blocking

**Performance:**
- Latency: ~5-20ms
- Server Load: None on Rails
- Security: Critical protection layer

**Configuration:**
- WAF rules
- Threat signatures
- Allow/block lists

---

## Part 2: After Hitting Rails
These scenarios show request processing within the Rails application, with increasing complexity.

### Page 1: Route Direct Response
**Overview:** Route definition returns response directly using a lambda or proc, bypassing controller instantiation entirely.

**Flow:**
```
Request → Rack → Journey Router → Route Endpoint → Rack Response
```

**Detailed Components:**
- **ActionDispatch::Routing::RouteSet**: Main routing container
- **Journey::Router**: Pattern matching engine
- **Endpoint Types**:
  - `Proc/Lambda`: Direct Rack response
  - `Redirect`: URL redirection endpoint
  - `Dispatcher`: Controller dispatcher (not used here)
- **Rack Triplet**: [status, headers, body] response format

**Extended Example:**
```ruby
# config/routes.rb
# Simple health check
get '/health', to: proc { [200, {}, ['OK']] }

# With headers
get '/version', to: -> (env) { 
  [200, 
   {'Content-Type' => 'text/plain', 'X-App-Version' => '1.0'}, 
   ["Rails #{Rails.version}"]
  ] 
}

# Access to env hash
get '/echo', to: proc { |env|
  request = Rack::Request.new(env)
  [200, {'Content-Type' => 'text/plain'}, ["Path: #{request.path}"]]
}
```

**Middleware Stack Involved:**
1. ActionDispatch::HostAuthorization
2. Rack::Sendfile  
3. ActionDispatch::Static
4. ActionDispatch::Executor
5. (Router matches here - no further middleware)

**Use Case:** Health checks, simple status endpoints, maintenance pages, webhook receivers

**Performance Metrics:**
- Response time: ~1-3ms
- Memory allocation: Minimal (~1KB)
- No database connections
- No view rendering overhead

**Configuration:**
```ruby
# Can bypass certain middleware
Rails.application.routes.draw do
  # This route skips CSRF protection
  direct :health do
    [200, {}, ['OK']]
  end
end
```

---

### Page 2: Middleware Response
**Overview:** Custom middleware intercepts request and returns early response, bypassing routing and controller layers.

**Flow:**
```
Request → Rack → Middleware Stack → Custom Middleware → Early Return
```

**Default Rails Middleware Stack (in order):**
```ruby
# Key middleware that might return early:
ActionDispatch::HostAuthorization     # Blocks unauthorized hosts
ActionDispatch::SSL                   # Forces SSL redirect
ActionDispatch::Static                # Serves static files
Rack::Cache                           # Returns cached responses
ActionDispatch::Executor              # Wraps request in executor
ActionDispatch::RequestId             # Adds X-Request-Id
Rails::Rack::Logger                   # Logs request start
ActionDispatch::ShowExceptions        # Error page responses
ActionDispatch::DebugExceptions       # Debug error pages
ActionDispatch::Callbacks             # Before/after callbacks
ActionDispatch::Cookies               # Cookie processing
ActionDispatch::Session::CookieStore  # Session management
```

**Extended Example:**
```ruby
# app/middleware/api_throttle.rb
class ApiThrottle
  def initialize(app, options = {})
    @app = app
    @limit = options[:limit] || 100
    @window = options[:window] || 3600
    @store = Rails.cache
  end
  
  def call(env)
    request = Rack::Request.new(env)
    
    # Check API endpoints only
    if request.path.start_with?('/api')
      client_id = identify_client(request)
      key = "throttle:#{client_id}"
      
      count = @store.increment(key, 1, expires_in: @window)
      
      if count > @limit
        return rate_limit_exceeded_response
      end
      
      # Add rate limit headers
      status, headers, body = @app.call(env)
      headers['X-RateLimit-Limit'] = @limit.to_s
      headers['X-RateLimit-Remaining'] = (@limit - count).to_s
      [status, headers, body]
    else
      @app.call(env)
    end
  end
  
  private
  
  def identify_client(request)
    request.ip || 'anonymous'
  end
  
  def rate_limit_exceeded_response
    [429, 
     {'Content-Type' => 'application/json', 'Retry-After' => @window.to_s},
     [{error: 'Rate limit exceeded'}.to_json]
    ]
  end
end

# config/application.rb
config.middleware.use ApiThrottle, limit: 1000, window: 3600
```

**Rack env Hash Contents:**
```ruby
{
  'REQUEST_METHOD' => 'GET',
  'PATH_INFO' => '/users',
  'QUERY_STRING' => 'page=1',
  'SERVER_NAME' => 'example.com',
  'SERVER_PORT' => '443',
  'HTTP_HOST' => 'example.com',
  'HTTP_USER_AGENT' => 'Mozilla/5.0...',
  'HTTP_ACCEPT' => 'text/html,application/json',
  'HTTP_COOKIE' => 'session=abc123',
  'rack.input' => StringIO.new,
  'rack.url_scheme' => 'https',
  'rack.session' => {},
  # ... many more
}
```

**Use Cases:** 
- API rate limiting
- Authentication (OAuth, JWT)
- Request/response logging
- CORS headers
- Request ID tracking
- Maintenance mode

**Performance Metrics:**
- Response time: ~2-5ms
- Memory: ~5-10KB per request
- CPU: Minimal
- Best for: Cross-cutting concerns

---

### Page 3: Controller Text Response
**Overview:** Controller action renders plain text without views or models, using ActionController's rendering pipeline.

**Flow:**
```
Request → Router → Dispatcher → Controller#new → Action Method → Render Plain → Response
```

**Detailed Rails Components:**
- **ActionDispatch::Routing::RouteSet::Dispatcher**: Instantiates controller
- **ActionController::Metal**: Lightweight controller base
- **ActionController::Base**: Full controller with all modules
- **ActionDispatch::Response**: Response object creation
- **Rendering Pipeline**: AbstractController::Rendering

**Controller Dispatch Process:**
```ruby
# From RouteSet::Dispatcher#serve
def serve(req)
  params = req.path_parameters
  controller = controller_class(req)
  res = controller.make_response!(req)
  controller.dispatch(params[:action], req, res)
end
```

**Extended Example:**
```ruby
class StatusController < ApplicationController
  # Callbacks run even for simple responses
  before_action :authenticate_user!, only: [:secure_status]
  after_action :log_access
  
  def show
    # Instance variables are set
    @timestamp = Time.current
    
    # Various rendering options
    render plain: "System Status: Online at #{@timestamp}"
    
    # Alternative: render text (deprecated)
    # render text: "Status"
    
    # With status code
    # render plain: "Not Found", status: 404
    
    # With content type
    # render plain: data.to_csv, content_type: 'text/csv'
  end
  
  def secure_status
    # After authentication
    render plain: "Secure Area: User #{current_user.email} authenticated"
  end
  
  private
  
  def log_access
    Rails.logger.info "Status checked at #{Time.current}"
  end
end

# Using ActionController::Metal for minimal overhead
class MinimalController < ActionController::Metal
  include ActionController::Rendering
  
  def index
    render plain: "Minimal response"
  end
end
```

**Callback Hooks Available:**
- `before_action`: Run before the action
- `around_action`: Wrap the action execution
- `after_action`: Run after the action
- `append_before_action`: Add to callback chain
- `skip_before_action`: Skip inherited callbacks

**Modules Included in ActionController::Base:**
```ruby
# Key modules for text responses:
AbstractController::Rendering
ActionController::Rendering  
ActionController::Renderers
ActionController::Head
ActionController::ConditionalGet
ActionController::EtagWithTemplateDigest
ActionController::Caching
ActionController::MimeResponds
```

**Performance Metrics:**
- Response time: 5-15ms
- Memory: ~100KB (full controller)
- Memory: ~20KB (Metal controller)
- Database queries: 0
- View rendering: None

**Debugging:**
```ruby
# Check which callbacks are running
StatusController._process_action_callbacks.map(&:filter)

# Inspect response headers
response.headers
# => {"Content-Type"=>"text/plain; charset=utf-8", ...}
```

---

### Page 4: Controller with View  
**Overview:** Controller renders a view template using ActionView, with layout and template compilation.

**Flow:**
```
Request → Router → Controller → ActionView::Base → Template Lookup → Compile → Render → Layout Wrap → HTML Response
```

**Detailed View Rendering Pipeline:**
- **ActionView::Base**: View context with helpers
- **ActionView::LookupContext**: Template resolution
- **ActionView::Template**: Template compilation
- **Template Handlers**: ERB, Haml, Slim processors
- **ActionView::Layouts**: Layout resolution and rendering
- **ActionView::Helpers**: All view helpers

**Template Lookup Process:**
```ruby
# Rails searches for templates in this order:
# 1. app/views/controller_name/action_name.format.handler
# 2. app/views/controller_name/action_name.html.erb
# 3. app/views/application/action_name.html.erb (if inherited)

# Lookup paths:
ActionController::Base.view_paths
# => ["app/views", "vendor/plugins/*/app/views"]
```

**Extended Example:**
```ruby
# app/controllers/pages_controller.rb
class PagesController < ApplicationController
  # Layout can be specified
  layout 'marketing', only: [:landing, :about]
  
  def about
    # Instance variables passed to view
    @company_name = "ACME Corp"
    @founded_year = 2010
    @employees = 150
    
    # Explicit render options
    # render :about  # default
    # render 'pages/about'  # explicit template
    # render template: 'pages/about'
    # render file: '/path/to/file'
    # render html: '<h1>HTML String</h1>'.html_safe
    # render layout: 'special'
    # render layout: false  # no layout
    
    # Format handling
    respond_to do |format|
      format.html # renders about.html.erb
      format.json { render json: {company: @company_name} }
      format.xml  { render xml: {company: @company_name} }
    end
  end
  
  def contact
    # Variables for form
    @contact = Contact.new
    @departments = ['Sales', 'Support', 'HR']
  end
end

# app/views/pages/about.html.erb
<div class="about-page">
  <h1><%= @company_name %></h1>
  <p>Founded: <%= @founded_year %></p>
  <p>Employees: <%= number_with_delimiter(@employees) %></p>
  
  <%# Using helpers %>
  <%= link_to "Contact Us", contact_path, class: "btn" %>
  
  <%# Partials %>
  <%= render 'shared/company_stats' %>
  
  <%# Content blocks %>
  <% content_for :sidebar do %>
    <%= render 'sidebar/about_links' %>
  <% end %>
</div>

# app/views/layouts/marketing.html.erb
<!DOCTYPE html>
<html>
  <head>
    <title><%= content_for(:title) || "ACME Corp" %></title>
    <%= csrf_meta_tags %>
    <%= csp_meta_tag %>
    <%= stylesheet_link_tag 'application' %>
    <%= javascript_include_tag 'application' %>
  </head>
  <body>
    <header><%= render 'shared/header' %></header>
    
    <main>
      <%= yield %>  <%# Main content here %>
    </main>
    
    <aside>
      <%= yield :sidebar %>  <%# Sidebar content %>
    </aside>
    
    <footer><%= render 'shared/footer' %></footer>
  </body>
</html>
```

**Template Compilation:**
```ruby
# ERB compilation process
# Template source → Ruby code → Method definition → Cached

# Example ERB compilation:
# <%= @company_name %>
# Compiles to:
# _buf = ''; _buf << (@company_name).to_s; _buf

# Templates are cached in production
Rails.application.config.cache_classes # => true in production
```

**Available View Helpers:**
```ruby
# Core helpers included:
ActionView::Helpers::AssetTagHelper      # stylesheet_link_tag, javascript_include_tag
ActionView::Helpers::UrlHelper           # link_to, button_to, url_for
ActionView::Helpers::FormHelper          # form_with, form_for
ActionView::Helpers::TextHelper          # truncate, pluralize, highlight
ActionView::Helpers::NumberHelper        # number_to_currency, number_with_delimiter
ActionView::Helpers::DateHelper          # distance_of_time_in_words
ActionView::Helpers::TagHelper           # tag, content_tag
ActionView::Helpers::CaptureHelper       # capture, content_for
ActionView::Helpers::SanitizeHelper      # sanitize, strip_tags
```

**Performance Metrics:**
- Response time: 15-50ms
- Template compilation: First request only (cached after)
- Memory: ~200-500KB
- Asset compilation: Handled by Sprockets/Webpacker
- Partial rendering: Adds ~1-5ms per partial

**Optimization Techniques:**
```ruby
# Fragment caching
<% cache ['about-page', @company_name] do %>
  <%= render 'expensive_partial' %>
<% end %>

# Collection rendering optimization  
<%= render partial: 'product', collection: @products %>
# Instead of:
<% @products.each do |product| %>
  <%= render 'product', product: product %>
<% end %>
```

---

### Page 5: Controller with Model and View
**Overview:** Full MVC stack with ActiveRecord database queries, model instantiation, and view rendering.

**Flow:**
```
Request → Router → Controller → Strong Params → Model Query → Database → Model Instance → View Render → Response
```

**Detailed MVC Components:**
- **ActionController::Parameters**: Strong parameters filtering
- **ActiveRecord::Base**: Model ORM layer
- **ActiveRecord::Relation**: Query builder
- **Connection Pool**: Database connection management
- **Query Cache**: Request-level SQL caching
- **ActionView + Model**: Data binding in views

**Connection Pool Management:**
```ruby
# Database connection pool configuration
# config/database.yml
production:
  adapter: postgresql
  pool: 25          # Max connections
  timeout: 5000     # Ms to wait for connection
  reaping_frequency: 10  # Seconds between reaping
  
# Connection handling
ActiveRecord::Base.connection_pool.stat
# => {:size=>25, :connections=>5, :busy=>2, :dead=>0, :idle=>3, :waiting=>0}
```

**Extended Example:**
```ruby
# app/controllers/products_controller.rb
class ProductsController < ApplicationController
  before_action :set_product, only: [:show, :edit, :update, :destroy]
  before_action :authenticate_user!, except: [:index, :show]
  
  def index
    # Includes query cache
    @products = Product.includes(:category, :reviews)
                       .where(active: true)
                       .order(created_at: :desc)
                       .page(params[:page])
    
    # N+1 query prevention
    # Bad: @products.each { |p| p.reviews.count }  # N+1 queries
    # Good: Using includes above
    
    # Query caching in action
    Product.cache do
      @featured = Product.featured.limit(3)
      @on_sale = Product.on_sale.limit(5)
    end
  end
  
  def show
    # set_product callback already loaded @product
    @related_products = @product.related_products.limit(4)
    @reviews = @product.reviews.includes(:user).recent
    
    # Fresh when for HTTP caching
    fresh_when(@product, public: true)
  end
  
  def create
    @product = Product.new(product_params)
    
    # Transaction ensures atomicity
    ActiveRecord::Base.transaction do
      if @product.save
        @product.categories << Category.find(params[:category_ids])
        ProductIndexer.perform_async(@product.id)  # Background job
        
        redirect_to @product, notice: 'Product created successfully'
      else
        # Rollback happens automatically on error
        render :new, status: :unprocessable_entity
      end
    end
  end
  
  private
  
  def set_product
    # Basic find with error handling
    @product = Product.find(params[:id])
  rescue ActiveRecord::RecordNotFound
    redirect_to products_path, alert: 'Product not found'
  end
  
  def product_params
    # Strong parameters for security
    params.require(:product).permit(
      :name, :description, :price, :sku,
      :active, :featured,
      category_ids: [],
      images_attributes: [:id, :url, :alt_text, :_destroy]
    )
  end
end

# app/models/product.rb
class Product < ApplicationRecord
  # Associations
  belongs_to :category
  has_many :reviews, dependent: :destroy
  has_many :product_images, dependent: :destroy
  has_and_belongs_to_many :tags
  
  # Validations
  validates :name, presence: true, length: { maximum: 255 }
  validates :price, numericality: { greater_than: 0 }
  validates :sku, uniqueness: true
  
  # Scopes for common queries
  scope :active, -> { where(active: true) }
  scope :featured, -> { where(featured: true) }
  scope :on_sale, -> { where('sale_price IS NOT NULL') }
  scope :recent, -> { order(created_at: :desc) }
  
  # Callbacks
  after_save :clear_cache
  after_create :notify_admin
  
  # Query optimizations
  def related_products
    Product.where(category: category)
           .where.not(id: id)
           .active
  end
  
  private
  
  def clear_cache
    Rails.cache.delete("product_#{id}")
    Rails.cache.delete_matched("products_*")
  end
end

# app/views/products/show.html.erb
<article class="product-detail">
  <%# Fragment caching with model touch %>
  <% cache @product do %>
    <h1><%= @product.name %></h1>
    <div class="price">
      <%= number_to_currency(@product.price) %>
    </div>
    <div class="description">
      <%= simple_format(@product.description) %>
    </div>
  <% end %>
  
  <%# Lazy loading with turbo frames %>
  <%= turbo_frame_tag "reviews", src: product_reviews_path(@product), 
                      loading: "lazy" do %>
    <div class="loading">Loading reviews...</div>
  <% end %>
  
  <%# Related products with collection caching %>
  <section class="related">
    <%= render partial: 'products/card', 
               collection: @related_products,
               cached: true %>
  </section>
</article>
```

**Query Cache Behavior:**
```ruby
# Query cache is enabled per request
Product.find(1)  # Hits database
Product.find(1)  # Returns from query cache

# Cache key: [sql_query, binds]
# Cleared on any INSERT, UPDATE, DELETE
```

**CSRF Protection:**
```ruby
# Automatically verified for non-GET requests
class ApplicationController < ActionController::Base
  protect_from_forgery with: :exception
  # Adds CSRF token verification
  # Requires <%= csrf_meta_tags %> in layout
end
```

**Performance Metrics:**
- Response time: 50-200ms (depends on queries)
- Database queries: 1-10 typical
- Query cache hit rate: 30-60%
- Memory: 500KB-2MB
- Connection pool usage: 1-3 connections

**Common N+1 Query Patterns:**
```ruby
# Problem:
@products.each { |p| p.category.name }  # N+1 queries

# Solutions:
@products = Product.includes(:category)  # Eager load
@products = Product.joins(:category)     # INNER JOIN
@products = Product.preload(:category)   # Separate queries
```

---

### Page 6: Complex Multi-Model Request
**Overview:** Controller orchestrates multiple models with associations, complex queries, and optimized data loading.

**Flow:**
```
Request → Controller → Authentication → Multiple Model Queries → Eager Loading → Business Logic → Complex View → Response
```

**Advanced ActiveRecord Techniques:**
- **Eager Loading Strategies**: includes vs preload vs eager_load
- **Query Optimization**: Database indexes, query plans
- **Fragment Caching**: Russian doll caching
- **Background Jobs**: Sidekiq/ActiveJob integration
- **Service Objects**: Business logic extraction

**Extended Complex Example:**
```ruby
# app/controllers/dashboard_controller.rb
class DashboardController < ApplicationController
  before_action :authenticate_user!
  before_action :load_dashboard_data, only: [:index]
  
  def index
    # Complex data loading handled by service
    @dashboard = DashboardService.new(current_user).call
    
    # HTTP caching with ETags
    fresh_when(
      etag: [@user, @recent_orders, @statistics],
      last_modified: @user.updated_at,
      public: false
    )
  end
  
  private
  
  def load_dashboard_data
    # Parallel query execution
    ActiveRecord::Base.connection_pool.with_connection do
      threads = []
      
      threads << Thread.new do
        @recent_orders = current_user.orders
          .includes(:line_items => {:product => :category})
          .includes(:shipping_address, :payment)
          .where('created_at > ?', 30.days.ago)
          .order(created_at: :desc)
          .limit(10)
      end
      
      threads << Thread.new do
        @recommendations = RecommendationEngine
          .new(current_user)
          .products
          .includes(:reviews, :category, images: :variants)
          .limit(8)
      end
      
      threads << Thread.new do
        @statistics = Rails.cache.fetch(
          ["user_stats", current_user.id, Date.current],
          expires_in: 1.hour
        ) do
          UserStatistics.calculate_for(current_user)
        end
      end
      
      threads.each(&:join)
    end
    
    # Preload notifications
    @notifications = current_user.notifications
      .unread
      .includes(:notifiable)
      .limit(5)
    
    # Activity feed with polymorphic associations
    @activities = PublicActivity::Activity
      .where(owner: current_user.following_ids)
      .includes(:owner, :trackable)
      .order(created_at: :desc)
      .page(params[:page])
  end
end

# app/services/dashboard_service.rb
class DashboardService
  def initialize(user)
    @user = user
  end
  
  def call
    Rails.cache.fetch(cache_key, expires_in: 5.minutes) do
      {
        metrics: calculate_metrics,
        charts: generate_charts,
        recent_activity: recent_activity,
        recommendations: recommendations
      }
    end
  end
  
  private
  
  def calculate_metrics
    # Complex aggregations
    orders = @user.orders.completed
    
    {
      total_spent: orders.sum(:total),
      order_count: orders.count,
      average_order: orders.average(:total),
      products_purchased: orders.joins(:line_items).sum('quantity'),
      loyalty_points: @user.loyalty_points,
      savings: calculate_savings
    }
  end
  
  def generate_charts
    # Time-series data for charts
    orders_by_month = @user.orders
      .group_by_month(:created_at, last: 12)
      .count
      
    spending_by_category = @user.orders
      .joins(line_items: {product: :category})
      .group('categories.name')
      .sum('line_items.quantity * line_items.price')
      
    {
      orders_timeline: orders_by_month,
      spending_breakdown: spending_by_category
    }
  end
  
  def recent_activity
    # Polymorphic activity tracking
    Activity.where(user: @user)
            .includes(:trackable)
            .recent
            .limit(20)
  end
  
  def recommendations
    # ML-based recommendations
    RecommendationEngine.new(@user).generate
  end
  
  def cache_key
    [
      'dashboard',
      @user.id,
      @user.updated_at.to_i,
      @user.orders.maximum(:updated_at).to_i
    ].join('/')
  end
end

# app/views/dashboard/index.html.erb
<div class="dashboard">
  <%# Russian doll caching %>
  <% cache ['dashboard-v1', current_user, @recent_orders.maximum(:updated_at)] do %>
    
    <%# Metrics section %>
    <section class="metrics">
      <% cache ['metrics', @statistics] do %>
        <%= render 'dashboard/metrics', statistics: @statistics %>
      <% end %>
    </section>
    
    <%# Recent orders with nested caching %>
    <section class="recent-orders">
      <% @recent_orders.each do |order| %>
        <% cache ['order-card', order] do %>
          <%= render 'orders/summary', order: order %>
          
          <%# Nested cache for line items %>
          <% cache ['order-items', order, order.line_items] do %>
            <%= render 'orders/line_items', items: order.line_items %>
          <% end %>
        <% end %>
      <% end %>
    </section>
    
    <%# Recommendations with lazy loading %>
    <%= turbo_frame_tag "recommendations", 
                        src: recommendations_dashboard_path,
                        loading: "lazy" do %>
      <div class="skeleton-loader">Loading recommendations...</div>
    <% end %>
    
    <%# Activity feed with infinite scroll %>
    <section class="activity-feed" data-controller="infinite-scroll">
      <%= render partial: 'activities/activity', 
                 collection: @activities,
                 cached: true %>
    </section>
    
  <% end %>
</div>
```

**Query Optimization Strategies:**
```ruby
# Use explain to analyze queries
User.joins(:orders).where(orders: {status: 'completed'}).explain
# => EXPLAIN output showing query plan

# Add database indexes
# db/migrate/add_indexes.rb
add_index :orders, [:user_id, :status, :created_at]
add_index :products, :category_id
add_index :line_items, [:order_id, :product_id]

# Use pluck for specific columns
user_ids = User.active.pluck(:id)  # SELECT id FROM users

# Batch processing
User.find_in_batches(batch_size: 1000) do |users|
  users.each { |user| ProcessUserJob.perform_later(user) }
end
```

**Performance Metrics:**
- Response time: 200-500ms
- Database queries: 10-30
- Cache hit rate: 60-80%
- Memory usage: 2-5MB
- Background jobs queued: 0-10

---

### Page 7: API JSON Response
**Overview:** API controller using ActionController::API with efficient JSON serialization and API-specific optimizations.

**Flow:**
```
Request → API Router → Authentication → API Controller → Model Query → Serializer → JSON Response
```

**ActionController::API Modules:**
```ruby
# Included in ActionController::API (leaner than Base):
AbstractController::Rendering
ActionController::UrlFor
ActionController::Redirecting
ActionController::ApiRendering
ActionController::Renderers::All
ActionController::ConditionalGet
ActionController::BasicImplicitRender  
ActionController::StrongParameters
ActionController::RateLimiting       # New in Rails 7.2
ActionController::Caching
ActionController::DataStreaming
ActionController::DefaultHeaders
ActionController::Logging
ActionController::Instrumentation
ActionController::Rescue

# NOT included (vs ActionController::Base):
# - ActionView::Layouts
# - ActionController::Cookies
# - ActionController::Flash
# - ActionController::FormBuilder
# - ActionController::RequestForgeryProtection
# - ActionController::ContentSecurityPolicy
# - ActionController::PermissionsPolicy
```

**Extended API Example:**
```ruby
# app/controllers/api/v1/products_controller.rb
module Api
  module V1
    class ProductsController < ActionController::API
      include ActionController::HttpAuthentication::Token::ControllerMethods
      
      # Rate limiting (Rails 7.2+)
      rate_limit to: 100, within: 1.hour, by: -> { request.remote_ip }
      
      before_action :authenticate
      before_action :set_product, only: [:show, :update, :destroy]
      
      # GET /api/v1/products
      def index
        # Query with filtering and pagination
        @products = Product.active
        @products = @products.where(category_id: params[:category_id]) if params[:category_id]
        @products = @products.search(params[:q]) if params[:q]
        @products = @products.page(params[:page]).per(params[:per_page] || 25)
        
        # HTTP caching
        if stale?(last_modified: @products.maximum(:updated_at),
                  etag: [@products.cache_key_with_version, params])
          
          # Choose serialization method
          case params[:format_type]
          when 'full'
            render json: ProductSerializer.new(
              @products,
              include: [:category, :reviews],
              meta: pagination_meta(@products)
            )
          when 'minimal'
            render json: @products.as_json(
              only: [:id, :name, :price],
              methods: [:thumbnail_url]
            )
          else
            # Default serialization
            render json: @products, 
                   each_serializer: ProductSerializer,
                   meta: { total: @products.total_count }
          end
        end
      end
      
      # POST /api/v1/products
      def create
        @product = Product.new(product_params)
        
        if @product.save
          # Background job for indexing
          SearchIndexer.perform_async('Product', @product.id)
          
          render json: @product, 
                 serializer: ProductSerializer,
                 status: :created,
                 location: api_v1_product_url(@product)
        else
          render json: { 
            errors: @product.errors.full_messages,
            details: @product.errors.details
          }, status: :unprocessable_entity
        end
      end
      
      # PATCH/PUT /api/v1/products/:id
      def update
        if @product.update(product_params)
          render json: @product
        else
          render json: { errors: @product.errors }, 
                 status: :unprocessable_entity
        end
      end
      
      # DELETE /api/v1/products/:id
      def destroy
        @product.destroy
        head :no_content
      end
      
      private
      
      def authenticate
        authenticate_or_request_with_http_token do |token, options|
          # Token verification
          @current_user = User.find_by(api_token: token)
          @current_user&.active?
        end
      end
      
      def set_product
        @product = Product.find(params[:id])
      rescue ActiveRecord::RecordNotFound
        render json: { error: 'Product not found' }, status: :not_found
      end
      
      def product_params
        params.require(:product).permit(:name, :description, :price, :category_id)
      end
      
      def pagination_meta(collection)
        {
          current_page: collection.current_page,
          next_page: collection.next_page,
          prev_page: collection.prev_page,
          total_pages: collection.total_pages,
          total_count: collection.total_count
        }
      end
    end
  end
end

# app/serializers/product_serializer.rb
class ProductSerializer < ActiveModel::Serializer
  attributes :id, :name, :slug, :description, :price, :sale_price
  
  belongs_to :category
  has_many :reviews
  
  # Conditional attributes
  attribute :inventory_count, if: :admin?
  
  # Computed attributes
  attribute :on_sale do
    object.sale_price.present?
  end
  
  attribute :average_rating do
    object.reviews.average(:rating)&.round(1)
  end
  
  # Links
  link(:self) { api_v1_product_url(object) }
  link(:reviews) { api_v1_product_reviews_url(object) }
  
  def admin?
    current_user&.admin?
  end
end

# Alternative: Using JSONAPI serializer
class ProductSerializer
  include JSONAPI::Serializer
  
  attributes :name, :description, :price
  
  has_many :reviews
  belongs_to :category
  
  cache_options store: Rails.cache, namespace: 'jsonapi-serializer', expires_in: 1.hour
end

# Alternative: Using Jbuilder
# app/views/api/v1/products/index.json.jbuilder
json.products @products do |product|
  json.extract! product, :id, :name, :price
  json.url api_v1_product_url(product)
  json.category do
    json.extract! product.category, :id, :name
  end
end
json.meta do
  json.total @products.total_count
  json.page params[:page]
end
```

**CORS Configuration:**
```ruby
# config/initializers/cors.rb
Rails.application.config.middleware.insert_before 0, Rack::Cors do
  allow do
    origins 'app.example.com', 'localhost:3001'
    resource '/api/*',
      headers: :any,
      methods: [:get, :post, :put, :patch, :delete, :options],
      expose: ['X-Total-Count', 'Link'],
      credentials: true,
      max_age: 86400
  end
end
```

**API Documentation:**
```ruby
# Using API documentation gems
# swagger-docs, apipie-rails, or rswag

swagger_api :index do
  summary "Fetches all products"
  param :query, :category_id, :integer, :optional
  param :query, :page, :integer, :optional
  response :ok, "Success", :Product
  response :unauthorized
end
```

**Performance Metrics:**
- Response time: 20-100ms
- JSON serialization: 5-30ms
- No view rendering overhead
- Memory: 100-500KB
- Throughput: 2-10x higher than HTML

---

### Page 8: Streaming Response
**Overview:** Real-time streaming using ActionController::Live for Server-Sent Events (SSE) and chunked responses.

**Flow:**
```
Request → Controller::Live → Thread Spawn → Stream Open → Chunks Sent → Keep-Alive → Stream Close
```

**ActionController::Live Architecture:**
- **Concurrent Ruby**: Each streaming request runs in separate thread
- **Response Stream**: Direct write to socket
- **Rack Hijacking**: Bypasses normal response buffering
- **Connection Management**: Manual resource cleanup required

**Thread Safety Requirements:**
```ruby
# ActionController::Live runs in separate thread
# Must be thread-safe!

# config/environments/production.rb
config.allow_concurrency = true  # Required for streaming

# Connection pool must support concurrent requests
config.database_configuration['production']['pool'] = 25
```

**Extended Streaming Examples:**
```ruby
# app/controllers/live_controller.rb
class LiveController < ApplicationController
  include ActionController::Live
  
  # Server-Sent Events for real-time updates
  def events
    # Set headers before writing
    response.headers['Content-Type'] = 'text/event-stream'
    response.headers['Cache-Control'] = 'no-cache'
    response.headers['X-Accel-Buffering'] = 'no'  # Disable Nginx buffering
    response.headers['Last-Modified'] = Time.now.httpdate  # For Rack::ETag
    
    sse = ActionController::Live::SSE.new(response.stream, 
                                          retry: 3000,
                                          event: 'update')
    
    # Subscribe to Redis pub/sub
    redis = Redis.new
    redis.subscribe('notifications', 'updates') do |on|
      on.message do |channel, message|
        sse.write({ 
          channel: channel,
          data: JSON.parse(message),
          timestamp: Time.current.iso8601
        })
      end
    end
    
  rescue ActionController::Live::ClientDisconnected
    # Client disconnected
    logger.info "Client disconnected from stream"
  rescue StandardError => e
    logger.error "Streaming error: #{e.message}"
    sse.write({ error: e.message }, event: 'error')
  ensure
    # CRITICAL: Always close the stream
    sse.close
    redis&.quit
    ActiveRecord::Base.connection_pool.release_connection
  end
  
  # Chunked file download
  def download_large_file
    response.headers['Content-Type'] = 'application/octet-stream'
    response.headers['Content-Disposition'] = 
      "attachment; filename=\"large_file.zip\""
    response.headers['Content-Length'] = file_size.to_s
    
    # Stream file in chunks
    File.open(file_path, 'rb') do |file|
      while chunk = file.read(1.megabyte)
        response.stream.write(chunk)
        sleep 0.01  # Throttle if needed
      end
    end
  ensure
    response.stream.close
  end
  
  # Real-time progress updates
  def import_progress
    response.headers['Content-Type'] = 'text/event-stream'
    
    sse = ActionController::Live::SSE.new(response.stream)
    
    # Start background job and track progress
    job_id = ImportJob.perform_async(params[:file_id])
    
    # Poll job progress
    100.times do
      progress = Sidekiq::Status.at(job_id)
      
      sse.write({
        progress: progress,
        total: Sidekiq::Status.total(job_id),
        message: Sidekiq::Status.message(job_id)
      }, event: 'progress')
      
      break if Sidekiq::Status.complete?(job_id)
      sleep 1
    end
    
    sse.write({ status: 'complete' }, event: 'done')
  ensure
    sse.close
  end
  
  # WebSocket-like bidirectional communication (using SSE + POST)
  def chat_stream
    response.headers['Content-Type'] = 'text/event-stream'
    
    sse = ActionController::Live::SSE.new(response.stream)
    
    # Subscribe to user's channel
    channel = "chat:#{current_user.id}"
    
    # Use Rails' ActionCable for better WebSocket support
    subscription = ChatChannel.subscribe(channel) do |message|
      sse.write(message)
    end
    
    # Keep connection alive
    keepalive = Thread.new do
      loop do
        sse.write('', event: 'ping')
        sleep 30
      end
    end
    
    sleep  # Keep main thread alive
    
  ensure
    keepalive&.kill
    subscription&.unsubscribe
    sse.close
  end
end

# Client-side JavaScript for SSE
# app/assets/javascripts/sse_client.js
const eventSource = new EventSource('/live/events');

eventSource.addEventListener('update', (event) => {
  const data = JSON.parse(event.data);
  console.log('Received update:', data);
});

eventSource.addEventListener('error', (event) => {
  if (event.eventPhase === EventSource.CLOSED) {
    console.log('Connection closed');
  }
});

// Reconnection is automatic with SSE
```

**Rack::ETag Buffering Issue:**
```ruby
# Rack::ETag buffers response by default
# Solution 1: Set Last-Modified header
response.headers['Last-Modified'] = Time.now.httpdate

# Solution 2: Remove Rack::ETag for streaming endpoints
config.middleware.delete Rack::ETag, ->(env) {
  env['PATH_INFO'].start_with?('/live')
}

# Solution 3: Use Rack::Deflater carefully
config.middleware.use Rack::Deflater, include: [
  'text/html',
  'application/json'
  # Exclude 'text/event-stream'
]
```

**Memory Management:**
```ruby
# Monitor memory usage
class StreamMonitor
  def self.active_streams
    @active_streams ||= Concurrent::AtomicFixnum.new(0)
  end
  
  def self.increment
    active_streams.increment
    raise "Too many streams" if active_streams.value > 100
  end
  
  def self.decrement
    active_streams.decrement
  end
end

# In controller
def events
  StreamMonitor.increment
  # ... streaming code ...
ensure
  StreamMonitor.decrement
  response.stream.close
end
```

**Performance Considerations:**
- Connection limit: Typically 100-1000 concurrent streams
- Memory per stream: 50-200KB
- Thread pool size: Limited by server config
- Keep-alive interval: 30-60 seconds
- Nginx/Apache buffering: Must be disabled
- Database connections: Separate pool needed

**Alternative: ActionCable (WebSockets):**
```ruby
# Often better than ActionController::Live for bidirectional
class ChatChannel < ApplicationCable::Channel
  def subscribed
    stream_from "chat_#{params[:room]}"
  end
  
  def speak(data)
    ActionCable.server.broadcast(
      "chat_#{params[:room]}",
      message: data['message'],
      user: current_user.name
    )
  end
end
```

---

## Summary

The HTTP request flow encompasses many layers, from browser caching to complex Rails processing. Understanding these flows helps in:

1. **Performance Optimization**: Knowing where to cache and optimize
2. **Architecture Decisions**: Choosing the right layer for functionality
3. **Debugging**: Understanding where issues might occur
4. **Scaling**: Identifying bottlenecks and optimization opportunities

Each layer serves a specific purpose in the web application stack, and effective use of all layers creates fast, scalable, and maintainable applications.