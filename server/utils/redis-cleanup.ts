import { createClient } from "redis";
import dotenv from "dotenv";

dotenv.config();

/**
 * Redis Cleanup Utility
 *
 * This script helps diagnose and fix Redis data type issues.
 * Run this when you encounter WRONGTYPE errors.
 */

async function cleanupRedis() {
  // Parse host and port from REDIS_HOST if it contains a colon
  const redisHost = process.env.REDIS_HOST || "";
  const [host, hostPort] = redisHost.includes(":")
    ? redisHost.split(":")
    : [redisHost, ""];

  const port = hostPort
    ? parseInt(hostPort)
    : parseInt(process.env.REDIS_PORT || "12110");

  const finalHost = host || "localhost";

  const client = createClient({
    username: "default",
    password: process.env.REDIS_PASSWORD,
    socket: {
      host: finalHost,
      port: port,
    },
  });

  client.on("error", (err) => console.error("Redis Client Error", err));

  try {
    await client.connect();
    console.log("Connected to Redis");
    console.log(`Host: ${finalHost}, Port: ${port}\n`);

    // Get all user-related keys
    const allKeys = await client.keys("user:*");
    console.log(`\nFound ${allKeys.length} user-related keys\n`);

    const keysByType: Record<string, string[]> = {
      string: [],
      hash: [],
      list: [],
      set: [],
      zset: [],
      stream: [],
      unknown: [],
    };

    // Categorize keys by type
    for (const key of allKeys) {
      const type = await client.type(key);
      if (keysByType[type]) {
        keysByType[type].push(key);
      } else {
        keysByType.unknown.push(key);
      }
    }

    // Display summary
    console.log("=== Key Type Summary ===");
    for (const [type, keys] of Object.entries(keysByType)) {
      if (keys.length > 0) {
        console.log(`${type}: ${keys.length}`);
      }
    }

    // Show details
    console.log("\n=== String Keys (Index keys) ===");
    for (const key of keysByType.string) {
      const value = await client.get(key);
      console.log(`${key} = ${value}`);
    }

    console.log("\n=== Hash Keys (User data) ===");
    for (const key of keysByType.hash) {
      const data = await client.hGetAll(key);
      console.log(`${key}:`, data);
    }

    // Check for problematic patterns
    console.log("\n=== Potential Issues ===");
    const problematicKeys: string[] = [];

    // Get all hash user IDs for reference checking
    const validUserIds = new Set<string>();
    for (const key of keysByType.hash) {
      if (key.match(/^user:[0-9a-f-]{36}$/i)) {
        const userId = key.replace("user:", "");
        validUserIds.add(userId);
      }
    }

    // Check if any user:{id} keys are strings (should be hashes)
    for (const key of keysByType.string) {
      // user:{uuid} pattern - should be hash, not string
      if (key.match(/^user:[0-9a-f-]{36}$/i)) {
        problematicKeys.push(key);
        console.log(`⚠️  ${key} is a STRING but should be a HASH`);
      }

      // Check for orphaned index keys pointing to non-existent users
      if (key.startsWith("user:") && !key.includes(":email:")) {
        const value = await client.get(key);
        if (value && !validUserIds.has(value)) {
          problematicKeys.push(key);
          console.log(`⚠️  ${key} points to non-existent user: ${value}`);
        }
      }

      // Check for email index keys pointing to non-existent users
      if (key.includes(":email:")) {
        const userId = await client.get(key);
        if (userId && !validUserIds.has(userId)) {
          problematicKeys.push(key);
          console.log(`⚠️  ${key} points to non-existent user: ${userId}`);
        }
      }
    }

    // Check if any email index keys are hashes (should be strings)
    for (const key of keysByType.hash) {
      if (key.includes(":email:") || key.includes(":role:")) {
        problematicKeys.push(key);
        console.log(`⚠️  ${key} is a HASH but should be a STRING`);
      }
    }

    if (problematicKeys.length === 0) {
      console.log("✓ No issues found");
    }

    // Offer to clean up
    if (problematicKeys.length > 0) {
      console.log(`\n=== Cleanup Options ===`);
      console.log(`Found ${problematicKeys.length} problematic key(s)`);
      console.log("\nTo clean up ALL user data and start fresh, run:");
      console.log("  npm run redis-cleanup -- --delete-all-users");
      console.log("\nTo delete only problematic keys, run:");
      console.log("  npm run redis-cleanup -- --delete-problematic");
    }

    // Handle command line arguments
    const args = process.argv.slice(2);

    if (args.includes("--delete-all-users")) {
      console.log("\n🗑️  Deleting ALL user data...");
      let deleted = 0;
      for (const key of allKeys) {
        await client.del(key);
        deleted++;
      }
      console.log(`✓ Deleted ${deleted} keys`);
    } else if (args.includes("--delete-problematic")) {
      console.log("\n🗑️  Deleting problematic keys...");
      let deleted = 0;
      for (const key of problematicKeys) {
        await client.del(key);
        deleted++;
      }
      console.log(`✓ Deleted ${deleted} problematic keys`);
    } else if (args.includes("--delete-all")) {
      console.log("\n🗑️  Deleting ENTIRE Redis database...");
      await client.flushDb();
      console.log("✓ Database flushed");
    }
  } catch (error) {
    console.error("Error:", error);
  } finally {
    await client.disconnect();
    console.log("\nDisconnected from Redis");
  }
}

// Run the cleanup
cleanupRedis().catch(console.error);
