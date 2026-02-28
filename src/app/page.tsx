import Footer from "@/app/components/home/Footer";
import HeroIntro from "@/app/components/home/HeroIntro";
import HowToUseSection from "@/app/components/home/HowToUseSection";
import Navbar from "@/app/components/home/Navbar";
import TrialInviteSection from "@/app/components/home/TrialInviteSection";

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
