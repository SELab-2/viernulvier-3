import ArrowRightAlt from "@mui/icons-material/ArrowRightAlt";
import {
  Box,
  Card,
  CardContent,
  CardMedia,
  Chip,
  Divider,
  Link,
  Stack,
  Typography,
} from "@mui/material";
import { useTranslation } from "react-i18next";
import type { Blog, BlogContent } from "../types/blogTypes";
import { getProductionByUrl } from "~/features/archive/services/productionService";

const DEFAULT_IMAGE =
  "https://images.unsplash.com/photo-1518998053901-5348d3961a04?q=80&w=1600&auto=format&fit=crop";

const CARD_COLORS = {
  surfaceStart: "var(--color-archive-surface-strong)",
  surfaceEnd: "var(--color-archive-surface)",
  textPrimary: "var(--color-archive-ink)",
  textSecondary: "var(--color-archive-ink)",
  accent: "var(--color-archive-accent)",
  ink: "var(--color-archive-ink)",
} as const;

const CARD_MOTION = {
  imageScaleOnHover: 1.05,
  imageTranslateYOnHover: "-6px",
  contentTranslateYOnHover: "-4px",
  transitionDuration: "750ms",
  transitionEasing: "cubic-bezier(0.2, 0.8, 0.2, 1)",
} as const;

function colorWithOpacity(color: string, opacity: number): string {
  return `color-mix(in srgb, ${color} ${Math.round(opacity * 100)}%, transparent)`;
}

function getBlogContentByLanguage(
  blogContents: BlogContent[],
  language: string
): BlogContent {
  const normalizedLanguage = language.toLowerCase();
  const baseLanguage = normalizedLanguage.split("-")[0]; // maybe later we have en-Us and en-GB

  const preferredLanguages = Array.from(
    new Set([normalizedLanguage, baseLanguage, "nl", "en"])
  );

  for (const preferred of preferredLanguages) {
    const languageMatch = blogContents.find(
      (info) => info.language.toLowerCase() === preferred
    );

    if (languageMatch) {
      return languageMatch;
    }
  }

  return blogContents[0];
}


async function getProductionTitlesByLanguage(blog: Blog, language: string): Promise<string[]> {
  if (!blog.production_id_urls || blog.production_id_urls.length === 0) {
    return [];
  }

  const titles = await Promise.all(
    blog.production_id_urls.map(async (prod_id_url) => {
      const prod = await getProductionByUrl(prod_id_url, language);

      const languageMatch = prod.production_infos.find(
        (prod_info) => prod_info.language === language
      );

      return languageMatch?.title ?? prod.production_infos[0]?.title;
    })
  );

  return titles.filter(
    (title): title is string => typeof title === "string" && title.length > 0
  );
}


interface BlogCardProps {
  blog: Blog;
  preferredLanguage?: string;
  className?: string;
}

