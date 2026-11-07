import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { adminFetch, uploadImage } from "./api";

const SLOTS = [
  { key: "hero", label: "Home page main picture", hint: "Wide picture, about 1280 × 920 px" },
  { key: "about", label: "About section picture", hint: "About 1280 × 920 px" },
  { key: "commercial", label: "Commercial section picture", hint: "About 1280 × 920 px" },
  { key: "safety", label: "Safety section picture", hint: "Tall picture, about 800 × 1040 px" },
];

export function SiteImagesManager() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const { data: images } = useQuery<Record<string, string>>({ queryKey: ["/api/site-images"] });
  const [busy, setBusy] = useState<string | null>(null);

  const change = async (key: string, file: File | undefined) => {
    if (!file) return;
    setBusy(key);
    try {
      const url = await uploadImage(file, "home", `${key} image`);
      await adminFetch("PUT", "/api/admin/site-images", { key, url });
      qc.invalidateQueries({ queryKey: ["/api/site-images"] });
      qc.invalidateQueries({ queryKey: ["/api/admin/gallery-images"] });
      toast({ title: "Picture updated", description: "It's live on the website now." });
    } catch (err: any) {
      toast({ title: "Could not update picture", description: err.message, variant: "destructive" });
    } finally {
      setBusy(null);
    }
  };

  const reset = async (key: string) => {
    setBusy(key);
    try {
      await adminFetch("PUT", "/api/admin/site-images", { key, reset: true });
      qc.invalidateQueries({ queryKey: ["/api/site-images"] });
      toast({ title: "Restored the original picture" });
    } catch (err: any) {
      toast({ title: "Could not reset", description: err.message, variant: "destructive" });
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="mb-8">
      <h3 className="text-lg font-semibold mb-1">Website Pictures</h3>
      <p className="text-sm text-gray-600 mb-4">Upload a photo to replace a picture on the home page. Changes appear immediately.</p>
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {SLOTS.map((s) => (
          <div key={s.key} className="bg-white p-4 rounded-lg shadow-sm border">
            <h4 className="font-medium mb-2">{s.label}</h4>
            <div className="h-32 bg-slate-50 rounded mb-2 flex items-center justify-center overflow-hidden">
              {images?.[s.key] && <img src={images[s.key]} alt={s.label} className="max-h-full max-w-full object-contain" />}
            </div>
            <p className="text-xs text-gray-500 mb-2">{s.hint}</p>
            <label className={`inline-flex items-center text-sm text-primary cursor-pointer ${busy === s.key ? "opacity-50 pointer-events-none" : ""}`}>
              <i className="fas fa-upload mr-1"></i>
              {busy === s.key ? "Uploading…" : "Upload new picture"}
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp"
                className="sr-only"
                onChange={(e) => change(s.key, e.target.files?.[0])}
              />
            </label>
            <button type="button" onClick={() => reset(s.key)} className="block mt-1 text-xs text-gray-500 hover:underline">
              Restore original
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
