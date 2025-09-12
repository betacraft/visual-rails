// ActiveRecord Query Flow D3 Data Generators

export function generateCoreComponentsD3Data() {
  const nodes = [
    // Core Components
    { id: 'base', name: 'ActiveRecord::Base', type: 'core', description: 'Entry point for models', group: 'core' },
    { id: 'relation', name: 'ActiveRecord::Relation', type: 'core', description: 'Lazy query builder', group: 'core' },
    { id: 'query_methods', name: 'QueryMethods', type: 'core', description: 'Query DSL methods', group: 'core' },
    { id: 'spawn_methods', name: 'SpawnMethods', type: 'core', description: 'Relation spawning', group: 'core' },
    { id: 'arel', name: 'Arel', type: 'sql', description: 'SQL AST builder', group: 'sql' },
    { id: 'connection', name: 'ConnectionAdapter', type: 'sql', description: 'Database interface', group: 'sql' },
    { id: 'result', name: 'ActiveRecord::Result', type: 'sql', description: 'Query results', group: 'sql' },
    
    // Supporting Modules
    { id: 'querying', name: 'Querying', type: 'support', description: 'Class-level methods', group: 'support' },
    { id: 'scoping', name: 'Scoping', type: 'support', description: 'Query scopes', group: 'support' },
    { id: 'predicate_builder', name: 'PredicateBuilder', type: 'support', description: 'Condition builder', group: 'support' },
    { id: 'where_clause', name: 'WhereClause', type: 'support', description: 'WHERE storage', group: 'support' },
    { id: 'join_dependency', name: 'JoinDependency', type: 'support', description: 'Association joins', group: 'support' },
    { id: 'preloader', name: 'Preloader', type: 'support', description: 'N+1 prevention', group: 'support' }
  ];

  const links = [
    { source: 'base', target: 'querying', type: 'includes' },
    { source: 'querying', target: 'relation', type: 'creates' },
    { source: 'relation', target: 'query_methods', type: 'includes' },
    { source: 'relation', target: 'spawn_methods', type: 'includes' },
    { source: 'query_methods', target: 'predicate_builder', type: 'uses' },
    { source: 'predicate_builder', target: 'where_clause', type: 'builds' },
    { source: 'where_clause', target: 'arel', type: 'converts' },
    { source: 'relation', target: 'join_dependency', type: 'uses' },
    { source: 'relation', target: 'preloader', type: 'uses' },
    { source: 'arel', target: 'connection', type: 'sends' },
    { source: 'connection', target: 'result', type: 'returns' },
    { source: 'result', target: 'base', type: 'instantiates' },
    { source: 'base', target: 'scoping', type: 'includes' }
  ];

  return { nodes, links };
}

export function generateLazyInitD3Data() {
  const nodes = [
    { id: 'user_where', name: "User.where(email: 'user@example.com')", type: 'entry', group: 'query' },
    { id: 'querying_where', name: 'Querying.where', type: 'process', group: 'delegation' },
    { id: 'all_where', name: 'all.where', type: 'process', group: 'delegation' },
    { id: 'new_relation', name: 'Relation.new', type: 'process', group: 'creation' },
    { id: 'query_methods_where', name: 'QueryMethods#where', type: 'process', group: 'building' },
    { id: 'spawn', name: 'SpawnMethods#spawn', type: 'process', group: 'building' },
    { id: 'build_where', name: 'build_where_clause', type: 'storage', group: 'building' },
    { id: 'predicate_build', name: 'PredicateBuilder.build', type: 'storage', group: 'conversion' },
    { id: 'arel_equality', name: "Arel::Nodes::Equality", type: 'storage', group: 'arel' },
    { id: 'where_clause_new', name: 'WhereClause.new', type: 'storage', group: 'storage' },
    { id: 'store_clause', name: 'relation.where_clause +=', type: 'storage', group: 'storage' },
    { id: 'return_relation', name: 'Relation (unloaded)', type: 'result', group: 'result' },
    { id: 'no_sql', name: '❌ No SQL Executed', type: 'result', group: 'result' }
  ];

  const links = [
    { source: 'user_where', target: 'querying_where', type: 'calls' },
    { source: 'querying_where', target: 'all_where', type: 'delegates' },
    { source: 'all_where', target: 'new_relation', type: 'creates' },
    { source: 'new_relation', target: 'query_methods_where', type: 'calls' },
    { source: 'query_methods_where', target: 'spawn', type: 'calls' },
    { source: 'spawn', target: 'build_where', type: 'calls' },
    { source: 'build_where', target: 'predicate_build', type: 'calls' },
    { source: 'predicate_build', target: 'arel_equality', type: 'creates' },
    { source: 'arel_equality', target: 'where_clause_new', type: 'wraps' },
    { source: 'where_clause_new', target: 'store_clause', type: 'stores' },
    { source: 'store_clause', target: 'return_relation', type: 'returns' },
    { source: 'return_relation', target: 'no_sql', type: 'confirms' }
  ];

  return { nodes, links };
}