export async function BlogCard({
  blog,
  preferredLanguage = "nl",
  className,
}: BlogCardProps) {
  const blog_content = getBlogContentByLanguage(blog.blog_contents, preferredLanguage);

  const title = blog_content.title;
  const content = blog_content.title;
  const production_titles = await getProductionTitlesByLanguage(blog, preferredLanguage);
  const imageUrl = DEFAULT_IMAGE;

  const { t } = useTranslation();

  return (
    <Card
      role="button"
      tabIndex={0}
      aria-label={`Open details for ${title}`}
      className={className}
      sx={{
        "width": "100%",
        "height": { xs: "180px", sm: "210px", md: "250px" },
        "display": "flex",
        "flexDirection": "row",
        "borderRadius": 4,
        "overflow": "hidden",
        "cursor": "pointer",
        "background": `linear-gradient(180deg, ${CARD_COLORS.surfaceStart} 0%, ${CARD_COLORS.surfaceEnd} 100%)`,
        "color": CARD_COLORS.textPrimary,
        "border": `1px solid ${colorWithOpacity(CARD_COLORS.accent, 0.35)}`,
        "transition": `transform ${CARD_MOTION.transitionDuration} ${CARD_MOTION.transitionEasing}, box-shadow ${CARD_MOTION.transitionDuration} ${CARD_MOTION.transitionEasing}`,
        "&:hover": {
          transform: "translateY(-2px)",
          boxShadow: `0 16px 36px ${colorWithOpacity(CARD_COLORS.ink, 0.1)}`,
        },
        "&:hover .blog-card-image": {
          transform: `scale(${CARD_MOTION.imageScaleOnHover})`,
        },
        "&:hover .blog-card-content": {
          transform: `translateY(${CARD_MOTION.contentTranslateYOnHover})`,
        },
        "& .blog-card-text": {
          transition: `color ${CARD_MOTION.transitionDuration} ${CARD_MOTION.transitionEasing}`,
        },
        "&:hover .blog-card-text": {
          color: `${CARD_COLORS.textSecondary} !important`,
        },
        "&:hover .blog-card-supertitle": {
          color: "var(--color-archive-paper) !important",
        },
      }}
      elevation={0}
    >
      <Box
        sx={{
          position: "relative",
          overflow: "hidden",
          flexShrink: 0,
          width: { xs: "0%", sm: "30%", md: "320px" },
        }}
      >
        <CardMedia
          className="blog-card-image"
          component="img"
          image={imageUrl}
          alt={title}
          sx={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            transition: `transform ${CARD_MOTION.transitionDuration} ${CARD_MOTION.transitionEasing}`,
            transform: "scale(1)",
            transformOrigin: "center center",
            willChange: "transform",
          }}
        />
      </Box>

      <CardContent
        className="blog-card-content"
        sx={{
          "flexGrow": 1,
          "px": 2.5,
          "py": 2,
          "display": "flex",
          "flexDirection": "column",
          "transform": "translateY(0)",
          "transition": `transform ${CARD_MOTION.transitionDuration} ${CARD_MOTION.transitionEasing}`,
          "willChange": "transform",
          "&:last-child": { pb: 2 },
        }}
      >
        <Typography
          className="blog-card-text"
          component="h3"
          sx={{
            mb: 1,
            fontFamily: "var(--font-serif)",
            fontSize: "var(--text-archive-title-lg)",
            lineHeight: "var(--leading-archive-title)",
            color: CARD_COLORS.textPrimary,
            flexShrink: 0,
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
          }}
        >
          {title}
        </Typography>

        <Box
          sx={{
            flexGrow: 1,
            overflow: "hidden",
            position: "relative",
            // fade-out at the bottom
            maskImage: "linear-gradient(to bottom, black 30%, transparent 100%)",
            WebkitMaskImage: "linear-gradient(to bottom, black 30%, transparent 100%)",
          }}
        >
          <Typography
            className="blog-card-text"
            sx={{
              color: CARD_COLORS.textSecondary,
              fontSize: "var(--text-archive-body)",
              lineHeight: "var(--leading-archive-body)",
              overflowWrap: "anywhere",
              whiteSpace: "pre-wrap",
            }}
          >
            {content}
          </Typography>
        </Box>
        <Divider
          sx={{
            borderColor: colorWithOpacity(CARD_COLORS.accent, 0.15),
            mt: 1.5,
            display: { xs: "none", sm: "flex" },
          }}
        />
        <Stack
          direction="row"
          alignItems="center"
          justifyContent="space-between"
          sx={{ mt: 1.5, display: { xs: "none", sm: "flex" } }}
        >
          <Stack direction="row" alignItems="center" gap={1}>
            {production_titles.length > 0 && (
              <Chip
                className="blog-card-text"
                size="small"
                label={production_titles[0]}
                sx={{
                  borderRadius: 1,
                  background: "transparent",
                  border: `1px solid ${colorWithOpacity(CARD_COLORS.accent, 0.24)}`,
                  color: colorWithOpacity(CARD_COLORS.textSecondary, 0.86),
                  letterSpacing: "var(--tracking-archive-label)",
                  height: 22,
                }}
              />
            )}
            {production_titles.length > 1 && (
              <Typography
                sx={{
                  fontSize: "var(--text-archive-meta)",
                  color: colorWithOpacity(CARD_COLORS.textSecondary, 0.5),
                  letterSpacing: "var(--tracking-archive-label)",
                  whiteSpace: "nowrap",
                }}
              >
                +{production_titles.length - 1} {t("blogs.card.other_prods")}
              </Typography>
            )}
            {production_titles.length === 0 && (
              <Typography
                sx={{
                  fontSize: "var(--text-archive-meta)",
                  color: colorWithOpacity(CARD_COLORS.textSecondary, 0.5),
                  letterSpacing: "var(--tracking-archive-label)",
                  whiteSpace: "nowrap",
                }}
              >
                {t("blogs.card.no_prods")}
              </Typography>
            )}
          </Stack>

          <Link
            className="blog-card-text"
            component="span"
            underline="none"
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 0.25,
              color: colorWithOpacity(CARD_COLORS.accent, 0.98),
              fontWeight: "var(--weight-archive-bold)",
              textTransform: "uppercase",
              letterSpacing: "var(--tracking-archive-label)",
              fontSize: "var(--text-archive-meta)",
              cursor: "pointer",
              flexShrink: 0,
            }}
          >
            {t("blogs.card.details")} <ArrowRightAlt sx={{ fontSize: "1.1em" }} />
          </Link>
        </Stack>
      </CardContent>
    </Card>
  );
}

export interface BlogCardListProps {
	blogs: Blog[];
}

export function BlogCardList({ blogs }: BlogCardListProps) {
  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        gap: 2.5,
        width: "100%",
      }}
    >
	  {blogs.map((blog) => (
		  <BlogCard key={blog.id_url} blog={blog} />
	  ))}
    </Box>
  );
}
