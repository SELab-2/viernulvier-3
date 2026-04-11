import React, { useState, useRef, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { getAllTags, getTagByName } from "~/features/archive/services/tagService"
import type { Tag } from "~/features/archive/types/tagTypes";
import i18n from "~/i18n";

interface Props {
  show: boolean;
  searchQuery: string;
  setSearchQuery: React.Dispatch<React.SetStateAction<string>>;
  dateFrom: string;
  setDateFrom: React.Dispatch<React.SetStateAction<string>>;
  dateTo: string;
  setDateTo: React.Dispatch<React.SetStateAction<string>>;
  selectedTags: Tag[];
  setSelectedTags: React.Dispatch<React.SetStateAction<Tag[]>>;
  selectedVenues: string[];
  setSelectedVenues: React.Dispatch<React.SetStateAction<string[]>>;
  selectedArtists: string[];
  setSelectedArtists: React.Dispatch<React.SetStateAction<string[]>>;
}

const FilterSidebar: React.FC<Props> = ({
  show,
  searchQuery,
  setSearchQuery,
  dateFrom,
  setDateFrom,
  dateTo,
  setDateTo,
  selectedTags,
  setSelectedTags,
  selectedVenues,
  setSelectedVenues,
  selectedArtists,
  setSelectedArtists,
}) => {
  const [tagOpen, setTagOpen] = useState(false);
  const [dateOpen, setDateOpen] = useState(false);
  const [venuesOpen, setVenuesOpen] = useState(false);
  const [artistsOpen, setArtistsOpen] = useState(false);
  const [artistQuery, setArtistQuery] = useState("");
  const [dropdownAbove, setDropdownAbove] = useState(false);
  const [tags, setTags] = useState<Tag[]>([]);
  const [popTags, setPopTags] = useState<Tag[]>([]);
  const [tagQuery, setTagQuery] = useState("");


  const sidebarRef = useRef<HTMLElement>(null);
  const artistInputRef = useRef<HTMLDivElement>(null);

  const toggleTag = (tag: Tag) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const toggleVenue = (venue: string) => {
    setSelectedVenues((prev) =>
      prev.includes(venue) ? prev.filter((v) => v !== venue) : [...prev, venue]
    );
  };

  const selectArtist = (artist: string) => {
    if (!selectedArtists.includes(artist)) {
      setSelectedArtists((prev) => [...prev, artist]);
    }
    setArtistQuery("");
  };

  const removeArtist = (artist: string) => {
    setSelectedArtists((prev) => prev.filter((a) => a !== artist));
  };

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
	  "cadeaubon geldig"
  ];

  useEffect(() => {
	  const fetchTags = async () => {
		  const result = await getAllTags();
		  setTags(result);
	  }
	  fetchTags();
  }, []);

  useEffect(() => {
	  if (tags.length === 0) return;

	  const fetchPopularTags = async () => {
		  const results = await Promise.all(
			  mostPopularTags.map((name) => getTagByName(name))
		  );
		  setPopTags(results);
	  };

	  fetchPopularTags();
  }, [tags]);

  // Hardcoded as most popular venues, but maybe only the ids and use service to get them
  const venues = [
    "Balzaal",
    "Café",
    "Domzaal",
    "Filmzaal",
    "Theaterzaal",
    "Andere locaties",
  ];

  // Get artists from service
  const artists = [
    "Alain Platel",
    "Anne Teresa De Keersmaeker",
    "FC Bergman",
    "Jan Decorte",
    "Josse De Pauw",
    "Luc Tuymans",
    "Meg Stuart",
    "Needcompany",
    "Ontroerend Goed",
    "Peeping Tom",
    "Sidi Larbi Cherkaoui",
    "Wim Vandekeybus",
  ];

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
  }, [selectedArtists.length]);

  useEffect(() => {
    if (filteredArtists.length === 0) return;

    const input = artistInputRef.current;
    const sidebar = sidebarRef.current;
    if (!input || !sidebar) return;

    const inputRect = input.getBoundingClientRect();
    const sidebarRect = sidebar.getBoundingClientRect();
    const estimatedDropdownHeight = filteredArtists.length * 36;

    const spaceBelow = sidebarRect.bottom - inputRect.bottom;
    setDropdownAbove(spaceBelow < estimatedDropdownHeight);
  }, [filteredArtists.length]);

  const getLocalizedTagName = (tag: Tag): string => {
	const lang = i18n.language.startsWith("nl") ? "nl" : "en";
	const fallback = lang === "nl" ? "en" : "nl";

	return (
	  tag.names.find((tn) => tn.language === lang)?.name ??
	  tag.names.find((tn) => tn.language === fallback)?.name ??
	  ""
	);
  };

  const { t } = useTranslation();

  return (
    <aside
      ref={sidebarRef}
      id="archive-sidebar"
      className={`${show ? "block" : "hidden"} sticky-scroll mb-10 max-h-[calc(100vh-120px)] w-full space-y-6 overflow-y-auto pr-0 lg:sticky lg:top-24 lg:mb-0 lg:block lg:w-80 lg:overflow-y-auto lg:pr-4`}
    >
      <div className="bg-archive-ink/5 dark:bg-archive-ink-dark/5 border-archive-ink/5 dark:border-archive-ink-dark/5 rounded-2xl border p-6 shadow-sm">
        <h3 className="mb-4 text-xs font-bold tracking-[0.2em] uppercase opacity-40 md:mb-6">
          {t("filter.search")}
        </h3>
        <div className="relative">
          <input
            type="text"
            placeholder={t("filter.search_in_collection")}
            className="archive-filter-input pr-9"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <svg
            className="pointer-events-none absolute top-1/2 right-3 h-3.5 w-3.5 -translate-y-1/2 opacity-25"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </div>
      </div>

      <div className="bg-archive-ink/5 dark:bg-archive-ink-dark/5 border-archive-ink/5 dark:border-archive-ink-dark/5 rounded-2xl border p-6 shadow-sm">
        <div
          className={`group flex cursor-pointer items-center justify-between ${dateOpen ? "mb-6" : ""}`}
          onClick={() => setDateOpen((prev) => !prev)}
        >
          <h3 className="cursor-pointer text-xs font-bold tracking-[0.2em] uppercase opacity-40">
            {t("filter.period")}
          </h3>
          <svg
            className={`h-3 w-3 opacity-30 transition-transform group-hover:opacity-100 ${dateOpen ? "rotate-180" : ""}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </div>
        {dateOpen && (
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
        )}
      </div>

      <div className="bg-archive-ink/5 dark:bg-archive-ink-dark/5 border-archive-ink/5 dark:border-archive-ink-dark/5 rounded-2xl border p-6 shadow-sm">
        <div
          className={`group flex cursor-pointer items-center justify-between ${tagOpen ? "mb-6" : ""}`}
          onClick={() => setTagOpen((prev) => !prev)}
        >
          <h3 className="cursor-pointer text-xs font-bold tracking-[0.2em] uppercase opacity-40">
            {t("filter.tags")}
          </h3>
          <svg
            className={`h-3 w-3 opacity-30 transition-transform group-hover:opacity-100 ${tagOpen ? "rotate-180" : ""}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </div>
		{tagOpen && (
		  <div className="space-y-4">
			<div className="sticky-scroll flex max-h-40 flex-wrap gap-2 overflow-y-auto pr-2 md:max-h-60">
			  {popTags.map((tag) => (
				<button
				  key={tag.id}
				  onClick={() => toggleTag(tag)}
				  className={`cursor-pointer rounded border px-2 py-1 text-[9px] font-medium tracking-wider whitespace-nowrap uppercase transition-all ${selectedTags.includes(tag) ? "bg-archive-accent border-archive-accent text-white" : "border-archive-ink/10 dark:border-archive-ink-dark/10 hover:border-archive-accent"}`}
				>
				  {getLocalizedTagName(tag)}
				</button>
			  ))}

			  {tags
				.filter(
				  (tag) =>
					selectedTags.includes(tag) &&
					!popTags.some((p) => p.id === tag.id)
				)
				.map((tag) => (
				  <button
					key={tag.id}
					onClick={() => toggleTag(tag)}
					className="bg-archive-accent border-archive-accent cursor-pointer rounded border px-2 py-1 text-[9px] font-medium tracking-wider whitespace-nowrap uppercase text-white transition-all"
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
			  <svg
				className="pointer-events-none absolute top-1/2 right-3 h-3.5 w-3.5 -translate-y-1/2 opacity-25"
				fill="none"
				stroke="currentColor"
				viewBox="0 0 24 24"
			  >
				<path
				  strokeLinecap="round"
				  strokeLinejoin="round"
				  strokeWidth={2}
				  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
				/>
			  </svg>
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
						key={tag.id}
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
		)}
	  </div>

      <div className="bg-archive-ink/5 dark:bg-archive-ink-dark/5 border-archive-ink/5 dark:border-archive-ink-dark/5 rounded-2xl border p-6 shadow-sm">
        <div
          className={`group flex cursor-pointer items-center justify-between ${venuesOpen ? "mb-6" : ""}`}
          onClick={() => setVenuesOpen((prev) => !prev)}
        >
          <h3 className="cursor-pointer text-xs font-bold tracking-[0.2em] uppercase opacity-40">
            {t("filter.venues")}
          </h3>
          <svg
            className={`h-3 w-3 opacity-30 transition-transform group-hover:opacity-100 ${venuesOpen ? "rotate-180" : ""}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </div>
        {venuesOpen && (
          <div className="space-y-3">
            {venues.map((venue) => (
              <label
                key={venue}
                className="group flex cursor-pointer items-center space-x-3"
              >
                <input
                  type="checkbox"
                  checked={selectedVenues.includes(venue)}
                  onChange={() => toggleVenue(venue)}
                  className="border-archive-ink/20 text-archive-accent focus:ring-archive-accent cursor-pointer rounded"
                />
                <span className="text-xs font-medium opacity-60 transition-opacity group-hover:opacity-100">
                  {venue}
                </span>
              </label>
            ))}
          </div>
        )}
      </div>

      <div className="bg-archive-ink/5 dark:bg-archive-ink-dark/5 border-archive-ink/5 dark:border-archive-ink-dark/5 rounded-2xl border p-6 shadow-sm">
        <div
          className={`group flex cursor-pointer items-center justify-between ${artistsOpen ? "mb-6" : ""}`}
          onClick={() => setArtistsOpen((prev) => !prev)}
        >
          <h3 className="cursor-pointer text-xs font-bold tracking-[0.2em] uppercase opacity-40">
            {t("filter.artists")}
          </h3>
          <svg
            className={`h-3 w-3 opacity-30 transition-transform group-hover:opacity-100 ${artistsOpen ? "rotate-180" : ""}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </div>
        {artistsOpen && (
          <div>
            <div className="relative" ref={artistInputRef}>
              <input
                type="text"
                placeholder={t("filter.search_artists")}
                className="archive-filter-input pr-9"
                value={artistQuery}
                onChange={(e) => setArtistQuery(e.target.value)}
              />
              <svg
                className="pointer-events-none absolute top-1/2 right-3 h-3.5 w-3.5 -translate-y-1/2 opacity-25"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
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
                      <svg
                        className="h-2.5 w-2.5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2.5}
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </aside>
  );
};

export default FilterSidebar;
