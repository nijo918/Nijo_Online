"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowUp, ArrowDown, X, Plus } from "lucide-react";
import type {
  Draft,
  Category,
  DraftLesson,
  DraftQuestion,
} from "@/features/courses/types";
import { saveDraft } from "./actions";
import { Message } from "@/components/ui";
const freshLesson = (): DraftLesson => ({
  title: "New lesson",
  markdown: "",
  video_url: null,
  required: true,
  duration_minutes: 10,
});
const freshQuestion = (): DraftQuestion => ({
  prompt: "New question",
  options: ["Option one", "Option two"],
  correct_index: 0,
});
export function DraftEditor({
  initial,
  categories,
}: {
  initial: Draft;
  categories: Category[];
}) {
  const [draft, setDraft] = useState(initial),
    [message, setMessage] = useState(""),
    [busy, start] = useTransition();
  const router = useRouter();
  const edit = (f: (d: Draft) => void) =>
    setDraft((old) => {
      const d = structuredClone(old);
      f(d);
      return d;
    });
  const tools = (
    index: number,
    length: number,
    move: (to: number) => void,
    remove: () => void,
  ) => (
    <div className="item-tools">
      <button
        type="button"
        className="icon-btn"
        aria-label="Move up"
        disabled={index === 0}
        onClick={() => move(index - 1)}
      >
        <ArrowUp size={13} />
      </button>
      <button
        type="button"
        className="icon-btn"
        aria-label="Move down"
        disabled={index === length - 1}
        onClick={() => move(index + 1)}
      >
        <ArrowDown size={13} />
      </button>
      <button
        type="button"
        className="icon-btn danger"
        aria-label="Remove item"
        onClick={remove}
      >
        <X size={13} />
      </button>
    </div>
  );
  function swap<T>(items: T[], a: number, b: number) {
    [items[a], items[b]] = [items[b], items[a]];
  }
  const save = () =>
    start(async () => {
      setMessage("");
      const r = await saveDraft(draft, draft.id);
      if (r.error) setMessage(r.error);
      else if (r.id) {
        setDraft((d) => ({ ...d, id: r.id }));
        setMessage(
          "Draft saved. Preview or publish this saved version using the controls above.",
        );
        if (!draft.id) router.replace("/admin/courses/" + r.id);
        router.refresh();
      }
    });
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        save();
      }}
    >
      <Message
        text={message}
        kind={message.startsWith("Draft saved") ? "success" : "error"}
      />
      <section className="editor-section">
        <h2>The starting point.</h2>
        <div className="form-grid">
          <label className="field full">
            Course title
            <input
              value={draft.title}
              minLength={3}
              maxLength={140}
              required
              onChange={(e) =>
                edit((d) => {
                  d.title = e.target.value;
                })
              }
            />
          </label>
          <label className="field">
            URL slug
            <input
              value={draft.slug}
              required
              pattern="[a-z0-9]+(-[a-z0-9]+)*"
              onChange={(e) =>
                edit((d) => {
                  d.slug = e.target.value;
                })
              }
            />
          </label>
          <label className="field">
            Category
            <select
              value={draft.category_id}
              required
              onChange={(e) =>
                edit((d) => {
                  d.category_id = e.target.value;
                })
              }
            >
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            Course type
            <select
              value={draft.course_type}
              onChange={(e) =>
                edit((d) => {
                  d.course_type = e.target.value as Draft["course_type"];
                })
              }
            >
              <option>Certificate</option>
              <option>Diploma</option>
            </select>
          </label>
          <label className="field">
            Estimated minutes
            <input
              type="number"
              min={5}
              max={60000}
              value={draft.duration_minutes}
              required
              onChange={(e) =>
                edit((d) => {
                  d.duration_minutes = Number(e.target.value);
                })
              }
            />
          </label>
          <label className="field full">
            Summary
            <textarea
              value={draft.summary}
              maxLength={2000}
              onChange={(e) =>
                edit((d) => {
                  d.summary = e.target.value;
                })
              }
            />
          </label>
          <label className="field full">
            Learning outcomes (one per line)
            <textarea
              value={draft.outcomes.join("\n")}
              onChange={(e) =>
                edit((d) => {
                  d.outcomes = e.target.value.split("\n");
                })
              }
            />
          </label>
        </div>
      </section>
      <section className="editor-section">
        <div className="item-heading">
          <h2>Modules & lessons.</h2>
          <button
            type="button"
            className="btn btn-outline btn-small"
            onClick={() =>
              edit((d) => {
                d.modules.push({
                  title: "New module",
                  lessons: [freshLesson()],
                });
              })
            }
          >
            <Plus size={14} />
            Module
          </button>
        </div>
        {draft.modules.map((m, mi) => (
          <div className="editor-module" key={mi}>
            <div className="item-heading">
              <h3>Module {mi + 1}</h3>
              {tools(
                mi,
                draft.modules.length,
                (to) =>
                  edit((d) => {
                    swap(d.modules, mi, to);
                    d.assessments.forEach((a) => {
                      if (a.module_position === mi) a.module_position = to;
                      else if (a.module_position === to) a.module_position = mi;
                    });
                  }),
                () =>
                  edit((d) => {
                    d.modules.splice(mi, 1);
                    d.assessments.forEach((a) => {
                      if (a.module_position === mi) a.module_position = null;
                      else if (
                        a.module_position !== null &&
                        a.module_position > mi
                      )
                        a.module_position--;
                    });
                  }),
              )}
            </div>
            <label className="field">
              Module title
              <input
                value={m.title}
                required
                minLength={2}
                maxLength={140}
                onChange={(e) =>
                  edit((d) => {
                    d.modules[mi].title = e.target.value;
                  })
                }
              />
            </label>
            {m.lessons.map((l, li) => (
              <div className="editor-lesson" key={li}>
                <div className="item-heading">
                  <h3>Lesson {li + 1}</h3>
                  {tools(
                    li,
                    m.lessons.length,
                    (to) => edit((d) => swap(d.modules[mi].lessons, li, to)),
                    () =>
                      edit((d) => {
                        d.modules[mi].lessons.splice(li, 1);
                      }),
                  )}
                </div>
                <div className="form-grid">
                  <label className="field full">
                    Lesson title
                    <input
                      value={l.title}
                      minLength={2}
                      maxLength={140}
                      required
                      onChange={(e) =>
                        edit((d) => {
                          d.modules[mi].lessons[li].title = e.target.value;
                        })
                      }
                    />
                  </label>
                  <label className="field full">
                    Lesson content (Markdown)
                    <textarea
                      rows={9}
                      value={l.markdown}
                      onChange={(e) =>
                        edit((d) => {
                          d.modules[mi].lessons[li].markdown = e.target.value;
                        })
                      }
                    />
                  </label>
                  <label className="field">
                    Optional video embed URL
                    <input
                      type="url"
                      value={l.video_url || ""}
                      placeholder="https://www.youtube-nocookie.com/embed/…"
                      onChange={(e) =>
                        edit((d) => {
                          d.modules[mi].lessons[li].video_url =
                            e.target.value || null;
                        })
                      }
                    />
                  </label>
                  <label className="field">
                    Estimated minutes
                    <input
                      type="number"
                      min={1}
                      max={6000}
                      value={l.duration_minutes}
                      required
                      onChange={(e) =>
                        edit((d) => {
                          d.modules[mi].lessons[li].duration_minutes = Number(
                            e.target.value,
                          );
                        })
                      }
                    />
                  </label>
                </div>
                <label className="check-field">
                  <input
                    type="checkbox"
                    checked={l.required}
                    onChange={(e) =>
                      edit((d) => {
                        d.modules[mi].lessons[li].required = e.target.checked;
                      })
                    }
                  />
                  Required for completion
                </label>
              </div>
            ))}
            <button
              type="button"
              className="btn btn-outline btn-small"
              onClick={() =>
                edit((d) => {
                  d.modules[mi].lessons.push(freshLesson());
                })
              }
            >
              + Add lesson
            </button>
          </div>
        ))}
      </section>
      <section className="editor-section">
        <div className="item-heading">
          <h2>Assessments.</h2>
          <button
            type="button"
            className="btn btn-outline btn-small"
            onClick={() =>
              edit((d) => {
                d.assessments.push({
                  title: "New assessment",
                  module_position: null,
                  required: true,
                  pass_mark: 70,
                  questions: [freshQuestion()],
                });
              })
            }
          >
            + Assessment
          </button>
        </div>
        {draft.assessments.map((a, ai) => (
          <div className="editor-assessment" key={ai}>
            <div className="item-heading">
              <h3>Assessment {ai + 1}</h3>
              {tools(
                ai,
                draft.assessments.length,
                (to) => edit((d) => swap(d.assessments, ai, to)),
                () =>
                  edit((d) => {
                    d.assessments.splice(ai, 1);
                  }),
              )}
            </div>
            <div className="form-grid">
              <label className="field full">
                Assessment title
                <input
                  value={a.title}
                  required
                  minLength={2}
                  maxLength={140}
                  onChange={(e) =>
                    edit((d) => {
                      d.assessments[ai].title = e.target.value;
                    })
                  }
                />
              </label>
              <label className="field">
                Scope
                <select
                  value={a.module_position === null ? "" : a.module_position}
                  onChange={(e) =>
                    edit((d) => {
                      d.assessments[ai].module_position =
                        e.target.value === "" ? null : Number(e.target.value);
                    })
                  }
                >
                  <option value="">Final · all course lessons</option>
                  {draft.modules.map((m, i) => (
                    <option key={i} value={i}>
                      {i + 1}. {m.title}
                    </option>
                  ))}
                </select>
              </label>
              <label className="field">
                Pass mark (%)
                <input
                  type="number"
                  min={1}
                  max={100}
                  required
                  value={a.pass_mark}
                  onChange={(e) =>
                    edit((d) => {
                      d.assessments[ai].pass_mark = Number(e.target.value);
                    })
                  }
                />
              </label>
            </div>
            <label className="check-field">
              <input
                type="checkbox"
                checked={a.required}
                onChange={(e) =>
                  edit((d) => {
                    d.assessments[ai].required = e.target.checked;
                  })
                }
              />
              Required for completion
            </label>
            {a.questions.map((q, qi) => (
              <div className="editor-question" key={qi}>
                <div className="item-heading">
                  <h3>Question {qi + 1}</h3>
                  {tools(
                    qi,
                    a.questions.length,
                    (to) =>
                      edit((d) => swap(d.assessments[ai].questions, qi, to)),
                    () =>
                      edit((d) => {
                        d.assessments[ai].questions.splice(qi, 1);
                      }),
                  )}
                </div>
                <label className="field">
                  Question
                  <input
                    value={q.prompt}
                    required
                    minLength={3}
                    maxLength={1000}
                    onChange={(e) =>
                      edit((d) => {
                        d.assessments[ai].questions[qi].prompt = e.target.value;
                      })
                    }
                  />
                </label>
                <p className="hint">
                  Select exactly one correct answer with the radio button.
                </p>
                {q.options.map((o, oi) => (
                  <div className="option-edit" key={oi}>
                    <input
                      type="radio"
                      aria-label={"Option " + (oi + 1) + " is correct"}
                      name={"correct_" + ai + "_" + qi}
                      checked={q.correct_index === oi}
                      onChange={() =>
                        edit((d) => {
                          d.assessments[ai].questions[qi].correct_index = oi;
                        })
                      }
                    />
                    <input
                      type="text"
                      value={o}
                      required
                      maxLength={500}
                      aria-label={"Option " + (oi + 1)}
                      onChange={(e) =>
                        edit((d) => {
                          d.assessments[ai].questions[qi].options[oi] =
                            e.target.value;
                        })
                      }
                    />
                    {tools(
                      oi,
                      q.options.length,
                      (to) =>
                        edit((d) => {
                          const x = d.assessments[ai].questions[qi];
                          swap(x.options, oi, to);
                          if (x.correct_index === oi) x.correct_index = to;
                          else if (x.correct_index === to) x.correct_index = oi;
                        }),
                      () =>
                        edit((d) => {
                          const x = d.assessments[ai].questions[qi];
                          x.options.splice(oi, 1);
                          if (x.correct_index === oi) x.correct_index = null;
                          else if (
                            x.correct_index !== null &&
                            x.correct_index > oi
                          )
                            x.correct_index--;
                        }),
                    )}
                  </div>
                ))}
                <button
                  type="button"
                  className="btn btn-quiet"
                  onClick={() =>
                    edit((d) => {
                      d.assessments[ai].questions[qi].options.push(
                        "New option",
                      );
                    })
                  }
                >
                  + Add answer option
                </button>
              </div>
            ))}
            <button
              type="button"
              className="btn btn-outline btn-small"
              onClick={() =>
                edit((d) => {
                  d.assessments[ai].questions.push(freshQuestion());
                })
              }
            >
              + Add question
            </button>
          </div>
        ))}
      </section>
      <div className="actions-row">
        <button
          disabled={busy || !categories.length}
          type="submit"
          className="btn btn-primary"
        >
          {busy ? "Saving the draft…" : "Save draft"}
        </button>
        {draft.id && (
          <Link
            href={"/admin/courses/" + draft.id + "/preview"}
            className="btn btn-outline"
          >
            Preview saved draft ↗
          </Link>
        )}
        <span className="hint">Save before previewing or publishing.</span>
      </div>
    </form>
  );
}
