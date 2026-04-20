import React, { useState, useRef, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { getArtists } from "~/features/archive/services/artistService";
import { getHallByName } from "~/features/archive/services/hallService";
import { getAllTags, getTagByName } from "~/features/archive/services/tagService";
import type { Tag } from "~/features/archive/types/tagTypes";
import i18n from "~/i18n";
import FilterCard from "./FilterCard";
import SearchIcon from '@mui/icons-material/Search';
import ClearIcon from '@mui/icons-material/Clear';

interface SearchCardProps {
  searchQuery: string;
  setSearchQuery: React.Dispatch<React.SetStateAction<string>>;
}

const FilterSearchCard: React.FC<SearchCardProps> = ({
  searchQuery,
  setSearchQuery,
}) => {
  const { t } = useTranslation();

  return (
    <FilterCard title={t("filter.search")}>
      <div className="relative">
        <input
          type="text"
          placeholder={t("filter.search_in_collection")}
          className="archive-filter-input pr-9"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
	    <SearchIcon
          className="pointer-events-none absolute top-1/2 right-3 h-3.5 w-3.5 -translate-y-1/2 opacity-25"
		  fontSize="inherit"
		/>
      </div>
    </FilterCard>
  );
};

interface DateCardProps {
  dateFrom: string;
  setDateFrom: React.Dispatch<React.SetStateAction<string>>;
  dateTo: string;
  setDateTo: React.Dispatch<React.SetStateAction<string>>;
}

const FilterDateCard: React.FC<DateCardProps> = ({
  dateFrom,
  setDateFrom,
  dateTo,
  setDateTo,
}) => {
  const { t } = useTranslation();

  return (
    <FilterCard title={t("filter.period")}>
      <div className="grid grid-cols-1 gap-4">
        <div>
          <label className="mb-2 block text-[10px] font-bold tracking-widest uppercase opacity-40">
            {t("filter.from")}
          </label>
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="archive-filter-input"
          />
        </div>
        <div>
          <label className="mb-2 block text-[10px] font-bold tracking-widest uppercase opacity-40">
            {t("filter.to")}
          </label>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="archive-filter-input"
          />
        </div>
      </div>
    </FilterCard>
  );
};

interface TagCardProps {
  selectedTags: Tag[];
  setSelectedTags: React.Dispatch<React.SetStateAction<Tag[]>>;
}

const FilterTagCard: React.FC<TagCardProps> = ({ selectedTags, setSelectedTags }) => {
  const [tags, setTags] = useState<Tag[]>([]);
  const [popTags, setPopTags] = useState<Tag[]>([]);
  const [tagQuery, setTagQuery] = useState("");

  const { t } = useTranslation();

  const toggleTag = (tag: Tag) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const getLocalizedTagName = (tag: Tag): string => {
    const lang = i18n.language.startsWith("nl") ? "nl" : "en";
    const fallback = lang === "nl" ? "en" : "nl";
    return (
      tag.names.find((tn) => tn.language === lang)?.name ??
      tag.names.find((tn) => tn.language === fallback)?.name ??
      ""
    );
  };

  useEffect(() => {
    getAllTags().then(setTags).catch(console.error);
  }, []);

  useEffect(() => {
    const mostPopularTags = [
      "theater",
      "dans",
      "concert",
      "nightlife",
      "talks",
      "comedy",
      "monument",
      "circus",
      "performance",
      "spoken word",
      "listening session",
      "by viernulvier",
      "in de vooruit",
      "in club wintercircus",
      "op locatie",
      "met audiodescriptie",
      "relaxed performance",
      "met tolk vgt",
      "cadeaubon geldig",
    ];
    if (tags.length === 0) return;

    Promise.allSettled(mostPopularTags.map((name) => getTagByName(name))).then(
      (results) => {
        const successful = results
          .filter((r): r is PromiseFulfilledResult<Tag> => r.status === "fulfilled")
          .map((r) => r.value);
        setPopTags(successful);
      }
    );
  }, [tags]);

  return (
    <FilterCard title={t("filter.tags")}>
      <div className="space-y-4">
        <div className="sticky-scroll flex max-h-40 flex-wrap gap-2 overflow-y-auto pr-2 md:max-h-60">
          {popTags.map((tag) => (
            <button
              key={tag.id_url}
              onClick={() => toggleTag(tag)}
              className={`cursor-pointer rounded border px-2 py-1 text-[9px] font-medium tracking-wider whitespace-nowrap uppercase transition-all ${
                selectedTags.includes(tag)
                  ? "bg-archive-accent border-archive-accent text-white"
                  : "border-archive-ink/10 dark:border-archive-ink-dark/10 hover:border-archive-accent"
              }`}
            >
              {getLocalizedTagName(tag)}
            </button>
          ))}

          {tags
            .filter(
              (tag) =>
                selectedTags.includes(tag) &&
                !popTags.some((p) => p.id_url === tag.id_url)
            )
            .map((tag) => (
              <button
                key={tag.id_url}
                onClick={() => toggleTag(tag)}
                className="bg-archive-accent border-archive-accent cursor-pointer rounded border px-2 py-1 text-[9px] font-medium tracking-wider whitespace-nowrap text-white uppercase transition-all"
              >
                {getLocalizedTagName(tag)}
              </button>
            ))}
        </div>

        <div className="relative">
          <input
            type="text"
            placeholder={t("filter.search_tags")}
            className="archive-filter-input pr-9"
            value={tagQuery}
            onChange={(e) => setTagQuery(e.target.value)}
          />
	      <SearchIcon
            className="pointer-events-none absolute top-1/2 right-3 h-3.5 w-3.5 -translate-y-1/2 opacity-25"
		    fontSize="inherit"
		  />
          {tagQuery.trim().length > 0 && (
            <ul className="border-archive-ink/10 dark:border-archive-ink-dark/10 absolute right-0 left-0 z-10 overflow-hidden rounded-xl border bg-white shadow-lg dark:bg-neutral-900">
              {tags
                .filter((tag) =>
                  tag.names.some((tn) =>
                    tn.name.toLowerCase().includes(tagQuery.toLowerCase())
                  )
                )
                .map((tag) => (
                  <li
                    key={tag.id_url}
                    onMouseDown={() => {
                      toggleTag(tag);
                      setTagQuery("");
                    }}
                    className="hover:bg-archive-accent cursor-pointer px-4 py-2 text-[11px] font-medium transition-colors hover:text-white"
                  >
                    {getLocalizedTagName(tag)}
                  </li>
                ))}
            </ul>
          )}
        </div>
      </div>
    </FilterCard>
  );
};

interface HallCardProps {
  selectedHalls: string[];
  setSelectedHalls: React.Dispatch<React.SetStateAction<string[]>>;
}

const FilterHallCard: React.FC<HallCardProps> = ({
  selectedHalls,
  setSelectedHalls,
}) => {
  const [hallMap, setHallMap] = useState<Record<string, string>>({});

  const { t } = useTranslation();

  const toggleHall = (hall: string) => {
    setSelectedHalls((prev) =>
      prev.includes(hall) ? prev.filter((v) => v !== hall) : [...prev, hall]
    );
  };

  useEffect(() => {
    const searchHallNames = ["Balzaal", "Café", "Domzaal", "Filmzaal", "Theaterzaal"];

    Promise.all(
      searchHallNames.map(async (hall) => {
        try {
          const result = await getHallByName(hall);
          return [hall, result.id_url] as [string, string];
        } catch (error) {
          console.error(`Failed to fetch hall "${hall}":`, error);
          return null;
        }
      })
    ).then((entries) => {
      const map: Record<string, string> = Object.fromEntries(
        entries.filter((e): e is [string, string] => e !== null)
      );
      map["Andere locaties"] = "none";
      setHallMap(map);
    });
  }, []);

  return (
    <FilterCard title={t("filter.halls")}>
      <div className="space-y-3">
        {Object.keys(hallMap).map((hall) => (
          <label
            key={hall}
            className="group flex cursor-pointer items-center space-x-3"
          >
            <input
              type="checkbox"
              checked={selectedHalls.includes(hallMap[hall])}
              onChange={() => toggleHall(hallMap[hall])}
              className="border-archive-ink/20 text-archive-accent focus:ring-archive-accent cursor-pointer rounded"
            />
            <span className="text-xs font-medium opacity-60 transition-opacity group-hover:opacity-100">
              {hall}
            </span>
          </label>
        ))}
      </div>
    </FilterCard>
  );
};

interface ArtistCardProps {
  selectedArtists: string[];
  setSelectedArtists: React.Dispatch<React.SetStateAction<string[]>>;
  sidebarRef: React.RefObject<HTMLElement | null>;
}

const FilterArtistCard: React.FC<ArtistCardProps> = ({
  selectedArtists,
  setSelectedArtists,
  sidebarRef,
}) => {
  const [dropdownAbove, setDropdownAbove] = useState(false);
  const [artists, setArtists] = useState<string[]>([]);
  const [artistQuery, setArtistQuery] = useState("");

  const { t } = useTranslation();

  const artistInputRef = useRef<HTMLDivElement>(null);

  const selectArtist = (artist: string) => {
    if (!selectedArtists.includes(artist)) {
      setSelectedArtists((prev) => [...prev, artist]);
    }
    setArtistQuery("");
  };

  useEffect(() => {
    getArtists("nl").then(setArtists).catch(console.error);
  }, []);

  const filteredArtists =
    artistQuery.trim().length > 0
      ? artists.filter(
          (a) =>
            a.toLowerCase().includes(artistQuery.toLowerCase()) &&
            !selectedArtists.includes(a)
        )
      : [];

  useEffect(() => {
    if (sidebarRef.current && selectedArtists.length > 0) {
      sidebarRef.current.scrollTop = sidebarRef.current.scrollHeight;
    }
  }, [selectedArtists.length, sidebarRef]);

  useEffect(() => {
    if (filteredArtists.length === 0) return;
    const input = artistInputRef.current;
    const sidebar = sidebarRef.current;
    if (!input || !sidebar) return;

    const spaceBelow =
      sidebar.getBoundingClientRect().bottom - input.getBoundingClientRect().bottom;
    setDropdownAbove(spaceBelow < filteredArtists.length * 36);
  }, [filteredArtists.length, sidebarRef]);

  const removeArtist = (artist: string) => {
    setSelectedArtists((prev) => prev.filter((a) => a !== artist));
  };

  return (
    <FilterCard title={t("filter.artists")}>
      <div>
        <div className="relative" ref={artistInputRef}>
          <input
            type="text"
            placeholder={t("filter.search_artists")}
            className="archive-filter-input pr-9"
            value={artistQuery}
            onChange={(e) => setArtistQuery(e.target.value)}
          />
	      <SearchIcon
            className="pointer-events-none absolute top-1/2 right-3 h-3.5 w-3.5 -translate-y-1/2 opacity-25"
		    fontSize="inherit"
		  />
          {filteredArtists.length > 0 && (
            <ul
              className={`border-archive-ink/10 dark:border-archive-ink-dark/10 absolute right-0 left-0 z-10 overflow-hidden rounded-xl border bg-white shadow-lg dark:bg-neutral-900 ${dropdownAbove ? "bottom-full mb-1" : "top-full mt-1"}`}
            >
              {filteredArtists.map((artist) => (
                <li
                  key={artist}
                  onMouseDown={() => selectArtist(artist)}
                  className="hover:bg-archive-accent cursor-pointer px-4 py-2 text-[11px] font-medium transition-colors hover:text-white"
                >
                  {artist}
                </li>
              ))}
            </ul>
          )}
        </div>

        {selectedArtists.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {selectedArtists.map((artist) => (
              <span
                key={artist}
                className="bg-archive-accent inline-flex items-center gap-1.5 rounded px-2.5 py-1 text-[9px] font-medium tracking-wider text-white uppercase"
              >
                {artist}
                <button
                  onClick={() => removeArtist(artist)}
                  className="leading-none opacity-70 transition-opacity hover:opacity-100"
                >
                  <ClearIcon
                    className="h-2.5 w-2.5"
					fontSize="inherit"
                  />
                </button>
              </span>
            ))}
          </div>
        )}
      </div>
    </FilterCard>
  );
};

