# Count lines of code in Rails gems

require 'pathname'

class LocCounter
  def count(gem_path)
    total_lines = 0
    code_lines = 0
    comment_lines = 0
    blank_lines = 0
    
    # Count only Ruby files in lib directory (main source code)
    Dir.glob(File.join(gem_path, 'lib', '**', '*.rb')).each do |file|
      begin
        File.readlines(file).each do |line|
          total_lines += 1
          stripped = line.strip
          
          if stripped.empty?
            blank_lines += 1
          elsif stripped.start_with?('#')
            comment_lines += 1
          else
            code_lines += 1
          end
        end
      rescue => e
        # Skip files that can't be read
      end
    end
    
    code_lines
  end
  
  def count_detailed(gem_path)
    stats = {
      total: 0,
      code: 0,
      comments: 0,
      blank: 0,
      files: 0,
      ruby_files: 0,
      test_files: 0
    }
    
    # Count Ruby source files
    Dir.glob(File.join(gem_path, 'lib', '**', '*.rb')).each do |file|
      stats[:files] += 1
      stats[:ruby_files] += 1
      
      File.readlines(file).each do |line|
        stats[:total] += 1
        stripped = line.strip
        
        if stripped.empty?
          stats[:blank] += 1
        elsif stripped.start_with?('#')
          stats[:comments] += 1
        else
          stats[:code] += 1
        end
      end
    rescue
      # Skip unreadable files
    end
    
    # Count test files separately
    test_patterns = ['test/**/*.rb', 'spec/**/*.rb']
    test_patterns.each do |pattern|
      Dir.glob(File.join(gem_path, pattern)).each do |file|
        stats[:test_files] += 1
      end
    end
    
    stats
  end
  
  def count_by_file_type(gem_path)
    file_types = Hash.new(0)
    
    Dir.glob(File.join(gem_path, '**', '*')).each do |file|
      next if File.directory?(file)
      
      ext = File.extname(file)
      file_types[ext] += 1 unless ext.empty?
    end
    
    file_types
  end
  
  def largest_files(gem_path, limit = 10)
    files_with_size = []
    
    Dir.glob(File.join(gem_path, 'lib', '**', '*.rb')).each do |file|
      begin
        lines = File.readlines(file).size
        files_with_size << {
          path: file.sub(gem_path + '/', ''),
          lines: lines
        }
      rescue
        # Skip unreadable files
      end
    end
    
    files_with_size.sort_by { |f| -f[:lines] }.take(limit)
  end
end