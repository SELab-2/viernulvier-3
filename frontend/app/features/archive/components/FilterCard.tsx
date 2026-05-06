import React, { useState } from "react";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";

interface FilterCardProps {
  title: string;
  children: React.ReactNode;
}

const FilterCard: React.FC<FilterCardProps> = ({ title, children }) => {
  const [open, setOpen] = useState(true);
  const contentIdBase = `${title.replace(/\s+/g, "-").toLowerCase()}-card`;

  return (
    <div
      id={contentIdBase}
      className="bg-archive-ink/5 bg-archive-ink-dark/5 border-archive-ink/5 border-archive-ink-dark/5 rounded-2xl border p-6 shadow-sm"
    >
      <button
        id={`${contentIdBase}-button`}
        onClick={() => setOpen((prev) => !prev)}
        className={`group flex w-full cursor-pointer items-center justify-between ${open ? "mb-6" : ""}`}
        aria-expanded={open}
        aria-controls={`${contentIdBase}-children`}
      >
        <h3
          id={`${contentIdBase}-title`}
          className="text-xs font-bold tracking-[0.2em] uppercase opacity-40"
        >
          {title}
        </h3>
        <KeyboardArrowDownIcon
          id={`${contentIdBase}-dropdown-icon`}
          className={`h-3 w-3 opacity-30 transition-transform group-hover:opacity-100 ${open ? "rotate-180" : ""}`}
          fontSize="small"
        />
      </button>

      <div id={`${contentIdBase}-children`} hidden={!open}>
        {children}
      </div>
    </div>
  );
};

export default FilterCard;
