import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  activateUser,
  createCategory,
  createProduct,
  deactivateUser,
  deleteCategory,
  deleteProduct,
  getAdminUserDetail,
  listAdminProducts,
  listAdminUsers,
  listCustomOrderItems,
  updateCategory,
  updateProduct,
  updateProductImages,
  updateProductStatus,
  updateProductVariants,
  updateUserPermissions,
  updateUserRole,
  uploadProductImages,
  type CreateCategoryPayload,
  type UpdateCategoryPayload,
  type CreateProductPayload,
  type ListAdminProductsParams,
  type ListAdminUsersParams,
  type ListCustomOrderItemsParams,
  type UpdateProductImageEntry,
  type UpdateProductPayload,
  type UpdateProductVariantEntry,
} from '../api/admin';
import { listProductViews, type ListProductViewsParams } from '../api/analytics';
import { useAuthStore } from '@/stores/auth-store';
import { useTranslation } from '@/i18n';
import type { Permission, ProductStatus, Role } from '../types';
import { errorMessage } from './error-message';

function useToken() {
  return useAuthStore((state) => state.accessToken) as string;
}

function useAdminEnabled() {
  const hasHydrated = useAuthStore((state) => state.hasHydrated);
  const accessToken = useAuthStore((state) => state.accessToken);
  return hasHydrated && Boolean(accessToken);
}

// -- Analytics ----------------------------------------------------------

export function useAdminProductViews(params: ListProductViewsParams = {}) {
  const token = useToken();
  const enabled = useAdminEnabled();

  return useQuery({
    queryKey: ['admin', 'product-views', params],
    queryFn: () => listProductViews(token, params),
    enabled,
    // Keeps the current rows up while the next page or search loads.
    placeholderData: keepPreviousData,
  });
}

// -- Custom prints ------------------------------------------------------

export function useAdminCustomOrderItems(params: ListCustomOrderItemsParams = {}) {
  const token = useToken();
  const enabled = useAdminEnabled();

  return useQuery({
    queryKey: ['admin', 'custom-order-items', params],
    queryFn: () => listCustomOrderItems(token, params),
    enabled,
    placeholderData: keepPreviousData,
  });
}

// -- Users --------------------------------------------------------------

export function useAdminUsers(params: ListAdminUsersParams = {}) {
  const token = useToken();
  const enabled = useAdminEnabled();

  return useQuery({
    queryKey: ['admin', 'users', params],
    queryFn: () => listAdminUsers(token, params),
    enabled,
    // Keeps the current rows up while the next page or search loads.
    placeholderData: keepPreviousData,
  });
}

export function useAdminUserDetail(id: string) {
  const token = useToken();
  const enabled = useAdminEnabled();

  return useQuery({
    queryKey: ['admin', 'user', id],
    queryFn: () => getAdminUserDetail(id, token),
    enabled,
  });
}

function useAdminUserMutation<TVariables>(
  mutationFn: (variables: TVariables, token: string) => Promise<unknown>,
  successMessage: string,
  errorFallback: string,
) {
  const token = useToken();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (variables: TVariables) => mutationFn(variables, token),
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
      const id = (variables as { id?: string }).id;
      if (id) {
        void queryClient.invalidateQueries({ queryKey: ['admin', 'user', id] });
      }
      toast.success(successMessage);
    },
    onError: (error) => {
      toast.error(errorMessage(error, errorFallback));
    },
  });
}

export function useUpdateUserRole() {
  const t = useTranslation();
  return useAdminUserMutation<{ id: string; role: Role }>(
    ({ id, role }, token) => updateUserRole(id, role, token),
    t.admin.roleUpdated,
    t.admin.roleError,
  );
}

export function useUpdateUserPermissions() {
  const t = useTranslation();
  return useAdminUserMutation<{ id: string; permissions: Permission[] }>(
    ({ id, permissions }, token) => updateUserPermissions(id, permissions, token),
    t.admin.permissionsUpdated,
    t.admin.permissionsError,
  );
}

export function useDeactivateUser() {
  const t = useTranslation();
  return useAdminUserMutation<{ id: string }>(
    ({ id }, token) => deactivateUser(id, token),
    t.admin.userDeactivated,
    t.admin.deactivateError,
  );
}

export function useActivateUser() {
  const t = useTranslation();
  return useAdminUserMutation<{ id: string }>(
    ({ id }, token) => activateUser(id, token),
    t.admin.userActivated,
    t.admin.activateError,
  );
}

