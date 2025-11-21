---
title: "Anecdotal Evidence"
description: "On being overly reactive"
date: "2025-11-20"
draft: false
---

During my time at Tesla, I often felt we were too over-reactive as an organization. A user would report some issue on Twitter, or Elon would personally experience some issue, and we would immediately assign some engineers to investigate and fix it. It felt thrashy and would frustrate me. I wanted us to build a user experience committee, design a comprehensive dashboard of issues, order by priority and impact, assign headcount as appropriate, and work through them in an orderly fashion.

Over the years, I have come to see the wisdom in being highly reactive, constantly jumping on anecdotal user reports, and not really planning too far in advance -- and more broadly, what anecdotal evidence represents generally.

This is easy to describe in the context of general product development: if you hear a user complaint, that's basically always the tip of iceberg. That's not the first unhappy user, it's just the first one you heard about.

It means your QA process isn’t catching issues, which implies you have hundreds of other issues + plenty of other users hit the same issue but didn’t bother reporting + plenty of other users left the platform without reporting 

Operating with a naive and greedy algorithm is a good way to "gradient descent" into a great product: fix whatever users are complaining about right now, ship, repeat.

I find this generally applies to anecdotal evidence in the world generally. When people hear something unexpected or new, they seem to often assume that's the full extent of it, without properly modeling the implied "tip of the iceberg". This is sort of a variation of "strong beliefs, weakly held": when you encounter surprising information, your "world model" update should be large, until proven otherwise. The succinct ML analogy is that your learning rate should be pretty high when you encounter a high loss example.