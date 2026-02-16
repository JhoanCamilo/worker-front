import { RegisterPayload } from "@/src/types/register";
import { api } from "./api";
import { mockRegister } from "./register.mock";

const USE_MOCK = process.env.EXPO_PUBLIC_USE_MOCK_API === "true";

export async function register(
  payload: RegisterPayload,
): Promise<{ message: string }> {
  if (USE_MOCK) {
    return mockRegister(payload);
  }

  const { data } = await api.post<{ message: string }>(
    "/auth/register",
    payload,
  );
  return data;
}
