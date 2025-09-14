---
title: "CV vs NLP"
description: "How to move from Computer Vision to Natural Language Processing"
date: "2024-08-01"
draft: false
---

I sometimes get asked how it was to transition from Computer Vision (CV) to Natural Language Processing (NLP). I spent years as a machine learning scientist at Tesla Autopilot, which is all Computer Vision -- and then moved to Head of AI Eng at Harvey, where my focus is deeply rooted in NLP.

People are often surprised by me jumping between these domains. While there are many differences, there are also significant similarities. Here are a few skills I've developed over the years that have carried across both fields:

## Discernment

First up, discernment and identifying the correct problem to work on. This is obvious, but I have to mention it -- if anything because of how rare and valuable it is.

This is a skill that Tesla beat into me. There's very few PMs in the org – no one is handing you nicely scoped priorities.

Every time I met with Elon, the emphatic guidance was 'make the car drive better'. Figure that out and make it happen. Jump into the stack, identify the biggest weakness, and fix it.

You got things done, and if you couldn't, you wouldn't have a job for long.

I reported to Andrej Karpathy, and anyone who has worked with him knows he doesn’t hold your hand. He provides incredible guidance and mentorship, but at the end of the day, you need to figure out what to work on and make significant contributions. This experience taught me how to identify what matters, break down big problems, and work with complex systems—skills crucial for building a company like Harvey from the ground up.

When scaling the AI team at Harvey, discernment is the number one thing I looked for – it’s harder to evaluate than a simple leetcode problem, but it’s an invaluable trait.

## Data Obsession

Second is an immense obsession with data.

Getting a computer vision model to work well requires a lot of time spent analyzing data. Anyone who's trained a good model knows that the architecture and hyperparameters are just the beginning – frankly, that's often the easy part. Getting a data set that's good and curated (beyond academic benchmarks) is really important, and really hard.

Andrej has an obsession with data cleanliness and analysis, finding the outliers, and fixing jank. I learned from this, and it became kind of my forte at Tesla. I was "the data jank guy" and spent a ton of time cleaning and improving our data pipelines, which improved our models a lot.

This obsession transferred well to natural language processing. Modern language models are very good at generating reasonable-looking text, making it easy to overlook errors. A lot of people forget that you need to spend a lot of time looking at the inputs and outputs of any RAG pipeline, checking the outlier values in your database, your embedding formatting strategy, your intermediate LLM outputs, weird user queries, etc.

Whenever structured output is expected, you need multiple levels of fallbacks to catch edge cases and good telemetry to log how often these cases occur.

This is all really, really important and without it, you're not going to have a good pipeline.

## Latency

My time at Tesla taught me a ton about the value of 100 microseconds and what you can get a computer to do in a real-time, safety critical environment.

I built the first latency-aware architecture visualization system, helping me identify hotspots in my neural network design and tune the architecture for speed and efficiency while maintaining good performance. (Last I heard, it's still in use today!)

This experience was invaluable when I moved into language modeling. I optimized the tokens of my input, cut output sequences as much as possible, making as many calls in parallel and using the smallest model possible.

Especially for the intermediate steps of any sophisticated AI agent pipeline, there are many ways to format input and output schemas (JSON? XML? What keys to use?), each with different latency and accuracy profiles.

When building the first versions of Harvey's product as the Founding Research Scientist, I was obsessed with minimizing the latency of our language models. As anyone who's optimized user retention will tell you, this helped a ton keeping our early users happy and engaged. They could do more work and run more queries, faster, as they experimented with different approaches.

I see many people getting sloppy and using GPT-4 for everything, even when Turbo or Mini would suffice. If you want to keep your users and clients happy, you have to keep your app responsive.

## Conclusion

I was generally surprised by how much crossover there was between the two skillsets. I think this is a testament to the value of generalist thinking in AI -- at the end of the day, we're using computers to solve problems, and the same sort of question-the-requirements and ship-fast approach can be applied to both domains.

If you're thinking about switching between domains, I'd recommend thinking about the skills you've developed and how they can be applied to the new domain. Best of luck!