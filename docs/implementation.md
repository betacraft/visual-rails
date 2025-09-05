# Rails Visual Explorer - Implementation Guide

## Architecture Overview

This is a **frontend-only application** with no backend required. The architecture consists of:

1. **Data Generation Phase** (One-time, offline)
   - Ruby scripts to analyze Rails 8.0 source
   - Outputs static JSON data files
   
2. **Frontend Application** (React + D3.js)
   - Consumes pre-generated JSON
   - Renders interactive visualizations
   - Deployed as static site

## Project Structure

```
rails-visuals/
├── scripts/                  # Ruby scripts for data extraction
│   ├── analyze_rails.rb      # Main analysis script
│   ├── gem_extractor.rb      # Extract gem structure
│   ├── dependency_mapper.rb  # Map dependencies
│   └── class_parser.rb       # Parse classes/modules
├── data/                     # Generated JSON data
│   ├── rails_structure.json  # Main data file
│   └── gem_details/          # Detailed per-gem data
├── src/                      # React application
│   ├── App.jsx               # Main app component
│   ├── components/
│   │   ├── GraphView.jsx     # D3.js visualization
│   │   ├── InfoPanel.jsx     # Component details
│   │   ├── SearchBar.jsx     # Search functionality
│   │   └── Breadcrumb.jsx    # Navigation trail
│   └── utils/
│       ├── d3-helpers.js     # D3 utilities
│       └── data-loader.js    # Load and process JSON
├── public/
│   └── index.html
└── package.json
```

## Phase 1: Data Extraction Scripts

### Main Analysis Script
```ruby
# scripts/analyze_rails.rb
require 'json'
require 'pathname'

class RailsAnalyzer
  RAILS_VERSION = "8.0.0"
  RAILS_GEMS = %w[
    rails railties activesupport activerecord actionpack
    actionview actionmailer activejob actioncable
    activestorage actiontext actionmailbox
  ]

  def analyze
    data = {
      version: RAILS_VERSION,
      generated_at: Time.now,
      gems: extract_gems,
      dependencies: map_dependencies,
      relationships: extract_relationships
    }
    
    File.write('data/rails_structure.json', JSON.pretty_generate(data))
  end

  private

  def extract_gems
    RAILS_GEMS.map do |gem_name|
      gem_path = find_gem_path(gem_name)
      {
        name: gem_name,
        description: extract_description(gem_path),
        modules: extract_modules(gem_path),
        classes: extract_classes(gem_path),
        loc: count_lines(gem_path),
        dependencies: gem_dependencies(gem_name)
      }
    end
  end

  def extract_modules(path)
    # Parse Ruby files to find module definitions
    Dir.glob("#{path}/lib/**/*.rb").flat_map do |file|
      content = File.read(file)
      content.scan(/^\s*module\s+(\S+)/).flatten
    end.uniq
  end

  # ... more extraction methods
end

# Run the analyzer
RailsAnalyzer.new.analyze
```

### Dependency Mapper
```ruby
# scripts/dependency_mapper.rb
class DependencyMapper
  def map_gem_dependencies
    dependencies = []
    
    # Parse gemspec files
    Dir.glob("*/#{gem_name}.gemspec") do |gemspec|
      content = File.read(gemspec)
      
      # Extract runtime dependencies
      content.scan(/add_dependency\s+["'](\w+)["']/) do |dep|
        dependencies << {
          from: gem_name,
          to: dep[0],
          type: 'runtime'
        }
      end
    end
    
    dependencies
  end
end
```

### Running Data Extraction
```bash
# Clone Rails source
git clone --branch v8.0.0 https://github.com/rails/rails.git
cd rails

# Run analysis scripts
ruby scripts/analyze_rails.rb
ruby scripts/dependency_mapper.rb

# Output: data/rails_structure.json
```

## Phase 2: Frontend Implementation

### Core Technologies
- **React 18** - UI framework
- **D3.js v7** - Graph visualization
- **Vite** - Build tool (fast, modern)
- **CSS Modules** - Scoped styling

