import { automaton } from './start'
import { loadFullSizePDF } from './services/pdf'
import { Task, nextState } from './services/automaton'
import { Data } from './data'
import { add_spans, cleanPaperProjects } from './utils'
import {
    loadPicture,
    loadWords,
    showAnnotatePicture,
    showLabelBBoxes,
    showMultilabelBBox,
    showPictureBBox,
} from './pictureLabeling'

// --------------------------------------------------------------
// GUI
// --------------------------------------------------------------

declare var Split

export async function showText() {
    $('.pdfTask').addClass('hidden')
    $('.pictureTask').addClass('hidden')
    $('.textTask').removeClass('hidden')

    $('.card-subtitle').show()
    $('#text-input').hide()
    $('#text-input-group').hide()
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
    Split(['#contentContainer', '#bottomContainer'], {
        sizes: [50, 50],
        direction: 'vertical',
        gutterSize: 8,
        cursor: 'row-resize',
    })
    let text = add_spans(Data.data['content'])
    $('.comment-content').append(text)
    $('.context-content').append(Data.data['context'])
}

/**
 * Shows a boolean type question in the sidebar
 */
export class BooleanTask implements Task {
    constructor(state, data) {
        this.onEntry(state['question'])
    }

    async onEntry(question) {
        // await loadWords()
        console.log('enter boolean task')
        $('#question').append(question)
        let yes = $('<button class="btn btn-primary">Yes</button>')
        yes.on('click', (event) => {
            yes.off('click')
            // send yes
            this.onExit()
            nextState('YES', { annotation: 1 })
        })
        $('#answer').append(yes)
        let no = $('<button class="btn btn-primary">No</button>')
        no.on('click', (event) => {
            no.off('click')
            // send no
            this.onExit()
            nextState('NO', { annotation: 0 })
        })
        $('#answer').append(no)
    }
    async onExit() {
        $('#question').empty()
        $('#answer').empty()
    }
}

/**
 * Shows a select type question in the sidebar allowing a single answer
 */
export class SelectTask implements Task {
    constructor(state, data) {
        this.onEntry(state['question'], state['answer'], state['options'])
    }

    async onEntry(question: string, answer: string = 'Continue', options) {
        $('#question').append(question) // append question text

        var form = $('<div class="radio"></div>')
        $('#answer').append(form) // append form to answer

        // build radio buttons from options list
        for (let i = 0; i < options.length; i++) {
            const formgroup = $('<div class="radio"></div>')
            form.append(formgroup)

            // label element
            const label = $('<label for="{0}"></label>'.format(['form' + i]))
            // radio input element with running id so it can be accessed later in onClick event handler
            const option = $(
                '<input type="radio" name="radios" value="{0}" id="{1}" >'.format(
                    [options[i], 'form' + i]
                )
            )

            // append option first and label text second to the label tag
            $(label).append(option)
            $(label).append(options[i])
            $(formgroup).append(label) // append everything to group
        }
        let button = $('<button type="button" class="btn btn-primary"></button') // next button
        button.append(answer) // append text
        form.append(button)
        // on click for button
        button.on('click', (event) => {
            button.off('click')
            // get checked radio button and run statemachine NEXT with its value
            for (let i = 0; i < options.length; i++) {
                // console.log($('#form' + i))
                if ((<HTMLInputElement>$('#form' + i)[0]).checked) {
                    nextState($('#form' + i).val(), {
                        annotation: $('#form' + i).val(),
                    })
                    break
                }
            }
        })
    }
    async onExit() {
        $('#question').empty()
        $('#answer').empty()
    }
}

/**
 * Shows a checkmark type question in the sidebar allowing multiple answers
 */
export class CheckmarkTask implements Task {
    constructor(state, data) {
        this.onEntry(state['question'], state['answer'], state['options'])
    }

