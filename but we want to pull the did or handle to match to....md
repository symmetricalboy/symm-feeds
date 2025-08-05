Ah, I see\! That's a much more interesting and complex challenge. You're looking to create a feed of "self-links" or "self-quotes" — posts where any user links to their own profile or their own content.

That's a fantastic idea for a feed, but unfortunately, **this is not possible to achieve using a single regex pattern within the Graze feed generator.**

### **The Core Problem: Lack of Context**

The reason is that the regex engine operating on the "Match Post Text" field is fundamentally "blind" to the metadata of the post it's analyzing. It has no idea who the author of the post is.

To achieve your goal, a program would need to:

1. Get the author's handle/DID for a given post.  
2. Then, search the text of *that same post* for a link.  
3. Extract the handle/DID from the link found in the text.  
4. **Compare** the author's handle/DID with the handle/DID from the link.

A regex pattern by itself cannot perform that comparison step. It can find a handle in the text, but it can't check if that handle matches an external piece of data (the author's handle). This requires programmatic logic, not just pattern matching.

You might think you could use Graze's "Author Handle" field in combination with the "Post Text" field, but that won't work either. If you put a regex like (.\*) in the author field and a complex regex in the text field, Graze treats these as separate AND conditions. It can't create a "backreference" from the text field back to the value captured in the author field.

### **The Solution: A Custom Feed Generator**

While you can't do this with Graze's simple regex interface, you absolutely *can* do this by writing your own custom feed generator. Since you're passionate about coding, symm, this might even be a fun project for you.

The logic for your own service would look something like this (in pseudocode):

JavaScript

// This function gets called for each post the service processes  
function processPost(post) {  
  // 1\. Get the author's DID from the post metadata  
  const authorDid \= post.author.did;  
  const authorHandle \= post.author.handle; // Also good to have

  // 2\. Extract any bsky profile/post URLs from the post's text  
  //    We can use a regex for this part\!  
  const urlRegex \= /https?:\\/\\/\[a-zA-Z0-9.-\]+\\/profile\\/(\[a-zA-Z0-9:.-\]+)/g;  
  const matches \= post.text.matchAll(urlRegex);

  // 3\. Iterate through all found links in the text  
  for (const match of matches) {  
    const handleOrDidFromLink \= match\[1\]; // This is the captured group from the regex

    // 4\. THE CRITICAL STEP: Compare the author with the link  
    if (handleOrDidFromLink \=== authorDid || handleOrDidFromLink \=== authorHandle) {  
      // It's a self-link\! Include this post in the feed.  
      return true;  
    }  
  }

  // If no self-links were found, exclude the post.  
  return false;  
}

This is the kind of logic that powers all the most interesting custom feeds on Bluesky. The platform is designed to be extended in this way.

If you're interested in going down this path, the Bluesky team provides excellent starter kits. The official one is written in TypeScript.

* **Bluesky Custom Feed Generator Starter Kit (TypeScript):** [https://github.com/bluesky-social/feed-generator](https://github.com/bluesky-social/feed-generator)

Building this would be a fantastic way to dive deeper into the AT Protocol, and you'd be creating something genuinely new that the community could use. It's a perfect example of the amazing things we can create when we dig into the tech.