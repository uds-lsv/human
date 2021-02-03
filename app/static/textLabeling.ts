import { Data } from './data'
import { automaton } from './start'

declare var Split

/**
 * Displays content and context field for reading tasks. This is used for loading the text before annotations.
 * @param meta meta object for question and answer strings
 */
export function showRead(meta) {
    const question = meta.question
    const answer = meta.answer

    $('.card-subtitle').show()
    $('#text-input').hide()
    $('#word-list').hide()
    $('.pictureContainer').hide()
    $('#pdf-meta').hide()
    $('#picture_content').hide()
    $('.textContainer').show()
    $('.comment-content').show()
    $('.context-content').show()

    $('.comment-content').empty()
    $('.context-content').empty()
    $('.gutter-vertical').remove()
    Split([ '#contentContainer', '#bottomContainer' ], {
        sizes: [ 50, 50 ],
        direction: 'vertical',
        gutterSize: 8,
        cursor: 'row-resize',
    })
    let text = add_spans(Data.data['content'])
    $('.comment-content').append(text)
    $('.context-content').append(Data.data['context'])

    $('#question').append(question)
    let answer_button = $(
        '<button class="btn btn-primary">' + answer + '</button>'
    )
    answer_button.on('click', (event) => {
        automaton.next('NEXT')
    })
    $('#answer').append(answer_button)
}

/**
 * Setup for text labeling.
 * 
 * Each option to label the text gets a button in a specific color to switch between them. 
 * By clicking words in the content field, the word is then labeled with the activated option.
 * This is handled by {@link activateOnClick}
 * @param meta meta object for question, answer and column
 * @param options array containing labels for each labeling option
 */
export function showLabeling(meta, options: string[]) {
    $('.card-subtitle').show()
    if (Array.isArray(Data.annotations[meta.column])) {
        Data.annotations[meta.column] = {}
    }
    let colors = [
        'red',
        'deepskyblue',
        'greenyellow',
        'yellow',
        'orange',
        'turquoise',
        'pink',
        'bisque',
        'lavender',
        'lightgrey',
    ]
    let width = 100 / options.length

    for (let i = 0; i < options.length; i++) {
        $('#color-bar').append(
            $(
                "<button style='background-color: {0}; width: {1}%'>{2}</button>".format(
                    [ colors[i], width.toString(), options[i] ]
                )
            ).on('click', (ev) => {
                activateOnClick(meta, options[i], colors[i])
            })
        )
    }
    let button = $(
        '<button type="button" class="btn btn-primary">' +
            meta.answer +
            '</button>'
    ) // next button
    button.on('click', (event) => {
        $('.comment-content').off('click tap')
        let markers2 = JSON.stringify(markers)
        $('#color-bar').empty()
        automaton.next('NEXT', { annotation: markers2 })
        let word_elements = $('.individual_word')
        let i = 0
        for (i; i < word_elements.length; i++) {
            let word_element = word_elements[i]
            word_element.style.backgroundColor = ''
        }
    })
    // $('#question').empty();
    // $('#answer').empty();
    $('#question').append(meta.question)
    $('#answer').append(button)
}

/**
 * 
 * @param meta 
 * @param option 
 * @param color 
 */
function activateOnClick(meta, option, color) {
    $('.comment-content').off('click tap')
    $('.comment-content').on('click tap', $('.comment-content'), function(
        e
    ) {
        console.log(e)
        if (e.target.tagName === 'SPAN') {
            if (e.target.style.backgroundColor === color) {
                e.target.style.backgroundColor = ''
                delete Data.annotations[meta.column][e.target.id]
                delete markers[e.target.id]
            } else if (e.target.style.backgroundColor === '') {
                e.target.style.backgroundColor = color
                Data.annotations[meta.column][e.target.id] = {
                    type: option,
                    word: e.target.textContent,
                }
                markers[e.target.id] = {
                    type: option,
                    word: e.target.textContent,
                }
            } else {
            }

            // save e.target and option in csv
        }
        console.log(e)
    })
}

var markers = {}

/**
 * Converts a string to a html string with <span></span> tags around each word separated by a space.
 * @param text string containing text
 */
function add_spans(text: string): string {
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
