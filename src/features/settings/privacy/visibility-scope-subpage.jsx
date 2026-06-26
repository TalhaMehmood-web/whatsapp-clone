"use client";

import { Pencil } from "lucide-react";

import { COPY } from "@/config/constants";
import { VisibilityScope } from "@/models/enums";
import { cn } from "@/utils/cn";

const SCOPE_LABEL = {
  [VisibilityScope.EVERYONE]: "Everyone",
  [VisibilityScope.CONTACTS]: "My contacts",
  [VisibilityScope.CONTACTS_EXCEPT]: "My contacts except…",
  [VisibilityScope.NOBODY]: "Nobody",
};

// Radio list rendered inside the SlidePane for a visibility scope choice.
// `groups` is an array of `{ title, value, onChange, options?, onPickExceptions?,
// exceptionsCount? }` so the same component handles the "Last seen and
// online" two-group layout as well as the single-group "Profile photo" /
// "About" / "Status" pages.
//
// When `onPickExceptions` is supplied and the selected scope is
// CONTACTS_EXCEPT, the row gets a pencil affordance + an excluded-count
// subline that opens the picker on click.
export function VisibilityScopeSubpage({ groups, hint }) {
  return (
    <div className="pb-4">
      {groups.map((group, gi) => (
        <section key={gi} className="mt-4">
          <h3 className="px-6 pb-2 text-xs font-medium text-wa-green">
            {group.title}
          </h3>
          <div role="radiogroup" className="flex flex-col">
            {(group.options ?? Object.values(VisibilityScope)).map((scope) => {
              const checked = group.value === scope;
              const isExcept = scope === VisibilityScope.CONTACTS_EXCEPT;
              const editable = isExcept && !!group.onPickExceptions;
              const disabled = group.disabledOptions?.includes(scope) ?? false;
              return (
                <div
                  key={scope}
                  className="flex items-center gap-2 px-6 py-1.5"
                >
                  <button
                    type="button"
                    role="radio"
                    aria-checked={checked}
                    onClick={() => !disabled && group.onChange(scope)}
                    disabled={disabled}
                    className={cn(
                      "flex flex-1 items-center gap-3 rounded-md py-2 text-left transition-colors",
                      disabled
                        ? "cursor-not-allowed opacity-40"
                        : "hover:bg-wa-panel-2",
                    )}
                  >
                    <span
                      className={cn(
                        "grid size-5 place-items-center rounded-full border-2",
                        checked
                          ? "border-wa-green"
                          : "border-wa-text-muted/60",
                      )}
                    >
                      {checked && (
                        <span className="size-2.5 rounded-full bg-wa-green" />
                      )}
                    </span>
                    <span className="flex flex-1 flex-col">
                      <span className="text-sm text-wa-text">
                        {group.labels?.[scope] ?? SCOPE_LABEL[scope]}
                      </span>
                      {checked && editable && (
                        <span className="text-xs text-wa-text-muted">
                          {COPY.PRIVACY_EXCEPT_COUNT(
                            group.exceptionsCount ?? 0,
                          )}
                        </span>
                      )}
                    </span>
                  </button>
                  {editable && checked && (
                    <button
                      type="button"
                      onClick={group.onPickExceptions}
                      aria-label="Edit exceptions"
                      className="grid size-8 place-items-center rounded-full text-wa-text-muted hover:bg-wa-panel-2 hover:text-wa-text"
                    >
                      <Pencil className="size-4" />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      ))}
      {hint && (
        <p className="px-6 pt-6 text-xs leading-relaxed text-wa-text-muted">
          {hint}
        </p>
      )}
    </div>
  );
}
