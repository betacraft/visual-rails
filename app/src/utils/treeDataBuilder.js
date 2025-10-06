/**
 * Transform Rails structure JSON into D3 hierarchy format for collapsible tree
 */

/**
 * Build tree data from Rails JSON structure
 * @param {Object} railsData - The rails_structure_real.json data
 * @param {Boolean} hideEmpty - Whether to hide modules/classes without public methods
 * @returns {Object} D3-compatible hierarchy structure
 */
export function buildTreeData(railsData, hideEmpty = false) {
  const root = {
    name: "Rails",
    type: "root",
    children: []
  };

  // Process each gem
  railsData.gems.forEach(gem => {
    const gemNode = {
      name: gem.name,
      type: "gem",
      description: gem.description,
      loc: gem.loc,
      children: []
    };

    // Get moduleDetails and classDetails for this gem
    const moduleDetails = gem.moduleDetails || {};
    const classDetails = gem.classDetails || {};

    // Process each module
    Object.entries(moduleDetails).forEach(([moduleName, details]) => {
      const moduleNode = buildModuleNode(moduleName, details, classDetails, hideEmpty);

      // Only add module if it has children or has methods (when not hiding empty)
      if (moduleNode && (moduleNode.children.length > 0 || !hideEmpty)) {
        gemNode.children.push(moduleNode);
      }
    });

    // Only add gem if it has modules (children)
    if (gemNode.children.length > 0) {
      root.children.push(gemNode);
    }
  });

  return root;
}

/**
 * Build a module node with its classes and methods
 */
function buildModuleNode(moduleName, details, classDetails, hideEmpty) {
  const moduleNode = {
    name: moduleName,
    type: "module",
    description: details.description,
    loc: details.loc,
    children: []
  };

  const moduleMethods = details.methods || [];
  const moduleClassMethods = details.class_methods || [];
  const hasModuleMethods = moduleMethods.length > 0 || moduleClassMethods.length > 0;

  // Find classes that belong to this module (prefix matching)
  const moduleClasses = Object.entries(classDetails)
    .filter(([className]) => className.startsWith(moduleName + "::"))
    .filter(([_, classDetail]) => {
      // If hiding empty, only include classes with methods
      if (hideEmpty) {
        const hasMethods = (classDetail.methods?.length || 0) > 0 ||
                         (classDetail.class_methods?.length || 0) > 0;
        return hasMethods;
      }
      return true;
    });

  // Add classes as children
  moduleClasses.forEach(([className, classDetail]) => {
    const classNode = buildClassNode(className, classDetail);
    if (classNode) {
      moduleNode.children.push(classNode);
    }
  });

  // Add module's own methods as children (if any)
  if (hasModuleMethods && !hideEmpty) {
    // Add instance methods
    moduleMethods.forEach(methodName => {
      moduleNode.children.push({
        name: `#${methodName}`,
        type: "method",
        methodType: "instance"
      });
    });

    // Add class methods
    moduleClassMethods.forEach(methodName => {
      moduleNode.children.push({
        name: `.${methodName}`,
        type: "class_method",
        methodType: "class"
      });
    });
  } else if (hasModuleMethods && hideEmpty) {
    // When hiding empty, still show if module has methods directly
    moduleMethods.forEach(methodName => {
      moduleNode.children.push({
        name: `#${methodName}`,
        type: "method",
        methodType: "instance"
      });
    });

    moduleClassMethods.forEach(methodName => {
      moduleNode.children.push({
        name: `.${methodName}`,
        type: "class_method",
        methodType: "class"
      });
    });
  }

  return moduleNode;
}

/**
 * Build a class node with its methods
 */
function buildClassNode(className, details) {
  const classNode = {
    name: className,
    type: "class",
    description: details.description,
    superclass: details.superclass,
    loc: details.loc,
    children: []
  };

  const instanceMethods = details.methods || [];
  const classMethods = details.class_methods || [];

  // Add instance methods
  instanceMethods.forEach(methodName => {
    classNode.children.push({
      name: `#${methodName}`,
      type: "method",
      methodType: "instance"
    });
  });

  // Add class methods
  classMethods.forEach(methodName => {
    classNode.children.push({
      name: `.${methodName}`,
      type: "class_method",
      methodType: "class"
    });
  });

  return classNode;
}

/**
 * Count total nodes in tree (for performance monitoring)
 */
export function countNodes(node) {
  let count = 1; // Count this node

  if (node.children && node.children.length > 0) {
    node.children.forEach(child => {
      count += countNodes(child);
    });
  }

  return count;
}

/**
 * Get tree statistics
 */
export function getTreeStats(treeData) {
  const stats = {
    totalNodes: 0,
    gems: 0,
    modules: 0,
    classes: 0,
    methods: 0
  };

  function traverse(node) {
    stats.totalNodes++;

    switch(node.type) {
      case 'gem':
        stats.gems++;
        break;
      case 'module':
        stats.modules++;
        break;
      case 'class':
        stats.classes++;
        break;
      case 'method':
      case 'class_method':
        stats.methods++;
        break;
    }

    if (node.children) {
      node.children.forEach(traverse);
    }
  }

  traverse(treeData);
  return stats;
}
