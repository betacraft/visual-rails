#!/usr/bin/env ruby
# Analyze git commits and create a procrastination graph

require 'date'
require 'json'

class ProcrastinationAnalyzer
  def initialize
    @commit_data = []
  end

  def run
    puts "🔍 Analyzing repository commit history..."
    
    # Change to parent directory (repository root)
    Dir.chdir('..') do
      collect_commit_data
    end
    
    aggregate_by_date
    generate_html_graph
    
    puts "✅ Graph generated: tmp/procrastination_graph.html"
    puts "📊 Total commits analyzed: #{@commit_data.size}"
    puts "📅 Date range: #{@aggregated_data.keys.min} to #{@aggregated_data.keys.max}"
  end

  private

  def collect_commit_data
    # Get commit data with stats
    git_log = `git log --all --numstat --pretty=format:"%H|%ad|%an|%s" --date=short`
    
    current_commit = nil
    git_log.each_line do |line|
      line = line.strip
      
      if line.include?('|')
        # This is a commit header
        parts = line.split('|')
        current_commit = {
          hash: parts[0],
          date: parts[1],
          author: parts[2],
          message: parts[3] || '',
          additions: 0,
          deletions: 0
        }
        @commit_data << current_commit
      elsif line =~ /^(\d+|-)\s+(\d+|-)\s+(.+)$/
        # This is a file change stat
        additions = $1 == '-' ? 0 : $1.to_i
        deletions = $2 == '-' ? 0 : $2.to_i
        
        if current_commit
          current_commit[:additions] += additions
          current_commit[:deletions] += deletions
        end
      end
    end
  end

  def aggregate_by_date
    @aggregated_data = {}
    
    @commit_data.each do |commit|
      date = commit[:date]
      next unless date
      
      @aggregated_data[date] ||= {
        commits: 0,
        additions: 0,
        deletions: 0,
        total_changes: 0,
        messages: []
      }
      
      @aggregated_data[date][:commits] += 1
      @aggregated_data[date][:additions] += commit[:additions]
      @aggregated_data[date][:deletions] += commit[:deletions]
      @aggregated_data[date][:total_changes] += (commit[:additions] + commit[:deletions])
      @aggregated_data[date][:messages] << commit[:message][0..50] # First 50 chars
    end
    
    # Sort by date
    @aggregated_data = @aggregated_data.sort.to_h
  end

  def generate_html_graph
    # Prepare data for Chart.js
    dates = @aggregated_data.keys
    total_changes = @aggregated_data.values.map { |v| v[:total_changes] }
    additions = @aggregated_data.values.map { |v| v[:additions] }
    deletions = @aggregated_data.values.map { |v| v[:deletions] }
    commit_counts = @aggregated_data.values.map { |v| v[:commits] }
    
    # Calculate statistics
    max_changes = total_changes.max || 0
    avg_changes = total_changes.sum.to_f / total_changes.size
    total_commits = commit_counts.sum
    
    # Fill in missing dates with zeros for better visualization
    if dates.any?
      start_date = Date.parse(dates.first)
      end_date = Date.parse(dates.last)
      all_dates = []
      filled_changes = []
      filled_additions = []
      filled_deletions = []
      filled_commits = []
      
      (start_date..end_date).each do |date|
        date_str = date.to_s
        all_dates << date_str
        
        if @aggregated_data[date_str]
          filled_changes << @aggregated_data[date_str][:total_changes]
          filled_additions << @aggregated_data[date_str][:additions]
          filled_deletions << @aggregated_data[date_str][:deletions]
          filled_commits << @aggregated_data[date_str][:commits]
        else
          filled_changes << 0
          filled_additions << 0
          filled_deletions << 0
          filled_commits << 0
        end
      end
      
      dates = all_dates
      total_changes = filled_changes
      additions = filled_additions
      deletions = filled_deletions
      commit_counts = filled_commits
    end
    
    html_content = <<~HTML
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Repository Activity Timeline - Procrastination Analysis</title>
        <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
        <script src="https://cdn.jsdelivr.net/npm/date-fns@2.29.3/index.min.js"></script>
        <style>
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            padding: 20px;
          }
          
          .container {
            max-width: 1400px;
            margin: 0 auto;
          }
          
          .header {
            text-align: center;
            color: white;
            margin-bottom: 30px;
          }
          
          .header h1 {
            font-size: 2.5em;
            margin-bottom: 10px;
            text-shadow: 2px 2px 4px rgba(0,0,0,0.2);
          }
          
          .stats {
            display: flex;
            justify-content: center;
            gap: 40px;
            margin-bottom: 20px;
          }
          
          .stat-card {
            background: rgba(255,255,255,0.1);
            padding: 15px 25px;
            border-radius: 10px;
            backdrop-filter: blur(10px);
          }
          
          .stat-value {
            font-size: 2em;
            font-weight: bold;
            color: #ffd700;
          }
          
          .stat-label {
            font-size: 0.9em;
            opacity: 0.9;
            margin-top: 5px;
          }
          
          .chart-container {
            background: white;
            border-radius: 20px;
            padding: 30px;
            box-shadow: 0 20px 60px rgba(0,0,0,0.3);
            margin-bottom: 30px;
          }
          
          .chart-wrapper {
            position: relative;
            height: 500px;
          }
          
          .insights {
            background: white;
            border-radius: 20px;
            padding: 30px;
            box-shadow: 0 20px 60px rgba(0,0,0,0.3);
          }
          
          .insights h2 {
            color: #333;
            margin-bottom: 20px;
            font-size: 1.5em;
          }
          
          .insight-item {
            padding: 15px;
            margin-bottom: 15px;
            border-left: 4px solid #667eea;
            background: #f8f9fa;
            border-radius: 5px;
          }
          
          .insight-title {
            font-weight: bold;
            color: #333;
            margin-bottom: 5px;
          }
          
          .insight-value {
            color: #666;
          }
          
          .procrastination-indicator {
            display: inline-block;
            padding: 5px 10px;
            border-radius: 20px;
            font-size: 0.9em;
            font-weight: bold;
            margin-left: 10px;
          }
          
          .low-activity {
            background: #ff6b6b;
            color: white;
          }
          
          .medium-activity {
            background: #ffd93d;
            color: #333;
          }
          
          .high-activity {
            background: #6bcf7f;
            color: white;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>📊 Repository Activity Timeline</h1>
            <div class="stats">
              <div class="stat-card">
                <div class="stat-value">#{total_commits}</div>
                <div class="stat-label">Total Commits</div>
              </div>
              <div class="stat-card">
                <div class="stat-value">#{dates.size}</div>
                <div class="stat-label">Days Tracked</div>
              </div>
              <div class="stat-card">
                <div class="stat-value">#{(total_changes.sum.to_f / 1000).round(1)}k</div>
                <div class="stat-label">Lines Changed</div>
              </div>
              <div class="stat-card">
                <div class="stat-value">#{dates.count { |d, i| total_changes[dates.index(d)] == 0 }}</div>
                <div class="stat-label">Days of Procrastination 😴</div>
              </div>
            </div>
          </div>
          
          <div class="chart-container">
            <div class="chart-wrapper">
              <canvas id="activityChart"></canvas>
            </div>
          </div>
          
          <div class="chart-container">
            <div class="chart-wrapper">
              <canvas id="commitChart"></canvas>
            </div>
          </div>
          
          <div class="insights">
            <h2>📈 Activity Insights</h2>
            <div class="insight-item">
              <div class="insight-title">Most Productive Day</div>
              <div class="insight-value">#{dates[total_changes.index(max_changes)]} with #{max_changes} lines changed</div>
            </div>
            <div class="insight-item">
              <div class="insight-title">Average Daily Changes</div>
              <div class="insight-value">#{avg_changes.round(1)} lines per active day</div>
            </div>
            <div class="insight-item">
              <div class="insight-title">Longest Streak</div>
              <div class="insight-value" id="longestStreak">Calculating...</div>
            </div>
            <div class="insight-item">
              <div class="insight-title">Procrastination Periods</div>
              <div class="insight-value" id="procrastinationPeriods">Analyzing...</div>
            </div>
          </div>
        </div>
        
        <script>
          const dates = #{dates.to_json};
          const totalChanges = #{total_changes.to_json};
          const additions = #{additions.to_json};
          const deletions = #{deletions.to_json};
          const commitCounts = #{commit_counts.to_json};
          
          // Activity Chart (Lines Changed)
          const activityCtx = document.getElementById('activityChart').getContext('2d');
          new Chart(activityCtx, {
            type: 'bar',
            data: {
              labels: dates,
              datasets: [
                {
                  label: 'Additions',
                  data: additions,
                  backgroundColor: 'rgba(75, 192, 192, 0.6)',
                  borderColor: 'rgba(75, 192, 192, 1)',
                  borderWidth: 1
                },
                {
                  label: 'Deletions',
                  data: deletions,
                  backgroundColor: 'rgba(255, 99, 132, 0.6)',
                  borderColor: 'rgba(255, 99, 132, 1)',
                  borderWidth: 1
                }
              ]
            },
            options: {
              responsive: true,
              maintainAspectRatio: false,
              plugins: {
                title: {
                  display: true,
                  text: 'Daily Code Changes (Lines Added vs Deleted)',
                  font: { size: 16 }
                },
                tooltip: {
                  callbacks: {
                    footer: function(context) {
                      const index = context[0].dataIndex;
                      const total = additions[index] + deletions[index];
                      return 'Total: ' + total + ' lines';
                    }
                  }
                }
              },
              scales: {
                x: {
                  stacked: true,
                  ticks: {
                    maxRotation: 45,
                    minRotation: 45
                  }
                },
                y: {
                  stacked: true,
                  beginAtZero: true,
                  title: {
                    display: true,
                    text: 'Lines Changed'
                  }
                }
              }
            }
          });
          
          // Commit Frequency Chart
          const commitCtx = document.getElementById('commitChart').getContext('2d');
          new Chart(commitCtx, {
            type: 'line',
            data: {
              labels: dates,
              datasets: [{
                label: 'Number of Commits',
                data: commitCounts,
                borderColor: 'rgb(102, 126, 234)',
                backgroundColor: 'rgba(102, 126, 234, 0.1)',
                tension: 0.1,
                fill: true
              }]
            },
            options: {
              responsive: true,
              maintainAspectRatio: false,
              plugins: {
                title: {
                  display: true,
                  text: 'Commit Frequency Over Time',
                  font: { size: 16 }
                }
              },
              scales: {
                x: {
                  ticks: {
                    maxRotation: 45,
                    minRotation: 45
                  }
                },
                y: {
                  beginAtZero: true,
                  title: {
                    display: true,
                    text: 'Number of Commits'
                  }
                }
              }
            }
          });
          
          // Calculate insights
          function calculateStreaks() {
            let currentStreak = 0;
            let longestStreak = 0;
            let procrastinationPeriods = [];
            let currentGap = 0;
            let gapStart = null;
            
            for (let i = 0; i < commitCounts.length; i++) {
              if (commitCounts[i] > 0) {
                currentStreak++;
                if (currentStreak > longestStreak) {
                  longestStreak = currentStreak;
                }
                
                if (currentGap > 0) {
                  procrastinationPeriods.push({
                    start: gapStart,
                    end: dates[i-1],
                    days: currentGap
                  });
                  currentGap = 0;
                  gapStart = null;
                }
              } else {
                currentStreak = 0;
                if (currentGap === 0) {
                  gapStart = dates[i];
                }
                currentGap++;
              }
            }
            
            document.getElementById('longestStreak').textContent = 
              `${longestStreak} consecutive days of activity`;
            
            if (procrastinationPeriods.length > 0) {
              const longest = procrastinationPeriods.reduce((max, p) => p.days > max.days ? p : max);
              document.getElementById('procrastinationPeriods').innerHTML = 
                `Found ${procrastinationPeriods.length} periods of inactivity<br>` +
                `Longest: ${longest.days} days (${longest.start} to ${longest.end})`;
            } else {
              document.getElementById('procrastinationPeriods').textContent = 
                'No significant procrastination periods detected! 🎉';
            }
          }
          
          calculateStreaks();
        </script>
      </body>
      </html>
    HTML
    
    # Ensure tmp directory exists
    Dir.mkdir('tmp') unless Dir.exist?('tmp')
    
    # Write HTML file
    File.write('tmp/procrastination_graph.html', html_content)
  end
end

# Run the analyzer
if __FILE__ == $0
  analyzer = ProcrastinationAnalyzer.new
  analyzer.run
end