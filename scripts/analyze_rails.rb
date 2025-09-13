#!/usr/bin/env ruby
# Main script to analyze Rails 8.0 source code and generate visualization data

require 'json'
require 'pathname'
require 'time'
require_relative 'gem_extractor'
require_relative 'dependency_mapper'
require_relative 'module_parser'
require_relative 'loc_counter'

class RailsAnalyzer
  RAILS_REPO = 'https://github.com/rails/rails.git'
  RAILS_VERSION = 'v8.0.0'
  RAILS_PATH = './tmp/rails'
  OUTPUT_PATH = '../app/data/rails_structure_real.json'
  
  # Core Rails gems to analyze
  RAILS_GEMS = %w[
    actioncable
    actionmailbox
    actionmailer
    actionpack
    actiontext
    actionview
    activejob
    activemodel
    activerecord
    activestorage
    activesupport
    railties
  ]
  
  def initialize
    @gem_extractor = GemExtractor.new
    @dependency_mapper = DependencyMapper.new
    @module_parser = ModuleParser.new
    @loc_counter = LocCounter.new
  end
  
  def run
    puts "Rails Source Code Analyzer"
    puts "=" * 50
    
    ensure_rails_repo
    
    gems_data = analyze_gems
    dependencies_data = map_dependencies(gems_data)
    
    result = {
      version: get_rails_version,
      generated_at: Time.now.strftime('%Y-%m-%d'),
      generated_by: 'script',
      gems: gems_data,
      dependencies: dependencies_data,
      stats: generate_stats(gems_data)
    }
    
    save_results(result)
    
    puts "\n✅ Analysis complete! Results saved to #{OUTPUT_PATH}"
  end
  
  private
  
  def ensure_rails_repo
    if Dir.exist?(RAILS_PATH)
      puts "📁 Using existing Rails repository at #{RAILS_PATH}"
      update_rails_repo
    else
      puts "📥 Cloning Rails repository..."
      system("git clone --depth 1 --branch #{RAILS_VERSION} #{RAILS_REPO} #{RAILS_PATH}")
    end
  end
  
  def update_rails_repo
    Dir.chdir(RAILS_PATH) do
      puts "🔄 Checking Rails repository..."
      # Skip update if already on correct version
      current_branch = `git rev-parse --abbrev-ref HEAD`.strip
      puts "  Current: #{current_branch}"
    end
  end
  
  def get_rails_version
    version_file = File.join(RAILS_PATH, 'RAILS_VERSION')
    if File.exist?(version_file)
      File.read(version_file).strip
    else
      '8.0.0'
    end
  end
  
  def analyze_gems
    puts "\n🔍 Analyzing Rails gems..."
    
    gems = []
    
    RAILS_GEMS.each do |gem_name|
      gem_path = File.join(RAILS_PATH, gem_name)
      
      if Dir.exist?(gem_path)
        print "  Analyzing #{gem_name}..."
        
        gem_data = {
          id: gem_name,
          name: gem_name,
          description: @gem_extractor.extract_description(gem_path),
          type: categorize_gem(gem_name),
          loc: @loc_counter.count(gem_path),
          modules: @module_parser.parse_modules(gem_path),
          classes: @module_parser.parse_classes(gem_path),
          dependencies: @dependency_mapper.extract_dependencies(gem_path),
          color: get_gem_color(gem_name)
        }
        
        # Add module details for ALL modules (or limit to top modules for performance)
        if gem_data[:modules].any?
          gem_data[:moduleDetails] = {}
          # Process more modules but set a reasonable limit to avoid huge files
          modules_to_process = gem_data[:modules].take(20) # Increased from 5 to 20
          
          modules_to_process.each do |module_name|
            print "."
            details = @module_parser.get_module_details(gem_path, module_name)
            # Only include modules that have methods or important components
            if details[:methods].any? || details[:class_methods].any? || details[:components].any?
              gem_data[:moduleDetails][module_name] = details
            end
          end
        end
        
        gems << gem_data
        puts " ✓ (#{gem_data[:loc]} LOC, #{gem_data[:modules].size} modules)"
      else
        puts "  ⚠️  #{gem_name} not found at #{gem_path}"
      end
    end
    
    # Add the meta 'rails' gem
    gems << {
      id: 'rails',
      name: 'rails',
      description: 'Full-stack web application framework',
      type: 'framework',
      loc: gems.sum { |g| g[:loc] },
      modules: [],
      dependencies: RAILS_GEMS,
      color: '#CC0000'
    }
    
    gems
  end
  
  def categorize_gem(gem_name)
    case gem_name
    when /action/
      'web'
    when /active/
      'core'
    when 'railties'
      'framework'
    else
      'utility'
    end
  end
  
  def get_gem_color(gem_name)
    colors = {
      'actioncable' => '#00BCD4',
      'actionmailbox' => '#9C27B0',
      'actionmailer' => '#673AB7',
      'actionpack' => '#1976D2',
      'actiontext' => '#3F51B5',
      'actionview' => '#2196F3',
      'activejob' => '#FF9800',
      'activemodel' => '#4CAF50',
      'activerecord' => '#2E7D32',
      'activestorage' => '#FF5722',
      'activesupport' => '#4A90E2',
      'railties' => '#CC0000'
    }
    colors[gem_name] || '#757575'
  end
  
  def map_dependencies(gems_data)
    puts "\n🔗 Mapping dependencies..."
    
    dependencies = []
    
    gems_data.each do |gem|
      next if gem[:id] == 'rails'
      
      gem[:dependencies].each do |dep|
        # Only include dependencies to other Rails gems
        if RAILS_GEMS.include?(dep) || dep == 'rails'
          dependencies << {
            source: gem[:id],  # gem depends on dep
            target: dep,       # so arrow goes from gem to dep
            strength: calculate_dependency_strength(dep, gem[:id])
          }
        end
      end
    end
    
    # Add rails gem dependencies
    RAILS_GEMS.each do |gem_name|
      dependencies << {
        source: 'rails',
        target: gem_name,
        strength: 10
      }
    end
    
    dependencies.uniq { |d| "#{d[:source]}-#{d[:target]}" }
  end
  
  def calculate_dependency_strength(source, target)
    # Core dependencies are stronger
    return 10 if source == 'activesupport'
    return 8 if source == 'activemodel'
    return 6 if source == 'actionpack'
    return 5 if source == 'railties'
    3
  end
  
  def generate_stats(gems_data)
    {
      total_loc: gems_data.sum { |g| g[:loc] },
      total_modules: gems_data.sum { |g| g[:modules]&.size || 0 },
      total_classes: gems_data.sum { |g| g[:classes]&.size || 0 },
      gem_count: gems_data.size - 1, # Exclude the meta 'rails' gem
      analyzed_at: Time.now.iso8601
    }
  end
  
  def save_results(data)
    File.write(OUTPUT_PATH, JSON.pretty_generate(data))
  end
end

# Run the analyzer if this script is executed directly
if __FILE__ == $0
  analyzer = RailsAnalyzer.new
  analyzer.run
end