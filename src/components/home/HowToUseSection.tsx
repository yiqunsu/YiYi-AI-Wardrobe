/**
 * HowToUseSection [module: components / home]
 * Homepage "How it works" section explaining the three-step outfit generation workflow
 * with illustrated step cards.
 */
import Image from "next/image";

const steps = [
  {
    icon: "file_upload",
    title: "Build Your Digital Wardrobe",
    description:
      "Upload photos of your clothes. YiYi organizes them into your virtual closet for easy browsing.",
  },
  {
    icon: "person_outline",
    title: "Share Your Plans",
    description:
      "Tell YiYi the occasion, time, and location. Let AI analyze the perfect look for your schedule.",
  },
  {
    icon: "auto_awesome",
    title: "Magic OOTD Preview",
    description:
      "See the selected outfit on you instantly. One photo to visualize your perfect daily style.",
  },
];

const howToUseImages = [
  "/images/room.webp",
  "/images/yiyi_profile_photo.webp",
  "/images/yiyi.webp",
  "/images/room.webp",
];

const HowToUseSection = () => {
  return (
    <section id="how-to-use" className="w-full bg-stone-50 py-24">
      <div className="mx-auto max-w-7xl px-6">
        <div className="mb-20 text-center">
          <p className="mb-4 text-sm font-bold uppercase tracking-widest text-[#8B5E3C]">
            How to use
          </p>
          <h2 className="serif-font mb-6 text-4xl font-bold text-stone-900 md:text-5xl">
            Create your look in seconds
          </h2>
          <p className="text-stone-600">
            Online outfit fitting and styling made simple with YiYi AI.
          </p>
        </div>
        <div className="grid items-center gap-16 lg:grid-cols-2">
          <div className="space-y-12">
            {steps.map((step, index) => (
              <div key={index} className="group flex gap-6">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white shadow-md text-[#8B5E3C] transition-all group-hover:bg-[#8B5E3C] group-hover:text-white">
                  <span className="material-icons-outlined">{step.icon}</span>
                </div>
                <div>
                  <h3 className="mb-2 text-xl font-bold">{step.title}</h3>
                  <p className="leading-relaxed text-stone-600">
                    {step.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
          <div className="relative overflow-hidden rounded-xl border border-[#C4A484]/10 bg-[#C4A484]/5 p-8">
            <div className="grid grid-cols-2 gap-4">
              {/* 左列图片 */}
              <div className="space-y-4">
                <div className="relative h-40 rounded-xl overflow-hidden bg-white">
                  {howToUseImages[0] ? (
                    <Image
                      src={howToUseImages[0]}
                      alt="Step 1 illustration"
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 100vw, 50vw"
                    />
                  ) : (
                    <div className="h-full w-full animate-pulse bg-gray-200"></div>
                  )}
                </div>
                <div className="relative h-40 rounded-xl overflow-hidden bg-white">
                  {howToUseImages[1] ? (
                    <Image
                      src={howToUseImages[1]}
                      alt="Step 2 illustration"
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 100vw, 50vw"
                    />
                  ) : (
                    <div className="h-full w-full animate-pulse bg-gray-200"></div>
                  )}
                </div>
              </div>
              {/* 右列图片（带偏移） */}
              <div className="space-y-4 pt-12">
                <div className="relative h-40 rounded-xl overflow-hidden bg-white">
                  {howToUseImages[2] ? (
                    <Image
                      src={howToUseImages[2]}
                      alt="Step 3 illustration"
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 100vw, 50vw"
                    />
                  ) : (
                    <div className="h-full w-full animate-pulse bg-gray-200"></div>
                  )}
                </div>
                <div className="relative h-40 rounded-xl overflow-hidden bg-white">
                  {howToUseImages[3] ? (
                    <Image
                      src={howToUseImages[3]}
                      alt="Step 4 illustration"
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 100vw, 50vw"
                    />
                  ) : (
                    <div className="h-full w-full animate-pulse bg-gray-200"></div>
                  )}
                </div>
              </div>
            </div>
            <div className="absolute -bottom-10 -right-10 h-40 w-40 rounded-full bg-[#8B5E3C]/20 blur-3xl"></div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HowToUseSection;
