import { redirect } from "react-router";

export function loader() {
  return redirect("/en/login");
}

export default function LoginRedirectRoute() {
  return null;
}
