import { Heart } from 'lucide-react';
import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { useTranslation } from '@/i18n';

interface Props {
  liked: boolean;
  count: number;
  onToggle: (liked: boolean) => void;
  /** Label for screen readers, e.g. the comment author's name. */
  label?: string;
  disabled?: boolean;
}

const SPARK_COUNT = 6;
const SPARK_DISTANCE_PX = 14;
// Must outlast the longest keyframe in global.css (like-spark, 420ms).
const BURST_MS = 450;

// Precomputed so the ring is identical on every render and never re-randomized
// mid-animation.
const SPARKS = Array.from({ length: SPARK_COUNT }, (_, index) => {
  const angle = (index / SPARK_COUNT) * 2 * Math.PI;
  return {
    x: `${(Math.cos(angle) * SPARK_DISTANCE_PX).toFixed(2)}px`,
    y: `${(Math.sin(angle) * SPARK_DISTANCE_PX).toFixed(2)}px`,
  };
});

/**
 * Heart toggle with a pop + radial spark burst on like.
 *
 * The animation is driven entirely by local state keyed off the click, not by
 * the server response, so it fires immediately and is unaffected by request
 * latency. `liked`/`count` stay fully controlled by the caller (which updates
 * them optimistically), so a failed request simply rolls the icon back.
 */
export default function LikeButton({ liked, count, onToggle, label, disabled = false }: Props) {
  // Identifies the current burst. Used as a React key so each like mounts
  // brand-new spark/heart elements, which is what makes the keyframes replay
  // on a repeat click. Deliberately not a "restart via requestAnimationFrame"
  // toggle: rAF does not run while the tab is hidden, so the deferred
  // callback could land after the cleanup timeout had already fired and
  // leave the sparks stuck on screen for good.
  const t = useTranslation();
  const [burstId, setBurstId] = useState<number | null>(null);
  const burstCounter = useRef(0);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  function handleClick() {
    const next = !liked;
    onToggle(next);

    // Only the "like" direction animates — un-liking is a correction, and
    // celebrating it reads as noise.
    if (next) {
      // A rapid double-click would otherwise leave the first timeout to clear
      // the second burst early, cutting the animation off part way.
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      burstCounter.current += 1;
      setBurstId(burstCounter.current);
      timeoutRef.current = setTimeout(() => setBurstId(null), BURST_MS);
    }
  }

  const bursting = burstId !== null;

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={disabled}
      aria-pressed={liked}
      aria-label={
        label ? t.comments.likeLabel(liked, label, count) : t.comments.likeLabelPlain(liked, count)
      }
      className={`group flex cursor-pointer items-center gap-1.5 text-xs transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
        liked ? 'text-danger' : 'text-content-muted hover:text-danger'
      }`}
    >
      <span className="relative flex h-4 w-4 items-center justify-center">
        <Heart
          // Remounted per burst (see burstId) so the pop keyframe restarts
          // from zero on a repeat click instead of the class simply staying
          // applied and never replaying.
          // Namespaced: the spark wrapper below is a sibling keyed off the
          // same burstId, and two siblings sharing a key makes React
          // duplicate or drop them (it leaves orphaned hearts behind).
          key={`heart-${burstId ?? 'idle'}`}
          size={14}
          // `fill-current` inherits the text color set above, so the filled
          // heart matches the label in both themes without a second token.
          className={`${liked ? 'fill-current' : ''} ${bursting ? 'animate-like-pop' : ''}`}
        />
        {bursting && (
          <span
            key={`sparks-${burstId}`}
            aria-hidden="true"
            className="pointer-events-none absolute inset-0"
          >
            {SPARKS.map((spark, index) => (
              <span
                key={index}
                // Centered with negative margins, not -translate-x/y-1/2:
                // the keyframe owns `transform` outright, so a centering
                // transform here would be overwritten the moment it runs.
                className="animate-like-spark absolute top-1/2 left-1/2 -mt-0.5 -ml-0.5 h-1 w-1 rounded-full bg-danger"
                style={
                  {
                    '--spark-x': spark.x,
                    '--spark-y': spark.y,
                  } as CSSProperties
                }
              />
            ))}
          </span>
        )}
      </span>

      {/* Keyed on the value so React remounts the span and the slide-up
          replays on every change, rather than the text swapping silently. */}
      <span key={count} className="animate-like-count tabular-nums">
        {count}
      </span>
    </button>
  );
}
