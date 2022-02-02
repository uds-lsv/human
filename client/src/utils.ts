/**
 * Convert Blob to a src DataURL for Images
 * @param {Blob} blob
 */
export function blobToDataURL(blob: Blob): Promise<string | ArrayBuffer> {
    return new Promise((resolve, reject) => {
        try {
            var a = new FileReader()
            a.onload = function (e) {
                resolve(e.target.result)
            }
            a.readAsDataURL(blob)
        } catch (error) {
            reject(error)
        }
    })
}

/**
 * Converts a string to a html string with <span></span> tags around each word separated by a space.
 * @param text string containing text
 */
export function add_spans(text: string): string {
    const split_text = text.split(' ')
    let spans = []
    let i = 0
    for (i; i < split_text.length; i++) {
        let word = split_text[i]
        word =
            '<span id="word_' +
            i +
            '"class="individual_word">' +
            word +
            ' </span>'
        spans.push(word)
    }
    return spans.join(' ')
}
