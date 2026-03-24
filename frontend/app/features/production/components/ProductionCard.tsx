import {
  alpha,
  Box,
  Card,
  CardContent,
  CardMedia,
  Chip,
  Link,
  Divider,
  Stack,
  Typography,
} from "@mui/material";

const DEFAULT_IMAGE = "https://images.unsplash.com/photo-1518998053901-5348d3961a04?q=80&w=1600&auto=format&fit=crop";

const DEFAULT_CARD_VALUES = {
  title: "Onbekende productie",
  dateLabel: "5 oktober 2024",
  venueLabel: "Domzaal",
  imageUrl: DEFAULT_IMAGE,
  tagNames: [] as string[],
} as const;

const CARD_COLORS = {
  surfaceStart: "#201d1a",
  surfaceEnd: "#171513",
  textPrimary: "#f9ead4",
  textSecondary: "#bfa481",
  accent: "#c8ae8f",
  ink: "#0f0f0f",
} as const;

const CARD_TYPOGRAPHY = {
  titleFontFamily: '"Cormorant Garamond", Georgia, serif',
  dateFontSize: "0.755rem",
  venueFontSize: "0.715rem",
  titleFontSizeXs: "1.875rem",
  titleFontSizeMd: "2.075rem",
  titleLineHeight: 1.04,
  artistFontSize: "0.835rem",
  taglineFontSize: "0.875rem",
  taglineLineHeight: 1.48,
  idFontSize: "0.735rem",
  detailsFontSize: "0.805rem",
  dateLetterSpacing: "0.14em",
  venueLetterSpacing: "0.08em",
  badgeLetterSpacing: "0.08em",
  artistLetterSpacing: "0.02em",
  tagLetterSpacing: "0.04em",
  idLetterSpacing: "0.11em",
  detailsLetterSpacing: "0.08em",
  dateFontWeight: 600,
  badgeFontWeight: 700,
  detailsFontWeight: 700,
} as const;

const CARD_MOTION = {
  imageScaleOnHover: 1.05,
  imageTranslateYOnHover: "-6px",
  contentTranslateYOnHover: "-4px",
  transitionDuration: "750ms",
  transitionEasing: "cubic-bezier(0.2, 0.8, 0.2, 1)",
} as const;

interface ProductionInfoData {
  language: string;
  title?: string;
  supertitle?: string;
  artist?: string;
  tagline?: string;
}

export interface ProductionCardData {
  id_url: string;
  performer_type?: string;
  attendance_mode?: string;
  media_gallery_id?: number | null;
  production_infos?: ProductionInfoData[];
  starts_at?: string;
  hall_name?: string;
  tag_names?: string[];
  image_url?: string;
}

interface ProductionCardProps {
  production: ProductionCardData;
  onOpen?: (productionId: string) => void;
  preferredLanguage?: string;
}

function getProductionInfoByLanguage(
  productionInfos: ProductionInfoData[] | undefined,
  language: string
): ProductionInfoData | undefined {
  if (!productionInfos || productionInfos.length === 0) {
    return undefined;
  }

  const languageMatch = productionInfos.find((info) => info.language === language);
  return languageMatch ?? productionInfos[0];
}

function getTextOrDefault(value: string | null | undefined, fallback: string): string {
  if (typeof value !== "string") {
    return fallback;
  }

  const trimmedValue = value.trim();
  return trimmedValue.length > 0 ? trimmedValue : fallback;
}

function getOptionalText(value: string | null | undefined): string | undefined {
  if (typeof value !== "string") {
    return undefined;
  }

  const trimmedValue = value.trim();
  return trimmedValue.length > 0 ? trimmedValue : undefined;
}

function getListOrDefault<T>(value: T[] | null | undefined, fallback: T[]): T[] {
  return Array.isArray(value) ? value : fallback;
}

