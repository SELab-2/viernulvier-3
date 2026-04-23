import { redirect } from "react-router";

export function loader() {
  return redirect("/en");
}

export default function Index() {
  return null;
}
