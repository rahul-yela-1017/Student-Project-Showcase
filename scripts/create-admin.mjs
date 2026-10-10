/**
 * Explicitly configures an administrator account in the existing MongoDB.
 *
 * Per spec, NO student is automatically made an admin. An administrator must
 * be configured intentionally by an operator who has database access:
 *
 *   MONGODB_URI="mongodb+srv://..." node scripts/create-admin.mjs 25MVCSMR0545
 *
 * The chosen student keeps their existing password hash (no reset) — they
 * simply gain the admin role.
 */
import "dotenv/config";
import { MongoClient, ObjectId } from "mongodb";

const rollNumber = process.argv[2]?.toUpperCase();

async function main() {
  if (!rollNumber) {
    console.error(
      'Usage: MONGODB_URI="..." node scripts/create-admin.mjs <ROLL_NUMBER>  (e.g. 25MVCSMR0545)',
    );
    process.exit(1);
  }
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error("MONGODB_URI is not set.");
    process.exit(1);
  }
  const client = new MongoClient(uri, { serverSelectionTimeoutMS: 10000 });
  try {
    await client.connect();
    const db = client.db("student_project_showcase");
    const res = await db.collection("students").updateOne(
      { rollNumber },
      { $set: { role: "admin", updatedAt: new Date() } },
    );
    if (res.matchedCount === 0) {
      console.error(`✖ No student found with roll number ${rollNumber}.`);
      process.exitCode = 1;
      return;
    }
    const doc = await db.collection("students").findOne({ rollNumber });
    console.log(
      `✔ ${doc.name} (${doc.rollNumber}) is now an administrator (id ${
        doc._id instanceof ObjectId ? doc._id.toHexString() : doc._id
      }).`,
    );
  } finally {
    await client.close();
  }
}

main().catch((err) => {
  console.error("Failed:", err.message ?? err);
  process.exit(1);
});
