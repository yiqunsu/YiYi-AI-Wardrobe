import Footer from "@/app/components/home/Footer";
import Navbar from "@/app/components/home/Navbar";
import Image from "next/image";
import Link from "next/link";

export default function ShowcasePage() {
  return (
    <div className="min-h-screen bg-[color:var(--background)] text-[color:var(--foreground)]">
      <Navbar />
      <main className="pt-20">
        <div className="mx-auto max-w-7xl px-6 py-24">
          <div className="text-center mb-16">
            <p className="mb-4 text-sm font-bold uppercase tracking-widest text-[#8B5E3C]">
              Showcase
            </p>
            <h1 className="serif-font text-4xl md:text-5xl font-bold text-stone-900 mb-6">
              See YiYi AI in action
            </h1>
            <p className="text-lg text-stone-600 max-w-2xl mx-auto">
              Explore what creators and brands are building with YiYi AI.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                title: "Virtual Try-On",
                description:
                  "See how outfits look on you before you buy. Powered by YiYi AI.",
                image: "/images/room.webp",
              },
              {
                title: "Daily Styling",
                description:
                  "Get personalized outfit suggestions based on occasion and weather.",
                image: "/images/yiyi.webp",
              },
              {
                title: "Wardrobe Organizer",
                description:
                  "Manage your digital closet and discover new outfit combinations.",
                image: "/images/yiyi_profile_photo.webp",
              },
            ].map((item) => (
              <div
                key={item.title}
                className="group rounded-2xl border border-stone-200 bg-white overflow-hidden shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="aspect-video relative bg-[#EDE0D4]">
                  <Image
                    src={item.image}
                    alt={item.title}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </div>
                <div className="p-6">
                  <h3 className="serif-font text-xl font-bold text-stone-900 mb-2">
                    {item.title}
                  </h3>
                  <p className="text-stone-600">{item.description}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-16 text-center rounded-2xl border border-dashed border-[#C9B89C] bg-[#EDE0D4]/30 p-12">
            <span className="material-symbols-outlined text-4xl text-[#8B4513]/50 mb-4 block">
              auto_awesome
            </span>
            <h3 className="font-bold text-stone-900 mb-2">Built something with YiYi?</h3>
            <p className="text-stone-600 mb-6 max-w-md mx-auto">
              Share your project and get featured in our showcase.
            </p>
            <Link
              href="#"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl border-2 border-[#8B5E3C] text-[#8B5E3C] font-semibold hover:bg-[#8B5E3C] hover:text-white transition-colors"
            >
              Submit Project
              <span className="material-symbols-outlined">arrow_forward</span>
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
