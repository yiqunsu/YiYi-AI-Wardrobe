/**
 * TrialInviteSection [module: components / home]
 * Homepage conversion section inviting visitors to try the app,
 * featuring a sign-up or get-started call-to-action.
 */
import Image from "next/image";
import Link from "next/link";

const TrialInviteSection = () => {
  return (
    <section className="w-full bg-[#f7f1e8] flex-1 flex items-center justify-center p-6 md:p-12">
      {/* Hero Invitation Module */}
      <div className="max-w-[1100px] w-full bg-cream dark:bg-[#1c1616] rounded-xl manga-border lace-pattern p-8 md:p-16 flex flex-col md:flex-row items-center gap-12 overflow-hidden relative">
        {/* Left Content Area */}
        <div className="flex-1 z-10 space-y-8">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold uppercase tracking-widest">
            <span className="material-symbols-outlined text-sm">magic_button</span>
            Next-Gen Fashion AI
          </div>

          {/* Title and Description */}
          <div className="space-y-4">
            <h1 className="text-chocolate dark:text-cream text-5xl md:text-6xl font-black leading-[1.1] tracking-tighter">
              Generate Your <br />Style with{" "}
              <span className="text-primary">YiYi AI</span>
            </h1>
            <p className="text-chocolate/70 dark:text-cream/70 text-lg font-medium leading-relaxed max-w-[480px] font-body">
              Step into a world of endless fashion possibilities. Your personal
              AI Wardrobe Manager is ready to help.
            </p>
          </div>

          {/* Buttons */}
          <div className="flex flex-wrap items-center gap-6">
            <Link href="/service/create" className="flex min-w-[180px] cursor-pointer items-center justify-center rounded-xl h-14 px-8 bg-chocolate text-cream text-base font-extrabold shadow-xl hover:scale-105 transition-transform">
              Try For Free
            </Link>
            <Link
              href="/showcase"
              className="flex items-center gap-2 text-chocolate dark:text-cream font-bold text-base hover:text-primary transition-colors"
            >
              Learn More
              <span className="material-symbols-outlined">arrow_forward</span>
            </Link>
          </div>

          {/* Decorative elements */}
          <div className="pt-8 flex items-center gap-8 opacity-40">
            <span className="material-symbols-outlined text-3xl">apparel</span>
            <span className="material-symbols-outlined text-3xl">content_cut</span>
            <span className="material-symbols-outlined text-3xl">draw</span>
          </div>
        </div>

        {/* Right Illustration Area */}
        <div className="relative flex-1 w-full max-w-[450px] aspect-square flex items-center justify-center">
          {/* The Background Circle Decor */}
          <div className="absolute inset-0 bg-primary/5 rounded-full scale-110 animate-pulse"></div>

          {/* Main Mascot Image */}
          <div
            className="relative z-20 w-full h-full bg-center bg-no-repeat bg-contain transform hover:rotate-2 transition-transform duration-500"
            style={{
              backgroundImage: "url('/images/yiyi.webp')",
            }}
          />

          {/* Floating Card */}
          <div className="absolute -bottom-4 -left-4 bg-vanilla dark:bg-[#1c1616] p-4 rounded-lg shadow-2xl border border-chocolate/10 z-30 max-w-[200px]">
            <div className="flex items-center gap-2 mb-2">
              <span className="material-symbols-outlined text-primary">stars</span>
              <span className="text-[10px] font-black uppercase tracking-tighter">
                Personal Stylist
              </span>
            </div>
            <p className="text-xs italic text-chocolate/80 dark:text-cream/80">
              &quot;Hello! Ready to discover your perfect outfit today?&quot;
            </p>
          </div>

          {/* Sparkle accents */}
          <div className="absolute top-10 right-10 z-30 text-primary">
            <span className="material-symbols-outlined text-4xl animate-bounce">
              flare
            </span>
          </div>
          <div className="absolute bottom-20 right-0 z-30 text-primary/40">
            <span className="material-symbols-outlined text-2xl">
              auto_fix_high
            </span>
          </div>
        </div>

        {/* Abstract Corner Decor */}
        <div className="absolute -top-10 -right-10 w-40 h-40 bg-primary/10 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-chocolate/10 rounded-full blur-3xl"></div>
      </div>
    </section>
  );
};

export default TrialInviteSection;