### Setup
```bash
# Create React app with Vite
npm create vite@latest rails-visuals -- --template react
cd rails-visuals
npm install

# Install dependencies
npm install d3 d3-force d3-zoom d3-selection
npm install react-router-dom
```

### Main App Component
```jsx
// src/App.jsx
import React, { useState, useEffect } from 'react';
import GraphView from './components/GraphView';
import InfoPanel from './components/InfoPanel';
import Breadcrumb from './components/Breadcrumb';
import railsData from '../data/rails_structure.json';

function App() {
  const [currentView, setCurrentView] = useState('overview');
  const [selectedNode, setSelectedNode] = useState(null);
  const [navigationPath, setNavigationPath] = useState(['Rails']);

  return (
    <div className="app">
      <header>
        <h1>Rails 8.0 Visual Explorer</h1>
        <Breadcrumb path={navigationPath} onNavigate={handleNavigate} />
      </header>
      
      <main>
        <GraphView 
          data={railsData}
          view={currentView}
          onNodeClick={handleNodeClick}
          selectedNode={selectedNode}
        />
        
        <InfoPanel 
          node={selectedNode}
          data={railsData}
        />
      </main>
    </div>
  );
}
```

### D3.js Graph Visualization
```jsx
// src/components/GraphView.jsx
import React, { useRef, useEffect } from 'react';
import * as d3 from 'd3';

function GraphView({ data, onNodeClick, selectedNode }) {
  const svgRef = useRef(null);

  useEffect(() => {
    if (!data) return;

    const svg = d3.select(svgRef.current);
    const width = svg.node().getBoundingClientRect().width;
    const height = svg.node().getBoundingClientRect().height;

    // Clear previous content
    svg.selectAll("*").remove();

    // Create force simulation
    const simulation = d3.forceSimulation(data.gems)
      .force("link", d3.forceLink(data.dependencies)
        .id(d => d.name)
        .distance(100))
      .force("charge", d3.forceManyBody().strength(-300))
      .force("center", d3.forceCenter(width / 2, height / 2))
      .force("collision", d3.forceCollide().radius(50));

    // Create links (dependencies)
    const link = svg.append("g")
      .selectAll("line")
      .data(data.dependencies)
      .enter().append("line")
      .attr("stroke", "#999")
      .attr("stroke-opacity", 0.6)
      .attr("stroke-width", d => Math.sqrt(d.weight || 1));

    // Create nodes (gems)
    const node = svg.append("g")
      .selectAll("g")
      .data(data.gems)
      .enter().append("g")
      .call(d3.drag()
        .on("start", dragstarted)
        .on("drag", dragged)
        .on("end", dragended));

    // Special shapes for special gems
    node.each(function(d) {
      const selection = d3.select(this);
      
      if (d.name === 'railties') {
        // Hexagon for Railties
        selection.append("polygon")
          .attr("points", hexagonPoints(40))
          .attr("fill", "#CC0000")
          .attr("stroke", "#fff")
          .attr("stroke-width", 2);
      } else if (d.name === 'activesupport') {
        // Rectangle for ActiveSupport (foundation)
        selection.append("rect")
          .attr("x", -40)
          .attr("y", -25)
          .attr("width", 80)
          .attr("height", 50)
          .attr("fill", "#4A90E2")
          .attr("stroke", "#fff")
          .attr("stroke-width", 2);
      } else {
        // Circles for other gems
        selection.append("circle")
          .attr("r", 30)
          .attr("fill", d => getGemColor(d.name))
          .attr("stroke", "#fff")
          .attr("stroke-width", 2);
      }
    });

    // Add labels
    node.append("text")
      .text(d => d.name)
      .attr("text-anchor", "middle")
      .attr("dy", ".35em")
      .style("fill", "white")
      .style("font-size", "12px")
      .style("pointer-events", "none");

    // Add click handler
    node.on("click", (event, d) => {
      event.stopPropagation();
      onNodeClick(d);
    });

    // Add zoom behavior
    const zoom = d3.zoom()
      .scaleExtent([0.5, 3])
      .on("zoom", (event) => {
        svg.selectAll("g").attr("transform", event.transform);
      });

    svg.call(zoom);

    // Update positions on simulation tick
    simulation.on("tick", () => {
      link
        .attr("x1", d => d.source.x)
        .attr("y1", d => d.source.y)
        .attr("x2", d => d.target.x)
        .attr("y2", d => d.target.y);

      node
        .attr("transform", d => `translate(${d.x},${d.y})`);
    });

    // Helper functions
    function hexagonPoints(radius) {
      const angles = [0, 60, 120, 180, 240, 300];
      return angles.map(angle => {
        const radian = angle * Math.PI / 180;
        return `${radius * Math.cos(radian)},${radius * Math.sin(radian)}`;
      }).join(" ");
    }

    function getGemColor(name) {
      const colors = {
        'activerecord': '#2E7D32',
        'actionpack': '#1976D2',
        'actionview': '#7B1FA2',
        // ... more colors
      };
      return colors[name] || '#757575';
    }

  }, [data, selectedNode]);

  return (
    <svg ref={svgRef} className="graph-view" width="100%" height="100%">
    </svg>
  );
}
```