export function generateSimpleExecutionD3Data() {
  const nodes = [
    { id: 'query', name: "User.where(...).first", type: 'entry', group: 'query' },
    { id: 'first', name: 'Relation#first', type: 'trigger', group: 'execution' },
    { id: 'find_nth', name: 'find_nth(0)', type: 'trigger', group: 'execution' },
    { id: 'limit', name: 'limit(1)', type: 'trigger', group: 'execution' },
    { id: 'to_a', name: 'Relation#to_a', type: 'trigger', group: 'execution' },
    { id: 'load', name: 'load', type: 'trigger', group: 'execution' },
    { id: 'exec_queries', name: 'exec_queries', type: 'trigger', group: 'execution' },
    { id: 'build_arel', name: 'build_arel', type: 'arel', group: 'arel' },
    { id: 'select_manager', name: 'Arel::SelectManager', type: 'arel', group: 'arel' },
    { id: 'build_select', name: 'build_select', type: 'arel', group: 'arel' },
    { id: 'build_where_arel', name: 'build_where', type: 'arel', group: 'arel' },
    { id: 'build_limit', name: 'build_limit', type: 'arel', group: 'arel' },
    { id: 'to_sql', name: 'to_sql(arel)', type: 'sql', group: 'sql' },
    { id: 'visitor', name: 'Arel::Visitors::ToSql', type: 'sql', group: 'sql' },
    { id: 'sql_string', name: 'SQL String', type: 'sql', group: 'sql' },
    { id: 'execute', name: 'connection.execute', type: 'sql', group: 'database' },
    { id: 'db_driver', name: 'Database Driver', type: 'sql', group: 'database' },
    { id: 'raw_result', name: 'Raw Result', type: 'result', group: 'result' },
    { id: 'ar_result', name: 'ActiveRecord::Result', type: 'result', group: 'result' },
    { id: 'instantiate', name: 'instantiate_records', type: 'result', group: 'result' },
    { id: 'user_instance', name: 'User Instance', type: 'result', group: 'result' }
  ];

  const links = [
    { source: 'query', target: 'first', type: 'calls' },
    { source: 'first', target: 'find_nth', type: 'calls' },
    { source: 'find_nth', target: 'limit', type: 'adds' },
    { source: 'limit', target: 'to_a', type: 'calls' },
    { source: 'to_a', target: 'load', type: 'calls' },
    { source: 'load', target: 'exec_queries', type: 'calls' },
    { source: 'exec_queries', target: 'build_arel', type: 'calls' },
    { source: 'build_arel', target: 'select_manager', type: 'creates' },
    { source: 'select_manager', target: 'build_select', type: 'calls' },
    { source: 'build_select', target: 'build_where_arel', type: 'then' },
    { source: 'build_where_arel', target: 'build_limit', type: 'then' },
    { source: 'build_limit', target: 'to_sql', type: 'passes' },
    { source: 'to_sql', target: 'visitor', type: 'uses' },
    { source: 'visitor', target: 'sql_string', type: 'generates' },
    { source: 'sql_string', target: 'execute', type: 'sends' },
    { source: 'execute', target: 'db_driver', type: 'uses' },
    { source: 'db_driver', target: 'raw_result', type: 'returns' },
    { source: 'raw_result', target: 'ar_result', type: 'wraps' },
    { source: 'ar_result', target: 'instantiate', type: 'passes' },
    { source: 'instantiate', target: 'user_instance', type: 'creates' }
  ];

  return { nodes, links };
}

