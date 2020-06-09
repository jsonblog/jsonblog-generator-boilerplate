const axios = require("axios");
const fs = require("fs");
const path = require("path");
const slugify = require("slugify");
const Handlebars = require("handlebars");
const marked = require("marked");
const { readdir, stat } = require("fs-promise");

const INDEX_TEMPLATE = fs.readFileSync(
  path.join(__dirname, "./templates/index.hbs"),
  "utf8"
);
const POST_TEMPLATE = fs.readFileSync(
  path.join(__dirname, "./templates/post.hbs"),
  "utf8"
);
const PAGE_TEMPLATE = fs.readFileSync(
  path.join(__dirname, "./templates/page.hbs"),
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

async function rreaddir(dir, allFiles = []) {
  const files = (await readdir(dir)).map(f => path.join(dir, f));
  allFiles.push(...files);
  await Promise.all(
    files.map(async f => (await stat(f)).isDirectory() && rreaddir(f, allFiles))
  );
  return allFiles;
}

const generator = async blog => {
  const postsWithContent = [];
  for (const post of blog.posts) {
    let content = "asd";
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

  const pagesWithContent = [];
  for (const page of blog.pages) {
    let content = "asd";
    try {
      content = (await axios.get(page.source)).data;
    } catch (e) {
      console.log(e);
    }
    if (content) {
      page.content = marked(content);
      page.slug = slugify(page.title);
      pagesWithContent.push(page);
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
      pages: pagesWithContent,
      page: indexTemplate({ posts: postsWithContent })
    })
  });

  files.push({
    name: "main.css",
    content: MAIN_CSS
  });

  // Copy assets into memory
  console.log("aaaaa");
  const assets = await rreaddir(__dirname + "/assets");
  console.log(assets);
  // for (const page of pagesWithContent) {
  //   files.push({
  //     name: `${page.slug}.html`,
  //     content: layoutTemplate({
  //       site: blog.site,
  //       pages: blog.pages,
  //       page: pageTemplate({ page })
  //     })
  //   });
  // }

  // Generate page files
  const pageTemplate = Handlebars.compile(PAGE_TEMPLATE);

  for (const page of pagesWithContent) {
    files.push({
      name: `${page.slug}/index.html`,
      content: layoutTemplate({
        site: blog.site,
        pages: blog.pages,
        page: pageTemplate({ page })
      })
    });
  }

  // Generate post files
  const postTemplate = Handlebars.compile(POST_TEMPLATE);
  for (const post of postsWithContent) {
    files.push({
      name: `post/${post.slug}/index.html`,
      content: layoutTemplate({
        site: blog.site,
        pages: blog.pages,
        page: postTemplate({ post: post })
      })
    });
  }

  return files;
};

module.exports = generator;
