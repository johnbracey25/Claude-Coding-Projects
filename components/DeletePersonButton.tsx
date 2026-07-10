"use client";

import { archivePerson } from "@/app/people/actions";

export default function DeletePersonButton({
  id,
  name,
}: {
  id: string;
  name: string;
}) {
  return (
    <form
      action={archivePerson}
      onSubmit={(e) => {
        if (!confirm(`Delete ${name}? You can recover this record for 30 days from the archived list.`)) {
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
