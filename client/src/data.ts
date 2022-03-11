import { Task } from './services/automaton'

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

export class Data {
    static data = undefined
    static state = undefined
    static text: string = ''
    static content: string = ''
    static context: string = ''
    static picture = undefined
    static pdf = undefined
    static markers = []
    static annotations = new DefaultDict(Array)
    static current_column: string = ''
    static predicted_labels: string[][]
    static guiBBoxes: any
    static scales: { x: number; y: number } = { x: 0, y: 0 }
    static active: number = -1
    static timestamp: number = 0
    static current_task: Task = undefined
    static reset() {
        Data.data = undefined
        Data.state = undefined
        Data.text = ''
        Data.context = ''
        Data.picture = undefined
        Data.pdf = undefined
        Data.markers = []
        Data.annotations = new DefaultDict(Array)
        Data.current_column = ''
        Data.predicted_labels = []
        Data.guiBBoxes = []
        Data.scales = { x: 1, y: 1 }
        Data.timestamp = 0
        Data.current_task = undefined
    }
}

window['data'] = Data
