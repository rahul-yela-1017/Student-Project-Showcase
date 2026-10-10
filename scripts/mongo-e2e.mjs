/**
 * End-to-end test of the MongoDB data path:
 *  1. Starts an in-memory MongoDB (downloads the binary on first run).
 *  2. Seeds student_project_showcase.students with 3 students:
 *       - 0545: bcrypt hash, student
 *       - 0546: md5 hex hash stored under the legacy `password` field
 *       - 0547: bcrypt hash, admin
 *  3. Boots the production app on port 3001 with MONGODB_URI → in-memory DB.
 *  4. Exercises login (bcrypt + legacy md5 + wrong password), project CRUD,
 *     dashboard stats, techs, and admin endpoints.
 *
 * Usage: node scripts/mongo-e2e.mjs
 */
import { MongoMemoryServer } from "mongodb-memory-server";
import { MongoClient, ObjectId } from "mongodb";
import bcrypt from "bcryptjs";
import { createHash } from "crypto";
import { spawn } from "child_process";
import net from "net";

function getFreePort() {
  return new Promise((resolve) => {
    const s = net.createServer();
    s.listen(0, () => {
      const p = s.address().port;
      s.close(() => resolve(p));
    });
  });
}
const PORT = Number(process.env.E2E_PORT ?? (await getFreePort()));
const md5 = (s) => createHash("md5").update(s).digest("hex");

const mongod = await MongoMemoryServer.create();
const uri = mongod.getUri("student_project_showcase");
console.log("✔ in-memory MongoDB at", uri);

const client = new MongoClient(uri);
await client.connect();
const students = client.db("student_project_showcase").collection("students");
const now = new Date();
await students.insertMany([
  {
    rollNumber: "25MVCSMR0545",
    name: "E2E Bcrypt Student",
    email: "25mvcsmr0545@mallareddyuniversity.ac.in",
    passwordHash: await bcrypt.hash("25MVCSMR0545", 10),
    role: "student",
    mustChangePassword: true,
    isEmailVerified: false,
    createdAt: now,
    updatedAt: now,
  },
  {
    // legacy record: md5 hash under the old `password` field name
    rollNumber: "25MVCSMR0546",
    name: "E2E Legacy Student",
    email: "25mvcsmr0546@mallareddyuniversity.ac.in",
    password: md5("25MVCSMR0546"),
    role: "student",
    mustChangePassword: true,
    isEmailVerified: false,
    createdAt: now,
    updatedAt: now,
  },
  {
    rollNumber: "25MVCSMR0547",
    name: "E2E Admin",
    email: "25mvcsmr0547@mallareddyuniversity.ac.in",
    passwordHash: await bcrypt.hash("25MVCSMR0547", 10),
    role: "admin",
    mustChangePassword: false,
    isEmailVerified: false,
    createdAt: now,
    updatedAt: now,
  },
]);
console.log("✔ seeded 3 students (bcrypt, legacy md5, admin)");

const server = spawn("npx", ["next", "start", "-p", String(PORT)], {
  env: { ...process.env, MONGODB_URI: uri, PORT: String(PORT) },
  stdio: ["ignore", "pipe", "pipe"],
  detached: true,
});
let serverLog = "";
server.stdout.on("data", (d) => (serverLog += d));
server.stderr.on("data", (d) => (serverLog += d));

function killServer() {
  try {
    process.kill(-server.pid, "SIGKILL"); // whole process group
  } catch {
    try {
      process.kill(server.pid, "SIGKILL");
    } catch {
      /* already gone */
    }
  }
}

