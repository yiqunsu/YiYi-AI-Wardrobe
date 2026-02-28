import Navbar from "@/app/components/home/Navbar";
import Footer from "@/app/components/home/Footer";

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-[color:var(--background)] text-[color:var(--foreground)]">
      <Navbar />
      <main className="pt-20">
        <div className="mx-auto max-w-3xl px-6 py-24">
          <p className="mb-4 text-sm font-bold uppercase tracking-widest text-[#8B5E3C]">
            Legal
          </p>
          <h1 className="serif-font text-4xl md:text-5xl font-bold text-stone-900 mb-4">
            Privacy Policy
          </h1>
          <p className="text-stone-500 mb-12">Last updated: February 2026</p>

          <div className="space-y-10 text-stone-600 leading-relaxed text-base">
            <section>
              <h2 className="serif-font text-xl font-bold text-stone-800 mb-3">1. Information We Collect</h2>
              <p>When you use YiYi AI, we collect the following types of information:</p>
              <ul className="list-disc pl-6 mt-3 space-y-2">
                <li><strong>Account information:</strong> Your email address and display name when you register</li>
                <li><strong>Wardrobe content:</strong> Images and metadata of clothing items you upload</li>
                <li><strong>Usage data:</strong> Outfit generation history, selected items, and occasion preferences</li>
                <li><strong>Location data:</strong> City-level location you voluntarily provide for weather-based recommendations (not stored persistently)</li>
              </ul>
            </section>

            <section>
              <h2 className="serif-font text-xl font-bold text-stone-800 mb-3">2. How We Use Your Information</h2>
              <p>We use the information we collect to:</p>
              <ul className="list-disc pl-6 mt-3 space-y-2">
                <li>Provide and improve the outfit recommendation service</li>
                <li>Generate AI-based outfit suggestions using your wardrobe data</li>
                <li>Maintain your outfit history and preferences</li>
                <li>Authenticate your account and ensure service security</li>
              </ul>
            </section>

            <section>
              <h2 className="serif-font text-xl font-bold text-stone-800 mb-3">3. Data Storage & Security</h2>
              <p>
                Your data is stored securely using Supabase, which is hosted on AWS infrastructure.
                All data transmission is encrypted via HTTPS. Wardrobe images are stored in private
                storage buckets and are only accessible to your account. We apply Row Level Security
                to ensure strict data isolation between users.
              </p>
            </section>

            <section>
              <h2 className="serif-font text-xl font-bold text-stone-800 mb-3">4. Third-Party Services</h2>
              <p>We use the following third-party services to operate YiYi AI:</p>
              <ul className="list-disc pl-6 mt-3 space-y-2">
                <li><strong>Google Gemini API</strong> — for AI analysis of clothing images and outfit generation. Images may be temporarily processed by Google&apos;s servers.</li>
                <li><strong>OpenWeather API</strong> — for fetching weather conditions based on the location you provide</li>
                <li><strong>Supabase</strong> — for database, authentication, and file storage</li>
              </ul>
              <p className="mt-3">
                Each provider has their own privacy policy. We only share the minimum data necessary
                for each service to function.
              </p>
            </section>

            <section>
              <h2 className="serif-font text-xl font-bold text-stone-800 mb-3">5. Data Retention</h2>
              <p>
                Your account data and wardrobe content are retained as long as your account is active.
                You may delete individual wardrobe items or request full account deletion at any time
                by contacting us.
              </p>
            </section>

            <section>
              <h2 className="serif-font text-xl font-bold text-stone-800 mb-3">6. Your Rights</h2>
              <p>You have the right to:</p>
              <ul className="list-disc pl-6 mt-3 space-y-2">
                <li>Access the data we hold about you</li>
                <li>Request deletion of your account and associated data</li>
                <li>Export your wardrobe data</li>
              </ul>
              <p className="mt-3">
                To exercise these rights, please contact us via our{" "}
                <a href="/contact" className="text-[#8B5E3C] underline hover:opacity-80">
                  Contact page
                </a>.
              </p>
            </section>

            <section>
              <h2 className="serif-font text-xl font-bold text-stone-800 mb-3">7. Changes to This Policy</h2>
              <p>
                We may update this Privacy Policy from time to time. We will notify users of
                material changes by updating the date at the top of this page. Your continued
                use of the Service constitutes acceptance of the updated policy.
              </p>
            </section>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
