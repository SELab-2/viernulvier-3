import { useNavigate, useParams } from "react-router";
import { useTranslation } from "react-i18next";
import { Box, Card, CardContent, CardMedia, Stack, Typography, Link } from "@mui/material";
import ArrowRightAlt from "@mui/icons-material/ArrowRightAlt";
import DOMPurify from "dompurify";
import type { Blog, BlogContent } from "../types/blogTypes";
import { useLocalizedPath } from "~/shared/hooks/useLocalizedPath";

const DEFAULT_IMAGE =
  "https://images.unsplash.com/photo-1518998053901-5348d3961a04?q=80&w=1600&auto=format&fit=crop";

const CARD_COLORS = {
  surfaceStart: "var(--color-archive-surface-strong)",
  surfaceEnd: "var(--color-archive-surface)",
  textPrimary: "var(--color-archive-ink)",
  accent: "var(--color-archive-accent)",
  ink: "var(--color-archive-ink)",
} as const;

const CARD_MOTION = {
  imageScaleOnHover: 1.05,
  transitionDuration: "750ms",
  transitionEasing: "cubic-bezier(0.2, 0.8, 0.2, 1)",
} as const;

function colorWithOpacity(color: string, opacity: number): string {
  return `color-mix(in srgb, ${color} ${Math.round(opacity * 100)}%, transparent)`;
}

function getBlogContentByLanguage(
  blogContents: BlogContent[],
  language: string
): BlogContent | null {
  if (blogContents.length === 0) {
    return null;
  }

  const normalizedLanguage = language.toLowerCase();
  const baseLanguage = normalizedLanguage.split("-")[0];

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

function getSanitizedHtmlOrUndefined(
  value: string | null | undefined
): string | undefined {
  if (typeof value !== "string") {
    return undefined;
  }

  const trimmedValue = value.trim();
  if (trimmedValue.length === 0) {
    return undefined;
  }

  return DOMPurify.sanitize(trimmedValue);
}

interface LinkedBlogCardProps {
  blog: Blog;
  preferredLanguage?: string;
  className?: string;
}

export function LinkedBlogCard({
  blog,
  preferredLanguage,
  className,
}: LinkedBlogCardProps) {
  const { t } = useTranslation();
  const { lang } = useParams();
  const navigate = useNavigate();
  const lp = useLocalizedPath();

  const language = preferredLanguage ?? lang!;
  const blog_content = getBlogContentByLanguage(blog.blog_contents, language);

  const title = blog_content?.title ?? "Untitled blog";
  const content = blog_content?.content ?? "";
  const imageUrl = DEFAULT_IMAGE;

  const contentHtml = getSanitizedHtmlOrUndefined(content);

  const handleCardClick = () => {
    // Extract blog ID from id_url (format: /blogs/{id})
    const blogId = blog.id_url.split("/").pop();
    navigate(lp(`/blogs/${blogId}`));
  };

  return (
    <Card
      role="button"
      tabIndex={0}
      aria-label={`Open blog: ${title}`}
      onClick={handleCardClick}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          handleCardClick();
        }
      }}
      className={className}
      sx={{
        "width": "100%",
        "height": { xs: "160px", sm: "180px", md: "200px" },
        "display": "flex",
        "flexDirection": "row",
        "borderRadius": 2,
        "overflow": "hidden",
        "cursor": "pointer",
        "background": `linear-gradient(180deg, ${CARD_COLORS.surfaceStart} 0%, ${CARD_COLORS.surfaceEnd} 100%)`,
        "color": CARD_COLORS.textPrimary,
        "border": `1px solid ${colorWithOpacity(CARD_COLORS.accent, 0.25)}`,
        "transition": `transform ${CARD_MOTION.transitionDuration} ${CARD_MOTION.transitionEasing}, box-shadow ${CARD_MOTION.transitionDuration} ${CARD_MOTION.transitionEasing}`,
        "&:hover": {
          transform: "translateY(-2px)",
          boxShadow: `0 12px 24px ${colorWithOpacity(CARD_COLORS.ink, 0.08)}`,
        },
        "&:hover .linked-blog-card-image": {
          transform: `scale(${CARD_MOTION.imageScaleOnHover})`,
        },
      }}
      elevation={0}
    >
      <Box
        sx={{
          position: "relative",
          overflow: "hidden",
          flexShrink: 0,
          width: { xs: "35%", sm: "30%", md: "180px" },
        }}
      >
        <CardMedia
          className="linked-blog-card-image"
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
        sx={{
          "flexGrow": 1,
          "px": 2,
          "py": 1.5,
          "display": "flex",
          "flexDirection": "column",
          "&:last-child": { pb: 1.5 },
        }}
      >
        <Typography
          component="h3"
          sx={{
            mb: 0.5,
            fontFamily: "var(--font-serif)",
            fontSize: "var(--text-archive-title-sm)",
            lineHeight: "1.3",
            color: CARD_COLORS.textPrimary,
            display: "-webkit-box",
            WebkitLineClamp: 1,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
            fontWeight: 600,
          }}
        >
          {title}
        </Typography>

        <Box
          sx={{
            flexGrow: 1,
            overflow: "hidden",
            position: "relative",
            maskImage: "linear-gradient(to bottom, black 60%, transparent 100%)",
            WebkitMaskImage: "linear-gradient(to bottom, black 60%, transparent 100%)",
          }}
        >
          {contentHtml && (
            <div
              dangerouslySetInnerHTML={{ __html: contentHtml }}
              style={{
                color: colorWithOpacity(CARD_COLORS.textPrimary, 0.75),
                fontSize: "0.875rem",
                lineHeight: "1.4",
                overflowWrap: "anywhere",
                whiteSpace: "pre-wrap",
              }}
            />
          )}
        </Box>

        <Stack
          direction="row"
          justifyContent="flex-end"
          sx={{ mt: 1, display: { xs: "none", sm: "flex" } }}
        >
          <Link
            component="span"
            underline="none"
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 0.25,
              color: colorWithOpacity(CARD_COLORS.accent, 0.9),
              fontWeight: 600,
              textTransform: "uppercase",
              letterSpacing: "0.05em",
              fontSize: "0.75rem",
              cursor: "pointer",
              flexShrink: 0,
            }}
          >
            {t("blogs.card.details")} <ArrowRightAlt sx={{ fontSize: "0.9em" }} />
          </Link>
        </Stack>
      </CardContent>
    </Card>
  );
}

interface LinkedBlogsListProps {
  blogs: Blog[];
  preferredLanguage?: string;
}

export function LinkedBlogsList({ blogs, preferredLanguage }: LinkedBlogsListProps) {
  const { t } = useTranslation();

  if (blogs.length === 0) {
    return (
      <p className="opacity-75">
        {t("productionPage.fallback.noLinkedBlogs")}
      </p>
    );
  }

  return (
    <Box
      sx={{
        display: "grid",
        gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)", md: "repeat(3, 1fr)" },
        gap: 2,
        width: "100%",
      }}
    >
      {blogs.map((blog) => (
        <LinkedBlogCard
          key={blog.id_url}
          blog={blog}
          preferredLanguage={preferredLanguage}
        />
      ))}
    </Box>
  );
}
