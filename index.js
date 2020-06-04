const axios = require("axios");
const fs = require("fs");
const path = require("path");
const slugify = require("slugify");
const Handlebars = require("handlebars");
const marked = require("marked");

const INDEX_TEMPLATE = fs.readFileSync(
  path.join(__dirname, "./templates/index.hbs"),
  "utf8"
);
const POST_TEMPLATE = fs.readFileSync(
  path.join(__dirname, "./templates/post.hbs"),
  "utf8"
);
const LAYOUT_TEMPLATE = fs.readFileSync(
  path.join(__dirname, "./templates/layout.hbs"),
  "utf8"
);

const MAIN_CSS = fs.readFileSync(
  path.join(__dirname, "./templates/main.css"),
  "utf8"
);

const generator = async blog => {
  const postsWithContent = [];
  for (const post of blog.posts) {
    let content = null;
    try {
      content = (await axios.get(post.source)).data;
    } catch (e) {
      console.log(e);
    }
    if (content) {
      post.content = marked(content);
      post.slug = slugify(post.title);
      postsWithContent.push(post);
    }
  }

  // Files to be returned
  const files = [];

  const layoutTemplate = Handlebars.compile(LAYOUT_TEMPLATE);

  // Make index file
  const indexTemplate = Handlebars.compile(INDEX_TEMPLATE);
  files.push({
    name: "index.html",
    content: layoutTemplate({
      site: blog.site,
      page: indexTemplate({ posts: postsWithContent })
    })
  });
  files.push({
    name: "main.css",
    content: MAIN_CSS
  });
  // Generate post files

  const postTemplate = Handlebars.compile(POST_TEMPLATE);

  for (const post of postsWithContent) {
    files.push({
      name: `${post.slug}.html`,
      content: layoutTemplate({
        site: blog.site,
        page: postTemplate({ post: post })
      })
    });
    postTemplate;
  }

  return files;
};

module.exports = generator;
