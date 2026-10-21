import { Link, Outlet, useLocation } from "@tanstack/react-router";
import { cn } from "cn";
import { ChevronLeft } from "lucide-react";

import { ProfileMenu } from "@/features/profile/components/profile-menu";

export function ProfileLayout() {
  const onIndex = useLocation({
    select: (location) => location.pathname === "/perfil" || location.pathname === "/perfil/",
  });

  return (
    <div className="page-container py-8 lg:grid lg:grid-cols-[310px_1fr] lg:items-start lg:gap-7 lg:py-10">
      {onIndex && <h1 className="mb-4 text-2xl font-bold text-text lg:hidden">Meu perfil</h1>}
      <ProfileMenu className={cn(!onIndex && "max-lg:hidden")} />
      <div className="min-w-0">
        {!onIndex && (
          <Link
            to="/perfil"
            className="mb-6 inline-flex items-center gap-1 text-sm text-primary-hi lg:hidden"
          >
            <ChevronLeft aria-hidden="true" className="size-4" />
            Meu perfil
          </Link>
        )}
        <Outlet />
      </div>
    </div>
  );
}
