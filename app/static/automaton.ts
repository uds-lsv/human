declare var XState: any

import {
    loadPDF,
    loadPicture,
    loadWords,
    showChooseWords,
    showAnnotatePicture,
} from './pictureLabeling'
import { showLabeling, showRead } from './textLabeling'
import { showBoolean, showCheck, showChoosePage, showSelect } from './gui'
import { setupPage } from './start'
import { Data } from './data'

import { Service } from './services/service'
import { protocol } from './protocol'
import { textProtocol } from './example_protocol2'
import { pictureProtocol } from './example_protocol1'
import { showPDF } from './services/pdf'
const { Machine, interpret, assign, State } = XState // global variable: window.XState

export class Automaton {
    CURRENTSTATE: any
    currentannotation
    machine: any

    constructor() {}

    /**
     * @param target target of transition
     * @param data (optional) data object which is sent to next state as an event
     */
    next(target: string, data?: any) {
        console.log(target)
        let choice = { type: target, data }
        this.CURRENTSTATE.send(choice)
    }

    initAutomaton(annotationProtocol, start?) {
        this.CURRENTSTATE = interpret(annotationProtocol)
            .onTransition((state) => {
                console.log('currentstate', state.value, state)
            })
            .start(start)
        window['CURRENTSTATE'] = this.CURRENTSTATE
        window['service'] = Service
    }

    actions = {
        resetData: () => {
            Data.reset()
        },
        setupPage: (_, event, meta) => {
            setupPage()
        },
        saveBboxes: (_, event, actionMeta) => {
            // since actions onexit are called being in the next state already
            // we then have to get the meta from the previous state for the column
            let state = actionMeta.state.history
            let meta = state.meta['annotation.' + state.value]
            let column = meta.column

            Data.annotations[column] = event.data
            Data.bboxes = event.data.bboxes
        },
        choosePage: (_, event, actionMeta) => {
            console.log('choosepage')

            setTimeout(() => {
                loadPDF().then(() => {
                    showPDF(Data.pdf)
                })
            }, 500) // timeout until pdf worker is fully loaded
        },
        chooseWords: (_, event, actionMeta) => {
            let meta =
                actionMeta.state.meta[
                    'annotation.' + actionMeta.state.value
                ]
            showChooseWords(
                Data.picture,
                event.data.bboxes,
                event.data.predicted_words,
                meta.question,
                meta.answer
            )
        },
        showPictureLabeling: async (_, event, actionMeta) => {
            await loadPicture()
            let meta =
                actionMeta.state.meta[
                    'annotation.' + actionMeta.state.value
                ]
            showAnnotatePicture(
                Data.picture,
                event.data.bboxes,
                meta.question,
                meta.answer
            )
        },

        save: (_, event, actionMeta) => {
            let state = actionMeta.state.history
            let meta = state.meta['annotation.' + state.value]
            let column = meta.column

            // console.log('-------------')
            // console.log(Data.annotations)
            // console.log(typeof event.data.annotation)
            // console.log(typeof Data.annotations[column])
            // console.log(Array.isArray(Data.annotations[column]))
            // console.log('-------------')
            if (Array.isArray(Data.annotations[column])) {
                Data.annotations[column].push(event.data.annotation)
            }
        },

        // currently unused!
        saveDB: () => {
            Service.post(
                '/api/write_to_db',
                'json',
                JSON.stringify(Data.annotations)
            ).done((res) => {
                console.log(res)
            })
        },
        showUI: (_, event, actionMeta) => {
            let meta =
                actionMeta.state.meta[
                    'annotation.' + actionMeta.state.value
                ]

            $('#question').empty()
            $('#answer').empty()
            if (!meta) {
                return
            }
            switch (meta.type) {
                case 'boolean':
                    showBoolean(meta.question)
                    break
                case 'select':
                    console.log('select')
                    showSelect(meta.question, actionMeta.state.nextEvents)
                    break
                case 'checkmark':
                    showCheck(meta.question, meta.options)
                    break
                case 'label':
                    console.log('label')
                    showLabeling(meta, event.data.data)
                    break
                case 'labelPicture':
                    console.log('labeling')
                    // loadPicture()
                    break
                case 'labelWords':
                    loadWords()
                    break
                case 'choosePage':
                    if (Data.data === 'No available data') {
                        this.next('NOTHINGLEFT')
                    } else {
                        showChoosePage(meta.question)
                    }
                    break
                case 'read':
                    if (Data.data === 'No available data') {
                        this.next('NOTHINGLEFT')
                    } else {
                        showRead(Data.data, meta.question)
                    }
                    break
                default:
                    break
            }
        },
    }
    annotationProtocolParsed = Machine(protocol, {
        actions: this.actions,
    })
    annotationProtocolExample1 = Machine(pictureProtocol, {
        actions: this.actions,
    })
    annotationProtocolExample2 = Machine(textProtocol, {
        actions: this.actions,
    })
}
