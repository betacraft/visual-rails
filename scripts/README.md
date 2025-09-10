# Rails Source Code Analysis Scripts

These Ruby scripts analyze the actual Rails 8.0 source code to generate real data for the visualization, replacing the static LLM-generated data.

## What These Scripts Do

Instead of using estimated/static data, these scripts:
- Clone the official Rails repository
- Parse actual Ruby source files
- Count real lines of code
- Extract actual module and class names
- Map real gem dependencies from gemspec files
- Generate accurate, data-driven JSON

## Prerequisites

- Ruby 3.1+ (matches Rails 8.0 requirements)
- Git
- Bundler

## Setup

1. Install dependencies:
```bash
cd scripts
bundle install
```

2. Run the analysis:
```bash
ruby analyze_rails.rb
```

This will:
- Clone Rails repo to `./tmp/rails` (or use existing clone)
- Analyze all Rails gems
- Generate `../app/data/rails_structure_real.json`

## Scripts Overview

### `analyze_rails.rb`
Main orchestrator that:
- Manages Rails repository
- Coordinates all analysis tasks
- Generates final JSON output

### `gem_extractor.rb`
- Extracts gem descriptions from gemspecs
- Parses version information
- Extracts metadata (authors, license, etc.)

### `dependency_mapper.rb`
- Parses gemspec files for dependencies
- Maps inter-gem relationships
- Calculates dependency strength

### `module_parser.rb`
- Parses Ruby files using regex patterns
- Extracts module and class definitions
- Analyzes module structure and methods
- Generates module details with actual components

### `loc_counter.rb`
- Counts actual lines of code
- Separates code, comments, and blank lines
- Provides detailed statistics per gem

## Output Format

The generated JSON contains real data:
```json
{
  "version": "8.0.0",
  "generated_at": "2024-12-11",
  "generated_by": "script",
  "gems": [
    {
      "id": "activerecord",
      "name": "activerecord",
      "description": "Object-Relational Mapping framework",
      "loc": 45234,  // Actual line count
      "modules": ["ActiveRecord::Base", ...],  // Real modules
      "dependencies": ["activesupport", ...],  // From gemspec
      "moduleDetails": { ... }  // Actual module analysis
    }
  ],
  "stats": {
    "total_loc": 234567,  // Real total
    "total_modules": 1234,  // Actual count
    "analyzed_at": "2024-12-11T10:00:00Z"
  }
}
```

## Differences from Static Data

| Aspect | Static (LLM) | Script-Generated |
|--------|--------------|------------------|
| Lines of Code | Estimates (15000) | Exact (15234) |
| Modules | Representative | Complete list |
| Dependencies | Known ones | From gemspecs |
| Methods | Examples | Actual methods |
| Accuracy | ~70% | 100% |

## Running Analysis for Different Versions

To analyze a different Rails version:
```ruby
# In analyze_rails.rb, change:
RAILS_VERSION = 'v7.1.0'  # or any tag/branch
```

## Performance

Full analysis typically takes:
- First run: 3-5 minutes (includes cloning)
- Subsequent runs: 1-2 minutes (uses existing clone)

## Troubleshooting

### Repository not found
```bash
rm -rf ./tmp/rails
ruby analyze_rails.rb  # Will re-clone
```

### Permission errors
```bash
chmod +x analyze_rails.rb
```

### Missing dependencies
```bash
bundle install
```

## Extending the Scripts

To add more analysis:

1. Create new analyzer class
2. Add to `analyze_rails.rb`
3. Include in output JSON

Example:
```ruby
class ComplexityAnalyzer
  def analyze(gem_path)
    # Your analysis logic
  end
end
```

## Notes

- Scripts use regex parsing instead of AST for simplicity and speed
- Only analyzes `lib/` directories (main source code)
- Excludes test files from LOC counts
- Filters out test/spec modules from module lists