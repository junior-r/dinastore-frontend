// One entry per provider the backend has a matching strategy + `/auth/<id>`
// route pair for (see backend/src/modules/users/presentation/controllers/oauth.controller.ts).
// Adding a new provider there is the only other change needed to show its
// button here too.
export interface OAuthProviderConfig {
  id: string;
  // A key into the `auth` section of the i18n dictionaries rather than a
  // literal, so each provider's button text is translated like everything
  // else. Adding a provider means adding its key to en.ts/es.ts too.
  labelKey: 'continueWithGoogle';
}

export const OAUTH_PROVIDERS: OAuthProviderConfig[] = [
  { id: 'google', labelKey: 'continueWithGoogle' },
];

export function oauthUrl(providerId: string): string {
  return new URL(`/auth/${providerId}`, import.meta.env.PUBLIC_API_URL).toString();
}
