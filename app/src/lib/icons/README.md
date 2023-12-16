https://stackoverflow.com/a/75191716/2831078

I recommend putting images under src/lib, not static. For example you could make a src/lib/images or src/lib/assets folder and put them there.

The reason is performance:

For files imported from anywhere under src, at compile time Vite adds a hash to the filename. myImage.png might end up as myImage-a89cfcb3.png. The hash is based on the image contents. So if you change the image, it gets a new hash. This enables the server to send a very long cache expiration to the browser, so the browser can cache it forever or until it changes. It's key-based cache expiration, which IMO is the best kind: cached exactly as long as it needs to be. (Whether the server actually sends the right caching headers in the response may depend on which SvelteKit adapter you use and what host you're on.)

By contrast, images under static don't have a hash added to their name. You can use the static directory for things like robots.txt that need to have a specific filename. Since the filename stays unchanged even if its contents change, these files by necessity end up having a cache-control value that includes max-age=0, must-revalidate and an etag, which means even if the browser caches the image it still has to make a server round-trip to validate that the cached image is correct. This slows down every image on your site.
