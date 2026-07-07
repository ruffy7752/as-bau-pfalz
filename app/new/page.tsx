"use client";

import { useEffect, useMemo, useState } from "react";

type GpsPosition = {
  latitude: number;
  longitude: number;
  accuracy: number;
};

type PhotoItem = {
  name: string;
  url: string;
  createdAt: string;
};

type WorkflowStep = {
  id: string;
  title: string;
  subtitle: string;
  requiredPhotos: number;
  hint: string;
};

const baseSteps: WorkflowStep[] = [
  {
    id: "grabentiefe-haus",
    title: "Grabentiefe am Haus",
    subtitle: "Tiefe ca. 45 cm dokumentieren",
    requiredPhotos: 1,
    hint: "Foto so machen, dass Maßstab/Zollstock und Hausseite erkennbar sind.",
  },
  {
    id: "leerrohr",
    title: "Leerrohr im Graben",
    subtitle: "Leerrohr vor dem Verfüllen fotografieren",
    requiredPhotos: 1,
    hint: "Leerrohr komplett sichtbar, Richtung Straße/Haus klar erkennbar.",
  },
  {
    id: "hausanschluss",
    title: "Anschluss am Haus",
    subtitle: "Bohrung und Hauseinführung dokumentieren",
    requiredPhotos: 1,
    hint: "Foto direkt am Hausanschluss machen, nicht zu nah und nicht verwackelt.",
  },
  {
    id: "abdichtung",
    title: "Abdichtung Fassade",
    subtitle: "Wasserdichte Abdichtung nachweisen",
    requiredPhotos: 1,
    hint: "Abdichtung muss sauber und vollständig sichtbar sein.",
  },
  {
    id: "flatterband",
    title: "Flatterband / Warnband",
    subtitle: "Warnband vor dem Schließen fotografieren",
    requiredPhotos: 1,
    hint: "Warnband im Graben sichtbar, am besten mit Umgebung zur Zuordnung.",
  },
];

