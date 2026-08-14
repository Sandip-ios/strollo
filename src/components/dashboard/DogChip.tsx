import Image from "next/image";
import { PawPrint } from "lucide-react";

type Dog = {
  id: string;
  name: string;
  breed: string;
  age: number;
  gender: string;
  isVaccinated: boolean;
  photoUrl: string | null;
};

export default function DogChip({ dog }: { dog: Dog }) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-sand bg-white p-4">
      <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-full bg-sky-50">
        {dog.photoUrl ? (
          <Image src={dog.photoUrl} alt={dog.name} fill className="object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <PawPrint className="h-6 w-6 text-navy-300" strokeWidth={1.75} />
          </div>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className="font-display text-base font-bold text-ink">{dog.name}</p>
        <p className="text-xs leading-snug text-ink/60">
          {dog.breed} · {dog.age} {dog.age === 1 ? "Year" : "Years"} ·{" "}
          {dog.gender === "MALE" ? "Male" : "Female"}
        </p>
        {dog.isVaccinated && (
          <span className="mt-1 inline-block rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-bold text-emerald-700">
            Vaccinated
          </span>
        )}
      </div>
    </div>
  );
}
