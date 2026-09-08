const encoder = new TextEncoder();

/**
 * The SHA-1 GitHub assigns a blob: `sha1("blob <length>\0" + bytes)`. Computing
 * it locally lets the publisher skip files whose content already matches the
 * repository without downloading them.
 */
export async function gitBlobSha(bytes: Uint8Array): Promise<string> {
  const header = encoder.encode(`blob ${bytes.byteLength}\0`);
  const message = new Uint8Array(header.byteLength + bytes.byteLength);
  message.set(header, 0);
  message.set(bytes, header.byteLength);

  const digest = await crypto.subtle.digest("SHA-1", message);
  return [...new Uint8Array(digest)]
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

export function encodeText(text: string): Uint8Array {
  return encoder.encode(text);
}

export function toBase64(bytes: Uint8Array): string {
  let binary = "";
  const chunk = 0x8000;
  for (let index = 0; index < bytes.length; index += chunk) {
    binary += String.fromCharCode(...bytes.subarray(index, index + chunk));
  }
  return btoa(binary);
}

export function fromBase64(text: string): Uint8Array {
  const binary = atob(text.replace(/\s/g, ""));
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }
  return bytes;
}
