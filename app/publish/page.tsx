"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  BadgeCheck,
  FileText,
  IdCard,
  MapPin,
  Phone,
  Send,
  UserRound,
  Wrench,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
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

function FieldLabel({
  children,
  icon: Icon,
}: {
  children: React.ReactNode;
  icon: typeof UserRound;
}) {
  return (
    <span className="flex items-center gap-2 text-sm font-semibold text-[#111827]">
      <Icon className="h-4 w-4 text-[#16A34A]" />
      {children}
    </span>
  );
}

const inputClassName =
  "h-13 rounded-2xl border border-[#E5E7EB] bg-[#F8FAFC] px-4 text-base font-medium outline-none transition focus:border-[#16A34A] focus:ring-4 focus:ring-[#16A34A]/10 disabled:bg-[#F3F4F6]";

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
    <main className="min-h-screen bg-[#F8FAFC] text-[#111827]">
      <section className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-4 py-5 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          <Button asChild variant="ghost" size="sm" className="px-0">
            <Link href="/">
              <ArrowLeft className="h-4 w-4" />
              Volver
            </Link>
          </Button>
          <Badge>
            <BadgeCheck className="h-3.5 w-3.5" />
            Registro gratuito
          </Badge>
        </div>

        <header className="rounded-[2rem] bg-[#111827] px-5 py-7 text-white shadow-xl shadow-emerald-950/10 sm:px-8 sm:py-10">
          <div className="max-w-2xl space-y-4">
            <p className="text-sm font-bold uppercase tracking-[0.25em] text-emerald-300">
              Publicar tecnico
            </p>
            <h1 className="text-4xl font-black tracking-tight sm:text-5xl">
              Registra un tecnico en AYNI
            </h1>
            <p className="max-w-xl text-base leading-7 text-zinc-200">
              Completa los datos principales para que clientes de Cusco y
              Arequipa puedan contactarlo rapido por WhatsApp.
            </p>
          </div>
        </header>

        <Card className="p-5 shadow-lg shadow-zinc-200/60 sm:p-6">
          <form onSubmit={handleSubmit} className="grid gap-5 sm:grid-cols-2">
            <label className="flex flex-col gap-2">
              <FieldLabel icon={UserRound}>Nombre completo</FieldLabel>
              <input
                required
                type="text"
                value={form.full_name}
                onChange={(event) =>
                  updateField("full_name", event.target.value)
                }
                className={inputClassName}
                placeholder="Ej. Juan Perez"
              />
            </label>

            <label className="flex flex-col gap-2">
              <FieldLabel icon={Phone}>Telefono</FieldLabel>
              <input
                required
                type="tel"
                value={form.phone}
                onChange={(event) => updateField("phone", event.target.value)}
                className={inputClassName}
                placeholder="Ej. 999 999 999"
              />
            </label>

            <label className="flex flex-col gap-2">
              <FieldLabel icon={IdCard}>DNI</FieldLabel>
              <input
                required
                type="text"
                value={form.dni}
                onChange={(event) => updateField("dni", event.target.value)}
                className={inputClassName}
                placeholder="Ej. 12345678"
              />
            </label>

            <label className="flex flex-col gap-2">
              <FieldLabel icon={Wrench}>Rubro</FieldLabel>
              <select
                required
                value={form.category_id}
                onChange={(event) =>
                  updateField("category_id", event.target.value)
                }
                disabled={isLoadingOptions}
                className={inputClassName}
              >
                <option value="">
                  {isLoadingOptions
                    ? "Cargando categorias..."
                    : categories.length > 0
                      ? "Selecciona un rubro"
                      : "No hay categorias en Supabase"}
                </option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </label>

            <label className="flex flex-col gap-2">
              <FieldLabel icon={MapPin}>Ciudad</FieldLabel>
              <select
                required
                value={form.city_id}
                onChange={(event) => updateField("city_id", event.target.value)}
                disabled={isLoadingOptions}
                className={inputClassName}
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

            <label className="flex flex-col gap-2">
              <FieldLabel icon={MapPin}>Distrito</FieldLabel>
              <select
                required
                value={form.district_id}
                onChange={(event) =>
                  updateField("district_id", event.target.value)
                }
                disabled={!form.city_id || isLoadingDistricts}
                className={inputClassName}
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

            <label className="flex flex-col gap-2 sm:col-span-2">
              <FieldLabel icon={FileText}>Descripcion</FieldLabel>
              <textarea
                required
                value={form.description}
                onChange={(event) =>
                  updateField("description", event.target.value)
                }
                className="min-h-36 rounded-2xl border border-[#E5E7EB] bg-[#F8FAFC] px-4 py-4 text-base font-medium outline-none transition focus:border-[#16A34A] focus:ring-4 focus:ring-[#16A34A]/10"
                placeholder="Describe su experiencia, servicios y disponibilidad."
              />
            </label>

            {(error || message) && (
              <p
                className={`rounded-2xl px-4 py-3 text-sm font-medium sm:col-span-2 ${
                  error
                    ? "border border-red-100 bg-red-50 text-red-700"
                    : "border border-emerald-100 bg-emerald-50 text-emerald-700"
                }`}
              >
                {error || message}
              </p>
            )}

            <div className="sm:col-span-2">
              <Button
                type="submit"
                size="lg"
                disabled={isSubmitting || isLoadingOptions}
                className="w-full sm:w-auto"
              >
                <Send className="h-5 w-5" />
                {isSubmitting ? "Guardando..." : "Registrar tecnico"}
              </Button>
            </div>
          </form>
        </Card>
      </section>
    </main>
  );
}
