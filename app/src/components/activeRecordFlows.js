// ActiveRecord Query Flow Diagram Generators

export function generateCoreComponentsDiagram() {
  return `graph TB
    subgraph "Core ActiveRecord Components"
      Base["ActiveRecord::Base<br/>Entry point for models"]
      Relation["ActiveRecord::Relation<br/>Lazy query builder"]
      QueryMethods["QueryMethods<br/>Query DSL methods"]
      SpawnMethods["SpawnMethods<br/>Relation spawning"]
      Arel["Arel<br/>SQL AST builder"]
      Connection["ConnectionAdapter<br/>Database interface"]
      Result["ActiveRecord::Result<br/>Query results"]
    end

    subgraph "Supporting Modules"
      Querying["Querying<br/>Class-level methods"]
      Scoping["Scoping<br/>Query scopes"]
      PredicateBuilder["PredicateBuilder<br/>Condition builder"]
      WhereClause["WhereClause<br/>WHERE storage"]
      JoinDependency["JoinDependency<br/>Association joins"]
      Preloader["Preloader<br/>N+1 prevention"]
    end

    Base --> Querying
    Querying --> Relation
    Relation --> QueryMethods
    Relation --> SpawnMethods
    QueryMethods --> PredicateBuilder
    PredicateBuilder --> WhereClause
    WhereClause --> Arel
    Relation --> JoinDependency
    Relation --> Preloader
    Arel --> Connection
    Connection --> Result
    Result --> Base

    classDef core fill:#ffebee,stroke:#c62828,stroke-width:2px
    classDef support fill:#e3f2fd,stroke:#1565c0,stroke-width:2px
    classDef sql fill:#f3e5f5,stroke:#6a1b9a,stroke-width:2px
    
    class Base,Relation,QueryMethods core
    class Querying,Scoping,PredicateBuilder,WhereClause,JoinDependency,Preloader support
    class Arel,Connection,Result sql`;
}

export function generateLazyInitDiagram() {
  return `graph TD
    Start["User.where(email: 'user@example.com')"]
    
    Start --> Querying["ActiveRecord::Querying.where"]
    Querying --> All["all.where<br/>(creates initial Relation)"]
    All --> NewRelation["Relation.new(model: User)"]
    
    NewRelation --> QueryWhere["QueryMethods#where"]
    QueryWhere --> Spawn["SpawnMethods#spawn<br/>(new Relation instance)"]
    
    Spawn --> BuildWhere["build_where_clause"]
    BuildWhere --> Predicate["PredicateBuilder.build"]
    Predicate --> ArelNode["Arel::Nodes::Equality<br/>email = 'user@example.com'"]
    
    ArelNode --> WhereClause["WhereClause.new(predicates)"]
    WhereClause --> StoreClause["relation.where_clause += predicates"]
    
    StoreClause --> ReturnRelation["Return: Relation object<br/>@loaded = false<br/>@records = nil"]
    
    ReturnRelation --> NoSQL["❌ No SQL Executed"]
    
    classDef entry fill:#fff3e0,stroke:#e65100,stroke-width:2px
    classDef process fill:#e8f5e9,stroke:#2e7d32,stroke-width:2px
    classDef storage fill:#fce4ec,stroke:#c2185b,stroke-width:2px
    classDef result fill:#e1f5fe,stroke:#0277bd,stroke-width:2px
    
    class Start entry
    class Querying,All,NewRelation,QueryWhere,Spawn,BuildWhere process
    class Predicate,ArelNode,WhereClause,StoreClause storage
    class ReturnRelation,NoSQL result`;
}

