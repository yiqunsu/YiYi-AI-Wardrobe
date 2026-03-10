/**
 * Marketing homepage [module: marketing / landing page]
 * Assembles the Hero, HowToUse, and TrialInvite sections into the public-facing landing page.
 */
import Footer from "@/components/layout/Footer";
import HeroIntro from "@/components/home/HeroIntro";
import HowToUseSection from "@/components/home/HowToUseSection";
import Navbar from "@/components/layout/Navbar";
import TrialInviteSection from "@/components/home/TrialInviteSection";

export default function Home() {
  return (
    <div className="min-h-screen bg-[color:var(--background)] text-[color:var(--foreground)]">
      <Navbar />
      <main className="flex flex-col gap-0 pb-0 pt-20">
        <HeroIntro />
        <TrialInviteSection />
        <HowToUseSection />
      </main>
      <Footer />
    </div>
  );
}
