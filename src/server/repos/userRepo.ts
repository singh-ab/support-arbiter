import { prisma } from "@/server/db/prisma";

export const userRepo = {
  getById: async (id: string) => {
    return prisma.user.findUnique({ where: { id } });
  },

  getByEmail: async (email: string) => {
    return prisma.user.findUnique({ where: { email } });
  },

  upsertMinimal: async (input: {
    id: string;
    email?: string;
    name?: string;
  }) => {
    return prisma.user.upsert({
      where: { id: input.id },
      create: {
        id: input.id,
        email: input.email,
        name: input.name,
      },
      update: {
        email: input.email,
        name: input.name,
      },
    });
  },
};
