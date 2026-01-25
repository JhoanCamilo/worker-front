import { TechStatus, UserRole } from "@/src/types/auth.types";

export const mockUsers = [
  {
    id: "1",
    name: "Carlos Técnico",
    email: "tech@pending.com",
    password: "123456",
    role: UserRole.TECH,
    state: TechStatus.PENDING,
  },
  {
    id: "2",
    name: "Pedro Técnico",
    email: "tech@active.com",
    password: "123456",
    role: UserRole.TECH,
    state: TechStatus.ACTIVE,
  },
  {
    id: "3",
    name: "Ana Cliente",
    email: "client@test.com",
    password: "123456",
    role: UserRole.CLIENT,
  },
];
