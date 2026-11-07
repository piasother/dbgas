// Small helpers shared by the admin screens.
export async function adminFetch<T = any>(method: string, url: string, body?: unknown): Promise<T> {
  const res = await fetch(url, {
    method,
    credentials: "include",
    headers: body ? { "Content-Type": "application/json" } : {},
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.error || data?.message || `Request failed (${res.status})`);
  return data as T;
}

/** Upload an image to the gallery and return its public URL. */
export async function uploadImage(file: File, category: string, name?: string): Promise<string> {
  if (file.size > 5 * 1024 * 1024) throw new Error("Image is larger than 5 MB. Please use a smaller photo.");
  const form = new FormData();
  form.append("image", file);
  form.append("category", category);
  form.append("imageName", name || file.name);
  form.append("altText", name || file.name);
  const res = await fetch("/api/admin/gallery/upload", { method: "POST", body: form, credentials: "include" });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data?.imageUrl) throw new Error(data?.error || "Upload failed");
  return data.imageUrl as string;
}

export const money = (cents: number) => `$${(cents / 100).toFixed(2)}`;
