import { PrismaClient } from "@prisma/client";
const p = new PrismaClient();
async function f() {
  await p.profile.update({ where: { id: "x" }, data: { childName: "a", grade: 5, targetSchool: "b" } });
}
f;