export function ProductionCard({
  production,
  onOpen,
  preferredLanguage = "nl",
}: ProductionCardProps) {
  const primaryInfo = getProductionInfoByLanguage(production.production_infos, preferredLanguage);
  const title = getTextOrDefault(primaryInfo?.title, DEFAULT_CARD_VALUES.title);
  const supertitle = getOptionalText(primaryInfo?.supertitle);
  const artist = getOptionalText(primaryInfo?.artist);
  const tagline = getOptionalText(primaryInfo?.tagline);
  const dateLabel = getTextOrDefault(production.starts_at, DEFAULT_CARD_VALUES.dateLabel);
  const venueLabel = getTextOrDefault(production.hall_name, DEFAULT_CARD_VALUES.venueLabel);
  const imageUrl = getTextOrDefault(production.image_url, DEFAULT_CARD_VALUES.imageUrl);
  const tagNames = getListOrDefault(production.tag_names, DEFAULT_CARD_VALUES.tagNames);

  return (
    <Card
      sx={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        borderRadius: 4,
        overflow: "hidden",
        background: `linear-gradient(180deg, ${CARD_COLORS.surfaceStart} 0%, ${CARD_COLORS.surfaceEnd} 100%)`,
        color: CARD_COLORS.textPrimary,
        border: `1px solid ${alpha(CARD_COLORS.accent, 0.12)}`,
        boxShadow: `0 16px 40px ${alpha(CARD_COLORS.ink, 0.38)}`,
        transition: `transform ${CARD_MOTION.transitionDuration} ${CARD_MOTION.transitionEasing}, box-shadow ${CARD_MOTION.transitionDuration} ${CARD_MOTION.transitionEasing}`,
        "&:hover": {
          transform: "translateY(-2px)",
          boxShadow: `0 22px 50px ${alpha(CARD_COLORS.ink, 0.45)}`,
        },
        "&:hover .production-card-image": {
          transform: `translateY(${CARD_MOTION.imageTranslateYOnHover}) scale(${CARD_MOTION.imageScaleOnHover})`,
        },
        "&:hover .production-card-content": {
          transform: `translateY(${CARD_MOTION.contentTranslateYOnHover})`,
        },
        "& .production-card-text": {
          transition: `color ${CARD_MOTION.transitionDuration} ${CARD_MOTION.transitionEasing}`,
        },
        "&:hover .production-card-text": {
          color: `${CARD_COLORS.textSecondary} !important`,
        },
      }}
      elevation={0}
    >
      <Box sx={{ position: "relative", overflow: "hidden" }}>
        <CardMedia
          className="production-card-image"
          component="img"
          height="268"
          image={imageUrl}
          alt={title}
          sx={{
            transition: `transform ${CARD_MOTION.transitionDuration} ${CARD_MOTION.transitionEasing}`,
            transform: "translateY(0) scale(1)",
            transformOrigin: "center top",
            willChange: "transform",
          }}
        />

        {supertitle ? (
          <Chip
            className="production-card-text"
            label={supertitle.toUpperCase()}
            size="small"
            sx={{
              position: "absolute",
              top: 12,
              left: 12,
              height: 28,
              borderRadius: 999,
              backgroundColor: alpha(CARD_COLORS.ink, 0.88),
              color: CARD_COLORS.textPrimary,
              fontWeight: CARD_TYPOGRAPHY.badgeFontWeight,
              letterSpacing: CARD_TYPOGRAPHY.badgeLetterSpacing,
              border: `1px solid ${alpha(CARD_COLORS.accent, 0.25)}`,
            }}
          />
        ) : null}
      </Box>

      <CardContent
        className="production-card-content"
        sx={{
          flexGrow: 1,
          px: 2.5,
          py: 2,
          display: "flex",
          flexDirection: "column",
          transform: "translateY(0)",
          transition: `transform ${CARD_MOTION.transitionDuration} ${CARD_MOTION.transitionEasing}`,
          willChange: "transform",
        }}
      >
        <Stack direction="row" justifyContent="space-between" sx={{ mb: 1.5 }}>
          <Typography
            className="production-card-text"
            sx={{
              color: CARD_COLORS.accent,
              fontSize: CARD_TYPOGRAPHY.dateFontSize,
              letterSpacing: CARD_TYPOGRAPHY.dateLetterSpacing,
              fontWeight: CARD_TYPOGRAPHY.dateFontWeight,
              textTransform: "uppercase",
            }}
          >
            {dateLabel}
          </Typography>

          <Typography
            className="production-card-text"
            sx={{
              color: alpha(CARD_COLORS.accent, 0.92),
              fontSize: CARD_TYPOGRAPHY.venueFontSize,
              letterSpacing: CARD_TYPOGRAPHY.venueLetterSpacing,
              textTransform: "uppercase",
            }}
          >
            @ {venueLabel}
          </Typography>
        </Stack>

        <Box sx={{ minHeight: { xs: 192, md: 208 }, mb: 1.8 }}>
          <Typography
            className="production-card-text"
            component="h3"
            sx={{
              mb: 1,
              fontFamily: CARD_TYPOGRAPHY.titleFontFamily,
              fontSize: { xs: CARD_TYPOGRAPHY.titleFontSizeXs, md: CARD_TYPOGRAPHY.titleFontSizeMd },
              lineHeight: CARD_TYPOGRAPHY.titleLineHeight,
              color: CARD_COLORS.textPrimary,
              minHeight: { xs: "3.7rem", md: "4rem" },
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
            }}
          >
            {title}
          </Typography>

          {artist ? (
            <Typography
              className="production-card-text"
              sx={{
                mb: 0.8,
                color: alpha(CARD_COLORS.textSecondary, 0.95),
                fontSize: CARD_TYPOGRAPHY.artistFontSize,
                letterSpacing: CARD_TYPOGRAPHY.artistLetterSpacing,
                minHeight: "1.35rem",
                display: "-webkit-box",
                WebkitLineClamp: 1,
                WebkitBoxOrient: "vertical",
                overflow: "hidden",
              }}
            >
              {artist}
            </Typography>
          ) : (
            <Box sx={{ minHeight: "1.35rem", mb: 0.8 }} />
          )}

          {tagline ? (
            <Typography
              className="production-card-text"
              sx={{
                color: CARD_COLORS.textSecondary,
                fontSize: CARD_TYPOGRAPHY.taglineFontSize,
                lineHeight: CARD_TYPOGRAPHY.taglineLineHeight,
                minHeight: "4.2rem",
                display: "-webkit-box",
                WebkitLineClamp: 3,
                WebkitBoxOrient: "vertical",
                overflow: "hidden",
              }}
            >
              {tagline}
            </Typography>
          ) : (
            <Box sx={{ minHeight: "4.2rem" }} />
          )}
        </Box>

        <Divider sx={{ borderColor: alpha(CARD_COLORS.accent, 0.15), mb: 1.4 }} />

        <Stack direction="row" spacing={0.8} useFlexGap flexWrap="wrap" sx={{ mb: 1.2 }}>
          {tagNames.map((tag) => (
            <Chip
              className="production-card-text"
              key={tag}
              size="small"
              label={tag.toUpperCase()}
              sx={{
                borderRadius: 1,
                background: "transparent",
                border: `1px solid ${alpha(CARD_COLORS.accent, 0.24)}`,
                color: alpha(CARD_COLORS.textSecondary, 0.86),
                letterSpacing: CARD_TYPOGRAPHY.tagLetterSpacing,
                height: 22,
              }}
            />
          ))}
        </Stack>

        <Stack direction="row" alignItems="center" justifyContent="space-between">
          <Typography
            className="production-card-text"
            sx={{
              color: alpha(CARD_COLORS.textSecondary, 0.76),
              fontSize: CARD_TYPOGRAPHY.idFontSize,
              letterSpacing: CARD_TYPOGRAPHY.idLetterSpacing,
            }}
          >
            ID: {production.id_url}
          </Typography>

          <Link
            className="production-card-text"
            component="button"
            onClick={() => onOpen?.(production.id_url)}
            underline="none"
            sx={{
              color: alpha(CARD_COLORS.accent, 0.98),
              fontWeight: CARD_TYPOGRAPHY.detailsFontWeight,
              textTransform: "uppercase",
              letterSpacing: CARD_TYPOGRAPHY.detailsLetterSpacing,
              fontSize: CARD_TYPOGRAPHY.detailsFontSize,
              cursor: "pointer",
            }}
          >
            Details {"->"}
          </Link>
        </Stack>
      </CardContent>
    </Card>
  );
}

