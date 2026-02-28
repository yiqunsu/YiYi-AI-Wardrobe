import Navbar from "@/app/components/home/Navbar";
import Footer from "@/app/components/home/Footer";

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-[color:var(--background)] text-[color:var(--foreground)]">
      <Navbar />
      <main className="pt-20">
        <div className="mx-auto max-w-3xl px-6 py-24">
          <p className="mb-4 text-sm font-bold uppercase tracking-widest text-[#8B5E3C]">
            About
          </p>
          <h1 className="serif-font text-4xl md:text-5xl font-bold text-stone-900 mb-8">
            About YiYi AI
          </h1>

          <div className="prose prose-stone max-w-none space-y-8 text-stone-600 leading-relaxed text-lg">
            <p>
              YiYi AI is an AI-powered outfit planning platform that helps you make the most
              of your wardrobe every day. By combining your personal clothing collection,
              real-time weather data, and the reasoning capabilities of large language models,
              YiYi AI generates personalized outfit recommendations tailored to your occasion,
              style, and environment.
            </p>

            <h2 className="serif-font text-2xl font-bold text-stone-800 mt-10">Our Mission</h2>
            <p>
              We believe that getting dressed should be effortless and expressive. Our mission
              is to use AI to remove the daily friction of outfit planning, while helping people
              discover their personal style more deeply over time.
            </p>

            <h2 className="serif-font text-2xl font-bold text-stone-800 mt-10">What We Build</h2>
            <ul className="list-disc pl-6 space-y-3">
              <li>A smart wardrobe system that analyzes and tags your clothing items automatically</li>
              <li>Weather-aware daily outfit recommendations using live weather data</li>
              <li>AI-generated outfit images that visualize your look before you wear it</li>
              <li>A history of all your past outfits, so you can revisit and refine your style</li>
            </ul>

            <h2 className="serif-font text-2xl font-bold text-stone-800 mt-10">Technology</h2>
            <p>
              YiYi AI is built on top of Google Gemini for language and image generation,
              Supabase for secure data storage and authentication, and vector embeddings for
              semantic wardrobe search. Our stack is designed to be fast, reliable, and private-first.
            </p>

            <h2 className="serif-font text-2xl font-bold text-stone-800 mt-10">Contact</h2>
            <p>
              Have questions or feedback? We&apos;d love to hear from you. Visit our{" "}
              <a href="/contact" className="text-[#8B5E3C] underline hover:opacity-80">
                Contact page
              </a>{" "}
              to get in touch.
            </p>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
