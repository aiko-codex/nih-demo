function embedSource(media) {
  const url = media.embedUrl || media.url || "";
  try {
    const parsed = new URL(url);
    if (parsed.hostname.includes("youtu.be")) {
      return `https://www.youtube-nocookie.com/embed/${parsed.pathname.slice(1)}`;
    }
    if (parsed.hostname.includes("youtube.com")) {
      const videoId = parsed.searchParams.get("v") || parsed.pathname.split("/").pop();
      return `https://www.youtube-nocookie.com/embed/${videoId}`;
    }
    if (parsed.hostname.includes("vimeo.com")) {
      return `https://player.vimeo.com/video/${parsed.pathname.split("/").filter(Boolean).pop()}`;
    }
  } catch {
    return "";
  }
  return "";
}

export default function MediaSlide({ item }) {
  if (item.kind === "image") {
    return <img className="size-full object-cover" src={item.url} alt={item.caption || ""} />;
  }
  if (item.kind === "video") {
    return <video className="size-full bg-black object-contain" src={item.url} controls playsInline />;
  }
  return (
    <iframe
      className="size-full bg-black"
      src={embedSource(item)}
      title={item.caption || "Embedded video"}
      allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
      allowFullScreen
    />
  );
}
