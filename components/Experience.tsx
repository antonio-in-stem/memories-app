'use client';

import dynamic from 'next/dynamic';
import { animated, useSpring } from '@react-spring/web';
import {
  AnimatePresence,
  motion,
  useScroll,
  useTransform,
  type Variants,
} from 'framer-motion';
import {
  ArrowRight,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  Heart,
  Layers3,
  MessageCircle,
  MoreHorizontal,
  Moon,
  SlidersHorizontal,
  Search,
  Sparkles,
  Sun,
  ThumbsUp,
  Users2,
  X,
} from 'lucide-react';
import { forwardRef, memo, useCallback, useDeferredValue, useEffect, useMemo, useRef, useState, type CSSProperties, type PointerEvent } from 'react';
import {
  countComments,
  filterProfiles,
  flattenComments,
  formatDate,
  formatNumber,
  memoryMatches,
  sortComments,
  summarizeDirectory,
  type Comment,
  type Directory,
  type Memory,
  type Profile,
} from '@/lib/data';
import { roleStyle } from '@/lib/roles';
import { useMemoryStore } from '@/store/memory-store';
import { RiveSignal } from './RiveSignal';
import { MagneticField } from './MagneticField';
import { SmoothScroll } from './SmoothScroll';

const ShaderAurora = dynamic(() => import('./ShaderAurora').then((module) => module.ShaderAurora), {
  ssr: false,
});

const cardVariants: Variants = {
  hidden: { opacity: 0, y: 28, scale: 0.98 },
  show: (index: number) => ({
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      delay: Math.min(index, FEED_BATCH_SIZE - 1) * 0.035,
      duration: 0.62,
      ease: [0.16, 1, 0.3, 1],
    },
  }),
};

const INITIAL_FEED_SIZE = 8;
const FEED_BATCH_SIZE = 8;
const pointerGlowStates = new WeakMap<HTMLElement, { frame: number; x: number; y: number }>();

export function Experience({ directory }: { directory: Directory }) {
  const { scrollYProgress } = useScroll();
  const heroLift = useTransform(scrollYProgress, [0, 0.28], [0, -36]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.32], [1, 0.72]);
  const query = useMemoryStore((state) => state.query);
  const deferredQuery = useDeferredValue(query);
  const activeProfile = useMemoryStore((state) => state.activeProfile);
  const activeRole = useMemoryStore((state) => state.activeRole);
  const theme = useMemoryStore((state) => state.theme);
  const setTheme = useMemoryStore((state) => state.setTheme);

  useEffect(() => {
    const stored = window.localStorage.getItem('memories.theme');
    if (stored === 'dark' || stored === 'light') {
      setTheme(stored);
    }
  }, [setTheme]);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    window.localStorage.setItem('memories.theme', theme);
  }, [theme]);

  const visibleProfiles = useMemo(() => filterProfiles(directory, deferredQuery), [directory, deferredQuery]);
  const roles = useMemo(() => getRoleOptions(directory.profiles), [directory.profiles]);
  const visibleMemories = useMemo(
    () =>
      directory.feed.filter((memory) => {
        const profileMatches = activeProfile === 'all' || memory.recipient.username === activeProfile;
        const roleMatches =
          activeRole === 'all' ||
          memory.author.role === activeRole ||
          memory.recipient.role === activeRole;
        return profileMatches && roleMatches && memoryMatches(memory, deferredQuery);
      }),
    [activeProfile, activeRole, deferredQuery, directory],
  );
  const [feedLimit, setFeedLimit] = useState(INITIAL_FEED_SIZE);
  const displayedMemories = useMemo(() => visibleMemories.slice(0, feedLimit), [feedLimit, visibleMemories]);
  const visibleMemoryIds = useMemo(() => visibleMemories.map((memory) => memory.id), [visibleMemories]);
  const hasMoreMemories = feedLimit < visibleMemories.length;
  const loadMoreMemories = useCallback(() => {
    setFeedLimit((current) => Math.min(current + FEED_BATCH_SIZE, visibleMemories.length));
  }, [visibleMemories.length]);

  useEffect(() => {
    setFeedLimit(INITIAL_FEED_SIZE);
  }, [activeProfile, activeRole, deferredQuery]);

  const summary = useMemo(() => summarizeDirectory(directory), [directory]);
  const spotlight = useMemo(
    () => getSpotlightProfile(directory, activeProfile, visibleMemories),
    [activeProfile, directory, visibleMemories],
  );
  const spotlightMemories = useMemo(
    () => directory.feed.filter((memory) => memory.recipient.username === spotlight.username),
    [directory.feed, spotlight.username],
  );

  return (
    <>
      <SmoothScroll />
      <ShaderAurora />
      <MagneticField />
      <motion.div className="scroll-progress" style={{ scaleX: scrollYProgress }} />
      <TopBar />
      <main className="app-shell">
        <motion.section className="hero-shell" style={{ y: heroLift, opacity: heroOpacity }}>
          <Hero
            generation={directory.generation}
            profileCount={summary.profileCount}
            memoryCount={summary.memoryCount}
            heartCount={summary.heartCount}
            commentCount={summary.commentCount}
            memories={directory.feed}
          />
        </motion.section>

        {directory.errors.length > 0 && (
          <div className="data-alert" role="status">
            {directory.errors.length} data issue(s) found. {directory.errors.slice(0, 2).join(' ')}
          </div>
        )}

        <ProfileRail profiles={visibleProfiles} />
        <RoleFilter roles={roles} />

        <section className="content-grid" aria-label="Memories experience">
          <section className="feed-area" aria-label="Featured recognition">
            <div className="section-heading">
              <span>Featured recognition</span>
              <strong>{visibleMemories.length} memories</strong>
            </div>
            <motion.div className="feed-list" initial="hidden" animate="show">
              <AnimatePresence>
                {displayedMemories.length === 0 ? (
                  <EmptyState key="empty" />
                ) : (
                  displayedMemories.map((memory, index) => (
                    <MemoryCard
                      key={memory.id}
                      memory={memory}
                      index={index}
                      visibleMemoryIds={visibleMemoryIds}
                    />
                  ))
                )}
              </AnimatePresence>
              {hasMoreMemories ? (
                <FeedLoader
                  remainingCount={visibleMemories.length - displayedMemories.length}
                  onLoadMore={loadMoreMemories}
                />
              ) : null}
            </motion.div>
          </section>

          <aside className="insight-stack" aria-label="Recognition insight">
            <SpotlightPanel profile={spotlight} memories={spotlightMemories} />
            <MemoryTimeline memories={visibleMemories} />
            <Leaderboard profiles={summary.topProfiles} />
          </aside>
        </section>
      </main>
      <MemoryStackDialog memories={directory.feed} />
    </>
  );
}

