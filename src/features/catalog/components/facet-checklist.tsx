import { cn } from "cn";

type FacetOption = { value: string; label: string; count: number };

type FacetChecklistProps = {
  legend: string;
  options: FacetOption[];
  selected: readonly string[];
  onChange: (selected: string[]) => void;
};

export function FacetChecklist({ legend, options, selected, onChange }: FacetChecklistProps) {
  const toggle = (value: string) => {
    onChange(
      selected.includes(value) ? selected.filter((item) => item !== value) : [...selected, value],
    );
  };

  return (
    <fieldset>
      <legend className="text-lg leading-7 font-bold text-text">{legend}</legend>
      <ul className="mt-3 flex flex-col">
        {options.map((option) => {
          const checked = selected.includes(option.value);
          return (
            <li key={option.value}>
              <label
                className={cn(
                  "relative flex h-10 cursor-pointer items-center justify-between rounded-sm px-3 text-[15px] transition-colors hover:text-primary-hi has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-ring",
                  checked ? "text-primary-hi" : "text-text-muted",
                )}
              >
                <input
                  type="checkbox"
                  className="absolute inset-0 cursor-pointer opacity-0"
                  checked={checked}
                  onChange={() => {
                    toggle(option.value);
                  }}
                />
                <span className="flex items-center gap-2">
                  <span
                    aria-hidden="true"
                    className={cn(
                      "size-1.5 rounded-full",
                      checked ? "bg-primary-hi" : "bg-transparent",
                    )}
                  />
                  {option.label}
                </span>
                <span className="font-bold">
                  ({option.count})<span className="sr-only"> NFTs</span>
                </span>
              </label>
            </li>
          );
        })}
      </ul>
    </fieldset>
  );
}
