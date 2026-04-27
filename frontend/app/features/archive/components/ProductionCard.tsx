import ArrowRightAlt from "@mui/icons-material/ArrowRightAlt";
import {
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
import { useTranslation } from "react-i18next";
import { useNavigate, useParams } from "react-router";
import type { Production, ProductionInfo } from "../types/productionTypes";
import { useLocalizedPath } from "~/shared/hooks/useLocalizedPath";
import { formatDateDDMonYYYY } from "~/shared/utils/dateFormatting";

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

interface ProductionCardProps {
  production: Production;
  preferredLanguage?: string;
  className?: string;
}

function getProductionInfoByLanguage(
  productionInfos: ProductionInfo[],
  language: string
): ProductionInfo {
  const normalizedLanguage = language.toLowerCase();
  const baseLanguage = normalizedLanguage.split("-")[0]; // maybe later we have en-Us and en-GB

  const preferredLanguages = Array.from(
    new Set([normalizedLanguage, baseLanguage, "nl", "en"])
  );

  for (const preferred of preferredLanguages) {
    const languageMatch = productionInfos.find(
      (info) => info.language.toLowerCase() === preferred
    );

    if (languageMatch) {
      return languageMatch;
    }
  }

  return productionInfos[0];
}

function getTextOrDefault(value: string | null | undefined, fallback: string): string {
  return getOptionalText(value) ?? fallback;
}

function getOptionalText(value: string | null | undefined): string | undefined {
  if (typeof value !== "string") {
    return undefined;
  }

  const trimmedValue = value.trim();
  return trimmedValue.length > 0 ? trimmedValue : undefined;
}

function getTagNamesByLanguage(production: Production, language: string): string[] {
  if (!production.tags || production.tags.length === 0) {
    return DEFAULT_CARD_VALUES.tagNames;
  }

  return production.tags
    .map((tag) => {
      const languageMatch = tag.names.find((name) => name.language === language);
      return languageMatch?.name ?? tag.names[0]?.name;
    })
    .filter((name): name is string => typeof name === "string" && name.length > 0);
}

function getProductionNumericIdFromUrl(idUrl: string): string | undefined {
  const match = idUrl.match(/\/productions\/(\d+)(?:[/?#]|$)/);
  return match?.[1];
}

function getProductionStartLabel(
  production: Production,
  lang?: string
): string | undefined {
  if (!production.earliest_at || !production.latest_at) {
    return;
  }

  const earliest_date = new Date(production.earliest_at);
  const latest_date = new Date(production.latest_at);

  const firstStr = formatDateDDMonYYYY(earliest_date, lang);
  const lastStr = formatDateDDMonYYYY(latest_date, lang);

  // If production only ocurred on a single day, we only list that day
  if (
    earliest_date.getUTCFullYear() === latest_date.getUTCFullYear() &&
    earliest_date.getMonth() === latest_date.getMonth() &&
    earliest_date.getDate() === latest_date.getDate()
  ) {
    return firstStr;
  } else {
    return `${firstStr} - ${lastStr}`;
  }
}

function getVenues(production: Production): string[] | undefined {
  if (!production.events?.length) return;

  const halls = production.events
    .map((e) => e.hall?.name)
    .filter((name): name is string => !!name);

  if (halls.length === 0) return;

  // Remove duplicates
  const uniqueHalls = Array.from(new Set(halls));

  return uniqueHalls;
}

export function ProductionCard({
  production,
  preferredLanguage = "nl",
  className,
}: ProductionCardProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const lp = useLocalizedPath();
  const { lang } = useParams();
  if (!preferredLanguage) preferredLanguage = lang || "nl";
  const defaultCardValues = {
    title: t("archive.card.defaults.title"),
    dateLabel: t("archive.card.defaults.dateLabel"),
    venueLabel: t("archive.card.defaults.venueLabel"),
    imageUrl: DEFAULT_CARD_VALUES.imageUrl,
    tagNames: DEFAULT_CARD_VALUES.tagNames,
  };

  const primaryInfo = getProductionInfoByLanguage(
    production.production_infos,
    preferredLanguage
  );
  const title = getTextOrDefault(primaryInfo?.title, defaultCardValues.title);
  const supertitle = getOptionalText(primaryInfo?.supertitle);
  const artist = getOptionalText(primaryInfo?.artist);
  const tagline = getOptionalText(primaryInfo?.tagline) ?? "";
  const dateLabel = getTextOrDefault(
    getProductionStartLabel(production, preferredLanguage),
    defaultCardValues.dateLabel
  );
  const dateParts = dateLabel.split(" - ");
  const venues = getVenues(production);
  const imageUrl = getTextOrDefault(
    (production as { image_url?: string }).image_url,
    defaultCardValues.imageUrl
  );
  const tagNames = getTagNamesByLanguage(production, preferredLanguage);

  const productionId = getProductionNumericIdFromUrl(production.id_url);

  const handleOpenDetails = () => {
    if (!productionId) {
      return;
    }

    navigate(lp(`/archive/productions/${productionId}`));
  };

  return (
    <Card
      onClick={handleOpenDetails}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          handleOpenDetails();
        }
      }}
      role="button"
      tabIndex={0}
      aria-label={`Open details for ${title}`}
      className={className}
      sx={{
        "height": "100%",
        "display": "flex",
        "flexDirection": "column",
        "borderRadius": 4,
        "overflow": "hidden",
        "cursor": "pointer",
        "background": `linear-gradient(180deg, ${CARD_COLORS.surfaceStart} 0%, ${CARD_COLORS.surfaceEnd} 100%)`,
        "color": CARD_COLORS.textPrimary,
        "border": `1px solid ${colorWithOpacity(CARD_COLORS.accent, 0.12)}`,
        "transition": `transform ${CARD_MOTION.transitionDuration} ${CARD_MOTION.transitionEasing}, box-shadow ${CARD_MOTION.transitionDuration} ${CARD_MOTION.transitionEasing}`,
        "&:hover": {
          transform: "translateY(-2px)",
          boxShadow: `0 16px 36px ${colorWithOpacity(CARD_COLORS.ink, 0.1)}`,
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
        "&:hover .production-card-supertitle": {
          color: "var(--color-archive-paper) !important",
        },
      }}
      elevation={0}
    >
      <Box sx={{ position: "relative", overflow: "hidden" }}>
        <CardMedia
          className="production-card-image"
          component="img"
          height="236"
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
            className="production-card-text production-card-supertitle"
            label={supertitle.toUpperCase()}
            size="small"
            sx={{
              position: "absolute",
              top: 12,
              left: 12,
              height: 28,
              borderRadius: 999,
              backgroundColor: "var(--color-archive-ink)",
              color: "var(--color-archive-paper)",
              fontWeight: "var(--weight-archive-bold)",
              letterSpacing: "var(--tracking-archive-label)",
              border: `1px solid ${colorWithOpacity(CARD_COLORS.accent, 0.25)}`,
            }}
          />
        ) : null}
      </Box>

      <CardContent
        className="production-card-content"
        sx={{
          flexGrow: 1,
          px: 2.5,
          py: 1.5,
          display: "flex",
          flexDirection: "column",
          height: "100%",
          transform: "translateY(0)",
          transition: `transform ${CARD_MOTION.transitionDuration} ${CARD_MOTION.transitionEasing}`,
          willChange: "transform",
        }}
      >
        <Box sx={{ display: "flex", flexDirection: "column", flexGrow: 1 }}>
          <Stack direction="row" justifyContent="space-between" sx={{ mb: 1.1 }}>
            <Typography
              className="production-card-text"
              sx={{
                color: CARD_COLORS.accent,
                fontSize: "var(--text-archive-meta)",
                letterSpacing: "var(--tracking-archive-meta)",
                fontWeight: "var(--weight-archive-semibold)",
                textTransform: "uppercase",
                display: "flex",
                flexDirection: { xs: "column", md: "row" },
                alignItems: { xs: "flex-start", md: "center" },
                gap: { xs: 0, sm: 0.5 },
              }}
            >
              {dateParts.length === 1 ? (
                dateParts[0]
              ) : (
                <>
                  <span className="text-center">{dateParts[0]}</span>

                  <span className="block min-w-4 text-center"> - </span>

                  <span className="text-center">{dateParts[1]}</span>
                </>
              )}
            </Typography>

            <Typography
              className="production-card-text"
              sx={{
                color: colorWithOpacity(CARD_COLORS.accent, 0.92),
                fontSize: "var(--text-archive-meta)",
                letterSpacing: "var(--tracking-archive-label)",
                textTransform: "uppercase",
              }}
            >
              {venues &&
                venues.map((venue) => <p className="text-nowrap">@ {venue}</p>)}
            </Typography>
          </Stack>

          <Box
            sx={{
              mb: 1.2,
              minHeight: { xs: 168, md: 184 },
              display: "flex",
              flexDirection: "column",
              flexGrow: 1,
            }}
          >
            <Typography
              className="production-card-text"
              component="h3"
              sx={{
                mb: 0.7,
                pb: "0.09em",
                fontFamily: "var(--font-serif)",
                fontSize: "var(--text-archive-title-lg)",
                lineHeight: "var(--leading-archive-title)",
                color: CARD_COLORS.textPrimary,
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
                className="production-card-text archive-artist-chic"
                sx={{
                  mb: 0.5,
                  color: colorWithOpacity(CARD_COLORS.textSecondary, 0.95),
                  fontSize: "var(--text-archive-body)",
                  display: "-webkit-box",
                  WebkitLineClamp: 1,
                  WebkitBoxOrient: "vertical",
                  overflow: "hidden",
                }}
              >
                {artist}
              </Typography>
            ) : null}

            <Box
              sx={{
                minHeight:
                  "calc(var(--text-archive-body) * var(--leading-archive-body) * 4)",
                display: "flex",
                alignItems: "center",
                flexGrow: 1,
              }}
            >
              <Typography
                className="production-card-text"
                sx={{
                  width: "100%",
                  color: CARD_COLORS.textSecondary,
                  fontSize: "var(--text-archive-body)",
                  lineHeight: "var(--leading-archive-body)",
                  display: "-webkit-box",
                  WebkitLineClamp: artist ? 4 : 5,
                  WebkitBoxOrient: "vertical",
                  overflow: "hidden",
                  overflowWrap: "anywhere",
                }}
              >
                {tagline || ""}
              </Typography>
            </Box>
          </Box>
        </Box>

        <Divider
          sx={{ borderColor: colorWithOpacity(CARD_COLORS.accent, 0.15), mb: 1.1 }}
        />

        <Stack
          direction="row"
          spacing={0.8}
          useFlexGap
          flexWrap="wrap"
          sx={{ mb: 1.2 }}
        >
          {tagNames.map((tag) => (
            <Chip
              className="production-card-text"
              key={tag}
              size="small"
              label={tag.toUpperCase()}
              sx={{
                borderRadius: 1,
                background: "transparent",
                border: `1px solid ${colorWithOpacity(CARD_COLORS.accent, 0.24)}`,
                color: colorWithOpacity(CARD_COLORS.textSecondary, 0.86),
                letterSpacing: "var(--tracking-archive-label)",
                height: 22,
              }}
            />
          ))}
        </Stack>

        <Stack direction="row" alignItems="center" justifyContent="flex-end">
          <Link
            className="production-card-text"
            component="span"
            underline="none"
            sx={{
              color: colorWithOpacity(CARD_COLORS.accent, 0.98),
              fontWeight: "var(--weight-archive-bold)",
              textTransform: "uppercase",
              letterSpacing: "var(--tracking-archive-label)",
              fontSize: "var(--text-archive-meta)",
              cursor: "pointer",
            }}
          >
            Details <ArrowRightAlt />
          </Link>
        </Stack>
      </CardContent>
    </Card>
  );
}

export interface ProductionCardGridProps {
  productions: Production[];
}

export function ProductionCardGrid({ productions }: ProductionCardGridProps) {
  return (
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
      {productions.map((production) => (
        <ProductionCard key={production.id_url} production={production} />
      ))}
    </Box>
  );
}
