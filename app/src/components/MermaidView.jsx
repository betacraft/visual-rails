import React, { useRef, useEffect, useState } from 'react';
import mermaid from 'mermaid';
import PageNavigation from './PageNavigation';
import NotesPanel from './NotesPanel';
import {
  generateCoreComponentsDiagram,
  generateLazyInitDiagram,
  generateSimpleExecutionDiagram,
  generateJoinsDiagram,
  generateIncludesDiagram,
  generateSQLPipelineDiagram
} from './activeRecordFlows';
import './MermaidView.css';

function MermaidView({ data, currentView, onNodeClick, selectedNode, hideActiveSupport, viewType, showMetrics, focusedGem, focusedModule }) {
  const containerRef = useRef(null);
  const diagramRef = useRef(null);
  const [mermaidCode, setMermaidCode] = useState('');
  const [zoomLevel, setZoomLevel] = useState(1);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [isRendering, setIsRendering] = useState(false);
  const fitToScreenTimeoutRef = useRef(null);
  const renderTimeoutRef = useRef(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [notesExpanded, setNotesExpanded] = useState(false);
  const totalPages = 6;

  useEffect(() => {
    console.log('Initializing Mermaid...');
    try {
      mermaid.initialize({ 
        startOnLoad: false,
        theme: 'default',
        flowchart: {
          curve: 'basis',
          nodeSpacing: 80,
          rankSpacing: 100,
          padding: 20,
          useMaxWidth: false,
          htmlLabels: true,
          rankdir: 'TD'
        },
        themeVariables: {
          primaryColor: '#2196F3',
          primaryTextColor: '#fff',
          primaryBorderColor: '#1976D2',
          lineColor: '#757575',
          secondaryColor: '#4CAF50',
          tertiaryColor: '#FF9800',
          fontSize: '14px'
        },
        logLevel: 'error', // Changed from 'debug' to reduce console noise
        securityLevel: 'loose', // Allow more flexibility in rendering
        suppressErrorRendering: true // Prevent mermaid from showing error in diagram
      });
      console.log('Mermaid initialized');
    } catch (error) {
      console.error('Failed to initialize Mermaid:', error);
    }
  }, []);

  // Handle keyboard navigation for activerecord-flow pages
  useEffect(() => {
    if (currentView !== 'activerecord-flow') return;

    const handleKeyPress = (e) => {
      if (e.key === 'ArrowLeft' && currentPage > 1) {
        setCurrentPage(currentPage - 1);
      } else if (e.key === 'ArrowRight' && currentPage < totalPages) {
        setCurrentPage(currentPage + 1);
      } else if (e.key >= '1' && e.key <= '6') {
        const page = parseInt(e.key);
        if (page <= totalPages) {
          setCurrentPage(page);
        }
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [currentView, currentPage, totalPages]);

  // Reset page when entering activerecord-flow
  useEffect(() => {
    if (currentView === 'activerecord-flow') {
      setCurrentPage(1);
    }
  }, [currentView]);

  useEffect(() => {
    if (!data) {
      console.log('No data available');
      return;
    }

    let code = '';
    
    console.log('Generating diagram - viewType:', viewType, 'currentView:', currentView);
    
    // Special views override the viewType
    if (currentView === 'activerecord-flow') {
      // Generate page-specific diagram for ActiveRecord flow
      switch(currentPage) {
        case 1:
          code = generateCoreComponentsDiagram();
          break;
        case 2:
          code = generateLazyInitDiagram();
          break;
        case 3:
          code = generateSimpleExecutionDiagram();
          break;
        case 4:
          code = generateJoinsDiagram();
          break;
        case 5:
          code = generateIncludesDiagram();
          break;
        case 6:
          code = generateSQLPipelineDiagram();
          break;
        default:
          code = generateCoreComponentsDiagram();
      }
    } else if (currentView === 'request-flow' || currentView === 'boot-process') {
      code = generateSequenceDiagram(data, currentView);
    } else if (focusedModule) {
      // When viewing a module's components, show architecture
      code = generateModuleArchitecture(focusedModule);
    } else if (focusedGem) {
      // When viewing a gem's modules, show internal structure
      code = generateGemArchitecture(focusedGem, showMetrics);
    } else {
      // Always use dependency flow for Mermaid
      console.log('Generating dependency flow diagram');
      code = generateDependencyFlow(data, hideActiveSupport, showMetrics);
    }

    console.log('Generated code length:', code.length);
    setMermaidCode(code);
  }, [data, currentView, viewType, hideActiveSupport, showMetrics, focusedGem, focusedModule, currentPage]);

  useEffect(() => {
    console.log('MermaidCode updated, length:', mermaidCode?.length);
    if (mermaidCode && containerRef.current) {
      // Clear any pending render timeouts
      if (renderTimeoutRef.current) {
        clearTimeout(renderTimeoutRef.current);
      }
      // Debounce rendering to avoid rapid re-renders
      renderTimeoutRef.current = setTimeout(() => {
        renderMermaidDiagram();
      }, 100);
    } else if (!mermaidCode) {
      console.log('No mermaid code to render');
    }
    
    // Cleanup on unmount or when mermaidCode changes
    return () => {
      if (renderTimeoutRef.current) {
        clearTimeout(renderTimeoutRef.current);
      }
      if (fitToScreenTimeoutRef.current) {
        clearTimeout(fitToScreenTimeoutRef.current);
      }
    };
  }, [mermaidCode]);

  const renderMermaidDiagram = async () => {
    if (!containerRef.current || !diagramRef.current) {
      console.log('Container or diagram ref not ready');
      return;
    }
    
    // Prevent concurrent renders
    if (isRendering) {
      console.log('Already rendering, skipping...');
      return;
    }
    
    setIsRendering(true);
    
    // Debug: Log the generated code
    console.log('=== MERMAID RENDERING START ===');
    console.log('View Type:', viewType);
    console.log('Code length:', mermaidCode?.length);
    console.log('First 200 chars:', mermaidCode?.substring(0, 200));
    
    // Clear the container
    diagramRef.current.innerHTML = '';
    
    // Create a new div element and set its text content (not innerHTML)
    const mermaidDiv = document.createElement('div');
    mermaidDiv.className = 'mermaid';
    mermaidDiv.textContent = mermaidCode; // Use textContent to avoid HTML interpretation
    mermaidDiv.id = 'mermaid-' + Date.now(); // Add unique ID
    diagramRef.current.appendChild(mermaidDiv);
    
    console.log('Mermaid div created, attempting to render...');
    
    try {
      // Wait a bit to ensure DOM is ready
      await new Promise(resolve => setTimeout(resolve, 50));
      
      // Re-run mermaid on the new content
      await mermaid.run({
        querySelector: `#${mermaidDiv.id}`, // Use specific ID instead of class
        suppressErrors: true
      });
      
      console.log('Mermaid.run() completed');
      
      // Check if SVG was actually created
      const svg = diagramRef.current.querySelector('svg');
      if (svg) {
        console.log('SVG created successfully');
        console.log('SVG dimensions:', svg.getBoundingClientRect());
        console.log('SVG innerHTML length:', svg.innerHTML.length);
        
        // Make sure SVG is visible
        svg.style.display = 'block';
        svg.style.visibility = 'visible';
      } else {
        console.error('No SVG found after mermaid.run()');
        // Check what's actually in the container
        console.log('Container innerHTML:', diagramRef.current.innerHTML.substring(0, 500));
      }
      
      attachClickHandlers();
      
      // Clear any existing fitToScreen timeout
      if (fitToScreenTimeoutRef.current) {
        clearTimeout(fitToScreenTimeoutRef.current);
      }
      
      // Auto-fit on initial render with longer delay for complex diagrams
      fitToScreenTimeoutRef.current = setTimeout(() => {
        console.log('Attempting fitToScreen...');
        fitToScreen();
      }, 500);
      
      // Reset rendering state after successful render
      setIsRendering(false);
    } catch (error) {
      console.error('Mermaid rendering error:', error);
      console.error('Failed Mermaid code:', mermaidCode);
      
      // Reset rendering state on error
      setIsRendering(false);
      // Show error message - use textContent for the code to avoid HTML issues
      const errorDiv = document.createElement('div');
      errorDiv.style.cssText = 'padding: 20px; color: red;';
      
      const title = document.createElement('h3');
      title.textContent = 'Diagram Rendering Error';
      errorDiv.appendChild(title);
      
      const message = document.createElement('p');
      message.textContent = error.message;
      errorDiv.appendChild(message);
      
      const pre = document.createElement('pre');
      pre.style.cssText = 'background: #f0f0f0; padding: 10px; overflow: auto; font-size: 12px;';
      pre.textContent = mermaidCode;
      errorDiv.appendChild(pre);
      
      diagramRef.current.innerHTML = '';
      diagramRef.current.appendChild(errorDiv);
    }
    
    console.log('=== MERMAID RENDERING END ===');
  };

  const attachClickHandlers = () => {
    if (!diagramRef.current) return;
    
    const nodes = diagramRef.current.querySelectorAll('.node');
    nodes.forEach(node => {
      const nodeId = node.id?.replace('flowchart-', '').replace(/-\d+$/, '');
      
      node.style.cursor = 'pointer';
      node.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        handleNodeClick(nodeId);
      });
      
      if (selectedNode && selectedNode.id === nodeId) {
        node.classList.add('selected');
      }
    });
  };

  const handleNodeClick = (nodeId) => {
    if (focusedModule) {
      const component = focusedModule.details?.components?.find(c => c.name === nodeId);
      if (component) {
        onNodeClick({ ...component, id: nodeId, type: 'component' });
      }
    } else if (focusedGem) {
      const module = focusedGem.modules?.find(m => m === nodeId);
      if (module) {
        onNodeClick({ name: module, id: module, type: 'module' });
      }
    } else {
      const gem = data.gems?.find(g => g.id === nodeId);
      if (gem) {
        onNodeClick(gem);
      }
    }
  };

  // Zoom controls
  const zoomIn = () => {
    setZoomLevel(prev => Math.min(prev * 1.2, 3));
  };

  const zoomOut = () => {
    setZoomLevel(prev => Math.max(prev / 1.2, 0.3));
  };

  const resetZoom = () => {
    setZoomLevel(1);
    setPanOffset({ x: 0, y: 0 });
  };

  const fitToScreen = (retryCount = 0) => {
    if (!containerRef.current || !diagramRef.current) return;
    
    const svg = diagramRef.current.querySelector('svg');
    if (!svg) {
      console.log('SVG not found, retrying...');
      if (retryCount < 5) {
        // Exponential backoff: 200, 400, 800, 1600, 3200ms
        setTimeout(() => fitToScreen(retryCount + 1), 200 * Math.pow(2, retryCount));
      }
      return;
    }
    
    try {
      // Check if SVG is actually in the DOM and visible
      if (!svg.isConnected || !svg.offsetParent) {
        console.log('SVG not ready in DOM, retrying...');
        if (retryCount < 3) {
          setTimeout(() => fitToScreen(retryCount + 1), 300);
        }
        return;
      }
      
      
      // Get the actual SVG dimensions - use safer methods
      let svgWidth, svgHeight;
      
      // First try: getAttribute
      svgWidth = svg.getAttribute('width');
      svgHeight = svg.getAttribute('height');
      
      // Second try: viewBox
      if (!svgWidth || !svgHeight) {
        const viewBox = svg.viewBox?.baseVal;
        if (viewBox) {
          svgWidth = svgWidth || viewBox.width;
          svgHeight = svgHeight || viewBox.height;
        }
      }
      
      // Third try: getBoundingClientRect (safest)
      if (!svgWidth || !svgHeight || svgWidth === '100%' || svgHeight === '100%') {
        const rect = svg.getBoundingClientRect();
        svgWidth = rect.width || 800; // Default width
        svgHeight = rect.height || 600; // Default height
      }
      
      // Last resort: try getBBox if it exists and is safe to call
      if ((!svgWidth || !svgHeight || svgWidth === 0 || svgHeight === 0) && 
          svg.getBBox && typeof svg.getBBox === 'function') {
        try {
          const bbox = svg.getBBox();
          svgWidth = svgWidth || bbox.width || 800;
          svgHeight = svgHeight || bbox.height || 600;
        } catch (bboxError) {
          console.warn('getBBox failed, using defaults:', bboxError);
          svgWidth = svgWidth || 800;
          svgHeight = svgHeight || 600;
        }
      }
      
      const containerRect = containerRef.current.getBoundingClientRect();
      
      const scaleX = containerRect.width / parseFloat(svgWidth);
      const scaleY = containerRect.height / parseFloat(svgHeight);
      const scale = Math.min(scaleX, scaleY, 1) * 0.8; // 80% to add more padding
      
      console.log('Fit to screen:', { svgWidth, svgHeight, containerWidth: containerRect.width, containerHeight: containerRect.height, scale });
      
      setZoomLevel(scale);
      setPanOffset({ x: 0, y: 0 });
    } catch (error) {
      console.error('Error in fitToScreen:', error);
      // Set default zoom level on error
      setZoomLevel(0.8);
      setPanOffset({ x: 0, y: 0 });
    }
  };

  // Pan/drag handling
  const handleMouseDown = (e) => {
    if (e.button !== 0) return; // Only left click
    if (e.target.closest('.node')) return; // Don't drag when clicking nodes
    
    setIsDragging(true);
    setDragStart({
      x: e.clientX - panOffset.x,
      y: e.clientY - panOffset.y
    });
    e.preventDefault();
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    
    setPanOffset({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleWheel = (e) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      const delta = e.deltaY > 0 ? 0.9 : 1.1;
      setZoomLevel(prev => Math.min(Math.max(prev * delta, 0.3), 3));
    }
  };

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    container.addEventListener('wheel', handleWheel, { passive: false });
    
    return () => {
      container.removeEventListener('wheel', handleWheel);
      // Clean up any pending timeouts on unmount
      if (fitToScreenTimeoutRef.current) {
        clearTimeout(fitToScreenTimeoutRef.current);
      }
      if (renderTimeoutRef.current) {
        clearTimeout(renderTimeoutRef.current);
      }
    };
  }, []);

  // Generate Dependency Flow with Architectural Layers
  const generateDependencyFlow = (data, hideAS, metrics) => {
    let code = `flowchart TD\n`;
    
    // Define subgraphs for layers
    code += `  subgraph WebLayer["🌐 Web Layer"]\n`;
    code += `    direction TB\n`;
    const webGems = ['actionpack', 'actionview', 'actioncable', 'actiontext'];
    webGems.forEach(gemId => {
      const gem = data.gems?.find(g => g.id === gemId);
      if (gem) {
        const loc = metrics && gem.loc ? `<br/>${gem.loc.toLocaleString()} LOC` : '';
        code += `    ${gem.id}["${getGemIcon(gem.id)} ${gem.name}${loc}"]\n`;
      }
    });
    code += `  end\n\n`;
    
    code += `  subgraph BusinessLayer["⚡ Business Logic"]\n`;
    code += `    direction TB\n`;
    const businessGems = ['actionmailer', 'actionmailbox', 'activejob', 'activemodel'];
    businessGems.forEach(gemId => {
      const gem = data.gems?.find(g => g.id === gemId);
      if (gem) {
        const loc = metrics && gem.loc ? `<br/>${gem.loc.toLocaleString()} LOC` : '';
        code += `    ${gem.id}["${getGemIcon(gem.id)} ${gem.name}${loc}"]\n`;
      }
    });
    code += `  end\n\n`;
    
    code += `  subgraph DataLayer["💾 Data Layer"]\n`;
    code += `    direction TB\n`;
    const dataGems = ['activerecord', 'activestorage'];
    dataGems.forEach(gemId => {
      const gem = data.gems?.find(g => g.id === gemId);
      if (gem) {
        const loc = metrics && gem.loc ? `<br/>${gem.loc.toLocaleString()} LOC` : '';
        code += `    ${gem.id}["${getGemIcon(gem.id)} ${gem.name}${loc}"]\n`;
      }
    });
    code += `  end\n\n`;
    
    code += `  subgraph Foundation["🛠️ Foundation"]\n`;
    code += `    direction TB\n`;
    const foundationGems = ['activesupport', 'railties'];
    foundationGems.forEach(gemId => {
      const gem = data.gems?.find(g => g.id === gemId);
      if (gem) {
        const loc = metrics && gem.loc ? `<br/>${gem.loc.toLocaleString()} LOC` : '';
        code += `    ${gem.id}["${getGemIcon(gem.id)} ${gem.name}${loc}"]\n`;
      }
    });
    code += `  end\n\n`;
    
    // Add Rails meta-gem
    const railsGem = data.gems?.find(g => g.id === 'rails');
    if (railsGem) {
      const loc = metrics && railsGem.loc ? `<br/>${railsGem.loc.toLocaleString()} LOC` : '';
      code += `  rails["🚂 Rails 8.0${loc}"]:::rails\n\n`;
    }
    
    // Add dependencies between layers
    code += `  %% Cross-layer dependencies\n`;
    data.dependencies?.forEach(dep => {
      if (!hideAS || dep.source !== 'activesupport') {
        // Use different arrow styles based on dependency strength
        let arrow = '-->';
        if (dep.strength > 8) arrow = '==>';
        else if (dep.strength > 5) arrow = '-->';
        else arrow = '-..->';
        
        code += `  ${dep.source} ${arrow} ${dep.target}\n`;
      }
    });
    
    code += `\n  %% Styling\n`;
    code += `  classDef rails fill:#CC0000,stroke:#990000,stroke-width:3px,color:#fff\n`;
    code += `  classDef webLayer fill:#2196F3,stroke:#1565C0,stroke-width:2px,color:#fff\n`;
    code += `  classDef businessLayer fill:#FF9800,stroke:#E65100,stroke-width:2px,color:#fff\n`;
    code += `  classDef dataLayer fill:#4CAF50,stroke:#2E7D32,stroke-width:2px,color:#fff\n`;
    code += `  classDef foundation fill:#9C27B0,stroke:#6A1B9A,stroke-width:2px,color:#fff\n`;
    
    return code;
  };


  // Generate specialized sequence diagrams for different flows
  const generateSequenceDiagram = (data, view) => {
    if (view === 'request-flow' && data.requestFlow) {
      return generateRequestFlowSequence(data.requestFlow);
    } else if (view === 'activerecord-flow' && data.activeRecordFlow) {
      return generateActiveRecordSequence(data.activeRecordFlow);
    } else if (view === 'boot-process' && data.bootProcess) {
      return generateBootSequence(data.bootProcess);
    }
    return generateRequestSequence(data);
  };

  const generateRequestFlowSequence = (flow) => {
    let code = `sequenceDiagram\n`;
    code += `  autonumber\n`;
    
    // Extract unique participants
    const participants = new Set();
    flow.steps?.forEach(step => participants.add(step.name));
    
    participants.forEach(p => {
      code += `  participant ${p.replace(/\s/g, '_')} as ${p}\n`;
    });
    code += `\n`;
    
    // Add connections as sequence interactions
    flow.connections?.forEach(conn => {
      const from = conn.from.replace(/\s/g, '_');
      const to = conn.to.replace(/\s/g, '_');
      const arrow = conn.bidirectional ? '<<->>' : '->>';
      code += `  ${from}${arrow}${to}: Process\n`;
    });
    
    return code;
  };

  const generateActiveRecordSequence = (flow) => {
    let code = `sequenceDiagram\n`;
    code += `  autonumber\n`;
    code += `  participant App as Application\n`;
    code += `  participant AR as ActiveRecord\n`;
    code += `  participant Adapter as Database Adapter\n`;
    code += `  participant DB as Database\n\n`;
    
    code += `  App->>AR: Model.find(id)\n`;
    code += `  AR->>AR: Check query cache\n`;
    code += `  alt Cache hit\n`;
    code += `    AR-->>App: Return cached object\n`;
    code += `  else Cache miss\n`;
    code += `    AR->>Adapter: Build SQL query\n`;
    code += `    Adapter->>DB: Execute SELECT\n`;
    code += `    DB-->>Adapter: Return result set\n`;
    code += `    Adapter-->>AR: Parse results\n`;
    code += `    AR->>AR: Instantiate model\n`;
    code += `    AR->>AR: Run callbacks\n`;
    code += `    AR->>AR: Cache result\n`;
    code += `    AR-->>App: Return model instance\n`;
    code += `  end\n`;
    
    return code;
  };

  const generateBootSequence = (flow) => {
    let code = `sequenceDiagram\n`;
    code += `  autonumber\n`;
    code += `  participant S as System\n`;
    code += `  participant R as Railties\n`;
    code += `  participant E as Engine\n`;
    code += `  participant I as Initializers\n`;
    code += `  participant A as Application\n\n`;
    
    code += `  S->>R: rails server\n`;
    code += `  R->>R: Load boot.rb\n`;
    code += `  R->>R: Load application.rb\n`;
    code += `  R->>E: Load Rails engines\n`;
    code += `  E->>E: Load gem dependencies\n`;
    code += `  E-->>R: Engines loaded\n`;
    code += `  R->>I: Run initializers\n`;
    code += `  loop Each initializer\n`;
    code += `    I->>I: Execute initializer\n`;
    code += `  end\n`;
    code += `  I-->>R: Initialization complete\n`;
    code += `  R->>A: Start application\n`;
    code += `  A->>A: Start web server\n`;
    code += `  A-->>S: Server running\n`;
    
    return code;
  };

  // Generate Gem Architecture (when drilling into a gem)
  const generateGemArchitecture = (gem, metrics) => {
    let code = `classDiagram\n`;
    code += `  class ${gem.name.replace(/\s/g, '')} {\n`;
    code += `    <<Gem>>\n`;
    if (metrics && gem.loc) {
      code += `    +total_loc: ${gem.loc.toLocaleString()}\n`;
    }
    code += `    +modules: ${gem.modules?.length || 0}\n`;
    code += `  }\n\n`;
    
    // Add modules as classes
    if (gem.modules && gem.modules.length > 0) {
      gem.modules.slice(0, 10).forEach(moduleName => {
        const moduleDetails = gem.moduleDetails?.[moduleName];
        code += `  class ${moduleName.replace(/\s/g, '_')} {\n`;
        code += `    <<Module>>\n`;
        if (moduleDetails) {
          if (metrics && moduleDetails.loc) {
            code += `    +loc: ${moduleDetails.loc}\n`;
          }
          if (moduleDetails.methods) {
            moduleDetails.methods.slice(0, 3).forEach(method => {
              code += `    +${method}()\n`;
            });
          }
        }
        code += `  }\n\n`;
        code += `  ${gem.name.replace(/\s/g, '')} *-- ${moduleName.replace(/\s/g, '_')} : contains\n`;
      });
    }
    
    return code;
  };

  // Generate Module Architecture (when drilling into a module)
  const generateModuleArchitecture = (module) => {
    let code = `classDiagram\n`;
    code += `  class ${module.name.replace(/\s/g, '_')} {\n`;
    code += `    <<Module>>\n`;
    if (module.details?.loc) {
      code += `    +loc: ${module.details.loc}\n`;
    }
    code += `  }\n\n`;
    
    // Add components
    if (module.details?.components) {
      module.details.components.forEach(comp => {
        const className = comp.name.replace(/\s/g, '_');
        code += `  class ${className} {\n`;
        code += `    <<${comp.type || 'Component'}>>\n`;
        if (comp.description) {
          code += `    +${comp.description}\n`;
        }
        code += `  }\n\n`;
        code += `  ${module.name.replace(/\s/g, '_')} *-- ${className} : contains\n`;
      });
    }
    
    return code;
  };

  const getGemIcon = (gemId) => {
    const icons = {
      'actioncable': '🔌',
      'actionmailbox': '📬',
      'actionmailer': '📧',
      'actionpack': '📦',
      'actiontext': '📝',
      'actionview': '👁️',
      'activejob': '⚙️',
      'activemodel': '🔧',
      'activerecord': '💾',
      'activestorage': '💿',
      'activesupport': '🛠️',
      'railties': '🚂'
    };
    return icons[gemId] || '💎';
  };

  const getCategoryName = (type) => {
    const categories = {
      'web': 'Web Layer',
      'core': 'Core Component',
      'framework': 'Framework',
      'utility': 'Utility'
    };
    return categories[type] || 'Component';
  };

  return (
    <div 
      className="mermaid-view" 
      ref={containerRef}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      <div 
        className={`mermaid-container ${isDragging ? 'dragging' : ''}`}
        ref={diagramRef}
        style={{
          transform: `translate(${panOffset.x}px, ${panOffset.y}px) scale(${zoomLevel})`
        }}
      >
        {!mermaidCode && <div className="loading">Generating {viewType} diagram...</div>}
      </div>
      
      <div className="mermaid-controls">
        <button 
          className="zoom-btn"
          onClick={zoomIn}
          title="Zoom In (Ctrl+Scroll)"
        >
          🔍+
        </button>
        <button 
          className="zoom-btn"
          onClick={zoomOut}
          title="Zoom Out (Ctrl+Scroll)"
        >
          🔍-
        </button>
        <button 
          className="zoom-btn"
          onClick={fitToScreen}
          title="Fit to Screen"
        >
          ⊡
        </button>
        <button 
          className="zoom-btn"
          onClick={resetZoom}
          title="Reset View"
        >
          ↺
        </button>
        <span className="zoom-level">{Math.round(zoomLevel * 100)}%</span>
      </div>
      
      <div className="mermaid-hint">
        Use Ctrl+Scroll to zoom • Drag to pan
      </div>

      {currentView === 'activerecord-flow' && (
        <>
          <PageNavigation 
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
          />
          <NotesPanel 
            currentPage={currentPage}
            isExpanded={notesExpanded}
            onToggle={() => setNotesExpanded(!notesExpanded)}
          />
        </>
      )}
    </div>
  );
}

export default MermaidView;