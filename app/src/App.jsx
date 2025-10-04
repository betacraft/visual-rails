import React, { useState, useEffect } from 'react';
import GraphView from './components/GraphView';
import MermaidView from './components/MermaidView';
import InfoPanel from './components/InfoPanel';
import Breadcrumb from './components/Breadcrumb';
import Sidebar from './components/Sidebar';
import railsData from '../data/rails_structure_real.json';
import './App.css';

function App() {
  const [currentView, setCurrentView] = useState('overview');
  const [selectedNode, setSelectedNode] = useState(null);
  const [navigationPath, setNavigationPath] = useState(['Visual Rails']);
  const [focusedGem, setFocusedGem] = useState(null);
  const [focusedModule, setFocusedModule] = useState(null);
  const [presentationMode, setPresentationMode] = useState(false);
  const [hideActiveSupport, setHideActiveSupport] = useState(false);
  const [d3LayoutType, setD3LayoutType] = useState('force');
  const [mermaidViewType, setMermaidViewType] = useState('dependency');
  const [showMetrics, setShowMetrics] = useState(false);
  const [graphStyle, setGraphStyle] = useState('d3');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  useEffect(() => {
    const handleKeyPress = (e) => {
      // Handle ESC key separately - go back one level
      if (e.key === 'Escape') {
        handleBackNavigation();
        return;
      }
      
      switch(e.key) {
        case 'f':
        case 'F':
          toggleFullscreen();
          break;
        case 'p':
        case 'P':
          setPresentationMode(!presentationMode);
          break;
      }
    };

    // Use keydown instead of keypress to capture ESC
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [presentationMode, focusedModule, focusedGem, currentView]);

  const handleSidebarNavigate = (view) => {
    switch(view) {
      case 'overview':
        showOverview();
        break;
      case 'activerecord-flow':
        showActiveRecord();
        break;
      case 'request-flow':
        showActionPack();
        break;
      case 'boot-process':
        showRailties();
        break;
    }
  };

  const handleBackNavigation = () => {
    if (currentView === 'request-flow' || currentView === 'activerecord-flow' || currentView === 'boot-process') {
      // Go back from flow views to overview
      showOverview();
    } else if (focusedModule) {
      // Go back from module view to gem view
      setFocusedModule(null);
      setSelectedNode(null);
      setNavigationPath(['Visual Rails', focusedGem.name]);
    } else if (focusedGem) {
      // Go back from gem view to overview
      setFocusedGem(null);
      setFocusedModule(null);
      setSelectedNode(null);
      setNavigationPath(['Visual Rails']);
    } else {
      // Already at overview, do nothing or could show a message
      setSelectedNode(null);
    }
  };

  const showOverview = () => {
    setCurrentView('overview');
    setSelectedNode(null);
    setFocusedGem(null);
    setFocusedModule(null);
    setNavigationPath(['Visual Rails']);
  };

  const showActiveRecord = () => {
    setCurrentView('activerecord-flow');
    setSelectedNode(null);
    setFocusedGem(null);
    setFocusedModule(null);
    setNavigationPath(['Visual Rails', 'ActiveRecord Flow']);
  };

  const showActionPack = () => {
    setCurrentView('request-flow');
    setSelectedNode(null);
    setFocusedGem(null);
    setFocusedModule(null);
    setNavigationPath(['Visual Rails', 'Request Flow']);
  };

  const showRailties = () => {
    setCurrentView('boot-process');
    setSelectedNode(null);
    setFocusedGem(null);
    setFocusedModule(null);
    setNavigationPath(['Visual Rails', 'Boot Process']);
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
  };

  const handleNodeClick = (node) => {
    if (!node) {
      setSelectedNode(null);
      return;
    }
    
    // Check if we're in module view (viewing components)
    if (focusedModule) {
      // In component view, just select the component
      setSelectedNode(node);
      return;
    }
    
    // Check if we're in gem view (viewing modules)
    if (focusedGem) {
      // Clicking on a module
      if (node.type === 'module') {
        if (selectedNode && selectedNode.id === node.id) {
          // Second click - drill down into the module
          const moduleDetails = focusedGem.moduleDetails && focusedGem.moduleDetails[node.name];
          if (moduleDetails) {
            setFocusedModule({
              ...node,
              details: moduleDetails,
              parentGem: focusedGem
            });
            setNavigationPath(['Visual Rails', focusedGem.name, node.name]);
            setSelectedNode(null);
          }
        } else {
          // First click - select the module
          setSelectedNode(node);
        }
      }
      return;
    }
    
    // In overview - clicking on gems
    setSelectedNode(node);
    
    // Double-click or second click on same node to drill down
    if (selectedNode && selectedNode.id === node.id) {
      // Drill down into the gem
      setFocusedGem(node);
      setNavigationPath(['Visual Rails', node.name]);
      setSelectedNode(null);
    } else {
      // Just select the node
      const newPath = [...navigationPath];
      if (navigationPath.length === 1) {
        newPath.push(node.name);
      } else {
        newPath[navigationPath.length - 1] = node.name;
      }
      setNavigationPath(newPath);
    }
  };

  const handleNavigate = (index) => {
    if (index === 0) {
      showOverview();
    } else if (index === 1 && focusedGem) {
      // Go back to gem view from module view
      setFocusedModule(null);
      setSelectedNode(null);
      setNavigationPath(['Visual Rails', focusedGem.name]);
    } else if (index === 2 && focusedModule) {
      // Stay in module view
      setNavigationPath(navigationPath.slice(0, index + 1));
    } else {
      setNavigationPath(navigationPath.slice(0, index + 1));
    }
  };

  return (
    <div className={`app ${presentationMode ? 'presentation-mode' : ''} ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
      {!presentationMode && (
        <Sidebar 
          currentView={currentView}
          onNavigate={handleSidebarNavigate}
          collapsed={sidebarCollapsed}
          onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        />
      )}
      {!presentationMode && (
        <>
          <header className="app-header">
            <div className="header-content">
              <h1>Visual Rails</h1>
            </div>
            <Breadcrumb 
              path={navigationPath} 
              onNavigate={handleNavigate}
              onBack={handleBackNavigation}
            />
          </header>
          
          <div className="controls-bar">
            <div className="control-group">
              <label className="control-label">Style:</label>
              <div className="style-buttons">
                <button 
                  className={`style-btn ${graphStyle === 'd3' ? 'active' : ''}`}
                  onClick={() => setGraphStyle('d3')}
                  title="Interactive D3.js visualization"
                >
                  D3.js
                </button>
                <button 
                  className={`style-btn ${graphStyle === 'mermaid' ? 'active' : ''}`}
                  onClick={() => setGraphStyle('mermaid')}
                  title="Mermaid diagram visualization"
                >
                  Mermaid
                </button>
              </div>
            </div>
            
            {graphStyle === 'd3' && (
              <div className="control-group">
                <label className="control-label">Layout:</label>
                <div className="layout-buttons">
                  <button
                    className={`layout-btn ${d3LayoutType === 'force' ? 'active' : ''}`}
                    onClick={() => setD3LayoutType('force')}
                    title="Free-form force-directed layout"
                  >
                    Force
                  </button>
                  <button
                    className={`layout-btn ${d3LayoutType === 'hierarchical' ? 'active' : ''}`}
                    onClick={() => setD3LayoutType('hierarchical')}
                    title="Top-down dependency hierarchy"
                  >
                    Hierarchical
                  </button>
                  <button
                    className={`layout-btn ${d3LayoutType === 'circular' ? 'active' : ''}`}
                    onClick={() => setD3LayoutType('circular')}
                    title="Circular arrangement"
                  >
                    Circular
                  </button>
                  <button
                    className={`layout-btn ${d3LayoutType === 'tree' ? 'active' : ''}`}
                    onClick={() => setD3LayoutType('tree')}
                    title="Horizontal tree layout"
                  >
                    Tree
                  </button>
                  <button
                    className={`layout-btn ${d3LayoutType === 'radial-tree' ? 'active' : ''}`}
                    onClick={() => setD3LayoutType('radial-tree')}
                    title="Radial tree layout"
                  >
                    Radial
                  </button>
                </div>
              </div>
            )}
            
            {graphStyle === 'd3' && (
              <>
                <div className="control-group">
                  <button 
                    className={`toggle-button ${hideActiveSupport ? 'active' : ''}`}
                    onClick={() => setHideActiveSupport(!hideActiveSupport)}
                    title="Hide ActiveSupport connections to simplify the view"
                  >
                    {hideActiveSupport ? '👁️' : '🚫'} ActiveSupport
                  </button>
                </div>
                
                <div className="control-group">
                  <button 
                    className={`toggle-button ${showMetrics ? 'active' : ''}`}
                    onClick={() => setShowMetrics(!showMetrics)}
                    title="Toggle lines of code display"
                  >
                    📊 Metrics
                  </button>
                </div>
              </>
            )}
          </div>
        </>
      )}
      
      <main className="app-main">
        {graphStyle === 'd3' ? (
          <GraphView 
            data={railsData}
            currentView={currentView}
            onNodeClick={handleNodeClick}
            selectedNode={selectedNode}
            hideActiveSupport={hideActiveSupport}
            layoutType={d3LayoutType}
            showMetrics={showMetrics}
            focusedGem={focusedGem}
            focusedModule={focusedModule}
          />
        ) : (
          <MermaidView 
            data={railsData}
            currentView={currentView}
            onNodeClick={handleNodeClick}
            selectedNode={selectedNode}
            hideActiveSupport={hideActiveSupport}
            viewType={mermaidViewType}
            showMetrics={showMetrics}
            focusedGem={focusedGem}
            focusedModule={focusedModule}
          />
        )}
        
        {!presentationMode && selectedNode && (
          <InfoPanel 
            node={selectedNode}
            data={railsData}
          />
        )}
      </main>

      {!presentationMode && (
        <footer className="app-footer">
          <div className="keyboard-hints">
            <span>Click to select</span>
            <span>Click again to drill down</span>
            <span>|</span>
            <span>F: Fullscreen</span>
            <span>P: Presentation</span>
            <span>ESC: Back</span>
          </div>
        </footer>
      )}
    </div>
  );
}

export default App
