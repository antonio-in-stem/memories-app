import Link from 'next/link';
import { ArrowRight, ChevronDown, Lock, Network, Orbit, ShieldCheck, Sparkles, Users2 } from 'lucide-react';

import { LinkedInLoginButton } from '@/components/LinkedInLoginButton';
import { SignOutButton } from '@/components/AuthActions';
import { MagneticField } from '@/components/MagneticField';
import { ShaderAurora } from '@/components/ShaderAurora';
import { formatPlatformName } from '@/lib/display-name';
import type { CircleSummary } from '@/server/circles';

type Viewer = {
  name?: string | null;
  image?: string | null;
};

const signalRows = [
  'Antonio M. recognized Daniela S.',
  'Julio C. replied with context',
  'Cleyri P. received 12 hearts',
];

export function PublicHome() {
  return (
    <>
      <ShaderAurora />
      <MagneticField />
      <main className="home-shell">
        <HomeNav />
        <section className="home-hero">
          <div className="home-hero-copy">
            <span className="eyebrow">Professional memories network</span>
            <h1>Turn great work into stories people can revisit.</h1>
            <p>
              Memories gives teams a beautiful, private place to recognize craft, context, and the tiny decisions that
              usually disappear after the sprint ends.
            </p>
            <div className="home-actions">
              <LinkedInLoginButton />
              <a href="#mechanics" className="nav-ghost">
                See how it works <ArrowRight size={16} />
              </a>
            </div>
          </div>
          <HomeShowcase />
        </section>
        <section className="mechanics-grid" id="mechanics">
          {[
            ['Enter with identity', 'LinkedIn keeps the experience tied to real professional profiles and photos.', Users2],
            ['Choose a circle', 'Each team keeps its own context, feed, recognition graph, and memory history.', Network],
            ['Publish beautifully', 'Create memories with compressed images, threads, reactions, and story-level context.', Sparkles],
          ].map(([title, body, Icon]) => (
            <article className="mechanic-card radiant-border" key={title as string}>
              <Icon size={22} />
              <h2>{title as string}</h2>
              <p>{body as string}</p>
            </article>
          ))}
        </section>
      </main>
    </>
  );
}

export function CircleHome({ viewer, circles }: { viewer: Viewer; circles: CircleSummary[] }) {
  return (
    <>
      <ShaderAurora />
      <MagneticField />
      <main className="home-shell">
        <HomeNav viewer={viewer} circles={circles} />
        <section className="circle-hero">
          <div>
            <span className="eyebrow">Your circles</span>
            <h1>Choose where this recognition belongs.</h1>
            <p>
              Every circle has its own social context. Generation CH65 is live for real members; the sandbox stays
              isolated for demos and product work.
            </p>
          </div>
        </section>
        <section className="circle-grid" aria-label="Available circles">
          {circles.map((circle) => (
            <article className="circle-card radiant-border" data-accent={circle.accent} data-locked={circle.locked} key={circle.id}>
              <div className="circle-card-head">
                <span>{circle.locked ? <Lock size={18} /> : <Network size={18} />}</span>
                <strong>{circle.locked ? 'Locked' : 'Active'}</strong>
              </div>
              <h2>{circle.name}</h2>
              <p>{circle.description}</p>
              <div className="circle-avatars">
                {circle.profiles.slice(0, 5).map((profile) => (
                  <span className="circle-avatar" title={profile.name} key={`${circle.id}-${profile.name}`}>
                    {profile.image ? <img src={profile.image} alt="" /> : profile.name.slice(0, 2)}
                  </span>
                ))}
              </div>
              <div className="circle-stats">
                <span>
                  <strong>{circle.memberCount}</strong>
                  members
                </span>
                <span>
                  <strong>{circle.memoryCount}</strong>
                  memories
                </span>
              </div>
              {circle.locked ? (
                <button className="circle-action" type="button" disabled>
                  Not available <Lock size={16} />
                </button>
              ) : (
                <Link className="circle-action" href={circle.href}>
                  Enter circle <ArrowRight size={16} />
                </Link>
              )}
            </article>
          ))}
        </section>
      </main>
    </>
  );
}

function HomeNav({ viewer, circles = [] }: { viewer?: Viewer; circles?: CircleSummary[] }) {
  return (
    <header className="home-nav progressive-blur">
      <Link className="brand" href="/" aria-label="Go to my circles">
        <span className="brand-orbit" />
        <span>Memories</span>
      </Link>
      <nav>
        {viewer ? (
          <>
            <details className="home-circle-menu">
              <summary>
                Circles <ChevronDown size={15} />
              </summary>
              <div>
                <Link href="/">All circles</Link>
                {circles.map((circle) =>
                  circle.locked ? (
                    <span key={circle.id}>{circle.name}</span>
                  ) : (
                    <Link href={circle.href} key={circle.id}>
                      {circle.name}
                    </Link>
                  ),
                )}
              </div>
            </details>
            <details className="home-account-menu">
              <summary>
                {viewer.image ? <img src={viewer.image} alt="" /> : null}
                <span>{formatPlatformName(viewer.name) || 'LinkedIn'}</span>
                <ChevronDown size={15} />
              </summary>
              <div>
                <Link href="/">My circles</Link>
                <SignOutButton className="menu-button" />
              </div>
            </details>
          </>
        ) : (
          <LinkedInLoginButton />
        )}
      </nav>
    </header>
  );
}

function HomeShowcase() {
  return (
    <div className="home-showcase radiant-border">
      <div className="showcase-orbit" aria-hidden="true">
        <span />
        <span />
        <span />
      </div>
      <div className="showcase-card">
        <div>
          <span className="showcase-icon">
            <Orbit size={18} />
          </span>
          <strong>Generation CH65</strong>
        </div>
        <p>Recognition, threaded comments, reactions, and image-backed memories in one cinematic feed.</p>
      </div>
      <div className="home-mini-feed">
        {signalRows.map((item) => (
          <span key={item}>{item}</span>
        ))}
      </div>
      <div className="showcase-footer">
        <span>
          <ShieldCheck size={16} />
          LinkedIn identity
        </span>
        <span>Private circles</span>
      </div>
    </div>
  );
}
