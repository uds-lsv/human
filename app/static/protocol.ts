import { Data } from './data'
import { Service } from './services/service'
import { blobToDataURL } from './utils'

export const protocol = {
    id: 'annotation',
    initial: 'start',
    context: {
        annotation: {},
    },
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
                                Data.data = JSON.parse(
                                    fd.get('data').toString()
                                )
                                Data.annotations['data_id'] = Data.data.id
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
                                                'Has to be one of pdf, jpg, jpeg, png'
                                        )
                                    }
                                })
                            })
                            .catch((e) => {
                                return e
                            })
                    }),

                onDone: {
                    target: '0',
                },
                onError: {
                    target: 'failure',
                    actions: [ 'showError' ],
                },
            },
            meta: {
                type: 'loadingfile',
            },
        },

        0: {
            invoke: {
                id: '0',
                src: (_, event) =>
                    new Promise((resolve, reject) => {
                        const payload = {
                            image: Data.picture,
                            bboxes: event.data.bboxes
                                ? event.data.bboxes
                                : [],
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
                    target: 'show_0',
                    actions: [ 'print' ],
                },
                onError: {
                    target: 'failure',
                    actions: [ 'print', 'showError' ],
                },
            },
        },
        show_0: {
            on: {
                NEXT: {
                    target: '3',
                },
            },
            entry: [ 'showUI', 'showPictureLabeling' ],
            exit: [ 'saveBBoxes' ],
            meta: {
                question:
                    'Draw a bounding box around the paragraph with english animal names.',
                answer: 'Continue',
                type: 'labelPicture',
                column: '0',
            },
        },

        3: {
            invoke: {
                id: '3',
                src: (_, event) =>
                    new Promise((resolve, reject) => {
                        const payload = {
                            image: Data.picture,
                            bboxes: event.data.bboxes
                                ? event.data.bboxes
                                : [],
                            api_call: 'classify_multilabel',
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
                    target: 'show_3',
                    actions: [ 'print' ],
                },
                onError: {
                    target: 'failure',
                    actions: [ 'print', 'showError' ],
                },
            },
        },
        show_3: {
            on: {
                NEXT: {
                    target: 'end',
                },
            },
            entry: [ 'showUI', 'showMultilabelBBox' ],
            exit: [ 'saveBBoxes' ],
            meta: {
                question: 'Transcribe each word.',
                answer: 'Finish',
                type: 'labelBBoxes',
                column: '3',
            },
        },

        failure: {
            invoke: {
                id: 'failure',
                src: (_, event) => () => {
                    console.log(_)
                    console.log(event)
                    alert(event.data)
                    return
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
        },

        nothingleft: {
            invoke: {
                id: 'nothingleft',
                src: (_, event) => () => {
                    alert('No data left to annotate.')
                },
            },
        },

        end: {
            invoke: {
                id: 'sendData',
                src: (_, event) =>
                    Service.post(
                        '/api/write_to_db',
                        'json',
                        JSON.stringify(Data.annotations)
                    )
                        .done((res) => {
                            console.log(res)
                            $('#endToast')
                                .show()
                                .toast({ delay: 5000 })
                                .toast('show')
                        })
                        .fail((err) => {
                            console.log(err.responseJSON)
                        }),
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
