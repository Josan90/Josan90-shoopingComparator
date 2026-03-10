import type { Route } from "next";
import Link from "next/link";

type Props = {
  pathname: "/" | "/favorites";
  page: number;
  totalPages: number;
  query?: string;
};

function getPageNumbers(page: number, totalPages: number) {
  const start = Math.max(1, page - 2);
  const end = Math.min(totalPages, start + 4);
  const adjustedStart = Math.max(1, end - 4);

  return Array.from({ length: end - adjustedStart + 1 }, (_, index) => adjustedStart + index);
}

export function PaginationControls({ pathname, page, totalPages, query }: Props) {
  if (totalPages <= 1) {
    return null;
  }

  function createHref(nextPage: number): Route {
    const params = new URLSearchParams();

    if (query) {
      params.set("q", query);
    }

    if (nextPage > 1) {
      params.set("page", String(nextPage));
    }

    const search = params.toString();
    return (search ? `${pathname}?${search}` : pathname) as Route;
  }

  const pageNumbers = getPageNumbers(page, totalPages);

  return (
    <nav aria-label="Paginacion" className="pagination">
      <Link
        aria-disabled={page <= 1}
        className={page <= 1 ? "pagination-link is-disabled" : "pagination-link"}
        href={createHref(Math.max(1, page - 1))}
      >
        Anterior
      </Link>

      <div className="pagination-pages">
        {pageNumbers.map((pageNumber) => (
          <Link
            aria-current={pageNumber === page ? "page" : undefined}
            className={pageNumber === page ? "pagination-link is-active" : "pagination-link"}
            href={createHref(pageNumber)}
            key={pageNumber}
          >
            {pageNumber}
          </Link>
        ))}
      </div>

      <Link
        aria-disabled={page >= totalPages}
        className={page >= totalPages ? "pagination-link is-disabled" : "pagination-link"}
        href={createHref(Math.min(totalPages, page + 1))}
      >
        Siguiente
      </Link>
    </nav>
  );
}
