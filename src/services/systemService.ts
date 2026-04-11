const { invoke } = await import("@tauri-apps/api/core");
import { ApiResponse } from "../types";

export const systemService = {
  async getAppInfo() {
    const response =
      await invoke<
        ApiResponse<{ version: string; name: string; platform: string }>
      >("get_app_info");
    if (!response.success) {
      throw new Error(response.error || "Failed to get app info");
    }
    return response.data!;
  },
};
