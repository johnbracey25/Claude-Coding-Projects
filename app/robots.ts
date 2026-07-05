import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/about", "/join"],
        disallow: [
          "/dashboard",
          "/people",
          "/studies",
          "/candidates",
          "/calendar",
          "/messages",
          "/api/",
          "/book/",
          "/r/",
          "/login",
        ],
      },
    ],
    sitemap: "https://eve-research.com/sitemap.xml",
  };
}
