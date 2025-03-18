import os from "os";

export function isYoutubeUrl(url: string) {
  const regex = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+/;
  return regex.test(url);
}

export function generateUrlScheme(url: string, scheme: string) {
  const updatedUrl = url.replace(/^(https?:\/\/)/, "");
  return `${scheme}://${updatedUrl}`;
}

export function isRedditUrl(url: string) {
  const regex = /^(https?:\/\/)?(www\.)?(reddit\.com|old\.reddit\.com)\/.+/;
  return regex.test(url);
}

export function getMacIp(interfaces: NodeJS.Dict<os.NetworkInterfaceInfo[]>) {
  const wifiInterfaceName = ["en0", "en1"];

  for (const name of wifiInterfaceName) {
    const wifiInterface = interfaces[name];

    if (wifiInterface) {
      for (const iface of wifiInterface) {
        if (iface.family === "IPv4" && !iface.internal) {
          return iface.address;
        }
      }
    }
  }
  return "127.0.0.1";
}

export function getServerIp() {
  const platform = os.platform();
  const interfaces = os.networkInterfaces();

  // :: Handle MacOS specifically
  if (platform === "darwin") {
    return getMacIp(interfaces);
  }

  // :: For both Linux and Windows
  const validInterfaces = [];

  // :: Collect all valid (non-internal, IPv4) interfaces
  for (const [name, nets] of Object.entries(interfaces)) {
    for (const net of nets) {
      // Skip internal interfaces and non-IPv4
      if (!net.internal && net.family === "IPv4") {
        validInterfaces.push({
          name,
          address: net.address,
          // Common wireless interface patterns
          isWireless:
            name.toLowerCase().match(/^(wlan|wifi|wi-fi|wireless|wlp|wlo)/i) !==
            null,
        });
      }
    }
  }

  // :: First, try to find a wireless interface
  const wirelessInterface = validInterfaces.find((iface) => iface.isWireless);
  if (wirelessInterface) {
    return wirelessInterface.address;
  }

  // :: If no wireless interface, look for any valid interface that's not localhost
  const validInterface = validInterfaces.find(
    (iface) =>
      !iface.address.startsWith("127.") && !iface.address.startsWith("169.254.") // Exclude link-local addresses
  );

  if (validInterface) {
    return validInterface.address;
  }

  // :: Log available interfaces for debugging
  console.log(
    "Available network interfaces:",
    validInterfaces.map((iface) => ({
      name: iface.name,
      address: iface.address,
      isWireless: iface.isWireless,
    }))
  );

  return "127.0.0.1"; // :: Fallback to localhost if no suitable interface found
}
