// Notes for HTTP Request Flow pages

export const httpRequestFlowNotes = {
  // Page 1: Before Hitting Rails - Progressive notes based on visible flows
  1: (visibleSubFlows) => {
    const flowNotes = [
      {
        title: "Browser Cache",
        content: `
          **Fastest Response: 0-1ms**
          
          The browser checks its local cache before making any network request. If a valid cached response exists, it's served immediately without any server communication.
          
          **Cache Headers:**
          • \`Cache-Control: max-age=3600\` - Cache for 1 hour
          • \`ETag: "abc123"\` - Version identifier
          • \`Expires: Wed, 21 Oct 2025 07:28:00 GMT\` - Expiration date
          
          **When Used:**
          • Static assets (CSS, JS, images)
          • Pages with explicit cache headers
          • Previously visited pages within cache period
          
          **Benefits:**
          • Zero network latency
          • No server load
          • Instant page loads
          • Offline capability
        `
      },
      {
        title: "CDN Cache",
        content: `
          **Edge Server Response: 10-50ms**
          
          Content Delivery Networks cache content at edge locations worldwide. When a request hits the CDN, it can serve cached content without contacting the origin server.
          
          **CDN Configuration:**
          • Geographic distribution
          • TTL (Time To Live) settings
          • Cache invalidation strategies
          • Origin shield for protection
          
          **Popular CDNs:**
          • Cloudflare
          • AWS CloudFront
          • Fastly
          • Akamai
          
          **Benefits:**
          • Reduced latency globally
          • Origin server protection
          • DDoS mitigation
          • Bandwidth cost reduction
        `
      },
      {
        title: "Web Server Static Files",
        content: `
          **Direct File Serving: 5-20ms**
          
          Web servers like Nginx or Apache can serve static files directly from the file system without invoking the Rails application.
          
          **Configuration Example (Nginx):**
          \`\`\`nginx
          location /assets {
            root /app/public;
            expires 1y;
            add_header Cache-Control public;
          }
          \`\`\`
          
          **Served Files:**
          • Images, fonts, videos
          • Compiled CSS/JS from asset pipeline
          • Files in public/ directory
          • Uploaded files (if configured)
          
          **Benefits:**
          • No Ruby/Rails overhead
          • Efficient file I/O
          • Can use sendfile() system call
          • Frees app servers for dynamic content
        `
      },
      {
        title: "Load Balancer Health Check",
        content: `
          **Minimal Health Endpoint: 1-5ms**
          
          Load balancers continuously check application health. These checks should be as lightweight as possible to avoid unnecessary load.
          
          **Implementation:**
          \`\`\`ruby
          # config/routes.rb
          get '/health', to: proc { 
            [200, {'Content-Type' => 'text/plain'}, ['OK']] 
          }
          \`\`\`
          
          **Health Check Types:**
          • Simple HTTP 200 response
          • Database connectivity check
          • Redis/cache availability
          • Dependency service checks
          
          **Configuration:**
          • Check interval: 5-30 seconds
          • Timeout: 1-5 seconds
          • Failure threshold: 2-3 checks
          • Recovery threshold: 1-2 checks
        `
      },
      {
        title: "Rate Limiting",
        content: `
          **Request Throttling: 1-10ms**
          
          Rate limiting protects your application from abuse and ensures fair resource usage. Requests exceeding limits are rejected before reaching Rails.
          
          **Rack::Attack Configuration:**
          \`\`\`ruby
          Rack::Attack.throttle('api', 
            limit: 100, 
            period: 1.hour
          ) do |req|
            req.ip if req.path.start_with?('/api')
          end
          \`\`\`
          
          **Strategies:**
          • Per-IP limiting
          • Per-user API quotas
          • Endpoint-specific limits
          • Exponential backoff
          
          **Storage Backends:**
          • Redis (recommended)
          • Memcached
          • Memory (single server)
          
          **Response:**
          • Status: 429 Too Many Requests
          • Retry-After header
          • Rate limit headers
        `
      },
      {
        title: "WAF/Security Block",
        content: `
          **Security Protection: 5-20ms**
          
          Web Application Firewalls inspect requests for malicious patterns and block threats before they reach your application.
          
          **Common Threats Blocked:**
          • SQL Injection attempts
          • Cross-Site Scripting (XSS)
          • Remote File Inclusion
          • Bot attacks
          • DDoS attempts
          
          **WAF Providers:**
          • Cloudflare WAF
          • AWS WAF
          • ModSecurity (open source)
          • Imperva
          
          **Configuration:**
          • OWASP Core Rule Set
          • Custom rules for your app
          • IP allowlists/blocklists
          • Geographic restrictions
          
          **Response:**
          • Status: 403 Forbidden
          • Custom error pages
          • CAPTCHA challenges
          • Logging for analysis
        `
      }
    ];
    
    // Combine notes for visible flows
    const visibleNotes = flowNotes.slice(0, visibleSubFlows);
    const combinedContent = visibleNotes.map(note => 
      `**${note.title}**\n${note.content}`
    ).join('\n\n---\n\n');
    
    return {
      title: "Before Hitting Rails",
      content: combinedContent
    };
  },
  
  // Page 2: Route Direct Response
  2: {
    title: "Route Direct Response",
    content: `
      **Bypassing Controllers with Lambda Routes**
      
      Routes can return responses directly using Proc or Lambda endpoints, completely bypassing controller instantiation. This is the fastest way to respond within Rails.
      
      **Implementation:**
      \`\`\`ruby
      # config/routes.rb
      Rails.application.routes.draw do
        # Simple health check
        get '/health', to: proc { [200, {}, ['OK']] }
        
        # With headers
        get '/version', to: -> (env) { 
          [200, 
           {'Content-Type' => 'application/json'}, 
           [{version: '1.0.0'}.to_json]
          ] 
        }
        
        # Access request details
        get '/echo/*path', to: proc { |env|
          request = Rack::Request.new(env)
          [200, {}, ["Path: #{request.path}"]]
        }
      end
      \`\`\`
      
      **Rack Environment Hash:**
      The \`env\` parameter contains:
      • REQUEST_METHOD - GET, POST, etc.
      • PATH_INFO - Request path
      • QUERY_STRING - Query parameters
      • HTTP headers - HTTP_*
      • Rack-specific keys
      
      **Performance:**
      • Response time: 1-3ms
      • No controller overhead
      • No view rendering
      • Minimal memory allocation
      
      **Use Cases:**
      • Health check endpoints
      • Status pages
      • Webhook receivers
      • Simple redirects
      • Maintenance mode responses
    `
  },
  
  // Page 3: Middleware Response
  3: {
    title: "Middleware Response",
    content: `
      **Early Returns from Middleware Stack**
      
      Custom middleware can intercept requests and return responses without reaching the Rails router or controllers. This enables cross-cutting concerns like authentication, rate limiting, and caching.
      
      **Creating Custom Middleware:**
      \`\`\`ruby
      class ApiThrottle
        def initialize(app, options = {})
          @app = app
          @limit = options[:limit] || 100
        end
        
        def call(env)
          if rate_limit_exceeded?(env)
            return [429, 
              {'Content-Type' => 'application/json'},
              [{error: 'Rate limit exceeded'}.to_json]
            ]
          end
          
          @app.call(env)  # Continue to next middleware
        end
      end
      
      # config/application.rb
      config.middleware.use ApiThrottle, limit: 1000
      \`\`\`
      
      **Default Rails Middleware Stack:**
      1. ActionDispatch::HostAuthorization
      2. Rack::Sendfile
      3. ActionDispatch::Static
      4. ActionDispatch::Executor
      5. ActionDispatch::SSL
      6. Rack::Runtime
      7. Rack::MethodOverride
      8. ActionDispatch::RequestId
      9. Rails::Rack::Logger
      10. ActionDispatch::ShowExceptions
      11. ActionDispatch::Cookies
      12. ActionDispatch::Session
      13. ActionDispatch::Flash
      
      **Performance Impact:**
      • Each middleware: 0.1-2ms
      • Early return saves downstream processing
      • Shared state via env hash
      
      **Common Middleware Uses:**
      • Authentication (JWT, OAuth)
      • Rate limiting
      • Request/Response logging
      • CORS headers
      • Request ID tracking
    `
  },
  
  // Page 4: Controller Text Response
  4: {
    title: "Controller Text Response",
    content: `
      **Simple Text Rendering from Controllers**
      
      Controllers can render plain text responses without involving ActionView or template rendering. This provides a middle ground between direct routes and full view rendering.
      
      **Controller Implementation:**
      \`\`\`ruby
      class StatusController < ApplicationController
        # Callbacks still run
        before_action :authenticate_user!, only: [:secure]
        
        def show
          @status = calculate_status
          render plain: "Status: #{@status}"
        end
        
        def secure
          render plain: "Authenticated as #{current_user.email}"
        end
        
        # Other rendering options
        def alternatives
          # With status code
          render plain: "Not Found", status: 404
          
          # With content type
          render plain: csv_data, content_type: 'text/csv'
          
          # Head only (no body)
          head :no_content
        end
      end
      \`\`\`
      
      **Controller Dispatch Process:**
      1. Router matches request to controller#action
      2. Dispatcher instantiates controller
      3. Sets request/response objects
      4. Runs before_action callbacks
      5. Executes action method
      6. Runs after_action callbacks
      7. Finalizes response
      
      **ActionController::Metal:**
      For minimal overhead, use Metal:
      \`\`\`ruby
      class ApiController < ActionController::Metal
        include ActionController::Rendering
        
        def status
          render plain: "OK"
        end
      end
      \`\`\`
      
      **Performance:**
      • Full controller: 5-15ms
      • Metal controller: 2-5ms
      • Includes callback processing
      • No view compilation overhead
    `
  },
  
  // Page 5: Controller with View
  5: {
    title: "Controller with View",
    content: `
      **Full View Rendering Pipeline**
      
      When controllers render views, ActionView takes over to locate, compile, and execute templates with full access to helpers and layouts.
      
      **View Rendering Process:**
      \`\`\`ruby
      class PagesController < ApplicationController
        layout 'marketing'
        
        def about
          @company = Company.first
          @stats = calculate_statistics
          
          # Implicit render :about
          # Explicit options:
          # render :about
          # render 'pages/about'
          # render template: 'pages/about'
          # render file: '/path/to/file'
          # render html: '<h1>HTML</h1>'.html_safe
          # render layout: false
        end
      end
      \`\`\`
      
      **Template Lookup Process:**
      1. app/views/pages/about.html.erb
      2. app/views/pages/about.erb
      3. app/views/application/about.html.erb
      4. Check all registered paths
      
      **ERB Compilation:**
      Templates are compiled to Ruby methods:
      \`\`\`erb
      <%= @company.name %>
      \`\`\`
      Compiles to:
      \`\`\`ruby
      _buf = ''; _buf << (@company.name).to_s; _buf
      \`\`\`
      
      **Available Helpers:**
      • link_to, button_to
      • form_with, form_for
      • image_tag, stylesheet_link_tag
      • number_to_currency
      • distance_of_time_in_words
      • sanitize, truncate
      
      **Layout Rendering:**
      1. Execute view template
      2. Capture output
      3. Execute layout with yield
      4. Insert view output
      5. Return complete HTML
      
      **Performance:**
      • First render: 20-50ms (compilation)
      • Subsequent: 10-30ms (cached)
      • Partial rendering adds 1-5ms each
      • Helper methods: 0.1-1ms each
    `
  },
  
  // Page 6: Controller with Model and View
  6: {
    title: "Controller with Model and View",
    content: `
      **Full MVC Stack Execution**
      
      The complete Rails MVC pattern: Controller coordinates between Model (database) and View (presentation), with caching at multiple levels.
      
      **Controller with ActiveRecord:**
      \`\`\`ruby
      class ProductsController < ApplicationController
        def show
          @product = Product.find(params[:id])
          @reviews = @product.reviews.recent.limit(5)
          @related = @product.related_products
          
          fresh_when(@product)  # HTTP caching
        end
        
        def create
          @product = Product.new(product_params)
          
          if @product.save
            redirect_to @product, notice: 'Created!'
          else
            render :new, status: :unprocessable_entity
          end
        end
        
        private
        def product_params
          params.require(:product)
                .permit(:name, :price, :description)
        end
      end
      \`\`\`
      
      **Query Execution Flow:**
      1. Build AR relation
      2. Generate SQL via Arel
      3. Check query cache
      4. Get connection from pool
      5. Execute query
      6. Instantiate AR objects
      7. Run after_find callbacks
      
      **Caching Layers:**
      • Query Cache - per-request SQL caching
      • Fragment Cache - view partial caching
      • Russian Doll Cache - nested fragment caching
      • HTTP Cache - ETag/Last-Modified
      
      **View with Model Data:**
      \`\`\`erb
      <% cache @product do %>
        <h1><%= @product.name %></h1>
        <p><%= number_to_currency(@product.price) %></p>
        
        <%= render partial: 'review', 
                   collection: @reviews,
                   cached: true %>
      <% end %>
      \`\`\`
      
      **Performance Optimization:**
      • N+1 prevention: includes/preload
      • Database indexes
      • Counter caches
      • Fragment caching
      • SQL query optimization
      
      **Typical Timing:**
      • Controller: 5-10ms
      • Database: 10-50ms
      • View rendering: 20-40ms
      • Total: 50-200ms
    `
  },
  
  // Page 7: Complex Multi-Model Request
  7: {
    title: "Complex Multi-Model Request",
    content: `
      **Dashboard with Multiple Models and Optimizations**
      
      Complex pages like dashboards require careful orchestration of multiple models, parallel queries, caching strategies, and view optimizations.
      
      **Service Object Pattern:**
      \`\`\`ruby
      class DashboardService
        def initialize(user)
          @user = user
        end
        
        def call
          Rails.cache.fetch(cache_key, expires_in: 5.minutes) do
            {
              orders: recent_orders,
              stats: calculate_stats,
              recommendations: get_recommendations,
              activities: recent_activities
            }
          end
        end
        
        private
        
        def recent_orders
          @user.orders
               .includes(:line_items => :product)
               .recent
               .limit(10)
        end
        
        def calculate_stats
          # Parallel execution with threads
          stats = {}
          threads = []
          
          threads << Thread.new do
            stats[:total_spent] = @user.orders.sum(:total)
          end
          
          threads << Thread.new do
            stats[:product_count] = @user.products.count
          end
          
          threads.each(&:join)
          stats
        end
      end
      \`\`\`
      
      **Eager Loading Strategies:**
      \`\`\`ruby
      # Prevent N+1 with includes
      @users = User.includes(:profile, :posts => :comments)
      
      # Separate queries with preload
      @users = User.preload(:posts)
      
      # Single query with joins
      @users = User.eager_load(:posts)
      \`\`\`
      
      **Russian Doll Caching:**
      \`\`\`erb
      <% cache ['dashboard', current_user, @orders.maximum(:updated_at)] do %>
        <% @orders.each do |order| %>
          <% cache ['order', order] do %>
            <%= render 'order', order: order %>
            
            <% cache ['items', order, order.line_items] do %>
              <%= render order.line_items %>
            <% end %>
          <% end %>
        <% end %>
      <% end %>
      \`\`\`
      
      **Turbo Frames for Progressive Loading:**
      \`\`\`erb
      <%= turbo_frame_tag "recommendations", 
                          src: recommendations_path,
                          loading: "lazy" do %>
        <div class="skeleton">Loading...</div>
      <% end %>
      \`\`\`
      
      **Performance Techniques:**
      • Database connection pooling
      • Parallel query execution
      • Fragment caching
      • Lazy loading with Turbo
      • Background job processing
      • CDN for assets
      
      **Typical Metrics:**
      • Queries: 10-30
      • Cache hit rate: 60-80%
      • Response time: 200-500ms
      • Memory: 2-5MB per request
    `
  },
  
  // Page 8: API JSON Response
  8: {
    title: "API JSON Response",
    content: `
      **Lean API Controllers with JSON Serialization**
      
      ActionController::API provides a lightweight base for API endpoints, excluding view-related functionality while adding API-specific features.
      
      **API Controller Implementation:**
      \`\`\`ruby
      module Api
        module V1
          class ProductsController < ActionController::API
            include ActionController::HttpAuthentication::Token
            
            before_action :authenticate
            before_action :set_product, only: [:show, :update]
            
            # GET /api/v1/products
            def index
              @products = Product.page(params[:page])
              
              # Serialization options
              render json: @products,
                     each_serializer: ProductSerializer,
                     meta: { total: @products.total_count }
            end
            
            # POST /api/v1/products
            def create
              @product = Product.new(product_params)
              
              if @product.save
                render json: @product, 
                       status: :created,
                       location: api_v1_product_url(@product)
              else
                render json: { errors: @product.errors },
                       status: :unprocessable_entity
              end
            end
            
            private
            
            def authenticate
              authenticate_or_request_with_http_token do |token|
                ApiKey.active.exists?(token: token)
              end
            end
          end
        end
      end
      \`\`\`
      
      **Serialization Strategies:**
      
      **ActiveModel::Serializers:**
      \`\`\`ruby
      class ProductSerializer < ActiveModel::Serializer
        attributes :id, :name, :price, :on_sale
        
        belongs_to :category
        has_many :reviews
        
        attribute :on_sale do
          object.sale_price.present?
        end
        
        link(:self) { api_v1_product_url(object) }
      end
      \`\`\`
      
      **JSONAPI-Serializer (Fast JSON API):**
      \`\`\`ruby
      class ProductSerializer
        include JSONAPI::Serializer
        
        attributes :name, :price
        
        cache_options(
          store: Rails.cache,
          expires_in: 1.hour
        )
      end
      \`\`\`
      
      **CORS Configuration:**
      \`\`\`ruby
      # config/initializers/cors.rb
      Rails.application.config.middleware.insert_before 0, Rack::Cors do
        allow do
          origins 'app.example.com'
          resource '/api/*',
            headers: :any,
            methods: [:get, :post, :put, :delete],
            credentials: true
        end
      end
      \`\`\`
      
      **API-Specific Features:**
      • No cookie support
      • No view rendering
      • Leaner middleware stack
      • JSON parameter parsing
      • Token authentication
      • Rate limiting
      • API versioning
      
      **Performance:**
      • 2-10x faster than HTML responses
      • Response time: 20-100ms
      • Serialization: 5-30ms
      • No view overhead
    `
  },
  
  // Page 9: Streaming Response
  9: {
    title: "Streaming Response",
    content: `
      **Real-time Streaming with ActionController::Live**
      
      Rails supports Server-Sent Events (SSE) and chunked responses for real-time data streaming. Each stream runs in its own thread, requiring careful resource management.
      
      **SSE Implementation:**
      \`\`\`ruby
      class LiveController < ApplicationController
        include ActionController::Live
        
        def events
          response.headers['Content-Type'] = 'text/event-stream'
          response.headers['Cache-Control'] = 'no-cache'
          response.headers['X-Accel-Buffering'] = 'no'  # Nginx
          
          sse = ActionController::Live::SSE.new(response.stream)
          
          redis = Redis.new
          redis.subscribe('notifications') do |on|
            on.message do |channel, data|
              sse.write({ 
                channel: channel,
                message: JSON.parse(data)
              })
            end
          end
          
        rescue ActionController::Live::ClientDisconnected
          # Client disconnected
        ensure
          sse.close
          redis.quit
          ActiveRecord::Base.connection_pool.release_connection
        end
      end
      \`\`\`
      
      **Client-Side EventSource:**
      \`\`\`javascript
      const source = new EventSource('/live/events');
      
      source.addEventListener('message', (e) => {
        const data = JSON.parse(e.data);
        console.log('Received:', data);
      });
      
      source.addEventListener('error', (e) => {
        if (e.eventPhase === EventSource.CLOSED) {
          console.log('Connection closed');
        }
      });
      \`\`\`
      
      **Thread Safety Requirements:**
      \`\`\`ruby
      # config/environments/production.rb
      config.allow_concurrency = true
      config.cache_classes = true
      
      # Database pool must support concurrent requests
      database_configuration['pool'] = 25
      \`\`\`
      
      **Resource Management:**
      • Each stream uses a thread
      • Database connection per thread
      • Manual cleanup required
      • Monitor active streams
      • Set connection limits
      
      **Common Issues & Solutions:**
      
      **Rack::ETag Buffering:**
      \`\`\`ruby
      # Solution: Set Last-Modified header
      response.headers['Last-Modified'] = Time.now.httpdate
      \`\`\`
      
      **Nginx Buffering:**
      \`\`\`nginx
      location /live {
        proxy_buffering off;
        proxy_cache off;
        proxy_set_header X-Accel-Buffering no;
      }
      \`\`\`
      
      **Alternative: ActionCable (WebSockets):**
      Often better for bidirectional communication:
      \`\`\`ruby
      class NotificationChannel < ApplicationCable::Channel
        def subscribed
          stream_from "notifications_#{current_user.id}"
        end
        
        def speak(data)
          ActionCable.server.broadcast(
            "notifications_#{current_user.id}",
            message: data['message']
          )
        end
      end
      \`\`\`
      
      **Performance Considerations:**
      • Connection limit: 100-1000 streams
      • Memory per stream: 50-200KB
      • Keep-alive interval: 30-60s
      • Thread pool size limitation
      • Database connection pool
    `
  }
};

// Helper function to get notes for a specific page
export function getHttpRequestFlowNotes(page, visibleSubFlows = null) {
  if (page === 1 && visibleSubFlows !== null) {
    return httpRequestFlowNotes[1](visibleSubFlows);
  }
  return httpRequestFlowNotes[page] || { title: "Notes", content: "No notes available for this page." };
}