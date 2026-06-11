"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  Bolt,
  Building2,
  Car,
  Droplets,
  Hammer,
  KeyRound,
  MapPin,
  MessageCircle,
  Plus,
  Search,
  Snowflake,
  Wrench,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
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

const categoryStyles: Record<
  string,
  {
    icon: typeof Bolt;
    badge: "default" | "muted" | "warm" | "sky" | "violet";
    iconClassName: string;
  }
> = {
  electricista: {
    icon: Bolt,
    badge: "warm",
    iconClassName: "bg-amber-50 text-amber-700",
  },
  gasfitero: {
    icon: Droplets,
    badge: "sky",
    iconClassName: "bg-sky-50 text-sky-700",
  },
  cerrajero: {
    icon: KeyRound,
    badge: "violet",
    iconClassName: "bg-violet-50 text-violet-700",
  },
  mecanico: {
    icon: Car,
    badge: "muted",
    iconClassName: "bg-zinc-100 text-zinc-700",
  },
  refrigeracion: {
    icon: Snowflake,
    badge: "sky",
    iconClassName: "bg-cyan-50 text-cyan-700",
  },
  "maestro de obra": {
    icon: Building2,
    badge: "warm",
    iconClassName: "bg-orange-50 text-orange-700",
  },
  carpintero: {
    icon: Hammer,
    badge: "warm",
    iconClassName: "bg-yellow-50 text-yellow-800",
  },
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

function getCategoryStyle(categoryName: string) {
  return (
    categoryStyles[categoryName.toLowerCase()] ?? {
      icon: Wrench,
      badge: "default" as const,
      iconClassName: "bg-emerald-50 text-[#15803D]",
    }
  );
}

function getWhatsappUrl(phone: string, fullName: string) {
  const cleanedPhone = phone.replace(/\D/g, "");
  const message = encodeURIComponent(
    `Hola ${fullName}, vi tu perfil en AYNI y quiero consultar por tus servicios.`
  );

  return `https://wa.me/${cleanedPhone}?text=${message}`;
}

function FieldLabel({
  children,
  icon: Icon,
}: {
  children: React.ReactNode;
  icon: typeof MapPin;
}) {
  return (
    <span className="flex items-center gap-2 text-sm font-semibold text-[#111827]">
      <Icon className="h-4 w-4 text-[#16A34A]" />
      {children}
    </span>
  );
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
    <main className="min-h-screen bg-[#F8FAFC] text-[#111827]">
      <section className="mx-auto flex w-full max-w-6xl flex-col gap-7 px-4 py-5 sm:px-6 lg:px-8">
        <header className="overflow-hidden rounded-[2rem] bg-[#111827] px-5 py-6 text-white shadow-xl shadow-emerald-950/10 sm:px-8 sm:py-10">
          <div className="flex flex-col gap-7 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl space-y-5">
              <Badge className="w-fit bg-white/10 text-white">
                <BadgeCheck className="h-3.5 w-3.5" />
                Tecnicos locales verificados por la comunidad
              </Badge>
              <div className="space-y-3">
                <p className="text-sm font-bold uppercase tracking-[0.25em] text-emerald-300">
                  LIWILAZO
                </p>
                <h1 className="text-4xl font-black tracking-tight sm:text-5xl lg:text-6xl">
                  Encuentra tecnicos confiables cerca de ti
                </h1>
                <p className="max-w-xl text-base leading-7 text-zinc-200 sm:text-lg">
                  Electricistas, gasfiteros, cerrajeros, mecanicos y mas.
                </p>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row">
                <Button asChild size="lg" className="w-full sm:w-auto">
                  <a href="#buscar">
                    <Search className="h-5 w-5" />
                    Buscar tecnicos
                  </a>
                </Button>
                <Button
                  asChild
                  size="lg"
                  variant="outline"
                  className="w-full border-white/20 bg-white/10 text-white hover:bg-white/15 sm:w-auto"
                >
                  <Link href="/publish">
                    <Plus className="h-5 w-5" />
                    Publicar servicio
                  </Link>
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3 rounded-3xl bg-white/10 p-3 text-center backdrop-blur">
              <div className="rounded-2xl bg-white p-3 text-[#111827]">
                <p className="text-2xl font-black">{cities.length || 2}</p>
                <p className="text-xs font-semibold text-zinc-500">Ciudades</p>
              </div>
              <div className="rounded-2xl bg-white p-3 text-[#111827]">
                <p className="text-2xl font-black">{categories.length || 7}</p>
                <p className="text-xs font-semibold text-zinc-500">Rubros</p>
              </div>
              <div className="rounded-2xl bg-white p-3 text-[#111827]">
                <p className="text-2xl font-black">{workers.length}</p>
                <p className="text-xs font-semibold text-zinc-500">Tecnicos</p>
              </div>
            </div>
          </div>
        </header>

        <section id="buscar" className="space-y-4">
          <Card className="p-4 shadow-lg shadow-zinc-200/60">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-black">Busca en segundos</h2>
                <p className="text-sm text-zinc-500">
                  Elige ciudad, distrito y rubro.
                </p>
              </div>
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#DCFCE7] text-[#15803D]">
                <Search className="h-5 w-5" />
              </div>
            </div>

            <div className="grid gap-3 lg:grid-cols-3">
              <label className="flex flex-col gap-2">
                <FieldLabel icon={MapPin}>Ciudad</FieldLabel>
                <select
                  value={filters.city_id}
                  onChange={(event) =>
                    updateFilter("city_id", event.target.value)
                  }
                  disabled={isLoadingOptions}
                  className="h-13 rounded-2xl border border-[#E5E7EB] bg-[#F8FAFC] px-4 text-base font-medium outline-none transition focus:border-[#16A34A] focus:ring-4 focus:ring-[#16A34A]/10 disabled:bg-[#F3F4F6]"
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

              <label className="flex flex-col gap-2">
                <FieldLabel icon={MapPin}>Distrito</FieldLabel>
                <select
                  value={filters.district_id}
                  onChange={(event) =>
                    updateFilter("district_id", event.target.value)
                  }
                  disabled={!filters.city_id || isLoadingDistricts}
                  className="h-13 rounded-2xl border border-[#E5E7EB] bg-[#F8FAFC] px-4 text-base font-medium outline-none transition focus:border-[#16A34A] focus:ring-4 focus:ring-[#16A34A]/10 disabled:bg-[#F3F4F6]"
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

              <label className="flex flex-col gap-2">
                <FieldLabel icon={Wrench}>Rubro</FieldLabel>
                <select
                  value={filters.category_id}
                  onChange={(event) =>
                    updateFilter("category_id", event.target.value)
                  }
                  disabled={isLoadingOptions}
                  className="h-13 rounded-2xl border border-[#E5E7EB] bg-[#F8FAFC] px-4 text-base font-medium outline-none transition focus:border-[#16A34A] focus:ring-4 focus:ring-[#16A34A]/10 disabled:bg-[#F3F4F6]"
                >
                  <option value="">
                    {isLoadingOptions
                      ? "Cargando categorias..."
                      : categories.length > 0
                        ? "Todos los rubros"
                        : "No hay categorias en Supabase"}
                  </option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          </Card>

          {error && (
            <p className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
              {error}
            </p>
          )}
        </section>

        <section className="space-y-4">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="text-sm font-bold uppercase tracking-wide text-[#16A34A]">
                Resultados
              </p>
              <h2 className="text-2xl font-black tracking-tight">
                Tecnicos disponibles
              </h2>
            </div>
            <Badge variant="muted">{workers.length} encontrados</Badge>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {isLoadingWorkers ? (
              <Card className="p-6 md:col-span-2 xl:col-span-3">
                <p className="text-sm font-medium text-zinc-600">
                  Cargando tecnicos...
                </p>
              </Card>
            ) : workers.length > 0 ? (
              workers.map((worker) => {
                const categoryName = getRelationName(worker.categories);
                const districtName = getRelationName(worker.districts);
                const categoryStyle = getCategoryStyle(categoryName);
                const Icon = categoryStyle.icon;

                return (
                  <Card
                    key={worker.id}
                    className="group flex min-h-72 flex-col justify-between hover:-translate-y-1 hover:shadow-xl hover:shadow-zinc-200/80"
                  >
                    <CardHeader>
                      <div className="flex items-start gap-4">
                        <div
                          className={`flex h-13 w-13 shrink-0 items-center justify-center rounded-2xl ${categoryStyle.iconClassName}`}
                        >
                          <Icon className="h-6 w-6" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <h3 className="truncate text-xl font-black">
                            {worker.full_name}
                          </h3>
                          <div className="mt-2 flex flex-wrap gap-2">
                            <Badge variant={categoryStyle.badge}>
                              {categoryName}
                            </Badge>
                            <Badge variant="muted">
                              <MapPin className="h-3.5 w-3.5" />
                              {districtName}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </CardHeader>

                    <CardContent>
                      <p className="line-clamp-4 text-sm leading-6 text-zinc-600">
                        {worker.description ||
                          "Tecnico disponible para ayudarte cerca de tu zona."}
                      </p>
                    </CardContent>

                    <CardFooter>
                      <Button asChild className="w-full">
                        <a
                          href={getWhatsappUrl(worker.phone, worker.full_name)}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <MessageCircle className="h-5 w-5" />
                          Contactar por WhatsApp
                        </a>
                      </Button>
                    </CardFooter>
                  </Card>
                );
              })
            ) : (
              <Card className="p-8 text-center md:col-span-2 xl:col-span-3">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#DCFCE7] text-[#15803D]">
                  <Search className="h-7 w-7" />
                </div>
                <h2 className="text-xl font-black">
                  No hay tecnicos para estos filtros
                </h2>
                <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-zinc-600">
                  Prueba cambiando la ciudad, distrito o rubro para encontrar
                  mas opciones cerca de ti.
                </p>
                <Button asChild variant="outline" className="mt-5">
                  <Link href="/publish">
                    Publicar servicio
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
              </Card>
            )}
          </div>
        </section>
      </section>
    </main>
  );
}
