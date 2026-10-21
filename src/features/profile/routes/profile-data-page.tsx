import { useQuery } from "@tanstack/react-query";

import { profileQueryOptions } from "@/features/profile/api/profile-api";
import { ProfileFormView } from "@/features/profile/components/profile-form";
import { ErrorState } from "@/shared/ui/error-state";
import { Skeleton } from "@/shared/ui/skeleton";

/** "Dados do perfil" section. */
export function ProfileDataPage() {
  const profile = useQuery(profileQueryOptions);

  if (profile.isPending) {
    return (
      <div aria-busy="true" aria-label="Carregando perfil" className="grid gap-8 md:grid-cols-2">
        {Array.from({ length: 6 }, (_, index) => (
          <Skeleton key={index} className="h-19.5" />
        ))}
      </div>
    );
  }

  if (profile.isError) {
    return (
      <ErrorState
        message={profile.error.message}
        onRetry={() => void profile.refetch()}
        retrying={profile.isFetching}
      />
    );
  }

  return <ProfileFormView profile={profile.data} />;
}

/** /perfil: the profile data on desktop; on mobile the menu is the page. */
export function ProfileIndexPage() {
  return (
    <div className="max-lg:hidden">
      <ProfileDataPage />
    </div>
  );
}
