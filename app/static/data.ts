class DefaultDict {
    constructor(defaultInit) {
        return new Proxy(
            {},
            {
                get: (target, name) =>
                    name in target
                        ? target[name]
                        : (target[name] =
                              typeof defaultInit === 'function'
                                  ? new defaultInit().valueOf()
                                  : defaultInit),
            }
        )
    }
}

export let Data = {
    data: undefined,
    text: '',
    context: '',
    picture: undefined,
    pdf: undefined,
    markers: [],
    annotations: new DefaultDict(Array),
    predicted_words: [],
    bboxes: [],
    konvabboxes: [],
    scales: { x: 1, y: 1 },
    reset: () => {
        Data.data = undefined
        Data.text = ''
        Data.context = ''
        Data.picture = undefined
        Data.pdf = undefined
        Data.markers = []
        Data.annotations = new DefaultDict(Array)
        Data.predicted_words = []
        Data.bboxes = []
        Data.konvabboxes = []
        Data.scales = { x: 1, y: 1 }
    },
}
window['data'] = Data
