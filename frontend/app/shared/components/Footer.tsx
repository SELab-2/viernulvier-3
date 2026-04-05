import {
  FaTiktok,
  FaFacebook,
  FaInstagram,
  FaYoutube,
  FaLinkedin,
  FaArrowRight,
} from "react-icons/fa";
import { useTranslation } from "react-i18next";

export function Footer() {
  const { t } = useTranslation();
  return (
    <footer className="border-archive-ink/10 mt-20 items-center border-t py-12 text-center">
      <div className="grid grid-cols-1 gap-8 text-center md:grid-cols-3">
        {/* Left Column */}
        <address className="flex-col not-italic md:ml-20 md:text-left">
          <p>Kunstencentrum VIERNULVIER vzw.</p>
          <p>Sint-Pietersnieuwstraat 23 9000 Gent</p>
          <p>T. 09 267 28 20 </p>
          <a href="mailto:info@viernulvier.gent">info@viernulvier.gent</a>
        </address>

        {/* Center column */}
        <div className="text-center">
          <a
            href="https://viernulvier.gent"
            target="_blank"
            className="inline-flex items-center gap-1 border-b text-[14px] uppercase opacity-40 transition-opacity hover:opacity-100"
          >
            {t("footer.website")} <FaArrowRight />
          </a>
        </div>

        {/* Socials */}
        <div className="flex justify-center gap-2 [&_svg]:h-6 [&_svg]:w-6">
          <a aria-label="Facebook" href="https://www.facebook.com/VIERNULVIER.gent/">
            <FaFacebook />
          </a>
          <a aria-label="Instagram" href="https://www.instagram.com/viernulvier.gent/">
            <FaInstagram />
          </a>
          <a aria-label="TikTok" href="https://www.tiktok.com/@viernulvier.gent">
            <FaTiktok />
          </a>
          <a
            aria-label="YouTube"
            href="https://www.youtube.com/channel/UCdRYlqUQcIm6pbLgHHobQcQ"
          >
            <FaYoutube />
          </a>
          <a
            aria-label="LinkedIn"
            href="https://www.linkedin.com/company/viernulviergent"
          >
            <FaLinkedin />
          </a>
        </div>
      </div>
    </footer>
  );
}
