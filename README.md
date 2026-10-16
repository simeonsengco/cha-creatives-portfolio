# CHAAA CREATIVES — Charlene Dela Cruz

A responsive portfolio built with plain HTML, CSS, and JavaScript. No build step or dependency installation is required.

## Upload to GitHub

Prepared package: 62 files, approximately 397 MB (61% smaller than the working project). The largest file is approximately 95 MB.

This folder is the complete website. Upload its contents, with `index.html` at the repository root. Use GitHub Desktop or Git to push it: the full-length podcast files exceed the browser uploader's 25 MiB limit, but every file is below GitHub's 100 MiB Git file limit. Git LFS is not required. See [GitHub file limits](https://docs.github.com/en/repositories/working-with-files/managing-files/adding-a-file-to-a-repository).

1. Create an empty repository on GitHub and clone it with GitHub Desktop.
2. Copy everything inside this folder into the cloned repository, including the hidden `.gitignore`, `.gitattributes`, and `.nojekyll` files. Do not copy the larger parent folder.
3. In GitHub Desktop, commit the files and click **Push origin**.
4. To publish as a website, enable GitHub Pages for the repository's main branch and root folder. See [GitHub Pages setup](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site).

Only media referenced by this website is included. Videos retain their full duration and audio; large reels are resized for the web, and the website-concept PDF has optimized images with all six pages preserved. Original media remains outside this upload folder in the working project.

## Preview

Open `index.html` directly, or use Node.js 18 or newer:

```sh
npm run dev
```

Visit **http://localhost:8000**. The local server supports byte-range requests for seeking through videos. Stop it with Ctrl+C. Set `PORT` to use another port.

## Files

```text
index.html             Page content, services, experience, and contact form
style.css              Responsive layout, colors, and component styles
main.js                Navigation, filtering, image/video viewer, and form validation
portfolio-data.js      The 16 selected projects and their source paths
trust-data.js          Six testimonial excerpts and two certificate records
assets/previews/       Smaller image previews and extracted video thumbnails
src/                   Used work samples, PDFs, images, and optimized videos
scripts/serve.mjs      Dependency-free local preview server
scripts/check.mjs      Project data, file references, and HTML anchor checks
scripts/check-http.mjs HTTP asset and video-streaming checks
```

## Edit the portfolio

Add an entry to `PORTFOLIO` in `portfolio-data.js`. Categories and project counts update automatically. Each entry needs a unique `id`, `title`, `category`, `format`, `description`, `alt`, `image`, and `type`:

- `image`: set `source` to the full-resolution image.
- `gallery`: set `images` to the ordered image paths. The viewer supports Previous/Next buttons and arrow keys.
- `video`: set `source` to a browser-compatible MP4 and `image` to a poster image. Video data loads only after opening the project; closing the viewer stops playback.
- `pdf`: set `image` to a cover preview and `source` to the PDF. The viewer links to the full document in a new tab.

Paths are relative to `index.html`. Use the actual filenames, including spaces; JavaScript handles URL encoding. Keep previews reasonably small. Media in `src` includes optimized web copies. Keep your original files separately for future editing.

The hero uses an optimized copy of `src/CC Profile.png`. The Podcasts filter contains all five supplied Podcast Editing samples. Edit the portrait and page copy in `index.html`. Purple accents appear in headings, buttons, active filters, and pale section backgrounds. Frosted surfaces are used on navigation, the portrait caption, media labels, and the contact form. Brand colors are in `:root` at the top of `style.css`.

## Browsing and interaction

The gallery starts with six selected projects in a compact three-column desktop grid, two columns on tablets, and one column on phones. **View all projects** reveals the full collection; category filters, hero shortcuts, and floating skill links narrow the work immediately. The project viewer has Previous/Next controls within the currently visible selection. Carousel arrow keys still navigate slides. Videos stop and release their media when you change projects or close the viewer.

Service descriptions expand using native, keyboard-accessible disclosure controls. Their inquiry links prepare a relevant contact subject without sending a message.

On desktop, a small purple dot follows the native cursor and expands lightly over controls. Project cards and the portrait have a restrained pointer-driven tilt and highlight. The follower stops rendering frames when idle and is disabled on touch devices and with reduced motion.

Containers fade and rise into view once as they enter the viewport, with staggered delays up to 240ms and a 620ms transition. New filter results, service details, and project previews also animate into view. A thin purple line indicates scroll progress. Keyboard focus bypasses entrance animation, and reduced-motion preferences disable the motion without hiding content. No animation library is required.

Floating skill labels, a gently shifting portrait halo, and podcast sound bars animate in the hero. The services ribbon loops horizontally and pauses on hover or keyboard focus. **Pause motion** controls in the hero and services ribbon stop continuous animation, entrance effects, and the cursor follower together. Loops pause offscreen and when the page is hidden; reduced-motion visitors get a static, wrapping services list. The repeated marquee copy is hidden from assistive technology.

**Tools & workflow** uses four interactive tabs with software tiles and task descriptions. Click a step, or use arrow keys and Home/End while focused on a tab. Tab moves into the selected panel. The panels and tiles animate when switching steps; all tool groups remain readable if JavaScript is unavailable.

## Testimonials and certificates

`trust-data.js` contains six selected excerpts transcribed from images in `src/Testimonial/`, plus the two documents in `src/Certificate/`. Three testimonial cards appear initially; **More kind words** reveals the other three. Names that were obscured in the source screenshots have not been inferred or added.

Cards open an accessible document viewer with Previous/Next controls, left/right arrow keys, Escape to close, and focus restored to the originating link. Original-image and PDF links remain available. The WordPress certificate uses a JPEG preview generated from the supplied PDF; the English grammar and vocabulary certificate is explicitly described as a self-assessment, matching its disclaimer. Certificate and testimonial source files are unchanged.

## Contact

The contact form validates the fields and opens an email draft addressed to **chaaa.creatives@gmail.com**. It does not send or store messages; the visitor reviews and sends the draft in their own email app. Direct email links remain available. To receive submissions on the website, integrate a form service or backend first.

## Checks

```sh
npm run check
# While the preview server is running on port 8000:
node scripts/check-http.mjs
```

`npm run check` verifies JavaScript syntax, project and testimonial/certificate metadata, all referenced local files, unique HTML IDs, and navigation anchors. HTTP checks verify asset responses and partial video downloads.

For browser QA, check desktop and mobile layouts, category filtering, gallery arrow keys, dialog Escape/close and focus return, video playback/seeking, PDF links, menu controls, and contact validation. Reduced-motion preferences are respected.

## Hosting

This is a static website. Publish `index.html`, `style.css`, `main.js`, `portfolio-data.js`, `trust-data.js`, `assets/previews`, and the media files referenced by the portfolio, testimonials, certificates, and résumé link, preserving their paths. The ZIP archives and unrelated files in `src` are not needed by the page. Large video files require a host that supports their size and byte-range streaming; they can also be moved to a dedicated media host with corresponding source URL changes.

The media URL helper also supports absolute HTTPS URLs. Add `og:url` and a hosted `og:image` after choosing the final public URL. Google Fonts is optional; system and Georgia fallbacks work without it.

No deployment is configured or performed by the preview server.
