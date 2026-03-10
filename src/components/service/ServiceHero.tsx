/**
 * ServiceHero [module: components / service]
 * Hero banner at the top of the /service/create page with the section
 * title, subtitle, and a brief description of the AI outfit generator.
 */
const ServiceHero = () => {
  return (
    <div className="flex flex-col gap-1">
      <h1 className="text-[#5a3a1b] dark:text-[#5a3a1b] text-4xl font-black leading-tight tracking-[-0.033em]">
        Design Your Moment
      </h1>
      <p className="text-[#5a3a1b] dark:text-[#5a3a1b] text-lg font-medium italic">
        "Ready to create your perfect look?"
      </p>
    </div>
  );
};

export default ServiceHero;
