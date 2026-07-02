import dotenv from "dotenv";
import { connectDB } from "../config/db.js";
import { User } from "../models/User.js";
import { hashPassword } from "../services/password.service.js";

dotenv.config();

const SUPER_ADMIN_EMAIL = "admin@sphere.com";
const SUPER_ADMIN_PASSWORD = "Devowl@14";
const SUPER_ADMIN_NAME = "Platform Super Admin";

async function seedSuperAdmin() {
  await connectDB();

  const existing = await User.findOne({ email: SUPER_ADMIN_EMAIL });
  if (existing) {
    console.log(`[seed] Super Admin already exists (${SUPER_ADMIN_EMAIL}) — skipping.`);
    await User.db.close();
    process.exit(0);
  }

  const passwordHash = await hashPassword(SUPER_ADMIN_PASSWORD);

  await User.create({
    name: SUPER_ADMIN_NAME,
    email: SUPER_ADMIN_EMAIL,
    passwordHash,
    role: "super_admin",
    organizationId: null,
    isActive: true,
  });

  console.log(`[seed] Super Admin created: ${SUPER_ADMIN_EMAIL}`);
  console.warn(
    "[seed] WARNING: Change this password immediately after first login."
  );
  console.warn(
    "[seed] WARNING: Never commit credentials or seed output to a public repository."
  );

  await User.db.close();
  process.exit(0);
}

seedSuperAdmin().catch((err) => {
  console.error("[seed] Failed:", err.message);
  process.exit(1);
});
