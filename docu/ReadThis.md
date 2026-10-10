
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev

1. git add .
2. git status
3. git commit -m "Add somethings" 
4. git push origin main
4. git push

# ++++++++++++

You’re very close already. In this project, the correct way is: **don’t put the Windows path directly in `image`**. Since this is a TanStack/Vite app, import the image or resolve it through `import.meta.glob`.

Your file is here: [courses.ts](c:/Users/user/Desktop/skill-path-finder-65/src/data/courses.ts)

You already have this helper:

```ts
const courseImageAssets = import.meta.glob<string>(
  "../assets/courses/*.{avif,jpg,jpeg,png,webp}",
  {
    eager: true,
    query: "?url",
    import: "default",
  },
);

const resolveCourseImage = (slug: string, fallback: string) => {
  for (const extension of courseImageExtensions) {
    const image = courseImageAssets[`../assets/courses/${slug}.${extension}`];
    if (image) return image;
  }

  return fallback;
};
```

That means the easiest method is:

```ts
image: resolveCourseImage("full-stack-data-science", dataImg),
image: resolveCourseImage("cloud-omputing", cloudImg),
generative-ai
```

So for your images in `src/assets/courses`:

```ts
image: resolveCourseImage("full-stack-data-science", dataImg),
image: resolveCourseImage("financial-analysis", dataImg),
image: resolveCourseImage("ui-ux-design", dataImg),
```

The name inside `resolveCourseImage(...)` must match the image filename **without the extension**.

Example:

```ts
{
  slug: "ui-ux-design",
  title: "UI/UX Design",
  category: "development",
  level: "Beginner",
  duration: "8 weeks",
  delivery: "Both",
  image: resolveCourseImage("ui-ux-design", devImg),
  summary: "...",
}
```

So this file:

```txt
src/assets/courses/ui-ux-design.png
```

is linked by this:

```ts
image: resolveCourseImage("ui-ux-design", devImg)
```

You can also use the course slug directly:

```ts
image: resolveCourseImage("financial-analysis", dataImg)
```

Just make sure the image filename and slug match exactly: lowercase, hyphens, no spaces.