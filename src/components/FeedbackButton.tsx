/**
 * FeedbackButton [module: components]
 * Floating feedback button that opens a star-rating + optional text modal.
 * Submits to POST /api/feedback. Designed to be placed in ServiceFooter
 * or any persistent layout component.
 */
"use client";

import { useState, useCallback } from "react";
import { supabase } from "@/lib/db/client";
import { useToast } from "@/contexts/ToastContext";

interface FeedbackButtonProps {
  page?: string;
}

export default function FeedbackButton({ page }: FeedbackButtonProps) {
  const [open, setOpen] = useState(false);
  const [rating, setRating] = useState(0);
  const [hovered, setHovered] = useState(0);
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const { toast } = useToast();

  const reset = () => {
    setRating(0);
    setHovered(0);
    setMessage("");
  };

  const handleClose = () => {
    setOpen(false);
    reset();
  };

  const handleSubmit = useCallback(async () => {
    if (rating === 0) return;
    setSubmitting(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (session?.access_token) {
        headers["Authorization"] = `Bearer ${session.access_token}`;
      }

      const res = await fetch("/api/feedback", {
        method: "POST",
        headers,
        body: JSON.stringify({ rating, message: message.trim() || undefined, page }),
      });

      if (!res.ok) throw new Error("Failed to submit");

      toast.success("Thanks for your feedback!");
      handleClose();
    } catch {
      toast.error("Couldn't submit feedback. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }, [rating, message, page, toast]);

  const displayRating = hovered || rating;

  return (
    <>
      {/* Floating trigger button */}
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[#857266] hover:text-[#8B4513] border border-[#C9B89C] hover:border-[#8B4513] rounded-full bg-white/70 hover:bg-[#FDF8F3] transition-all"
        aria-label="Give feedback"
      >
        <span className="material-symbols-outlined text-base">chat_bubble</span>
        Feedback
      </button>

      {/* Modal */}
      {open && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm p-4"
          onClick={handleClose}
        >
          <div
            className="w-full max-w-sm bg-gradient-to-br from-[#FDF8F3] to-[#F5EDE4] rounded-2xl border-2 border-[#C9B89C] shadow-2xl p-6"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-bold text-[#171412] text-base flex items-center gap-2">
                <span className="material-symbols-outlined text-[#8B4513] text-xl">
                  chat_bubble
                </span>
                Share your thoughts
              </h3>
              <button
                onClick={handleClose}
                className="w-7 h-7 flex items-center justify-center rounded-full text-stone-400 hover:text-[#8B4513] hover:bg-[#EDE0D4] transition-colors"
              >
                <span className="material-symbols-outlined text-lg">close</span>
              </button>
            </div>

            {/* Star rating */}
            <div className="flex gap-2 justify-center mb-5">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onMouseEnter={() => setHovered(star)}
                  onMouseLeave={() => setHovered(0)}
                  onClick={() => setRating(star)}
                  className="transition-transform hover:scale-110 active:scale-95"
                  aria-label={`Rate ${star} stars`}
                >
                  <span
                    className="material-symbols-outlined text-3xl transition-colors"
                    style={{
                      fontVariationSettings: star <= displayRating ? "'FILL' 1" : "'FILL' 0",
                      color: star <= displayRating ? "#f59e0b" : "#C9B89C",
                    }}
                  >
                    star
                  </span>
                </button>
              ))}
            </div>

            {/* Text area */}
            <textarea
              className="w-full rounded-xl border border-[#C9B89C] bg-white/80 p-3 text-sm text-[#171412] placeholder:text-[#857266] resize-none outline-none focus:border-[#8B4513] transition-colors"
              placeholder="Tell us what you think (optional)..."
              rows={3}
              maxLength={500}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
            />

            {/* Submit */}
            <button
              onClick={handleSubmit}
              disabled={rating === 0 || submitting}
              className="mt-4 w-full py-2.5 bg-[#8B4513] text-white text-sm font-bold rounded-xl hover:bg-[#A0522D] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              {submitting ? "Sending..." : "Submit Feedback"}
            </button>
          </div>
        </div>
      )}
    </>
  );
}
