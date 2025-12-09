import type { APIContext } from "astro";

export async function GET({
  request,
  clientAddress,
}: APIContext): Promise<Response> {
  const headers = request.headers;

  // Get IP address (Cloudflare provides this)
  const ip = headers.get("cf-connecting-ip") || clientAddress || "Unknown";

  // Get location data from Cloudflare headers
  const country = headers.get("cf-ipcountry") || "Unknown";
  const city = headers.get("cf-ipcity") || "Unknown";
  const region = headers.get("cf-region") || "Unknown";
  const timezone = headers.get("cf-timezone") || "Unknown";
  const latitude = headers.get("cf-iplatitude") || "Unknown";
  const longitude = headers.get("cf-iplongitude") || "Unknown";

  // Get browser and device info
  const userAgent = headers.get("user-agent") || "Unknown";
  const acceptLanguage = headers.get("accept-language") || "Unknown";
  const acceptEncoding = headers.get("accept-encoding") || "Unknown";

  // Parse user agent for more readable info
  let browser = "Unknown";
  let os = "Unknown";
  let device = "Desktop";

  if (userAgent !== "Unknown") {
    // Detect browser
    if (userAgent.includes("Chrome") && !userAgent.includes("Edg")) {
      browser = "Chrome";
    } else if (userAgent.includes("Safari") && !userAgent.includes("Chrome")) {
      browser = "Safari";
    } else if (userAgent.includes("Firefox")) {
      browser = "Firefox";
    } else if (userAgent.includes("Edg")) {
      browser = "Edge";
    } else if (userAgent.includes("Opera") || userAgent.includes("OPR")) {
      browser = "Opera";
    }

    // Detect OS
    if (userAgent.includes("Windows")) {
      os = "Windows";
    } else if (userAgent.includes("Mac OS X")) {
      os = "macOS";
    } else if (userAgent.includes("Linux")) {
      os = "Linux";
    } else if (userAgent.includes("Android")) {
      os = "Android";
      device = "Mobile";
    } else if (
      userAgent.includes("iOS") ||
      userAgent.includes("iPhone") ||
      userAgent.includes("iPad")
    ) {
      os = "iOS";
      device = userAgent.includes("iPad") ? "Tablet" : "Mobile";
    }

    // Detect device type
    if (userAgent.includes("Mobile") && device === "Desktop") {
      device = "Mobile";
    } else if (userAgent.includes("Tablet")) {
      device = "Tablet";
    }
  }

  // Get connection info
  const protocol = new URL(request.url).protocol;
  const host = headers.get("host") || "Unknown";
  const referer = headers.get("referer") || "None";

  // Cloudflare specific data
  const cfRay = headers.get("cf-ray") || "Unknown";
  const cfVisitor = headers.get("cf-visitor") || "Unknown";

  const userInfo = {
    network: {
      ip,
      protocol: protocol.replace(":", ""),
      host,
      cfRay,
    },
    location: {
      country,
      city,
      region,
      timezone,
      coordinates: {
        latitude,
        longitude,
      },
    },
    browser: {
      name: browser,
      userAgent,
      languages: acceptLanguage,
      encoding: acceptEncoding,
    },
    system: {
      os,
      device,
    },
    request: {
      referer,
      timestamp: new Date().toISOString(),
    },
  };

  return new Response(JSON.stringify(userInfo, null, 2), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-store, max-age=0",
    },
  });
}
