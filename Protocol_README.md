
Loading
--------------------------------------------------

'start': {
    type: 'loading',
    transitions: [["onDone", '0']]
}

=>

start: {
    invoke: {
        id: 'getData',
        src: (_, event) =>
            Service.get('/api/getdata').then((res) => {
                Data.reset()
                Data.data = res
                Data.annotations['id'] = Data.data.id
                console.log(res)
            }),
        onDone: {
            target: '0',
            actions: [ 'print', 'setupPage' ],
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

Loading (file)
--------------------------------------------------

'start': {
    type: 'loadingfile'
    nextState: '0'
}

=>

start: {
    invoke: {
        id: 'start',
        src: (_, event) =>
            new Promise((resolve, reject) => {
                Data.reset()
                fetch('http://127.0.0.1:5000/api/getdatafile')
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
                                resolve()
                            } else if (
                                file.name.endsWith('.jpg') ||
                                file.name.endsWith('.jpeg') ||
                                file.name.endsWith('.png')
                            ) {
                                Data.picture = url
                                resolve()
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

--------------------------------------------------


Display text (read)
--------------------------------------------------

'0': {
    type: 'read'
    question: 'Read the content and its context below.'
    transitions: [(NEXT, 'n_1')]
}


'0': {
    on: {
        NEXT: '1',
        NOTHINGLEFT: 'nothingleft',
    },
    entry: [ 'showUI' ],
    meta: {
        type: 'read',
        question:
            'Read the content and its context below.',
    },
},

--------------------------------------------------


Select
--------------------------------------------------

'n_1': {
    type: select
    question: 'Is this an article or a comment?.',
    options: [ 'article', 'comment' ],
    transitions: [('article', 'n_2'), ('comment', 'c_usmod')],
    column: null
}

=>

'n_1':{
    on: {
        article: {
            target: 'n_2',
        },
        comment: {
            target: 'c_usmod',
        },
    },
    entry: [ 'showUI' ],
    meta: {
        type: 'select',
        question: 'Is this an article or a comment?.',
        options: [ 'article', 'comment' ],
    },
},


--------------------------------------------------


Boolean
--------------------------------------------------

'n_4_more' : {
    type: 'boolean',
    question: 'Are there any more agents?'
    transitions: [('YES', 'n_4'), ('NO', 'end')]
}

=>

n_4_more: {
    on: {
        YES: {
            target: 'n_4',
        },
        NO: {
            target: 'end',
        },
    },
    entry: [ 'showUI' ],
    meta: {
        type: 'boolean',
        question: 'Are there any more agents?',
    },
},

--------------------------------------------------


Checkmark
--------------------------------------------------

c_ne_4: {
    type: 'checkmark',
    question: 'The nature of/reason for the negative evaluation is...',
    options: [
        'passivity, e.g. lack of courage, lack of measures, inefficiency',
        'conspiracy/hypocrisy/dishonesty/manipulation of opinion',
        'ignorance, naivety, indifference',
        'specific illegal, criminal behavior, including violence',
    ],
    transitions: [('NEXT', c_ne_4_mark)]
}

=>

c_ne_4: {
    on: {
        NEXT: {
            target: 'c_ne_4_mark',
        },
    },

    entry: [ 'showUI' ],
    meta: {
        type: 'checkmark',
        question:
            'The nature of/reason for the negative evaluation is...',
        options: [
            'passivity, e.g. lack of courage, lack of measures, inefficiency',
            'conspiracy/hypocrisy/dishonesty/manipulation of opinion',
            'ignorance, naivety, indifference',
            'specific illegal, criminal behavior, including violence',
        ],
    },
},


--------------------------------------------------


Labeling
--------------------------------------------------
shows labeling options depending on selected meta options from the state before (either select or checkmark)

c_ne_4_mark: {
    question: 'Please mark the nature/reason for the negative evaluation.',
    type: 'labeling',
},

=>

c_ne_4_mark: {
    on: {
        NEXT: {
            target: 'c_ne_5',
        },
    },
    entry: [ 'showUI' ],
    meta: {
        question:
            'Please mark the nature/reason for the negative evaluation.',
        type: 'labeling',
    },
},



ChoosePage
--------------------------------------------------

'1': {
    transitions: [('onDone','getParagraphs')],
    question: 'Choose correct page.',
    type: 'choosePage',
},

=>

'1': {
    on: {
        NEXT: {
            target: 'showPicChoose',
        },
    },
    entry: [ 'print', 'showUI', 'choosePage' ],
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
                            return src
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

labelPicture
--------------------------------------------------
#TODO: Create default api_call without active learning
'2': {
    transitions: [('NEXT','3', ['save'])],
    api_call: 'paragraph_segmentation'
    question: 'Correct the bboxes.',
    type: 'bbox',
},

=>

getParagraphs: {
    invoke: {
        id: 'paragraphs',
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
        // NO: 'start'
        actions: [],
    },
    entry: [ 'showUI', 'showPictureLabeling' ],
    exit: [ 'saveBboxes' ],
    meta: {
        question: 'Correct the bboxes.',
        answer: 'Correct boxes',
        type: 'labelPicture',
        column: 'paragraph',
    },
},


labelWords (for pictures)
--------------------------------------------------
'5': {
    column: words,
    type: labelWords,
    question: 'Correct word labels .',
    api_call: classify_words
    transitions: [('NEXT', 'start', ['save'])]
}

=>
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
    entry: [ 'showUI', 'chooseWords' ],
    exit: [ 'saveBboxes' ],

    meta: {
        question: 'Correct word labels .',
        type: 'labelWords',
        column: 'words',
    },
},


#TODO: End state, add error handling

options:
----------------------------------------------------------------------------------------------------
----------------------------------------------------------------------------------------------------

column?: <name>
maybe put a saveAll option in meta and separate options for all transitions like ('article', 'n_2', ['save']) 

{
    column: <name>
    saveAll: true,
    transitions: [('article', 'n_2'), ('comment', 'c_usmod')]
}

===

{
    column: <name>
    transitions: [('article', 'n_2', ['save']), ('comment', 'c_usmod', ['save'])]
}

=>

...
    on: {
        article: {
            target: 'n_2',
            actions: 'save'
        },
        comment: {
            target: 'c_usmod',
            actions: 'save'
        },
    },
    meta: {
        column: <name>
        ...
    }
...

--------------------------------------------------

nextState?: <state>
for all transitions from this node this is the target:

{
    nextState: 1
    transitions: [('NEXT'), ('NEXT2')]
}

=>

...
    on: {
        'NEXT': {
            target: 1
        },
                'NEXT2': {
            target: 1
        }
    }
...

--------------------------------------------------

transitions: [<answer>, <target>, [<actions>]]

--------------------------------------------------

Defaultstates:

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

#TODO: fill this

nothingleft: {

}

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
                })
                .fail((err) => {
                    console.log(err.responseJSON)
                    throw Error('Write to db failed.')
                }),
        onDone: {
            target: 'start',
        },
        onError: {
            target: 'failure',
        },
    },
    meta: {
        type: 'loading',
    },
}