"use client";

import { PlaceSearch, type Place } from "./PlaceSearch";

export type BirthValue = {
  name: string;
  gender: string;
  dateOfBirth: string;
  timeOfBirth: string;
  place: Place | null;
};

export const emptyBirth = (gender = ""): BirthValue => ({
  name: "",
  gender,
  dateOfBirth: "",
  timeOfBirth: "",
  place: null,
});

export const isBirthComplete = (b: BirthValue) => Boolean(b.dateOfBirth && b.timeOfBirth && b.place);

/** Converts form state to the API's BirthInput shape. */
export const toBirthInput = (b: BirthValue) => ({
  name: b.name || undefined,
  gender: b.gender || undefined,
  dateOfBirth: b.dateOfBirth,
  timeOfBirth: b.timeOfBirth,
  placeId: b.place?.id,
  placeName: b.place?.label,
});

const input = "field";

export function BirthForm({
  value,
  onChange,
  title,
  fixedGender,
}: {
  value: BirthValue;
  onChange: (v: BirthValue) => void;
  title?: string;
  fixedGender?: boolean;
}) {
  const set = (patch: Partial<BirthValue>) => onChange({ ...value, ...patch });
  return (
    <fieldset className="space-y-4">
      {title && <legend className="mb-2 font-heading text-lg font-bold text-brand-primary">{title}</legend>}
      <label className="label">
        Name
        <input value={value.name} onChange={(e) => set({ name: e.target.value })} maxLength={80} className={input} placeholder="Full name" />
      </label>
      {!fixedGender && (
        <div className="label" role="radiogroup" aria-label="Gender">
          Gender
          <div className="mt-1.5 flex gap-2">
            {["male", "female"].map((g) => (
              <button
                key={g}
                type="button"
                role="radio"
                aria-checked={value.gender === g}
                onClick={() => set({ gender: g })}
                className={`pill capitalize ${value.gender === g ? "pill-on" : "pill-off"}`}
              >
                <i className={`fa-solid ${g === "male" ? "fa-mars" : "fa-venus"} mr-1.5 text-xs`} aria-hidden />
                {g}
              </button>
            ))}
          </div>
        </div>
      )}
      <div className="grid grid-cols-2 gap-3">
        <label className="label">
          Date of birth
          <input
            type="date"
            required
            value={value.dateOfBirth}
            max="2100-12-31"
            min="1800-01-01"
            onChange={(e) => set({ dateOfBirth: e.target.value })}
            className={input}
          />
        </label>
        <label className="label">
          Time of birth
          <input type="time" required value={value.timeOfBirth} onChange={(e) => set({ timeOfBirth: e.target.value })} className={input} />
        </label>
      </div>
      <PlaceSearch value={value.place} onChange={(place) => set({ place })} required />
    </fieldset>
  );
}
