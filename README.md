# A Quarto Blog

## An opinionated guide

Goal: to work on Jupyter Notebooks and easily publish them to the web for others to read.
Secondary goal: to publish Markdown files as blog posts as well (this is basically a subset of Jupyter Notebooks, shouldn't be hard)

Download Quarto from [their website](https://quarto.org/docs/get-started/). 
Unfortunately, it doesn't seem to be available via brew / pip / conda / etc, possibly due to the emphasis on R?
We'll be using Quarto with Jupyter Notebooks and GitHub Pages.

I am generally uninterested with comments, newsletter subscriptions, analytics, etc.

```
$ quarto create-project --type website:blog ./delete-blog
$ cd ./delete-blog
$ tree
(base) delete-blog % tree
.
├── _quarto.yml
├── about.qmd
├── index.qmd
├── posts
│   ├── _metadata.yml
│   ├── post-with-code
│   │   ├── image.jpg
│   │   └── index.qmd
│   └── welcome
│       ├── index.qmd
│       └── thumbnail.jpg
├── profile.jpg
└── styles.css
```

We want all content to be rendered locally.
There should be no interaction with GitHub actions.
While having some automation there is alluring, do not fall into this trap.
Jupyter Notebooks hold tricky state, and can reference local files, which GitHub actions cannot handle.

The workflow should be to work on a Jupyter Notebook until satisfied, run ~1 command, and your blog is updated with the content from the notebook.

After running the preview step, a new `rendered` directory is created with html content:

```
(base) thedch.github.io [master●●] % ls rendered
about.html    index.html    listings.json posts         profile.jpg   profile.png   search.json   site_libs     styles.css
```

### Commands you'll need

```
quarto preview . # runs rendering step + launches a local webserver
```

### References

[Awesome Quarto](https://github.com/mcanouil/awesome-quarto)

[The ultimate guide to starting a Quarto blog](https://albert-rapp.de/posts/13_quarto_blog_writing_guide/13_quarto_blog_writing_guide.html)
