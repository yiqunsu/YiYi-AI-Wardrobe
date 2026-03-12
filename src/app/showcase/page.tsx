/**
 * Showcase page [module: marketing / social proof]
 * Explains the 6-step YiYi workflow with an alternating vertical narrative layout.
 */
import Footer from "@/components/layout/Footer";
import Navbar from "@/components/layout/Navbar";
import Image from "next/image";

const steps = [
  {
    id: 1,
    label: "01",
    title: "Upload Clothes",
    description:
      "Start by uploading photos of your clothing items. YiYi builds your personal digital wardrobe — your own virtual closet, always accessible.",
    bullets: [
      "Batch upload multiple items at once",
      "Supports any photo angle or background",
      "Items appear in your wardrobe grid immediately",
    ],
    image: "/images/step1.png" as string | null,
    imageAlign: "left" as const,
    accent: "#D4B896",
  },
  {
    id: 2,
    label: "02",
    title: "AI Analysis",
    description:
      "After upload, YiYi's AI processes every item behind the scenes — analyzing style, color, material and generating clean, normalized visuals for your wardrobe.",
    bullets: [
      "Detects color, style & fabric automatically",
      "Redraws clothing for clean presentation",
      "Structured metadata stored for smart matching",
    ],
    image: "/images/step2.png" as string | null,
    imageAlign: "right" as const,
    accent: "#C9A882",
  },
  {
    id: 3,
    label: "03",
    title: "Add Your Model",
    description:
      "Upload a full-body photo to use as your personal model. YiYi renders outfit previews on you — not a generic mannequin. Default models are available if you prefer.",
    bullets: [
      "One-time setup, reused for every outfit",
      "Male & female default models available",
      "Your proportions, your real look",
    ],
    image: "/images/step3.png" as string | null,
    imageAlign: "left" as const,
    accent: "#BF9870",
  },
  {
    id: 4,
    label: "04",
    title: "Find Your Best Outfit",
    description:
      "Tell YiYi the occasion, location, date, and the vibe you're going for. It searches your wardrobe and curates the best combination just for that moment.",
    bullets: [
      "Location & weather-aware recommendations",
      "Occasion and style prompt support",
      "Picks only from your own wardrobe items",
    ],
    image: "/images/step4.png" as string | null,
    imageAlign: "right" as const,
    accent: "#B4895E",
  },
  {
    id: 5,
    label: "05",
    title: "Magic Mirror",
    description:
      "YiYi generates a full outfit preview with your selected clothes rendered on your model photo. See the complete look before you wear it — instantly.",
    bullets: [
      "Full outfit rendered on your own photo",
      "See the result before you wear it",
      "Tweak and regenerate until it's perfect",
    ],
    image: "/images/step5.png" as string | null,
    imageAlign: "left" as const,
    accent: "#8B5E3C",
  },
  {
    id: 6,
    label: "06",
    title: "History & Style Memory",
    description:
      "Every outfit YiYi generates is saved to your History. Browse past looks, save your favorites, and revisit previous suggestions anytime. Over time, YiYi learns what you love.",
    bullets: [
      "All generated outfits saved automatically",
      "Save and organize your favorite looks",
      "Helps YiYi understand your personal style",
    ],
    image: "/images/step6.png" as string | null,
    imageAlign: "right" as const,
    accent: "#6B4226",
  },
];

// ── Placeholder ───────────────────────────────────────────────────────────────
function ImagePlaceholder({ step }: { step: { id: number; accent: string } }) {
  return (
    <div className="relative w-full overflow-hidden rounded-2xl border border-stone-200 bg-gradient-to-br from-[#F5EDE3] to-[#E8D5BE] shadow-md" style={{ aspectRatio: "4/3" }}>
      <div className="flex items-center gap-1.5 border-b border-stone-200/60 bg-white/70 px-4 py-2.5">
        <div className="h-2.5 w-2.5 rounded-full bg-red-300" />
        <div className="h-2.5 w-2.5 rounded-full bg-amber-300" />
        <div className="h-2.5 w-2.5 rounded-full bg-green-300" />
        <div className="ml-3 h-2 w-32 rounded-full bg-stone-200" />
      </div>
      <div className="flex h-full flex-col items-center justify-center gap-4 p-6">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl text-2xl font-bold text-white shadow-lg" style={{ backgroundColor: step.accent }}>
          {step.id}
        </div>
        <div className="w-full max-w-xs space-y-2.5">
          <div className="h-3 w-full rounded-full bg-stone-300/50" />
          <div className="h-3 w-4/5 rounded-full bg-stone-300/40" />
          <div className="h-3 w-3/5 rounded-full bg-stone-300/30" />
        </div>
        <div className="mt-2 h-20 w-full max-w-xs rounded-xl bg-white/50" />
        <div className="mt-2 h-9 w-36 rounded-xl opacity-70" style={{ backgroundColor: step.accent }} />
      </div>
    </div>
  );
}

