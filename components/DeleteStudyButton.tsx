"use client";

import { deleteStudy } from "@/app/studies/actions";

export default function DeleteStudyButton({
  id,
  name,
}: {
  id: string;
  name: string;
}) {
  return (
    <form
      action={deleteStudy}
      onSubmit={(e) => {
        if (
          !confirm(
            `Delete "${name}"?\n\nThis permanently removes the study and its candidate matches and appointments. This cannot be undone.`
          )
        ) {
          e.preventDefault();
        }
      }}
    >
      <input type="hidden" name="id" value={id} />
      <button
        type="submit"
        className="rounded-lg border border-rose-300 bg-white px-4 py-2 text-sm font-medium text-rose-600 hover:bg-rose-50"
      >
        Delete
      </button>
    </form>
  );
}
