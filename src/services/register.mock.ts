import { RegisterPayload } from "@/src/types/register";

export async function mockRegister(
  payload: RegisterPayload,
): Promise<{ message: string }> {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (!payload.email || !payload.password || !payload.name || !payload.lastName) {
        reject(new Error("Datos incompletos"));
        return;
      }

      resolve({ message: "Registro exitoso" });
    }, 800);
  });
}
