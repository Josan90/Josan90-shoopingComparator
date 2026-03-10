"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

type Props = {
  initialValue: string;
};

export function ProductsSearchInput({ initialValue }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [value, setValue] = useState(initialValue);

  useEffect(() => {
    setValue(initialValue);
  }, [initialValue]);

  useEffect(() => {
    const handle = setTimeout(() => {
      const currentQuery = (searchParams.get("q") || "").trim();
      const nextQuery = value.trim();

      if (currentQuery === nextQuery) {
        return;
      }

      const params = new URLSearchParams(searchParams.toString());
      if (nextQuery) {
        params.set("q", nextQuery);
      } else {
        params.delete("q");
      }

      const nextUrl = params.toString() ? `${pathname}?${params.toString()}` : pathname;
      router.replace(nextUrl, { scroll: false });
    }, 220);

    return () => clearTimeout(handle);
  }, [value, pathname, router, searchParams]);

  return (
    <div className="search-form">
      <input
        autoComplete="off"
        name="q"
        onChange={(event) => setValue(event.target.value)}
        placeholder="Busca producto, marca o categoria"
        type="text"
        value={value}
      />
    </div>
  );
}
