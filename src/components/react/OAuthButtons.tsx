import { siGoogle, type SimpleIcon } from 'simple-icons';
import { useTranslation } from '@/i18n';
import { OAUTH_PROVIDERS, oauthUrl } from '@/lib/oauth-providers';

// Brand marks by provider id. They come from simple-icons because lucide (the
// icon set everywhere else) carries no brand logos, and a logo redrawn by
// hand is a logo drawn wrong. A provider with no entry here still gets its
// button, just without a mark.
const PROVIDER_ICONS: Record<string, SimpleIcon> = {
  google: siGoogle,
};

export default function OAuthButtons() {
  const t = useTranslation();

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 text-sm text-content-muted">
        <span className="h-px flex-1 bg-border" />
        {t.auth.or}
        <span className="h-px flex-1 bg-border" />
      </div>

      {OAUTH_PROVIDERS.map((provider) => {
        const icon = PROVIDER_ICONS[provider.id];
        return (
          <a
            key={provider.id}
            href={oauthUrl(provider.id)}
            className="flex h-12 w-full items-center justify-center gap-3 rounded-md border border-border px-5 text-sm font-semibold text-content transition hover:border-content active:scale-[0.98]"
          >
            {icon && (
              <svg aria-hidden="true" viewBox="0 0 24 24" className="size-4 fill-current">
                <path d={icon.path} />
              </svg>
            )}
            {t.auth[provider.labelKey]}
          </a>
        );
      })}
    </div>
  );
}
