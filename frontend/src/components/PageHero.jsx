export default function PageHero({ eyebrow, title, children }) {
  return (
    <header className="relative overflow-hidden px-6 pb-16 pt-40 sm:pb-24 sm:pt-52">
      <img
        src={`${import.meta.env.BASE_URL}building/night.jpg`}
        alt=""
        className="absolute inset-0 size-full object-cover object-[50%_40%] opacity-45"
      />
      <div className="absolute inset-0 bg-linear-to-b from-[#05060b]/40 via-[#05060b]/60 to-[#05060b]" />
      <div className="relative mx-auto max-w-6xl">
        <p className="eyebrow">{eyebrow}</p>
        <h1 className="mt-4 max-w-3xl text-5xl leading-[1.02] sm:text-7xl">{title}</h1>
        {children && <p className="mt-6 max-w-xl text-base leading-7 text-white/70">{children}</p>}
      </div>
    </header>
  );
}
