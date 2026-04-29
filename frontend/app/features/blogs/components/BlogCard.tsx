import ArrowRightAlt from "@mui/icons-material/ArrowRightAlt";
import {
  Box,
  Card,
  CardContent,
  CardMedia,
  Divider,
  Typography,
} from "@mui/material";

const DEFAULT_IMAGE =
  "https://images.unsplash.com/photo-1518998053901-5348d3961a04?q=80&w=1600&auto=format&fit=crop";

const DEFAULT_CARD_VALUES = {
  imageUrl: DEFAULT_IMAGE,
  tagNames: [] as string[],
} as const;

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

interface BlogCardProps {
  preferredLanguage?: string;
  className?: string;
}

export function BlogCard({ className }: BlogCardProps) {
  const title = "temp title";
  const imageUrl = DEFAULT_CARD_VALUES.imageUrl;
  let content = "temp content\n";
  content = content + "Lorem ipsum dolor sit amet consectetur adipiscing elit. Quisque faucibus ex sapien vitae pellentesque sem placerat. In id cursus mi pretium tellus duis convallis. Tempus leo eu aenean sed diam urna tempor. Pulvinar vivamus fringilla lacus nec metus bibendum egestas. Iaculis massa nisl malesuada lacinia integer nunc posuere. Ut hendrerit semper vel class aptent taciti sociosqu. Ad litora torquent per conubia nostra inceptos himenaeos.\nLorem ipsum dolor sit amet consectetur adipiscing elit. Quisque faucibus ex sapien vitae pellentesque sem placerat. In id cursus mi pretium tellus duis convallis. Tempus leo eu aenean sed diam urna tempor. Pulvinar vivamus fringilla lacus nec metus bibendum egestas. Iaculis massa nisl malesuada lacinia integer nunc posuere. Ut hendrerit semper vel class aptent taciti sociosqu. Ad litora torquent per conubia nostra inceptos himenaeos.\nLorem ipsum dolor sit amet consectetur adipiscing elit. Quisque faucibus ex sapien vitae pellentesque sem placerat. In id cursus mi pretium tellus duis convallis. Tempus leo eu aenean sed diam urna tempor. Pulvinar vivamus fringilla lacus nec metus bibendum egestas. Iaculis massa nisl malesuada lacinia integer nunc posuere. Ut hendrerit semper vel class aptent taciti sociosqu. Ad litora torquent per conubia nostra inceptos himenaeos.\nLorem ipsum dolor sit amet consectetur adipiscing elit. Quisque faucibus ex sapien vitae pellentesque sem placerat. In id cursus mi pretium tellus duis convallis. Tempus leo eu aenean sed diam urna tempor. Pulvinar vivamus fringilla lacus nec metus bibendum egestas. Iaculis massa nisl malesuada lacinia integer nunc posuere. Ut hendrerit semper vel class aptent taciti sociosqu. Ad litora torquent per conubia nostra inceptos himenaeos.\nLorem ipsum dolor sit amet consectetur adipiscing elit. Quisque faucibus ex sapien vitae pellentesque sem placerat. In id cursus mi pretium tellus duis convallis. Tempus leo eu aenean sed diam urna tempor. Pulvinar vivamus fringilla lacus nec metus bibendum egestas. Iaculis massa nisl malesuada lacinia integer nunc posuere. Ut hendrerit semper vel class aptent taciti sociosqu. Ad litora torquent per conubia nostra inceptos himenaeos."

  return (
    <Card
      role="button"
      tabIndex={0}
      aria-label={`Open details for ${title}`}
      className={className}
      sx={{
        "width": "100%",
		"height": "240px",
        "display": "flex",
        "flexDirection": "row",   // ← horizontal layout
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
      {/* Left: image */}
      <Box
        sx={{
          position: "relative",
          overflow: "hidden",
          flexShrink: 0,
          width: { xs: "40%", sm: "320px" },
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

      {/* Right: content */}
      <CardContent
        className="blog-card-content"
        sx={{
          flexGrow: 1,
          px: 2.5,
          py: 2,
          display: "flex",
          flexDirection: "column",
          transform: "translateY(0)",
          transition: `transform ${CARD_MOTION.transitionDuration} ${CARD_MOTION.transitionEasing}`,
          willChange: "transform",
          // remove MUI's default last-child bottom padding override
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
            // fade-out mask at the bottom
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
		  sx={{ borderColor: colorWithOpacity(CARD_COLORS.accent, 0.15), mt: 1.5 }}
		/>

      </CardContent>
    </Card>
  );
}

export function BlogCardList() {
  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        gap: 2.5,
        width: "100%",
      }}
    >
      <BlogCard />
      <BlogCard />
      <BlogCard />
      <BlogCard />
      <BlogCard />
    </Box>
  );
}