export function generateJoinsD3Data() {
  const nodes = [
    { id: 'query', name: 'User.joins(:posts).where(...)', type: 'entry', group: 'query' },
    { id: 'joins', name: 'QueryMethods#joins', type: 'query', group: 'building' },
    { id: 'spawn_join', name: 'spawn + joins_values', type: 'query', group: 'building' },
    { id: 'where', name: 'QueryMethods#where', type: 'condition', group: 'building' },
    { id: 'nested_hash', name: 'posts: {published: true}', type: 'condition', group: 'building' },
    { id: 'resolve_assoc', name: 'resolve_association', type: 'condition', group: 'resolution' },
    { id: 'build_assoc', name: 'build_for_association', type: 'condition', group: 'resolution' },
    { id: 'posts_table', name: "Table['posts']['published']", type: 'condition', group: 'arel' },
    { id: 'exec_query', name: 'exec_queries', type: 'execution', group: 'execution' },
    { id: 'build_arel', name: 'build_arel', type: 'execution', group: 'execution' },
    { id: 'build_joins', name: 'build_joins', type: 'join', group: 'joins' },
    { id: 'join_dep', name: 'JoinDependency.new', type: 'join', group: 'joins' },
    { id: 'reflection', name: 'reflect_on_association', type: 'join', group: 'joins' },
    { id: 'join_assoc', name: 'JoinAssociation', type: 'join', group: 'joins' },
    { id: 'join_constraints', name: 'ON posts.user_id = users.id', type: 'join', group: 'joins' },
    { id: 'inner_join', name: 'Arel::Nodes::InnerJoin', type: 'join', group: 'arel' },
    { id: 'complete_arel', name: 'Complete Arel AST', type: 'sql', group: 'arel' },
    { id: 'to_sql', name: 'to_sql(arel)', type: 'sql', group: 'sql' },
    { id: 'final_sql', name: 'SELECT ... INNER JOIN ...', type: 'sql', group: 'sql' },
    { id: 'results', name: 'User instances', type: 'result', group: 'result' }
  ];

  const links = [
    { source: 'query', target: 'joins', type: 'calls' },
    { source: 'joins', target: 'spawn_join', type: 'creates' },
    { source: 'spawn_join', target: 'where', type: 'chains' },
    { source: 'where', target: 'nested_hash', type: 'processes' },
    { source: 'nested_hash', target: 'resolve_assoc', type: 'calls' },
    { source: 'resolve_assoc', target: 'build_assoc', type: 'calls' },
    { source: 'build_assoc', target: 'posts_table', type: 'creates' },
    { source: 'posts_table', target: 'exec_query', type: 'triggers' },
    { source: 'exec_query', target: 'build_arel', type: 'calls' },
    { source: 'build_arel', target: 'build_joins', type: 'calls' },
    { source: 'build_joins', target: 'join_dep', type: 'creates' },
    { source: 'join_dep', target: 'reflection', type: 'uses' },
    { source: 'reflection', target: 'join_assoc', type: 'creates' },
    { source: 'join_assoc', target: 'join_constraints', type: 'builds' },
    { source: 'join_constraints', target: 'inner_join', type: 'creates' },
    { source: 'inner_join', target: 'complete_arel', type: 'adds' },
    { source: 'complete_arel', target: 'to_sql', type: 'passes' },
    { source: 'to_sql', target: 'final_sql', type: 'generates' },
    { source: 'final_sql', target: 'results', type: 'returns' }
  ];

  return { nodes, links };
}

