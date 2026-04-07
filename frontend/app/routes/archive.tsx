import { useState } from "react";
import { useTranslation } from "react-i18next";
import FilterSidebar from "~/shared/components/FilterSidebar";
import { ProductionTimeline } from "~/features/archive/components/ProductionTimeline";

export default function Archive() {
  const [showFilters, setShowFilters] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [dateFrom, setDateFrom] = useState("1970-01-01");
  const date = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  const [dateTo, setDateTo] = useState(
    `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
  );
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [selectedVenues, setSelectedVenues] = useState<string[]>([]);
  const [selectedArtists, setSelectedArtists] = useState<string[]>([]);

  const toggleMobileFilters = () => {
    setShowFilters((prev) => !prev);
  };

  const { t } = useTranslation();

  // De div met getoonde filters is tijdelijk en heeft dus geen i18n
  return (
    <div>
      <title>{t("nav.archive")} | VIERNULVIER</title>
      <h1 className="text-3xl font-bold">{t("archive.title")}</h1>

      <button
        onClick={toggleMobileFilters}
        className="bg-archive-ink/5 dark:bg-archive-ink-dark/5 border-archive-ink/10 mb-8 flex w-full cursor-pointer items-center justify-center space-x-3 rounded-xl border py-3 text-xs font-bold tracking-widest uppercase lg:hidden"
      >
        <svg
          className="h-4 w-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          data-darkreader-inline-stroke=""
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
          ></path>
        </svg>
        <span>Filteren & Zoeken</span>
      </button>
      <div className="relative mb-16 flex flex-col items-start gap-5 lg:flex-row">
        <FilterSidebar
          show={showFilters}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          dateTo={dateTo}
          setDateTo={setDateTo}
          dateFrom={dateFrom}
          setDateFrom={setDateFrom}
          selectedTags={selectedTags}
          setSelectedTags={setSelectedTags}
          selectedVenues={selectedVenues}
          setSelectedVenues={setSelectedVenues}
          selectedArtists={selectedArtists}
          setSelectedArtists={setSelectedArtists}
        />
        <div>
          <p>Search: {searchQuery}</p>
          <p>
            From: {dateFrom} - To: {dateTo}
          </p>
          <p>Tags: {selectedTags.join(", ")}</p>
          <p>Venues: {selectedVenues.join(", ")}</p>
          <p>Artists: {selectedArtists.join(", ")}</p>
        </div>
      </div>
      <ProductionTimeline productions={[]} />
    </div>
  );
}
