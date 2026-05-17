import { useEffect, useRef, useState, type ReactNode } from "react";
import { useParams } from "react-router";
import { getAllTags } from "../services/tagService";
import type { Tag } from "../types/tagTypes";
import { useTranslation } from "react-i18next";
import { useClickOutside } from "~/shared/hooks/useClickOutside";

import Check from "@mui/icons-material/Check";
import Add from "@mui/icons-material/Add";
import Close from "@mui/icons-material/Close";
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
} from "@mui/material";
import { ArchiveTextField } from "~/shared/components/ArchiveTextField";
import {
  dialogActionsSx,
  dialogBackdropSx,
  dialogContentSx,
  dialogPaperSx,
  dialogTitleSx,
  primaryButtonSx,
  secondaryButtonSx,
} from "~/features/users/pages/UserManagementPage";

// prefer active language, then dutch, then first available tag name
function getTagNameByLanguage(tag: Tag, language: string) {
  let fallback = tag.names[0]?.name;
  for (const name of tag.names) {
    if (name.language === language) return name.name;
    if (name.language === "nl") fallback = name.name;
  }
  return fallback;
}

function CreateTagDialog({
  preferredLanguage,
  initialValue,
  isOpen,
  setIsOpen,
  onSubmit,
  allTags,
}: {
  preferredLanguage: string;
  initialValue?: string;
  isOpen: boolean;
  setIsOpen: React.Dispatch<React.SetStateAction<boolean>>;
  onSubmit: (dutchName: string, EnglishName: string) => void;
  allTags: Tag[];
}) {
  const { t } = useTranslation();
  const [dutchName, setDutchName] = useState(
    preferredLanguage === "nl" ? (initialValue ?? "") : ""
  );
  const [englishName, setEnglishName] = useState(
    preferredLanguage === "en" ? (initialValue ?? "") : ""
  );
  function onClose() {
    setIsOpen(false);
  }

  function normalize(value: string) {
    return value.trim().toLowerCase();
  }

  const duplicateDutchTag = allTags.find((tag) =>
    tag.names.some((name) => normalize(name.name) === normalize(dutchName))
  );

  const duplicateEnglishTag = allTags.find((tag) =>
    tag.names.some((name) => normalize(name.name) === normalize(englishName))
  );

  const hasDuplicate =
    (!!dutchName.trim() && !!duplicateDutchTag) ||
    (!!englishName.trim() && !!duplicateEnglishTag);

  return (
    <Dialog
      open={isOpen}
      onClose={onClose}
      fullWidth
      maxWidth="sm"
      slotProps={{
        paper: { sx: dialogPaperSx },
        backdrop: { sx: dialogBackdropSx },
      }}
    >
      <DialogTitle sx={dialogTitleSx}>
        {t("productionPage.edit.create_tag")}
      </DialogTitle>
      <DialogContent sx={dialogContentSx}>
        <p className="mb-2 text-sm leading-relaxed text-[color:var(--archive-ink)] opacity-70">
          {t("productionPage.edit.create_tag_description", { username: "" })}
        </p>

        <form
          id={"create-tag-form-dialog"}
          onSubmit={() => {}}
          className="mt-6 flex flex-col gap-5"
        >
          <ArchiveTextField
            label={t("productionPage.edit.dutch_tag_name")}
            autoFocus
            value={dutchName}
            error={!!duplicateDutchTag}
            helperText={
              duplicateDutchTag ? t("productionPage.edit.tag_already_exists") : ""
            }
            onChange={(event) => {
              setDutchName(event.target.value);
            }}
          />
          <ArchiveTextField
            label={t("productionPage.edit.english_tag_name")}
            autoFocus
            value={englishName}
            error={!!duplicateEnglishTag}
            helperText={
              duplicateEnglishTag ? t("productionPage.edit.tag_already_exists") : ""
            }
            onChange={(event) => {
              setEnglishName(event.target.value);
            }}
          />
        </form>
      </DialogContent>
      <DialogActions sx={dialogActionsSx}>
        <Button
          sx={secondaryButtonSx}
          onClick={() => {
            setIsOpen(false);
          }}
        >
          {t("users.actions.cancel")}
        </Button>

        <Button
          sx={primaryButtonSx}
          disabled={hasDuplicate}
          onClick={() => onSubmit(dutchName, englishName)}
        >
          {t("productionPage.edit.create")}
        </Button>
      </DialogActions>
    </Dialog>
  );
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
  newTags: Tag[];
  preferredLanguage?: string;
  setDraftTags: React.Dispatch<React.SetStateAction<Tag[]>>;
  setNewTags: React.Dispatch<React.SetStateAction<Tag[]>>;
};