    async onEntry(question: string, answer: string = 'Continue', options) {
        $('#question').append(question) // append question text

        var form = $('<div class="radio"></div>')
        $('#answer').append(form) // append form to answer

        // build radio buttons from options list
        for (let i = 0; i < options.length; i++) {
            let formgroup = $('<div class="radio"></div>')
            form.append(formgroup)
            // label element
            let label = $('<label for="{0}"></label>'.format(['form' + i]))
            // checkbox input element
            let option = $(
                '<input type="checkbox" name="radios" value="{0}" id="{1}">'.format(
                    [options[i], 'form' + i]
                )
            )
            // append option first and label text second to the label tag
            $(label).append(option)
            $(label).append(options[i])
            $(formgroup).append(label) // append everything to group
        }
        let button = $('<button type="button" class="btn btn-primary"></button') // next button
        button.append(answer) // append text
        form.append(button)
        // on click for button
        button.on('click', (event) => {
            button.off('click')
            let checkedVals = [] // for checkboxes

            // get checked radio button and run statemachine next with its value
            for (let i = 0; i < options.length; i++) {
                if ((<HTMLInputElement>$('#form' + i)[0]).checked) {
                    // next($('#form' + i).val());
                    // break;
                    checkedVals.push($('#form' + i).val()) // for checkboxes
                }
            }
            nextState('NEXT', {
                annotation: checkedVals, // TODO: see SelectTask, why is this here?
                // annotation: JSON.stringify(checkedVals),
            }) // for checkboxes
        })
    }
    async onExit() {
        $('#question').empty()
        $('#answer').empty()
    }
}

/**
 * Shows a choosepage type question in the sidebar returning a blob
 * of the current page in a pdf to the state machine
 */
export class ChoosePageTask implements Task {
    constructor(state, data) {
        this.onEntry(state['question'], state['answer'])
    }

    async onEntry(question: string, answer: string = 'Correct Page') {
        $('#question').append(question)
        let yes = $('<button class="btn btn-primary"></button>')
        yes.append(answer)
        yes.on('click', async (e) => {
            yes.off('click')
            automaton.next(
                'NEXT',
                await new Promise((resolve, reject) => {
                    console.log('loadfullsize')
                    loadFullSizePDF().then((canvas) => {
                        canvas.toBlob(
                            (blob) => {
                                resolve(blob)
                            },
                            'PNG',
                            100
                        )
                    })
                    // ;($('#pdf-canvas').get(0) as HTMLCanvasElement).toBlob(
                    //     (blob) => {
                    //         resolve(blob)
                    //     },
                    //     'PNG',
                    //     100
                    // )
                })
            )
        })
        $('#answer').append(yes)
    }
    async onExit() {
        $('#question').empty()
        $('#answer').empty()
    }
}

// --------------------------------------------------------------
// Text
// --------------------------------------------------------------
export class ReadTask implements Task {
    constructor(state, data) {
        this.onEntry(state['question'], state['answer'])
    }

    async onEntry(question: string, answer: string = 'Continue') {
        $('#question').append(question)
        let answer_button = $(
            '<button class="btn btn-primary">' + answer + '</button>'
        )
        answer_button.on('click', (event) => {
            answer_button.off('click')
            automaton.next('NEXT')
        })
        $('#answer').append(answer_button)
    }
    async onExit() {
        $('#question').empty()
        $('#answer').empty()
    }
}

export class LabelTextTask implements Task {
    constructor(state, data) {
        let options
        if (state['options']) {
            options = state['options']
        } else {
            console.log(data)
            options = JSON.parse(data['annotation'])
        }
        this.onEntry(state['question'], state['answer'], options)
    }

    markers = {}
    /**
     *
     * @param meta
     * @param option
     * @param color
     */
    protected activateOnClick(option, color) {
        $('.comment-content').off('click tap')
        $('.comment-content').on('click tap', $('.comment-content'), (e) => {
            console.log(e)
            if (e.target.tagName === 'SPAN') {
                if (e.target.style.backgroundColor === color) {
                    e.target.style.backgroundColor = ''
                    delete this.markers[e.target.id]
                } else if (e.target.style.backgroundColor === '') {
                    e.target.style.backgroundColor = color
                    this.markers[e.target.id] = {
                        type: option,
                        word: e.target.textContent,
                    }
                } else {
                    // do nothing
                }
            }
            console.log(e)
        })
    }
    async onEntry(question: string, answer: string = 'Continue', options) {
        $('.card-subtitle').show()
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
        const width = 100 / options.length

        for (let i = 0; i < options.length; i++) {
            $('#color-bar').append(
                $(
                    "<button style='background-color: {0}; width: {1}%'>{2}</button>".format(
                        [colors[i], width.toString(), options[i]]
                    )
                ).on('click', (ev) => {
                    this.activateOnClick(options[i], colors[i])
                })
            )
        }
        const button = $(
            '<button type="button" class="btn btn-primary"></button>'
        ) // next button
        button.append(answer)
        button.on('click', (event) => {
            $('.comment-content').off('click tap')
            const markers_copy = JSON.stringify(this.markers)
            nextState('NEXT', { annotation: markers_copy })
        })
        // $('#question').empty();
        // $('#answer').empty();
        $('#question').append(question)
        $('#answer').append(button)
    }
    async onExit() {
        $('#question').empty()
        $('#answer').empty()
        $('#color-bar').empty()
        // revert colors
        const word_elements = $('.individual_word')
        for (let i = 0; i < word_elements.length; i++) {
            const word_element = word_elements[i]
            word_element.style.backgroundColor = ''
        }
    }
}

