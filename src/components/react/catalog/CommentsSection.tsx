import { Trash2 } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useAuthStore } from '@/stores/auth-store';
import {
  useComments,
  useCreateComment,
  useDeleteComment,
  useSetCommentLike,
} from '@/lib/queries/comments';
import type { Comment } from '@/lib/types';
import { useFormat } from '@/lib/format';
import { useTranslation, type Dictionary } from '@/i18n';
import Avatar from '../Avatar';
import CommentComposer, { type CommentDraft } from './CommentComposer';
import CommentImage from './CommentImage';
import ConfirmDialog from '../ui/ConfirmDialog';
import LikeButton from '../ui/LikeButton';

interface Props {
  productId: string;
}

/**
 * Mirrors the backend's MAX_COMMENT_DEPTH. Replying to a comment already at
 * this depth is still allowed — the API re-parents it so it lands alongside
 * that comment instead of below it — so there is no depth at which the Reply
 * button disappears.
 */
const MAX_DEPTH = 3;

// Indent per level. Kept as whole classes rather than a template string
// because Tailwind only emits utilities it can see literally in the source.
const INDENT_BY_DEPTH: Record<number, string> = {
  1: '',
  2: 'ml-6 sm:ml-11',
  3: 'ml-12 sm:ml-22',
};

interface CommentNode extends Comment {
  replies: CommentNode[];
}

/**
 * The API returns each root immediately followed by its descendants, already
 * ordered. This only re-nests that flat list; it never reorders it.
 */
function buildTree(items: Comment[]): CommentNode[] {
  const byId = new Map<string, CommentNode>(
    items.map((item) => [item.id, { ...item, replies: [] }]),
  );
  const roots: CommentNode[] = [];

  for (const item of items) {
    const node = byId.get(item.id)!;
    const parent = item.parentId ? byId.get(item.parentId) : undefined;
    // A reply whose parent fell outside this page is shown as a root rather
    // than dropped, so no comment can ever go missing from the list.
    if (parent) {
      parent.replies.push(node);
    } else {
      roots.push(node);
    }
  }

  return roots;
}

function CommentItem({
  t,
  format,
  node,
  currentUserId,
  canInteract,
  replyingTo,
  replyPending,
  onStartReply,
  onCancelReply,
  onReply,
  onDelete,
  onToggleLike,
}: {
  t: Dictionary;
  format: ReturnType<typeof useFormat>;
  node: CommentNode;
  currentUserId: string | undefined;
  canInteract: boolean;
  replyingTo: string | null;
  replyPending: boolean;
  onStartReply: (commentId: string) => void;
  onCancelReply: () => void;
  onReply: (parentId: string, draft: CommentDraft, reset: () => void) => void;
  onDelete: (commentId: string) => void;
  onToggleLike: (commentId: string, liked: boolean) => void;
}) {
  const isOwn = node.author.id === currentUserId;
  const indent = INDENT_BY_DEPTH[Math.min(node.depth, MAX_DEPTH)] ?? '';

  return (
    <li className={indent}>
      <div className="flex gap-3 py-4">
        <Avatar
          name={node.author.name}
          avatarUrl={node.author.avatarUrl}
          className={node.depth === 1 ? 'h-8 w-8 text-sm' : 'h-6 w-6 text-xs'}
        />
        <div className="flex-1">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-baseline gap-2">
              <span className="text-sm font-medium text-content">{node.author.name}</span>
              <span className="text-xs text-content-muted">{format.date(node.createdAt)}</span>
            </div>
            {isOwn && (
              <button
                type="button"
                aria-label={t.comments.deleteLabel}
                onClick={() => onDelete(node.id)}
                className="cursor-pointer text-content-muted hover:text-danger"
              >
                <Trash2 size={14} />
              </button>
            )}
          </div>

          <p className="mt-1 text-sm text-content">{node.body}</p>

          {node.image && (
            <CommentImage
              image={node.image}
              alt={t.comments.imageAlt(node.author.name)}
              openLabel={t.comments.openImage(node.author.name)}
            />
          )}

          <div className="mt-2 flex items-center gap-4">
            <LikeButton
              liked={node.likedByViewer}
              count={node.likeCount}
              label={node.author.name}
              onToggle={(liked) => onToggleLike(node.id, liked)}
            />
            {canInteract ? (
              <button
                type="button"
                onClick={() => onStartReply(node.id)}
                className="cursor-pointer text-xs text-content-muted hover:text-content"
              >
                {t.comments.reply}
              </button>
            ) : (
              <a href="/login" className="text-xs text-content-muted hover:text-content">
                {t.comments.reply}
              </a>
            )}
          </div>

          {replyingTo === node.id && (
            <CommentComposer
              compact
              autoFocus
              placeholder={t.comments.replyPlaceholder(node.author.name)}
              label={t.comments.replyLabel(node.author.name)}
              submitLabel={t.comments.reply}
              pendingLabel={t.comments.replying}
              pending={replyPending}
              onCancel={onCancelReply}
              onSubmit={(draft, reset) => onReply(node.id, draft, reset)}
            />
          )}
        </div>
      </div>

      {node.replies.length > 0 && (
        // border-l draws the thread line; the replies' own ml-* indent keeps
        // it clear of the avatar column above.
        <ul className="border-l border-border">
          {node.replies.map((reply) => (
            <CommentItem
              key={reply.id}
              t={t}
              format={format}
              node={reply}
              currentUserId={currentUserId}
              canInteract={canInteract}
              replyingTo={replyingTo}
              replyPending={replyPending}
              onStartReply={onStartReply}
              onCancelReply={onCancelReply}
              onReply={onReply}
              onDelete={onDelete}
              onToggleLike={onToggleLike}
            />
          ))}
        </ul>
      )}
    </li>
  );
}

