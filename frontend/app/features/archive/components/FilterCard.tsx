import React, { useState } from "react";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";

interface FilterCardProps {
  title: string;
  children: React.ReactNode;
}

const FilterCard: React.FC<FilterCardProps> = ({ title, children }) => {
  const [open, setOpen] = useState(true);

  return (
    <div className="bg-archive-ink/5 bg-archive-ink-dark/5 border-archive-ink/5 border-archive-ink-dark/5 rounded-2xl border p-6 shadow-sm">
      <div
        className={`group flex cursor-pointer items-center justify-between ${open ? "mb-6" : ""}`}
        onClick={() => setOpen((prev) => !prev)}
      >
        <h3 className="text-xs font-bold tracking-[0.2em] uppercase opacity-40">
          {title}
        </h3>
        <KeyboardArrowDownIcon
          className={`h-3 w-3 opacity-30 transition-transform group-hover:opacity-100 ${open ? "rotate-180" : ""}`}
          fontSize="small"
        />
      </div>

      {open && children}
    </div>
  );
};

export default FilterCard;
