"use client";

import { deletePerson } from "@/app/people/actions";

export default function DeletePersonButton({
  id,
  name,
}: {
  id: string;
  name: string;
}) {
  return (
    <form
      action={deletePerson}
      onSubmit={(e) => {
        if (!confirm(`Delete ${name}? This cannot be undone.`)) {
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