export default function CommentsSection({ productId }: Props) {
  const hasHydrated = useAuthStore((state) => state.hasHydrated);
  const accessToken = useAuthStore((state) => state.accessToken);
  const user = useAuthStore((state) => state.user);
  const { data, isLoading } = useComments(productId);
  const createComment = useCreateComment(productId);
  const deleteComment = useDeleteComment(productId);
  const setLike = useSetCommentLike(productId);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const t = useTranslation();
  const format = useFormat();

  const isLoggedIn = hasHydrated && Boolean(accessToken);
  const tree = useMemo(() => buildTree(data?.items ?? []), [data?.items]);

  // The draft (text and image) is only cleared once the API has accepted it,
  // so a rejected comment — moderation, a bad file — is still there to fix.
  function handleSubmit(draft: CommentDraft, reset: () => void) {
    createComment.mutate(draft, { onSuccess: reset });
  }

  function handleReply(parentId: string, draft: CommentDraft, reset: () => void) {
    createComment.mutate(
      { ...draft, parentId },
      {
        onSuccess: () => {
          reset();
          setReplyingTo(null);
        },
      },
    );
  }

  function handleToggleLike(commentId: string, liked: boolean) {
    // Liking is the one action a logged-out visitor can reach (counts are
    // public), so send them to log in rather than firing a doomed request.
    if (!isLoggedIn) {
      window.location.href = '/login';
      return;
    }
    setLike.mutate({ commentId, liked });
  }

  // Deleting a comment takes its replies with it (the API cascades), so the
  // confirmation says so when there are any.
  const pendingDelete = pendingDeleteId
    ? (data?.items ?? []).find((item) => item.id === pendingDeleteId)
    : undefined;
  const pendingDeleteReplyCount = pendingDelete
    ? (data?.items ?? []).filter((item) => item.parentId === pendingDelete.id).length
    : 0;

  return (
    <div className="mt-16 border-t border-border pt-8">
      <h2 className="text-lg font-semibold text-content">
        {data ? t.comments.headingWithCount(data.total) : t.comments.heading}
      </h2>

      {isLoading && <p className="mt-4 text-sm text-content-muted">{t.comments.loading}</p>}

      {data && data.items.length === 0 && (
        <p className="mt-4 text-sm text-content-muted">{t.comments.empty}</p>
      )}

      {tree.length > 0 && (
        <ul className="mt-2 divide-y divide-border">
          {tree.map((node) => (
            <CommentItem
              key={node.id}
              t={t}
              format={format}
              node={node}
              currentUserId={user?.id}
              canInteract={isLoggedIn}
              replyingTo={replyingTo}
              replyPending={createComment.isPending}
              onStartReply={setReplyingTo}
              onCancelReply={() => setReplyingTo(null)}
              onReply={handleReply}
              onDelete={setPendingDeleteId}
              onToggleLike={handleToggleLike}
            />
          ))}
        </ul>
      )}

      {isLoggedIn ? (
        <CommentComposer
          placeholder={t.comments.placeholder}
          label={t.comments.label}
          submitLabel={t.comments.post}
          pendingLabel={t.comments.posting}
          // Only "pending" for this form when it is the one being submitted —
          // a reply in flight shouldn't relabel the main button.
          pending={createComment.isPending && replyingTo === null}
          onSubmit={handleSubmit}
        />
      ) : (
        hasHydrated && (
          <p className="mt-6 text-sm text-content-muted">
            <a href="/login" className="text-brand hover:underline">
              {t.comments.logInPrompt}
            </a>
            {t.comments.logInSuffix}
          </p>
        )
      )}

      <ConfirmDialog
        open={pendingDeleteId !== null}
        title={t.comments.deleteTitle}
        message={
          pendingDeleteReplyCount > 0
            ? t.comments.deleteWithReplies(pendingDeleteReplyCount)
            : t.comments.deleteMessage
        }
        confirmLabel={t.common.delete}
        danger
        onCancel={() => setPendingDeleteId(null)}
        onConfirm={() => {
          if (pendingDeleteId) {
            deleteComment.mutate(pendingDeleteId);
          }
          setPendingDeleteId(null);
        }}
      />
    </div>
  );
}
