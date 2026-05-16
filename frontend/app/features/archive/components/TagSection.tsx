import { useEffect, useRef, useState, type ReactNode } from "react";
import { useParams } from "react-router";
import { getAllTags } from "../services/tagService";
import type { Tag } from "../types/tagTypes";
import { useTranslation } from "react-i18next";
import { useClickOutside } from "~/shared/hooks/useClickOutside";

import Add from "@mui/icons-material/Add";
import Close from "@mui/icons-material/Close";

// prefer active language, then dutch, then first available tag name
function getTagNameByLanguage(tag: Tag, language: string) {
  let fallback = tag.names[0]?.name;
  for (const name of tag.names) {
    if (name.language === language) return name.name;
    if (name.language === "nl") fallback = name.name;
  }
  return fallback;
}

type TagListItemProps = React.LiHTMLAttributes<HTMLLIElement> & {
  children: ReactNode;
};
function TagListItem({ className, children, ...props }: TagListItemProps) {
  return (
    <li
      className={`bg-archive-control flex items-center gap-2 rounded-full border border-[color-mix(in_srgb,var(--archive-accent)_24%,transparent)] px-4 py-1.5 text-[0.68rem] tracking-[--archive-tracking-label] uppercase ${className}`}
      {...props}
    >
      {children}
    </li>
  );
}

type TagsProps = {
  performer_type?: string;
  originalTags: Tag[];
  isEditing?: boolean;
  draftTags: Tag[];
  preferredLanguage?: string;
  setDraftTags: React.Dispatch<React.SetStateAction<Tag[]>>;
};

function TagDropdown({
  isLoading,
  allTags,
  selectedTags,
  setSelectedTags,
  setIsOpen,
  language,
}: {
  isLoading?: boolean;
  allTags: Tag[];
  selectedTags: Tag[];
  setSelectedTags: React.Dispatch<React.SetStateAction<Tag[]>>;
  setIsOpen: React.Dispatch<React.SetStateAction<boolean>>;
  language: string;
}) {
  const { t } = useTranslation();
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [search, setSearch] = useState("");
  function addTag(tag: Tag) {
    setSelectedTags((prev) => {
      const alreadyExists = prev.some((t) => t.id_url === tag.id_url);

      if (alreadyExists) {
        return prev;
      }

      return [...prev, tag];
    });

    setSearch("");
    setIsOpen(false);
  }
  const filteredTags = allTags.filter((tag) => {
    const localizedName = getTagNameByLanguage(tag, language);

    if (!localizedName) {
      return false;
    }

    const matchesSearch = localizedName.toLowerCase().includes(search.toLowerCase());

    const alreadySelected = selectedTags.some(
      (draftTag) => draftTag.id_url === tag.id_url
    );

    return matchesSearch && !alreadySelected;
  });

  useClickOutside(dropdownRef, () => {
    setIsOpen(false);
    setSearch("");
  });

  return (
    <div
      ref={dropdownRef}
      data-testid="tag-dropdown"
      className="bg-archive-paper absolute z-50 mt-3 w-72 rounded-xl border border-white/10 p-3 shadow-2xl"
    >
      <input
        type="text"
        placeholder={t("productionPage.edit.search_tags")}
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="bg-archive-control mb-3 w-full rounded-lg px-3 py-2 text-sm outline-none"
        autoFocus
      />

      {isLoading ? (
        <li className="px-3 py-2 text-sm opacity-60">{t("loading")}</li>
      ) : (
        <ul className="max-h-64 overflow-y-auto">
          {filteredTags.map((tag) => (
            <li key={tag.id_url}>
              <button
                className="hover:bg-archive-control w-full cursor-pointer rounded-lg px-3 py-2 text-left text-sm transition"
                onClick={() => addTag(tag)}
              >
                {getTagNameByLanguage(tag, language)}
              </button>
            </li>
          ))}

          {filteredTags.length === 0 && (
            <li className="px-3 py-2 text-sm opacity-60">
              {t("productionPage.edit.no_tags")}
            </li>
          )}
        </ul>
      )}
    </div>
  );
}

export default function Tags({
  performer_type,
  originalTags,
  draftTags,
  setDraftTags,
  isEditing,
  preferredLanguage,
}: TagsProps) {
  const { lang } = useParams();
  const language = preferredLanguage ?? lang!;

  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const [allTags, setAllTags] = useState<Tag[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  useEffect(() => {
    if (!isEditing) return;

    getAllTags()
      .then(setAllTags)
      .catch(() => setAllTags([]))
      .finally(() => setIsLoading(false));
  }, [isEditing]);

  function removeTag(id_url: string) {
    setDraftTags((prev) => prev.filter((tag) => tag.id_url !== id_url));
  }

  return (
    <section id="production-tags" aria-label="Production tags">
      {isEditing && (
        <div className="flex items-center gap-2">
          <p className="font-bold underline">Tags</p>
        </div>
      )}

      <ul className="mt-6 flex flex-wrap gap-2">
        {/* Performer type badge */}
        {performer_type && (
          <TagListItem
            id="tag-performer-type"
            aria-label="Performer type"
            className="font-semibold"
          >
            {performer_type}
          </TagListItem>
        )}

        {/* existing tags */}
        {!isEditing
          ? originalTags.map((tag) => (
              <TagListItem key={tag.id_url} aria-label="Tag">
                {getTagNameByLanguage(tag, language)}
              </TagListItem>
            ))
          : draftTags.map((tag) => (
              <TagListItem key={tag.id_url}>
                {getTagNameByLanguage(tag, language)}
                <Close
                  aria-label={`remove-${getTagNameByLanguage(tag, language)}`}
                  sx={{ fontSize: "1rem" }}
                  className="cursor-pointer text-red-500"
                  onClick={() => removeTag(tag.id_url)}
                />
              </TagListItem>
            ))}

        {/* Add tag button */}
        {isEditing && (
          <button
            className="cursor-pointer"
            onClick={() => setIsDropdownOpen((prev) => !prev)}
          >
            <TagListItem key="add-tag" aria-label="Add Tag">
              <Add sx={{ fontSize: "1rem" }} className="text-archive-accent/90" />
            </TagListItem>
          </button>
        )}
        {isDropdownOpen && (
          <TagDropdown
            isLoading={isLoading}
            allTags={allTags}
            selectedTags={draftTags}
            setSelectedTags={setDraftTags}
            setIsOpen={setIsDropdownOpen}
            language={language}
          />
        )}
      </ul>
    </section>
  );
}
