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
      loc: 0
    }
    
    # Find the file that defines this module
    module_file = find_module_file(gem_path, module_name)
    
    if module_file && File.exist?(module_file)
      content = File.read(module_file)
      
      # Extract public methods
      in_module = false
      current_indent = 0
      
      content.lines.each do |line|
        if line =~ /^\s*module\s+#{Regexp.escape(module_name.split('::').last)}/
          in_module = true
          current_indent = line[/^\s*/].length
        elsif in_module && line =~ /^\s{#{current_indent}}end/
          in_module = false
        elsif in_module
          # Find method definitions
          if line =~ /^\s*def\s+([a-z_][a-z0-9_]*[!?=]?)/
            method_name = $1
            details[:methods] << method_name unless method_name.start_with?('_')
          end
          
          # Find included modules
          if line =~ /^\s*include\s+([A-Z][A-Za-z0-9_:]*)/
            details[:components] << $1
          end
          
          # Find extended modules
          if line =~ /^\s*extend\s+([A-Z][A-Za-z0-9_:]*)/
            details[:components] << $1
          end
        end
      end
      
      details[:loc] = content.lines.count
    end
    
    # Limit methods to most important ones
    details[:methods] = details[:methods].take(10)
    details[:components] = details[:components].take(5)
    
    details
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
  
  def get_module_description(module_name)
    descriptions = {
      'ActiveSupport::Concern' => 'Create reusable modules with dependency resolution',
      'ActiveSupport::Callbacks' => 'Define and chain callbacks around methods',
      'ActiveSupport::Configurable' => 'Add configuration options to classes',
      'ActiveRecord::Base' => 'Primary ORM class for database models',
      'ActiveRecord::Migration' => 'Define database schema changes',
      'ActiveRecord::Associations' => 'Define relationships between models',
      'ActionController::Base' => 'Base class for all controllers',
      'ActionView::Base' => 'Base class for view rendering',
      'Rails::Application' => 'Main application configuration class',
      'Rails::Engine' => 'Create mountable sub-applications'
    }
    
    descriptions[module_name] || "#{module_name.split('::').last} module"
  end
end