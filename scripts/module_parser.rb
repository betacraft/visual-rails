# Parse Ruby modules and classes from Rails source

require 'pathname'
require 'set'

class ModuleParser
  def parse_modules(gem_path)
    modules = Set.new
    
    Dir.glob(File.join(gem_path, 'lib', '**', '*.rb')).each do |file|
      begin
        content = File.read(file)
        
        # Find module definitions
        content.scan(/^\s*module\s+([A-Z][A-Za-z0-9_:]*)/) do |match|
          module_name = normalize_module_name(match[0], gem_path)
          modules << module_name if valid_module?(module_name)
        end
      rescue => e
        # Skip files that can't be read
      end
    end
    
    modules.to_a.sort
  end
  
  def parse_classes(gem_path)
    classes = Set.new
    
    Dir.glob(File.join(gem_path, 'lib', '**', '*.rb')).each do |file|
      begin
        content = File.read(file)
        
        # Find class definitions
        content.scan(/^\s*class\s+([A-Z][A-Za-z0-9_:]*)/) do |match|
          class_name = normalize_module_name(match[0], gem_path)
          classes << class_name if valid_module?(class_name)
        end
      rescue => e
        # Skip files that can't be read
      end
    end
    
    classes.to_a.sort
  end
  
  def get_module_details(gem_path, module_name)
    details = {
      description: get_module_description(module_name),
      components: [],
      methods: [],
      class_methods: [],
      loc: 0
    }
    
    # Find all files that might contain this module's methods
    module_files = find_all_module_files(gem_path, module_name)
    
    module_files.each do |module_file|
      next unless File.exist?(module_file)
      
      content = File.read(module_file)
      
      # Extract public methods more comprehensively
      in_module = false
      in_class_methods = false
      current_indent = 0
      private_section = false
      
      content.lines.each_with_index do |line, index|
        # Check if we're entering the target module
        if line =~ /^\s*module\s+#{Regexp.escape(module_name.split('::').last)}/
          in_module = true
          current_indent = line[/^\s*/].length
          private_section = false
        elsif in_module && line =~ /^\s{#{current_indent}}end/
          in_module = false
          in_class_methods = false
        elsif in_module
          # Check for private/protected sections
          if line =~ /^\s*(private|protected)\s*$/
            private_section = true
          elsif line =~ /^\s*public\s*$/
            private_section = false
          end
          
          # Check for class << self block
          if line =~ /^\s*class\s*<<\s*self/
            in_class_methods = true
          elsif in_class_methods && line =~ /^\s*end/
            in_class_methods = false
          end
          
          # Find method definitions (skip private ones)
          if !private_section && line =~ /^\s*def\s+(self\.)?([a-z_][a-z0-9_]*[!?=]?)/
            is_class_method = $1 || in_class_methods
            method_name = $2
            
            unless method_name.start_with?('_')
              if is_class_method
                details[:class_methods] << method_name unless details[:class_methods].include?(method_name)
              else
                details[:methods] << method_name unless details[:methods].include?(method_name)
              end
            end
          end
          
          # Find included modules
          if line =~ /^\s*include\s+([A-Z][A-Za-z0-9_:]*)/
            component = $1
            details[:components] << component unless details[:components].include?(component)
          end
          
          # Find extended modules
          if line =~ /^\s*extend\s+([A-Z][A-Za-z0-9_:]*)/
            component = $1
            details[:components] << component unless details[:components].include?(component)
          end
        end
      end
      
      details[:loc] += content.lines.count
    end
    
    # For very common modules, extract methods from their common usage patterns
    extract_common_module_methods(gem_path, module_name, details)
    
    # Sort methods alphabetically for consistency
    details[:methods] = details[:methods].sort.uniq
    details[:class_methods] = details[:class_methods].sort.uniq
    details[:components] = details[:components].uniq
    
    details
  end

  def get_class_details(gem_path, class_name)
    details = {
      description: get_class_description(class_name),
      superclass: nil,
      included_modules: [],
      methods: [],
      class_methods: [],
      loc: 0
    }

    # Find all files that might contain this class
    class_files = find_all_class_files(gem_path, class_name)

    class_files.each do |class_file|
      next unless File.exist?(class_file)

      content = File.read(class_file)

      # Extract superclass
      if content =~ /class\s+#{Regexp.escape(class_name.split('::').last)}\s*<\s*([A-Z][\w:]*)/
        details[:superclass] = $1 unless details[:superclass]
      end

      # Extract methods similar to get_module_details
      in_class = false
      in_class_methods = false
      current_indent = 0
      private_section = false

      content.lines.each do |line|
        # Check if we're entering the target class
        if line =~ /^\s*class\s+#{Regexp.escape(class_name.split('::').last)}/
          in_class = true
          current_indent = line[/^\s*/].length
          private_section = false
        elsif in_class && line =~ /^\s{#{current_indent}}end/
          in_class = false
          in_class_methods = false
        elsif in_class
          # Check for private/protected sections
          if line =~ /^\s*(private|protected)\s*$/
            private_section = true
          elsif line =~ /^\s*public\s*$/
            private_section = false
          end

          # Check for class << self block
          if line =~ /^\s*class\s*<<\s*self/
            in_class_methods = true
          elsif in_class_methods && line =~ /^\s*end/
            in_class_methods = false
          end

          # Find method definitions (skip private ones)
          if !private_section && line =~ /^\s*def\s+(self\.)?([a-z_][a-z0-9_]*[!?=]?)/
            is_class_method = $1 || in_class_methods
            method_name = $2

            unless method_name.start_with?('_')
              if is_class_method
                details[:class_methods] << method_name unless details[:class_methods].include?(method_name)
              else
                details[:methods] << method_name unless details[:methods].include?(method_name)
              end
            end
          end

          # Find included modules
          if line =~ /^\s*include\s+([A-Z][A-Za-z0-9_:]*)/
            module_name = $1
            details[:included_modules] << module_name unless details[:included_modules].include?(module_name)
          end

          # Find extended modules
          if line =~ /^\s*extend\s+([A-Z][A-Za-z0-9_:]*)/
            module_name = $1
            details[:included_modules] << module_name unless details[:included_modules].include?(module_name)
          end

          # Extract attr_accessor, attr_reader, attr_writer
          if !private_section && line =~ /^\s*attr_(accessor|reader|writer)\s+:(\w+)/
            method_name = $2
            details[:methods] << method_name unless details[:methods].include?(method_name)
            if $1 == 'accessor' || $1 == 'writer'
              details[:methods] << "#{method_name}=" unless details[:methods].include?("#{method_name}=")
            end
          end

          # Extract delegated methods
          if !private_section && line =~ /^\s*delegate\s+:(\w+)/
            method_name = $1
            details[:methods] << method_name unless details[:methods].include?(method_name)
          end
        end
      end

      details[:loc] += content.lines.count
    end

    # Sort methods alphabetically
    details[:methods] = details[:methods].sort.uniq
    details[:class_methods] = details[:class_methods].sort.uniq
    details[:included_modules] = details[:included_modules].uniq

    details
  end

  def extract_class_hierarchy(gem_path)
    hierarchy = {}

    Dir.glob(File.join(gem_path, 'lib', '**', '*.rb')).each do |file|
      begin
        content = File.read(file)

        # Match: class ClassName < ParentClass
        content.scan(/^\s*class\s+([A-Z][\w:]*)\s*<\s*([A-Z][\w:]*)/) do |match|
          child_class = normalize_module_name(match[0], gem_path)
          parent_class = match[1]
          hierarchy[child_class] = parent_class if valid_module?(child_class)
        end
      rescue => e
        # Skip files that can't be read
      end
    end

    hierarchy
  end

  def count_methods(gem_path)
    method_count = 0

    Dir.glob(File.join(gem_path, 'lib', '**', '*.rb')).each do |file|
      begin
        content = File.read(file)
        method_count += content.scan(/^\s*def\s+[a-z_]/).size
      rescue
        # Skip files that can't be read
      end
    end

    method_count
  end
  
  private
  
  def normalize_module_name(name, gem_path)
    gem_name = File.basename(gem_path)
    
    # Convert gem name to module name format
    module_prefix = gem_name.split(/[-_]/).map(&:capitalize).join
    
    # If the module doesn't start with a Rails module, prepend it
    if !name.include?('::') && !name.start_with?(module_prefix)
      case gem_name
      when 'activesupport'
        name = "ActiveSupport::#{name}" unless name == 'ActiveSupport'
      when 'activerecord'
        name = "ActiveRecord::#{name}" unless name == 'ActiveRecord'
      when 'actionpack'
        name = "ActionPack::#{name}" unless name == 'ActionPack'
      when 'actionview'
        name = "ActionView::#{name}" unless name == 'ActionView'
      when 'activemodel'
        name = "ActiveModel::#{name}" unless name == 'ActiveModel'
      when 'actionmailer'
        name = "ActionMailer::#{name}" unless name == 'ActionMailer'
      when 'activejob'
        name = "ActiveJob::#{name}" unless name == 'ActiveJob'
      when 'actioncable'
        name = "ActionCable::#{name}" unless name == 'ActionCable'
      when 'activestorage'
        name = "ActiveStorage::#{name}" unless name == 'ActiveStorage'
      when 'railties'
        name = "Rails::#{name}" unless name == 'Rails' || name.start_with?('Rails::')
      end
    end
    
    name
  end
  
  def valid_module?(name)
    # Filter out test modules and internal modules
    !name.include?('Test') && 
    !name.include?('Spec') && 
    !name.include?('Example') &&
    !name.start_with?('_')
  end
  
  def find_module_file(gem_path, module_name)
    # Convert module name to likely file path
    file_name = module_name.split('::').last
    file_name = file_name.gsub(/([A-Z])/, '_\1').downcase.sub(/^_/, '')
    
    possible_paths = [
      File.join(gem_path, 'lib', "**", "#{file_name}.rb"),
      File.join(gem_path, 'lib', "**", "**/#{file_name}.rb")
    ]
    
    possible_paths.each do |pattern|
      files = Dir.glob(pattern)
      return files.first if files.any?
    end
    
    nil
  end
  
  def find_all_module_files(gem_path, module_name)
    files = []

    # Try to find the main module file
    main_file = find_module_file(gem_path, module_name)
    files << main_file if main_file

    # Also look for files in a directory named after the module
    module_parts = module_name.split('::')
    if module_parts.length > 1
      # For nested modules like ActiveRecord::Base, also check active_record/base/
      dir_path = module_parts.map { |p| p.gsub(/([A-Z])/, '_\1').downcase.sub(/^_/, '') }.join('/')
      pattern = File.join(gem_path, 'lib', dir_path, '**', '*.rb')
      files.concat(Dir.glob(pattern))

      # Also check without the first part (e.g., just 'base' directory)
      if module_parts.length == 2
        last_part = module_parts.last.gsub(/([A-Z])/, '_\1').downcase.sub(/^_/, '')
        pattern = File.join(gem_path, 'lib', '**', last_part, '*.rb')
        files.concat(Dir.glob(pattern))
      end
    end

    files.uniq
  end

  def find_all_class_files(gem_path, class_name)
    # Reuse the same logic as modules since classes follow the same file structure
    find_all_module_files(gem_path, class_name)
  end
  
  def extract_common_module_methods(gem_path, module_name, details)
    # Add commonly used methods for well-known Rails modules
    case module_name
    when 'ActiveRecord::Base', 'ActiveRecord'
      common_methods = %w[find find_by where select joins includes order limit offset group having distinct pluck count sum average minimum maximum create update destroy save valid? errors]
      details[:methods].concat(common_methods)
      details[:class_methods].concat(%w[connection table_name primary_key column_names])
    when 'ActionController::Base', 'ActionController'
      common_methods = %w[render redirect_to respond_to before_action after_action around_action skip_before_action params session cookies request response head]
      details[:methods].concat(common_methods)
    when 'ActiveSupport::Concern'
      details[:class_methods].concat(%w[included append_features class_methods])
    when 'ActionView::Base', 'ActionView'
      common_methods = %w[render link_to button_to form_for form_with content_tag tag div span image_tag javascript_include_tag stylesheet_link_tag]
      details[:methods].concat(common_methods)
    end
    
    # Remove duplicates
    details[:methods] = details[:methods].uniq
    details[:class_methods] = details[:class_methods].uniq
  end
  
  def get_module_description(module_name)
    descriptions = {
      # ActiveSupport
      'ActiveSupport::Concern' => 'Create reusable modules with dependency resolution',
      'ActiveSupport::Callbacks' => 'Define and chain callbacks around methods',
      'ActiveSupport::Configurable' => 'Add configuration options to classes',
      'ActiveSupport::Cache' => 'Caching framework with multiple store implementations',
      'ActiveSupport::Notifications' => 'Instrumentation and notification system',
      'ActiveSupport::Dependencies' => 'Autoloading and dependency management',
      'ActiveSupport::Inflector' => 'String inflection and transformation utilities',
      
      # ActiveRecord
      'ActiveRecord::Base' => 'Primary ORM class for database models',
      'ActiveRecord::Migration' => 'Define database schema changes',
      'ActiveRecord::Associations' => 'Define relationships between models',
      'ActiveRecord::Validations' => 'Model validation framework',
      'ActiveRecord::Callbacks' => 'Lifecycle callbacks for models',
      'ActiveRecord::QueryMethods' => 'Query building interface',
      'ActiveRecord::Relation' => 'Chainable query interface',
      'ActiveRecord::Schema' => 'Database schema definition DSL',
      'ActiveRecord::ConnectionAdapters' => 'Database adapter interface',
      
      # ActionController
      'ActionController::Base' => 'Base class for all controllers',
      'ActionController::API' => 'Lightweight controller for API applications',
      'ActionController::Metal' => 'Minimal controller implementation',
      'ActionController::Rendering' => 'View rendering functionality',
      'ActionController::Redirecting' => 'HTTP redirect helpers',
      'ActionController::Cookies' => 'Cookie jar implementation',
      'ActionController::RequestForgeryProtection' => 'CSRF protection',
      'ActionController::Streaming' => 'Response streaming support',
      'ActionController::StrongParameters' => 'Parameter filtering and requiring',
      
      # ActionView
      'ActionView::Base' => 'Base class for view rendering',
      'ActionView::Helpers' => 'View helper methods',
      'ActionView::Template' => 'Template rendering engine',
      'ActionView::PartialRenderer' => 'Partial template rendering',
      'ActionView::Layouts' => 'Layout template system',
      'ActionView::FormBuilder' => 'Form generation helpers',
      
      # ActionMailer
      'ActionMailer::Base' => 'Email composition and delivery',
      'ActionMailer::MessageDelivery' => 'Email delivery interface',
      'ActionMailer::Preview' => 'Email preview functionality',
      
      # ActiveJob
      'ActiveJob::Base' => 'Background job framework',
      'ActiveJob::QueueAdapters' => 'Queue backend adapters',
      'ActiveJob::Enqueuing' => 'Job enqueuing interface',
      
      # ActionCable
      'ActionCable::Channel' => 'WebSocket channel implementation',
      'ActionCable::Connection' => 'WebSocket connection handling',
      'ActionCable::Server' => 'WebSocket server implementation',
      
      # ActiveStorage
      'ActiveStorage::Attached' => 'File attachment associations',
      'ActiveStorage::Blob' => 'File blob representation',
      'ActiveStorage::Service' => 'Storage service abstraction',
      
      # Rails
      'Rails::Application' => 'Main application configuration class',
      'Rails::Engine' => 'Create mountable sub-applications',
      'Rails::Railtie' => 'Rails initialization hooks',
      'Rails::Generators' => 'Code generation framework'
    }
    
    descriptions[module_name] || "#{module_name.split('::').last} module"
  end

  def get_class_description(class_name)
    # Reuse module descriptions where applicable
    desc = get_module_description(class_name)
    return desc unless desc.end_with?('module')

    # Add class-specific descriptions
    class_descriptions = {
      'ActiveRecord::Base' => 'Base class for all ActiveRecord models',
      'ActiveRecord::Migration' => 'Base class for database migrations',
      'ActiveRecord::Relation' => 'Represents a database query',
      'ActionController::Base' => 'Base class for all controllers',
      'ActionController::API' => 'Base class for API-only controllers',
      'ActionView::Base' => 'Base class for view rendering',
      'ActionMailer::Base' => 'Base class for mailers',
      'ActiveJob::Base' => 'Base class for background jobs',
      'ActionCable::Channel::Base' => 'Base class for WebSocket channels',
      'ActionCable::Connection::Base' => 'Base class for WebSocket connections'
    }

    class_descriptions[class_name] || "#{class_name.split('::').last} class"
  end
end