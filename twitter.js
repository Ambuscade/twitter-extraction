const TWEETS_CONTAINER_QUERY = 'html section > div > div'
const COLUMN_SEPARATOR = '\t'
const ROW_SEPARATOR = '\n'

// HELPERS

/**
 * Wait for some amount of time
 * @param {number} time 
 * @returns {Promise}
 */
function wait(time) {
    // Randomize time
    const delta = time * 0.5
    const min = -delta
    const max = delta

    const randomTime = time + Math.random() * (max - min) + min

    // https://stackoverflow.com/a/39914235
    return new Promise(resolve => setTimeout(resolve, randomTime))
}

/**
 * Normalize text input
 * @param {string} text 
 * @returns {string}
 */
function normalize(text) {
    return text
        .replace(COLUMN_SEPARATOR, '↹')
        .replace(/(\r\n|\n|\r)/gm, "↵")
        .trim()
}

// EXTRACTION

/**
 * Get user handle
 * @param {HTMLElement} tweet 
 * @returns {string|null}
 */
function getUserHandle(tweet) {
    const containerElement = tweet.querySelector('[data-testid="User-Name"]')
    if(containerElement === null) {
        return null
    }

    const anchorElements = containerElement.querySelectorAll('a')

    if(anchorElements.length < 2) {
        return null
    }

    return normalize(anchorElements.item(1).innerText)
}

/**
 * Get tweet text
 * @param {HTMLElement} tweet
 * @returns {string|null} 
 */
function getTweetText(tweet) {
    const containerElement = tweet.querySelector('[data-testid="tweetText"]')

    if(containerElement === null) {
        return null
    }

    let text = ''
    let part = containerElement.firstChild

    do {
        switch (part.nodeName) {
            // Extract emoji
            case 'IMG':
                text += part.getAttribute('alt')
                break;
            default:
                text += part.innerText
                break;
        }

        part = part.nextSibling
    } while(part !== null)

    return normalize(text) 
}

// FEED LOADING

/**
 * 
 * @param {HTMLElement} tweet 
 * @returns {boolean}
 */
function assertTweetIsInViewport(tweet) {
    const bounds = tweet.getBoundingClientRect()

    // If tweet is in viewport, return early
    if(bounds.top < window.innerHeight) {
        return true
    }

    // Scroll page
    const html = document.querySelector('html')
    html.scrollBy({
        top: window.innerHeight * 0.75
    })

    return false
}

// RESULT DOWNLOAD

function downloadFile(text) {
    const [_, user, __, tweetId] = location.pathname.split('/')
    const filename = !!tweetId ? `${user}-${tweetId}.tsv` : `${user}.tsv`

    // https://stackoverflow.com/a/18197341
    const element = document.createElement('a');
    element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(text));
    element.setAttribute('download', filename);
  
    element.style.display = 'none';
    document.body.appendChild(element);
  
    element.click();
  
    document.body.removeChild(element);
}

// MAIN LOOP
let cancelLoop = false
let delay = 1000

async function getAllReplies() {
    const container = document.querySelector(TWEETS_CONTAINER_QUERY)
    let tsv = `User${COLUMN_SEPARATOR}Text${ROW_SEPARATOR}`

    // Prepare state
    let tweet = container.firstChild
    cancelLoop = false

    // Walk over each tweet
    do {
        // Check if loop was canceled
        if(cancelLoop) {
            break
        }

        // Scroll page
        const wasInViewport = assertTweetIsInViewport(tweet)

        // Extract tweet data
        const user = getUserHandle(tweet)
        const text = getTweetText(tweet)

        // Check if all data was extracted
        if(user !== null && text !== null) {
            // Add new row
            tsv += `${user}${COLUMN_SEPARATOR}${text}${ROW_SEPARATOR}`
        }

        // Wait for tweets to load
        if(!wasInViewport) {
            await wait(delay)
        }

        // Get next tweet
        tweet = tweet.nextSibling
    } while(tweet !== null)

    // Download extracted tweets
    downloadFile(tsv)
}

// UI


(() => {
    const html = document.querySelector('html')

    // Add download button
    const startButton = document.createElement('button')

    startButton.style.position = 'fixed'
    startButton.style.top = '16px'
    startButton.style.left = '16px'
    startButton.style.height = '48px'
    startButton.style.lineHeight = '48px'
    startButton.style.backgroundColor = '#1d9bf0'
    startButton.style.color = 'white'
    startButton.style.padding = '0'
    startButton.style.border = 'unset'
    startButton.style.borderRadius = '48px'
    startButton.style.paddingLeft = '16px'
    startButton.style.paddingRight = '16px'
    startButton.innerText = 'Start extraction'
    startButton.onclick = getAllReplies

    html.appendChild(startButton)

    const endButton = document.createElement('button')

    endButton.style.position = 'fixed'
    endButton.style.top = '72px'
    endButton.style.left = '16px'
    endButton.style.height = '48px'
    endButton.style.lineHeight = '48px'
    endButton.style.backgroundColor = '#be4e55'
    endButton.style.color = 'white'
    endButton.style.padding = '0'
    endButton.style.border = 'unset'
    endButton.style.borderRadius = '48px'
    endButton.style.paddingLeft = '16px'
    endButton.style.paddingRight = '16px'
    endButton.innerText = 'Stop extraction'
    endButton.onclick = () => {
        cancelLoop = true
    }

    html.appendChild(endButton)

    const delayInput = document.createElement('input')

    delayInput.style.position = 'fixed'
    delayInput.style.top = '128px'
    delayInput.style.left = '16px'
    delayInput.style.backgroundColor = 'white'
    delayInput.style.color = '#222'
    delayInput.style.padding = '16px'
    delayInput.style.border = 'unset'
    delayInput.style.borderRadius = '48px'
    delayInput.placeholder = 'Delay (in milliseconds)'
    delayInput.value = delay
    delayInput.onchange = function() {
        delay = +this.value
    }

    html.appendChild(delayInput)
})();


