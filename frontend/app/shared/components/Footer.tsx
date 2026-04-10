import {
  FaTiktok,
  FaFacebook,
  FaInstagram,
  FaYoutube,
  FaLinkedin,
  FaArrowRight,
} from "react-icons/fa";
import { useTranslation } from "react-i18next";

const socials = [
  {
    url: "https://www.facebook.com/VIERNULVIER.gent/",
    label: "Facebook",
    icon: <FaFacebook />,
  },
  {
    label: "Instagram",
    url: "https://www.instagram.com/viernulvier.gent/",
    icon: <FaInstagram />,
  },
  {
    label: "TikTok",
    url: "https://www.tiktok.com/@viernulvier.gent",
    icon: <FaTiktok />,
  },
  {
    label: "YouTube",
    url: "https://www.youtube.com/channel/UCdRYlqUQcIm6pbLgHHobQcQ",
    icon: <FaYoutube />,
  },
  {
    label: "LinkedIn",
    url: "https://www.linkedin.com/company/viernulviergent",
    icon: <FaLinkedin />,
  },
];

export function Footer() {
  const { t } = useTranslation();
  return (
    <footer className="border-archive-ink/10 mt-20 items-center border-t py-12 text-center">
      <div className="grid grid-cols-1 items-center gap-8 md:grid-cols-3">
        {/* Left Column */}
        <address className="flex-col text-center not-italic md:ml-20 md:text-left">
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
        <div className="flex justify-center gap-2 md:mr-20 md:justify-end [&_svg]:h-6 [&_svg]:w-6">
          {socials.map((social) => (
            <a
              key={social.label}
              target="_blank"
              aria-label={social.label}
              href={social.url}
            >
              {social.icon}
            </a>
          ))}
        </div>
      </div>
    </footer>
  );
}