// ── Connector ─────────────────────────────────────────────────────────────────
function StepConnector() {
  return (
    <div className="flex justify-center py-2">
      <div className="flex flex-col items-center gap-1">
        <div className="h-8 w-px bg-stone-300" />
        <div className="h-2 w-2 rounded-full bg-stone-300" />
        <div className="h-8 w-px bg-stone-300" />
      </div>
    </div>
  );
}

// ── Bullets ───────────────────────────────────────────────────────────────────
function BulletList({ bullets, accent }: { bullets: string[]; accent: string }) {
  return (
    <ul className="space-y-2.5">
      {bullets.map((b) => (
        <li key={b} className="flex items-center gap-2.5 text-sm text-stone-600">
          <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-white" style={{ backgroundColor: accent }}>
            <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
              <path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </span>
          {b}
        </li>
      ))}
    </ul>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function ShowcasePage() {
  return (
    <div className="min-h-screen bg-[color:var(--background)] text-[color:var(--foreground)]">
      <Navbar />
      <main className="pt-20">

        {/* Title */}
        <section className="mx-auto max-w-7xl px-6 py-16 text-center">
          <p className="mb-4 text-sm font-bold uppercase tracking-widest text-[#8B5E3C]">
            How it works
          </p>
          <h1 className="serif-font mb-6 text-4xl font-bold text-stone-900 md:text-5xl">
            How YiYi Works
          </h1>
          <p className="mx-auto max-w-2xl text-lg text-stone-600">
            From wardrobe upload to AI-generated outfit — six simple steps to your perfect look.
          </p>
        </section>

        {/* All 6 steps */}
        <section className="mx-auto max-w-6xl px-6 pb-28">
          {steps.map((step, index) => {
            const isImageLeft = step.imageAlign === "left";
            return (
              <div key={step.id}>
                <div className="grid grid-cols-2 items-center gap-16 py-20">
                  {/* Image */}
                  <div className={`flex items-center justify-center ${isImageLeft ? "order-1" : "order-2"}`}>
                    {step.image ? (
                      <div className="w-full overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-lg">
                        {/* Browser top bar */}
                        <div className="flex items-center gap-1.5 border-b border-stone-200 bg-stone-50 px-4 py-2.5">
                          <div className="h-2.5 w-2.5 rounded-full bg-red-400/70" />
                          <div className="h-2.5 w-2.5 rounded-full bg-amber-400/70" />
                          <div className="h-2.5 w-2.5 rounded-full bg-green-400/70" />
                          <div className="ml-3 flex h-5 flex-1 items-center rounded-md bg-stone-200/80 px-3">
                            <div className="h-2 w-24 rounded-full bg-stone-300/80" />
                          </div>
                        </div>
                        {/* Image area: fixed height, full image centered with object-contain */}
                        <div className="flex items-center justify-center bg-[color:var(--background)] p-4">
                          <Image
                            src={step.image}
                            alt={step.title}
                            width={0}
                            height={0}
                            sizes="(max-width: 1280px) 50vw, 600px"
                            className="h-auto max-h-[420px] w-auto max-w-full object-contain"
                          />
                        </div>
                      </div>
                    ) : (
                      <ImagePlaceholder step={step} />
                    )}
                  </div>

                  {/* Text */}
                  <div className={`flex flex-col justify-center ${isImageLeft ? "order-2" : "order-1"}`}>
                    <div className="mb-4 flex items-center gap-3">
                      <span
                        className="select-none text-6xl font-black leading-none opacity-15"
                        style={{ color: step.accent }}
                      >
                        {step.label}
                      </span>
                      <div className="h-px flex-1 opacity-20" style={{ backgroundColor: step.accent }} />
                    </div>
                    <h2 className="serif-font mb-4 text-3xl font-bold text-stone-900 xl:text-4xl">
                      {step.title}
                    </h2>
                    <p className="mb-6 text-base leading-relaxed text-stone-600 xl:text-lg">
                      {step.description}
                    </p>
                    <BulletList bullets={step.bullets} accent={step.accent} />
                  </div>
                </div>

                {index < steps.length - 1 && <StepConnector />}
              </div>
            );
          })}
        </section>

        {/* CTA strip */}
        <section className="border-t border-stone-200 bg-white py-16 text-center">
          <h2 className="serif-font mb-4 text-3xl font-bold text-stone-900">
            Ready to try it yourself?
          </h2>
          <p className="mb-8 text-stone-500">
            Start building your digital wardrobe today — it only takes a minute.
          </p>
          <a
            href="/service/wardrobe"
            className="inline-block rounded-full bg-[#8B5E3C] px-10 py-3.5 text-sm font-semibold text-white shadow-md transition-all hover:bg-[#7a5235] hover:shadow-lg"
          >
            Get Started Free
          </a>
        </section>
      </main>
      <Footer />
    </div>
  );
}
