import { useEffect, useState } from "react";

interface UserInfoData {
  network: {
    ip: string;
    protocol: string;
    host: string;
    cfRay: string;
  };
  location: {
    country: string;
    city: string;
    region: string;
    timezone: string;
    coordinates: {
      latitude: string;
      longitude: string;
    };
  };
  browser: {
    name: string;
    userAgent: string;
    languages: string;
    encoding: string;
  };
  system: {
    os: string;
    device: string;
  };
  request: {
    referer: string;
    timestamp: string;
  };
}

interface ClientInfo {
  screenResolution: string;
  viewport: string;
  colorDepth: string;
  pixelRatio: string;
  cookiesEnabled: string;
  platform: string;
  hardwareConcurrency: string;
  deviceMemory: string;
  connectionType: string;
  onlineStatus: string;
  batteryStatus: string;
}

export default function UserInfo() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [serverData, setServerData] = useState<UserInfoData | null>(null);
  const [clientData, setClientData] = useState<ClientInfo | null>(null);
  const [clientLocation, setClientLocation] = useState<{
    timezone?: string;
    coordinates?: { latitude: string; longitude: string };
  }>({});
  const [geoStatus, setGeoStatus] = useState<string | null>(null);

  useEffect(() => {
    async function fetchUserInfo() {
      try {
        const response = await fetch("/api/userinfo");
        if (!response.ok) throw new Error("Failed to fetch user information");

        const data = await response.json();
        setServerData(data);

        const localTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
        if (localTimezone) {
          setClientLocation((prev) => ({ ...prev, timezone: localTimezone }));
        }

        // Gather client-side info
        const client: ClientInfo = {
          screenResolution: `${screen.width} × ${screen.height}`,
          viewport: `${window.innerWidth} × ${window.innerHeight}`,
          colorDepth: `${screen.colorDepth}-bit`,
          pixelRatio: window.devicePixelRatio.toString(),
          cookiesEnabled: navigator.cookieEnabled ? "Yes" : "No",
          platform: navigator.platform,
          hardwareConcurrency: navigator.hardwareConcurrency
            ? `${navigator.hardwareConcurrency} cores`
            : "Unknown",
          deviceMemory: "Unknown",
          connectionType: "Unknown",
          onlineStatus: navigator.onLine ? "Online" : "Offline",
          batteryStatus: "Loading...",
        };

        // @ts-ignore - deviceMemory is not in all browsers
        const deviceMemory = navigator.deviceMemory;
        if (deviceMemory) {
          client.deviceMemory = `${deviceMemory} GB`;
        }

        // @ts-ignore - connection is not in all browsers
        const connection =
          navigator.connection ||
          navigator.mozConnection ||
          navigator.webkitConnection;
        if (connection?.effectiveType) {
          client.connectionType = connection.effectiveType;
        }

        // Battery status
        // @ts-ignore - getBattery is not in all browsers
        if (navigator.getBattery) {
          // @ts-ignore
          navigator
            .getBattery()
            .then((battery: any) => {
              const level = Math.round(battery.level * 100);
              const charging = battery.charging ? " (Charging)" : "";
              setClientData((prev) =>
                prev
                  ? { ...prev, batteryStatus: `${level}%${charging}` }
                  : prev,
              );
            })
            .catch(() => {
              setClientData((prev) =>
                prev ? { ...prev, batteryStatus: "Unknown" } : prev,
              );
            });
        } else {
          client.batteryStatus = "Not supported";
        }

        setClientData(client);
        setLoading(false);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "An unknown error occurred",
        );
        setLoading(false);
      }
    }

    fetchUserInfo();
  }, []);

  const requestGeolocation = () => {
    if (!navigator.geolocation) {
      setGeoStatus("Geolocation is not supported in this browser.");
      return;
    }

    setGeoStatus("Requesting permission for precise location...");

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const latitude = position.coords.latitude.toFixed(5);
        const longitude = position.coords.longitude.toFixed(5);

        setClientLocation((prev) => ({
          ...prev,
          coordinates: { latitude, longitude },
        }));
        setGeoStatus("Location captured from your browser.");
      },
      (err) => {
        if (err.code === 1) {
          setGeoStatus(
            "Permission denied. We won't request it again unless you click the button.",
          );
        } else {
          setGeoStatus("Unable to retrieve location.");
        }
      },
    );
  };

  if (loading) {
    return (
      <div className="my-8 flex items-center justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-300 border-t-black dark:border-gray-600 dark:border-t-white"></div>
        <span className="ml-3 text-gray-600 dark:text-gray-400">
          Loading your information...
        </span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="my-8 rounded-lg border border-red-200 bg-red-50 p-6 dark:border-red-800 dark:bg-red-900/20">
        <h2 className="text-xl font-semibold text-red-800 dark:text-red-400">
          Error Loading Information
        </h2>
        <p className="mt-2 text-red-600 dark:text-red-300">{error}</p>
      </div>
    );
  }

  if (!serverData || !clientData) return null;

  const timezoneDisplay =
    serverData.location.timezone !== "Unknown"
      ? serverData.location.timezone
      : clientLocation.timezone
        ? `${clientLocation.timezone} (from browser)`
        : "Unknown";

  const latitudeDisplay = clientLocation.coordinates?.latitude
    ? `${clientLocation.coordinates.latitude} (from browser)`
    : serverData.location.coordinates.latitude;

  const longitudeDisplay = clientLocation.coordinates?.longitude
    ? `${clientLocation.coordinates.longitude} (from browser)`
    : serverData.location.coordinates.longitude;

  return (
    <div className="not-prose my-8 space-y-6">
      {/* Network Information */}
      <section className="space-y-4 rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
        <h2 className="text-xl font-semibold text-black dark:text-white">
          Network Information
        </h2>
        <div className="grid gap-4 md:grid-cols-2">
          <InfoItem label="IP Address" value={serverData.network.ip} mono />
          <InfoItem label="Protocol" value={serverData.network.protocol} mono />
          <InfoItem label="Host" value={serverData.network.host} mono />
          <InfoItem
            label="Cloudflare Ray ID"
            value={serverData.network.cfRay}
            mono
          />
        </div>
      </section>

      {/* Location Information */}
      <section className="space-y-4 rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
        <h2 className="text-xl font-semibold text-black dark:text-white">
          Location Information
        </h2>
        <div className="space-y-2">
          <p className="text-sm text-gray-600 dark:text-gray-300">
            Using Cloudflare headers when available. You can optionally share your browser’s precise location to improve the
            results.
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={requestGeolocation}
              className="rounded-md bg-black px-3 py-2 text-sm font-medium text-white transition hover:bg-gray-800 dark:bg-white dark:text-black dark:hover:bg-gray-200"
            >
              Use browser location
            </button>
            {geoStatus && (
              <span className="text-sm text-gray-600 dark:text-gray-400">{geoStatus}</span>
            )}
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <InfoItem label="Country" value={serverData.location.country} />
          <InfoItem label="City" value={serverData.location.city} />
          <InfoItem label="Region" value={serverData.location.region} />
          <InfoItem label="Timezone" value={timezoneDisplay} />
          <InfoItem
            label="Latitude"
            value={latitudeDisplay}
            mono
          />
          <InfoItem
            label="Longitude"
            value={longitudeDisplay}
            mono
          />
        </div>
      </section>

      {/* Browser Information */}
      <section className="space-y-4 rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
        <h2 className="text-xl font-semibold text-black dark:text-white">
          Browser Information
        </h2>
        <div className="space-y-4">
          <InfoItem label="Browser" value={serverData.browser.name} />
          <InfoItem
            label="User Agent"
            value={serverData.browser.userAgent}
            mono
            breakAll
          />
          <InfoItem label="Languages" value={serverData.browser.languages} />
          <InfoItem label="Encoding" value={serverData.browser.encoding} />
        </div>
      </section>

      {/* System Information */}
      <section className="space-y-4 rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
        <h2 className="text-xl font-semibold text-black dark:text-white">
          System Information
        </h2>
        <div className="grid gap-4 md:grid-cols-2">
          <InfoItem label="Operating System" value={serverData.system.os} />
          <InfoItem label="Device Type" value={serverData.system.device} />
        </div>
      </section>

      {/* Request Information */}
      <section className="space-y-4 rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
        <h2 className="text-xl font-semibold text-black dark:text-white">
          Request Information
        </h2>
        <div className="space-y-4">
          <InfoItem
            label="Referer"
            value={serverData.request.referer}
            breakAll
          />
          <InfoItem
            label="Timestamp"
            value={new Date(serverData.request.timestamp).toLocaleString()}
          />
        </div>
      </section>

      {/* Client-Side Information */}
      <section className="space-y-4 rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
        <h2 className="text-xl font-semibold text-black dark:text-white">
          Client-Side Information
        </h2>
        <div className="grid gap-4 md:grid-cols-2">
          <InfoItem
            label="Screen Resolution"
            value={clientData.screenResolution}
            mono
          />
          <InfoItem label="Viewport Size" value={clientData.viewport} mono />
          <InfoItem label="Color Depth" value={clientData.colorDepth} />
          <InfoItem label="Pixel Ratio" value={clientData.pixelRatio} />
          <InfoItem label="Cookies Enabled" value={clientData.cookiesEnabled} />
          <InfoItem label="JavaScript Enabled" value="Yes" success />
          <InfoItem label="Platform" value={clientData.platform} />
          <InfoItem
            label="Hardware Concurrency"
            value={clientData.hardwareConcurrency}
          />
          <InfoItem label="Device Memory" value={clientData.deviceMemory} />
          <InfoItem label="Connection Type" value={clientData.connectionType} />
          <InfoItem
            label="Online Status"
            value={clientData.onlineStatus}
            success
          />
          <InfoItem label="Battery Status" value={clientData.batteryStatus} />
        </div>
      </section>
    </div>
  );
}

interface InfoItemProps {
  label: string;
  value: string;
  mono?: boolean;
  breakAll?: boolean;
  success?: boolean;
}

function InfoItem({ label, value, mono, breakAll, success }: InfoItemProps) {
  return (
    <div className="space-y-1">
      <p className="text-sm text-gray-500 dark:text-gray-400">{label}</p>
      <p
        className={`text-base ${mono ? "font-mono" : ""} ${breakAll ? "break-all text-sm" : ""} ${success ? "text-green-600 dark:text-green-400" : "text-black dark:text-white"}`}
      >
        {value}
      </p>
    </div>
  );
}
