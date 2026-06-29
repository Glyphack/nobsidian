# Dots

Opinionated dotfile style obsidian customizations.


## Weekly Note

Created from a template in `Templates/Weekly Note Template.md`.
Placed into `Weekly/yyyy-ww.md` where `ww` is the week number.
First day of the week is Monday.


## Daily Note

Automatically creates daily note when you open Obsidian.
On mobile where typing a date is hard this makes it easier.
Whenever you want to link to current date you can just type `[[202...]]` and link it easily.


## Sync to Blog

I build my blog using a static site generator.
To emulate obsidian publish I am exporting notes from obsidian to my blog repository.
The site generator picks up the notes and generates pages for them.

There are two kinds of notes:

- blogs: These end up in content/blog
- non-blogs: These end up in content/synced

The synced notes have a `layout` property that defines what template is used to render them.
Blogs are rendered as normal posts.

To publish a note:

Add `share: true` property.
Add `dest` property, for a blog it's `blog/my-post` and for a note it's `my-note`. Notes are moved to `synced` because they don't have blog prefix in destination.

Run `publish-notes` command and the notes are copied to blog folder.

Handling images is tricky. To make it simpler I bundle a note and all of it's attachments into one folder.
So a `my-post.md` becomes `my-post/index.md` and attachments can be inside the folder.
