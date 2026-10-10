/**
 * Seeds the 87 pre-registered student records (roll 25MVCSMR0545–0631) into
 * the student_project_showcase MongoDB for Malla Reddy Vishwavidyapeeth,
 * B.Tech CSE (AI & ML), Section G.
 *
 * SAFETY (per spec):
 *  - NEVER drops the database, never deletes or updates existing records.
 *  - Skips entirely if ANY student rows already exist (your existing 87
 *    records are never touched).
 *  - Initial password = uppercase roll number, stored only as bcrypt hash.
 *  - mustChangePassword = true, isEmailVerified = false.
 *
 * Usage: MONGODB_URI="mongodb+srv://..." node scripts/seed-students.mjs
 */
import "dotenv/config";
import { MongoClient } from "mongodb";
import bcrypt from "bcryptjs";

const ROLL_PREFIX = "25MVCSMR";
const START = 545;
const COUNT = 87; // 0545 .. 0631
const EMAIL_DOMAIN = "mallareddyuniversity.ac.in";
const DEPARTMENT = "Computer Science & Engineering (AI & ML)";
const SECTION = "G";
const BATCH = "2025-2029";

async function main() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error("MONGODB_URI is not set.");
    process.exit(1);
  }
  const client = new MongoClient(uri, { serverSelectionTimeoutMS: 15000 });

  try {
    await client.connect();
    const db = client.db("student_project_showcase");
    const students = db.collection("students");

    const existingCount = await students.countDocuments();
    if (existingCount > 0) {
      console.log(
        `✔ students collection already has ${existingCount} records — seed skipped (existing data is never touched).`,
      );
      return;
    }

    const now = new Date();
    const docs = [];
    for (let i = 0; i < COUNT; i++) {
      const rollNumber = `${ROLL_PREFIX}${String(START + i).padStart(4, "0")}`;
      const name = `${FIRST_NAMES[i % 40]} ${LAST_NAMES[i % 31]}`;
      const email = `${rollNumber.toLowerCase()}@${EMAIL_DOMAIN}`;
      const passwordHash = await bcrypt.hash(rollNumber, 10);
      docs.push({
        rollNumber,
        name,
        email,
        passwordHash,
        role: "student",
        mustChangePassword: true,
        isEmailVerified: false,
        department: DEPARTMENT,
        section: SECTION,
        batch: BATCH,
        createdAt: now,
        updatedAt: now,
      });
    }

    const res = await students.insertMany(docs, { ordered: false });
    console.log(`✔ Seeded ${res.insertedCount} student records.`);
    console.log(
      "  Initial password for every student is their uppercase roll number (e.g. 25MVCSMR0545).",
    );
    console.log(
      "  First login forces a password change. Configure an admin with: node scripts/create-admin.mjs <ROLL_NUMBER>",
    );
  } finally {
    await client.close();
  }
}

main().catch((err) => {
  console.error("Seed failed:", err.message ?? err);
  process.exit(1);
});
