import { Data } from './data'
import { automaton } from './start'

declare var Split

export function showRead(data, question) {
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
    let text = add_spans(data['content'])
    $('.comment-content').append(text)
    $('.context-content').append(data['context'])

    $('#question').append(question)
    let yes = $('<button class="btn btn-primary">Next</button>')
    yes.click((event) => {
        automaton.next('NEXT')
    })
    $('#answer').append(yes)
}

export function showLabeling(meta, options) {
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
                    [ colors[i], width, options[i] ]
                )
            ).on('click', (ev) => {
                activateOnClick(meta, options[i], colors[i])
            })
        )
    }
    let button = $(
        '<button type="button" class="btn btn-primary">Next</button>'
    ) // next button
    button.on('click', (event) => {
        $('.comment-content').unbind('click tap')
        let markers2 = JSON.stringify(markers)
        $('#color-bar').empty()
        automaton.next('NEXT', { annotation: markers2 })
        console.log('Clicked Next')
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

function activateOnClick(meta, option, color) {
    var onclick = $('.comment-content').unbind('click tap')
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

function add_spans(text) {
    text = text.split(' ')
    let spans = []
    let i = 0
    for (i; i < text.length; i++) {
        let word = text[i]
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
