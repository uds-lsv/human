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
    MultilabelBBoxTask,
} from '../tasks'
import { PictureBBoxesTask, PicturePolygonTask } from '../imageTasks'

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
            const errorMsg = await response.text()
            $('#bodyContainer').html(errorMsg)
            // throw Error(errorMsg)
        } else if (contentType?.indexOf('multipart/form-data') !== -1) {
            const fd = await response.formData()
            const state = JSON.parse(<string>fd.get('state'))
            const data = JSON.parse(<string>fd.get('data'))
            console.log(state)
            console.log(data)
            window['state'] = state
            const type = state['type']
            let task: Task
            switch (type) {
                case 'loadText':
                    Data.reset()
                    Data.data = data
                    Data.annotations['data_id'] = Data.data.id
                    await showText()
                    await nextState('next', {})
                    return
                case 'loadPdf':
                case 'loadImage':
                    for (const keyval of fd.entries()) {
                        const key = keyval[0]
                        const val = keyval[1]

                        // if type file
                        if (key == 'file') {
                            const file = val as File
                            const buffer = await file.arrayBuffer()
                            const blob = new Blob([buffer], {
                                type: 'octet/stream',
                            })
                            const url = await blobToDataURL(blob)
                            if (file.name.endsWith('.pdf')) {
                                Data.pdf = url
                            } else if (
                                file.name.endsWith('.jpg') ||
                                file.name.endsWith('.jpeg') ||
                                file.name.endsWith('.png')
                            ) {
                                Data.picture = url
                            } else {
                                throw Error(
                                    'Wrong file ending: ' +
                                        file.name +
                                        'Has to be one of pdf, jpg, jpeg, png'
                                )
                            }
                        } else {
                            Data[key] = JSON.parse(val.toString())
                        }
                    }
                    nextState('next', {})
                    return
                case 'read':
                    task = new ReadTask(state, data)
                    break
                case 'boolean':
                    task = new BooleanTask(state, data)
                    break
                case 'select':
                    task = new SelectTask(state, data)
                    break
                case 'checkmark':
                    task = new CheckmarkTask(state, data)
                    break
                case 'labelText':
                    task = new LabelTextTask(state, data)
                    break
                case 'choosePage':
                    task = new ChoosePageTask(state, data)
                    break
                case 'labelPicture':
                    // loadPicture()
                    task = new LabelPictureTask(state, data)
                    break
                case 'labelBBoxes':
                    // loadWords()
                    task = new LabelBBoxesTask(state, data)
                    break
                case 'multilabelBBoxes':
                    // loadWords()
                    task = new MultilabelBBoxTask(state, data)
                    break
                case 'polygonPicture':
                    task = new PicturePolygonTask(state, data)
                    break
                case 'boundingBoxPicture':
                    task = new PictureBBoxesTask(state, data)
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
