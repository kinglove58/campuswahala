import Link from "next/link";
import { campuses } from "@campuswahala/campus-content";
const game = process.env.NEXT_PUBLIC_GAME_URL ?? "http://localhost:3001";
export default function Home() {
  return (
    <>
      <header className="nav">
        <Link className="brand" href="/">
          Campus<span>Wahala</span>
          <sup>✳</sup>
        </Link>
        <nav aria-label="Main">
          <Link href="/universities">The campuses</Link>
          <a href="#life">Campus life</a>
          <a className="button" href={game}>
            Enter campus ↗
          </a>
        </nav>
      </header>
      <main>
        <section className="hero">
          <div className="hero-copy">
            <span className="tag">✳ THE NEXT CHAPTER OF CAMPUS LIFE</span>
            <h1>
              Small campus.
              <br />
              Big dreams.
              <br />
              <em>Plenty wahala.</em>
            </h1>
            <p>
              A whole university life, in your pocket. Find your people,
              <br className="desktop" /> write your story, and make campus your
              own.
            </p>
            <div className="hero-actions">
              <a className="button" href={game}>
                Start your campus story <span>↗</span>
              </a>
              <span className="muted">
                Guest exploration
                <br />
                <small>No account needed</small>
              </span>
            </div>
            <div className="campus-pills">
              <span>FUTA</span>
              <span>OAU</span>
              <span>UNILAG</span>
              <small>Three campuses. A thousand possibilities.</small>
            </div>
          </div>
          <div
            className="hero-art"
            aria-label="Illustration of a fictional campus"
          >
            <div className="art-label">
              A LITTLE WORLD. A WHOLE LOT OF LIFE.
            </div>
            <div className="map-road road-a" />
            <div className="map-road road-b" />
            <div className="map-building b-library">
              <span>▤</span>LIBRARY
            </div>
            <div className="map-building b-hall">
              <span>▥</span>LECTURE HALL
            </div>
            <div className="map-building b-home">
              <span>⌂</span>HOSTEL
            </div>
            <div className="map-building b-food">
              <span>☕</span>FOOD CORNER
            </div>
            {[1, 2, 3, 4, 5, 6, 7].map((n) => (
              <div key={n} className={`tree t${n}`}>
                ♣
              </div>
            ))}
            <div className="mini-person">
              <span>●</span>
              <b />
            </div>
            <div className="speech">Your story starts here. ✨</div>
            <div className="map-stamp">
              CW
              <br />
              <small>EST. NOW</small>
            </div>
            <div className="art-caption">
              STYLIZED FIXTURE WORLD · NOT A REAL CAMPUS MAP
            </div>
          </div>
        </section>
        <div className="ticker">
          <span>YOUR PEOPLE</span>✳<span>YOUR HUSTLE</span>✳
          <span>YOUR MEMORIES</span>✳<span>YOUR CAMPUS</span>✳
          <span>YOUR WAHALA</span>
        </div>
        <section className="life-section" id="life">
          <div>
            <p className="eyebrow">MORE THAN THE LECTURE HALL</p>
            <h2>
              Every semester
              <br />
              has a story.
            </h2>
            <p className="muted">
              A world built around the full university journey.
              <br />
              Our first chapter is guest campus exploration.
            </p>
          </div>
          <div className="life-cards">
            <article>
              <span>01 / EXPLORE NOW</span>
              <h3>Find your corner.</h3>
              <p>
                Choose a campus, create your character and wander a small world.
                Your virtual phone keeps it all close.
              </p>
            </article>
            <article>
              <span>02 / PLANNED</span>
              <h3>Build your own life.</h3>
              <p>
                Classes, friendships, side hustles and everyday decisions will
                shape your university story.
              </p>
            </article>
            <article>
              <span>03 / PLANNED</span>
              <h3>Make it memorable.</h3>
              <p>
                From your first semester to the last paper: signing shirts,
                shared memories and alumni chapters.
              </p>
            </article>
          </div>
        </section>
        <section className="campus-section">
          <div className="section-heading">
            <div>
              <p className="eyebrow">PICK YOUR STARTING POINT</p>
              <h2>Which campus is calling?</h2>
            </div>
            <Link href="/universities">Meet the campuses ↗</Link>
          </div>
          <div className="campus-grid">
            {campuses.map((c, i) => (
              <Link
                className="campus-card"
                href={`/universities/${c.id}`}
                key={c.id}
              >
                <div className={`campus-art campus-${c.id}`}>
                  <span>0{i + 1}</span>
                  <b>{c.shortName}</b>
                  <div>▥ ♣ ⌂</div>
                </div>
                <div className="campus-card-copy">
                  <h3>
                    {c.shortName} <span>↗</span>
                  </h3>
                  <p>{c.name}</p>
                  <small>Guest fixture world</small>
                </div>
              </Link>
            ))}
          </div>
        </section>
        <section className="last-call">
          <span className="eyebrow">WELCOME TO YOUR NEXT CHAPTER</span>
          <h2>Campus is better with you in it.</h2>
          <a className="button" href={game}>
            Let’s enter campus ↗
          </a>
          <p>Phase 0 preview · Fictional maps and sample programmes</p>
        </section>
      </main>
      <footer>
        <Link className="brand" href="/">
          Campus<span>Wahala</span> ✳
        </Link>
        <small>The playable digital world of African university life.</small>
        <span>Built for the journey.</span>
      </footer>
    </>
  );
}