export function generateSimpleExecutionDiagram() {
  return `graph TD
    Start["User.where(email: 'user@example.com').first"]
    
    Start --> First["Relation#first"]
    First --> FindNth["find_nth(0)"]
    FindNth --> Limit["limit(1)"]
    Limit --> ToA["Relation#to_a<br/>(triggers loading)"]
    
    ToA --> Load["load<br/>(check @loaded)"]
    Load --> ExecQueries["exec_queries"]
    
    ExecQueries --> BuildArel["build_arel"]
    BuildArel --> SelectMgr["Arel::SelectManager.new"]
    SelectMgr --> BuildSelect["build_select<br/>SELECT users.*"]
    BuildSelect --> BuildWhereArel["build_where<br/>WHERE email = ?"]
    BuildWhereArel --> BuildLimit["build_limit<br/>LIMIT 1"]
    
    BuildLimit --> ToSql["connection.to_sql(arel)"]
    ToSql --> Visitor["Arel::Visitors::ToSql.accept"]
    Visitor --> SqlString["SQL: SELECT users.* FROM users<br/>WHERE users.email = 'user@example.com'<br/>LIMIT 1"]
    
    SqlString --> Execute["connection.execute(sql)"]
    Execute --> DBDriver["Database Driver<br/>(pg, mysql2, sqlite3)"]
    DBDriver --> RawResult["Raw database result"]
    
    RawResult --> ARResult["ActiveRecord::Result.new"]
    ARResult --> Instantiate["instantiate_records"]
    Instantiate --> UserInstance["User.instantiate(attributes)"]
    UserInstance --> InitWith["init_with + type casting"]
    InitWith --> Return["Return: User instance"]
    
    classDef trigger fill:#ffebee,stroke:#c62828,stroke-width:2px
    classDef arel fill:#f3e5f5,stroke:#6a1b9a,stroke-width:2px
    classDef sql fill:#e3f2fd,stroke:#1565c0,stroke-width:2px
    classDef result fill:#e8f5e9,stroke:#2e7d32,stroke-width:2px
    
    class Start,First,FindNth,Limit,ToA trigger
    class BuildArel,SelectMgr,BuildSelect,BuildWhereArel,BuildLimit arel
    class ToSql,Visitor,SqlString,Execute,DBDriver sql
    class RawResult,ARResult,Instantiate,UserInstance,InitWith,Return result`;
}

export function generateJoinsDiagram() {
  return `graph TD
    Start["User.joins(:posts).where(posts: {published: true})"]
    
    Start --> Joins["QueryMethods#joins(:posts)"]
    Joins --> SpawnJoin["spawn + joins_values += [:posts]"]
    
    SpawnJoin --> Where["QueryMethods#where"]
    Where --> NestedHash["posts: {published: true}"]
    NestedHash --> ResolveAssoc["resolve_association(:posts)"]
    ResolveAssoc --> BuildAssoc["build_for_association"]
    BuildAssoc --> PostsTable["Table['posts']['published'].eq(true)"]
    
    PostsTable --> ExecQuery["to_a → exec_queries"]
    ExecQuery --> BuildArel["build_arel"]
    
    BuildArel --> BuildJoins["build_joins"]
    BuildJoins --> JoinDep["JoinDependency.new(User, :posts)"]
    JoinDep --> Reflection["User.reflect_on_association(:posts)"]
    Reflection --> JoinAssoc["JoinAssociation.new"]
    JoinAssoc --> JoinConstraints["join_constraints<br/>ON posts.user_id = users.id"]
    
    JoinConstraints --> InnerJoin["Arel::Nodes::InnerJoin"]
    InnerJoin --> CompleteArel["Complete Arel AST"]
    
    CompleteArel --> ToSql["to_sql(arel)"]
    ToSql --> FinalSql["SELECT users.* FROM users<br/>INNER JOIN posts<br/>ON posts.user_id = users.id<br/>WHERE posts.published = true"]
    
    FinalSql --> Execute["execute_and_return"]
    Execute --> Results["Array of User instances<br/>(with posts joined)"]
    
    classDef query fill:#fff3e0,stroke:#e65100,stroke-width:2px
    classDef join fill:#f3e5f5,stroke:#6a1b9a,stroke-width:2px
    classDef condition fill:#fce4ec,stroke:#c2185b,stroke-width:2px
    classDef sql fill:#e3f2fd,stroke:#1565c0,stroke-width:2px
    
    class Start,Joins,SpawnJoin query
    class BuildJoins,JoinDep,Reflection,JoinAssoc,JoinConstraints,InnerJoin join
    class Where,NestedHash,ResolveAssoc,BuildAssoc,PostsTable condition
    class ToSql,FinalSql,Execute,Results sql`;
}

