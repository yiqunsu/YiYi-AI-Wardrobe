/**
 * Footer [module: components / layout]
 * Marketing site footer shared across all public pages.
 * Contains logo, navigation links, social links, and copyright notice.
 */
import Image from "next/image";
import Link from "next/link";

const Footer = () => {
  return (
    <footer className="w-full bg-stone-950 py-10 px-6 text-stone-300">
      <div className="mx-auto max-w-7xl">
        <div className="mb-16 grid gap-12 md:grid-cols-4">
          <div className="col-span-2 space-y-6">
            <div className="flex items-center gap-2">
              <div className="relative h-8 w-8 overflow-hidden rounded-lg">
                <Image
                  src="/images/yiyi_profile_photo.webp"
                  alt="YiYi AI Logo"
                  fill
                  className="object-cover"
                  sizes="32px"
                />
              </div>
              <span className="serif-font text-xl font-bold text-white">
                YiYi AI
              </span>
            </div>
            <p className="max-w-xs leading-relaxed text-stone-500">
              Leading the frontier of AI fashion and virtual wardrobe technology.
              Creating beauty with code.
            </p>
            <div className="flex gap-4">
              <span
                title="Coming soon"
                className="flex h-10 w-10 cursor-not-allowed items-center justify-center rounded-full bg-stone-900 text-stone-600"
              >
                <span className="material-icons-outlined text-sm">facebook</span>
              </span>
              <span
                title="Coming soon"
                className="flex h-10 w-10 cursor-not-allowed items-center justify-center rounded-full bg-stone-900 text-stone-600 text-xs font-bold"
              >
                X
              </span>
              <span
                title="Coming soon"
                className="flex h-10 w-10 cursor-not-allowed items-center justify-center rounded-full bg-stone-900 text-stone-600"
              >
                <span className="material-icons-outlined text-sm">
                  alternate_email
                </span>
              </span>
            </div>
          </div>
          <div>
            <h4 className="mb-6 font-bold text-white">Company</h4>
            <ul className="space-y-4 text-stone-500">
              <li>
                <Link href="/about" className="transition-colors hover:text-[#8B5E3C]">
                  About Us
                </Link>
              </li>
              <li>
                <Link href="/terms" className="transition-colors hover:text-[#8B5E3C]">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="transition-colors hover:text-[#8B5E3C]">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/contact" className="transition-colors hover:text-[#8B5E3C]">
                  Contact
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="mb-6 font-bold text-white">Resources</h4>
            <ul className="space-y-4 text-stone-500">
              <li>
                <Link href="/blog" className="transition-colors hover:text-[#8B5E3C]">
                  Blog & Tutorial
                </Link>
              </li>
            </ul>
          </div>
        </div>
        <div className="flex flex-col items-center justify-between gap-4 border-t border-stone-900 pt-8 text-sm text-stone-600 md:flex-row">
          <p>© 2026 YiYi AI. All rights reserved.</p>
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2 text-stone-600">
              <span className="material-icons-outlined text-sm">language</span>
              <span>English</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
