import { Data } from '../data'
import { Service } from './service'
import { blobToDataURL } from '../utils'
import {
    BooleanTask,
    SelectTask,
    CheckmarkTask,
    ChoosePageTask,
    ReadTask,
    LabelTextTask,
    LabelPictureTask,
    LabelBBoxesTask,
    showText,
} from '../tasks'

export async function nextState(trigger, data) {
    // wrap to catch all GUI errors in one place
    try {
        Data.current_task?.onExit()
        console.log(trigger)
        console.log(data)
        const response = await Service.fetchpost(
            '/dsm/transition',
            'json',
            JSON.stringify({
                trigger,
                data,
            })
        )
        console.log(response)
        window['response'] = response
        const contentType = response.headers.get('content-type')
        if (contentType?.indexOf('text/html') !== -1) {
            response.text().then((text) => {
                throw Error(text)
            })
        } else if (contentType?.indexOf('multipart/form-data') !== -1) {
            const fd = await response.formData()
            const state = JSON.parse(<string>fd.get('state'))
            // console.log(state)
            window['state'] = state
            const type = state['type']
            let task: Task
            switch (type) {
                case 'load':
                    Data.reset()
                    Data.data = JSON.parse(<string>fd.get('data'))
                    Data.annotations['data_id'] = Data.data.id
                    showText()
                    nextState('next', {})
                    break
                case 'loadfile':
                    // fd.forEach((val, key) => {
                    //     // if type file
                    //     if (key == 'file') {
                    //         const file = val as File
                    //         file.arrayBuffer().then(async (buffer) => {
                    //             const blob = new Blob([buffer], {
                    //                 type: 'octet/stream',
                    //             })
                    //             const url = await blobToDataURL(blob)
                    //             if (file.name.endsWith('.pdf')) {
                    //                 Data.pdf = url
                    //             } else if (
                    //                 file.name.endsWith('.jpg') ||
                    //                 file.name.endsWith('.jpeg') ||
                    //                 file.name.endsWith('.png')
                    //             ) {
                    //                 Data.picture = url
                    //             } else {
                    //                 throw Error(
                    //                     'Wrong file ending: ' +
                    //                         file.name +
                    //                         'Has to be one of pdf, jpg, jpeg, png'
                    //                 )
                    //             }
                    //         })
                    //     } else {
                    //         Data[key] = JSON.parse(val.toString())
                    //     }
                    // })
                    break
                case 'read':
                    task = new ReadTask()
                    ;(<ReadTask>task).onEntry(
                        // TODO do this for ever task
                        state['question'],
                        state['answer']
                    )
                    break

                case 'boolean':
                    task = new BooleanTask()
                    task.onEntry(state['question'])
                    break
                case 'select':
                    task = new SelectTask()
                    task.onEntry(
                        state['question'],
                        state['answer'],
                        state['options']
                    )
                    break
                case 'checkmark':
                    task = new CheckmarkTask()
                    task.onEntry(
                        state['question'],
                        state['answer'],
                        state['options']
                    )
                    break
                case 'label': //TODO rename labeltext
                    task = new LabelTextTask()
                    let options
                    if (state['options']) {
                        options = state['options']
                    } else {
                        console.log(data)
                        options = JSON.parse(data['annotation'])
                    }
                    task.onEntry(state['question'], state['answer'], options)
                    break
                case 'choosePage':
                    task = new ChoosePageTask()
                    task.onEntry(state['question'], state['answer'])
                    break

                case 'labelPicture':
                    console.log('labeling')
                    // loadPicture()
                    task = new LabelPictureTask()
                    task.onEntry(state['question'], state['answer'])

                    break
                case 'labelBBoxes':
                    // loadWords()
                    task = new LabelBBoxesTask()
                    task.onEntry(state['question'], state['answer'])
                    break
                default:
                    throw Error('Unknown Annotation type: ' + type)
            }
            Data.current_task = task

            // triggerState(Data['type'])
        } else {
            throw Error('Unsupported content type')
        }
    } catch (error) {
        console.error(error)
        alert(error.message)
    }
}

export interface Task {
    onEntry: (...args: any[]) => Promise<any>
    onExit: () => Promise<any>
}