export function generateIncludesD3Data() {
  const nodes = [
    // Main query flow
    { id: 'query', name: 'User.includes(:posts, :profile)', type: 'entry', group: 'query' },
    { id: 'includes', name: 'QueryMethods#includes', type: 'main', group: 'query' },
    { id: 'includes_values', name: 'includes_values = [...]', type: 'main', group: 'query' },
    { id: 'main_query', name: 'exec_queries', type: 'main', group: 'execution' },
    { id: 'build_main', name: 'build_arel (no includes)', type: 'main', group: 'execution' },
    { id: 'main_sql', name: 'SELECT users.* ...', type: 'main', group: 'sql' },
    { id: 'execute_main', name: 'connection.select_all', type: 'main', group: 'sql' },
    { id: 'user_records', name: 'User instances [1,2,3...]', type: 'main', group: 'result' },
    
    // Preloading flow
    { id: 'preload_assoc', name: 'preload_associations', type: 'preload', group: 'preload' },
    { id: 'preloader_new', name: 'Preloader.new', type: 'preload', group: 'preload' },
    
    // Posts preloading
    { id: 'preload_posts', name: 'preloaders_for(:posts)', type: 'preload', group: 'posts' },
    { id: 'has_many_loader', name: 'Preloader::HasMany', type: 'preload', group: 'posts' },
    { id: 'posts_query', name: 'Post.where(user_id: IN)', type: 'sql', group: 'posts' },
    { id: 'posts_sql', name: 'SELECT posts.* ...', type: 'sql', group: 'posts' },
    { id: 'posts_result', name: 'Load all posts', type: 'assoc', group: 'posts' },
    { id: 'associate_posts', name: 'Associate to users', type: 'assoc', group: 'posts' },
    
    // Profile preloading
    { id: 'preload_profile', name: 'preloaders_for(:profile)', type: 'preload', group: 'profile' },
    { id: 'has_one_loader', name: 'Preloader::HasOne', type: 'preload', group: 'profile' },
    { id: 'profile_query', name: 'Profile.where(user_id: IN)', type: 'sql', group: 'profile' },
    { id: 'profile_sql', name: 'SELECT profiles.* ...', type: 'sql', group: 'profile' },
    { id: 'profile_result', name: 'Load all profiles', type: 'assoc', group: 'profile' },
    { id: 'associate_profile', name: 'Associate to users', type: 'assoc', group: 'profile' },
    
    { id: 'complete', name: 'Users with associations', type: 'result', group: 'result' }
  ];

  const links = [
    // Main query flow
    { source: 'query', target: 'includes', type: 'calls' },
    { source: 'includes', target: 'includes_values', type: 'stores' },
    { source: 'includes_values', target: 'main_query', type: 'triggers' },
    { source: 'main_query', target: 'build_main', type: 'calls' },
    { source: 'build_main', target: 'main_sql', type: 'generates' },
    { source: 'main_sql', target: 'execute_main', type: 'executes' },
    { source: 'execute_main', target: 'user_records', type: 'returns' },
    
    // Preloading initialization
    { source: 'user_records', target: 'preload_assoc', type: 'calls' },
    { source: 'preload_assoc', target: 'preloader_new', type: 'creates' },
    
    // Posts preloading
    { source: 'preloader_new', target: 'preload_posts', type: 'calls' },
    { source: 'preload_posts', target: 'has_many_loader', type: 'creates' },
    { source: 'has_many_loader', target: 'posts_query', type: 'builds' },
    { source: 'posts_query', target: 'posts_sql', type: 'generates' },
    { source: 'posts_sql', target: 'posts_result', type: 'executes' },
    { source: 'posts_result', target: 'associate_posts', type: 'processes' },
    
    // Profile preloading
    { source: 'preloader_new', target: 'preload_profile', type: 'calls' },
    { source: 'preload_profile', target: 'has_one_loader', type: 'creates' },
    { source: 'has_one_loader', target: 'profile_query', type: 'builds' },
    { source: 'profile_query', target: 'profile_sql', type: 'generates' },
    { source: 'profile_sql', target: 'profile_result', type: 'executes' },
    { source: 'profile_result', target: 'associate_profile', type: 'processes' },
    
    // Completion
    { source: 'associate_posts', target: 'complete', type: 'completes' },
    { source: 'associate_profile', target: 'complete', type: 'completes' }
  ];

  return { nodes, links };
}