const base = `http://localhost:${PORT}`;
async function call(method, path, body, cookie) {
  const res = await fetch(base + path, {
    method,
    headers: {
      "Content-Type": "application/json",
      "x-requested-with": "XMLHttpRequest",
      ...(cookie ? { cookie } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const json = await res.json().catch(() => null);
  const setCookie = res.headers.get("set-cookie");
  return { status: res.status, json, cookie: setCookie?.split(";")[0] ?? null };
}

let failures = 0;
function check(label, cond, extra = "") {
  console.log(`${cond ? "✔" : "✖"} ${label}${extra ? ` — ${extra}` : ""}`);
  if (!cond) failures++;
}

async function waitForServer() {
  for (let i = 0; i < 40; i++) {
    if (server.exitCode !== null) {
      console.error("server child exited early:", serverLog.slice(-1500));
      return false;
    }
    try {
      const r = await fetch(`${base}/api/health`);
      if (r.status === 200) return true;
    } catch {
      /* not up yet */
    }
    await new Promise((r) => setTimeout(r, 500));
  }
  return false;
}

try {
  if (!(await waitForServer())) {
    console.error("✖ app did not start on port", PORT);
    console.error(serverLog.slice(-3000));
    process.exit(1);
  }
  console.log("✔ app up on", base);

  const health = await call("GET", "/api/health");
  check("health ok", health.status === 200, JSON.stringify(health.json));

  const loginBcrypt = await call("POST", "/api/auth/login", {
    email: "25mvcsmr0545@mallareddyuniversity.ac.in",
    password: "25MVCSMR0545",
  });
  check("login bcrypt student", loginBcrypt.status === 200 && loginBcrypt.json?.success, JSON.stringify(loginBcrypt.json?.data?.student?.name ?? loginBcrypt.json));
  if (loginBcrypt.status === 500) {
    console.log("---- server log tail ----");
    console.log(serverLog.slice(-3000));
  }

  const loginLegacy = await call("POST", "/api/auth/login", {
    email: "25mvcsmr0546@mallareddyuniversity.ac.in",
    password: "25MVCSMR0546",
  });
  check("login legacy md5 (password field)", loginLegacy.status === 200 && loginLegacy.json?.success);

  const loginWrong = await call("POST", "/api/auth/login", {
    email: "25mvcsmr0545@mallareddyuniversity.ac.in",
    password: "WRONG",
  });
  check("wrong password rejected", loginWrong.status === 401);

  const c1 = loginBcrypt.cookie;

  const created = await call("POST", "/api/projects", {
    title: "E2E Mongo Project",
    summary: "End-to-end test project on the MongoDB driver.",
    description: "Verifies creation, ownership, listing, stats and admin flows against MongoDB.",
    category: "Artificial Intelligence",
    technologies: ["React", "MongoDB"],
    githubUrl: "https://github.com/e2e/project",
    status: "pending",
  }, c1);
  check("create project (pending)", created.status === 201, created.json?.data?.id);
  const pid = created.json?.data?.id;
  check("project id is ObjectId hex", /^[0-9a-f]{24}$/.test(pid ?? ""), String(pid));

  const anonList = await call("GET", "/api/projects");
  check(
    "pending project NOT visible anonymously",
    anonList.status === 200 && !anonList.json.data.items.some((p) => p.id === pid),
  );

  const anonDraft = await call("GET", `/api/projects/${pid}`);
  check("pending project 404 for anonymous", anonDraft.status === 404);

  const mine = await call("GET", "/api/projects/mine", null, c1);
  check("owner sees own pending project", mine.json?.data?.items?.some((p) => p.id === pid));

  const adminLogin = await call("POST", "/api/auth/login", {
    email: "25mvcsmr0547@mallareddyuniversity.ac.in",
    password: "25MVCSMR0547",
  });
  check("login admin", adminLogin.status === 200 && adminLogin.json?.data?.student?.role === "admin");
  const cAdmin = adminLogin.cookie;

  const otherLogin = await call("POST", "/api/auth/login", {
    email: "25mvcsmr0546@mallareddyuniversity.ac.in",
    password: "25MVCSMR0546",
  });
  const c2 = otherLogin.cookie;

  const crossEdit = await call("PUT", `/api/projects/${pid}`, { title: "Hacked" }, c2);
  check("cross-student edit blocked (403)", crossEdit.status === 403);

  const adminProjects = await call("GET", "/api/admin/projects", null, cAdmin);
  check("admin lists pending", adminProjects.json?.data?.items?.some((p) => p.id === pid));

  const approve = await call("PATCH", `/api/admin/projects/${pid}/status`, { status: "published" }, cAdmin);
  check("admin approves", approve.status === 200 && approve.json?.data?.status === "published");

  const publicList = await call("GET", "/api/projects");
  check(
    "approved project now public",
    publicList.json?.data?.items?.some((p) => p.id === pid && p.ownerName === "E2E Bcrypt Student"),
  );

  const studentFilter = await call("GET", "/api/projects?student=E2E%20Bcrypt");
  check("student-name filter", studentFilter.json?.data?.total === 1);
  const techFilter = await call("GET", "/api/projects?tech=MongoDB");
  check("technology filter", techFilter.json?.data?.total === 1);

  const techs = await call("GET", "/api/techs");
  check("distinct techs", techs.json?.data?.techs?.includes("MongoDB"), JSON.stringify(techs.json?.data?.techs));

  const stats = await call("GET", "/api/dashboard/stats", null, c1);
  check(
    "dashboard stats",
    stats.json?.data?.total === 1 && stats.json?.data?.published === 1,
    JSON.stringify(stats.json?.data),
  );

  const roster = await call("GET", "/api/admin/students", null, cAdmin);
  check("admin roster has 3", roster.json?.data?.total === 3, JSON.stringify(roster.json?.data?.total));

  const profile = await call("GET", "/api/students/25MVCSMR0546");
  check("student profile by roll", profile.status === 200 && profile.json?.data?.name === "E2E Legacy Student");
  check("profile hides password", !JSON.stringify(profile.json).toLowerCase().includes("md5") && !("password" in (profile.json?.data ?? {})));

  const dir = await call("GET", "/api/students?q=E2E");
  check(
    "directory search + counts",
    dir.json?.data?.total === 3 && dir.json.data.items.some((s) => s.rollNumber === "25MVCSMR0545" && s.projectCount === 1),
    JSON.stringify(dir.json?.data?.items),
  );

  const del = await call("DELETE", `/api/projects/${pid}`, null, c1);
  check("owner delete", del.status === 200 && del.json?.data?.deleted === true);

  const driverLines = serverLog.match(/\[data\][^\n]*/g) ?? [];
  const usingMongo = driverLines.some((l) => l.includes("Using MongoDB"));
  check("server selected MongoDB driver", usingMongo, driverLines.join(" | ") || "no [data] log");
} finally {
  killServer();
  await client.close();
  await mongod.stop();
}

console.log(failures === 0 ? "\nALL E2E CHECKS PASSED" : `\n${failures} CHECK(S) FAILED`);
process.exit(failures === 0 ? 0 : 1);
