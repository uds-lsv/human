import { Data } from './data'
import { Service } from './services/service'
import { blobToDataURL } from './utils'

export const pictureProtocol = {
    id: 'annotation',
    initial: 'start',
    context: {
        statesHistory: [],
    },
    // strict: true,
    states: {
        start: {
            invoke: {
                id: 'start',
                src: (_, event) =>
                    new Promise((resolve, reject) => {
                        Data.reset()
                        Service.fetch('/api/getdatafile')
                            .then(async (response) => {
                                const contentType = response.headers.get(
                                    'content-type'
                                )
                                if (
                                    contentType &&
                                    contentType.indexOf('text/html') !== -1
                                ) {
                                    response.text().then((text) => {
                                        reject(text)
                                    })
                                } else if (
                                    contentType &&
                                    contentType.indexOf(
                                        'multipart/form-data'
                                    ) !== -1
                                ) {
                                    return response.formData()
                                }
                            })
                            .then((fd) => {
                                const file = fd.get('file') as File
                                Data.data = fd.get('data')
                                file.arrayBuffer().then(async (buffer) => {
                                    const blob = new Blob([ buffer ], {
                                        type: 'octet/stream',
                                    })
                                    const url = await blobToDataURL(blob)
                                    if (file.name.endsWith('.pdf')) {
                                        Data.pdf = url
                                        resolve({ bboxes: [] })
                                    } else if (
                                        file.name.endsWith('.jpg') ||
                                        file.name.endsWith('.jpeg') ||
                                        file.name.endsWith('.png')
                                    ) {
                                        Data.picture = url
                                        resolve({ bboxes: [] })
                                    } else {
                                        throw Error(
                                            'Wrong file ending: ' +
                                                file.name +
                                                '\nHas to be one of pdf, jpg, jpeg, png'
                                        )
                                    }
                                })
                            })
                            .catch((e) => {
                                return e
                            })
                    }),
                onDone: {
                    target: '1',
                    actions: [ 'print', 'savehistory' ],
                },
                onError: {
                    target: 'failure',
                    actions: [ 'print' ],
                },
            },
            meta: {
                type: 'loadingfile',
            },
        },
        '1': {
            on: {
                NEXT: {
                    target: 'showPicChoose',
                },
            },
            entry: [ 'print', 'showUI', 'choosePage' ],
            exit: [ 'savehistory' ],
            meta: {
                question: 'Choose correct page.',
                type: 'choosePage',
            },
        },
        showPicChoose: {
            invoke: {
                id: 'showPicChoose',
                src: (_, event) =>
                    new Promise((resolve, reject) => {
                        event.data.then((blob: Blob) => {
                            blobToDataURL(blob)
                                .then((src: string) => {
                                    Data.picture = src
                                    return event.data
                                })
                                .then((data) => {
                                    resolve(data)
                                })
                        })
                    }),
                onDone: {
                    target: 'getParagraphs',
                    actions: [ 'print' ],
                },
                onError: {
                    target: 'failure',
                    actions: [ 'print', 'showError' ],
                },
            },
        },
        getParagraphs: {
            invoke: {
                id: 'paragraphs',
                src: (_, event) =>
                    new Promise((resolve, reject) => {
                        const image = Data.picture
                        const bboxes = event.data.bboxes
                            ? event.data.bboxes
                            : []
                        const payload = {
                            image,
                            bboxes,
                            api_call: 'paragraph_segmentation',
                        }
                        Service.post(
                            '/api/callAPI',
                            'json',
                            JSON.stringify(payload)
                        ).then((res) => {
                            Data.picture = res['image']
                            resolve(res)
                        })
                    }),
                onDone: {
                    target: '2',
                    actions: [ 'print' ],
                },
                onError: {
                    target: 'failure',
                    actions: [ 'print', 'showError' ],
                },
            },
        },
        '2': {
            on: {
                NEXT: { target: 'getLines' },
                actions: [],
            },
            entry: [ 'showUI', 'showPictureLabeling' ],
            exit: [ 'saveBBoxes' ],
            meta: {
                question: 'Correct paragraph box.',
                answer: 'Correct boxes',
                type: 'labelPicture',
                column: 'paragraph',
            },
        },
        getLines: {
            invoke: {
                id: 'lines',
                src: (_, event) => {
                    const payload = {
                        image: Data.picture,
                        bboxes: event.data.bboxes ? event.data.bboxes : [],
                        api_call: 'line_segmentation',
                    }
                    return Service.post(
                        '/api/callAPI',
                        'json',
                        JSON.stringify(payload)
                    ).then((res) => {
                        Data.picture = res['image']
                        return res
                    })
                },
                onDone: {
                    target: '3',
                    actions: [ 'print' ],
                },
                onError: {
                    target: 'failure',
                    actions: [ 'showError' ],
                },
            },
        },
        '3': {
            on: {
                NEXT: { target: 'getWordBoxes' },
            },
            entry: [ 'showUI', 'showPictureLabeling' ],
            exit: [ 'saveBBoxes' ],

            meta: {
                question: 'Correct line boxes.',
                answer: 'Correct boxes',
                type: 'labelPicture',
                column: 'lines',
            },
        },
        getWordBoxes: {
            invoke: {
                id: 'words',
                src: (_, event) => {
                    const payload = {
                        image: Data.picture,
                        bboxes: event.data.bboxes ? event.data.bboxes : [],
                        api_call: 'word_segmentation',
                    }
                    return Service.post(
                        '/api/callAPI',
                        'json',
                        JSON.stringify(payload)
                    ).then((res) => {
                        Data.picture = res['image']
                        return res
                    })
                },
                onDone: {
                    target: '4',
                    actions: [ 'print' ],
                },
                onError: {
                    target: 'failure',
                    actions: [ 'showError' ],
                },
            },
        },
        '4': {
            on: {
                NEXT: { target: 'getWords' },
            },
            entry: [ 'showUI', 'showPictureLabeling' ],
            exit: [ 'saveBBoxes' ],
            meta: {
                question: 'Correct word boxes.',
                answer: 'Correct boxes',
                type: 'labelPicture',
                column: 'wordboxes',
            },
        },
        getWords: {
            invoke: {
                id: 'words',
                src: (_, event) => {
                    const payload = {
                        image: Data.picture,
                        bboxes: event.data.bboxes ? event.data.bboxes : [],
                        api_call: 'classify_words',
                    }
                    return Service.post(
                        '/api/callAPI',
                        'json',
                        JSON.stringify(payload)
                    ).then((res) => {
                        Data.picture = res['image']
                        return res
                    })
                },
                onDone: {
                    target: '5',
                    actions: [ 'print' ],
                },
                onError: {
                    target: 'failure',
                    actions: [ 'showError' ],
                },
            },
        },
        '5': {
            on: {
                NEXT: { target: 'start' },
            },
            entry: [ 'showUI', 'showBBoxLabeling' ],
            exit: [ 'saveBBoxes' ],

            meta: {
                question: 'Correct word labels .',
                answer: 'Finish',
                type: 'labelBBoxes',
                column: 'words',
            },
        },
        end: {},

        // UTIL
        failure: {
            invoke: {
                id: 'failure',
                src: (_, event) => () => {
                    console.log(_)
                    console.log(event)
                    alert(event.data)
                },
                onDone: {
                    target: 'start',
                    actions: [ 'print' ],
                },
                onError: {
                    target: 'failure',
                    actions: [ 'print' ],
                },
            },
            meta: {
                type: 'loading',
            },
        },
    },
}
