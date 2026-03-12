"use client";

import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { ShieldCheck, X } from "lucide-react";

const CATEGORIES = [
  "ELECTRONICS",
  "BAGS",
  "KEYS",
  "STATIONERY",
  "ACCESSORIES",
  "ID/DOCUMENTS",
  "CLOTHING",
  "OTHER",
];

const ZONES = [
  "Library",
  "CICT Bldg",
  "CON Bldg",
  "CAS Bldg",
  "Canteen Area",
  "Main Gate",
  "Gymnasium",
  "Other",
];

interface PostItemFormProps {
  onClose: () => void;
}

export function PostItemForm({ onClose }: PostItemFormProps) {
  const createItem = useMutation(api.items.createItem);
  const generateUploadUrl = useMutation(api.items.generateUploadUrl);

  const [type, setType] = useState<"lost" | "found">("lost");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [locationZone, setLocationZone] = useState("");
  const [challenge, setChallenge] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !description || !category || !locationZone || !challenge)
      return;

    setSubmitting(true);

    try {
      let imageId;
      if (imageFile) {
        const uploadUrl = await generateUploadUrl();
        const result = await fetch(uploadUrl, {
          method: "POST",
          headers: { "Content-Type": imageFile.type },
          body: imageFile,
        });
        const { storageId } = await result.json();
        imageId = storageId;
      }

      await createItem({
        type,
        title,
        description,
        category,
        locationZone,
        challenge,
        imageId,
      });

      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-[200] flex items-center justify-center p-4">
      <div className="bg-white border-2 border-wvsu-blue w-full max-w-md max-h-[90vh] overflow-y-auto shadow-[6px_6px_0_var(--blue)]">
        {/* Header */}
        <div className="bg-wvsu-blue px-4 py-3 flex items-center justify-between">
          <div className="font-display text-lg text-white">Post Item</div>
          <button
            onClick={onClose}
            className="text-white/70 hover:text-white text-xl font-bold leading-none"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {/* Type Toggle */}
          <div className="flex border-2 border-wvsu-border">
            <button
              type="button"
              onClick={() => setType("lost")}
              className={`flex-1 py-2 text-xs font-bold uppercase tracking-wider transition-all ${
                type === "lost"
                  ? "bg-lost-red text-white"
                  : "bg-white text-wvsu-muted hover:bg-wvsu-light-blue"
              }`}
            >
              Lost
            </button>
            <button
              type="button"
              onClick={() => setType("found")}
              className={`flex-1 py-2 text-xs font-bold uppercase tracking-wider transition-all ${
                type === "found"
                  ? "bg-found-green text-white"
                  : "bg-white text-wvsu-muted hover:bg-wvsu-light-blue"
              }`}
            >
              Found
            </button>
          </div>

          {/* Title */}
          <div>
            <label className="block text-[10px] font-bold tracking-[0.12em] uppercase text-wvsu-muted font-mono mb-1">
              Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Blue Jansport Backpack"
              className="w-full border-2 border-wvsu-border px-3 py-2 text-sm outline-none focus:border-wvsu-blue transition-colors"
              required
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-[10px] font-bold tracking-[0.12em] uppercase text-wvsu-muted font-mono mb-1">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the item in detail..."
              rows={3}
              className="w-full border-2 border-wvsu-border px-3 py-2 text-sm outline-none focus:border-wvsu-blue transition-colors resize-none"
              required
            />
          </div>

          {/* Category */}
          <div>
            <label className="block text-[10px] font-bold tracking-[0.12em] uppercase text-wvsu-muted font-mono mb-1">
              Category
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full border-2 border-wvsu-border px-3 py-2 text-sm outline-none focus:border-wvsu-blue transition-colors bg-white"
              required
            >
              <option value="">Select category</option>
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {/* Location Zone */}
          <div>
            <label className="block text-[10px] font-bold tracking-[0.12em] uppercase text-wvsu-muted font-mono mb-1">
              Location Zone
            </label>
            <select
              value={locationZone}
              onChange={(e) => setLocationZone(e.target.value)}
              className="w-full border-2 border-wvsu-border px-3 py-2 text-sm outline-none focus:border-wvsu-blue transition-colors bg-white"
              required
            >
              <option value="">Select zone</option>
              {ZONES.map((zone) => (
                <option key={zone} value={zone}>
                  {zone}
                </option>
              ))}
            </select>
          </div>

          {/* Challenge */}
          <div>
            <label className="block text-[10px] font-bold tracking-[0.12em] uppercase text-wvsu-muted font-mono mb-1">
              <span className="inline-flex items-center gap-1">
                <ShieldCheck className="h-3.5 w-3.5" />
                Verification Challenge
              </span>
            </label>
            <input
              type="text"
              value={challenge}
              onChange={(e) => setChallenge(e.target.value)}
              placeholder="A question only the owner can answer"
              className="w-full border-2 border-wvsu-border px-3 py-2 text-sm outline-none focus:border-wvsu-blue transition-colors"
              required
            />
            <div className="text-[10px] text-wvsu-muted mt-1">
              This helps verify the true owner when someone contacts you.
            </div>
          </div>

          {/* Image Upload */}
          <div>
            <label className="block text-[10px] font-bold tracking-[0.12em] uppercase text-wvsu-muted font-mono mb-1">
              Photo (Optional)
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setImageFile(e.target.files?.[0] ?? null)}
              className="w-full text-sm text-wvsu-muted file:mr-3 file:px-3 file:py-1.5 file:border-2 file:border-wvsu-blue file:bg-white file:text-wvsu-blue file:text-xs file:font-bold file:uppercase file:cursor-pointer"
            />
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-wvsu-blue text-white py-3 text-sm font-bold uppercase tracking-wider hover:bg-wvsu-blue-dark transition-colors disabled:opacity-50"
          >
            {submitting ? "Posting..." : `Post ${type === "lost" ? "Lost" : "Found"} Item`}
          </button>
        </form>
      </div>
    </div>
  );
}
