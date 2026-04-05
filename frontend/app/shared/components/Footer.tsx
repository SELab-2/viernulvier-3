import { Link } from "react-router";
import { ArrowRightAlt } from "@mui/icons-material";

export function Footer() {
  return (
    <footer className="border-archive-ink/10 mt-20 border-t py-12 text-center">
      <Link to="https://viernulvier.gent">
        <a className="border-b text-[14px] uppercase opacity-40 transition-opacity hover:opacity-100">
          Onze officiële website <ArrowRightAlt />
        </a>
      </Link>
    </footer>
  );
}
