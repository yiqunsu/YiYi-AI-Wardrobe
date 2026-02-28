import Navbar from "@/app/components/home/Navbar";
import Footer from "@/app/components/home/Footer";

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-[color:var(--background)] text-[color:var(--foreground)]">
      <Navbar />
      <main className="pt-20">
        <div className="mx-auto max-w-3xl px-6 py-24">
          <p className="mb-4 text-sm font-bold uppercase tracking-widest text-[#8B5E3C]">
            Contact
          </p>
          <h1 className="serif-font text-4xl md:text-5xl font-bold text-stone-900 mb-6">
            Get in Touch
          </h1>
          <p className="text-lg text-stone-600 mb-16 max-w-xl">
            Have a question, suggestion, or just want to say hello? We&apos;d love to
            hear from you. Fill out the form below or reach us directly by email.
          </p>

          <div className="grid md:grid-cols-2 gap-12">
            {/* Contact Info */}
            <div className="space-y-8">
              <div className="flex items-start gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#EDE0D4] text-[#8B5E3C]">
                  <span className="material-symbols-outlined text-xl">mail</span>
                </div>
                <div>
                  <p className="font-semibold text-stone-800 mb-1">Email</p>
                  <p className="text-stone-500 text-sm">hello@yiyi.ai</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#EDE0D4] text-[#8B5E3C]">
                  <span className="material-symbols-outlined text-xl">schedule</span>
                </div>
                <div>
                  <p className="font-semibold text-stone-800 mb-1">Response Time</p>
                  <p className="text-stone-500 text-sm">We aim to respond within 2 business days.</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#EDE0D4] text-[#8B5E3C]">
                  <span className="material-symbols-outlined text-xl">help</span>
                </div>
                <div>
                  <p className="font-semibold text-stone-800 mb-1">Feedback & Bug Reports</p>
                  <p className="text-stone-500 text-sm">
                    Found something broken or have an idea? Let us know — we read every message.
                  </p>
                </div>
              </div>
            </div>

            {/* Contact Form — static placeholder, no backend yet */}
            <div className="rounded-2xl border border-stone-200 bg-white p-8 shadow-sm">
              <p className="text-sm text-stone-400 mb-6 italic">
                Direct contact form coming soon. In the meantime, please email us directly.
              </p>
              <div className="space-y-4 opacity-50 pointer-events-none select-none">
                <input
                  type="text"
                  placeholder="Your name"
                  disabled
                  className="w-full rounded-lg border border-stone-200 px-4 py-3 text-sm text-stone-700 bg-stone-50"
                />
                <input
                  type="email"
                  placeholder="Your email"
                  disabled
                  className="w-full rounded-lg border border-stone-200 px-4 py-3 text-sm text-stone-700 bg-stone-50"
                />
                <textarea
                  placeholder="Your message"
                  disabled
                  rows={4}
                  className="w-full rounded-lg border border-stone-200 px-4 py-3 text-sm text-stone-700 bg-stone-50 resize-none"
                />
                <button
                  disabled
                  className="w-full py-3 rounded-xl bg-[#8B5E3C] text-white font-semibold cursor-not-allowed"
                >
                  Send Message
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
