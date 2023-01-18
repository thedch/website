# A Quarto Blog

## An opinionated guide

Goal: to work on Jupyter Notebooks and easily publish them to the web for others to read.
- We want all content to be rendered locally.
- There should be no interaction with GitHub actions.
- While having some automation there is alluring, do not fall into this trap.
- Jupyter Notebooks hold tricky state, and can reference local files, which GitHub actions cannot handle.
- The workflow should be to work on a Jupyter Notebook until satisfied, run ~1 command, and the blog is updated with the content from the notebook.

Download Quarto from [their website](https://quarto.org/docs/get-started/). 
Unfortunately, it doesn't seem to be available via brew / pip / conda / etc, possibly due to the emphasis on R?
We'll be using Quarto with Jupyter Notebooks and GitHub Pages.

I am generally uninterested with comments, newsletter subscriptions, analytics, etc.

```
$ quarto create-project --type website:blog ./blog
$ cd ./blog
$ tree
(base) blog % tree
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

After running the preview step (`quarto preview .`), a new `docs` directory is created with html content:

```
(base) docs [master●] % ls -lht
total 856
-rw-r--r--  1 daniel  staff   213B Jan 18 22:10 listings.json
-rw-r--r--  1 daniel  staff    13K Jan 18 22:10 index.html
-rw-r--r--  1 daniel  staff    10K Dec 25 06:54 search.json
drwxr-xr-x  6 daniel  staff   192B Dec 25 06:54 posts
-rw-r--r--  1 daniel  staff   8.5K Dec 25 06:17 about.html
drwxr-xr-x  7 daniel  staff   224B Dec 25 06:12 site_libs
-rw-r--r--@ 1 daniel  staff   377K Dec 25 03:52 profile.png
-rw-r--r--  1 daniel  staff    17B Dec 24 04:57 styles.css
```

I made some changes to my `_quarto.yml`, feel free to copy the ones you like. Unfortunately the Quarto docs don't make it super clear
what all the available options for configuration is.

### Commands you'll need for regular development

```
quarto preview . # runs rendering step + launches a local webserver
```

### References

[Awesome Quarto](https://github.com/mcanouil/awesome-quarto)

[The ultimate guide to starting a Quarto blog](https://albert-rapp.de/posts/13_quarto_blog_writing_guide/13_quarto_blog_writing_guide.html)
