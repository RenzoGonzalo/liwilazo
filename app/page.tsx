"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type Option = {
  id: string;
  name: string;
};

type Relation = {
  name: string;
};

type Worker = {
  id: string;
  full_name: string;
  phone: string;
  description: string;
  city_id: string;
  district_id: string;
  category_id: string;
  categories: Relation | Relation[] | null;
  districts: Relation | Relation[] | null;
};

type Filters = {
  city_id: string;
  district_id: string;
  category_id: string;
};

const initialFilters: Filters = {
  city_id: "",
  district_id: "",
  category_id: "",
};

function getRelationName(relation: Relation | Relation[] | null) {
  if (!relation) {
    return "Sin dato";
  }

  if (Array.isArray(relation)) {
    return relation[0]?.name ?? "Sin dato";
  }

  return relation.name;
}

function getWhatsappUrl(phone: string, fullName: string) {
  const cleanedPhone = phone.replace(/\D/g, "");
  const message = encodeURIComponent(
    `Hola ${fullName}, vi tu perfil en AYNI y quiero consultar por tus servicios.`
  );

  return `https://wa.me/${cleanedPhone}?text=${message}`;
}

export default function Home() {
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [cities, setCities] = useState<Option[]>([]);
  const [districts, setDistricts] = useState<Option[]>([]);
  const [categories, setCategories] = useState<Option[]>([]);
  const [filters, setFilters] = useState<Filters>(initialFilters);
  const [isLoadingOptions, setIsLoadingOptions] = useState(true);
  const [isLoadingDistricts, setIsLoadingDistricts] = useState(false);
  const [isLoadingWorkers, setIsLoadingWorkers] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const trackingKey = "ayni-home-view-tracked";

    if (sessionStorage.getItem(trackingKey)) {
      return;
    }

    sessionStorage.setItem(trackingKey, "true");

    fetch("/api/track", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ path: "/" }),
    }).catch(() => {
      sessionStorage.removeItem(trackingKey);
    });
  }, []);

  useEffect(() => {
    async function loadOptions() {
      setIsLoadingOptions(true);
      setError("");

      const [citiesResult, categoriesResult] = await Promise.all([
        supabase.from("cities").select("id, name").order("name"),
        supabase.from("categories").select("id, name").order("name"),
      ]);

      if (citiesResult.error || categoriesResult.error) {
        setError(
          citiesResult.error?.message ??
            categoriesResult.error?.message ??
            "No se pudieron cargar los filtros."
        );
      } else {
        const loadedCities = citiesResult.data ?? [];
        const loadedCategories = categoriesResult.data ?? [];

        setCities(loadedCities);
        setCategories(loadedCategories);

        if (loadedCities.length === 0 || loadedCategories.length === 0) {
          setError(
            "No se encontraron ciudades o categorias visibles en Supabase."
          );
        }
      }

      setIsLoadingOptions(false);
    }

    loadOptions();
  }, []);

  useEffect(() => {
    async function loadDistricts() {
      if (!filters.city_id) {
        setDistricts([]);
        return;
      }

      setIsLoadingDistricts(true);
      setError("");

      const { data, error: districtsError } = await supabase
        .from("districts")
        .select("id, name")
        .eq("city_id", filters.city_id)
        .order("name");

      if (districtsError) {
        setDistricts([]);
        setError(districtsError.message);
      } else {
        setDistricts(data ?? []);
      }

      setIsLoadingDistricts(false);
    }

    loadDistricts();
  }, [filters.city_id]);

  useEffect(() => {
    async function loadWorkers() {
      setIsLoadingWorkers(true);
      setError("");

      let query = supabase
        .from("workers")
        .select(
          "id, full_name, phone, description, city_id, district_id, category_id, categories(name), districts(name)"
        )
        .eq("status", "active")
        .order("full_name");

      if (filters.city_id) {
        query = query.eq("city_id", filters.city_id);
      }

      if (filters.district_id) {
        query = query.eq("district_id", filters.district_id);
      }

      if (filters.category_id) {
        query = query.eq("category_id", filters.category_id);
      }

      const { data, error: workersError } = await query;

      if (workersError) {
        setWorkers([]);
        setError(workersError.message);
      } else {
        setWorkers((data ?? []) as Worker[]);
      }

      setIsLoadingWorkers(false);
    }

    loadWorkers();
  }, [filters]);

  function updateFilter(field: keyof Filters, value: string) {
    setFilters((currentFilters) => ({
      ...currentFilters,
      [field]: value,
      ...(field === "city_id" ? { district_id: "" } : {}),
    }));
  }

  return (
    <main className="min-h-screen bg-zinc-50 px-4 py-8 text-zinc-950 sm:px-6 lg:px-8">
      <section className="mx-auto flex w-full max-w-6xl flex-col gap-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-3">
            <p className="text-sm font-medium uppercase tracking-wide text-emerald-700">
              LIWILAZO
            </p>
            <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
              Encuentra tecnicos disponibles
            </h1>
            <p className="max-w-2xl text-base leading-7 text-zinc-600">
              Filtra por ubicacion y categoria para contactar directamente por
              WhatsApp.
            </p>
          </div>

          <a
            href="/publish"
            className="flex h-11 w-full items-center justify-center rounded-md border border-emerald-700 px-4 text-base font-semibold text-emerald-800 transition hover:bg-emerald-50 sm:w-auto"
          >
            Publicar tecnico
          </a>
        </div>

        <section className="grid gap-4 rounded-lg border border-zinc-200 bg-white p-4 shadow-sm sm:grid-cols-3">
          <label className="flex flex-col gap-2 text-sm font-medium text-zinc-800">
            Ciudad
            <select
              value={filters.city_id}
              onChange={(event) => updateFilter("city_id", event.target.value)}
              disabled={isLoadingOptions}
              className="h-11 rounded-md border border-zinc-300 bg-white px-3 text-base outline-none transition focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100 disabled:bg-zinc-100"
            >
              <option value="">
                {isLoadingOptions
                  ? "Cargando ciudades..."
                  : cities.length > 0
                    ? "Todas las ciudades"
                    : "No hay ciudades en Supabase"}
              </option>
              {cities.map((city) => (
                <option key={city.id} value={city.id}>
                  {city.name}
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-2 text-sm font-medium text-zinc-800">
            Distrito
            <select
              value={filters.district_id}
              onChange={(event) =>
                updateFilter("district_id", event.target.value)
              }
              disabled={!filters.city_id || isLoadingDistricts}
              className="h-11 rounded-md border border-zinc-300 bg-white px-3 text-base outline-none transition focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100 disabled:bg-zinc-100"
            >
              <option value="">
                {filters.city_id
                  ? "Todos los distritos"
                  : "Elige una ciudad primero"}
              </option>
              {districts.map((district) => (
                <option key={district.id} value={district.id}>
                  {district.name}
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-2 text-sm font-medium text-zinc-800">
            Categoria
            <select
              value={filters.category_id}
              onChange={(event) =>
                updateFilter("category_id", event.target.value)
              }
              disabled={isLoadingOptions}
              className="h-11 rounded-md border border-zinc-300 bg-white px-3 text-base outline-none transition focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100 disabled:bg-zinc-100"
            >
              <option value="">
                {isLoadingOptions
                  ? "Cargando categorias..."
                  : categories.length > 0
                    ? "Todas las categorias"
                    : "No hay categorias en Supabase"}
              </option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </label>
        </section>

        {error && (
          <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </p>
        )}

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {isLoadingWorkers ? (
            <p className="text-sm text-zinc-600">Cargando tecnicos...</p>
          ) : workers.length > 0 ? (
            workers.map((worker) => (
              <article
                key={worker.id}
                className="flex min-h-64 flex-col justify-between rounded-lg border border-zinc-200 bg-white p-5 shadow-sm"
              >
                <div className="space-y-4">
                  <div className="space-y-2">
                    <h2 className="text-xl font-semibold text-zinc-950">
                      {worker.full_name}
                    </h2>
                    <div className="flex flex-wrap gap-2 text-sm">
                      <span className="rounded-md bg-emerald-50 px-2.5 py-1 font-medium text-emerald-800">
                        {getRelationName(worker.categories)}
                      </span>
                      <span className="rounded-md bg-zinc-100 px-2.5 py-1 font-medium text-zinc-700">
                        {getRelationName(worker.districts)}
                      </span>
                    </div>
                  </div>

                  <p className="line-clamp-5 text-sm leading-6 text-zinc-600">
                    {worker.description}
                  </p>
                </div>

                <a
                  href={getWhatsappUrl(worker.phone, worker.full_name)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-6 flex h-11 items-center justify-center rounded-md bg-emerald-700 px-4 text-base font-semibold text-white transition hover:bg-emerald-800"
                >
                  Contactar por WhatsApp
                </a>
              </article>
            ))
          ) : (
            <div className="rounded-lg border border-dashed border-zinc-300 bg-white p-8 text-center md:col-span-2 xl:col-span-3">
              <h2 className="text-lg font-semibold text-zinc-950">
                No hay tecnicos para estos filtros
              </h2>
              <p className="mt-2 text-sm text-zinc-600">
                Prueba cambiando la ciudad, distrito o categoria.
              </p>
            </div>
          )}
        </section>
      </section>
    </main>
  );
}
