# Extract gem information from Rails source

require 'pathname'

class GemExtractor
  def extract_description(gem_path)
    gemspec_path = find_gemspec(gem_path)
    return default_description(File.basename(gem_path)) unless gemspec_path
    
    content = File.read(gemspec_path)
    
    # Extract description from gemspec
    if content =~ /\.description\s*=\s*["']([^"']+)["']/
      $1.strip
    elsif content =~ /\.summary\s*=\s*["']([^"']+)["']/
      $1.strip
    else
      default_description(File.basename(gem_path))
    end
  rescue => e
    puts "    ⚠️  Error extracting description: #{e.message}"
    default_description(File.basename(gem_path))
  end
  
  def extract_version(gem_path)
    version_file = File.join(gem_path, 'lib', File.basename(gem_path), 'version.rb')
    
    if File.exist?(version_file)
      content = File.read(version_file)
      if content =~ /VERSION\s*=\s*["']([^"']+)["']/
        return $1
      end
    end
    
    '8.0.0'
  end
  
  def extract_metadata(gem_path)
    gemspec_path = find_gemspec(gem_path)
    return {} unless gemspec_path
    
    metadata = {}
    content = File.read(gemspec_path)
    
    # Extract various metadata
    metadata[:homepage] = $1 if content =~ /\.homepage\s*=\s*["']([^"']+)["']/
    metadata[:license] = $1 if content =~ /\.license\s*=\s*["']([^"']+)["']/
    metadata[:authors] = extract_authors(content)
    
    metadata
  end
  
  private
  
  def find_gemspec(gem_path)
    Dir.glob(File.join(gem_path, '*.gemspec')).first
  end
  
  def extract_authors(gemspec_content)
    if gemspec_content =~ /\.authors?\s*=\s*\[([^\]]+)\]/
      $1.scan(/["']([^"']+)["']/).flatten
    else
      []
    end
  end
  
  def default_description(gem_name)
    descriptions = {
      'actioncable' => 'WebSocket framework for Rails',
      'actionmailbox' => 'Inbound email routing for Rails',
      'actionmailer' => 'Email composition and delivery framework',
      'actionpack' => 'Web request routing and handling',
      'actiontext' => 'Rich text content and editing',
      'actionview' => 'View template rendering framework',
      'activejob' => 'Background job processing framework',
      'activemodel' => 'Model layer abstractions',
      'activerecord' => 'Object-Relational Mapping (ORM) framework',
      'activestorage' => 'File upload and storage management',
      'activesupport' => 'Core extensions and utilities',
      'railties' => 'Rails core engine and generators'
    }
    
    descriptions[gem_name] || "Rails #{gem_name} component"
  end
end