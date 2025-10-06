import React, { useRef, useEffect, useState, useMemo } from 'react';
import * as d3 from 'd3';
import { buildTreeData, getTreeStats } from '../utils/treeDataBuilder';
import './CollapsibleTree.css';

function CollapsibleTree({ data }) {
  const svgRef = useRef(null);
  const [hideEmpty, setHideEmpty] = useState(false);
  const [treeStats, setTreeStats] = useState(null);

  // Build tree data with memoization for performance
  const treeData = useMemo(() => {
    const tree = buildTreeData(data, hideEmpty);
    const stats = getTreeStats(tree);
    setTreeStats(stats);
    return tree;
  }, [data, hideEmpty]);

  useEffect(() => {
    if (!treeData || !svgRef.current) return;

    // Clear existing SVG content
    d3.select(svgRef.current).selectAll("*").remove();

    // Set up dimensions
    const width = 1600; // Fixed width for horizontal layout
    const dx = 20; // Vertical spacing between nodes
    const dy = width / 6; // Horizontal spacing

    // Create tree layout
    const tree = d3.tree().nodeSize([dx, dy]);

    // Create root from hierarchical data
    const root = d3.hierarchy(treeData);

    // Initialize: Start with only root expanded
    root.descendants().forEach((d, i) => {
      d.id = i;
      if (d.depth > 0) {
        // Collapse all nodes beyond root (depth 0)
        d._children = d.children;
        d.children = null;
      }
    });

    // Calculate initial positions
    tree(root);

    // Dynamic height based on visible nodes
    let x0 = Infinity;
    let x1 = -x0;
    root.each(d => {
      if (d.x > x1) x1 = d.x;
      if (d.x < x0) x0 = d.x;
    });

    const height = x1 - x0 + dx * 2;

    const svg = d3.select(svgRef.current)
      .attr("viewBox", [-dy / 3, x0 - dx, width, height])
      .style("font", "12px monospace")
      .style("user-select", "none");

    const gLink = svg.append("g")
      .attr("fill", "none")
      .attr("stroke", "#ccc")
      .attr("stroke-opacity", 0.6)
      .attr("stroke-width", 1.5);

    const gNode = svg.append("g")
      .attr("cursor", "pointer")
      .attr("pointer-events", "all");

    function update(event, source) {
      const duration = event?.altKey ? 2500 : 300;
      const nodes = root.descendants().reverse();
      const links = root.links();

      // Compute the new tree layout
      tree(root);

      // Update height based on visible nodes
      let x0 = Infinity;
      let x1 = -x0;
      root.each(d => {
        if (d.x > x1) x1 = d.x;
        if (d.x < x0) x0 = d.x;
      });
      const newHeight = x1 - x0 + dx * 2;

      const transition = svg.transition()
        .duration(duration)
        .attr("viewBox", [-dy / 3, x0 - dx, width, newHeight])
        .tween("resize", window.ResizeObserver ? null : () => () => svg.dispatch("toggle"));

      // Update nodes
      const node = gNode.selectAll("g")
        .data(nodes, d => d.id);

      // Enter new nodes
      const nodeEnter = node.enter().append("g")
        .attr("transform", d => `translate(${source.y0},${source.x0})`)
        .attr("fill-opacity", 0)
        .attr("stroke-opacity", 0)
        .attr("class", d => `node node-${d.data.type}${d.children || d._children ? '' : ' node-leaf'}`)
        .on("click", (event, d) => {
          if (d.children) {
            // Collapse: save children before hiding
            d._children = d.children;
            d.children = null;
            update(event, d);
          } else if (d._children) {
            // Expand: restore hidden children
            d.children = d._children;
            d._children = null;
            update(event, d);
          }
        });

      // Add circles for nodes
      nodeEnter.append("circle")
        .attr("r", d => {
          if (d.data.type === 'gem') return 5;
          if (d.data.type === 'module' || d.data.type === 'class') return 4;
          return 3;
        })
        .attr("fill", d => {
          if (d._children) {
            // Has hidden children - fill with color
            if (d.data.type === 'gem') return "#CC0000";
            if (d.data.type === 'module') return "#2196F3";
            if (d.data.type === 'class') return "#9C27B0";
            return "#999";
          }
          // Leaf node or expanded - white fill
          return d.children ? "#fff" : "#fff";
        })
        .attr("stroke", d => {
          if (d.data.type === 'gem') return "#CC0000";
          if (d.data.type === 'module') return "#2196F3";
          if (d.data.type === 'class') return "#9C27B0";
          return "#999";
        })
        .attr("stroke-width", 2);

      // Add text labels
      nodeEnter.append("text")
        .attr("dy", "0.31em")
        .attr("x", d => (d._children || d.children) ? -10 : 10)
        .attr("text-anchor", d => (d._children || d.children) ? "end" : "start")
        .text(d => d.data.name)
        .style("font-size", d => {
          if (d.data.type === 'gem') return "14px";
          if (d.data.type === 'method' || d.data.type === 'class_method') return "11px";
          return "12px";
        })
        .style("font-weight", d => d.data.type === 'gem' ? "bold" : "normal")
        .style("font-style", d => d.data.type === 'class' ? "italic" : "normal")
        .style("fill", d => {
          if (d.data.type === 'gem') return "#CC0000";
          if (d.data.type === 'module') return "#2196F3";
          if (d.data.type === 'class') return "#9C27B0";
          if (d.data.type === 'method' || d.data.type === 'class_method') return "#666";
          return "#333";
        })
        .clone(true).lower()
        .attr("stroke-linejoin", "round")
        .attr("stroke-width", 3)
        .attr("stroke", "white");

      // Transition nodes to their new position
      const nodeUpdate = node.merge(nodeEnter).transition(transition)
        .attr("transform", d => `translate(${d.y},${d.x})`)
        .attr("fill-opacity", 1)
        .attr("stroke-opacity", 1);

      // Update circle fill based on expanded state
      nodeUpdate.select("circle")
        .attr("fill", d => {
          if (d._children) {
            if (d.data.type === 'gem') return "#CC0000";
            if (d.data.type === 'module') return "#2196F3";
            if (d.data.type === 'class') return "#9C27B0";
            return "#999";
          }
          return "#fff";
        });

      // Transition exiting nodes
      const nodeExit = node.exit().transition(transition).remove()
        .attr("transform", d => `translate(${source.y},${source.x})`)
        .attr("fill-opacity", 0)
        .attr("stroke-opacity", 0);

      // Update links
      const link = gLink.selectAll("path")
        .data(links, d => d.target.id);

      // Enter new links
      const linkEnter = link.enter().append("path")
        .attr("class", "link")
        .attr("d", d => {
          const o = {x: source.x0, y: source.y0};
          return diagonal({source: o, target: o});
        });

      // Transition links to their new position
      link.merge(linkEnter).transition(transition)
        .attr("d", diagonal);

      // Transition exiting links
      link.exit().transition(transition).remove()
        .attr("d", d => {
          const o = {x: source.x, y: source.y};
          return diagonal({source: o, target: o});
        });

      // Stash the old positions for transition
      root.eachBefore(d => {
        d.x0 = d.x;
        d.y0 = d.y;
      });
    }

    // Diagonal path generator
    function diagonal(d) {
      return `M${d.source.y},${d.source.x}
              C${d.source.y + dy / 2},${d.source.x}
               ${d.target.y - dy / 2},${d.target.x}
               ${d.target.y},${d.target.x}`;
    }

    // Initial draw
    root.x0 = height / 2;
    root.y0 = 0;
    update(null, root);

  }, [treeData]);

  const handleToggleEmpty = () => {
    setHideEmpty(!hideEmpty);
  };

  return (
    <div className="collapsible-tree-container">
      <div className="tree-header">
        <h1 className="tree-title">Rails Structure - Collapsible Tree</h1>
        <div className="tree-controls">
          {treeStats && (
            <div className="tree-stats">
              {treeStats.gems}g · {treeStats.modules}m · {treeStats.classes}c · {treeStats.methods}meth
            </div>
          )}
          <button
            className={`toggle-empty-button ${hideEmpty ? 'active' : ''}`}
            onClick={handleToggleEmpty}
            title="Hide modules and classes without public methods"
          >
            {hideEmpty ? 'Show All' : 'Hide Empty'}
          </button>
        </div>
      </div>

      <div className="tree-info">
        Click nodes to expand/collapse<br/>
        <kbd>Alt</kbd> + Click for slow animation<br/>
        <kbd>ESC</kbd> to return to overview
      </div>

      <div className="tree-svg-wrapper">
        <svg ref={svgRef} className="tree-svg"></svg>
      </div>
    </div>
  );
}

export default CollapsibleTree;
