import { Link } from "react-router";
import { ArrowRightAlt } from "@mui/icons-material";
import { useTranslation } from "react-i18next";

export function Footer() {
  const { t } = useTranslation();
  return (
    <footer className="border-archive-ink/10 mt-20 border-t py-12 text-center">
      <Link to="https://viernulvier.gent">
        <a className="border-b text-[14px] uppercase opacity-40 transition-opacity hover:opacity-100">
          {t("footer.website")} <ArrowRightAlt />
        </a>
      </Link>
    </footer>
  );
}