// --------------------------------------------------------------
// Image
// --------------------------------------------------------------

/**
 * add bounding boxes to picture
 */
export class LabelPictureTask implements Task {
    constructor(state, data) {
        this.onEntry(
            state['question'],
            state['answer'],
            data['predictions'],
            state['maxbboxes']
        )
    }

    async onEntry(
        question: string,
        answer: string = 'Continue',
        predictions: number[][] = [],
        max_bboxes: number = undefined
    ) {
        await loadPicture()
        showAnnotatePicture(
            Data.picture,
            predictions,
            question,
            answer,
            max_bboxes
        )
    }
    async onExit() {
        $('#question').empty()
        $('#answer').empty()
    }
}
/**
 * label bounding boxes with one label each
 */
export class LabelBBoxesTask implements Task {
    constructor(state, data) {
        let bboxes
        if (data['bboxes']) {
            bboxes = data['bboxes']
        } else if (data['annotation']) {
            bboxes = data['annotation']
        } else if (state['bboxes']) {
            bboxes = state['bboxes']
        } else {
            alert(
                'Bounding box prediction or annotation from previous state missing.'
            )
            // TODO: automaton error handling
        }
        let labels = [[]]

        if (data['labels']) {
            labels = data['labels']
        }
        this.onEntry(state['question'], state['answer'], bboxes, labels)
    }

    async onEntry(
        question: string,
        answer: string = 'Continue',
        bboxes,
        predicted_labels: string[][] = []
    ) {
        await loadPicture()
        await loadWords()

        showLabelBBoxes(
            Data.picture,
            bboxes,
            predicted_labels,
            question,
            answer
        )
    }
    async onExit() {
        $('#question').empty()
        $('#answer').empty()
    }
}

/**
 * Multiple labels for one bounding box
 */
export class MultilabelBBoxTask implements Task {
    constructor(state, data) {
        let bbox = []
        let image
        if (data['bbox']) {
            bbox = data['bbox']
        } else if (data['annotation']) {
            if (data['loop_index']) {
                bbox = data['annotation'][data['loop_index']]
            } else {
            bbox = data['annotation'][0]
            }
        } else {
            alert(
                'Bounding box prediction or annotation from previous state missing.'
            )
            return
            // TODO: automaton error handling
        }

        let labels = [[]]
        if (data['predictions']) {
            labels = data['predictions']
        }
        this.onEntry(
            state['question'],
            state['answer'],
            bbox,
            labels,
            data['image']
            // data['bbox'],
            // data['predictions']
        )
    }

    async onEntry(
        question: string,
        answer: string = 'Continue',
        bbox,
        predicted_labels,
        image = Data.picture
    ) {
        await loadPicture()
        await loadWords() // TODO order significant? YES!

        showMultilabelBBox(image, bbox, predicted_labels, question, answer)
    }
    async onExit() {
        $('#question').empty()
        $('#answer').empty()
    }
}

/**
 * what does this do again? only show picture for displaying other things?
 */
export class PictureBBoxesTask implements Task {
    constructor(state, data) {}

    async onEntry(
        question: string,
        answer: string = 'Continue',
        bboxes,
        active
    ) {
        await loadPicture()

        showPictureBBox(Data.picture, bboxes, active)
    }
    async onExit() {
        $('#question').empty()
        $('#answer').empty()
    }
}
