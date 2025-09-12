import React, { useState } from 'react';
import { getHttpRequestFlowNotes } from './httpRequestFlowNotes';
import './NotesPanel.css';

const pageNotes = {
  1: {
    title: "Core Components Overview",
    content: `
      **ActiveRecord Base Architecture**
      
      This diagram shows the primary classes and modules that power ActiveRecord queries:
      
      **Core Components:**
      • **ActiveRecord::Base** - The foundation class all models inherit from. Provides ORM capabilities, validations, callbacks, and associations
      • **ActiveRecord::Relation** - Lazy-loaded query builder that accumulates query conditions without executing until needed
      • **QueryMethods** - Module providing chainable methods like \`where\`, \`select\`, \`joins\`, \`order\`, \`limit\`
      • **SpawnMethods** - Handles creation of new Relation instances when chaining queries, preserving immutability
      
      **Supporting Modules:**
      • **Querying** - Class-level query interface that delegates to Relation (provides \`User.where\` syntax)
      • **Scoping** - Manages named scopes and default scopes for models
      • **PredicateBuilder** - Converts Ruby hash conditions into Arel predicates (e.g., \`{name: 'John'}\` → SQL conditions)
      • **WhereClause** - Internal storage for WHERE conditions before SQL generation
      • **JoinDependency** - Resolves and builds association joins, handling nested associations
      • **Preloader** - Prevents N+1 queries by loading associations in separate optimized queries
      
      **SQL Layer:**
      • **Arel** - Abstract Syntax Tree builder that represents SQL in Ruby objects
      • **ConnectionAdapter** - Database-specific adapter (PostgreSQL, MySQL, SQLite) that handles actual SQL execution
      • **ActiveRecord::Result** - Wraps raw database results with type casting and attribute mapping
      
      The flow moves from high-level Ruby methods through query building, AST generation, and finally SQL execution.
    `
  },
  2: {
    title: "Lazy Query Initialization",
    content: `
      **Building Without Executing**
      
      Query: \`User.where(email: 'user@example.com')\`
      
      This flow demonstrates Rails' lazy loading - building query objects without database access:
      
      **Step-by-Step Process:**
      
      1. **User.where(email: 'user@example.com')** - Your initial query call on the model
      
      2. **Querying.where** - Class method from Querying module that handles the delegation
      
      3. **all.where** - Creates or retrieves the current Relation, then calls where on it
      
      4. **Relation.new** - Instantiates a new Relation object to maintain immutability
      
      5. **QueryMethods#where** - The actual where method that processes your conditions
      
      6. **SpawnMethods#spawn** - Creates a clone of the current relation for chaining
      
      7. **build_where_clause** - Internal method that processes the where conditions
      
      8. **PredicateBuilder.build** - Converts Ruby hash/array conditions to Arel nodes
         - Handles type casting based on column types
         - Supports ranges, arrays, and subqueries
      
      9. **Arel::Nodes::Equality** - Creates an AST node representing the equality condition
      
      10. **WhereClause.new** - Wraps the Arel predicates for internal storage
      
      11. **relation.where_clause +=** - Adds the new conditions to the relation's internal state
      
      12. **Relation (unloaded)** - Returns the relation object, still unexecuted
      
      13. **❌ No SQL Executed** - Confirms no database query has been sent
      
      **Key Insight:** The entire process builds up internal state without any database communication. SQL generation and execution only happen when you call a terminal method like \`.first\`, \`.to_a\`, or \`.count\`.
    `
  },
  3: {
    title: "Simple Query Execution",
    content: `
      **From Ruby to Results**
      
      Query: \`User.where(...).first\`
      
      This flow shows the complete execution pipeline when a terminal method triggers database access:
      
      **Execution Flow:**
      
      1. **User.where(...).first** - The \`.first\` method triggers actual execution
      
      2. **Relation#first** - Terminal method that initiates the database query
      
      3. **find_nth(0)** - Internal method to find the nth record (0 = first)
      
      4. **limit(1)** - Automatically adds LIMIT 1 to the query for efficiency
      
      5. **Relation#to_a** - Converts the relation to an array, forcing execution
      
      6. **load** - Loads the records if not already loaded (checks @loaded flag)
      
      7. **exec_queries** - Core method that orchestrates query execution
      
      **Arel Building Phase:**
      
      8. **build_arel** - Constructs the complete Abstract Syntax Tree
      
      9. **Arel::SelectManager** - Main AST node that represents a SELECT statement
      
      10. **build_select** - Adds SELECT clause (columns to retrieve)
      
      11. **build_where** - Adds WHERE conditions from stored predicates
      
      12. **build_limit** - Adds LIMIT clause for result restriction
      
      **SQL Generation Phase:**
      
      13. **to_sql(arel)** - Converts the Arel AST to SQL string
      
      14. **Arel::Visitors::ToSql** - Visitor pattern implementation for SQL generation
          - Database-specific visitor for proper SQL dialect
      
      15. **SQL String** - Final SQL: \`SELECT users.* FROM users WHERE users.email = ? LIMIT 1\`
      
      **Database Execution:**
      
      16. **connection.execute** - Sends SQL to database through adapter
      
      17. **Database Driver** - Native database driver (pg, mysql2, sqlite3)
      
      18. **Raw Result** - Raw response from database (array of hashes)
      
      **Object Instantiation:**
      
      19. **ActiveRecord::Result** - Wraps raw results with column info and type mapping
      
      20. **instantiate_records** - Creates ActiveRecord objects from raw data
          - Handles type casting based on schema
          - Sets up attribute tracking
      
      21. **User Instance** - Final User object with all attributes loaded
    `
  },
  4: {
    title: "Query with Joins",
    content: `
      **Association Joining**
      
      Query: \`User.joins(:posts).where(posts: { published: true })\`
      
      This flow demonstrates how Rails handles JOIN operations through associations:
      
      **Query Building Phase:**
      
      1. **User.joins(:posts).where(...)** - Initial query with join and conditions
      
      2. **QueryMethods#joins** - Processes the joins argument
         - Accepts symbols, strings, or hashes for nested joins
      
      3. **spawn + joins_values** - Creates new relation with join information stored
      
      **WHERE Clause Processing:**
      
      4. **QueryMethods#where** - Processes the where conditions
      
      5. **posts: {published: true}** - Nested hash condition for joined table
      
      6. **resolve_association** - Determines which table the condition applies to
         - Maps \`:posts\` to the posts table
      
      7. **build_for_association** - Creates conditions for association table
         - Handles table aliasing if needed
      
      8. **Table['posts']['published']** - Arel table reference for posts.published column
      
      **Execution Triggering:**
      
      9. **exec_queries** - Terminal method triggers execution
      
      10. **build_arel** - Starts building the complete AST
      
      **JOIN Construction Phase:**
      
      11. **build_joins** - Dedicated method for processing all joins
      
      12. **JoinDependency.new** - Creates dependency tree for associations
          - Handles nested and multiple associations
          - Prevents duplicate joins
      
      13. **reflect_on_association** - Looks up association definition from model
          - Gets foreign key, class name, join type
      
      14. **JoinAssociation** - Represents a single association join
          - Knows how to build join conditions
      
      15. **ON posts.user_id = users.id** - Generated join condition from association
          - Uses foreign key from association definition
      
      16. **Arel::Nodes::InnerJoin** - Arel node representing INNER JOIN
      
      **SQL Generation:**
      
      17. **Complete Arel AST** - Full query tree with SELECT, JOIN, WHERE
      
      18. **to_sql(arel)** - Converts complete AST to SQL
      
      19. **SELECT ... INNER JOIN ...** - Final SQL:
          \`SELECT users.* FROM users\`
          \`INNER JOIN posts ON posts.user_id = users.id\`
          \`WHERE posts.published = true\`
      
      20. **User instances** - Final results with only users having published posts
      
      **Key Points:**
      - Rails automatically determines join conditions from associations
      - Nested hash conditions are properly attributed to joined tables
      - Multiple joins are handled efficiently with deduplication
    `
  },
  5: {
    title: "Complex Query with Includes",
    content: `
      **N+1 Prevention Strategy**
      
      Query: \`User.includes(:posts, :profile).where(active: true)\`
      
      Rails uses separate queries to prevent N+1 problems. Here's the complete flow:
      
      **Initial Setup:**
      
      1. **User.includes(:posts, :profile)** - Specifies associations to preload
      
      2. **QueryMethods#includes** - Stores associations in includes_values
      
      3. **includes_values = [...]** - Internal storage of associations to preload
      
      **Main Query Execution:**
      
      4. **exec_queries** - Triggered by terminal method (implicit or explicit)
      
      5. **build_arel (no includes)** - Includes are NOT added to main query
         - This keeps the main query simple and fast
      
      6. **SELECT users.* ...** - Main query without JOIN:
         \`SELECT users.* FROM users WHERE users.active = true\`
      
      7. **connection.select_all** - Execute main query
      
      8. **User instances [1,2,3...]** - Load primary User records with IDs
      
      **Preloading Phase:**
      
      9. **preload_associations** - Called automatically after main query
      
      10. **Preloader.new** - Instantiates the preloader system
      
      **Posts Preloading:**
      
      11. **preloaders_for(:posts)** - Creates preloader for posts association
      
      12. **Preloader::HasMany** - Specific preloader for has_many associations
      
      13. **Post.where(user_id: IN)** - Builds query with all user IDs:
          \`SELECT posts.* FROM posts WHERE posts.user_id IN (1, 2, 3...)\`
      
      14. **SELECT posts.* ...** - Single query to load ALL posts
      
      15. **Load all posts** - Fetches all posts in one query
      
      16. **Associate to users** - Groups posts by user_id and assigns to users
          - Uses in-memory grouping, no additional queries
      
      **Profile Preloading:**
      
      17. **preloaders_for(:profile)** - Creates preloader for profile association
      
      18. **Preloader::HasOne** - Specific preloader for has_one associations
      
      19. **Profile.where(user_id: IN)** - Builds query with all user IDs:
          \`SELECT profiles.* FROM profiles WHERE profiles.user_id IN (1, 2, 3...)\`
      
      20. **SELECT profiles.* ...** - Single query to load ALL profiles
      
      21. **Load all profiles** - Fetches all profiles in one query
      
      22. **Associate to users** - Maps each profile to its user
      
      **Final Result:**
      
      23. **Users with associations** - Users with posts and profiles loaded
          - Total queries: 3 (instead of 1 + N + N for N users)
          - Memory efficient: associations are loaded on demand
      
      **Benefits:**
      - 3 total queries regardless of user count
      - No N+1 problem when accessing user.posts or user.profile
      - Associations are automatically available without lazy loading
    `
  },
  6: {
    title: "SQL Generation Pipeline",
    content: `
      **Complete Transformation Flow**
      
      This diagram shows the complete pipeline from Ruby DSL to executable SQL:
      
      **Ruby DSL Layer:**
      
      1. **Ruby DSL Methods** - High-level ActiveRecord query interface
         - \`where\`, \`select\`, \`joins\`, \`order\`, \`limit\`, etc.
         - Chainable and composable
      
      2. **Internal State Storage** - Accumulates query components
         - No SQL generation yet, just Ruby objects
      
      **Storage Components:**
      
      3. **WhereClause** - Stores WHERE conditions as predicates
         - Maintains AND/OR logic between conditions
      
      4. **joins_values** - Array of associations or SQL fragments to join
      
      5. **select_values** - Columns to select (default: table.*)
      
      6. **order_values** - ORDER BY expressions
      
      **Conversion Layer:**
      
      7. **PredicateBuilder** - Converts Ruby conditions to Arel
         - Handles type casting based on column types
         - Supports ranges, arrays, subqueries
         - Database-agnostic representation
      
      8. **Arel Nodes** - Abstract Syntax Tree nodes
         - Equality, GreaterThan, In, Between, etc.
         - Composable tree structure
      
      9. **Arel::SelectManager** - Root node for SELECT queries
         - Orchestrates all query components
         - Maintains query structure
      
      10. **SelectStatement AST** - Complete query as abstract tree
          - Platform-independent representation
          - Can be manipulated before SQL generation
      
      **Visitor Pattern Layer:**
      
      11. **Arel::Visitors::ToSql** - Base visitor for SQL generation
          - Implements visitor pattern for AST traversal
      
      12. **visit_* methods** - Specific methods for each node type
          - visit_Arel_Nodes_Equality
          - visit_Arel_Nodes_SelectStatement
          - etc.
      
      **Database-Specific Adapters:**
      
      13. **PostgreSQL::ToSql** - PostgreSQL-specific SQL generation
          - RETURNING clauses, array operators, JSON support
      
      14. **MySQL::ToSql** - MySQL-specific SQL generation  
          - Backtick quoting, LIMIT syntax differences
      
      15. **SQLite::ToSql** - SQLite-specific SQL generation
          - Different datetime handling, simpler features
      
      **SQL & Execution Layer:**
      
      16. **Final SQL String** - Database-specific SQL statement
          - Properly escaped and quoted
          - Parameterized for security
      
      17. **StatementCache** - Caches prepared statements
          - Reuses prepared statements for performance
          - Reduces parsing overhead
      
      18. **ConnectionAdapter** - Database connection handler
          - Manages connection pool
          - Handles transactions
          - Executes prepared statements
      
      19. **ActiveRecord::Result** - Wraps query results
          - Type casting based on schema
          - Lazy materialization of records
      
      **Key Benefits:**
      - Database independence through abstraction
      - SQL injection prevention through parameterization  
      - Performance optimization via prepared statements
      - Extensible through visitor pattern
    `
  }
};

