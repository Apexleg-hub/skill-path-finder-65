import { Link } from "@tanstack/react-router";
import { ArrowRight, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { categoryName, type Course } from "@/data/courses";

export function CourseCard({ course }: { course: Course }) {
  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-card transition-all hover:-translate-y-1 hover:shadow-lift">
      <div className="relative aspect-[16/10] overflow-hidden">
        <img
          src={course.image}
          alt={course.title}
          loading="lazy"
          width={1024}
          height={640}
          className="size-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <Badge variant="tag" className="absolute left-3 top-3">
          {categoryName(course.category)}
        </Badge>
      </div>
      <div className="flex flex-1 flex-col p-5">
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span className="font-medium text-primary">{course.level}</span>
          <span className="flex items-center gap-1">
            <Clock className="size-3.5" /> {course.duration}
          </span>
        </div>
        <h3 className="mt-2 text-lg font-semibold leading-snug">{course.title}</h3>
        <p className="mt-2 flex-1 text-sm text-muted-foreground">{course.summary}</p>
        <Link
          to="/courses/$slug"
          params={{ slug: course.slug }}
          className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-primary"
        >
          View course <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
        </Link>
      </div>
    </article>
  );
}