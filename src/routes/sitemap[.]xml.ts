import { createFileRoute } from "@tanstack/react-router";
import { courses } from "@/data/courses";
import { toAbsoluteUrl } from "@/lib/site";

export const Route = createFileRoute("/sitemap.xml")({
  server: {
    handlers: {
      GET: () => {
        const urls = [
          toAbsoluteUrl("/"),
          toAbsoluteUrl("/courses"),
          ...courses.map((course) => toAbsoluteUrl(`/courses/${course.slug}`)),
        ];
        const entries = urls
          .map((url) => `  <url><loc>${url}</loc></url>`)
          .join("\n");
        const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${entries}\n</urlset>`;

        return new Response(xml, {
          headers: { "content-type": "application/xml; charset=utf-8" },
        });
      },
    },
  },
});