// Temporary mock data for local UI development.
export const mockProductions: ProductionCardData[] = [
  {
    id_url: "VV-2024-10-OPEN-ARCHIVE",
    performer_type: "group",
    attendance_mode: "offline",
    starts_at: "3 oktober 2024",
    hall_name: "Balzaal",
    production_infos: [
      {
        language: "nl",
        title: "Open Archiefnacht",
        supertitle: "Ephemera",
        tagline:
          "Een avondvullende opening van de herfstselectie, opgebouwd rond dossiers, affiches en korte performances die de stadsarchieven activeren.",
      },
    ],
    tag_names: ["Archief", "Open Huis", "Performance", "Gent"],
    image_url:
      "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?q=80&w=1600&auto=format&fit=crop",
  },
  {
    id_url: "VV-2024-10-M1",
    performer_type: "ensemble",
    attendance_mode: "hybrid",
    starts_at: "5 oktober 2024",
    hall_name: "Domzaal",
    production_infos: [
      {
        language: "nl",
        title: "Film Hoge Dichtheid #2",
        supertitle: "Theater",
        tagline:
          "Een representatief voorbeelditem voor de mockup, dat de stabiliteit van de lay-out aantoont bij variërende volumes.",
      },
    ],
    tag_names: ["Underground", "Mockup"],
    image_url:
      "https://images.unsplash.com/photo-1470770841072-f978cf4d019e?q=80&w=1600&auto=format&fit=crop",
  },
  {
    id_url: "VV-2024-10-M2",
    performer_type: "duo",
    attendance_mode: "online",
    starts_at: "21 oktober 2024",
    hall_name: "Filmzaal",
    production_infos: [
      {
        language: "nl",
        title: "Ephemera Hoge Dichtheid #3",
        supertitle: "Film",
        tagline:
          "Een representatief voorbeelditem voor de mockup, dat de stabiliteit van de lay-out aantoont bij variërende volumes.",
      },
    ],
    tag_names: ["Geschiedenis", "Mockup"],
    image_url:
      "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?q=80&w=1600&auto=format&fit=crop",
  },
];

