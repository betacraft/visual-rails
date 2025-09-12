import React, { useState } from 'react';
import './NotesPanel.css';

const pageNotes = {
  1: {
    title: "Core Components Overview",
    content: `
      **ActiveRecord Base Architecture**
      
      This diagram shows the primary classes and modules that power ActiveRecord queries:
      
      • **ActiveRecord::Base** - Entry point for all model operations
      • **ActiveRecord::Relation** - Represents unexecuted queries with lazy loading
      • **QueryMethods** - Provides chainable query building methods
      • **Arel** - Abstract Syntax Tree for SQL generation
      • **ConnectionAdapters** - Database-specific communication layer
      
      Each component plays a crucial role in transforming Ruby method calls into optimized SQL queries.
    `
  },
  2: {
    title: "Lazy Query Initialization",
    content: `
      **Building Without Executing**
      
      Query: \`User.where(email: 'someone@example.com')\`
      
      This flow demonstrates how Rails builds query objects without hitting the database:
      
      1. **Querying module** delegates to Relation
      2. **Relation#where** creates a new Relation instance
      3. **PredicateBuilder** converts Ruby conditions to Arel nodes
      4. **WhereClause** stores predicates for later execution
      
      The query remains unexecuted until a terminal method like \`.first\` or \`.to_a\` is called.
      No SQL is generated or sent to the database at this stage.
    `
  },
  3: {
    title: "Simple Query Execution",
    content: `
      **From Ruby to Results**
      
      Query: \`User.where(email: 'someone@example.com').first\`
      
      This flow shows the complete execution pipeline:
      
      1. **Terminal method** (.first) triggers execution
      2. **build_arel** constructs the Abstract Syntax Tree
      3. **Arel::Visitors::ToSql** converts AST to SQL string
      4. **ConnectionAdapter** executes the query
      5. **Result** wraps raw database response
      6. **Instantiation** creates model instances with type casting
      
      SQL Generated: \`SELECT users.* FROM users WHERE users.email = ? LIMIT 1\`
    `
  },
  4: {
    title: "Query with Joins",
    content: `
      **Association Joining**
      
      Query: \`User.joins(:posts).where(posts: { published: true })\`
      
      This flow demonstrates complex JOIN operations:
      
      1. **joins(:posts)** adds association to joins_values
      2. **JoinDependency** resolves association references
      3. **JoinAssociation** builds JOIN constraints using foreign keys
      4. **Nested conditions** in where clause reference joined tables
      5. **Arel** constructs INNER JOIN with ON conditions
      
      SQL Generated: \`SELECT users.* FROM users INNER JOIN posts ON posts.user_id = users.id WHERE posts.published = true\`
      
      The framework automatically determines join conditions from association definitions.
    `
  },
  5: {
    title: "Complex Query with Includes",
    content: `
      **N+1 Prevention Strategy**
      
      Query: \`User.includes(:posts, :profile).where(active: true).limit(10)\`
      
      Rails uses separate queries to prevent N+1 problems:
      
      **Step 1: Main Query**
      \`SELECT users.* FROM users WHERE users.active = true LIMIT 10\`
      
      **Step 2: Preload Posts**
      \`SELECT posts.* FROM posts WHERE posts.user_id IN (1, 2, 3...)\`
      
      **Step 3: Preload Profiles**
      \`SELECT profiles.* FROM profiles WHERE profiles.user_id IN (1, 2, 3...)\`
      
      The **Preloader** class orchestrates loading and associates records to their owners in memory, eliminating N+1 queries when accessing associations.
    `
  },
  6: {
    title: "SQL Generation Pipeline",
    content: `
      **Complete Transformation Flow**
      
      This diagram shows how Ruby DSL becomes executable SQL:
      
      **Ruby → Internal State → Arel AST → SQL String**
      
      1. **Ruby DSL** methods build internal state
      2. **WhereClause/SelectValues** store query components
      3. **PredicateBuilder** converts to Arel nodes
      4. **Arel::SelectManager** builds complete AST
      5. **Arel::Visitors::ToSql** walks AST to generate SQL
      6. **ConnectionAdapter** handles database-specific syntax
      
      The visitor pattern allows different SQL dialects (PostgreSQL, MySQL, SQLite) to generate appropriate syntax from the same AST.
      
      **Performance**: Prepared statements are cached via StatementCache for repeated queries.
    `
  }
};

function NotesPanel({ currentPage, isExpanded, onToggle }) {
  const notes = pageNotes[currentPage] || { title: "Notes", content: "No notes available for this page." };

  const renderMarkdown = (text) => {
    // Simple markdown-like rendering
    return text
      .split('\n')
      .map((line, index) => {
        // Headers
        if (line.startsWith('**') && line.endsWith('**')) {
          return <h4 key={index}>{line.slice(2, -2)}</h4>;
        }
        // Bullet points
        if (line.trim().startsWith('•') || line.trim().startsWith('-')) {
          return <li key={index}>{line.trim().slice(1).trim()}</li>;
        }
        // Code blocks
        if (line.includes('`')) {
          const parts = line.split(/`([^`]+)`/);
          return (
            <p key={index}>
              {parts.map((part, i) => 
                i % 2 === 0 ? part : <code key={i}>{part}</code>
              )}
            </p>
          );
        }
        // Numbered items
        if (/^\d+\./.test(line.trim())) {
          return <li key={index}>{line.trim()}</li>;
        }
        // Regular paragraphs
        if (line.trim()) {
          return <p key={index}>{line}</p>;
        }
        return null;
      })
      .filter(Boolean);
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