export default function NewDocumentationPage() {
  const [street, setStreet] = useState("");
  const [houseNumber, setHouseNumber] = useState("");
  const [project, setProject] = useState("");
  const [trenchLongerThanFiveMeters, setTrenchLongerThanFiveMeters] = useState(false);
  const [mainLineReady, setMainLineReady] = useState(false);
  const [gps, setGps] = useState<GpsPosition | null>(null);
  const [gpsError, setGpsError] = useState("");
  const [activeStepIndex, setActiveStepIndex] = useState(0);
  const [photosByStep, setPhotosByStep] = useState<Record<string, PhotoItem[]>>({});

  const workflowSteps = useMemo<WorkflowStep[]>(() => {
    const steps = [...baseSteps];

    if (trenchLongerThanFiveMeters) {
      steps.splice(1, 0, {
        id: "grabentiefe-strasse",
        title: "Grabentiefe Richtung Straße",
        subtitle: "Zusätzliches Tiefenfoto bei Strecke über 5 m",
        requiredPhotos: 1,
        hint: "Zweites Foto weiter Richtung Straße machen, ebenfalls mit Maßstab/Zollstock.",
      });
    }

    steps.push(
      mainLineReady
        ? {
            id: "trasse-anschluss",
            title: "Anschluss an Trasse",
            subtitle: "Verbindung zur Hauptleitung dokumentieren",
            requiredPhotos: 1,
            hint: "Kabelfarbe und Anschlussstelle müssen gut erkennbar sein.",
          }
        : {
            id: "gps-ball",
            title: "GPS-Ball gesetzt",
            subtitle: "Position markieren, wenn Trasse noch nicht fertig ist",
            requiredPhotos: 1,
            hint: "GPS-Ball mit Leitung und Lage im Graben fotografieren.",
          },
    );

    return steps;
  }, [mainLineReady, trenchLongerThanFiveMeters]);

  const activeStep = workflowSteps[activeStepIndex] ?? workflowSteps[0];
  const completedSteps = workflowSteps.filter((step) => (photosByStep[step.id]?.length ?? 0) >= step.requiredPhotos).length;
  const progress = Math.round((completedSteps / workflowSteps.length) * 100);
  const addressReady = street.trim().length > 0 && houseNumber.trim().length > 0;

  useEffect(() => {
    if (activeStepIndex > workflowSteps.length - 1) {
      setActiveStepIndex(workflowSteps.length - 1);
    }
  }, [activeStepIndex, workflowSteps.length]);

  function requestGps() {
    setGpsError("");

    if (!navigator.geolocation) {
      setGpsError("GPS wird von diesem Gerät/Browser nicht unterstützt.");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setGps({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
        });
      },
      () => setGpsError("GPS konnte nicht gelesen werden. Bitte Standortfreigabe prüfen."),
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 0 },
    );
  }

  function addPhotos(files: FileList | null) {
    if (!files || !activeStep) return;

    const newPhotos = Array.from(files).map((file) => ({
      name: file.name,
      url: URL.createObjectURL(file),
      createdAt: new Date().toLocaleString("de-DE"),
    }));

    setPhotosByStep((current) => ({
      ...current,
      [activeStep.id]: [...(current[activeStep.id] ?? []), ...newPhotos],
    }));
  }

  function removePhoto(stepId: string, photoUrl: string) {
    setPhotosByStep((current) => ({
      ...current,
      [stepId]: (current[stepId] ?? []).filter((photo) => photo.url !== photoUrl),
    }));
  }

  const documentationTitle = `${street || "Straße"} ${houseNumber || "Hausnummer"}`.trim();

  return (
    <main className="min-h-screen bg-zinc-950 px-4 py-6 text-zinc-50 sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-6xl flex-col gap-6">
        <header className="rounded-3xl border border-zinc-800 bg-zinc-900/80 p-5 shadow-2xl shadow-black/20">
          <p className="text-sm font-medium uppercase tracking-[0.3em] text-blue-300">AS Bau Digital</p>
          <div className="mt-3 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Foto-Assistent Hausanschluss</h1>
              <p className="mt-2 max-w-2xl text-sm text-zinc-300">
                Schritt für Schritt Fotos machen, GPS prüfen und am Ende sehen, ob die Dokumentation vollständig ist.
              </p>
            </div>
            <div className="rounded-2xl bg-blue-500 px-5 py-3 text-center font-semibold text-white">
              {progress}% fertig
            </div>
          </div>
        </header>

        <section className="grid gap-4 rounded-3xl border border-zinc-800 bg-zinc-900 p-5 md:grid-cols-4">
          <label className="flex flex-col gap-2 text-sm font-medium text-zinc-200">
            Projekt / Kolonne
            <input
              value={project}
              onChange={(event) => setProject(event.target.value)}
              placeholder="z. B. Wattenheim"
              className="rounded-2xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-base outline-none ring-blue-500 transition focus:ring-2"
            />
          </label>
          <label className="flex flex-col gap-2 text-sm font-medium text-zinc-200">
            Straße
            <input
              value={street}
              onChange={(event) => setStreet(event.target.value)}
              placeholder="Straßenname"
              className="rounded-2xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-base outline-none ring-blue-500 transition focus:ring-2"
            />
          </label>
          <label className="flex flex-col gap-2 text-sm font-medium text-zinc-200">
            Hausnummer
            <input
              value={houseNumber}
              onChange={(event) => setHouseNumber(event.target.value)}
              placeholder="Nr."
              className="rounded-2xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-base outline-none ring-blue-500 transition focus:ring-2"
            />
          </label>
          <div className="flex flex-col justify-end gap-2">
            <button
              type="button"
              onClick={requestGps}
              className="rounded-2xl bg-white px-4 py-3 font-semibold text-zinc-950 transition hover:bg-blue-100"
            >
              GPS aktualisieren
            </button>
            {gps ? (
              <p className="text-xs text-green-300">
                GPS: {gps.latitude.toFixed(6)}, {gps.longitude.toFixed(6)} · ±{Math.round(gps.accuracy)} m
              </p>
            ) : (
              <p className="text-xs text-zinc-400">Noch kein GPS gespeichert.</p>
            )}
            {gpsError && <p className="text-xs text-red-300">{gpsError}</p>}
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-2">
          <label className="flex items-center justify-between gap-4 rounded-3xl border border-zinc-800 bg-zinc-900 p-5">
            <span>
              <span className="block font-semibold">Strecke länger als 5 m?</span>
              <span className="text-sm text-zinc-400">Dann wird ein zweites Grabentiefe-Foto verlangt.</span>
            </span>
            <input
              type="checkbox"
              checked={trenchLongerThanFiveMeters}
              onChange={(event) => setTrenchLongerThanFiveMeters(event.target.checked)}
              className="h-6 w-6 accent-blue-500"
            />
          </label>
          <label className="flex items-center justify-between gap-4 rounded-3xl border border-zinc-800 bg-zinc-900 p-5">
            <span>
              <span className="block font-semibold">Trasse / Hauptleitung schon fertig?</span>
              <span className="text-sm text-zinc-400">Ja = Anschlussfoto, nein = GPS-Ball-Foto.</span>
            </span>
            <input
              type="checkbox"
              checked={mainLineReady}
              onChange={(event) => setMainLineReady(event.target.checked)}
              className="h-6 w-6 accent-blue-500"
            />
          </label>
        </section>

        <section className="grid gap-6 lg:grid-cols-[360px_1fr]">
          <aside className="rounded-3xl border border-zinc-800 bg-zinc-900 p-4">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold">Workflow</h2>
              <span className="rounded-full bg-zinc-800 px-3 py-1 text-xs text-zinc-300">
                {completedSteps}/{workflowSteps.length}
              </span>
            </div>
            <div className="flex flex-col gap-2">
              {workflowSteps.map((step, index) => {
                const photoCount = photosByStep[step.id]?.length ?? 0;
                const done = photoCount >= step.requiredPhotos;
                const active = index === activeStepIndex;

                return (
                  <button
                    key={step.id}
                    type="button"
                    onClick={() => setActiveStepIndex(index)}
                    className={`rounded-2xl border p-4 text-left transition ${
                      active
                        ? "border-blue-400 bg-blue-500/15"
                        : done
                          ? "border-green-500/40 bg-green-500/10"
                          : "border-zinc-800 bg-zinc-950 hover:border-zinc-600"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <span className="font-semibold">{step.title}</span>
                      <span className={`rounded-full px-2 py-1 text-xs ${done ? "bg-green-500 text-white" : "bg-zinc-800 text-zinc-300"}`}>
                        {photoCount}/{step.requiredPhotos}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-zinc-400">{step.subtitle}</p>
                  </button>
                );
              })}
            </div>
          </aside>

          <div className="rounded-3xl border border-zinc-800 bg-zinc-900 p-5">
            <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
              <div>
                <p className="text-sm text-zinc-400">Aktuelle Adresse</p>
                <h2 className="mt-1 text-2xl font-bold">{documentationTitle}</h2>
                {project && <p className="mt-1 text-sm text-blue-200">Projekt: {project}</p>}
              </div>
              <div className={`rounded-2xl px-4 py-3 text-sm font-semibold ${addressReady && gps ? "bg-green-500 text-white" : "bg-yellow-400 text-zinc-950"}`}>
                {addressReady && gps ? "Adresse + GPS bereit" : "Adresse/GPS prüfen"}
              </div>
            </div>

            <div className="mt-6 rounded-3xl border border-zinc-800 bg-zinc-950 p-5">
              <p className="text-sm font-medium text-blue-300">Schritt {activeStepIndex + 1}</p>
              <h3 className="mt-2 text-2xl font-bold">{activeStep.title}</h3>
              <p className="mt-1 text-zinc-300">{activeStep.subtitle}</p>
              <p className="mt-4 rounded-2xl bg-zinc-900 p-4 text-sm text-zinc-300">{activeStep.hint}</p>

              <label className="mt-5 flex cursor-pointer flex-col items-center justify-center rounded-3xl border-2 border-dashed border-zinc-700 bg-zinc-900 px-6 py-10 text-center transition hover:border-blue-400">
                <span className="text-lg font-semibold">Foto aufnehmen / hochladen</span>
                <span className="mt-2 text-sm text-zinc-400">Kamera öffnen und Foto direkt diesem Schritt zuordnen.</span>
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  multiple
                  onChange={(event) => addPhotos(event.target.files)}
                  className="hidden"
                />
              </label>

              <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {(photosByStep[activeStep.id] ?? []).map((photo) => (
                  <figure key={photo.url} className="overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={photo.url} alt={photo.name} className="h-44 w-full object-cover" />
                    <figcaption className="flex items-start justify-between gap-3 p-3 text-xs text-zinc-400">
                      <span>
                        <span className="block font-medium text-zinc-200">{photo.name}</span>
                        {photo.createdAt}
                      </span>
                      <button
                        type="button"
                        onClick={() => removePhoto(activeStep.id, photo.url)}
                        className="rounded-full bg-red-500/15 px-3 py-1 font-semibold text-red-200 hover:bg-red-500/25"
                      >
                        Löschen
                      </button>
                    </figcaption>
                  </figure>
                ))}
              </div>

              <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-between">
                <button
                  type="button"
                  onClick={() => setActiveStepIndex((index) => Math.max(index - 1, 0))}
                  className="rounded-2xl border border-zinc-700 px-5 py-3 font-semibold text-zinc-200 transition hover:bg-zinc-800 disabled:opacity-40"
                  disabled={activeStepIndex === 0}
                >
                  Zurück
                </button>
                <button
                  type="button"
                  onClick={() => setActiveStepIndex((index) => Math.min(index + 1, workflowSteps.length - 1))}
                  className="rounded-2xl bg-blue-500 px-5 py-3 font-semibold text-white transition hover:bg-blue-400 disabled:opacity-40"
                  disabled={activeStepIndex === workflowSteps.length - 1}
                >
                  Nächster Schritt
                </button>
              </div>
            </div>
          </div>
        </section>

        <section className="rounded-3xl border border-zinc-800 bg-zinc-900 p-5">
          <h2 className="text-xl font-bold">Kontrolle vor dem Absenden</h2>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {workflowSteps.map((step) => {
              const photoCount = photosByStep[step.id]?.length ?? 0;
              const done = photoCount >= step.requiredPhotos;

              return (
                <div key={step.id} className="flex items-center justify-between rounded-2xl bg-zinc-950 p-4">
                  <div>
                    <p className="font-semibold">{step.title}</p>
                    <p className="text-sm text-zinc-400">Benötigt: {step.requiredPhotos} Foto</p>
                  </div>
                  <span className={`rounded-full px-3 py-1 text-sm font-semibold ${done ? "bg-green-500 text-white" : "bg-red-500/20 text-red-200"}`}>
                    {done ? "OK" : `${photoCount}/${step.requiredPhotos}`}
                  </span>
                </div>
              );
            })}
          </div>
          <button
            type="button"
            disabled={!addressReady || !gps || completedSteps !== workflowSteps.length}
            className="mt-5 w-full rounded-2xl bg-green-500 px-5 py-4 text-lg font-bold text-white transition hover:bg-green-400 disabled:cursor-not-allowed disabled:bg-zinc-700 disabled:text-zinc-400"
          >
            Dokumentation speichern
          </button>
          <p className="mt-3 text-sm text-zinc-400">
            Nächster Schritt: Diesen Button mit Supabase Storage und der Projekt-Tabelle verbinden.
          </p>
        </section>
      </div>
    </main>
  );
}
