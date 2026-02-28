import Navbar from "@/app/components/home/Navbar";
import Footer from "@/app/components/home/Footer";

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-[color:var(--background)] text-[color:var(--foreground)]">
      <Navbar />
      <main className="pt-20">
        <div className="mx-auto max-w-3xl px-6 py-24">
          <p className="mb-4 text-sm font-bold uppercase tracking-widest text-[#8B5E3C]">
            Legal
          </p>
          <h1 className="serif-font text-4xl md:text-5xl font-bold text-stone-900 mb-4">
            Terms of Service
          </h1>
          <p className="text-stone-500 mb-12">Last updated: February 2026</p>

          <div className="space-y-10 text-stone-600 leading-relaxed text-base">
            <section>
              <h2 className="serif-font text-xl font-bold text-stone-800 mb-3">1. Acceptance of Terms</h2>
              <p>
                By accessing or using YiYi AI (&quot;the Service&quot;), you agree to be bound by these
                Terms of Service. If you do not agree to these terms, please do not use the Service.
              </p>
            </section>

            <section>
              <h2 className="serif-font text-xl font-bold text-stone-800 mb-3">2. Description of Service</h2>
              <p>
                YiYi AI provides an AI-powered outfit planning platform that allows users to upload
                clothing images, receive outfit recommendations, and generate AI outfit visuals. The
                Service is provided &quot;as is&quot; and may be updated or modified at any time.
              </p>
            </section>

            <section>
              <h2 className="serif-font text-xl font-bold text-stone-800 mb-3">3. User Accounts</h2>
              <p>
                You are responsible for maintaining the confidentiality of your account credentials
                and for all activities that occur under your account. You agree to provide accurate
                information when creating an account and to notify us immediately of any unauthorized use.
              </p>
            </section>

            <section>
              <h2 className="serif-font text-xl font-bold text-stone-800 mb-3">4. User Content</h2>
              <p>
                You retain ownership of the images and content you upload to the Service. By uploading
                content, you grant YiYi AI a limited license to process and store your content solely
                for the purpose of providing the Service. We do not sell or share your personal content
                with third parties.
              </p>
            </section>

            <section>
              <h2 className="serif-font text-xl font-bold text-stone-800 mb-3">5. Acceptable Use</h2>
              <p>You agree not to:</p>
              <ul className="list-disc pl-6 mt-3 space-y-2">
                <li>Upload content that is illegal, harmful, or infringes on third-party rights</li>
                <li>Attempt to reverse-engineer, scrape, or abuse the Service</li>
                <li>Use the Service for any commercial purpose without express permission</li>
                <li>Share your account credentials with others</li>
              </ul>
            </section>

            <section>
              <h2 className="serif-font text-xl font-bold text-stone-800 mb-3">6. Service Limits</h2>
              <p>
                Free accounts are subject to usage limits including a maximum of 5 outfit generations
                per day and 50 wardrobe items. These limits may change over time as we introduce
                subscription plans.
              </p>
            </section>

            <section>
              <h2 className="serif-font text-xl font-bold text-stone-800 mb-3">7. Disclaimer of Warranties</h2>
              <p>
                The Service is provided without warranties of any kind. AI-generated recommendations
                are for informational and entertainment purposes and do not constitute professional
                styling advice. We make no guarantee of accuracy, completeness, or suitability of
                any AI-generated content.
              </p>
            </section>

            <section>
              <h2 className="serif-font text-xl font-bold text-stone-800 mb-3">8. Changes to Terms</h2>
              <p>
                We reserve the right to modify these terms at any time. Continued use of the Service
                after changes constitutes acceptance of the updated terms. We will make reasonable
                efforts to notify users of significant changes.
              </p>
            </section>

            <section>
              <h2 className="serif-font text-xl font-bold text-stone-800 mb-3">9. Contact</h2>
              <p>
                If you have questions about these Terms, please visit our{" "}
                <a href="/contact" className="text-[#8B5E3C] underline hover:opacity-80">
                  Contact page
                </a>.
              </p>
            </section>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