function TopBar() {
  const query = useMemoryStore((state) => state.query);
  const setQuery = useMemoryStore((state) => state.setQuery);
  const theme = useMemoryStore((state) => state.theme);
  const toggleTheme = useMemoryStore((state) => state.toggleTheme);

  return (
    <header className="topbar progressive-blur">
      <a className="brand" href="#" aria-label="Memories home">
        <span className="brand-orbit" />
        <span>Memories</span>
      </a>
      <label className="search-field">
        <Search size={18} />
        <span className="sr-only">Search memories</span>
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          type="search"
          placeholder="Search people, roles, memories"
        />
      </label>
      <button className="icon-button" type="button" onClick={toggleTheme} aria-label="Toggle color theme">
        {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
      </button>
    </header>
  );
}

function Hero({
  generation,
  profileCount,
  memoryCount,
  heartCount,
  commentCount,
  memories,
}: {
  generation: string;
  profileCount: number;
  memoryCount: number;
  heartCount: number;
  commentCount: number;
  memories: Memory[];
}) {
  const metrics = [
    ['People', profileCount, Users2],
    ['Memories', memoryCount, Layers3],
    ['Hearts', heartCount, Heart],
    ['Comments', commentCount, MessageCircle],
  ] as const;

  return (
    <section className="hero-card radiant-border" onPointerMove={trackPointerGlow}>
      <div className="hero-copy">
        <span className="eyebrow">{generation}</span>
        <h1>
          Recognition that feels
          <span> alive.</span>
        </h1>
        <p>
          A flagship-grade memory wall for professional shout outs, powered by live motion,
          role-aware gradients, glass depth, and a cinematic story stack.
        </p>
        <div className="hero-actions">
          <a href="#feed" className="primary-action">
            Explore memories <ArrowRight size={18} />
          </a>
          <RiveSignal />
        </div>
      </div>
      <div className="hero-signal">
        <HeroPulsePanel memories={memories} />
        <div className="metric-grid">
          {metrics.map(([label, value, Icon]) => (
            <motion.div
              className="metric-card radiant-border"
              key={label}
              whileHover={{ y: -6, scale: 1.025 }}
              transition={{ type: 'spring', stiffness: 280, damping: 22 }}
              onPointerMove={trackPointerGlow}
            >
              <Icon size={18} />
              <strong>{formatNumber(value)}</strong>
              <span>{label}</span>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

function HeroPulsePanel({ memories }: { memories: Memory[] }) {
  const featured = memories.slice(0, 4);

  return (
    <div className="hero-pulse-panel radiant-border">
      <div className="signal-label">
        <Sparkles size={16} />
        Recognition pulse
      </div>
      <div className="hero-pulse-copy">
        <strong>Latest human signals</strong>
        <span>{formatNumber(memories.length)} curated memories flowing through the team.</span>
      </div>
      <div className="hero-pulse-list">
        {featured.map((memory) => (
          <div className="hero-pulse-row" key={memory.id}>
            <Avatar profile={memory.author} size="sm" />
            <span>
              <strong>{memory.author.name}</strong>
              <em>recognized {memory.recipient.name}</em>
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function ProfileRail({ profiles }: { profiles: Profile[] }) {
  const activeProfile = useMemoryStore((state) => state.activeProfile);
  const setActiveProfile = useMemoryStore((state) => state.setActiveProfile);
  const entries: Array<Profile | null> = [null, ...profiles];

  return (
    <section className="profile-rail-shell radiant-border" aria-label="Profiles" onPointerMove={trackPointerGlow}>
      <button
        className="rail-control rail-control-left"
        type="button"
        aria-label="Previous team members"
        onClick={() => scrollRail(-1)}
      >
        <ChevronLeft size={20} />
      </button>
      <div id="profileRail" className="profile-rail" role="region" aria-label="Team members">
        {entries.map((profile) => (
          <ProfileToken
            key={profile?.username || 'all'}
            profile={profile}
            active={activeProfile === (profile?.username || 'all')}
            onClick={() => setActiveProfile(profile?.username || 'all')}
          />
        ))}
      </div>
      <button
        className="rail-control rail-control-right"
        type="button"
        aria-label="Next team members"
        onClick={() => scrollRail(1)}
      >
        <ChevronRight size={20} />
      </button>
    </section>
  );
}

function RoleFilter({ roles }: { roles: string[] }) {
  const activeRole = useMemoryStore((state) => state.activeRole);
  const setActiveRole = useMemoryStore((state) => state.setActiveRole);

  return (
    <section className="role-filter" aria-label="Role filters">
      <motion.button
        type="button"
        className="role-filter-chip"
        data-active={activeRole === 'all'}
        onClick={() => setActiveRole('all')}
        whileTap={{ scale: 0.96 }}
      >
        <Sparkles size={15} />
        All signals
      </motion.button>
      {roles.map((role) => (
        <motion.button
          type="button"
          className="role-filter-chip"
          data-active={activeRole === role}
          key={role}
          style={roleStyle(role)}
          onClick={() => setActiveRole(role)}
          whileTap={{ scale: 0.96 }}
        >
          {role}
        </motion.button>
      ))}
    </section>
  );
}

function ProfileToken({
  profile,
  active,
  onClick,
}: {
  profile: Profile | null;
  active: boolean;
  onClick: () => void;
}) {
  const [spring, api] = useSpring(() => ({ y: 0, scale: 1, rotateZ: 0 }));
  const style = profile ? roleStyle(profile.role) : roleStyle('lead');

  return (
    <animated.button
      className="profile-token"
      type="button"
      style={{ ...spring, ...style }}
      data-active={active}
      onClick={onClick}
      onPointerEnter={() => api.start({ y: -10, scale: 1.075, rotateZ: active ? 0 : -1.2 })}
      onPointerLeave={() => api.start({ y: 0, scale: 1, rotateZ: 0 })}
    >
      {profile ? <Avatar profile={profile} size="lg" /> : <AllAvatar />}
      <strong>{profile?.name || 'All'}</strong>
      <span>{profile ? `${profile.memoryCount} memories` : 'Full feed'}</span>
    </animated.button>
  );
}

const MemoryCard = memo(function MemoryCard({
  memory,
  index,
  visibleMemoryIds,
}: {
  memory: Memory;
  index: number;
  visibleMemoryIds: string[];
}) {
  const openMemoryStack = useMemoryStore((state) => state.openMemoryStack);
  const heartBump = useMemoryStore((state) => state.heartBumps[memory.id] || 0);
  const hearts = memory.heartCount + heartBump;
  const commentTotal = countComments(memory.comments);

  return (
    <motion.article
      id={index === 0 ? 'feed' : undefined}
      className="memory-card radiant-border"
      custom={index}
      variants={cardVariants}
      onPointerMove={trackPointerGlow}
    >
      <div className="memory-media">
        {memory.image ? <img src={memory.image} alt={`Memory for ${memory.recipient.name}`} loading="lazy" decoding="async" /> : null}
        <MemoryHeartButton memoryId={memory.id} count={hearts} label={`Favorite memory for ${memory.recipient.name}`} />
      </div>
      <div className="memory-content">
        <MemoryRoute memory={memory} />
        <button className="memory-shoutout" type="button" onClick={() => openMemoryStack(visibleMemoryIds, memory.id)}>
          {memory.shoutout}
        </button>
        <LikeStrip profiles={memory.likedBy} overflowCount={Math.max(0, memory.heartCount - memory.likedBy.length)} />
        <div className="memory-meta">
          <span>{commentTotal} comments</span>
          <span>{formatDate(memory.createdAt)}</span>
          <button type="button" data-open-memory={memory.id} onClick={() => openMemoryStack(visibleMemoryIds, memory.id)}>
            <BookOpen size={15} />
            Read story
            <ArrowRight size={15} />
          </button>
        </div>
        {memory.comments.length > 0 && (
          <RotatingCommentPreview
            memory={memory}
            seed={index}
            onOpen={() => openMemoryStack(visibleMemoryIds, memory.id, 'comments')}
          />
        )}
      </div>
    </motion.article>
  );
});

function MemoryHeartButton({ memoryId, count, label, className = '' }: { memoryId: string; count: number; label: string; className?: string }) {
  const bumpHeart = useMemoryStore((state) => state.bumpHeart);
  const bumpCount = useMemoryStore((state) => state.heartBumps[memoryId] || 0);
  const particles = useMemo(
    () =>
      Array.from({ length: 8 }, (_, index) => ({
        id: index,
        angle: index * 45 - 10,
        distance: 34 + (index % 3) * 8,
      })),
    [],
  );

  return (
    <motion.button
      className={`heart-button ${className}`.trim()}
      type="button"
      onClick={() => bumpHeart(memoryId)}
      aria-label={label}
      whileHover={{ scale: 1.065, y: -3 }}
      whileTap={{ scale: 0.9 }}
      transition={{ type: 'spring', stiffness: 430, damping: 18, mass: 0.7 }}
    >
      <span className="heart-aura" />
      <motion.span
        className="heart-core"
        animate={bumpCount > 0 ? { scale: [1, 1.36, 0.96, 1], rotate: [0, -8, 6, 0] } : { scale: 1, rotate: 0 }}
        transition={{ duration: 0.56, ease: [0.16, 1, 0.3, 1] }}
      >
        <Heart size={18} fill="currentColor" />
      </motion.span>
      <motion.strong
        key={count}
        initial={{ y: 8, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.34, ease: [0.16, 1, 0.3, 1] }}
      >
        {formatNumber(count)}
      </motion.strong>
      <AnimatePresence>
        {bumpCount > 0 ? (
          <motion.span
            className="heart-burst"
            key={bumpCount}
            initial={{ opacity: 0, y: 8, scale: 0.56 }}
            animate={{ opacity: 1, y: -24, scale: 1 }}
            exit={{ opacity: 0, y: -42, scale: 0.78 }}
            transition={{ duration: 0.62, ease: [0.16, 1, 0.3, 1] }}
          >
            +1
          </motion.span>
        ) : null}
      </AnimatePresence>
      <AnimatePresence>
        {bumpCount > 0 ? (
          <span className="heart-particles" key={`particles-${bumpCount}`} aria-hidden="true">
            {particles.map((particle) => (
              <span
                className="heart-particle"
                key={particle.id}
                style={
                  {
                    '--burst-angle': `${particle.angle}deg`,
                    '--burst-distance': `${particle.distance}px`,
                  } as CSSProperties
                }
              />
            ))}
          </span>
        ) : null}
      </AnimatePresence>
    </motion.button>
  );
}

function FeedLoader({ remainingCount, onLoadMore }: { remainingCount: number; onLoadMore: () => void }) {
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const loadingRef = useRef(false);
  const timeoutRef = useRef<number | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) {
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting || loadingRef.current) {
          return;
        }

        loadingRef.current = true;
        setLoading(true);
        timeoutRef.current = window.setTimeout(() => {
          onLoadMore();
          loadingRef.current = false;
          setLoading(false);
        }, 520);
      },
      { rootMargin: '520px 0px' },
    );

    observer.observe(sentinel);

    return () => observer.disconnect();
  }, [onLoadMore]);

  useEffect(
    () => () => {
      if (timeoutRef.current) {
        window.clearTimeout(timeoutRef.current);
      }
    },
    [],
  );

  return (
    <div className="feed-loader" ref={sentinelRef} data-loading={loading} aria-live="polite">
      <FeedSkeletons />
      <span>{formatNumber(remainingCount)} more memories in the feed</span>
    </div>
  );
}

function FeedSkeletons() {
  return (
    <div className="feed-skeletons" aria-hidden="true">
      {Array.from({ length: 2 }).map((_, index) => (
        <div className="feed-skeleton-card radiant-border" key={index}>
          <span className="feed-skeleton-media" />
          <span className="feed-skeleton-line short" />
          <span className="feed-skeleton-line" />
          <span className="feed-skeleton-line wide" />
        </div>
      ))}
    </div>
  );
}

function MemoryRoute({ memory }: { memory: Memory }) {
  const authorNames = [memory.author, ...memory.coAuthors].map((profile) => profile.name).join(', ');

  return (
    <div className="memory-route">
      <AuthorGalaxy memory={memory} />
      <span className="route-line" />
      <Avatar profile={memory.recipient} size="md" />
      <div className="route-text">
        <strong>
          {authorNames} to {memory.recipient.name}
        </strong>
        <div className="route-roles">
          <span className="role-chip" style={roleStyle(memory.author.role)}>
            {memory.author.role}
          </span>
          <span className="role-chip" style={roleStyle(memory.recipient.role)}>
            {memory.recipient.role}
          </span>
        </div>
      </div>
    </div>
  );
}

function AuthorGalaxy({ memory }: { memory: Memory }) {
  const orbiters = memory.coAuthors.slice(0, 3);

  return (
    <span className="author-galaxy" data-has-orbiters={orbiters.length > 0}>
      <Avatar profile={memory.author} size="md" />
      {orbiters.map((profile, index) => (
        <span className="author-orbiter" data-orbit={index} key={profile.username}>
          <Avatar profile={profile} size="sm" />
        </span>
      ))}
    </span>
  );
}

function LikeStrip({ profiles, overflowCount = 0 }: { profiles: Profile[]; overflowCount?: number }) {
  const visible = profiles.slice(0, 8);

  if (visible.length === 0 && overflowCount === 0) {
    return null;
  }

  return (
    <div className="like-strip" aria-label="People who liked this memory">
      <div className="like-strip-avatars">
        {visible.map((profile) => (
          <Avatar key={profile.username} profile={profile} size="sm" />
        ))}
        {overflowCount > 0 ? (
          <span className="like-overflow">
            <MoreHorizontal size={17} />
          </span>
        ) : null}
      </div>
      <span>{overflowCount > 0 ? `${formatNumber(overflowCount)} more celebrated this` : 'Celebrated by the team'}</span>
    </div>
  );
}

function RotatingCommentPreview({ memory, seed, onOpen }: { memory: Memory; seed: number; onOpen: () => void }) {
  const comments = useMemo(() => flattenComments(memory.comments), [memory.comments]);
  const [index, setIndex] = useState(0);
  const [visible, setVisible] = useState(false);
  const previewRef = useRef<HTMLButtonElement | null>(null);
  const active = comments[index % Math.max(comments.length, 1)];

  useEffect(() => {
    const node = previewRef.current;
    if (!node) {
      return;
    }

    const observer = new IntersectionObserver(([entry]) => setVisible(Boolean(entry?.isIntersecting)), {
      rootMargin: '160px 0px',
      threshold: 0.01,
    });
    observer.observe(node);

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (comments.length <= 1 || !visible) {
      return;
    }

    let interval = 0;
    const delay = window.setTimeout(() => {
      interval = window.setInterval(() => {
        if (document.visibilityState === 'visible') {
          setIndex((current) => (current + 1) % comments.length);
        }
      }, 5200);
    }, (seed % 4) * 700);

    return () => {
      window.clearTimeout(delay);
      window.clearInterval(interval);
    };
  }, [comments.length, seed, visible]);

  if (!active) {
    return null;
  }

  return (
    <button className="comment-preview" type="button" onClick={onOpen} ref={previewRef}>
      <span className="comment-preview-glow" />
      <AnimatePresence mode="wait" initial={false}>
        <motion.span
          className="comment-preview-inner"
          key={active.id}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.42, ease: [0.16, 1, 0.3, 1] }}
        >
          <Avatar profile={active.profile} size="sm" />
          <span>
            <strong>{active.profile.name}</strong>
            <em>{active.body}</em>
          </span>
          <ArrowRight size={15} />
        </motion.span>
      </AnimatePresence>
    </button>
  );
}

function CompactComment({ comment }: { comment: Comment }) {
  const bumpCount = useMemoryStore((state) => state.commentFavs[comment.id] || 0);
  const bumpCommentFav = useMemoryStore((state) => state.bumpCommentFav);
  const favs = comment.favCount + bumpCount;

  return (
    <div className="comment-item">
      <Avatar profile={comment.profile} size="sm" />
      <div>
        <div className="comment-heading">
          <strong>{comment.profile.name}</strong>
          <time>{formatDate(comment.createdAt)}</time>
        </div>
        <span className="role-chip" style={roleStyle(comment.profile.role)}>
          {comment.profile.role}
        </span>
        <p>{comment.body}</p>
        <button className="comment-fav compact" type="button" onClick={() => bumpCommentFav(comment.id)}>
          <ThumbsUp size={13} />
          {formatNumber(favs)}
        </button>
      </div>
    </div>
  );
}

function SpotlightPanel({ profile, memories }: { profile: Profile; memories: Memory[] }) {
  const totalHearts = memories.reduce((total, memory) => total + memory.heartCount, 0);
  const latest = memories[0];

  return (
    <motion.section
      className="spotlight-panel radiant-border"
      whileHover={{ y: -5 }}
      transition={{ type: 'spring', stiffness: 240, damping: 24 }}
      onPointerMove={trackPointerGlow}
    >
      <div className="spotlight-head">
        <Avatar profile={profile} size="xl" />
        <div>
          <span className="eyebrow">Spotlight</span>
          <h2>{profile.name}</h2>
          <p>{profile.role}</p>
        </div>
      </div>
      <div className="spotlight-stats">
        <span>
          <strong>{profile.memoryCount}</strong>
          Memories
        </span>
        <span>
          <strong>{formatNumber(totalHearts)}</strong>
          Hearts
        </span>
      </div>
      {latest ? (
        <blockquote>
          <p>{latest.body}</p>
          <footer>From {latest.author.name}</footer>
        </blockquote>
      ) : (
        <p className="quiet-copy">Ready for the first memory.</p>
      )}
    </motion.section>
  );
}

function Leaderboard({ profiles }: { profiles: Profile[] }) {
  const setActiveProfile = useMemoryStore((state) => state.setActiveProfile);

  return (
    <section className="leaderboard-panel radiant-border" onPointerMove={trackPointerGlow}>
      <span className="eyebrow">Most remembered</span>
      <h2>Recognition board</h2>
      {profiles.map((profile, index) => (
        <button className="leader-row" type="button" key={profile.username} onClick={() => setActiveProfile(profile.username)}>
          <span>{String(index + 1).padStart(2, '0')}</span>
          <Avatar profile={profile} size="sm" />
          <strong>{profile.name}</strong>
          <em>{profile.memoryCount}</em>
        </button>
      ))}
    </section>
  );
}

function MemoryTimeline({ memories }: { memories: Memory[] }) {
  const openMemoryStack = useMemoryStore((state) => state.openMemoryStack);
  const ids = useMemo(() => memories.map((memory) => memory.id), [memories]);

  return (
    <section className="timeline-panel radiant-border" onPointerMove={trackPointerGlow}>
      <span className="eyebrow">Signal timeline</span>
      <h2>Recent pulses</h2>
      <div className="timeline-list">
        {memories.slice(0, 4).map((memory, index) => (
          <motion.button
            className="timeline-row"
            type="button"
            key={memory.id}
            onClick={() => openMemoryStack(ids, memory.id)}
            initial={{ opacity: 0, x: 18 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: '-40px' }}
            transition={{ delay: index * 0.045, duration: 0.42, ease: [0.16, 1, 0.3, 1] }}
          >
            <Avatar profile={memory.author} size="sm" />
            <span>
              <strong>{memory.author.name}</strong>
              <em>
                to {memory.recipient.name} · {formatDate(memory.createdAt)}
              </em>
            </span>
          </motion.button>
        ))}
      </div>
    </section>
  );
}

const CommentThreadPanel = forwardRef<HTMLElement, { memory: Memory }>(function CommentThreadPanel({ memory }, ref) {
  const [sortMode, setSortMode] = useState<'relevant' | 'recent'>('relevant');
  const sortedComments = useMemo(() => sortComments(memory.comments, sortMode), [memory.comments, sortMode]);

  return (
    <section className="thread-panel" ref={ref} aria-label="Memory comments">
      <div className="comment-composer" aria-label="Add a comment preview">
        <span>Add a comment</span>
        <div>
          <Sparkles size={17} />
          <BookOpen size={17} />
        </div>
      </div>
      <LikeStrip profiles={memory.likedBy} overflowCount={Math.max(0, memory.heartCount - memory.likedBy.length)} />
      <div className="thread-toolbar">
        <button
          type="button"
          className="thread-sort"
          data-active={sortMode === 'relevant'}
          onClick={() => setSortMode('relevant')}
        >
          <SlidersHorizontal size={15} />
          Most relevant
        </button>
        <button
          type="button"
          className="thread-sort"
          data-active={sortMode === 'recent'}
          onClick={() => setSortMode('recent')}
        >
          Recent
        </button>
      </div>
      <div className="thread-list">
        {sortedComments.map((comment) => (
          <CommentThread key={comment.id} comment={comment} depth={0} />
        ))}
      </div>
    </section>
  );
});

function CommentThread({ comment, depth }: { comment: Comment; depth: number }) {
  const bumpCount = useMemoryStore((state) => state.commentFavs[comment.id] || 0);
  const bumpCommentFav = useMemoryStore((state) => state.bumpCommentFav);
  const favs = comment.favCount + bumpCount;

  return (
    <motion.article
      className="thread-comment"
      data-depth={Math.min(depth, 3)}
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-30px' }}
      transition={{ duration: 0.34, ease: [0.16, 1, 0.3, 1] }}
    >
      <Avatar profile={comment.profile} size="sm" />
      <div className="thread-comment-body">
        <div className="thread-comment-head">
          <strong>{comment.profile.name}</strong>
          <span className="role-chip" style={roleStyle(comment.profile.role)}>
            {comment.profile.role}
          </span>
          <time>{formatDate(comment.createdAt)}</time>
        </div>
        <p>{comment.body}</p>
        <div className="thread-actions">
          <motion.button
            className="comment-fav"
            type="button"
            onClick={() => bumpCommentFav(comment.id)}
            whileTap={{ scale: 0.9, rotate: -5 }}
            animate={bumpCount ? { boxShadow: '0 0 0 7px rgba(255, 79, 131, 0)' } : undefined}
            transition={{ duration: 0.42 }}
          >
            <ThumbsUp size={14} />
            {formatNumber(favs)}
            <AnimatePresence>
              {bumpCount > 0 ? (
                <motion.span
                  className="fav-pop"
                  key={bumpCount}
                  initial={{ opacity: 0, y: 8, scale: 0.6 }}
                  animate={{ opacity: 1, y: -20, scale: 1 }}
                  exit={{ opacity: 0, y: -34, scale: 0.82 }}
                  transition={{ duration: 0.48, ease: [0.16, 1, 0.3, 1] }}
                >
                  +1
                </motion.span>
              ) : null}
            </AnimatePresence>
          </motion.button>
          <span>{comment.replies.length} replies</span>
          <MiniLikeStrip profiles={comment.likedBy} />
        </div>
        {comment.replies.length > 0 ? (
          <div className="thread-replies">
            {comment.replies.map((reply) => (
              <CommentThread key={reply.id} comment={reply} depth={depth + 1} />
            ))}
          </div>
        ) : null}
      </div>
    </motion.article>
  );
}

function MiniLikeStrip({ profiles }: { profiles: Profile[] }) {
  if (profiles.length === 0) {
    return null;
  }

  return (
    <span className="mini-like-strip">
      {profiles.slice(0, 4).map((profile) => (
        <Avatar key={profile.username} profile={profile} size="sm" />
      ))}
    </span>
  );
}

function MemoryStackDialog({ memories }: { memories: Memory[] }) {
  const modalOpen = useMemoryStore((state) => state.modalOpen);
  const modalFocus = useMemoryStore((state) => state.modalFocus);
  const stackIds = useMemoryStore((state) => state.stackIds);
  const stackIndex = useMemoryStore((state) => state.stackIndex);
  const closeMemoryStack = useMemoryStore((state) => state.closeMemoryStack);
  const rotateStack = useMemoryStore((state) => state.rotateStack);
  const storyRef = useRef<HTMLDivElement | null>(null);
  const commentsRef = useRef<HTMLElement | null>(null);
  const stack = useMemo(
    () => stackIds.map((id) => memories.find((memory) => memory.id === id)).filter(Boolean) as Memory[],
    [memories, stackIds],
  );
  const active = stack[stackIndex];
  const activeHeartBump = useMemoryStore((state) => (active ? state.heartBumps[active.id] || 0 : 0));

  useEffect(() => {
    if (!modalOpen || !active) {
      return;
    }

    window.setTimeout(() => {
      if (modalFocus === 'comments') {
        commentsRef.current?.scrollIntoView({ block: 'start', behavior: 'smooth' });
        return;
      }

      storyRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
    }, 80);
  }, [active, modalFocus, modalOpen]);

  useEffect(() => {
    if (!modalOpen) {
      return;
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        closeMemoryStack();
      }

      if (event.key === 'ArrowRight') {
        rotateStack(1);
      }

      if (event.key === 'ArrowLeft') {
        rotateStack(-1);
      }
    };

    document.body.style.overflow = 'hidden';
    document.body.dataset.modalOpen = 'true';
    window.addEventListener('keydown', onKeyDown);

    return () => {
      document.body.style.overflow = '';
      delete document.body.dataset.modalOpen;
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [closeMemoryStack, modalOpen, rotateStack]);

  return (
    <AnimatePresence>
      {modalOpen && active ? (
        <motion.div
          className="modal-backdrop"
          role="dialog"
          aria-modal="true"
          aria-labelledby="memoryDialogTitle"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
          onWheel={(event) => {
            if (event.target === event.currentTarget) {
              event.preventDefault();
            }
          }}
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              closeMemoryStack();
            }
          }}
        >
          <button className="modal-close" type="button" data-modal-close onClick={closeMemoryStack} aria-label="Close memory">
            <X size={21} />
          </button>
          <button
            className="modal-nav modal-nav-left"
            type="button"
            data-modal-prev
            onClick={() => rotateStack(-1)}
            aria-label="Previous memory"
          >
            <ChevronLeft size={24} />
          </button>
          <button
            className="modal-nav modal-nav-right"
            type="button"
            data-modal-next
            onClick={() => rotateStack(1)}
            aria-label="Next memory"
          >
            <ChevronRight size={24} />
          </button>
          <div className="stack-ghost stack-ghost-one" />
          <div className="stack-ghost stack-ghost-two" />
          <AnimatePresence mode="wait" initial={false}>
            <motion.article
              className="modal-memory-card"
              key={active.id}
              initial={{ opacity: 0, x: 82, y: 18, rotate: 3.2, scale: 0.94 }}
              animate={{ opacity: 1, x: 0, y: 0, rotate: 0, scale: 1 }}
              exit={{ opacity: 0, x: -82, y: 26, rotate: -3.4, scale: 0.93 }}
              transition={{ type: 'spring', stiffness: 190, damping: 24, mass: 0.86 }}
            >
              <div className="modal-media">
                {active.image ? <img src={active.image} alt={`Memory for ${active.recipient.name}`} /> : null}
              </div>
              <div className="modal-story" ref={storyRef} onWheel={(event) => event.stopPropagation()}>
                <MemoryRoute memory={active} />
                <MemoryHeartButton
                  memoryId={active.id}
                  count={active.heartCount + activeHeartBump}
                  label={`Favorite memory for ${active.recipient.name}`}
                  className="modal-heart"
                />
                <h2 id="memoryDialogTitle">{active.shoutout}</h2>
                <p>{active.body}</p>
                <MemoryGalleryCarousel memory={active} />
                <div className="memory-meta">
                  <span>
                    {stackIndex + 1} of {stack.length}
                  </span>
                  <span>{formatDate(active.createdAt)}</span>
                  <span>{countComments(active.comments)} comments</span>
                </div>
                <CommentThreadPanel memory={active} ref={commentsRef} />
              </div>
            </motion.article>
          </AnimatePresence>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

function MemoryGalleryCarousel({ memory }: { memory: Memory }) {
  const [index, setIndex] = useState(0);
  const images = memory.galleryImages;
  const activeImage = images[index];

  useEffect(() => {
    setIndex(0);
  }, [memory.id]);

  if (images.length === 0 || !activeImage) {
    return null;
  }

  const rotateGallery = (direction: -1 | 1) => {
    setIndex((current) => (current + direction + images.length) % images.length);
  };

  return (
    <section className="memory-gallery" aria-label="Memory gallery">
      <div className="memory-gallery-frame">
        <AnimatePresence mode="wait" initial={false}>
          <motion.img
            key={activeImage}
            src={activeImage}
            alt=""
            initial={{ opacity: 0, x: 34, scale: 1.03 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: -34, scale: 0.98 }}
            transition={{ duration: 0.48, ease: [0.16, 1, 0.3, 1] }}
          />
        </AnimatePresence>
        {images.length > 1 ? (
          <>
            <button className="gallery-nav gallery-nav-left" type="button" onClick={() => rotateGallery(-1)} aria-label="Previous gallery image">
              <ChevronLeft size={20} />
            </button>
            <button className="gallery-nav gallery-nav-right" type="button" onClick={() => rotateGallery(1)} aria-label="Next gallery image">
              <ChevronRight size={20} />
            </button>
          </>
        ) : null}
      </div>
      {images.length > 1 ? (
        <div className="gallery-dots">
          {images.map((image, dotIndex) => (
            <button
              className={dotIndex === index ? 'is-active' : undefined}
              type="button"
              key={image}
              onClick={() => setIndex(dotIndex)}
              aria-label={`Go to gallery image ${dotIndex + 1}`}
            />
          ))}
        </div>
      ) : null}
    </section>
  );
}

function Avatar({ profile, size }: { profile: Profile; size: 'sm' | 'md' | 'lg' | 'xl' }) {
  return (
    <span className={`avatar avatar-${size}`} style={roleStyle(profile.role)} title={profile.name}>
      {profile.profilePicture ? <img src={profile.profilePicture} alt="" loading="lazy" decoding="async" /> : profile.name.slice(0, 2)}
    </span>
  );
}

function AllAvatar() {
  return (
    <span className="avatar avatar-lg avatar-all">
      <Sparkles size={24} />
    </span>
  );
}

function EmptyState() {
  return (
    <motion.div className="empty-state radiant-border" variants={cardVariants} custom={0} onPointerMove={trackPointerGlow}>
      <strong>No memories found</strong>
      <span>Try another profile or search term.</span>
    </motion.div>
  );
}

function getSpotlightProfile(directory: Directory, activeProfile: string, memories: Memory[]) {
  if (activeProfile !== 'all') {
    return directory.profiles.find((profile) => profile.username === activeProfile) || directory.profiles[0];
  }

  return memories[0]?.recipient || directory.profiles[0];
}

function getRoleOptions(profiles: Profile[]) {
  return [...new Set(profiles.map((profile) => profile.role))].sort((left, right) => left.localeCompare(right));
}

function scrollRail(direction: -1 | 1) {
  const rail = document.querySelector<HTMLElement>('#profileRail');
  if (!rail) {
    return;
  }

  rail.scrollBy({ left: direction * Math.max(320, rail.clientWidth * 0.72), behavior: 'smooth' });
}

function trackPointerGlow(event: PointerEvent<HTMLElement>) {
  const element = event.currentTarget;
  const state = pointerGlowStates.get(element) || { frame: 0, x: 0, y: 0 };
  state.x = event.clientX;
  state.y = event.clientY;

  if (!state.frame) {
    state.frame = window.requestAnimationFrame(() => {
      const rect = element.getBoundingClientRect();
      element.style.setProperty('--mx', `${state.x - rect.left}px`);
      element.style.setProperty('--my', `${state.y - rect.top}px`);
      state.frame = 0;
    });
  }

  pointerGlowStates.set(element, state);
}
