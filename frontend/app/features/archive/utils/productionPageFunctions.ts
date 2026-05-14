import { useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { useBlocker } from "react-router";

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