// -- Products -------------------------------------------------------------

export function useAdminProducts(params: ListAdminProductsParams = {}) {
  const token = useToken();
  const enabled = useAdminEnabled();

  return useQuery({
    queryKey: ['admin', 'products', params],
    queryFn: () => listAdminProducts(token, params),
    enabled,
    // Keeps the current rows up while the next page or search loads.
    placeholderData: keepPreviousData,
  });
}

export function useCreateProduct() {
  const token = useToken();
  const t = useTranslation();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateProductPayload) => createProduct(payload, token),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['admin', 'products'] });
      toast.success(t.admin.products.created);
    },
    onError: (error) => {
      toast.error(errorMessage(error, t.admin.products.createError));
    },
  });
}

export function useUpdateProduct() {
  const token = useToken();
  const t = useTranslation();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateProductPayload }) =>
      updateProduct(id, payload, token),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['admin', 'products'] });
      toast.success(t.admin.products.updated);
    },
    onError: (error) => {
      toast.error(errorMessage(error, t.admin.products.updateError));
    },
  });
}

// No success toast on these two -- they're intermediate steps of the same
// edit-form "Save changes" submit as useUpdateProduct, which already shows
// one. `slug` (not used by the request itself) is only there so the
// product detail query the edit form and storefront both read can be
// invalidated too, not just the admin list.
export function useUpdateProductVariants() {
  const token = useToken();
  const t = useTranslation();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, variants }: { id: string; slug: string; variants: UpdateProductVariantEntry[] }) =>
      updateProductVariants(id, variants, token),
    onSuccess: (_data, { slug }) => {
      void queryClient.invalidateQueries({ queryKey: ['admin', 'products'] });
      void queryClient.invalidateQueries({ queryKey: ['product', slug] });
    },
    onError: (error) => {
      toast.error(errorMessage(error, t.admin.products.variantsError));
    },
  });
}

export function useUpdateProductImages() {
  const token = useToken();
  const t = useTranslation();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, images }: { id: string; slug: string; images: UpdateProductImageEntry[] }) =>
      updateProductImages(id, images, token),
    onSuccess: (_data, { slug }) => {
      void queryClient.invalidateQueries({ queryKey: ['admin', 'products'] });
      void queryClient.invalidateQueries({ queryKey: ['product', slug] });
    },
    onError: (error) => {
      toast.error(errorMessage(error, t.admin.products.imagesError));
    },
  });
}

export function useUploadProductImages() {
  const token = useToken();
  const t = useTranslation();

  return useMutation({
    mutationFn: (files: File[]) => uploadProductImages(files, token),
    onError: (error) => {
      toast.error(errorMessage(error, t.admin.products.uploadError));
    },
  });
}

export function useUpdateProductStatus() {
  const token = useToken();
  const t = useTranslation();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: ProductStatus }) => updateProductStatus(id, status, token),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['admin', 'products'] });
      toast.success(t.admin.products.statusUpdated);
    },
    onError: (error) => {
      toast.error(errorMessage(error, t.admin.products.statusError));
    },
  });
}

export function useDeleteProduct() {
  const token = useToken();
  const t = useTranslation();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteProduct(id, token),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['admin', 'products'] });
      toast.success(t.admin.products.deleted);
    },
    onError: (error) => {
      toast.error(errorMessage(error, t.admin.products.deleteError));
    },
  });
}

// -- Categories -------------------------------------------------------------

export function useCreateCategory() {
  const token = useToken();
  const t = useTranslation();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateCategoryPayload) => createCategory(payload, token),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['categories'] });
      toast.success(t.admin.categories.created);
    },
    onError: (error) => {
      toast.error(errorMessage(error, t.admin.categories.createError));
    },
  });
}

export function useUpdateCategory() {
  const token = useToken();
  const t = useTranslation();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateCategoryPayload }) =>
      updateCategory(id, payload, token),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['categories'] });
      toast.success(t.admin.categories.updated);
    },
    onError: (error) => {
      toast.error(errorMessage(error, t.admin.categories.updateError));
    },
  });
}

export function useDeleteCategory() {
  const token = useToken();
  const t = useTranslation();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteCategory(id, token),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['categories'] });
      toast.success(t.admin.categories.deleted);
    },
    onError: (error) => {
      toast.error(errorMessage(error, t.admin.categories.deleteError));
    },
  });
}