function NotesPanel({ currentPage, isExpanded, onToggle, viewType = 'activerecord-flow', visibleSubFlows = null }) {
  let notes;
  
  if (viewType === 'request-flow') {
    notes = getHttpRequestFlowNotes(currentPage, visibleSubFlows);
  } else {
    notes = pageNotes[currentPage] || { title: "Notes", content: "No notes available for this page." };
  }

  const renderMarkdown = (text) => {
    // Process text line by line for markdown rendering
    const lines = text.trim().split('\n');
    const elements = [];
    let inList = false;
    let listItems = [];
    
    const processInlineMarkdown = (text) => {
      // Handle bold text
      let processed = text;
      
      // Handle **bold** text
      const boldParts = processed.split(/\*\*([^*]+)\*\*/g);
      if (boldParts.length > 1) {
        return boldParts.map((part, i) => 
          i % 2 === 0 ? part : <strong key={`bold-${i}`}>{part}</strong>
        );
      }
      
      // Handle `code` blocks
      const codeParts = processed.split(/`([^`]+)`/g);
      if (codeParts.length > 1) {
        return codeParts.map((part, i) => 
          i % 2 === 0 ? part : <code key={`code-${i}`}>{part}</code>
        );
      }
      
      return processed;
    };
    
    lines.forEach((line, index) => {
      const trimmedLine = line.trim();
      
      // Skip empty lines
      if (!trimmedLine) {
        // Close any open list
        if (inList && listItems.length > 0) {
          elements.push(<ul key={`list-${index}`}>{listItems}</ul>);
          listItems = [];
          inList = false;
        }
        return;
      }
      
      // Handle headers (lines that are entirely bold)
      if (trimmedLine.startsWith('**') && trimmedLine.endsWith('**') && !trimmedLine.includes(' **')) {
        // Close any open list
        if (inList && listItems.length > 0) {
          elements.push(<ul key={`list-${index}`}>{listItems}</ul>);
          listItems = [];
          inList = false;
        }
        elements.push(
          <h4 key={`header-${index}`}>{trimmedLine.slice(2, -2)}</h4>
        );
        return;
      }
      
      // Handle bullet points
      if (trimmedLine.startsWith('•') || trimmedLine.startsWith('-')) {
        inList = true;
        const content = trimmedLine.slice(1).trim();
        listItems.push(
          <li key={`item-${index}`}>{processInlineMarkdown(content)}</li>
        );
        return;
      }
      
      // Handle numbered lists
      if (/^\d+\./.test(trimmedLine)) {
        inList = true;
        const content = trimmedLine.replace(/^\d+\.\s*/, '');
        listItems.push(
          <li key={`item-${index}`}>{processInlineMarkdown(content)}</li>
        );
        return;
      }
      
      // Close any open list before adding paragraph
      if (inList && listItems.length > 0) {
        elements.push(<ul key={`list-${index}`}>{listItems}</ul>);
        listItems = [];
        inList = false;
      }
      
      // Regular paragraphs with inline formatting
      elements.push(
        <p key={`para-${index}`}>{processInlineMarkdown(trimmedLine)}</p>
      );
    });
    
    // Close any remaining open list
    if (inList && listItems.length > 0) {
      elements.push(<ul key={`list-final`}>{listItems}</ul>);
    }
    
    return elements;
  };

  return (
    <>
      <button 
        className="notes-toggle"
        onClick={onToggle}
        aria-label={isExpanded ? "Hide notes" : "Show notes"}
        title={isExpanded ? "Hide notes" : "Show notes"}
      >
        📝
      </button>

      <div className={`notes-panel ${isExpanded ? 'expanded' : ''}`}>
        <div className="notes-header">
          <h3>{notes.title}</h3>
          <button 
            className="notes-close"
            onClick={onToggle}
            aria-label="Close notes"
          >
            ×
          </button>
        </div>
        <div className="notes-content">
          {renderMarkdown(notes.content)}
        </div>
      </div>
    </>
  );
}

export default NotesPanel;