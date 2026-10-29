import DOMPurify from "dompurify";

export default function StoryBody({ html }) {
  if (!html) return null;
  const safeHtml = DOMPurify.sanitize(html, { USE_PROFILES: { html: true } });
  return <div className="prose prose-neutral max-w-none dark:prose-invert" dangerouslySetInnerHTML={{ __html: safeHtml }} />;
}
