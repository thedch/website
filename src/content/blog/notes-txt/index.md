---
title: "notes.txt is the best TODO app available"
date: "2025-12-25"
draft: false
---

I am a bit of a productivity enthusiast. I love life hacks, trying new task management apps, and finding ways to get more done in less time.
Trello, Asana, Roam Research, Notion, Reminders, Things -- the list of apps that I've experimented with is extensive.

My general findings are that the midwit meme is correct:

<div class="max-w-md mx-auto">

![Midwit Meme](midwit.jpg)

</div>

Over time, I've converged to a simple and flexible system: every day, I open `~/Documents/notes.txt` and add things to the bottom.
I have found this to have a surprising number of benefits and provide a lot of peace of mind.
I am not aware of many people I know using this sort of system, so I thought I'd write about it.

There are a few specific techniques I've found helpful:

- I have a `~/Documents/notes.txt` on all laptops I own (usually work + personal). I don't feel the need to sync them -- keeping them separate is a feature.
- I mark each new days notes with triple hashtags, e.g. `### Dec 14`. This allows me to Cmd+F for `###` and jump through the days.
- I treat this file as a general stream of consciousness. I often arrive at work with various urgent things on my mind, and the first thing I do is dump all my thoughts into this file and organize into a somewhat structured plan for the day.
- A decent part of my job is running a script with many arguments, waiting some number of minutes/hours/days, reviewing the outputs, and repeating. As such, pasting the command into `notes.txt` before I run it provides a great record of when I ran different things, moreso than my zsh `HISTFILE`. I often need to run a script and can search for the name in my `notes.txt`, review the last few times I ran it, and construct the command I need. Looking back, I am kind of amazed I got anything done before this.
- In standard Markdown, I mark TODOs with `[ ]` and then add `[x]` when they're completed.
- I've tried separating this into a few files, for example `todos.txt` and `thoughts.txt` etc. I found this to be annoying and not worth it. Having different files to switch between caused more friction than benefits.
- Having a catch all scratch pad is a great improvement to my task tracking. Ever have a coworker stop by your desk with some urgent task or fire that needs attention? I simple summarize their narration into my notes file, have them confirm I have the correct context, and am able to take action as needed. Same for other details that get mentioned in a meeting or in passing -- I have a dedicated place to store them and can easily scroll back over past days.
- Performance reviews become easier as well: I can instantly dig up exactly what I did every week last year, and convert that into an impact statement.
- I've picked a few keywords that I try to keep reserved for easy Cmd+F. For example, if there's some difficult undocumented internal process I regularly get annoyed by, I will write `Tutorial: ...` in my notes, followed by whatever instructions I need. The next time I run into the issue, flipping through all instances of the word `Tutorial` only takes a few seconds to find what I'm looking for.[^1] I've seen other people use hashtags for this sort of thing, but that's never really landed for me -- but it seems like a great addition.

A simple example file looks like this:

```txt
$ cat ~/Documents/notes.txt

### Sept 14

[ ] Check in with Michael about the database migration -- what needs to happen there?
[ ] Review Allen's PR

[ ] Test big_script, is it still broken?

uv run pipeline/scripts/big_script.py \
    --dry-run 1 \
    --config 0905-testing \
    --gcs-bucket big-script-runs

[ ] Submit interview feedback
[ ] Respond to that memo from security team
[ ] Prep slides for tmrw's meeting
```

I find that the more I add to it, the most valuable this file becomes.
I've followed this system for about 5 years now, over several jobs, and it's always really helped me.

Try it and see if it helps you!

[^1]: As a bonus, this is a great indication of where it would be useful to add more internal documentation or improve the process for the rest of my team. If I have a bit of down time, I can pick the highest impact "Tutorial" I've written and convert it to something accessible to the whole company (or automate the process entirely, etc).