function TagDropdown({
  isLoading,
  allTags,
  selectedTags,
  setSelectedTags,
  setIsCreateTagDialogOpen,
  setInitialTagDialogValue,
  setIsOpen,
  language,
}: {
  isLoading?: boolean;
  allTags: Tag[];
  selectedTags: Tag[];
  setSelectedTags: React.Dispatch<React.SetStateAction<Tag[]>>;
  setIsOpen: React.Dispatch<React.SetStateAction<boolean>>;
  setIsCreateTagDialogOpen: React.Dispatch<React.SetStateAction<boolean>>;
  setInitialTagDialogValue: React.Dispatch<React.SetStateAction<string>>;
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

    return localizedName.toLowerCase().includes(search.toLowerCase());
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
          {filteredTags.map((tag) => {
            const isSelected = selectedTags.some(
              (draftTag) => draftTag.id_url === tag.id_url
            );

            return (
              <li key={tag.id_url}>
                <button
                  className="hover:bg-archive-control flex w-full cursor-pointer items-center justify-between rounded-lg px-3 py-2 text-left text-sm transition"
                  onClick={() => addTag(tag)}
                >
                  <span>{getTagNameByLanguage(tag, language)}</span>

                  {isSelected && (
                    <Check sx={{ fontSize: "1rem" }} className="text-archive-accent" />
                  )}
                </button>
              </li>
            );
          })}

          {search.length > 0 && (
            <li>
              <button
                className="hover:bg-archive-control text-archive-accent flex w-full cursor-pointer items-center rounded-lg px-3 py-2 text-left text-sm transition"
                onClick={() => {
                  setInitialTagDialogValue(search);
                  setIsCreateTagDialogOpen(true);
                }}
              >
                <Add />
                {t("productionPage.edit.create_new_tag", { tag: search })}
              </button>
            </li>
          )}

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
  newTags,
  setNewTags,
  isEditing,
  preferredLanguage,
}: TagsProps) {
  const { lang } = useParams();
  const language = preferredLanguage ?? lang!;

  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isCreateTagDialogOpen, setIsCreateTagDialogOpen] = useState(false);
  const [initalTagDialogValue, setInitialTagDialogValue] = useState("");

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
  function removeNewTag(id_url: string) {
    setNewTags((prev) => prev.filter((tag) => tag.id_url !== id_url));
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

        {isEditing &&
          newTags &&
          newTags.map((tag) => (
            <TagListItem key={tag.id_url}>
              {getTagNameByLanguage(tag, language)}
              <Close
                aria-label={`remove-${getTagNameByLanguage(tag, language)}`}
                sx={{ fontSize: "1rem" }}
                className="cursor-pointer text-red-500"
                onClick={() => removeNewTag(tag.id_url)}
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

        <CreateTagDialog
          key={`${language}-${initalTagDialogValue}`}
          preferredLanguage={language}
          initialValue={initalTagDialogValue}
          allTags={[...allTags, ...newTags]}
          isOpen={isCreateTagDialogOpen}
          setIsOpen={setIsCreateTagDialogOpen}
          onSubmit={(dutchName, englishName) => {
            const names = [];

            if (dutchName.trim()) {
              names.push({
                language: "nl",
                name: dutchName.trim(),
              });
            }

            if (englishName.trim()) {
              names.push({
                language: "en",
                name: englishName.trim(),
              });
            }

            const newTag: Tag = {
              id_url: Math.random().toString(36),
              names,
            };

            setNewTags((prev) => [...prev, newTag]);
            setIsCreateTagDialogOpen(false);
            setInitialTagDialogValue("");
          }}
        />

        {isDropdownOpen && (
          <TagDropdown
            isLoading={isLoading}
            allTags={[...allTags, ...newTags]}
            selectedTags={draftTags}
            setSelectedTags={setDraftTags}
            setIsCreateTagDialogOpen={setIsCreateTagDialogOpen}
            setInitialTagDialogValue={setInitialTagDialogValue}
            setIsOpen={setIsDropdownOpen}
            language={language}
          />
        )}
      </ul>
    </section>
  );
}
