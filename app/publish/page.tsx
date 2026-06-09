"use client";

import { FormEvent, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type Option = {
  id: string;
  name: string;
};

type FormState = {
  full_name: string;
  phone: string;
  dni: string;
  description: string;
  city_id: string;
  district_id: string;
  category_id: string;
};

const initialFormState: FormState = {
  full_name: "",
  phone: "",
  dni: "",
  description: "",
  city_id: "",
  district_id: "",
  category_id: "",
};

export default function PublishPage() {
  const [form, setForm] = useState<FormState>(initialFormState);
  const [cities, setCities] = useState<Option[]>([]);
  const [districts, setDistricts] = useState<Option[]>([]);
  const [categories, setCategories] = useState<Option[]>([]);
  const [isLoadingOptions, setIsLoadingOptions] = useState(true);
  const [isLoadingDistricts, setIsLoadingDistricts] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

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
            "No se pudieron cargar ciudades o categorias."
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
      if (!form.city_id) {
        setDistricts([]);
        return;
      }

      setIsLoadingDistricts(true);
      setError("");

      const { data, error: districtsError } = await supabase
        .from("districts")
        .select("id, name")
        .eq("city_id", form.city_id)
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
  }, [form.city_id]);

  function updateField(field: keyof FormState, value: string) {
    setForm((currentForm) => ({
      ...currentForm,
      [field]: value,
      ...(field === "city_id" ? { district_id: "" } : {}),
    }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setMessage("");
    setError("");

    const { error: insertError } = await supabase.from("workers").insert({
      full_name: form.full_name,
      phone: form.phone,
      dni: form.dni,
      description: form.description,
      city_id: form.city_id,
      district_id: form.district_id,
      category_id: form.category_id,
      status: "active",
    });

    if (insertError) {
      setError(insertError.message);
    } else {
      setMessage("Tecnico registrado correctamente.");
      setForm(initialFormState);
      setDistricts([]);
    }

    setIsSubmitting(false);
  }

  return (
    <main className="min-h-screen bg-zinc-50 px-4 py-8 text-zinc-950 sm:px-6 lg:px-8">
      <section className="mx-auto flex w-full max-w-3xl flex-col gap-8">
        <div className="space-y-3">
          <p className="text-sm font-medium uppercase tracking-wide text-emerald-700">
            Publicar tecnico
          </p>
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
            Registra un tecnico en AYNI
          </h1>
          <p className="max-w-2xl text-base leading-7 text-zinc-600">
            Completa los datos principales para que el perfil quede disponible
            en la plataforma.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="grid gap-6 rounded-lg border border-zinc-200 bg-white p-5 shadow-sm sm:grid-cols-2 sm:p-6"
        >
          <label className="flex flex-col gap-2 text-sm font-medium text-zinc-800">
            Nombre completo
            <input
              required
              type="text"
              value={form.full_name}
              onChange={(event) => updateField("full_name", event.target.value)}
              className="h-11 rounded-md border border-zinc-300 px-3 text-base outline-none transition focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
              placeholder="Ej. Juan Perez"
            />
          </label>

          <label className="flex flex-col gap-2 text-sm font-medium text-zinc-800">
            Telefono
            <input
              required
              type="tel"
              value={form.phone}
              onChange={(event) => updateField("phone", event.target.value)}
              className="h-11 rounded-md border border-zinc-300 px-3 text-base outline-none transition focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
              placeholder="Ej. 999 999 999"
            />
          </label>

          <label className="flex flex-col gap-2 text-sm font-medium text-zinc-800">
            DNI
            <input
              required
              type="text"
              value={form.dni}
              onChange={(event) => updateField("dni", event.target.value)}
              className="h-11 rounded-md border border-zinc-300 px-3 text-base outline-none transition focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
              placeholder="Ej. 12345678"
            />
          </label>

          <label className="flex flex-col gap-2 text-sm font-medium text-zinc-800">
            Categoria
            <select
              required
              value={form.category_id}
              onChange={(event) =>
                updateField("category_id", event.target.value)
              }
              disabled={isLoadingOptions}
              className="h-11 rounded-md border border-zinc-300 bg-white px-3 text-base outline-none transition focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100 disabled:bg-zinc-100"
            >
              <option value="">
                {isLoadingOptions
                  ? "Cargando categorias..."
                  : categories.length > 0
                    ? "Selecciona una categoria"
                    : "No hay categorias en Supabase"}
              </option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-2 text-sm font-medium text-zinc-800">
            Ciudad
            <select
              required
              value={form.city_id}
              onChange={(event) => updateField("city_id", event.target.value)}
              disabled={isLoadingOptions}
              className="h-11 rounded-md border border-zinc-300 bg-white px-3 text-base outline-none transition focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100 disabled:bg-zinc-100"
            >
              <option value="">
                {isLoadingOptions
                  ? "Cargando ciudades..."
                  : cities.length > 0
                    ? "Selecciona una ciudad"
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
              required
              value={form.district_id}
              onChange={(event) =>
                updateField("district_id", event.target.value)
              }
              disabled={!form.city_id || isLoadingDistricts}
              className="h-11 rounded-md border border-zinc-300 bg-white px-3 text-base outline-none transition focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100 disabled:bg-zinc-100"
            >
              <option value="">
                {form.city_id
                  ? "Selecciona un distrito"
                  : "Selecciona una ciudad primero"}
              </option>
              {districts.map((district) => (
                <option key={district.id} value={district.id}>
                  {district.name}
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-2 text-sm font-medium text-zinc-800 sm:col-span-2">
            Descripcion
            <textarea
              required
              value={form.description}
              onChange={(event) =>
                updateField("description", event.target.value)
              }
              className="min-h-32 rounded-md border border-zinc-300 px-3 py-3 text-base outline-none transition focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
              placeholder="Describe su experiencia, servicios y disponibilidad."
            />
          </label>

          {(error || message) && (
            <p
              className={`sm:col-span-2 rounded-md px-3 py-2 text-sm ${
                error
                  ? "bg-red-50 text-red-700"
                  : "bg-emerald-50 text-emerald-700"
              }`}
            >
              {error || message}
            </p>
          )}

          <div className="sm:col-span-2">
            <button
              type="submit"
              disabled={isSubmitting || isLoadingOptions}
              className="flex h-11 w-full items-center justify-center rounded-md bg-emerald-700 px-5 text-base font-semibold text-white transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:bg-zinc-400 sm:w-auto"
            >
              {isSubmitting ? "Guardando..." : "Registrar tecnico"}
            </button>
          </div>
        </form>
      </section>
    </main>
  );
}
