"use client";

import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Camera, Frown, LockKeyhole, PartyPopper, ShieldCheck, X } from "lucide-react";

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
  const [imagePreview, setImagePreview] = useState<string | null>(null);
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

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    setImageFile(file);
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setImagePreview(reader.result as string);
      reader.readAsDataURL(file);
    } else {
      setImagePreview(null);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-[200] flex items-center justify-center p-4">
      <div className="bg-white border border-[#E9ECEF] rounded-[20px] w-full max-w-[510px] max-h-[90vh] overflow-y-auto shadow-2xl animate-[modalUp_0.3s_var(--ease)_both]">
        {/* Header */}
        <div className="bg-[#5BC4F5] px-7 pt-6 pb-4 rounded-t-[19px] border-b border-[#5bc4f54d] relative">
          <div className="font-['Plus_Jakarta_Sans',sans-serif] text-lg font-extrabold text-[#212529]">
            Post an Item
          </div>
          <button
            onClick={onClose}
            className="absolute top-3.5 right-3.5 w-7 h-7 rounded bg-white/60 border border-black/10 text-[#495057] text-[13px] flex items-center justify-center transition hover:bg-white"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="px-7 py-6 space-y-5">
          {/* Type Toggle */}
          <div className="flex gap-2 mb-3">
            <button
              type="button"
              onClick={() => setType("lost")}
              className={`flex-1 py-2 rounded-[9px] border text-sm font-bold transition-all flex items-center justify-center gap-2 ${
                type === "lost"
                  ? "bg-[#FFE3E3] border-[#FFC9C9] text-[#C92A2A]"
                  : "bg-[#F8F9FA] border-[#E9ECEF] text-[#868E96] hover:text-[#212529]"
              }`}
            >
              <Frown size={16} /> I Lost Something
            </button>
            <button
              type="button"
              onClick={() => setType("found")}
              className={`flex-1 py-2 rounded-[9px] border text-sm font-bold transition-all flex items-center justify-center gap-2 ${
                type === "found"
                  ? "bg-[#D3F9D8] border-[#B2F2BB] text-[#1C7C34]"
                  : "bg-[#F8F9FA] border-[#E9ECEF] text-[#868E96] hover:text-[#212529]"
              }`}
            >
              <PartyPopper size={16} /> I Found Something
            </button>
          </div>
          {/* Title */}
          <div className="flex flex-col gap-1">
            <label className="font-['Plus_Jakarta_Sans',sans-serif] text-xs font-bold text-[#868E96] uppercase tracking-wider mb-1">
              Item Name
            </label>
            <input
              className="w-full border border-[#E9ECEF] rounded-[9px] px-3 py-2 text-sm outline-none focus:border-[#5BC4F5] transition-colors"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Black AirPods Pro, Blue Jansport Bag…"
              required
            />
          </div>
          {/* Category & Location */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <label className="font-['Plus_Jakarta_Sans',sans-serif] text-xs font-bold text-[#868E96] uppercase tracking-wider mb-1">
                Category
              </label>
              <select
                className="w-full border border-[#E9ECEF] rounded-[9px] px-3 py-2 text-sm outline-none focus:border-[#5BC4F5] transition-colors bg-white"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
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
            <div className="flex flex-col gap-1">
              <label className="font-['Plus_Jakarta_Sans',sans-serif] text-xs font-bold text-[#868E96] uppercase tracking-wider mb-1">
                Location
              </label>
              <select
                className="w-full border border-[#E9ECEF] rounded-[9px] px-3 py-2 text-sm outline-none focus:border-[#5BC4F5] transition-colors bg-white"
                value={locationZone}
                onChange={(e) => setLocationZone(e.target.value)}
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
          </div>
          {/* Description */}
          <div className="flex flex-col gap-1">
            <label className="font-['Plus_Jakarta_Sans',sans-serif] text-xs font-bold text-[#868E96] uppercase tracking-wider mb-1 flex items-center gap-2">
              Public Description{" "}
              <span className="ml-1 px-2 py-0.5 text-[.61rem] bg-[#EBF7FD] text-[#1A9FD4] border border-[#5bc4f54d] rounded font-['Outfit',sans-serif] font-semibold">
                Visible to all
              </span>
            </label>
            <textarea
              className="w-full border border-[#E9ECEF] rounded-[9px] px-3 py-2 text-sm outline-none focus:border-[#5BC4F5] transition-colors resize-vertical min-h-[78px]"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Color, brand, size, any noticeable features…"
              required
            />
          </div>
          {/* Challenge */}
          <div className="flex flex-col gap-1">
            <label className="font-['Plus_Jakarta_Sans',sans-serif] text-xs font-bold text-[#868E96] uppercase tracking-wider mb-1 flex items-center gap-2">
              <ShieldCheck className="h-4 w-4" />
              Verification Challenge
            </label>
            <input
              className="w-full border border-[#E9ECEF] rounded-[9px] px-3 py-2 text-sm outline-none focus:border-[#5BC4F5] transition-colors"
              type="text"
              value={challenge}
              onChange={(e) => setChallenge(e.target.value)}
              placeholder="A question only the owner can answer"
              required
            />
            <div className="flex items-start gap-2 mt-2 bg-[#F3F0FE] border border-[#E5DAFE] rounded-[9px] px-3 py-2 text-[.73rem] text-[#495057]">
              <LockKeyhole className="h-[14px] w-[14px] mt-0.5 shrink-0 text-[#7048E8]" />
              <span>
                Only revealed in chat to{" "}
                <b className="text-[#845EF7] font-bold">verify the true owner</b>
                . Never shown publicly.
              </span>
            </div>
          </div>
          {/* Image Upload */}
          <div className="flex flex-col gap-1">
            <label className="font-['Plus_Jakarta_Sans',sans-serif] text-xs font-bold text-[#868E96] uppercase tracking-wider mb-1 flex items-center gap-2">
              Add a Photo{" "}
              <span className="ml-1 px-2 py-0.5 text-[.61rem] bg-[#EBF7FD] text-[#1A9FD4] border border-[#5bc4f54d] rounded font-['Outfit',sans-serif] font-semibold">
                Optional
              </span>
            </label>
            <div className="border border-dashed border-[#DEE2E6] rounded-[9px] p-5 text-center bg-[#F8F9FA] cursor-pointer transition-all">
              <input
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="hidden"
                id="item-photo-upload"
              />
              <label
                htmlFor="item-photo-upload"
                className="block cursor-pointer"
              >
                <div className="mb-1 flex justify-center text-[#495057]">
                  <Camera size={22} />
                </div>
                <div className="font-['Plus_Jakarta_Sans',sans-serif] text-[.8rem] font-bold text-[#868E96]">
                  Tap to upload a photo
                </div>
                <div className="text-[.68rem] text-[#ADB5BD] mt-0.5">
                  JPG, PNG, WEBP · Max 5MB
                </div>
                {imagePreview && (
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="mx-auto mt-3 max-h-40 rounded-[8px] border border-[#E9ECEF] object-contain"
                  />
                )}
              </label>
            </div>
          </div>
          {/* Submit */}
          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-[#5BC4F5] text-[#212529] py-3 text-sm font-bold uppercase tracking-wider rounded-[10px] shadow-md transition-all flex items-center justify-center gap-2 mt-2 disabled:opacity-50"
          >
            {submitting
              ? "Posting..."
              : `Post ${type === "lost" ? "Lost" : "Found"} Item`}
          </button>
        </form>
      </div>
    </div>
  );
}
