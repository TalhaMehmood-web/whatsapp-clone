"use client";

import { VisibilityScope } from "@/models/enums";
import { cn } from "@/utils/cn";

const SCOPE_LABEL = {
  [VisibilityScope.EVERYONE]: "Everyone",
  [VisibilityScope.CONTACTS]: "My contacts",
  [VisibilityScope.CONTACTS_EXCEPT]: "My contacts except…",
  [VisibilityScope.NOBODY]: "Nobody",
};

// Radio list rendered inside the SlidePane for a visibility scope choice.
// `groups` is an array of `{ title, value, onChange, options? }` so the same
// component handles the "Last seen and online" two-group layout as well as
// the single-group "Profile photo" / "About" / "Status" pages.
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
              return (
                <button
                  key={scope}
                  type="button"
                  role="radio"
                  aria-checked={checked}
                  onClick={() => group.onChange(scope)}
                  className={cn(
                    "flex items-center gap-3 px-6 py-3 text-left transition-colors hover:bg-wa-panel-2",
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
                  <span className="text-sm text-wa-text">
                    {group.labels?.[scope] ?? SCOPE_LABEL[scope]}
                  </span>
                </button>
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
