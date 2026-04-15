import { type RouteConfig, route, index } from "@react-router/dev/routes";

export default [
  index("routes/_index.tsx"),
  route("login", "routes/login-redirect.tsx", { id: "routes/login-redirect" }),

  route(":lang", "shared/components/LanguageWrapper.tsx", [
    index("routes/home.tsx"),
    route("archive", "routes/archive.tsx"),
    route("history", "routes/history.tsx"),
    route("login", "routes/login.tsx"),
    route("*", "routes/not-found.tsx"),
  ]),
] satisfies RouteConfig;
