const HeroIntro = () => {
  return (
    <section className="w-full bg-[#f7f1e8]">
      <div className="mx-auto flex max-w-7xl flex-col items-center px-6 pt-12 pb-16 text-center text-[color:var(--foreground)]">
        <h1 className="serif-font text-5xl font-bold leading-tight md:text-7xl">
          Unlock Daily Outfit Online with <br />
          <span className="italic text-[#8B5E3C]">AI Magic</span>
        </h1>
        <p className="mt-6 max-w-xl text-lg text-stone-600">
          Experience the next generation of wardrobe outfit planning with YiYi AI.
          Elegant, fast, and remarkably accurate.
        </p>
      </div>
    </section>
  );
};

export default HeroIntro;
