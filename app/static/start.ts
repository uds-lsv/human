import { Automaton } from './automaton'
import { SETTINGS } from './settings'

String.prototype.format = function(args) {
    var str = this
    let regex = new RegExp('{-?[0-9]+}', 'g')
    return str.replace(regex, function(item) {
        var intVal = parseInt(item.substring(1, item.length - 1))
        var replace
        if (intVal >= 0) {
            replace = args[intVal]
        } else if (intVal === -1) {
            replace = '{'
        } else if (intVal === -2) {
            replace = '}'
        } else {
            replace = ''
        }
        return replace
    })
}

$(document).ready(function() {
    $('#text-input').hide()
    $('#word-list').hide()
    $('#pdf-contents').hide()
    $('.context-content').hide()
    $('#pdf-meta').hide()
    // dynamically fullscreen the page (- height and margin of navbar)
    $('#bodyContainer').height(
        'calc(100% - ' + $('.navbar').outerHeight() + 'px)'
    )
    automaton = new Automaton()
    automaton.initAutomaton(automaton.annotationProtocolParsed)
    // automaton.initAutomaton(automaton.annotationProtocolExample1)
    // automaton.initAutomaton(automaton.annotationProtocolExample2)
})

export function setupPage() {
    //fieldset?
    $('.contentContainer').height('50%')
    $('.bottomContainer').height('50%')

    $('#color-bar').empty()
    $('.comment-content').empty()
    $('.context-content').empty()
}

// export var automaton;
export var automaton
