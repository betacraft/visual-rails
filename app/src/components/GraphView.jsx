import React, { useRef, useEffect, useState } from 'react';
import * as d3 from 'd3';
import PageNavigation from './PageNavigation';
import NotesPanel from './NotesPanel';
import {
  generateCoreComponentsD3Data,
  generateLazyInitD3Data,
  generateSimpleExecutionD3Data,
  generateJoinsD3Data,
  generateIncludesD3Data,
  generateSQLPipelineD3Data
} from './activeRecordFlowsD3';
import {
  generateBeforeRailsFlowsD3Data,
  generateRouteDirectResponseD3Data,
  generateMiddlewareResponseD3Data,
  generateControllerTextResponseD3Data,
  generateControllerViewD3Data,
  generateControllerModelViewD3Data,
  generateComplexMultiModelD3Data,
  generateAPIJsonResponseD3Data,
  generateStreamingResponseD3Data
} from './httpRequestFlowsD3';
import './GraphView.css';

function GraphView({ data, currentView, onNodeClick, selectedNode, hideActiveSupport, layoutType, showMetrics, focusedGem, focusedModule }) {
  const svgRef = useRef(null);
  const containerRef = useRef(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [notesExpanded, setNotesExpanded] = useState(false);
  const [visibleSubFlows, setVisibleSubFlows] = useState(1); // For progressive reveal on page 1 of request-flow
  const [collapsedNodes, setCollapsedNodes] = useState(new Set()); // Track collapsed nodes in tree view
  const totalPages = currentView === 'activerecord-flow' ? 6 : currentView === 'request-flow' ? 9 : 1;
  
  // Page titles for activerecord-flow
  const pageTitles = currentView === 'activerecord-flow' ? {
    1: "Core Components Overview",
    2: "Lazy Query Initialization", 
    3: "Simple Query Execution",
    4: "Query with Joins",
    5: "Complex Query with Includes",
    6: "SQL Generation Pipeline"
  } : currentView === 'request-flow' ? {
    1: "Before Hitting Rails",
    2: "Route Direct Response",
    3: "Middleware Response",
    4: "Controller Text Response",
    5: "Controller with View",
    6: "Controller with Model and View",
    7: "Complex Multi-Model Request",
    8: "API JSON Response",
    9: "Streaming Response"
  } : {};

  // Handle keyboard navigation for flow pages
  useEffect(() => {
    if (currentView !== 'activerecord-flow' && currentView !== 'request-flow') return;

    const handleKeyPress = (e) => {
      // Special handling for page 1 of request-flow (progressive reveal)
      if (currentView === 'request-flow' && currentPage === 1) {
        if (e.key === 'ArrowRight') {
          if (visibleSubFlows < 6) {
            setVisibleSubFlows(visibleSubFlows + 1);
            return;
          } else {
            // Move to page 2 when all subflows are visible
            setCurrentPage(2);
            return;
          }
        } else if (e.key === 'ArrowLeft' && visibleSubFlows > 1) {
          setVisibleSubFlows(visibleSubFlows - 1);
          return;
        }
      }
      
      // Normal page navigation
      if (e.key === 'ArrowLeft' && currentPage > 1) {
        if (currentView === 'request-flow' && currentPage === 2) {
          // Going back to page 1, reset to show all subflows
          setCurrentPage(1);
          setVisibleSubFlows(6);
        } else {
          setCurrentPage(currentPage - 1);
        }
      } else if (e.key === 'ArrowRight' && currentPage < totalPages) {
        setCurrentPage(currentPage + 1);
      } else if (e.key >= '1' && e.key <= '9') {
        const page = parseInt(e.key);
        if (page <= totalPages) {
          setCurrentPage(page);
          if (currentView === 'request-flow' && page === 1) {
            setVisibleSubFlows(1); // Reset to show only first flow when jumping to page 1
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [currentView, currentPage, totalPages, visibleSubFlows]);

  // Reset page when entering flow views
  useEffect(() => {
    if (currentView === 'activerecord-flow' || currentView === 'request-flow') {
      setCurrentPage(1);
      if (currentView === 'request-flow') {
        setVisibleSubFlows(1); // Start with only first flow visible
      }
    }
  }, [currentView]);

  useEffect(() => {
    if (!data) return;

    const container = containerRef.current;
    const svg = d3.select(svgRef.current);
    
    const width = container.clientWidth;
    let height = container.clientHeight;
    
    // For flow views, calculate height based on number of nodes
    if (currentView === 'activerecord-flow') {
      // Get the node count for current page
      let nodeCount = 0;
      switch(currentPage) {
        case 1: nodeCount = 13; break; // Core Components
        case 2: nodeCount = 13; break; // Lazy Init
        case 3: nodeCount = 20; break; // Simple Execution
        case 4: nodeCount = 19; break; // Joins
        case 5: nodeCount = 23; break; // Includes
        case 6: nodeCount = 18; break; // SQL Pipeline
        default: nodeCount = 13;
      }
      // Use fixed spacing of 100px between nodes
      const nodeSpacing = 100;
      height = Math.max(container.clientHeight, nodeSpacing * (nodeCount + 2));
    }

    svg.attr('width', width).attr('height', height);

    svg.selectAll("*").remove();

    const g = svg.append("g");

    let nodes, links;
    
    // Check for special view modes first
    if (currentView === 'request-flow') {
      // Request Flow visualization with pages
      if (currentPage === 1) {
        // Page 1: Before Hitting Rails - Progressive reveal of horizontal flows
        const allFlows = generateBeforeRailsFlowsD3Data();
        const flowsToShow = allFlows.slice(0, visibleSubFlows);
        
        // Combine all visible flows into single node/link arrays
        nodes = [];
        links = [];
        
        flowsToShow.forEach((flow, flowIndex) => {
          const yOffset = flowIndex * 250; // 250px vertical spacing between flows for better separation
          
          // Add a title node for each flow
          nodes.push({
            id: `${flow.id}-title`,
            name: flow.title,
            type: 'flow-title',
            flowId: flow.id,
            flowIndex: flowIndex,
            x: 100,
            y: 80 + yOffset,
            fx: 100,
            fy: 80 + yOffset,
            isTitle: true
          });
          
          // Position nodes horizontally for each flow
          flow.nodes.forEach((node, nodeIndex) => {
            nodes.push({
              ...node,
              flowId: flow.id,
              flowIndex: flowIndex,
              x: 200 + (nodeIndex * 160), // Horizontal spacing
              y: 120 + yOffset, // Vertical position
              fx: 200 + (nodeIndex * 160), // Fixed positions for horizontal layout
              fy: 120 + yOffset
            });
          });
          
          // Add links for this flow
          flow.links.forEach(link => {
            links.push({
              ...link,
              flowId: flow.id
            });
          });
        });
        
        // Adjust height based on visible flows
        height = Math.max(container.clientHeight, 200 + (visibleSubFlows * 250));
        svg.attr('height', height);
      } else {
        // Pages 2-9: Rails internal flows
        let flowData;
        switch(currentPage) {
          case 2:
            flowData = generateRouteDirectResponseD3Data();
            break;
          case 3:
            flowData = generateMiddlewareResponseD3Data();
            break;
          case 4:
            flowData = generateControllerTextResponseD3Data();
            break;
          case 5:
            flowData = generateControllerViewD3Data();
            break;
          case 6:
            flowData = generateControllerModelViewD3Data();
            break;
          case 7:
            flowData = generateComplexMultiModelD3Data();
            break;
          case 8:
            flowData = generateAPIJsonResponseD3Data();
            break;
          case 9:
            flowData = generateStreamingResponseD3Data();
            break;
          default:
            flowData = generateRouteDirectResponseD3Data();
        }
        nodes = flowData.nodes;
        links = flowData.links;
        
        // Now that nodes are populated, adjust height for pages 2-9
        const nodeSpacing = 80;
        height = Math.max(container.clientHeight, nodeSpacing * (nodes.length + 2));
        svg.attr('height', height);
      }
    } else if (currentView === 'activerecord-flow') {
      // ActiveRecord Flow visualization with pages
      let flowData;
      switch(currentPage) {
        case 1:
          flowData = generateCoreComponentsD3Data();
          break;
        case 2:
          flowData = generateLazyInitD3Data();
          break;
        case 3:
          flowData = generateSimpleExecutionD3Data();
          break;
        case 4:
          flowData = generateJoinsD3Data();
          break;
        case 5:
          flowData = generateIncludesD3Data();
          break;
        case 6:
          flowData = generateSQLPipelineD3Data();
          break;
        default:
          flowData = generateCoreComponentsD3Data();
      }
      nodes = flowData.nodes;
      links = flowData.links;
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
      
      // Special rendering for flow titles on request-flow page 1
      if (currentView === 'request-flow' && currentPage === 1 && d.isTitle) {
        // Render flow title as text only
        selection.append("text")
          .text(d.name)
          .attr("text-anchor", "start")
          .attr("dy", ".35em")
          .style("font-size", "16px")
          .style("font-weight", "bold")
          .style("fill", "#333");
        return;
      }
      
      // Special rendering for flow diagrams
      if (currentView === 'request-flow' || currentView === 'activerecord-flow' || currentView === 'boot-process') {
        // Color based on type and group
        const typeColors = {
          // Request flow specific
          client: '#4CAF50',
          network: '#2196F3',
          server: '#2196F3',
          storage: '#795548',
          cache: '#FF9800',
          security: '#F44336',
          error: '#D32F2F',
          webserver: '#607D8B',
          // ActiveRecord flow
          entry: '#4CAF50',
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
          process: '#FFC107',
          // Other
          script: '#FFC107',
          config: '#9E9E9E',
          core: '#E91E63',
          loading: '#CDDC39',
          ready: '#4CAF50'
        };
        
        const nodeColor = d.faded ? '#CCCCCC' : (typeColors[d.type] || typeColors[d.group] || '#757575');
        
        // Render as rounded rectangle
        // Adjust width based on content length
        let nodeWidth = 140;
        if (currentView === 'activerecord-flow') {
          if (d.name.length > 30) nodeWidth = 200;
          else if (d.name.length > 20) nodeWidth = 160;
          else if (d.name.length > 15) nodeWidth = 140;
        } else if (currentView === 'request-flow' && currentPage === 1) {
          // Smaller nodes for horizontal flows
          nodeWidth = d.name.length > 15 ? 140 : 120;
        }
        selection.append("rect")
          .attr("x", -nodeWidth/2)
          .attr("y", -25)
          .attr("width", nodeWidth)
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
        if (currentView === 'activerecord-flow') {
          // For activerecord-flow, adjust font size based on text length
          const fontSize = d.name.length > 30 ? "10px" : d.name.length > 20 ? "11px" : "12px";
          textElement.text(d.name)
            .attr("dy", "0.35em")
            .style("font-size", fontSize)
            .style("font-weight", "600");
          // No description for activerecord-flow to keep it clean
        } else if (currentView === 'request-flow' && currentPage === 1) {
          // For horizontal flows on page 1, simpler text
          textElement.text(d.name)
            .attr("dy", "0.35em")
            .style("font-size", "11px")
            .style("font-weight", "500");
        } else {
          // For other flow diagrams, show name and description
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
        }
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

      // Add expand/collapse indicator for tree layouts
      if ((layoutType === 'tree' || layoutType === 'radial-tree') && d._treeData) {
        if (d._treeData.children || d._treeData._children) {
          const isCollapsed = collapsedNodes.has(d.id);
          selection.append("circle")
            .attr("cx", layoutType === 'tree' ? 70 : 0)
            .attr("cy", layoutType === 'tree' ? 0 : -30)
            .attr("r", 8)
            .attr("fill", "white")
            .attr("stroke", "#666")
            .attr("stroke-width", 2)
            .style("cursor", "pointer")
            .attr("class", "collapse-indicator");

          selection.append("text")
            .attr("x", layoutType === 'tree' ? 70 : 0)
            .attr("y", layoutType === 'tree' ? 0 : -30)
            .attr("text-anchor", "middle")
            .attr("dy", "0.35em")
            .style("fill", "#666")
            .style("font-size", "12px")
            .style("font-weight", "bold")
            .style("pointer-events", "none")
            .text(isCollapsed ? "+" : "−");
        }
      }

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

      // Handle tree collapse/expand
      if ((layoutType === 'tree' || layoutType === 'radial-tree') && d._treeData) {
        if (d._treeData.children || d._treeData._children) {
          // Node has children - toggle collapse
          const newCollapsedNodes = new Set(collapsedNodes);
          if (collapsedNodes.has(d.id)) {
            newCollapsedNodes.delete(d.id);
          } else {
            newCollapsedNodes.add(d.id);
          }
          setCollapsedNodes(newCollapsedNodes);
          event.preventDefault();
          return;
        }
      }

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
    if (currentView === 'request-flow') {
      if (currentPage === 1) {
        // Page 1 has horizontal layouts, positions already set
        setTimeout(() => simulation.stop(), 100);
      } else {
        // Pages 2-9: vertical flow layout
        setTimeout(() => {
          const spacing = 80;
          nodes.forEach((node, index) => {
            if (!node.fx && !node.fy) { // Only position if not already fixed
              node.fx = width / 2;
              node.fy = spacing * (index + 1);
            }
          });
          simulation.alpha(0.3).restart();
          setTimeout(() => simulation.stop(), 1000);
        }, 100);
      }
    } else if (currentView === 'activerecord-flow' || currentView === 'boot-process') {
      // Flow diagram layout - vertical flow
      setTimeout(() => {
        // Use fixed spacing for activerecord-flow, dynamic for others
        const spacing = currentView === 'activerecord-flow'
          ? 100  // Fixed 100px spacing for activerecord-flow
          : height / (nodes.length + 1);  // Dynamic spacing for other flows

        nodes.forEach((node, index) => {
          node.fx = width / 2;
          node.fy = currentView === 'activerecord-flow'
            ? spacing * (index + 1)  // Fixed spacing from top
            : spacing * (index + 1); // Dynamic spacing within container
        });

        simulation.alpha(0.3).restart();
        setTimeout(() => simulation.stop(), 1000);
      }, 100);
    } else if (layoutType === 'tree' || layoutType === 'radial-tree') {
      // Tree layout (horizontal or radial)
      setTimeout(() => {
        // Build hierarchy from nodes and links
        const nodesMap = new Map(nodes.map(n => [n.id, { ...n, children: [] }]));

        // Find root node (one with no incoming links or the focused gem/module)
        const targets = new Set(links.map(l => typeof l.target === 'string' ? l.target : l.target.id));
        let rootNode = nodes.find(n => !targets.has(n.id)) || nodes[0];

        // Build children relationships
        links.forEach(link => {
          const sourceId = typeof link.source === 'string' ? link.source : link.source.id;
          const targetId = typeof link.target === 'string' ? link.target : link.target.id;
          const parent = nodesMap.get(sourceId);
          const child = nodesMap.get(targetId);
          if (parent && child) {
            parent.children.push(child);
          }
        });

        // Create D3 hierarchy
        const root = d3.hierarchy(nodesMap.get(rootNode.id));

        // Filter out collapsed nodes' children
        root.each(d => {
          if (d.data && collapsedNodes.has(d.data.id)) {
            d._children = d.children; // Save children for later
            d.children = null; // Hide children
          }
        });

        if (layoutType === 'tree') {
          // Horizontal tree layout
          // Calculate dynamic height based on number of visible nodes
          const visibleNodeCount = root.descendants().length;
          const minVerticalSpacing = 50; // px per node for readability
          const calculatedHeight = Math.max(
            container.clientHeight,
            visibleNodeCount * minVerticalSpacing + 100
          );

          // Update SVG height to accommodate all nodes
          svg.attr('height', calculatedHeight);

          const treeLayout = d3.tree()
            .size([calculatedHeight - 100, width - 200])
            .separation((a, b) => (a.parent === b.parent ? 1 : 1.5));

          treeLayout(root);

          // Position nodes based on tree layout
          root.descendants().forEach(d => {
            const node = nodes.find(n => n.id === d.data.id);
            if (node) {
              node.fx = d.y + 100; // Horizontal position
              node.fy = d.x + 50;  // Vertical position
              node._treeData = d; // Store tree data for collapse/expand
            }
          });
        } else {
          // Radial tree layout
          // For radial layout, also calculate dynamic radius if needed
          const visibleNodeCount = root.descendants().length;
          const minRadialSpacing = 30; // Adjust as needed
          const calculatedRadius = Math.max(
            Math.min(width, height) / 2 - 100,
            visibleNodeCount * minRadialSpacing / (2 * Math.PI)
          );

          // Update SVG height for radial layout
          const requiredSize = calculatedRadius * 2 + 200;
          svg.attr('height', Math.max(container.clientHeight, requiredSize));

          const treeLayout = d3.tree()
            .size([2 * Math.PI, calculatedRadius])
            .separation((a, b) => (a.parent === b.parent ? 1 : 2) / a.depth);

          treeLayout(root);

          // Position nodes in radial layout
          root.descendants().forEach(d => {
            const node = nodes.find(n => n.id === d.data.id);
            if (node) {
              node.fx = width / 2 + d.y * Math.cos(d.x - Math.PI / 2);
              node.fy = height / 2 + d.y * Math.sin(d.x - Math.PI / 2);
              node._treeData = d; // Store tree data for collapse/expand
            }
          });
        }

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
  }, [data, currentView, selectedNode, onNodeClick, hideActiveSupport, layoutType, showMetrics, focusedGem, focusedModule, currentPage, visibleSubFlows, collapsedNodes]);

  return (
    <div ref={containerRef} className="graph-container">
      <svg ref={svgRef} className="graph-svg"></svg>
      {currentView === 'request-flow' && (
        <>
          <div className="gem-view-hint">
            <strong>HTTP Request Flow</strong>
            <br />
            <small>{pageTitles[currentPage]}</small>
            <br />
            <small>Press <kbd>ESC</kbd> to return to overview</small>
          </div>
          {currentPage === 1 && (
            <div className="subflow-counter">
              Showing {visibleSubFlows} of 6 flows
              {visibleSubFlows < 6 && (
                <span style={{marginLeft: '10px', opacity: 0.7}}>
                  Press <kbd>→</kbd> to reveal more
                </span>
              )}
            </div>
          )}
          <div className="page-title">
            <h2>{pageTitles[currentPage]}</h2>
          </div>
        </>
      )}
      {currentView === 'activerecord-flow' && (
        <>
          <div className="gem-view-hint">
            <strong>ActiveRecord Query Flow</strong>
            <br />
            <small>How database queries work in Rails</small>
            <br />
            <small>Press <kbd>ESC</kbd> or <kbd>1</kbd> to return to overview</small>
          </div>
          <div className="page-title">
            <h2>{pageTitles[currentPage]}</h2>
          </div>
        </>
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
      
      {(currentView === 'activerecord-flow' || currentView === 'request-flow') && (
        <>
          <PageNavigation 
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={(page) => {
              setCurrentPage(page);
              if (currentView === 'request-flow' && page === 1) {
                setVisibleSubFlows(1); // Reset to first flow when navigating to page 1
              }
            }}
            subFlows={currentView === 'request-flow' && currentPage === 1 ? {
              visible: visibleSubFlows,
              total: 6,
              onSubFlowChange: setVisibleSubFlows
            } : null}
          />
          <NotesPanel 
            currentPage={currentPage}
            isExpanded={notesExpanded}
            onToggle={() => setNotesExpanded(!notesExpanded)}
            viewType={currentView}
            visibleSubFlows={currentView === 'request-flow' && currentPage === 1 ? visibleSubFlows : null}
          />
        </>
      )}
    </div>
  );
}

export default GraphView;