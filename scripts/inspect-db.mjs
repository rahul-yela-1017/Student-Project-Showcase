/**
 * Inspects the existing MongoDB before writing any auth logic.
 * Prints collection names, counts, field keys, sample docs (hashes masked),
 * role distribution, and existing indexes. READ-ONLY — never writes.
 *
 * Usage: MONGODB_URI="mongodb+srv://..." node scripts/inspect-db.mjs
 */
import "dotenv/config";
import { MongoClient } from "mongodb";

const uri = process.env.MONGODB_URI;
if (!uri) {
  console.error("MONGODB_URI is not set.");
  process.exit(1);
}

const mask = (s) => (typeof s === "string" && s.length > 10 ? `${s.slice(0, 7)}…(${s.length} chars)` : s);
const maskDoc = (doc) => {
  const out = {};
  for (const [k, v] of Object.entries(doc ?? {})) {
    if (/hash|password/i.test(k) && typeof v === "string") out[k] = mask(v);
    else out[k] = v;
  }
  return out;
};

const client = new MongoClient(uri, { serverSelectionTimeoutMS: 15000 });

try {
  await client.connect();
  const adminDb = client.db("admin");
  console.log("✔ Connected to MongoDB");

  const dbs = await adminDb.admin().listDatabases();
  console.log("\nDatabases:", dbs.databases.map((d) => d.name).join(", "));

  const db = client.db("student_project_showcase");
  const colls = await db.listCollections().toArray();
  console.log("\nCollections in student_project_showcase:", colls.map((c) => c.name).join(", ") || "(none)");

  for (const c of colls.map((c) => c.name)) {
    const coll = db.collection(c);
    const count = await coll.countDocuments();
    console.log(`\n=== collection: ${c} (${count} docs) ===`);
    const indexes = await coll.indexes();
    console.log("Indexes:", JSON.stringify(indexes.map((i) => ({ name: i.name, key: i.key }))));
    if (count > 0) {
      const sample = await coll.findOne({});
      console.log("Sample doc (masked):", JSON.stringify(maskDoc(sample), null, 2));
      const keys = new Set();
      for await (const d of coll.find({}, { limit: 200 })) {
        Object.keys(d).forEach((k) => keys.add(k));
      }
      console.log("All field keys:", [...keys].join(", "));
    }
  }

  const students = db.collection("students");
  const roleDist = await students.aggregate([
    { $group: { _id: "$role", n: { $sum: 1 } } },
    { $sort: { _id: 1 } },
  ]).toArray();
  console.log("\nRole distribution:", JSON.stringify(roleDist));

  const mustChange = await students.aggregate([
    { $group: { _id: "$mustChangePassword", n: { $sum: 1 } } },
  ]).toArray();
  console.log("mustChangePassword distribution:", JSON.stringify(mustChange));

  const emailVerified = await students.aggregate([
    { $group: { _id: "$isEmailVerified", n: { $sum: 1 } } },
  ]).toArray();
  console.log("isEmailVerified distribution:", JSON.stringify(emailVerified));

  const rollSample = await students
    .find({}, { projection: { rollNumber: 1, name: 1, email: 1 } })
    .sort({ rollNumber: 1 })
    .limit(3)
    .toArray();
  console.log("\nFirst students:", JSON.stringify(rollSample, null, 2));
} finally {
  await client.close();
}
