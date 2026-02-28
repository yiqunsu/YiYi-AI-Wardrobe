import Image from "next/image";

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
              Leading the frontier of AI fashion and manga-style virtual try-on
              technology. Creating beauty with code.
            </p>
            <div className="flex gap-4">
              <a
                href="#"
                className="flex h-10 w-10 items-center justify-center rounded-full bg-stone-900 transition-colors hover:bg-[#8B5E3C]"
              >
                <span className="material-icons-outlined text-sm">facebook</span>
              </a>
              <a
                href="#"
                className="flex h-10 w-10 items-center justify-center rounded-full bg-stone-900 text-xs font-bold transition-colors hover:bg-[#8B5E3C]"
              >
                X
              </a>
              <a
                href="#"
                className="flex h-10 w-10 items-center justify-center rounded-full bg-stone-900 transition-colors hover:bg-[#8B5E3C]"
              >
                <span className="material-icons-outlined text-sm">
                  alternate_email
                </span>
              </a>
            </div>
          </div>
          <div>
            <h4 className="mb-6 font-bold text-white">Company</h4>
            <ul className="space-y-4 text-stone-500">
              <li>
                <a
                  href="#"
                  className="transition-colors hover:text-[#8B5E3C]"
                >
                  About Us
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="transition-colors hover:text-[#8B5E3C]"
                >
                  Terms of Service
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="transition-colors hover:text-[#8B5E3C]"
                >
                  Privacy Policy
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="transition-colors hover:text-[#8B5E3C]"
                >
                  Contact
                </a>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="mb-6 font-bold text-white">Resources</h4>
            <ul className="space-y-4 text-stone-500">
              <li>
                <a
                  href="#"
                  className="transition-colors hover:text-[#8B5E3C]"
                >
                  Blog & Tutorial
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="transition-colors hover:text-[#8B5E3C]"
                >
                  API Docs
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="transition-colors hover:text-[#8B5E3C]"
                >
                  Design Kit
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="transition-colors hover:text-[#8B5E3C]"
                >
                  Guidelines
                </a>
              </li>
            </ul>
          </div>
        </div>
        <div className="flex flex-col items-center justify-between gap-4 border-t border-stone-900 pt-8 text-sm text-stone-600 md:flex-row">
          <p>© 2025 YiYi AI JSC. All rights reserved.</p>
          <div className="flex items-center gap-6">
            <div className="flex cursor-pointer items-center gap-2 transition-colors hover:text-white">
              <span className="material-icons-outlined text-sm">language</span>
              <span>English</span>
              <span className="material-icons-outlined text-xs">expand_more</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
