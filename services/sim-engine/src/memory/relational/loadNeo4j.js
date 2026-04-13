import neo4j from "neo4j-driver";

let driver = null;

export function initNeo4j() {
  if (driver) return driver;

  driver = neo4j.driver(
    process.env.NEO4J_URI,
    neo4j.auth.basic(
      process.env.NEO4J_USER,
      process.env.NEO4J_PASSWORD
    ),
    { disableLosslessIntegers: true }
  );

  console.log("✅ Neo4j connected");
  return driver;
}

export function getNeo4jSession() {
  if (!driver) throw new Error("❌ Neo4j not initialized");
  return driver.session();
}