export function generateSQLPipelineD3Data() {
  const nodes = [
    // Ruby DSL Layer
    { id: 'ruby_dsl', name: 'Ruby DSL Methods', type: 'ruby', group: 'ruby' },
    { id: 'internal_state', name: 'Internal State Storage', type: 'ruby', group: 'ruby' },
    { id: 'where_clause', name: 'WhereClause', type: 'ruby', group: 'storage' },
    { id: 'joins_values', name: 'joins_values', type: 'ruby', group: 'storage' },
    { id: 'select_values', name: 'select_values', type: 'ruby', group: 'storage' },
    { id: 'order_values', name: 'order_values', type: 'ruby', group: 'storage' },
    
    // Conversion Layer
    { id: 'predicate_builder', name: 'PredicateBuilder', type: 'arel', group: 'conversion' },
    { id: 'arel_nodes', name: 'Arel Nodes', type: 'arel', group: 'arel' },
    { id: 'select_manager', name: 'Arel::SelectManager', type: 'arel', group: 'arel' },
    { id: 'select_statement', name: 'SelectStatement AST', type: 'arel', group: 'arel' },
    
    // Visitor Pattern Layer
    { id: 'visitor', name: 'Arel::Visitors::ToSql', type: 'visitor', group: 'visitor' },
    { id: 'visit_methods', name: 'visit_* methods', type: 'visitor', group: 'visitor' },
    { id: 'postgres_visitor', name: 'PostgreSQL::ToSql', type: 'visitor', group: 'adapters' },
    { id: 'mysql_visitor', name: 'MySQL::ToSql', type: 'visitor', group: 'adapters' },
    { id: 'sqlite_visitor', name: 'SQLite::ToSql', type: 'visitor', group: 'adapters' },
    
    // SQL & Execution Layer
    { id: 'sql_string', name: 'Final SQL String', type: 'sql', group: 'sql' },
    { id: 'statement_cache', name: 'StatementCache', type: 'sql', group: 'cache' },
    { id: 'connection', name: 'ConnectionAdapter', type: 'sql', group: 'execution' },
    { id: 'result', name: 'ActiveRecord::Result', type: 'result', group: 'result' }
  ];

  const links = [
    // Ruby to Storage
    { source: 'ruby_dsl', target: 'internal_state', type: 'stores' },
    { source: 'internal_state', target: 'where_clause', type: 'contains' },
    { source: 'internal_state', target: 'joins_values', type: 'contains' },
    { source: 'internal_state', target: 'select_values', type: 'contains' },
    { source: 'internal_state', target: 'order_values', type: 'contains' },
    
    // Storage to Arel
    { source: 'where_clause', target: 'predicate_builder', type: 'passes' },
    { source: 'joins_values', target: 'predicate_builder', type: 'passes' },
    { source: 'select_values', target: 'predicate_builder', type: 'passes' },
    { source: 'order_values', target: 'predicate_builder', type: 'passes' },
    { source: 'predicate_builder', target: 'arel_nodes', type: 'creates' },
    { source: 'arel_nodes', target: 'select_manager', type: 'builds' },
    { source: 'select_manager', target: 'select_statement', type: 'produces' },
    
    // AST to SQL
    { source: 'select_statement', target: 'visitor', type: 'walks' },
    { source: 'visitor', target: 'visit_methods', type: 'calls' },
    { source: 'visit_methods', target: 'postgres_visitor', type: 'delegates' },
    { source: 'visit_methods', target: 'mysql_visitor', type: 'delegates' },
    { source: 'visit_methods', target: 'sqlite_visitor', type: 'delegates' },
    { source: 'postgres_visitor', target: 'sql_string', type: 'generates' },
    { source: 'mysql_visitor', target: 'sql_string', type: 'generates' },
    { source: 'sqlite_visitor', target: 'sql_string', type: 'generates' },
    
    // Execution
    { source: 'sql_string', target: 'statement_cache', type: 'caches' },
    { source: 'statement_cache', target: 'connection', type: 'sends' },
    { source: 'connection', target: 'result', type: 'returns' }
  ];

  return { nodes, links };
}