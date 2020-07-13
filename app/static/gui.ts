import { automaton } from './start'
import { loadFullSizePDF } from './services/pdf'

/**
 * Shows a boolean type question in the sidebar
 * @param question string which is added to question field
 */
export function showBoolean(question: string) {
    $('#question').append(question)
    let yes = $('<button class="btn btn-primary">Yes</button>')
    yes.on('click', (event) => {
        automaton.next('YES', { annotation: 1 })
    })
    $('#answer').append(yes)
    let no = $('<button class="btn btn-primary">No</button>')
    no.on('click', (event) => {
        automaton.next('NO', { annotation: 0 })
    })
    $('#answer').append(no)
}

/**
 * Shows a select type question in the sidebar allowing a single answer
 * @param question string which is added to question field
 * @param options array of select options strings
 */
export function showSelect(question: string, options: string[]) {
    $('#question').append(question) // append question text

    var form = $('<div class="radio"></div>')
    $('#answer').append(form) // append form to answer

    // build radio buttons from options list
    for (let i = 0; i < options.length; i++) {
        const formgroup = $('<div class="radio"></div>')
        form.append(formgroup)

        // label element
        const label = $('<label for="{0}"></label>'.format([ 'form' + i ]))
        // radio input element with running id so it can be accessed later in onClick event handler
        const option = $(
            '<input type="radio" name="radios" value="{0}" id="{1}" >'.format(
                [ options[i], 'form' + i ]
            )
        )

        // append option first and label text second to the label tag
        $(label).append(option)
        $(label).append(options[i])
        $(formgroup).append(label) // append everything to group
    }
    let button = $(
        '<button type="button" class="btn btn-primary"></button'
    ) // next button
    button.append('Next') // append text
    form.append(button)
    // on click for button
    button.on('click', (event) => {
        // get checked radio button and run statemachine NEXT with its value
        for (let i = 0; i < options.length; i++) {
            // console.log($('#form' + i))
            if ((<HTMLInputElement>$('#form' + i)[0]).checked) {
                automaton.next($('#form' + i).val(), {
                    annotation: $('#form' + i).val(),
                    data: [ $('#form' + i).val() ],
                })
                break
            }
        }
    })
}
/**
 * Shows a checkbox type question in the sidebar allowing multiple answers
 * @param question string which is added to question field
 * @param options array of select options strings
 */
export function showCheck(question, options) {
    $('#question').append(question) // append question text

    var form = $('<div class="radio"></div>')
    $('#answer').append(form) // append form to answer

    // build radio buttons from options list
    for (let i = 0; i < options.length; i++) {
        let formgroup = $('<div class="radio"></div>')
        form.append(formgroup)
        // label element
        let label = $('<label for="{0}"></label>'.format([ 'form' + i ]))
        // checkbox input element
        let option = $(
            '<input type="checkbox" name="radios" value="{0}" id="{1}">'.format(
                [ options[i], 'form' + i ]
            )
        )
        // append option first and label text second to the label tag
        $(label).append(option)
        $(label).append(options[i])
        $(formgroup).append(label) // append everything to group
    }
    let button = $(
        '<button type="button" class="btn btn-primary"></button'
    ) // next button
    button.append('Next') // append text
    form.append(button)
    // on click for button
    button.on('click', (event) => {
        let checkedVals = [] // for checkboxes

        // get checked radio button and run statemachine next with its value
        for (let i = 0; i < options.length; i++) {
            if ((<HTMLInputElement>$('#form' + i)[0]).checked) {
                // next($('#form' + i).val());
                // break;
                checkedVals.push($('#form' + i).val()) // for checkboxes
            }
        }
        automaton.next('NEXT', {
            data: checkedVals,
            annotation: JSON.stringify(checkedVals),
        }) // for checkboxes
    })
}

/**
 * Shows a choosepage type question in the sidebar returning a blob 
 * of the current page in a pdf to the state machine
 * @param question string which is added to question field
 */
export function showChoosePage(question) {
    $('#question').append(question)
    let yes = $('<button class="btn btn-primary">Correct Page</button>')
    yes.click((e) => {
        automaton.next(
            'NEXT',
            new Promise((resolve, reject) => {
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
