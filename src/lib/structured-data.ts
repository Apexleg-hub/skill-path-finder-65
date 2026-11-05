import type { Course } from "@/data/courses";
import logo from "@/assets/corepoint-tech.jpg";
import { SITE_URL, toAbsoluteUrl } from "@/lib/site";

export const ORGANIZATION_ID = `${SITE_URL}/#organization`;
export const WEBSITE_ID = `${SITE_URL}/#website`;

type SchemaNode = Record<string, unknown>;

type BreadcrumbItem = {
  name: string;
  url: string;
};

type PageSchemaOptions = {
  name: string;
  url: string;
  description: string;
  breadcrumbs?: BreadcrumbItem[];
  entities?: SchemaNode[];
  image?: string;
  includeWebsite?: boolean;
};

export const organizationSchema = (): SchemaNode => ({
  "@type": "EducationalOrganization",
  "@id": ORGANIZATION_ID,
  name: "Corepoint Tech Academy",
  url: SITE_URL,
  logo: toAbsoluteUrl(logo),
  description:
    "Practical, instructor-led technology training with one-on-one and cohort classes, real projects, and working professionals as trainers.",
  email: "info@corepointtech.com.ng",
  telephone: "+234 911 575 1406",
  address: [
    {
      "@type": "PostalAddress",
      addressLocality: "Somolu",
      addressRegion: "Lagos State",
      addressCountry: "NG",
    },
    {
      "@type": "PostalAddress",
      streetAddress: "20 Church Street, Atala Adesan Road",
      addressLocality: "Mowe",
      addressRegion: "Ogun State",
      addressCountry: "NG",
    },
  ],
});

export const websiteSchema = (): SchemaNode => ({
  "@type": "WebSite",
  "@id": WEBSITE_ID,
  url: SITE_URL,
  name: "Corepoint Tech Academy",
  publisher: { "@id": ORGANIZATION_ID },
});

export const webpageSchema = ({
  name,
  url,
  description,
  image,
}: Omit<PageSchemaOptions, "breadcrumbs" | "entities">): SchemaNode => ({
  "@type": "WebPage",
  "@id": `${url}#webpage`,
  url,
  name,
  description,
  ...(image ? { primaryImageOfPage: { "@type": "ImageObject", url: image } } : {}),
  isPartOf: { "@id": WEBSITE_ID },
  publisher: { "@id": ORGANIZATION_ID },
});

export const breadcrumbSchema = (items: BreadcrumbItem[], pageUrl: string): SchemaNode => ({
  "@type": "BreadcrumbList",
  "@id": `${pageUrl}#breadcrumb`,
  itemListElement: items.map((item, index) => ({
    "@type": "ListItem",
    position: index + 1,
    name: item.name,
    item: item.url,
  })),
});

export const courseSchema = (course: Course, url: string): SchemaNode => ({
  "@type": "Course",
  "@id": `${url}#course`,
  name: course.title,
  description: course.summary,
  url,
  ...(course.image ? { image: toAbsoluteUrl(course.image) } : {}),
  educationalLevel: course.level,
  ...(course.schemaDuration ? { timeRequired: course.schemaDuration } : {}),
  ...(course.outcomes.length ? { teaches: course.outcomes } : {}),
  provider: { "@id": ORGANIZATION_ID },
});

type ScheduledCourseSchemaOptions = {
  name: string;
  description: string;
  url: string;
  image?: string | null;
  courseMode?: string | string[];
  startDate?: string | null;
  endDate?: string | null;
  price?: number | null;
};

export const scheduledCourseSchema = ({
  name,
  description,
  url,
  image,
  courseMode,
  startDate,
  endDate,
  price,
}: ScheduledCourseSchemaOptions): SchemaNode => ({
  "@type": "Course",
  "@id": `${url}#course`,
  name,
  description,
  url,
  ...(image ? { image: toAbsoluteUrl(image) } : {}),
  provider: { "@id": ORGANIZATION_ID },
  hasCourseInstance: {
    "@type": "CourseInstance",
    ...(courseMode ? { courseMode } : {}),
    ...(startDate ? { startDate } : {}),
    ...(endDate ? { endDate } : {}),
    ...(price != null ? { offers: { "@type": "Offer", price, priceCurrency: "NGN", url } } : {}),
  },
});

type ArticleSchemaOptions = {
  title: string;
  description: string;
  url: string;
  image?: string | null;
  author?: string | null;
  authorType?: "Organization" | "Person";
  datePublished?: string | null;
  dateModified?: string | null;
};

const toIsoDate = (date: string | null | undefined) => {
  if (!date) return undefined;
  const parsedDate = new Date(date);
  return Number.isNaN(parsedDate.getTime()) ? undefined : parsedDate.toISOString();
};

export const articleSchema = ({
  title,
  description,
  url,
  image,
  author,
  authorType,
  datePublished,
  dateModified,
}: ArticleSchemaOptions): SchemaNode => {
  return {
    "@type": "BlogPosting",
    "@id": `${url}#article`,
    headline: title,
    description,
    url,
    mainEntityOfPage: { "@type": "WebPage", "@id": `${url}#webpage` },
    ...(image ? { image: toAbsoluteUrl(image) } : {}),
    ...(author?.trim() && authorType
      ? { author: { "@type": authorType, name: author.trim() } }
      : {}),
    ...(toIsoDate(datePublished) ? { datePublished: toIsoDate(datePublished) } : {}),
    ...(toIsoDate(dateModified) ? { dateModified: toIsoDate(dateModified) } : {}),
    publisher: { "@id": ORGANIZATION_ID },
  };
};

function removeEmptyValues(value: unknown): unknown {
  if (value === undefined || value === null || value === "") return undefined;
  if (Array.isArray(value)) {
    const values = value.map(removeEmptyValues).filter((item) => item !== undefined);
    return values.length > 0 ? values : undefined;
  }
  if (typeof value === "object") {
    const entries = Object.entries(value as Record<string, unknown>)
      .map(([key, child]) => [key, removeEmptyValues(child)] as const)
      .filter(([, child]) => child !== undefined);
    return entries.length > 0 ? Object.fromEntries(entries) : undefined;
  }
  return value;
}

export const pageStructuredDataScript = (options: PageSchemaOptions) => {
  const nodes: SchemaNode[] = [
    organizationSchema(),
    webpageSchema(options),
    ...(options.includeWebsite ? [websiteSchema()] : []),
    ...(options.breadcrumbs?.length ? [breadcrumbSchema(options.breadcrumbs, options.url)] : []),
    ...(options.entities ?? []),
  ];
  const graph = removeEmptyValues(nodes) as SchemaNode[];
  const serialized = JSON.stringify({ "@context": "https://schema.org", "@graph": graph })
    .replace(/</g, "\\u003c")
    .replace(/>/g, "\\u003e")
    .replace(/&/g, "\\u0026")
    .replace(/\u2028/g, "\\u2028")
    .replace(/\u2029/g, "\\u2029");

  return { type: "application/ld+json" as const, children: serialized };
};
