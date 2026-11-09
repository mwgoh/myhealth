function randomPart(): string {
  const c = globalThis.crypto;
  if (c && typeof c.getRandomValues === "function") {
    const buf = new Uint32Array(2);
    c.getRandomValues(buf);
    return Array.from(buf, (n) => n.toString(36)).join("");
  }
  return Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2);
}

/** crypto.randomUUID는 HTTPS나 localhost에서만 있으므로 없으면 대체 생성한다 */
export function createId(): string {
  const c = globalThis.crypto;
  if (c && typeof c.randomUUID === "function") return c.randomUUID();
  return `${Date.now().toString(36)}-${randomPart()}`;
}
