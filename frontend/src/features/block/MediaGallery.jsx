import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";

function embedSource(media) {
  const url = media.embedUrl || media.url || "";
  try {
    const parsed = new URL(url);
    if (parsed.hostname.includes("youtu.be")) return `https://www.youtube-nocookie.com/embed/${parsed.pathname.slice(1)}`;
    if (parsed.hostname.includes("youtube.com")) return `https://www.youtube-nocookie.com/embed/${parsed.searchParams.get("v") || parsed.pathname.split("/").pop()}`;
    if (parsed.hostname.includes("vimeo.com")) return `https://player.vimeo.com/video/${parsed.pathname.split("/").filter(Boolean).pop()}`;
  } catch { return ""; }
  return "";
}

export default function MediaGallery({ media = [] }) {
  if (!media.length) return null;
  return <Carousel className="w-full"><CarouselContent>{media.map((item) => <CarouselItem key={item.id}>
    <figure className="space-y-2">{item.kind === "image" ? <img className="aspect-video w-full rounded-xl border object-cover" src={item.url} alt={item.caption || ""} /> : item.kind === "video" ? <video className="aspect-video w-full rounded-xl border bg-black object-contain" src={item.url} controls playsInline /> : <iframe className="aspect-video w-full rounded-xl border" src={embedSource(item)} title={item.caption || "Embedded video"} allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowFullScreen />}{item.caption && <figcaption className="text-sm text-muted-foreground">{item.caption}</figcaption>}</figure>
  </CarouselItem>)}</CarouselContent>{media.length > 1 && <><CarouselPrevious /><CarouselNext /></>}</Carousel>;
}
