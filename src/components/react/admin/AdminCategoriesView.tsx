import { QueryClientProvider } from '@tanstack/react-query';
import { Pencil, Plus, Tags, Trash2 } from 'lucide-react';
import { useEffect, useState, type SubmitEvent } from 'react';
import { getQueryClient } from '@/lib/query-client';
import { useCategories } from '@/lib/queries/products';
import { useCreateCategory, useDeleteCategory, useUpdateCategory } from '@/lib/queries/admin';
import { useRequireAdminAccess } from '@/hooks/useRequireAdminAccess';
import type { Category } from '@/lib/types';
import { useDocumentTitle, useTranslation } from '@/i18n';
import ConfirmDialog from '../ui/ConfirmDialog';
import Sidebar from '../ui/Sidebar';
import AdminEmptyState from './AdminEmptyState';
import AdminListSkeleton from './AdminListSkeleton';
import AdminPageHeader from './AdminPageHeader';
import { can } from '@/lib/permissions';
import { ROW_ACTION_CLASS } from './list-styles';

const inputClass =
  'mt-2 w-full rounded-md border border-border bg-surface px-4 py-2.5 text-sm text-content transition focus:border-brand focus:ring-4 focus:ring-ring/15 focus:outline-none';

type SidebarState = { mode: 'create' } | { mode: 'edit'; category: Category } | null;

function CategorySidebar({ state, onClose }: { state: SidebarState; onClose: () => void }) {
  const createCategory = useCreateCategory();
  const updateCategory = useUpdateCategory();

  const t = useTranslation();
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [description, setDescription] = useState('');

  useEffect(() => {
    if (state?.mode === 'edit') {
      setName(state.category.name);
      setSlug(state.category.slug);
      setDescription(state.category.description ?? '');
    } else if (state?.mode === 'create') {
      setName('');
      setSlug('');
      setDescription('');
    }
  }, [state]);

  async function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    if (state?.mode === 'create') {
      await createCategory.mutateAsync({ name, description: description || undefined });
    } else if (state?.mode === 'edit') {
      await updateCategory.mutateAsync({
        id: state.category.id,
        payload: { name, slug, description: description || undefined },
      });
    }
    onClose();
  }

  const submitting = createCategory.isPending || updateCategory.isPending;

  return (
    <Sidebar open={state !== null} onClose={onClose} title={state?.mode === 'edit' ? t.admin.categories.editCategory : t.admin.categories.newCategory}>
      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label htmlFor="category-name" className="block text-sm font-semibold text-content">
            {t.admin.categories.name}
          </label>
          <input
            id="category-name"
            required
            value={name}
            onChange={(event) => setName(event.target.value)}
            className={inputClass}
          />
        </div>

        {state?.mode === 'edit' && (
          <div>
            <label htmlFor="category-slug" className="block text-sm font-semibold text-content">
              {t.admin.categories.slug}
            </label>
            <input
              id="category-slug"
              required
              pattern="^[a-z0-9]+(-[a-z0-9]+)*$"
              title={t.admin.categories.slugTitle}
              value={slug}
              onChange={(event) => setSlug(event.target.value)}
              className={inputClass}
            />
          </div>
        )}

        <div>
          <label htmlFor="category-description" className="block text-sm font-semibold text-content">
            {t.admin.categories.description}{' '}
            <span className="font-normal text-content-muted">{t.common.optional}</span>
          </label>
          <textarea
            id="category-description"
            rows={3}
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            className={inputClass}
          />
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="h-11 w-full cursor-pointer rounded-md bg-brand px-5 text-sm font-semibold text-brand-content transition hover:bg-brand-hover active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {submitting
            ? t.common.saving
            : state?.mode === 'edit'
              ? t.common.saveChanges
              : t.admin.categories.createCategory}
        </button>
      </form>
    </Sidebar>
  );
}

function AdminCategoriesInner({ canManage }: { canManage: boolean }) {
  const { data: categories, isLoading } = useCategories();
  const deleteCategory = useDeleteCategory();

  const t = useTranslation();
  const [sidebarState, setSidebarState] = useState<SidebarState>(null);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);

  const pendingDeleteCategory = categories?.find((category) => category.id === pendingDeleteId) ?? null;

  const newCategoryButton = canManage && (
    <button
      type="button"
      onClick={() => setSidebarState({ mode: 'create' })}
      className="flex h-11 cursor-pointer items-center gap-2 rounded-md bg-brand px-5 text-sm font-semibold text-brand-content transition hover:bg-brand-hover active:scale-[0.98]"
    >
      <Plus size={16} />
      {t.admin.categories.newCategory}
    </button>
  );

  return (
    <div className="max-w-3xl">
      <AdminPageHeader title={t.admin.categories.heading} count={categories?.length} action={newCategoryButton} />

      <div className="mt-6">
        {isLoading && <AdminListSkeleton rows={4} />}

        {!isLoading && categories && categories.length === 0 && (
          <AdminEmptyState icon={Tags} message={t.admin.categories.empty} action={newCategoryButton} />
        )}

        {!isLoading && categories && categories.length > 0 && (
          <ul className="divide-y divide-border rounded-lg border border-border">
            {categories.map((category) => (
              <li
                key={category.id}
                className="flex items-center justify-between gap-4 px-5 py-4 transition-colors hover:bg-surface-muted"
              >
                <div className="min-w-0">
                  <p className="flex flex-wrap items-baseline gap-x-2.5">
                    <span className="font-semibold text-content">{category.name}</span>
                    {/* The slug is an identifier, not prose, so it is set in
                        the monospace face to read as one. */}
                    <span className="font-mono text-xs text-content-muted">{category.slug}</span>
                  </p>
                  {category.description && <p className="mt-1 text-sm text-content-muted">{category.description}</p>}
                </div>
                {canManage && (
                  <div className="flex shrink-0 gap-1">
                    <button
                      type="button"
                      onClick={() => setSidebarState({ mode: 'edit', category })}
                      aria-label={t.admin.editItem(category.name)}
                      className={`${ROW_ACTION_CLASS} hover:text-content`}
                    >
                      <Pencil size={16} />
                    </button>
                    <button
                      type="button"
                      onClick={() => setPendingDeleteId(category.id)}
                      aria-label={t.admin.deleteItem(category.name)}
                      className={`${ROW_ACTION_CLASS} hover:text-danger`}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>

      {canManage && <CategorySidebar state={sidebarState} onClose={() => setSidebarState(null)} />}

      <ConfirmDialog
        open={pendingDeleteCategory !== null}
        title={t.admin.categories.deleteTitle}
        message={t.admin.categories.deleteMessage(pendingDeleteCategory?.name ?? '')}
        confirmLabel={t.common.delete}
        danger
        onCancel={() => setPendingDeleteId(null)}
        onConfirm={() => {
          if (pendingDeleteCategory) {
            deleteCategory.mutate(pendingDeleteCategory.id);
          }
          setPendingDeleteId(null);
        }}
      />
    </div>
  );
}

export default function AdminCategoriesView() {
  const { authorized, user } = useRequireAdminAccess('categories:view');
  const t = useTranslation();

  useDocumentTitle(t.admin.title);

  if (!authorized || !user) {
    return <AdminListSkeleton rows={4} />;
  }

  const canManage = can(user, 'categories:manage');

  return (
    <QueryClientProvider client={getQueryClient()}>
      <AdminCategoriesInner canManage={canManage} />
    </QueryClientProvider>
  );
}
