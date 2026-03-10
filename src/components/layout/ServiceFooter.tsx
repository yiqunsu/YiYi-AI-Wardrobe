/**
 * ServiceFooter [module: components / layout]
 * Thin footer strip shared across all /service/* pages,
 * displaying app version info or legal links.
 */
const ServiceFooter = () => {
  return (
    <footer className="w-full border-t border-stone-200">
      <div className="py-6 text-center text-[#857266] dark:text-[#b09b8e] text-xs font-medium mx-4 sm:mx-40">
        <p>© 2023 YiYi AI Fashion. Styled with love and AI magic.</p>
      </div>
    </footer>
  );
};

export default ServiceFooter;
