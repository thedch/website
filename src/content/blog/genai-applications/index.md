---
title: "Where to apply generative AI (or, why Harvey succeeded*)"
description: "Ways to correctly and incorrectly apply generative AI"
date: "2024-08-15"
draft: false
---

## Introduction

I've talked to a lot of people deploying generative AI in different applications and industries. I think there's a lot of wrong ways to use generative AI, that maybe aren't necessarily obvious.

When I was between Tesla and Harvey, figuring out what I wanted to do next, I tried to think a lot about the "first principles" (I know, sorry) ideal application of gen AI. What are the attributes that are useful?

Let's outline several key features that I think were important for Harvey's success, and discuss the general underlying principles.

1. Incremental value delivery (human in the loop)
1. Text is the product
1. Defensible -- chatGPT alone isn't enough, needs some unique vertical integration
1. High revenue, large market, repetitive workflows

## Incremental value delivery

One of my biggest learnings from Tesla Autopilot was the importance of incremental value delivery. Many self driving car companies failed because they needed 6 nines of reliability to ship anything. When your product is "a car without a steering wheel", the engineering needed is very difficult to get the first dollar of revenue. Tesla did it differently: they shipped cars, and then they shipped an incrementally improving driver assistant system, each version of it more valuable and capable than the last.

This allowed them to get faster user feedback, ship faster, get more users, and attract more revenue. When I was considering application for generative AI and language models, I thought about this a lot. LLMs are great at some things, but pretty dumb at others, and you want to be able to ship quickly without having to fix every single failure case before getting your first user.

Since Harvey is helping accelerate work that is currently being done (e.g. day to day tasks of existing lawyers), it's possible to move very quickly and get feedback from users, even if your first version just does a small part of their job. This was really important to me, since early user feedback is critical to the success of any product.

## Text is the product

Law firms, and professional services at large, sell text. That's their product. Their deliverables can be fully expressed inside of the Microsoft Office suite.

Language models directly and immediately help them deliver their core product! If you sell gen AI to a plumber, you have to convince them that it'll help with their client bookings, or their financial record keeping, etc. It will help them reduce their expenses or increase efficiency, but it's not going to literally fix their customer's pipes. Being able to sell a product that helps them deliver their product to their customers is great, and very clearly aligned with their goals. The sales and value proposition is very clear, the customer will immediately understand why this is worth paying for, as opposed to seeing you as another cost-center vendor to cut.

## Defensible -- ChatGPT alone isn't enough

One thing I saw a ton (and unfortunately still see a lot) is people building products that are only slight deviations from ChatGPT. If your product can be replicated by a user copying and pasting text into ChatGPT, it's probably not going to last long.

You want to be building in a niche that's sufficiently differentiated (and ideally a bit of a vertical) that an OpenAI update isn't going to wipe out your value proposition. Lawyers are only one example of this, but if your value proposition is quite broad and general, it's going to be hard to defend. Data integrations and specialized UIs and workflows are an obvious start -- but thinking even bigger: what are systems that don't obviously appear to be language-model based, but are?

Drafting emails and customer support are the obvious "this is a single-step language model" examples. If you have a product that uses 10s/100s of language model calls to build up a complex work product and make decisions, that's harder to replicate.

## Large Market + Repetitive Work + Technical Savvy

This last one is pretty simple. You want to be selling into a large industry, that makes a lot of money, that does a lot of work that language models can help with. Preferably, the industry isn't super tech-savvy, because otherwise they'll probably go off and build their own solution, and your life as a vendor will be harder.

***

*companies are successful due to the hard work and labor from many people, across many corporate functions (along with a bit of luck). I am hoping to highlight a specific set of attributes that I think are important for success, and discuss the general underlying principles.