/**
 * Blog page [module: marketing / content]
 * Lists blog articles and updates about AI styling and the YiYi platform.
 */
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";

export default function BlogPage() {
  return (
    <div className="min-h-screen bg-[color:var(--background)] text-[color:var(--foreground)]">
      <Navbar />
      <main className="pt-20">
        <div className="mx-auto max-w-7xl px-6 py-24 text-center">
          <p className="mb-4 text-sm font-bold uppercase tracking-widest text-[#8B5E3C]">
            Blog & Tutorial
          </p>
          <h1 className="serif-font text-4xl md:text-5xl font-bold text-stone-900 mb-6">
            Coming Soon
          </h1>
          <p className="text-lg text-stone-600 max-w-xl mx-auto mb-16">
            We&apos;re working on guides, style tips, and behind-the-scenes posts about how
            YiYi AI works. Check back soon.
          </p>

          <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-[#EDE0D4] text-[#8B5E3C] mb-8">
            <span className="material-symbols-outlined text-5xl">article</span>
          </div>

          <div className="mt-12 grid md:grid-cols-3 gap-6 max-w-4xl mx-auto opacity-40 pointer-events-none select-none">
            {["Style Tips for Every Season", "How AI Reads Your Wardrobe", "Building Your Capsule Closet"].map(
              (title) => (
                <div
                  key={title}
                  className="rounded-2xl border border-stone-200 bg-white p-6 text-left shadow-sm"
                >
                  <div className="h-32 rounded-xl bg-[#EDE0D4] mb-4" />
                  <p className="text-xs font-semibold uppercase tracking-widest text-stone-400 mb-2">
                    Coming soon
                  </p>
                  <h3 className="serif-font font-bold text-stone-800">{title}</h3>
                </div>
              )
            )}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
