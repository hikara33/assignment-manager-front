import { useAuthStore } from "./auth-store";
import { fetchProfile } from "./api";

export async function establishSession(accessToken: string) {
  useAuthStore.getState().setSession(accessToken, null);
  const user = await fetchProfile();
  useAuthStore.getState().setSession(accessToken, user);
}