interface FilterSidebarProps {
  show: boolean;
  searchQuery: string;
  setSearchQuery: React.Dispatch<React.SetStateAction<string>>;
  dateFrom: string;
  setDateFrom: React.Dispatch<React.SetStateAction<string>>;
  dateTo: string;
  setDateTo: React.Dispatch<React.SetStateAction<string>>;
  selectedTags: Tag[];
  setSelectedTags: React.Dispatch<React.SetStateAction<Tag[]>>;
  selectedHalls: string[];
  setSelectedHalls: React.Dispatch<React.SetStateAction<string[]>>;
  selectedArtists: string[];
  setSelectedArtists: React.Dispatch<React.SetStateAction<string[]>>;
}

const FilterSidebar: React.FC<FilterSidebarProps> = ({
  show,
  searchQuery,
  setSearchQuery,
  dateFrom,
  setDateFrom,
  dateTo,
  setDateTo,
  selectedTags,
  setSelectedTags,
  selectedHalls,
  setSelectedHalls,
  selectedArtists,
  setSelectedArtists,
}) => {
  const sidebarRef = useRef<HTMLElement>(null);

  return (
    <aside
      ref={sidebarRef}
      id="archive-sidebar"
      className={`${show ? "block" : "hidden"} sticky-scroll mb-10 max-h-[calc(100vh-120px)] w-full space-y-6 overflow-y-auto pr-0 lg:sticky lg:top-24 lg:mb-0 lg:block lg:w-80 lg:overflow-y-auto lg:pr-4`}
    >
      <FilterSearchCard searchQuery={searchQuery} setSearchQuery={setSearchQuery} />
      <FilterDateCard
        dateFrom={dateFrom}
        setDateFrom={setDateFrom}
        dateTo={dateTo}
        setDateTo={setDateTo}
      />
      <FilterTagCard selectedTags={selectedTags} setSelectedTags={setSelectedTags} />
      <FilterHallCard
        selectedHalls={selectedHalls}
        setSelectedHalls={setSelectedHalls}
      />
      <FilterArtistCard
        selectedArtists={selectedArtists}
        setSelectedArtists={setSelectedArtists}
        sidebarRef={sidebarRef}
      />
    </aside>
  );
};

export default FilterSidebar;
