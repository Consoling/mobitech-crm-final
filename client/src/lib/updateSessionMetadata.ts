import { apiFetch } from "./api";

async function updateSessionMetadata(sessionId: string) {
  try {
    navigator.geolocation.getCurrentPosition(async (pos) => {
      const deviceInfo = {
        userAgent: navigator.userAgent,
        screen: `${window.screen.width}x${window.screen.height}`,
        platform: navigator.platform,
        vendor: navigator.vendor
      };

      await apiFetch("/sentinel/session/update", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          sessionId,
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          deviceInfo,
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        }),
      });
    });
  } catch (e) {
    console.log("session metadata update failed", e);
  }
}
export { updateSessionMetadata };