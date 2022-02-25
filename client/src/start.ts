import { nextState } from './services/automaton'
import '../css/app.css'
import '../css/darkly.css'

// document on ready
$(function () {
    $('#text-input').hide()
    $('#text-input-group').hide()
    $('#word-list').hide()
    $('#pdf-contents').hide()
    $('.context-content').hide()
    $('#pdf-meta').hide()
    // dynamically fullscreen the page (- height and margin of navbar)
    $('#bodyContainer').height(
        'calc(100% - ' + $('#brandContainer').height() + 'px - 1rem)'
    )
    nextState('start', {})
})

export function setupPage() {
    //fieldset?
    $('.contentContainer').height('50%')
    $('.bottomContainer').height('50%')

    $('#color-bar').empty()
    $('.comment-content').empty()
    $('.context-content').empty()
}
