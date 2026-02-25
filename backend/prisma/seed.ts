import { prisma } from "./schema";
import { hashPassword } from "../utils/hash";

await prisma.membership.createMany({
    data: [
        { name: "Bulanan", price: 100_000, durationDays: 30, description: "Membership bulanan" },
        { name: "Tahunan", price: 1_000_000, durationDays: 365, description: "Membership tahunan" }
    ],
    skipDuplicates: true,
});

const adminEmail = process.env.SEED_ADMIN_EMAIL ?? "admin@risefit.local";
const adminPassword = process.env.SEED_ADMIN_PASSWORD ?? "admin123";

await prisma.user.upsert({
    where: { email: adminEmail },
    update: {
        name: "Admin",
        role: "ADMIN",
    },
    create: {
        name: "Admin",
        email: adminEmail,
        passwordHash: await hashPassword(adminPassword),
        role: "ADMIN",
    },
});

await prisma.$disconnect();
