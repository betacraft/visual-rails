# Map dependencies between Rails gems

require 'pathname'

class DependencyMapper
  def extract_dependencies(gem_path)
    gemspec_path = find_gemspec(gem_path)
    return [] unless gemspec_path
    
    dependencies = []
    content = File.read(gemspec_path)
    
    # Parse runtime dependencies (format: s.add_dependency "name", version)
    content.scan(/s\.add_dependency\s+["']([^"']+)["']/) do |match|
      dep_name = match[0]
      # Only include Rails gems and common dependencies
      if rails_gem?(dep_name) || common_dependency?(dep_name)
        dependencies << dep_name
      end
    end
    
    # Also check for add_runtime_dependency (less common but might exist)
    content.scan(/s\.add_runtime_dependency\s+["']([^"']+)["']/) do |match|
      dep_name = match[0]
      if rails_gem?(dep_name) || common_dependency?(dep_name)
        dependencies << dep_name
      end
    end
    
    dependencies.uniq
  rescue => e
    puts "    ⚠️  Error extracting dependencies: #{e.message}"
    []
  end
  
  def extract_dev_dependencies(gem_path)
    gemspec_path = find_gemspec(gem_path)
    return [] unless gemspec_path
    
    dev_dependencies = []
    content = File.read(gemspec_path)
    
    # Parse development dependencies (format: s.add_development_dependency "name", version)
    content.scan(/s\.add_development_dependency\s+["']([^"']+)["']/) do |match|
      dev_dependencies << match[0]
    end
    
    dev_dependencies.uniq
  end
  
  def map_internal_dependencies(gems_data)
    dependency_map = {}
    
    gems_data.each do |gem|
      gem_dependencies = gem[:dependencies] || []
      
      # Filter to only Rails internal dependencies
      internal_deps = gem_dependencies.select { |dep| rails_gem?(dep) }
      
      dependency_map[gem[:id]] = internal_deps unless internal_deps.empty?
    end
    
    dependency_map
  end
  
  def calculate_dependency_graph(gems_data)
    nodes = []
    edges = []
    
    # Create nodes
    gems_data.each do |gem|
      nodes << {
        id: gem[:id],
        name: gem[:name],
        group: categorize_gem_group(gem[:id])
      }
    end
    
    # Create edges
    gems_data.each do |gem|
      (gem[:dependencies] || []).each do |dep|
        if gems_data.any? { |g| g[:id] == dep }
          edges << {
            source: gem[:id],
            target: dep,
            value: 1
          }
        end
      end
    end
    
    { nodes: nodes, edges: edges }
  end
  
  private
  
  def find_gemspec(gem_path)
    Dir.glob(File.join(gem_path, '*.gemspec')).first
  end
  
  def rails_gem?(gem_name)
    %w[
      actioncable actionmailbox actionmailer actionpack actiontext
      actionview activejob activemodel activerecord activestorage
      activesupport railties rails
    ].include?(gem_name)
  end
  
  def common_dependency?(gem_name)
    %w[
      thor zeitwerk concurrent-ruby tzinfo i18n
      rack rack-test erubi builder mail
      nokogiri websocket-driver nio4r
    ].include?(gem_name)
  end
  
  def categorize_gem_group(gem_name)
    case gem_name
    when /^action/
      'action'
    when /^active/
      'active'
    when 'railties', 'rails'
      'core'
    else
      'other'
    end
  end
end