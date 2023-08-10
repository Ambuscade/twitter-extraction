# Twitter Extraction

Simple web extension for extracting tweets from a user profile or a tweet thread.

# Install

Load `manifest.json` as a temporary extension (in Firefox you can do this in the [about:debugging](about:debugging#/runtime/this-firefox) page) and navigate to a [twitter.com](https://twitter.com).

# Troubleshooting

Keep in mind that this extension heavily relies on a DOM structure, which might change at any time. All important node queries are defined as global variables at the top of the `twitter.js` file, so feel free to change them

If the downloaded file is empty or very small, try to increase delay or/and increase browser window height. Slower internet connections and less powerful computers might struggle with processing tweets in a time window defined by a delay field.