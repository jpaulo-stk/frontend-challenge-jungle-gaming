import { Outlet } from "@tanstack/react-router";

import { HomePage } from "@/features/catalog/routes/home-page";

export function HomeLayout() {
  return (
    <>
      <HomePage />
      <Outlet />
    </>
  );
}
