import DOMPurify from "dompurify";
import { useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { useBlocker } from "react-router";

export function isEmptyHtml(html: string): boolean {
  return html.trim().replace(/<p>(<br>)?<\/p>/g, "").trim().length === 0;
}

export function getSanitizedHtmlOrUndefined(value: string | null | undefined): string | undefined {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  if (trimmed.length === 0 || isEmptyHtml(trimmed)) return undefined;
  return DOMPurify.sanitize(trimmed);
}

export function getTextOrDefault(value: string | null | undefined, fallback: string): string {
  if (typeof value !== "string") {
    return fallback;
  }

  const trimmedValue = value.trim();
  return trimmedValue.length > 0 ? trimmedValue : fallback;
}

export function useUnsavedChangesBlocker(when: boolean) {
  const blocker = useBlocker(when);
  const blockerRef = useRef(blocker);
  const { t } = useTranslation();

  useEffect(() => {
    blockerRef.current = blocker;
  });

  const tRef = useRef(t);
  useEffect(() => {
    tRef.current = t;
  });

  useEffect(() => {
    if (blockerRef.current.state === "blocked") {
      const confirmLeave = window.confirm(tRef.current("notSaveChanges"));
      if (confirmLeave) {
        blockerRef.current.proceed();
      } else {
        blockerRef.current.reset();
      }
    }
  }, [blocker.state]);
}