export function generateIncludesDiagram() {
  return `graph TD
    Start["User.includes(:posts, :profile)<br/>.where(active: true).limit(10)"]
    
    Start --> Includes["QueryMethods#includes"]
    Includes --> IncludesValues["includes_values = [:posts, :profile]"]
    
    IncludesValues --> MainQuery["to_a → exec_queries"]
    MainQuery --> BuildMain["build_arel (without includes)"]
    BuildMain --> MainSql["SELECT users.* FROM users<br/>WHERE users.active = true<br/>LIMIT 10"]
    
    MainSql --> ExecuteMain["connection.select_all"]
    ExecuteMain --> UserRecords["@records = [User, User, ...]<br/>Extract user_ids: [1, 2, 3...]"]
    
    UserRecords --> PreloadAssoc["preload_associations(@records)"]
    PreloadAssoc --> PreloaderNew["Preloader.new(records, [:posts, :profile])"]
    
    PreloaderNew --> PreloadPosts["preloaders_for(:posts)"]
    PreloadPosts --> HasManyLoader["Preloader::HasMany.new"]
    HasManyLoader --> PostsQuery["Post.where(user_id: [1,2,3...])"]
    PostsQuery --> PostsSql["SELECT posts.* FROM posts<br/>WHERE posts.user_id IN (1,2,3...)"]
    PostsSql --> PostsResult["Load all posts"]
    PostsResult --> AssociatePosts["Associate posts to users<br/>user.association(:posts).target = [posts]"]
    
    PreloaderNew --> PreloadProfile["preloaders_for(:profile)"]
    PreloadProfile --> HasOneLoader["Preloader::HasOne.new"]
    HasOneLoader --> ProfileQuery["Profile.where(user_id: [1,2,3...])"]
    ProfileQuery --> ProfileSql["SELECT profiles.* FROM profiles<br/>WHERE profiles.user_id IN (1,2,3...)"]
    ProfileSql --> ProfileResult["Load all profiles"]
    ProfileResult --> AssociateProfile["Associate profiles to users<br/>user.association(:profile).target = profile"]
    
    AssociatePosts --> Complete["Return users with<br/>preloaded associations"]
    AssociateProfile --> Complete
    
    classDef main fill:#fff3e0,stroke:#e65100,stroke-width:2px
    classDef preload fill:#e8f5e9,stroke:#2e7d32,stroke-width:2px
    classDef sql fill:#e3f2fd,stroke:#1565c0,stroke-width:2px
    classDef assoc fill:#f3e5f5,stroke:#6a1b9a,stroke-width:2px
    
    class Start,Includes,IncludesValues,MainQuery,BuildMain main
    class PreloadAssoc,PreloaderNew,PreloadPosts,PreloadProfile,HasManyLoader,HasOneLoader preload
    class MainSql,PostsSql,ProfileSql,ExecuteMain,PostsQuery,ProfileQuery sql
    class PostsResult,ProfileResult,AssociatePosts,AssociateProfile,Complete assoc`;
}

export function generateSQLPipelineDiagram() {
  return `graph TD
    Start["Ruby DSL Methods<br/>where, joins, select, order"]
    
    Start --> InternalState["Internal State Storage"]
    
    InternalState --> WhereClause["WhereClause<br/>Stores WHERE conditions"]
    InternalState --> JoinsValues["joins_values<br/>Stores JOIN associations"]
    InternalState --> SelectValues["select_values<br/>Stores SELECT fields"]
    InternalState --> OrderValues["order_values<br/>Stores ORDER BY"]
    
    WhereClause --> PredicateBuilder["PredicateBuilder<br/>Ruby → Arel conversion"]
    JoinsValues --> PredicateBuilder
    SelectValues --> PredicateBuilder
    OrderValues --> PredicateBuilder
    
    PredicateBuilder --> ArelNodes["Arel Nodes<br/>Equality, And, Or, Join, etc."]
    
    ArelNodes --> SelectManager["Arel::SelectManager<br/>AST Builder"]
    SelectManager --> SelectStatement["Arel::Nodes::SelectStatement<br/>Complete AST"]
    
    SelectStatement --> Visitor["Arel::Visitors::ToSql<br/>AST Walker"]
    Visitor --> VisitMethods["visit_* methods<br/>Node-specific SQL generation"]
    
    VisitMethods --> PostgresVisitor["PostgreSQL::ToSql<br/>PG-specific syntax"]
    VisitMethods --> MysqlVisitor["MySQL::ToSql<br/>MySQL-specific syntax"]
    VisitMethods --> SqliteVisitor["SQLite::ToSql<br/>SQLite-specific syntax"]
    
    PostgresVisitor --> SqlString["Final SQL String<br/>With proper escaping"]
    MysqlVisitor --> SqlString
    SqliteVisitor --> SqlString
    
    SqlString --> StatementCache["StatementCache<br/>Prepared statement caching"]
    StatementCache --> Connection["ConnectionAdapter<br/>Database execution"]
    
    Connection --> Result["ActiveRecord::Result<br/>Type casting & instantiation"]
    
    classDef ruby fill:#ffebee,stroke:#c62828,stroke-width:2px
    classDef arel fill:#f3e5f5,stroke:#6a1b9a,stroke-width:2px
    classDef visitor fill:#e3f2fd,stroke:#1565c0,stroke-width:2px
    classDef sql fill:#e8f5e9,stroke:#2e7d32,stroke-width:2px
    
    class Start,InternalState,WhereClause,JoinsValues,SelectValues,OrderValues ruby
    class PredicateBuilder,ArelNodes,SelectManager,SelectStatement arel
    class Visitor,VisitMethods,PostgresVisitor,MysqlVisitor,SqliteVisitor visitor
    class SqlString,StatementCache,Connection,Result sql`;
}