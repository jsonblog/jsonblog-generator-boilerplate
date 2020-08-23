# Json Blog Generator Boilerplate

This is the default generator for JSON blog and built as an example for people looking to build `generators`.

In short, a `generator` is a function that takes a parsed `blog.json` and returns an array of filenames and corresponding contents of those files.

The output should be saved to the file system.

```
const generator = (blogObject) => {
  const siteName = blogObject.site.name;
  const templateHTML = '<h1>{siteName}</h1>';
  const fileContent = templateHTML.replace('{siteName}', siteName);
  const files = [];
  files.push({
    content: fileContent,
    path: 'index.html'
  });
  files.forEach((file) => {
      fs.writeFileSync(file.path, file.content)
  })
}

generator({name: 'Ajax'});
// index.html
<h1>Ajax</h1>

```

You can write that shit in any language.

Theoretically, a generator can generate the code required for any blog framework.

One blog to rule them all.
