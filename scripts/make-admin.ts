/**
 * Promote an existing account to admin:
 *   npm run make-admin -- someone@example.com
 * The account must already exist (sign up on the site first).
 */
import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

async function main() {
  const email = process.argv[2]?.trim().toLowerCase();
  if (!email) throw new Error("اكتب الإيميل: sudo bash deploy/make-admin.sh someone@example.com");
  const prisma = new PrismaClient({
    adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
  });
  try {
    const { count } = await prisma.user.updateMany({ where: { email }, data: { role: "ADMIN" } });
    if (count) {
      console.log(`✅ ${email} بقى أدمن. اعمل تحديث للصفحة وهيظهرلك قسم «الإدارة».`);
      return;
    }
    const users = await prisma.user.findMany({
      select: { email: true },
      orderBy: { createdAt: "desc" },
      take: 10,
    });
    console.error(`✗ مفيش حساب بالإيميل ${email}.`);
    console.error("  سجّل الأول من صفحة /register على الموقع، وبعدين شغّل الأمر ده تاني.");
    console.error(
      users.length
        ? `  الحسابات الموجودة: ${users.map((u) => u.email).join("، ")}`
        : "  لسه مفيش ولا حساب مسجّل.",
    );
    process.exitCode = 1;
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});