## Build and Deployment

### Development
```bash
# Start development server
npm run dev
# Opens at http://localhost:5173
```

### Production Build
```bash
# Build for production
npm run build

# Preview production build
npm run preview
```

### GitHub Pages Deployment
```bash
# Install gh-pages
npm install --save-dev gh-pages

# Add to package.json
"scripts": {
  "predeploy": "npm run build",
  "deploy": "gh-pages -d dist"
}

# Deploy
npm run deploy
```

### Deployment Configuration
```javascript
// vite.config.js
export default {
  base: '/rails-visuals/', // GitHub repo name
  build: {
    outDir: 'dist'
  }
}
```

## Data Structure

### Main JSON Structure
```json
{
  "version": "8.0.0",
  "gems": [
    {
      "name": "railties",
      "description": "Rails core engine",
      "type": "core",
      "modules": ["Rails", "Rails::Application", "Rails::Engine"],
      "dependencies": ["activesupport", "actionpack"],
      "loc": 15000,
      "position": { "x": 400, "y": 300 }
    }
  ],
  "dependencies": [
    {
      "source": "railties",
      "target": "activesupport",
      "type": "runtime",
      "strength": 10
    }
  ]
}
```

## Performance Optimizations

### 1. Data Loading
- Load gem overview first (small file)
- Lazy load detailed data when drilling down
- Use React Suspense for async loading

### 2. Rendering
- Virtual DOM with React
- D3.js canvas rendering for >1000 nodes
- RequestAnimationFrame for smooth animations

### 3. Interaction
- Debounced search
- Memoized computations
- CSS transforms for smooth zoom

## Presentation Mode

### Features
- Fullscreen toggle (F11)
- Keyboard navigation (arrow keys)
- Predefined views (number keys 1-4)
- Hide UI chrome (H key)

### Implementation
```jsx
// Keyboard shortcuts
useEffect(() => {
  const handleKeyPress = (e) => {
    switch(e.key) {
      case '1': showOverview(); break;
      case '2': showActiveRecord(); break;
      case '3': showRequestFlow(); break;
      case 'f': toggleFullscreen(); break;
      case 'h': toggleUIChrome(); break;
    }
  };
  
  window.addEventListener('keypress', handleKeyPress);
  return () => window.removeEventListener('keypress', handleKeyPress);
}, []);
```

## Summary

**No Backend Needed**: This is a pure frontend application that:
1. Uses Ruby scripts to analyze Rails source (one-time)
2. Generates static JSON data files
3. Serves a React + D3.js app that reads the JSON
4. Deploys as static files to GitHub Pages

**Build Process**:
1. Run Ruby scripts once to generate data
2. Develop React app with Vite
3. Build and deploy to GitHub Pages

The entire application runs in the browser with no server required!