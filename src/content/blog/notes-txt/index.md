---
title: "notes.txt is the best TODO app available"
date: "2025-12-25"
draft: false
---

I’m a bit of a productivity enthusiast. I enjoy life hacks, experimenting with task-management systems, and finding ways to get more done with less friction. Over the years I’ve tried just about everything: Trello, Asana, Roam Research, Notion, Reminders, Things—the list is long.

My main conclusion is that the midwit meme is correct:

<div class="max-w-md mx-auto">

![Midwit Meme](midwit.jpg)

</div>

After a lot of experimentation, I’ve converged on a system that is deslightfully simple: every day, I open `~/Documents/notes.txt` and add to the bottom of the file.

Despite (or because of) its simplicity, this has turned out to be one of the most effective productivity tools I’ve ever used. It gives me a surprising amount of clarity and peace of mind. I don’t know many people who work this way, so I thought it was worth writing about.

## The System

Here are a few concrete practices that make this work well for me:

- I keep a `~/Documents/notes.txt` file on every laptop I use (usually work and personal). I don’t bother syncing them, keeping them separate is a feature.
- Each day starts with a header like `### Dec 14`. This makes it easy to jump between days with a simple Cmd+F for `###`.
- The file is a general stream of consciousness. I often arrive at work with a pile of half-formed thoughts and concerns. The first thing I do is dump everything into this file, then shape it into a rough plan for the day.
- A big part of my job involves running scripts with many arguments, waiting minutes or hours, inspecting outputs, and iterating. Pasting commands into `notes.txt` before running them gives me a much better historical record than my shell history. When I need to re-run something, I can search for the script name, review past invocations, and reconstruct the exact command I want. In retrospect, I'm not sure how I functioned before doing this.
- I use standard Markdown checkboxes: `[ ]` for TODOs, `[x]` for completed items.
- I’ve tried splitting this into multiple files (`todos.txt`, `thoughts.txt`, etc.). It never stuck. Switching between files added more friction than it removed.
- Having a single catch-all scratch pad dramatically improves task tracking. When a coworker drops by with an urgent request, I summarize what they’re saying directly into my notes, confirm I’ve captured the context correctly, and move on. The same goes for details mentioned in meetings or in passing — I always have a single place to jot them down.
- Performance reviews become easier too. I can reconstruct exactly what I worked on week by week and turn that directly into impact statements.
- I reserve a few keywords for easy searching. For example, when I encounter a painful, undocumented internal process, I’ll write `Tutorial:` followed by the steps I needed. Later, a quick Cmd+F through `Tutorial` entries gets me quickly unstuck.[^1] Some people use hashtags for this; that never quite clicked for me, but it’s a solid variation on the idea.

## Example

A typical section of my file looks like this:

```txt
$ cat ~/Documents/notes.txt

### Sept 14

[ ] Check in with Michael about the database migration — what needs to happen there?
[ ] Review Allen's PR

[ ] Test big_script, is it still broken?

uv run pipeline/scripts/big_script.py \
    --dry-run 1 \
    --config 0905-testing \
    --gcs-bucket big-script-runs

[ ] Submit interview feedback
[ ] Respond to memo from security team
[ ] Prep slides for tomorrow’s meeting
```

The more I use this file, the more valuable it becomes. I’ve followed this system for about five years, across multiple jobs, and it has consistently paid off.

If you’ve bounced between productivity tools and never quite found something that sticks, try this. It’s hard to get simpler than a text file!

[^1]: As a bonus, this is a great indication of where it would be useful to add more internal documentation or improve the process for the rest of my team. If I have a bit of down time, I can pick the highest impact "Tutorial" I've written and convert it to something accessible to the whole company (or automate the process entirely, etc).
