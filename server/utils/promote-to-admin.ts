import { createClient } from "redis";
import dotenv from "dotenv";
import readline from "readline";

dotenv.config();

/**
 * Promote User to Admin Utility
 *
 * This script allows you to promote an existing user to admin role.
 */

async function promoteToAdmin() {
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

    // Get all user hashes
    const allKeys = await client.keys("user:*");
    const userHashes: Array<{ key: string; data: any }> = [];

    for (const key of allKeys) {
      // Skip index keys
      if (key.includes(":email:") || key.includes(":role:")) {
        continue;
      }

      // Check if it's a hash
      const keyType = await client.type(key);
      if (keyType === "hash") {
        const userData = await client.hGetAll(key);
        if (userData && userData.id) {
          userHashes.push({ key, data: userData });
        }
      }
    }

    if (userHashes.length === 0) {
      console.log("❌ No users found in database");
      return;
    }

    console.log(`Found ${userHashes.length} user(s):\n`);

    // Display users
    userHashes.forEach((user, index) => {
      const isAdmin = user.data.role === "admin";
      const adminBadge = isAdmin ? " 👑 ADMIN" : "";
      console.log(`${index + 1}. ${user.data.email}${adminBadge}`);
      console.log(`   Name: ${user.data.name}`);
      console.log(`   Role: ${user.data.role}`);
      console.log(`   Email Verified: ${user.data.isEmailVerified}`);
      console.log(`   ID: ${user.data.id}`);
      console.log("");
    });

    // Handle command line arguments
    const args = process.argv.slice(2);
    const emailArg = args.find((arg) => arg.startsWith("--email="));

    let selectedUser: { key: string; data: any } | null = null;

    if (emailArg) {
      // Email provided via command line
      const email = emailArg.split("=")[1];
      selectedUser = userHashes.find((u) => u.data.email === email) || null;

      if (!selectedUser) {
        console.log(`❌ User with email "${email}" not found`);
        return;
      }
    } else if (userHashes.length === 1) {
      // Only one user, auto-select
      selectedUser = userHashes[0];
      console.log(`Auto-selected: ${selectedUser.data.email}`);
    } else {
      // Interactive mode
      const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
      });

      const answer = await new Promise<string>((resolve) => {
        rl.question(
          "Enter the number of the user to promote to admin: ",
          resolve,
        );
      });
      rl.close();

      const selection = parseInt(answer.trim());
      if (isNaN(selection) || selection < 1 || selection > userHashes.length) {
        console.log("❌ Invalid selection");
        return;
      }

      selectedUser = userHashes[selection - 1];
    }

    if (!selectedUser) {
      console.log("❌ No user selected");
      return;
    }

    // Check if already admin
    if (selectedUser.data.role === "admin") {
      console.log(`\n✓ User ${selectedUser.data.email} is already an admin!`);
      return;
    }

    // Promote to admin
    console.log(`\n🔄 Promoting ${selectedUser.data.email} to admin...`);

    await client.hSet(selectedUser.key, {
      role: "admin",
      updatedAt: new Date().toISOString(),
    });

    console.log(
      `✅ Successfully promoted ${selectedUser.data.email} to admin!`,
    );
    console.log(
      "\nYou can now log in with this account and access the admin dashboard.",
    );
  } catch (error) {
    console.error("Error:", error);
  } finally {
    await client.disconnect();
    console.log("\nDisconnected from Redis");
  }
}

// Run the utility
promoteToAdmin().catch(console.error);
