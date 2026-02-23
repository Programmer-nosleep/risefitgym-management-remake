import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

await prisma.membership.createMany({
    data: [
        { name: "Bulanan", price: 100000, duration: 30, description: "Membership bulanan" },
        { name: "Tahunan", price: 1000000, duration: 365, description: "Membership tahunan" }
    ]
})

await prisma.user.create({
    data: {
        name: "Admin",
        email: "[EMAIL_ADDRESS]",
        password: "[PASSWORD]",
        role: "ADMIN"
    }
})