import React, { useRef, useEffect } from 'react';
import * as d3 from 'd3';
import './GraphView.css';

function GraphView({ data, currentView, onNodeClick, selectedNode, hideActiveSupport, layoutType, showMetrics, focusedGem, focusedModule }) {
  const svgRef = useRef(null);
  const containerRef = useRef(null);

  useEffect(() => {
    if (!data) return;

    const container = containerRef.current;
    const svg = d3.select(svgRef.current);
    
    const width = container.clientWidth;
    const height = container.clientHeight;

    svg.attr('width', width).attr('height', height);

    svg.selectAll("*").remove();

    const g = svg.append("g");

    let nodes, links;
    
    // Check for special view modes first
    if (currentView === 'request-flow') {
      // Request Flow visualization
      const flow = data.requestFlow;
      nodes = flow.steps.map(step => ({
        ...step,
        x: width / 2,
        y: 0
      }));
      
      links = flow.connections.map(conn => ({
        source: conn.from,
        target: conn.to,
        bidirectional: conn.bidirectional
      }));
    } else if (currentView === 'activerecord-flow') {
      // ActiveRecord Flow visualization  
      const flow = data.activeRecordFlow;
      nodes = flow.steps.map(step => ({
        ...step,
        x: width / 2,
        y: 0
      }));
      
      links = flow.connections.map(conn => ({
        source: conn.from,
        target: conn.to,
        bidirectional: conn.bidirectional
      }));
    } else if (currentView === 'boot-process') {
      // Boot Process visualization
      const flow = data.bootProcess;
      nodes = flow.steps.map(step => ({
        ...step,
        x: width / 2,
        y: 0
      }));
      
      links = flow.connections.map(conn => ({
        source: conn.from,
        target: conn.to
      }));
    } else if (focusedModule && focusedModule.details) {
      // Show components of the focused module
      const components = focusedModule.details.components || [];
      nodes = components.map((componentName, index) => ({
        id: `component-${index}`,
        name: componentName,
        type: 'component',
        parent: focusedModule.name,
        color: '#9C27B0'
      }));
      
      // Add central node for the module itself
      nodes.unshift({
        id: focusedModule.id,
        name: focusedModule.name,
        type: 'module-center',
        color: focusedModule.parentGem.color || '#757575',
        description: focusedModule.details.description,
        loc: focusedModule.details.loc
      });
      
      // Connect all components to the central module node
      links = [];
      components.forEach((_, index) => {
        links.push({
          source: focusedModule.id,
          target: `component-${index}`,
          strength: 2
        });
      });
    } else if (focusedGem && focusedGem.modules) {
      // Show modules of the focused gem
      nodes = focusedGem.modules.map((moduleName, index) => ({
        id: `module-${index}`,
        name: moduleName,
        type: 'module',
        parent: focusedGem.name,
        color: focusedGem.color || '#757575'
      }));
      
      // Create connections between modules (simplified - could be enhanced)
      links = [];
      // Add a central node for the gem itself
      nodes.unshift({
        id: focusedGem.id,
        name: focusedGem.name,
        type: 'gem-center',
        color: focusedGem.color || '#CC0000'
      });
      
      // Connect all modules to the central gem node
      focusedGem.modules.forEach((_, index) => {
        links.push({
          source: focusedGem.id,
          target: `module-${index}`,
          strength: 3
        });
      });
    } else {
      // Show all gems
      nodes = data.gems.map(d => ({...d}));
      links = data.dependencies.map(d => ({...d}));
      
      // Filter out ActiveSupport dependencies if toggle is enabled
      if (hideActiveSupport) {
        links = links.filter(d => d.source !== 'activesupport' && d.target !== 'activesupport');
      }
    }

    const simulation = d3.forceSimulation(nodes)
      .force("link", d3.forceLink(links)
        .id(d => d.id)
        .distance(d => 150 - (d.strength || 1) * 5))
      .force("charge", d3.forceManyBody().strength(-500))
      .force("center", d3.forceCenter(width / 2, height / 2))
      .force("collision", d3.forceCollide().radius(60));

    const link = g.append("g")
      .attr("class", "links")
      .selectAll("line")
      .data(links)
      .enter().append("line")
      .attr("class", "link")
      .attr("stroke", "#999")
      .attr("stroke-opacity", 0.4)
      .attr("stroke-width", d => Math.sqrt(d.strength || 1) * 1.5)
      .attr("marker-end", "url(#arrowhead)");

    svg.append("defs").append("marker")
      .attr("id", "arrowhead")
      .attr("viewBox", "0 0 10 10")
      .attr("refX", 25)
      .attr("refY", 5)
      .attr("markerWidth", 6)
      .attr("markerHeight", 6)
      .attr("orient", "auto")
      .append("path")
      .attr("d", "M 0 0 L 10 5 L 0 10 Z")
      .attr("fill", "#999")
      .attr("opacity", 0.6);

    const node = g.append("g")
      .attr("class", "nodes")
      .selectAll("g")
      .data(nodes)
      .enter().append("g")
      .attr("class", d => `node ${selectedNode?.id === d.id ? 'selected' : ''}`)
      .call(d3.drag()
        .on("start", dragstarted)
        .on("drag", dragged)
        .on("end", dragended));

    node.each(function(d) {
      const selection = d3.select(this);
      
      // Special rendering for flow diagrams
      if (currentView === 'request-flow' || currentView === 'activerecord-flow' || currentView === 'boot-process') {
        // Color based on type
        const typeColors = {
          client: '#4CAF50',
          server: '#2196F3',
          middleware: '#FF9800',
          routing: '#9C27B0',
          controller: '#F44336',
          model: '#4CAF50',
          view: '#00BCD4',
          response: '#8BC34A',
          query: '#FF5722',
          adapter: '#795548',
          pool: '#607D8B',
          database: '#3F51B5',
          result: '#009688',
          script: '#FFC107',
          config: '#9E9E9E',
          core: '#E91E63',
          loading: '#CDDC39',
          ready: '#4CAF50'
        };
        
        const nodeColor = typeColors[d.type] || '#757575';
        
        // Render as rounded rectangle
        selection.append("rect")
          .attr("x", -60)
          .attr("y", -25)
          .attr("width", 120)
          .attr("height", 50)
          .attr("rx", 10)
          .attr("fill", nodeColor)
          .attr("stroke", "#fff")
          .attr("stroke-width", 2)
          .attr("class", "node-shape flow-node");
      } else if (d.type === 'component') {
        // Render components as small rounded rectangles
        selection.append("rect")
          .attr("x", -35)
          .attr("y", -18)
          .attr("width", 70)
          .attr("height", 36)
          .attr("rx", 18)
          .attr("fill", d.color || "#9C27B0")
          .attr("stroke", "#fff")
          .attr("stroke-width", 2)
          .attr("class", "node-shape component-node");
      } else if (d.type === 'module-center') {
        // Central module node in component view
        selection.append("rect")
          .attr("x", -50)
          .attr("y", -25)
          .attr("width", 100)
          .attr("height", 50)
          .attr("rx", 10)
          .attr("fill", d.color || "#757575")
          .attr("stroke", "#fff")
          .attr("stroke-width", 3)
          .attr("class", "node-shape module-center-node");
      } else if (d.type === 'module') {
        // Render modules as smaller rectangles
        selection.append("rect")
          .attr("x", -40)
          .attr("y", -20)
          .attr("width", 80)
          .attr("height", 40)
          .attr("rx", 8)
          .attr("fill", d.color || "#757575")
          .attr("stroke", "#fff")
          .attr("stroke-width", 2)
          .attr("class", "node-shape module-node");
      } else if (d.type === 'gem-center') {
        // Central gem node in module view
        selection.append("circle")
          .attr("r", 45)
          .attr("fill", d.color || "#CC0000")
          .attr("stroke", "#fff")
          .attr("stroke-width", 3)
          .attr("class", "node-shape gem-center-node");
      } else if (d.id === 'railties') {
        const hexagonPoints = (radius) => {
          const angles = [0, 60, 120, 180, 240, 300];
          return angles.map(angle => {
            const radian = (angle - 30) * Math.PI / 180;
            return `${radius * Math.cos(radian)},${radius * Math.sin(radian)}`;
          }).join(" ");
        };
        
        selection.append("polygon")
          .attr("points", hexagonPoints(45))
          .attr("fill", d.color || "#CC0000")
          .attr("stroke", "#fff")
          .attr("stroke-width", 3)
          .attr("class", "node-shape");
      } else if (d.id === 'activesupport') {
        selection.append("rect")
          .attr("x", -50)
          .attr("y", -30)
          .attr("width", 100)
          .attr("height", 60)
          .attr("rx", 5)
          .attr("fill", d.color || "#4A90E2")
          .attr("stroke", "#fff")
          .attr("stroke-width", 3)
          .attr("class", "node-shape")
          .style("opacity", hideActiveSupport ? 0.5 : 1);
      } else if (d.id === 'rails') {
        selection.append("circle")
          .attr("r", 50)
          .attr("fill", d.color || "#CC0000")
          .attr("stroke", "#fff")
          .attr("stroke-width", 4)
          .attr("class", "node-shape rails-node");
      } else {
        // Adjust circle size based on name length
        const radius = d.name.length > 12 ? 40 : 35;
        selection.append("circle")
          .attr("r", radius)
          .attr("fill", d.color || "#757575")
          .attr("stroke", "#fff")
          .attr("stroke-width", 2)
          .attr("class", "node-shape");
      }

      // Handle text wrapping for long names
      const textElement = selection.append("text")
        .attr("text-anchor", "middle")
        .attr("class", "node-label")
        .style("fill", "white")
        .style("pointer-events", "none");

      if (currentView === 'request-flow' || currentView === 'activerecord-flow' || currentView === 'boot-process') {
        // Flow diagram text
        textElement.text(d.name)
          .attr("dy", "-0.3em")
          .style("font-size", "12px")
          .style("font-weight", "600");
          
        // Add description below
        selection.append("text")
          .text(d.description)
          .attr("text-anchor", "middle")
          .attr("dy", "1em")
          .style("fill", "white")
          .style("font-size", "9px")
          .style("opacity", 0.9)
          .style("pointer-events", "none");
      } else if (d.type === 'component') {
        // Component names - simple and small
        textElement.text(d.name)
          .attr("dy", ".35em")
          .style("font-size", d.name.length > 12 ? "9px" : "10px")
          .style("font-weight", "500");
      } else if (d.type === 'module-center') {
        // Module center name
        const moduleName = d.name.replace('::', '\n');
        const lines = moduleName.split('\n');
        if (lines.length > 1) {
          lines.forEach((line, i) => {
            textElement.append("tspan")
              .text(line)
              .attr("x", 0)
              .attr("dy", i === 0 ? "-0.3em" : "1.2em")
              .style("font-size", "12px")
              .style("font-weight", "bold");
          });
        } else {
          textElement.text(d.name)
            .attr("dy", ".35em")
            .style("font-size", "13px")
            .style("font-weight", "bold");
        }
      } else if (d.type === 'module') {
        // Module names - wrap if too long
        const moduleName = d.name.replace('::', '\n');
        const lines = moduleName.split('\n');
        if (lines.length > 1) {
          lines.forEach((line, i) => {
            textElement.append("tspan")
              .text(line)
              .attr("x", 0)
              .attr("dy", i === 0 ? "-0.3em" : "1.2em")
              .style("font-size", "10px");
          });
        } else {
          textElement.text(d.name)
            .attr("dy", ".35em")
            .style("font-size", d.name.length > 20 ? "9px" : "11px");
        }
      } else if (d.name.length > 10 && d.name.includes('action')) {
        // Split action* gems into two lines
        const parts = d.name.split('action');
        textElement.append("tspan")
          .text('action')
          .attr("x", 0)
          .attr("dy", "-0.3em")
          .style("font-size", "11px");
        textElement.append("tspan")
          .text(parts[1])
          .attr("x", 0)
          .attr("dy", "1.2em")
          .style("font-size", "11px");
      } else if (d.name.length > 10 && d.name.includes('active')) {
        // Split active* gems into two lines
        const parts = d.name.split('active');
        textElement.append("tspan")
          .text('active')
          .attr("x", 0)
          .attr("dy", "-0.3em")
          .style("font-size", "11px");
        textElement.append("tspan")
          .text(parts[1])
          .attr("x", 0)
          .attr("dy", "1.2em")
          .style("font-size", "11px");
      } else {
        // Single line for shorter names
        textElement.text(d.name)
          .attr("dy", d.id === 'rails' ? "-0.5em" : ".35em")
          .style("font-size", d.id === 'rails' ? "16px" : d.id === 'railties' || d.id === 'activesupport' ? "14px" : d.name.length > 10 ? "10px" : "12px");
      }
      
      textElement.style("font-weight", d.id === 'rails' || d.id === 'railties' ? "bold" : "normal");

      if (d.id === 'rails') {
        selection.append("text")
          .text("8.0")
          .attr("text-anchor", "middle")
          .attr("dy", "1.5em")
          .attr("class", "node-version")
          .style("fill", "white")
          .style("font-size", "14px")
          .style("font-weight", "bold")
          .style("pointer-events", "none");
      }

      if (d.loc && showMetrics && d.type !== 'module') {
        const hasWrappedText = d.name.length > 10 && (d.name.includes('action') || d.name.includes('active'));
        selection.append("text")
          .text(`${(d.loc / 1000).toFixed(0)}k LOC`)
          .attr("text-anchor", "middle")
          .attr("dy", d.id === 'activesupport' ? "2.5em" : hasWrappedText ? "2.2em" : "2.8em")
          .attr("class", "node-loc")
          .style("fill", "#666")
          .style("font-size", "9px")
          .style("pointer-events", "none");
      }
    });

    node.on("click", function(event, d) {
      event.stopPropagation();
      onNodeClick(d);
      
      node.classed("selected", false);
      d3.select(this).classed("selected", true);
    });

    node.append("title")
      .text(d => `${d.name}\n${d.description}\nLines of Code: ${d.loc?.toLocaleString() || 'N/A'}`);

    const zoom = d3.zoom()
      .scaleExtent([0.3, 3])
      .on("zoom", (event) => {
        g.attr("transform", event.transform);
      });

    svg.call(zoom);

    svg.on("click", function(event) {
      if (event.target === this) {
        onNodeClick(null);
        node.classed("selected", false);
      }
    });

    simulation.on("tick", () => {
      link
        .attr("x1", d => d.source.x)
        .attr("y1", d => d.source.y)
        .attr("x2", d => d.target.x)
        .attr("y2", d => d.target.y);

      node
        .attr("transform", d => `translate(${d.x},${d.y})`);
    });

    // Apply layout based on type
    if (currentView === 'request-flow' || currentView === 'activerecord-flow' || currentView === 'boot-process') {
      // Flow diagram layout - vertical flow
      setTimeout(() => {
        const spacing = height / (nodes.length + 1);
        nodes.forEach((node, index) => {
          node.fx = width / 2;
          node.fy = spacing * (index + 1);
        });
        
        simulation.alpha(0.3).restart();
        setTimeout(() => simulation.stop(), 1000);
      }, 100);
    } else if (layoutType === 'hierarchical') {
      // Hierarchical layout - arrange in layers
      setTimeout(() => {
        const layers = {
          1: ['rails'],
          2: ['railties'],
          3: ['actionpack', 'actionview', 'activerecord', 'actionmailer', 'activejob', 'actioncable'],
          4: ['activestorage', 'actiontext', 'actionmailbox'],
          5: ['activesupport', 'activemodel']
        };
        
        Object.entries(layers).forEach(([layer, nodeIds]) => {
          const layerY = height * (parseInt(layer) * 0.18);
          const layerNodes = nodes.filter(n => nodeIds.includes(n.id));
          const spacing = width / (layerNodes.length + 1);
          
          layerNodes.forEach((node, index) => {
            node.fx = spacing * (index + 1);
            node.fy = layerY;
          });
        });
        
        simulation.alpha(0.3).restart();
        setTimeout(() => simulation.stop(), 2000);
      }, 100);
      
    } else if (layoutType === 'circular') {
      // Circular layout
      setTimeout(() => {
        const radius = Math.min(width, height) * 0.35;
        const centerX = width / 2;
        const centerY = height / 2;
        const angleStep = (2 * Math.PI) / nodes.length;
        
        nodes.forEach((node, index) => {
          const angle = index * angleStep - Math.PI / 2;
          node.fx = centerX + radius * Math.cos(angle);
          node.fy = centerY + radius * Math.sin(angle);
        });
        
        simulation.alpha(0.3).restart();
        setTimeout(() => simulation.stop(), 2000);
      }, 100);
      
    } else {
      // Default force layout with some initial positioning
      setTimeout(() => {
        const rails = nodes.find(n => n.id === 'rails');
        const railties = nodes.find(n => n.id === 'railties');
        const activeSupport = nodes.find(n => n.id === 'activesupport');
        
        if (rails) {
          rails.fx = width / 2;
          rails.fy = height * 0.2;
        }
        if (railties) {
          railties.fx = width / 2;
          railties.fy = height / 2;
        }
        if (activeSupport) {
          activeSupport.fx = width / 2;
          activeSupport.fy = height * 0.8;
        }
        
        simulation.alpha(0.3).restart();
        
        // Release fixed positions after initial placement
        setTimeout(() => {
          if (rails) {
            rails.fx = null;
            rails.fy = null;
          }
          if (railties) {
            railties.fx = null;
            railties.fy = null;
          }
          if (activeSupport) {
            activeSupport.fx = null;
            activeSupport.fy = null;
          }
          
          // Stop simulation after stabilization to prevent jumping
          setTimeout(() => {
            simulation.stop();
          }, 3000);
        }, 2000);
      }, 100);
    }

    function dragstarted(event, d) {
      if (!event.active) simulation.alphaTarget(0.3).restart();
      d.fx = d.x;
      d.fy = d.y;
    }

    function dragged(event, d) {
      d.fx = event.x;
      d.fy = event.y;
    }

    function dragended(event, d) {
      if (!event.active) simulation.alphaTarget(0);
      d.fx = null;
      d.fy = null;
    }

    return () => {
      simulation.stop();
    };
  }, [data, currentView, selectedNode, onNodeClick, hideActiveSupport, layoutType, showMetrics, focusedGem, focusedModule]);

  return (
    <div ref={containerRef} className="graph-container">
      <svg ref={svgRef} className="graph-svg"></svg>
      {currentView === 'request-flow' && (
        <div className="gem-view-hint">
          <strong>Rails Request Flow</strong>
          <br />
          <small>How an HTTP request flows through Rails</small>
          <br />
          <small>Press <kbd>ESC</kbd> or <kbd>1</kbd> to return to overview</small>
        </div>
      )}
      {currentView === 'activerecord-flow' && (
        <div className="gem-view-hint">
          <strong>ActiveRecord Query Flow</strong>
          <br />
          <small>How database queries work in Rails</small>
          <br />
          <small>Press <kbd>ESC</kbd> or <kbd>1</kbd> to return to overview</small>
        </div>
      )}
      {currentView === 'boot-process' && (
        <div className="gem-view-hint">
          <strong>Rails Boot Process</strong>
          <br />
          <small>How Rails initializes and starts up</small>
          <br />
          <small>Press <kbd>ESC</kbd> or <kbd>1</kbd> to return to overview</small>
        </div>
      )}
      {(focusedGem || focusedModule) && (
        <div className="gem-view-hint">
          <strong>
            {focusedModule 
              ? `Viewing components of ${focusedModule.name}`
              : `Viewing modules of ${focusedGem.name}`}
          </strong>
          <br />
          <small>Press <kbd>ESC</kbd> or click "← Back" to return</small>
          {focusedModule && focusedModule.details && focusedModule.details.description && (
            <>
              <br />
              <small style={{marginTop: '0.5rem', display: 'block', opacity: 0.7}}>
                {focusedModule.details.description}
              </small>
            </>
          )}
        </div>
      )}
    </div>
  );
}

export default GraphView;