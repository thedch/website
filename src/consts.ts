import type { Metadata, Site, Socials } from "@types";

export const SITE: Site = {
  TITLE: "daniel's blog",
  DESCRIPTION: "A blog about building great products and machine learning challenges.",
  EMAIL: "daniel@hunter.sh",
  NUM_POSTS_ON_HOMEPAGE: 3,
  NUM_PROJECTS_ON_HOMEPAGE: 3,
};

export const HOME: Metadata = {
  TITLE: "home",
  DESCRIPTION: "A blog about building great products and machine learning challenges.",
};

export const BLOG: Metadata = {
  TITLE: "blog",
  DESCRIPTION: "A collection of articles on topics I care about.",
};

export const PROJECTS: Metadata = {
  TITLE: "projects",
  DESCRIPTION:
    "A collection of my projects with links to repositories and live demos.",
};

export const SOCIALS: Socials = [
  {
    NAME: "X",
    HREF: "https://x.com/nearlydaniel",
    ICON: "simple-icons:x",
  },
  {
    NAME: "GitHub",
    HREF: "https://github.com/thedch",
    ICON: "mdi:github",
  },
  {
    NAME: "LinkedIn",
    HREF: "https://www.linkedin.com/in/thedch",
    ICON: "mdi:linkedin",
  },
];