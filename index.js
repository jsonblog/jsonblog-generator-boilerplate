const axios = require("axios");
const fs = require("fs");
const path = require("path");
const slugify = require("slugify");
const Handlebars = require("handlebars");
const marked = require("marked");
const { readdir, stat } = require("fs-promise");
var hljs = require("highlight.js");

var md = require("markdown-it")({
  html: true, // Enable HTML tags in source
  breaks: false, // Convert '\n' in paragraphs into <br>
  linkify: true, // Autoconvert URL-like text to links
  highlight: function (str, lang) {
    if (lang && hljs.getLanguage(lang)) {
      try {
        return (
          '<pre class="hljs"><code>' +
          hljs.highlight(lang, str, true).value +
          "</code></pre>"
        );
      } catch (__) {}
    }

    return (
      '<pre class="hljs"><code>' + md.utils.escapeHtml(str) + "</code></pre>"
    );
  },
});

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
  const files = (await readdir(dir)).map((f) => path.join(dir, f));
  allFiles.push(...files);
  await Promise.all(
    files.map(
      async (f) => (await stat(f)).isDirectory() && rreaddir(f, allFiles)
    )
  );
  return allFiles;
}

async function fetchFile(uri) {
  let content;
  try {
    if (uri.indexOf("http") !== -1) {
      // remote file
      content = (await axios.get(`${uri}?cb=${new Date().getTime()}`)).data;
    } else {
      // local file
      content = fs.readFileSync(uri, "utf8");
    }
  } catch (e) {
    console.log(e);
  }
  return content;
}

const generator = async (blog) => {
  const pageTemplate = Handlebars.compile(PAGE_TEMPLATE);
  const postsWithContent = [];

  for (const post of blog.posts) {
    let content = "";
    try {
      content = await fetchFile(post.source);
      console.log(content);
    } catch (e) {
      console.log(e);
    }
    if (content) {
      post.content = md.render(content);
      post.slug = slugify(post.title);
      postsWithContent.push(post);
    }
  }

  const pagesWithContent = [];
  for (const page of blog.pages || []) {
    let content = "asd";
    try {
      content = await fetchFile(page.source);
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
      pageContent: indexTemplate({ posts: postsWithContent }),
    }),
  });

  files.push({
    name: "main.css",
    content: MAIN_CSS,
  });

  // Copy assets into memory
  console.log("aaaaa");
  const assets = await rreaddir(__dirname + "/assets");

  // Generate page files

  for (const page of pagesWithContent) {
    console.log("page", page);
    files.push({
      name: `${page.slug}/index.html`,
      content: layoutTemplate({
        site: blog.site,
        page: page,
        pages: blog.pages,
        pageContent: pageTemplate({ page }),
      }),
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
        post: post,
        pageContent: postTemplate({ post: post }),
      }),
    });
  }

  return files;
};

module.exports = generator;
