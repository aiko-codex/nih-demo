import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Carousel, CarouselContent, CarouselItem } from "@/components/ui/carousel";
import MediaSlide from "@/features/block/MediaSlide";

function ArrowButton({ label, onClick, children }) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className="glass-panel grid size-10 place-items-center rounded-full text-white/85 transition-colors
        hover:text-white"
    >
      {children}
    </button>
  );
}

function EmptyGallery() {
  return (
    <div className="relative size-full min-h-64">
      <img
        src={`${import.meta.env.BASE_URL}building/night.jpg`}
        alt=""
        className="absolute inset-0 size-full object-cover opacity-60"
      />
      <div className="absolute inset-0 bg-linear-to-t from-[#05060b] via-transparent" />
      <p className="absolute bottom-6 left-6 text-sm text-white/60">Stories for this window are coming soon.</p>
    </div>
  );
}

export default function MediaGallery({ media = [] }) {
  const [carouselApi, setCarouselApi] = useState(null);
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    if (!carouselApi) return undefined;
    const updateIndex = () => setActiveIndex(carouselApi.selectedScrollSnap());
    updateIndex();
    carouselApi.on("select", updateIndex);
    return () => carouselApi.off("select", updateIndex);
  }, [carouselApi]);

  if (!media.length) return <EmptyGallery />;

  const caption = media[activeIndex]?.caption;
  const hasMany = media.length > 1;

  return (
    <div className="relative size-full min-h-64">
      <Carousel setApi={setCarouselApi} className="size-full [&>div]:h-full">
        <CarouselContent className="ml-0 h-full">
          {media.map((item) => (
            <CarouselItem key={item.id} className="h-full pl-0">
              <MediaSlide item={item} />
            </CarouselItem>
          ))}
        </CarouselContent>
      </Carousel>

      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-40 bg-linear-to-t from-black/80 to-transparent" />
      <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-4 p-5 sm:p-6">
        <div className="min-w-0">
          {hasMany && (
            <p className="font-mono text-xs text-white/60">
              {String(activeIndex + 1).padStart(2, "0")} / {String(media.length).padStart(2, "0")}
            </p>
          )}
          {caption && <p className="mt-1 line-clamp-2 text-sm text-white/85">{caption}</p>}
        </div>
        {hasMany && (
          <div className="flex shrink-0 gap-2">
            <ArrowButton label="Previous" onClick={() => carouselApi?.scrollPrev()}>
              <ChevronLeft className="size-4" />
            </ArrowButton>
            <ArrowButton label="Next" onClick={() => carouselApi?.scrollNext()}>
              <ChevronRight className="size-4" />
            </ArrowButton>
          </div>
        )}
      </div>
      {hasMany && (
        <div className="absolute left-5 right-16 top-5 flex gap-1.5 sm:left-6">
          {media.map((item, index) => (
            <button
              key={item.id}
              type="button"
              aria-label={`Show slide ${index + 1}`}
              aria-current={index === activeIndex ? "true" : undefined}
              onClick={() => carouselApi?.scrollTo(index)}
              className={`h-0.5 flex-1 rounded-full transition-colors ${
                index === activeIndex ? "bg-white" : "bg-white/25 hover:bg-white/50"
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