export function ProductionCardDemoGrid() {
  return (
    <Box
      sx={{
        display: "grid",
        gap: 3,
        gridTemplateColumns: {
          xs: "1fr",
          lg: "minmax(240px, 1fr) minmax(0, 3fr)",
        },
      }}
    >
      <Box
        sx={{
          borderRadius: 3,
          border: `1px dashed ${alpha(CARD_COLORS.accent, 0.35)}`,
          backgroundColor: alpha(CARD_COLORS.ink, 0.2),
          p: 2.5,
          minHeight: { xs: 120, lg: 240 },
        }}
      >
        <Typography sx={{ color: CARD_COLORS.textPrimary, fontWeight: 700, mb: 1 }}>
          Filters
        </Typography>
        <Typography sx={{ color: CARD_COLORS.textSecondary }}>
          Placeholder voor filterlijst
        </Typography>
      </Box>

      <Box
        sx={{
          display: "grid",
          gap: 2.5,
          width: "100%",
          gridTemplateColumns: {
            xs: "1fr",
            sm: "repeat(2, minmax(0, 1fr))",
            lg: "repeat(auto-fit, minmax(310px, 1fr))",
          },
        }}
      >
        {mockProductions.map((production) => (
          <ProductionCard key={production.id_url} production={production} />
        ))}
      </Box>
    </Box>
  );
}
