import { useParams } from "react-router";

export function useLocalizedPath() {
  const { lang } = useParams();
  return (path: string) => `/${lang}${path.startsWith("/") ? path : `/${path}`}`;
}
