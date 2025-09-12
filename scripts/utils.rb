#!/usr/bin/env ruby

require 'find'
require 'pathname'

class FileExtensionCounter
  # Default to Rails framework directory relative to script location
  SCRIPT_DIR = File.dirname(File.expand_path(__FILE__))
  RAILS_DIR = File.join(SCRIPT_DIR, 'tmp', 'rails')
  DEFAULT_DIR = File.exist?(RAILS_DIR) ? RAILS_DIR : '.'
  
  def initialize(directory = DEFAULT_DIR)
    @directory = directory
    @extensions = Hash.new(0)
    @ignored_dirs = ['.git', 'node_modules', 'tmp', 'log', 'coverage', '.bundle', 'vendor/bundle']
  end

  def count_extensions
    Find.find(@directory) do |path|
      # Skip if it's a directory
      if File.directory?(path)
        # Prune ignored directories
        dir_name = File.basename(path)
        if @ignored_dirs.include?(dir_name) || path.include?('/.git/')
          Find.prune
        end
        next
      end

      # Skip symlinks
      next if File.symlink?(path)

      # Get the file extension
      pathname = Pathname.new(path)
      ext = pathname.extname.downcase
      
      # Handle files without extensions
      if ext.empty?
        basename = File.basename(path)
        # Check for common dotfiles or special files
        if basename.start_with?('.')
          ext = "[dotfile: #{basename}]"
        elsif basename == 'Gemfile' || basename == 'Rakefile' || basename == 'Guardfile' || basename == 'Capfile'
          ext = "[#{basename}]"
        else
          ext = "[no extension]"
        end
      end

      @extensions[ext] += 1
    end

    @extensions
  end

  def print_results(sort_by: :count)
    results = count_extensions
    
    if results.empty?
      puts "No files found in #{@directory}"
      return
    end

    # Sort results
    sorted = case sort_by
    when :count
      results.sort_by { |_, count| -count }
    when :name
      results.sort_by { |ext, _| ext }
    else
      results.to_a
    end

    # Calculate column widths for pretty printing
    max_ext_length = sorted.map { |ext, _| ext.length }.max
    max_count_length = sorted.map { |_, count| count.to_s.length }.max
    total_files = results.values.sum

    # Print header
    puts "\n" + "=" * 60
    puts "File Extension Analysis for: #{File.expand_path(@directory)}"
    puts "=" * 60
    
    # Print column headers
    printf "%-#{max_ext_length + 2}s %#{max_count_length + 2}s  %s\n", "Extension", "Count", "Percentage"
    puts "-" * 60

    # Print each extension
    sorted.each do |ext, count|
      percentage = (count.to_f / total_files * 100).round(2)
      printf "%-#{max_ext_length + 2}s %#{max_count_length + 2}d  %6.2f%%\n", ext, count, percentage
    end

    # Print summary
    puts "-" * 60
    puts "Total unique extensions: #{results.size}"
    puts "Total files: #{total_files}"
    puts "=" * 60
  end

  def to_hash
    count_extensions
  end

  def to_json
    require 'json'
    count_extensions.to_json
  end
end

# Main execution
if __FILE__ == $0
  require 'optparse'

  # Default to Rails directory relative to script location
  script_dir = File.dirname(File.expand_path(__FILE__))
  rails_dir = File.join(script_dir, 'tmp', 'rails')
  default_dir = File.exist?(rails_dir) ? rails_dir : '.'
  
  options = {
    directory: default_dir,
    sort: :count,
    format: :pretty
  }

  OptionParser.new do |opts|
    opts.banner = "Usage: #{$0} [options]"

    opts.on("-d", "--directory DIR", "Directory to analyze (default: current directory)") do |dir|
      options[:directory] = dir
    end

    opts.on("-s", "--sort TYPE", [:count, :name], "Sort by count or name (default: count)") do |sort|
      options[:sort] = sort
    end

    opts.on("-f", "--format FORMAT", [:pretty, :json, :csv], "Output format: pretty, json, or csv (default: pretty)") do |format|
      options[:format] = format
    end

    opts.on("-h", "--help", "Show this help message") do
      puts opts
      exit
    end
  end.parse!

  counter = FileExtensionCounter.new(options[:directory])

  case options[:format]
  when :json
    puts counter.to_json
  when :csv
    require 'csv'
    results = counter.count_extensions
    sorted = results.sort_by { |_, count| -count }
    puts "Extension,Count"
    sorted.each do |ext, count|
      puts "\"#{ext}\",#{count}"
    end
  else
    counter.print_results(sort_by: options[:sort])
  end
end