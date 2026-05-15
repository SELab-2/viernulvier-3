import { type RouteConfig, route, index } from "@react-router/dev/routes";

export default [
  index("routes/_index.tsx"),

  route(":lang", "shared/components/LanguageWrapper.tsx", [
    index("routes/home.tsx"),
    route("archive", "routes/archive.tsx"),
    route("archive/productions/:productionId", "routes/productions.$productionId.tsx"),
    route("archive/productions/create", "routes/createProductions.tsx"),
    route("history", "routes/history.tsx"),
    route("visuals", "routes/visuals.tsx"),
    route("blogs", "routes/blogs.tsx"),
    route("blogs/create", "routes/createBlogs.tsx"),
    route("blogs/:blogId", "routes/blogs.$blogId.tsx"),
    route("login", "routes/login.tsx"),
    route("users", "routes/users.tsx"),
    route("*", "routes/not-found.tsx"),
  ]),
] satisfies RouteConfig;
