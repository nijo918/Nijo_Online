import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  Check,
  Globe2,
  BadgeCheck,
  BookOpen,
  MoveUpRight,
  Network,
  Sparkles,
} from "lucide-react";
import { CourseCard } from "@/components/ui";
import { catalog } from "@/features/courses/data";
export default async function Home() {
  const { courses } = await catalog();
  return (
    <>
      <section className="hero shell">
        <div className="hero-copy">
          <div className="hero-kicker">
            <span />A NEW CHAPTER STARTS HERE
          </div>
          <h1>
            A little learning.
            <br />A world of
            <br />
            <em>possibility.</em>
            <span className="hero-star">✳</span>
          </h1>
          <p>
            Build skills that move you forward. Discover free, practical
            courses, learn at your pace, and turn your next step into something
            bigger.
          </p>
          <div className="hero-actions">
            <Link href="/courses" className="btn btn-primary">
              Find your next course <ArrowUpRight size={19} />
            </Link>
            <Link href="#how-it-works" className="text-link">
              See how it works <ArrowRight size={16} />
            </Link>
          </div>
          <div className="hero-note">
            <span>
              <Check size={14} />
              100% free learning
            </span>
            <span>
              <Check size={14} />
              Certificates included
            </span>
          </div>
        </div>
        <div
          className="hero-visual"
          aria-label="Learning opens new possibilities"
        >
          <div className="visual-grid" />
          <span className="visual-top">YOUR FUTURE, IN PROGRESS.</span>
          <div className="hero-curve" />
          <div className="learning-block block-one">
            <Network size={35} />
            <span>Connect the dots.</span>
            <small>TECHNOLOGY</small>
          </div>
          <div className="learning-block block-two">
            <Sparkles size={31} />
            <span>Find your spark.</span>
            <small>NEW POSSIBILITIES</small>
          </div>
          <div className="learning-block block-three">
            <MoveUpRight size={57} />
            <span>Keep growing.</span>
          </div>
          <div className="floating-note">
            <span className="floating-check">
              <Check size={19} />
            </span>
            <span>
              One step closer.<small>Every skill is a new beginning.</small>
            </span>
          </div>
          <span className="visual-bottom">
            STAY CURIOUS. GO FURTHER. <ArrowUpRight size={16} />
          </span>
        </div>
      </section>
      <section className="benefit-strip">
        <div className="shell benefits">
          <div>
            <Globe2 />
            <span>
              <strong>Learning without limits</strong>
              <small>Free courses, open to everyone</small>
            </span>
          </div>
          <div>
            <BookOpen />
            <span>
              <strong>Your pace. Your place.</strong>
              <small>Learn whenever life allows</small>
            </span>
          </div>
          <div>
            <BadgeCheck />
            <span>
              <strong>Make progress tangible</strong>
              <small>Earn proof of your achievement</small>
            </span>
          </div>
        </div>
      </section>
      <section className="shell section">
        <div className="section-heading">
          <div>
            <span className="eyebrow">A GOOD PLACE TO BEGIN</span>
            <h2>
              Small steps. <em>Useful skills.</em>
            </h2>
            <p>Your next opportunity could start with one course.</p>
          </div>
          <Link href="/courses" className="text-link">
            Explore all courses <ArrowUpRight size={18} />
          </Link>
        </div>
        <div className="course-grid">
          {courses.slice(0, 3).map((c) => (
            <CourseCard key={c.id} course={c} />
          ))}
        </div>
      </section>
      <section id="how-it-works" className="how-section">
        <div className="shell">
          <div className="section-heading">
            <div>
              <span className="eyebrow">FROM CURIOUS TO CAPABLE</span>
              <h2>
                Your next chapter,
                <br />
                <em>one step at a time.</em>
              </h2>
            </div>
            <p>
              No complicated path. Just a little curiosity
              <br />
              and the space to keep going.
            </p>
          </div>
          <div className="steps">
            {[
              [
                "01",
                "Find your starting point",
                "Choose a practical course that fits your goals. There’s no cost to get started.",
              ],
              [
                "02",
                "Make it your own",
                "Work through clear lessons and check your understanding with short assessments.",
              ],
              [
                "03",
                "Celebrate your progress",
                "Complete your course and download a free, verifiable certificate of completion.",
              ],
            ].map(([n, t, p]) => (
              <div key={n}>
                <span className="step-number">
                  {n}
                  <ArrowUpRight size={22} />
                </span>
                <h3>{t}</h3>
                <p>{p}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
      <section className="shell">
        <div className="cta-banner">
          <div>
            <span className="eyebrow">THERE’S MORE AHEAD OF YOU</span>
            <h2>
              Start where you are.
              <br />
              <em>See where you can go.</em>
            </h2>
          </div>
          <Link href="/courses" className="btn btn-light">
            Discover your next skill <ArrowUpRight size={18} />
          </Link>
        </div>
      </section>
    </>
  );
}
